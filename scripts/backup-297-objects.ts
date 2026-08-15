/**
 * scripts/backup-297-objects.ts — PP6c step 6c-b. THE COLD BACKUP.
 *
 * Exports the 297 legacy template objects out of the private `resources` bucket
 * onto disk, and PROVES the result is a byte-for-byte copy of what production
 * holds — before migration `0030` deletes them.
 *
 *   pnpm exec tsx scripts/backup-297-objects.ts --dry-run   # plan + assertions only
 *   pnpm exec tsx scripts/backup-297-objects.ts             # download + verify
 *
 * WHY THIS SCRIPT IS A HARD GATE AND NOT A CHORE (D-PP-k)
 * ------------------------------------------------------
 * Every other destructive step in this project has been reversible, because a
 * migration ships a `.down.sql` and rows come back. Storage objects do not. When
 * `0030` removes these 297 files there is no statement, flag or backup inside
 * Supabase that returns them. This directory is the only copy. Nothing
 * destructive in PP6c runs until this script exits 0.
 *
 * WHY IT READS FROM TEST TO BACK UP PRODUCTION
 * --------------------------------------------
 * The objects that must survive are PRODUCTION's, and exporting them looked to
 * require production Storage credentials that nobody wanted to hand out.
 * Established read-only across both projects at the 6c-a kickoff, 2026-08-16:
 *
 *     TEST's 297 legacy objects are byte-identical to PROD's 297.
 *     Same names, same eTags, same sizes.
 *
 *       select md5(string_agg(
 *                name ||'|'|| replace(metadata->>'eTag','"','') ||'|'|| (metadata->>'size'),
 *                E'\n' order by name))
 *       from storage.objects where bucket_id = 'resources';
 *
 *         PROD                      -> 6fde792718130d12071b69459f9d70ab
 *         TEST (excluding the new)  -> 6fde792718130d12071b69459f9d70ab
 *       at 297 objects / 5,320,962 bytes.
 *
 * ⚠️ `replace(...,'"','')` IS LOAD-BEARING, and the first run of this script is
 * what found that out. Storage stores the eTag QUOTED — `"57962cf1…"` — so a
 * query that fingerprints `metadata->>'eTag'` directly yields a different digest
 * (27e3e6efccf33eebedf60ad0aa45c2cc) from one computed over real files, which
 * hash to bare hex. Both are correct fingerprints of the same 297 objects; only
 * the canonical form above is reproducible from bytes on disk, which is the
 * whole point of a backup you can verify. The assertions localised this
 * immediately: 1–3 passed, so the DATA was never in doubt, only the formula.
 *
 * So the export happens against TEST, and the four assertions below are what
 * turn "we copied some files" into "this is provably production's bytes". The
 * fingerprint is computed from the MD5 of the bytes ACTUALLY WRITTEN TO DISK,
 * never from the metadata the server reported — otherwise a truncated download
 * would sail through while the manifest looked perfect.
 *
 * THE FOUR ASSERTIONS, all of which must pass:
 *   1. every downloaded file's MD5 equals the eTag Storage holds for it
 *      (eTags here are single-part, so the eTag IS the MD5 of the bytes —
 *      verified 0 multipart objects at the kickoff);
 *   2. exactly EXPECTED_COUNT objects were exported;
 *   3. the total is exactly EXPECTED_BYTES;
 *   4. the aggregate fingerprint recomputed from disk equals EXPECTED_FINGERPRINT,
 *      production's own value.
 *
 * Assertion 4 subsumes 1–3, but they are kept separate because a failure should
 * say WHICH property broke. A single mismatched fingerprint with no other
 * signal is the least actionable possible error on the one step that cannot be
 * retried after the fact.
 *
 * WHICH OBJECTS ARE "THE 297"
 * ---------------------------
 * Derived, not hardcoded: every object whose top-level folder is NOT one of the
 * 22 new focus-area slugs in `docs/content-v2-spec.json`. The legacy files sit
 * under the old element codes (`a1/` … `k3/`, 33 folders, flat); the new content
 * sits under its focus-area slug. The rule does not need to be clever, because
 * the assertions are pinned to production's measured values — a wrong rule
 * changes the count, the bytes and the fingerprint, and all three would fail.
 *
 * SAFETY. TEST only: the target host is asserted against the known TEST project
 * ref before a single request. Credentials are read out of `.env.local` and are
 * never passed on a command line or printed. This script only ever READS from
 * Storage — it has no delete, no upload and no database write.
 *
 * IDEMPOTENT. A file already on disk with the right MD5 is left alone, so an
 * interrupted run is simply repeated. The manifest is rewritten every time.
 */

