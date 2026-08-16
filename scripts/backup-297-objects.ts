/**
 * scripts/backup-297-objects.ts — PP6c step 6c-b, hardened at PP7 step 7-b.
 * THE COLD BACKUP.
 *
 * Exports the 297 legacy template objects out of the private `resources` bucket
 * onto disk, and PROVES the result is a byte-for-byte copy of what production
 * holds — before migration `0030` deletes them.
 *
 *   pnpm exec tsx scripts/backup-297-objects.ts --dry-run   # plan + assertions only
 *   pnpm exec tsx scripts/backup-297-objects.ts             # export, verify, promote
 *
 * ⚠️ TO CHECK AN EXISTING ARCHIVE, DO NOT RUN THIS. Run the read-only verifier:
 *
 *   pnpm exec tsx scripts/verify-archive.ts
 *
 * WHY THIS SCRIPT IS A HARD GATE AND NOT A CHORE (D-PP-k)
 * ------------------------------------------------------
 * Every other destructive step in this project has been reversible, because a
 * migration ships a `.down.sql` and rows come back. Storage objects do not. When
 * `0030` removes these 297 files there is no statement, flag or backup inside
 * Supabase that returns them. This directory is the only copy. Nothing
 * destructive runs until this script exits 0.
 *
 * ---------------------------------------------------------------------------
 * WHAT PP7 CHANGED, AND WHY IT WAS BLOCKING
 * ---------------------------------------------------------------------------
 * The original wrote each downloaded object STRAIGHT INTO THE ARCHIVE, and only
 * afterwards checked the count, the byte total and the fingerprint. So the one
 * command anybody would reach for to answer "is my only copy still good?" was
 * also the command that opened all 297 of them for writing. If Storage had been
 * mutated in the meantime — a replaced file, a partial upload, a wrong bucket —
 * the good bytes were gone by the time the aggregate check noticed, and the
 * script reported a corrupt archive that it had corrupted itself.
 *
 * The independent review of 2026-08-16 rated it blocking, and it was right. So
 * the export is now **staged, verified, and only then promoted**:
 *
 *   1. everything lands in `_archive-297-templates.staging/`;
 *   2. a file already in the LIVE archive with the right MD5 is COPIED into
 *      staging rather than re-downloaded — the archive is read, never written;
 *   3. all four assertions run against staging;
 *   4. only on a clean pass is staging promoted, by rename, to the live archive —
 *      and the archive it replaces is kept as `.superseded`, so a complete,
 *      verified copy exists at every instant of the swap.
 *
 * A failed run therefore leaves the previous archive exactly as it found it.
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
 * what found that out — Storage stores the eTag QUOTED. The canonical form, and
 * the single implementation of it, now live in `scripts/lib/archive.ts`.
 *
 * THE FOUR ASSERTIONS, all of which must pass before anything is promoted:
 *   1. every exported file's MD5 equals the eTag Storage holds for it
 *      (eTags here are single-part, so the eTag IS the MD5 of the bytes —
 *      verified 0 multipart objects at the kickoff);
 *   2. exactly EXPECTED_COUNT objects were exported;
 *   3. the total is exactly EXPECTED_BYTES;
 *   4. the aggregate fingerprint recomputed from disk equals EXPECTED_FINGERPRINT,
 *      production's own value.
 *
 * Assertion 4 subsumes 2–3, but they are kept separate because a failure should
 * say WHICH property broke. A single mismatched fingerprint with no other signal
 * is the least actionable possible error on the one step that cannot be retried.
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
 * IDEMPOTENT. A file already archived with the right MD5 is copied forward, so an
 * interrupted run is simply repeated. The manifests are rewritten every time.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseArgs } from "./lib/argv";
import { withSession } from "./lib/session";
import {
  ARCHIVE_REL,
  EXPECTED_BYTES,
  EXPECTED_COUNT,
  EXPECTED_FINGERPRINT,
  FULL_MANIFEST_NAME,
  STAGING_REL,
  type ArchiveFile,
  checkArchive,
  fingerprintOf,
  md5,
  normaliseEtag,
  printChecks,
  promoteStaging,
  sortByName,
} from "./lib/archive";

const ROOT = process.cwd();
const SPEC = path.join(ROOT, "docs/content-v2-spec.json");
/* Inside docs/source-assets/, which .gitignore already excludes wholesale — the
   bytes stay out of git. The summary manifest beside it is committed. */
