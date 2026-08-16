/**
 * scripts/restore-297-objects.ts — PP7 step 7-f. THE OTHER HALF OF THE ROLLBACK.
 *
 *   pnpm exec tsx scripts/restore-297-objects.ts --dry-run
 *   pnpm exec tsx scripts/restore-297-objects.ts
 *
 * Puts the 297 legacy template objects back into the private `resources` bucket,
 * at their EXACT original keys, from the cold archive.
 *
 * WHY IT HAD TO EXIST
 * -------------------
 * `0030_content_v2_cutover.down.sql` restores 373 rows, including every
 * `storage_path`. It cannot restore a single byte. Until PP7 the documented
 * recovery for the files was a sentence in that migration's header telling the
 * operator to "re-upload them under the same object keys" — 297 of them, by
 * hand, through a browser, correctly, during an incident.
 *
 * That is not a rollback plan; it is a hope. The independent review called it
 * blocking and it was right. This is the missing half.
 *
 * THE KEYS ARE THE WHOLE POINT
 * ----------------------------
 * A restored `resources` row carries `storage_path`. If the bytes come back
 * under a different key — a re-upload through the CMS mints a fresh
 * timestamped stem — the row points at nothing and the partner gets a broken
 * download from a table that looks perfectly healthy. The archive preserves the
 * original keys exactly, as directory structure, and this uploads them verbatim.
 * Nothing here generates a name.
 *
 * SAFETY
 * ------
 *   - the archive is re-verified from the bytes on disk before anything uploads;
 *   - `upsert: false` — an object already present is SKIPPED, never overwritten,
 *     so this cannot damage live content and can be re-run after a partial run;
 *   - it uploads only keys that are IN the archive, so it cannot invent files;
 *   - every upload is read back and its eTag compared to the archive's MD5;
 *   - TEST only. The host is asserted before the first request. Production
 *     restores are the owner's, deliberately, by hand.
 *
 * IDEMPOTENT. Re-running skips what is already there and reports it.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseArgs } from "./lib/argv";
import { withSession } from "./lib/session";
import { confirmProduction, connectTarget, resolveTarget } from "./lib/connect";
import {
  ARCHIVE_REL,
  type ArchiveFile,
  checkArchive,
  printChecks,
  readArchive,
} from "./lib/archive";

const ROOT = process.cwd();
const ARCHIVE = path.join(ROOT, ARCHIVE_REL);
const BUCKET = "resources";

/* Mirrors src/lib/admin/file-actions.ts. Word documents and PDFs only. */
const CONTENT_TYPE: Record<string, string> = {
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pdf": "application/pdf",
};

const ARGS = parseArgs(process.argv.slice(2), { flags: ["--dry-run"], options: ["--target"] });
const DRY_RUN = ARGS.has("--dry-run");
const TARGET = resolveTarget(ARGS.get("--target"));


async function listAll(db: SupabaseClient, prefix = ""): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const PAGE = 100;
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await db.storage
      .from(BUCKET)
      .list(prefix, { limit: PAGE, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`list "${prefix || "/"}": ${error.message}`);
    const page = data ?? [];
    for (const e of page) {
      const full = prefix ? `${prefix}/${e.name}` : e.name;
      if (!e.id) {
        for (const [k, v] of await listAll(db, full)) out.set(k, v);
        continue;
      }
      const meta = e.metadata as { eTag?: string } | null;
      out.set(full, (meta?.eTag ?? "").replace(/^"|"$/g, "").toLowerCase());
    }
    if (page.length < PAGE) break;
  }
  return out;
}