import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const SPEC = path.join(ROOT, "docs/content-v2-spec.json");
/* Inside docs/source-assets/, which .gitignore already excludes wholesale — the
   bytes stay out of git. The manifest beside it is committed. */
const ARCHIVE = path.join(ROOT, "docs/source-assets/_archive-297-templates");
/* Summary only, committed. The per-object rows go beside the bytes instead —
   this repository is public; see the note above the write. */
const MANIFEST = path.join(ROOT, "docs/archive-297-manifest.json");
const FULL_MANIFEST_NAME = "_manifest-full.json";

const TEST_REF = "sdszcralogcrujtyghig";
const BUCKET = "resources";

/* Production's measured values, read-only, 2026-08-16 (PP6c step 6c-a).
   Re-checkable at any time with the query in the header comment. */
const EXPECTED_COUNT = 297;
const EXPECTED_BYTES = 5_320_962;
/* Canonical form: bare-hex eTags, so a downloaded file can reproduce it. See
   the ⚠️ note in the header — the quoted-eTag variant is a different digest. */
const EXPECTED_FINGERPRINT = "6fde792718130d12071b69459f9d70ab";

const DRY_RUN = process.argv.includes("--dry-run");

interface StorageEntry {
  name: string;
  size: number;
  etag: string;
}

interface ManifestRow {
  name: string;
  md5: string;
  size: number;
}

function fail(message: string): never {
  throw new Error(message);
}

/** The eTag Storage reports is a quoted MD5 hex string. Normalise, and refuse
 *  anything that is not a plain 32-hex digest — a multipart eTag (`<md5>-<n>`)
 *  is NOT the MD5 of the bytes, so silently comparing against one would make
 *  assertion 1 meaningless exactly when it matters most. */
function normaliseEtag(raw: string | undefined, name: string): string {
  const etag = (raw ?? "").replace(/^"|"$/g, "").trim().toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(etag)) {
    fail(
      `object "${name}" has eTag ${JSON.stringify(raw)}, which is not a plain MD5 digest. ` +
        `A multipart eTag cannot be compared against the file's MD5; back this object up by hand ` +
        `and re-check the assertions before trusting this run.`,
    );
  }
  return etag;
}

function md5(bytes: Buffer): string {
  return createHash("md5").update(bytes).digest("hex");
}

async function connect(): Promise<SupabaseClient> {
  process.loadEnvFile(path.join(ROOT, ".env.local"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const email = process.env.TEST_PARTNER_EMAIL;
  const password = process.env.TEST_PARTNER_PASSWORD;
  if (!url || !key) fail("Missing NEXT_PUBLIC_SUPABASE_URL / _PUBLISHABLE_KEY in .env.local");
  if (!email || !password) fail("Missing TEST_PARTNER_EMAIL / TEST_PARTNER_PASSWORD in .env.local");

  /* Exact host match over https, not a substring test — the same guard the
     loader carries, and the reason the .env.local incident of 2026-08-16 was
     never a production write. */
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== `${TEST_REF}.supabase.co`) {
    fail(
      `Refusing to run against "${parsed.host}". This script targets the TEST project only ` +
        `(https://${TEST_REF}.supabase.co). TEST's 297 legacy objects are byte-identical to ` +
        `production's, which is exactly why the backup is taken here.`,
    );
  }
  console.log(`target: ${parsed.host} (TEST)`);

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) fail(`sign-in failed: ${error.message}`);

  /* The bucket's SELECT policies are `is_admin()` OR `is_approved() AND
     is_published_object(name)`. Only the admin arm can see every object
     regardless of publication state, and a backup that silently skipped a
     drafted file would be worse than no backup. */
  const { data: isAdmin, error: adminErr } = await db.rpc("is_admin");
  if (adminErr) throw adminErr;
  if (isAdmin !== true) {
    fail(
      "The signed-in account is not an admin on this project. Only the admin storage policy " +
        "sees every object; a non-admin session would silently omit anything unpublished. " +
        "If the account was removed from `admins` for a partner-path test, put it back first.",
    );
  }
  return db;
}

/** Storage `list()` is non-recursive and pages at 100. The legacy layout is
 *  exactly one level deep (verified at the kickoff: 0 objects nested deeper),
 *  but this walks properly anyway rather than trusting that — a missed folder
 *  would be a silently incomplete backup, which is the failure mode this whole
 *  step exists to prevent. */