const ARCHIVE = path.join(ROOT, ARCHIVE_REL);
const STAGING = path.join(ROOT, STAGING_REL);
/* The archive a successful promotion displaces. Kept, not deleted: it is a
   second verified copy, and it costs 5.3 MB. */
const SUPERSEDED = path.join(ROOT, `${ARCHIVE_REL}.superseded`);
/* Summary only, committed. The per-object rows go beside the bytes instead —
   this repository is public; see the note above the write. */
const MANIFEST = path.join(ROOT, "docs/archive-297-manifest.json");

const TEST_REF = "sdszcralogcrujtyghig";
const BUCKET = "resources";

/* Strict: an unknown argument is an error, never a no-op (review 2026-08-16). */
const ARGS = parseArgs(process.argv.slice(2), { flags: ["--dry-run"] });
const DRY_RUN = ARGS.has("--dry-run");

interface StorageEntry {
  name: string;
  size: number;
  etag: string;
}

function fail(message: string): never {
  throw new Error(message);
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
  console.log(`cold backup of the legacy template objects — ${DRY_RUN ? "DRY RUN" : "LIVE"}\n`);

  const spec = JSON.parse(await fs.readFile(SPEC, "utf8")) as {
    focusAreas: { slug: string }[];
  };
  const newSlugs = new Set(spec.focusAreas.map((fa) => fa.slug));
  if (newSlugs.size !== 22) fail(`spec should carry 22 focus-area slugs, found ${newSlugs.size}`);

  const db = await connect();
  await withSession(db, () => run(db, newSlugs));
}