async function main(): Promise<void> {
  console.log(`restore the legacy template objects — ${DRY_RUN ? "DRY RUN" : "LIVE"}\n`);

  /* 1. The archive must be provably intact before it is trusted as a source. */
  const { files, skipped } = await readArchive(ARCHIVE);
  if (skipped.length) console.log(`archive: skipped ${skipped.length} bookkeeping file(s)`);
  const { ok, checks } = checkArchive(files);
  console.log("archive assertions");
  printChecks(checks);
  if (!ok) {
    throw new Error(
      "The cold backup does not match production's measured values. REFUSING to restore from it — " +
        "putting back the wrong bytes under the right keys is worse than putting back nothing.",
    );
  }
  console.log("Archive is valid.\n");

  const db = await connectTarget(TARGET);
  await withSession(db, () => run(db, files));
}

async function run(db: SupabaseClient, files: ArchiveFile[]): Promise<void> {
  const present = await listAll(db);
  console.log(`bucket holds ${present.size} object(s)\n`);

  const missing: ArchiveFile[] = [];
  const alreadyCorrect: ArchiveFile[] = [];
  const conflicting: ArchiveFile[] = [];

  for (const f of files) {
    const etag = present.get(f.name);
    if (etag === undefined) missing.push(f);
    else if (etag === f.md5) alreadyCorrect.push(f);
    else conflicting.push(f);
  }

  console.log(`${missing.length} to restore · ${alreadyCorrect.length} already present and identical · ${conflicting.length} present with DIFFERENT bytes`);

  /* A key that exists with different bytes is not ours to overwrite. It means
     either the archive is stale or something else has taken the key, and both
     are questions for a person. */
  if (conflicting.length) {
    throw new Error(
      `${conflicting.length} object(s) already exist under an archived key with different bytes, ` +
        `e.g. "${conflicting[0].name}". REFUSING — this script never overwrites. ` +
        `Resolve by hand, then re-run.`,
    );
  }

  if (!missing.length) {
    console.log("\nNothing to do — every archived object is already in the bucket with matching bytes.");
    return;
  }

  if (DRY_RUN) {
    const bytes = missing.reduce((n, f) => n + f.size, 0);
    console.log(`\nwould upload ${missing.length} object(s), ${bytes.toLocaleString("en-US")} bytes, at their exact keys:`);
    for (const f of missing.slice(0, 5)) console.log(`  ${f.name}`);
    if (missing.length > 5) console.log(`  … and ${missing.length - 5} more`);
    console.log("Dry run complete — nothing uploaded.");
    return;
  }

  await confirmProduction(TARGET, [
    `  action    upload ${missing.length} archived object(s) at their exact original keys`,
    `  never     overwrites — a pre-existing key with different bytes refuses the whole run`,
    `  bucket    resources (private)`,
  ].join("\n"));

  let uploaded = 0;
  for (const f of missing) {
    const bytes = await fs.readFile(path.join(ARCHIVE, f.name));
    const ext = path.extname(f.name).toLowerCase();
    const contentType = CONTENT_TYPE[ext];
    if (!contentType) throw new Error(`no content type for "${f.name}" (${ext})`);

    const { error } = await db.storage.from(BUCKET).upload(f.name, bytes, {
      contentType,
      /* NEVER overwrite. A pre-existing key is a question, not a target. */
      upsert: false,
    });
    if (error) throw new Error(`upload "${f.name}": ${error.message}`);
    uploaded += 1;
    if (uploaded % 50 === 0) console.log(`  … ${uploaded}/${missing.length}`);
  }
  console.log(`uploaded ${uploaded}\n`);

  /* Read back rather than trust the writes: every archived key must now be in
     the bucket with the archive's exact bytes. */
  const after = await listAll(db);
  const wrong = files.filter((f) => after.get(f.name) !== f.md5);
  if (wrong.length) {
    throw new Error(
      `${wrong.length} object(s) are not byte-identical to the archive after restore, e.g. "${wrong[0].name}".`,
    );
  }

  console.log(`VERIFIED — all ${files.length} archived objects are in the bucket at their exact keys,`);
  console.log(`byte-identical to the cold backup. The bucket now holds ${after.size} object(s).`);
  console.log(`\nThe restored resources rows point at these keys, so downloads resolve again.`);
}

main().catch((e) => {
  console.error("\nRESTORE FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