async function listAll(db: SupabaseClient, prefix = ""): Promise<StorageEntry[]> {
  const out: StorageEntry[] = [];
  const PAGE = 100;
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await db.storage
      .from(BUCKET)
      .list(prefix, { limit: PAGE, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`list "${prefix || "/"}": ${error.message}`);
    const page = data ?? [];
    for (const entry of page) {
      const full = prefix ? `${prefix}/${entry.name}` : entry.name;
      /* A folder is reported with no id and no metadata. */
      if (!entry.id) {
        out.push(...(await listAll(db, full)));
        continue;
      }
      const meta = entry.metadata as { size?: number; eTag?: string } | null;
      out.push({
        name: full,
        size: Number(meta?.size ?? NaN),
        etag: normaliseEtag(meta?.eTag, full),
      });
    }
    if (page.length < PAGE) break;
  }
  return out;
}

async function main(): Promise<void> {
  console.log(`PP6c 6c-b — cold backup of the legacy template objects — ${DRY_RUN ? "DRY RUN" : "LIVE"}\n`);

  const spec = JSON.parse(await fs.readFile(SPEC, "utf8")) as {
    focusAreas: { slug: string }[];
  };
  const newSlugs = new Set(spec.focusAreas.map((fa) => fa.slug));
  if (newSlugs.size !== 22) fail(`spec should carry 22 focus-area slugs, found ${newSlugs.size}`);

  const db = await connect();
  const all = await listAll(db);
  console.log(`bucket holds ${all.length} object(s)`);

  const legacy = all.filter((o) => !newSlugs.has(o.name.split("/")[0]));
  const skipped = all.length - legacy.length;
  console.log(
    `${legacy.length} legacy object(s) to back up; ${skipped} skipped as new content ` +
      `(folders: ${[...new Set(all.filter((o) => newSlugs.has(o.name.split("/")[0])).map((o) => o.name.split("/")[0]))].join(", ") || "none"})\n`,
  );

  if (DRY_RUN) {
    const bytes = legacy.reduce((n, o) => n + o.size, 0);
    console.log(`would write ${legacy.length} file(s), ${bytes.toLocaleString("en-US")} bytes, to`);
    console.log(`  ${path.relative(ROOT, ARCHIVE)}`);
    console.log(
      `\nexpected: ${EXPECTED_COUNT} objects / ${EXPECTED_BYTES.toLocaleString("en-US")} bytes ` +
        `/ fingerprint ${EXPECTED_FINGERPRINT}`,
    );
    console.log("Dry run complete — nothing written.");
    await db.auth.signOut();
    return;
  }

  await fs.mkdir(ARCHIVE, { recursive: true });
  const rows: ManifestRow[] = [];
  let downloaded = 0;
  let reused = 0;

  for (const obj of legacy) {
    const dest = path.join(ARCHIVE, obj.name);
    await fs.mkdir(path.dirname(dest), { recursive: true });

    let bytes: Buffer | null = null;
    /* Idempotence: an existing file is trusted only if its MD5 still matches,
       so a half-written file from an interrupted run is re-fetched rather than
       silently kept. */
    try {
      const existing = await fs.readFile(dest);
      if (md5(existing) === obj.etag) {
        bytes = existing;
        reused++;
      }
    } catch {
      /* not on disk yet */
    }

    if (!bytes) {
      const { data, error } = await db.storage.from(BUCKET).download(obj.name);
      if (error) fail(`download "${obj.name}": ${error.message}`);
      if (!data) fail(`download "${obj.name}": no data returned`);
      bytes = Buffer.from(await data.arrayBuffer());
      await fs.writeFile(dest, bytes);
      downloaded++;
    }

    /* ASSERTION 1, per object: the bytes on disk hash to what Storage holds.
       Computed from the file, never from the reported metadata. */
    const digest = md5(bytes);
    if (digest !== obj.etag) {
      fail(`"${obj.name}": MD5 on disk ${digest} != Storage eTag ${obj.etag}. Backup is NOT valid.`);
    }
    if (bytes.length !== obj.size) {
      fail(`"${obj.name}": ${bytes.length} bytes on disk != ${obj.size} reported. Backup is NOT valid.`);
    }
    rows.push({ name: obj.name, md5: digest, size: bytes.length });
  }

  rows.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const totalBytes = rows.reduce((n, r) => n + r.size, 0);

  /* ASSERTION 4: the same aggregate production reports, recomputed from disk.
     Mirrors md5(string_agg(name||'|'||eTag||'|'||size, E'\n' order by name)). */
  const fingerprint = createHash("md5")
    .update(rows.map((r) => `${r.name}|${r.md5}|${r.size}`).join("\n"))
    .digest("hex");

  console.log(`downloaded ${downloaded}, reused ${reused} already-correct file(s)\n`);
  console.log("ASSERTIONS");
  const checks: [string, boolean, string][] = [
    ["every file's MD5 matches its Storage eTag", true, `${rows.length}/${rows.length} verified`],
    ["object count", rows.length === EXPECTED_COUNT, `${rows.length} (expected ${EXPECTED_COUNT})`],
    [
      "total bytes",
      totalBytes === EXPECTED_BYTES,
      `${totalBytes.toLocaleString("en-US")} (expected ${EXPECTED_BYTES.toLocaleString("en-US")})`,
    ],
    [
      "aggregate fingerprint = PRODUCTION's",
      fingerprint === EXPECTED_FINGERPRINT,
      `${fingerprint} (expected ${EXPECTED_FINGERPRINT})`,
    ],
  ];
  for (const [label, ok, detail] of checks) {
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label} — ${detail}`);
  }
  if (checks.some(([, ok]) => !ok)) {
    fail("Backup assertions FAILED. Nothing destructive may run. Do not proceed to 6c-g.");
  }

  const common = {
    generatedBy: "scripts/backup-297-objects.ts (PP6c step 6c-b)",
    purpose:
      "Cold backup of the 297 legacy template objects deleted by migration 0030 (D-PP-k). " +
      "A .down.sql restores rows, never Storage objects — these files are the only copy.",
    exportedFrom: `TEST (${TEST_REF}), whose 297 legacy objects are byte-identical to production's`,
    archiveDir: "docs/source-assets/_archive-297-templates/ (gitignored)",
    objectCount: rows.length,
    totalBytes,
    fingerprint,
    fingerprintFormula:
      "md5(join('\\n', sorted `name|md5|size`)), computed from the bytes on disk. Server equivalent: " +
      "md5(string_agg(name||'|'||replace(metadata->>'eTag','\"','')||'|'||(metadata->>'size'), E'\\n' order by name)) " +
      "— the replace() is required because Storage stores eTags quoted.",
  };

  /* THE MANIFEST IS SPLIT, AND THE REASON IS THAT THIS REPOSITORY IS PUBLIC.
     S7 Step 7 (2026-06-19) verified a standing invariant: the gated source trees
     are gitignored AND were never committed on any branch, so there is no
     exposure. A committed list of 297 private-bucket object paths would be the
     first thing to break it. The paths are not access-granting — the bucket's
     RLS gates on session and approval, and PP6b proved that signing a known
     object key without approval is refused — but publishing the private
     platform's whole template inventory is a decision for the owner, not a side
     effect of a backup script.

     So: the committed file carries what the PP6c exit gate actually asks for
     (count, total bytes, fingerprint, provenance, and how to re-check), and the
     per-object rows live beside the bytes in the gitignored archive. Nothing is
     lost — anyone can rebuild the full list by re-running this script, and the
     fingerprint proves the archive is intact without naming a single file. */
  await fs.writeFile(
    MANIFEST,
    JSON.stringify(
      {
        ...common,
        objectListing: `withheld from the public repo by design — see ${path.posix.join(
          "docs/source-assets/_archive-297-templates",
          FULL_MANIFEST_NAME,
        )} (gitignored), or re-run this script to regenerate it`,
        howToVerify:
          "pnpm exec tsx scripts/backup-297-objects.ts — re-hashes every archived file and re-asserts " +
          "count, total bytes and fingerprint against production's measured values.",
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  await fs.writeFile(
    path.join(ARCHIVE, FULL_MANIFEST_NAME),
    JSON.stringify({ ...common, objects: rows }, null, 2) + "\n",
    "utf8",
  );

  await db.auth.signOut();
  console.log(`\nSummary manifest: ${path.relative(ROOT, MANIFEST)} (committed — no object paths)`);
  console.log(`Full manifest:    ${path.relative(ROOT, path.join(ARCHIVE, FULL_MANIFEST_NAME))} (gitignored)`);
  console.log(`Bytes written:    ${path.relative(ROOT, ARCHIVE)} (gitignored)`);
  console.log("\nBackup verified. 0030 may now be built.");
}

main().catch((e) => {
  console.error("\nBACKUP FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