async function run(db: SupabaseClient, newSlugs: Set<string>): Promise<void> {
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
    console.log(`would stage ${legacy.length} file(s), ${bytes.toLocaleString("en-US")} bytes, in`);
    console.log(`  ${path.relative(ROOT, STAGING)}`);
    console.log(`and promote to ${path.relative(ROOT, ARCHIVE)} only if all four assertions pass.`);
    console.log(
      `\nexpected: ${EXPECTED_COUNT} objects / ${EXPECTED_BYTES.toLocaleString("en-US")} bytes ` +
        `/ fingerprint ${EXPECTED_FINGERPRINT}`,
    );
    console.log("Dry run complete — nothing written.");
    return;
  }

  /* STAGE. Nothing below writes inside ARCHIVE; it is opened for reading only,
     to carry already-correct bytes forward without hitting the network. */
  await fs.mkdir(STAGING, { recursive: true });
  const rows: ArchiveFile[] = [];
  let downloaded = 0;
  let reusedFromStaging = 0;
  let reusedFromArchive = 0;

  for (const obj of legacy) {
    const dest = path.join(STAGING, obj.name);
    await fs.mkdir(path.dirname(dest), { recursive: true });

    let bytes: Buffer | null = null;

    /* Idempotence, in two steps. A partial staging directory from an interrupted
       run is trusted only where the MD5 still matches; then the live archive is
       consulted the same way. Both are verified against the eTag Storage holds
       RIGHT NOW, so a file that changed server-side is re-downloaded rather than
       carried forward — the reuse can never mask a mutation. */
    try {
      const staged = await fs.readFile(dest);
      if (md5(staged) === obj.etag) {
        bytes = staged;
        reusedFromStaging++;
      }
    } catch {
      /* not staged yet */
    }

    if (!bytes) {
      try {
        const archived = await fs.readFile(path.join(ARCHIVE, obj.name));
        if (md5(archived) === obj.etag) {
          await fs.writeFile(dest, archived);
          bytes = archived;
          reusedFromArchive++;
        }
      } catch {
        /* not in the archive, or unreadable — fall through to the network */
      }
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
      fail(`"${obj.name}": MD5 in staging ${digest} != Storage eTag ${obj.etag}. Backup is NOT valid.`);
    }
    if (bytes.length !== obj.size) {
      fail(`"${obj.name}": ${bytes.length} bytes staged != ${obj.size} reported. Backup is NOT valid.`);
    }
    rows.push({ name: obj.name, md5: digest, size: bytes.length });
  }

  const staged = sortByName(rows);
  const totalBytes = staged.reduce((n, r) => n + r.size, 0);
  const fingerprint = fingerprintOf(staged);

  console.log(
    `staged ${staged.length}: ${downloaded} downloaded, ${reusedFromArchive} carried from the current ` +
      `archive, ${reusedFromStaging} already staged\n`,
  );

  /* VERIFY, STILL IN STAGING. The live archive has not been touched. */
  console.log("ASSERTIONS");
  console.log(`  PASS  every file's MD5 matches its Storage eTag — ${staged.length}/${staged.length} verified`);
  const { ok, checks } = checkArchive(staged);
  printChecks(checks);
  if (!ok) {
    fail(
      `Backup assertions FAILED. Nothing was promoted and the existing archive at ` +
        `${path.relative(ROOT, ARCHIVE)} is untouched. Staging is left at ` +
        `${path.relative(ROOT, STAGING)} for inspection. Nothing destructive may run.`,
    );
  }

  /* PROMOTE. Only now — and via `scripts/lib/archive.ts`, where the two-rename
     swap has its own test (`scripts/verify-archive-promote.ts`) including the
     failure path. */
  console.log("");
  const promoted = await promoteStaging({ archive: ARCHIVE, staging: STAGING, superseded: SUPERSEDED });
  console.log(
    promoted.outcome === "fresh"
      ? `promoted staging -> ${path.relative(ROOT, ARCHIVE)} (no previous archive)`
      : `promoted staging -> ${path.relative(ROOT, ARCHIVE)}; previous archive kept at ` +
          `${path.relative(ROOT, SUPERSEDED)} (a second verified copy)`,
  );

  const common = {
    generatedBy: "scripts/backup-297-objects.ts (PP6c step 6c-b; staged-and-promoted since PP7 step 7-b)",
    purpose:
      "Cold backup of the 297 legacy template objects deleted by migration 0030 (D-PP-k). " +
      "A .down.sql restores rows, never Storage objects — these files are the only copy.",
    exportedFrom: `TEST (${TEST_REF}), whose 297 legacy objects are byte-identical to production's`,
    archiveDir: `${ARCHIVE_REL}/ (gitignored)`,
    objectCount: staged.length,
    totalBytes,
    fingerprint,
    fingerprintFormula:
      "md5(join('\\n', sorted `name|md5|size`)), computed from the bytes on disk. Server equivalent: " +
      "md5(string_agg(name||'|'||replace(metadata->>'eTag','\"','')||'|'||(metadata->>'size'), E'\\n' order by name)) " +
      "— the replace() is required because Storage stores eTags quoted.",
  };

  /* THE MANIFEST IS SPLIT, AND THE REASON IS THAT THIS REPOSITORY IS PUBLIC.
     S7 Step 7 (2026-06-19) verified a standing invariant: the gated source trees
     are gitignored AND were never committed on any branch. A committed list of
     297 private-bucket object paths would be the first thing to break it. The
     paths are not access-granting — the bucket's RLS gates on session and
     approval, and PP6b proved that signing a known object key without approval
     is refused — but publishing the private platform's whole template inventory
     is a decision for the owner, not a side effect of a backup script.

     So: the committed file carries what the exit gate actually asks for (count,
     total bytes, fingerprint, provenance, and how to re-check), and the
     per-object rows live beside the bytes in the gitignored archive. Nothing is
     lost — anyone can rebuild the full list by re-running this script, and the
     fingerprint proves the archive is intact without naming a single file. */
  await fs.writeFile(
    MANIFEST,
    JSON.stringify(
      {
        ...common,
        objectListing: `withheld from the public repo by design — see ${path.posix.join(
          ARCHIVE_REL,
          FULL_MANIFEST_NAME,
        )} (gitignored), or re-run this script to regenerate it`,
        /* PP7: this used to name THIS script, which downloads. Checking your only
           backup must not be an operation that can damage it. */
        howToVerify:
          "pnpm exec tsx scripts/verify-archive.ts — re-hashes every archived file and re-asserts " +
          "count, total bytes and fingerprint against production's measured values. Strictly " +
          "read-only: no network call, no credential read, nothing opened for writing.",
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  await fs.writeFile(
    path.join(ARCHIVE, FULL_MANIFEST_NAME),
    JSON.stringify({ ...common, objects: staged }, null, 2) + "\n",
    "utf8",
  );

  console.log(`\nSummary manifest: ${path.relative(ROOT, MANIFEST)} (committed — no object paths)`);
  console.log(`Full manifest:    ${path.relative(ROOT, path.join(ARCHIVE, FULL_MANIFEST_NAME))} (gitignored)`);
  console.log(`Bytes:            ${path.relative(ROOT, ARCHIVE)} (gitignored)`);
  console.log("\nBackup verified and promoted. Re-check it any time, safely:");
  console.log("  pnpm exec tsx scripts/verify-archive.ts");
}

main().catch((e) => {
  console.error("\nBACKUP FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
