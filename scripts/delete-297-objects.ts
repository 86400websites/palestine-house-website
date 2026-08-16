/**
 * scripts/delete-297-objects.ts — PP6c step 6c-g. THE IRREVERSIBLE HALF.
 *
 *   pnpm exec tsx scripts/delete-297-objects.ts --dry-run
 *   pnpm exec tsx scripts/delete-297-objects.ts
 *
 * Removes the 297 legacy template objects from the private `resources` bucket,
 * through the Storage API, immediately BEFORE migration 0030 deletes the rows
 * that name them.
 *
 * WHY NOT IN THE MIGRATION
 * ------------------------
 * Supabase's guidance is explicit: "Deleting objects should always be done via
 * the Storage API and NOT via a SQL query. Deleting objects via a SQL query will
 * not remove the object from the bucket and will result in the object being
 * orphaned." A `delete from storage.objects` inside 0030 would drop the metadata,
 * strand 5.3 MB of bytes in the bucket, and report success — the worst kind of
 * failure, because the migration would look like it had worked.
 *
 * WHY BEFORE THE MIGRATION AND NOT AFTER
 * --------------------------------------
 * The storage paths live in `public.resources`, and 0030 deletes those rows. Run
 * afterwards, this script would have nothing to work from and the 297 files
 * would be unreachable AND undeleted. Objects first, rows second.
 *
 * THE INTERLOCK
 * -------------
 * This is the one action in PP6c that no `.down.sql` can undo, so it refuses to
 * start until the cold backup is re-verified from disk, here, now — not trusted
 * because a previous run said so:
 *
 *   297 files · 5,320,962 bytes · md5(name|md5|size, sorted) =
 *   6fde792718130d12071b69459f9d70ab
 *
 * and it additionally requires that every single object it is about to delete is
 * present in that archive BY NAME AND BY CONTENT HASH. An object with no verified
 * copy on disk stops the run.
 *
 * TEST only. Production is done by the owner, by hand, deliberately.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseArgs } from "./lib/argv";
import { withSession } from "./lib/session";
import { ARCHIVE_REL, EXPECTED_COUNT, checkArchive, printChecks, readArchive } from "./lib/archive";

const ROOT = process.cwd();
const ARCHIVE = path.join(ROOT, ARCHIVE_REL);
const SPEC = path.join(ROOT, "docs/content-v2-spec.json");
const TEST_REF = "sdszcralogcrujtyghig";
const BUCKET = "resources";

/* The Storage API removes at most 1000 keys per call; 297 fits, but the batch
   is explicit rather than implicit so a future larger corpus fails visibly. */
const REMOVE_LIMIT = 1000;

/* Strict: an unknown argument is an error, never a no-op (review 2026-08-16). */
const ARGS = parseArgs(process.argv.slice(2), { flags: ["--dry-run"] });
const DRY_RUN = ARGS.has("--dry-run");

async function connect(): Promise<SupabaseClient> {
  process.loadEnvFile(path.join(ROOT, ".env.local"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const email = process.env.TEST_PARTNER_EMAIL;
  const password = process.env.TEST_PARTNER_PASSWORD;
  if (!url || !key || !email || !password) throw new Error("Missing Supabase / TEST_PARTNER_* values in .env.local");
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== `${TEST_REF}.supabase.co`) {
    throw new Error(
      `Refusing to run against "${parsed.host}". This deletes files irreversibly and targets the TEST project only.`,
    );
  }
  console.log(`target: ${parsed.host} (TEST)`);
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed: ${error.message}`);
  const { data: isAdmin } = await db.rpc("is_admin");
  if (isAdmin !== true) throw new Error("Not an admin on this project — the delete policy requires is_admin().");
  return db;
}

/** Re-verify the archive from the files on disk. Not from the manifest, and not
 *  from a previous run's say-so.
 *
 *  PP7: the count/bytes/fingerprint constants and the fingerprint formula now
 *  come from `scripts/lib/archive.ts`, in one definition. This function used to
 *  carry its own — and had quietly grown a SECOND, wrong one beside the right
 *  one: a digest over `name|md5|0` with the size hardcoded to zero, computed,
 *  logged nowhere and discarded with `void`. Nothing unsafe followed from it,
 *  because the real check sat two lines below and did stat every file. But two
 *  fingerprints in one function, one of them wrong, is precisely what gets
 *  copied into the next script by someone reading quickly. */
async function verifyArchive(): Promise<Map<string, string>> {
  const { files, skipped } = await readArchive(ARCHIVE);
  if (skipped.length) console.log(`archive: skipped ${skipped.length} bookkeeping file(s)`);

  const { ok, checks } = checkArchive(files);
  console.log("archive assertions");
  printChecks(checks);
  if (!ok) {
    throw new Error(
      "The cold backup does not match production's measured values. REFUSING to delete anything. " +
        "Re-check it read-only with `pnpm exec tsx scripts/verify-archive.ts`.",
    );
  }
  console.log("Backup is valid.\n");
  return new Map(files.map((f) => [f.name, f.md5]));
}

async function listAll(db: SupabaseClient, prefix = ""): Promise<{ name: string; etag: string }[]> {
  const out: { name: string; etag: string }[] = [];
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
        out.push(...(await listAll(db, full)));
        continue;
      }
      const meta = e.metadata as { eTag?: string } | null;
      out.push({ name: full, etag: (meta?.eTag ?? "").replace(/^"|"$/g, "").toLowerCase() });
    }
    if (page.length < PAGE) break;
  }
  return out;
}

async function main(): Promise<void> {
  console.log(`PP6c 6c-g — delete the legacy template objects — ${DRY_RUN ? "DRY RUN" : "LIVE"}\n`);

  const archive = await verifyArchive();

  const spec = JSON.parse(await fs.readFile(SPEC, "utf8")) as { focusAreas: { slug: string }[] };
  const newSlugs = new Set(spec.focusAreas.map((f) => f.slug));

  const db = await connect();
  await withSession(db, () => run(db, archive, newSlugs));
}

async function run(
  db: SupabaseClient,
  archive: Map<string, string>,
  newSlugs: Set<string>,
): Promise<void> {
  const all = await listAll(db);
  const legacy = all.filter((o) => !newSlugs.has(o.name.split("/")[0]));
  const keep = all.length - legacy.length;
  console.log(`bucket: ${all.length} object(s) — ${legacy.length} legacy to delete, ${keep} new to keep`);

  if (legacy.length !== EXPECTED_COUNT) {
    throw new Error(`found ${legacy.length} legacy objects, expected ${EXPECTED_COUNT}. REFUSING.`);
  }

  /* EVERY object about to be deleted must have a byte-identical copy on disk.
     Name alone is not enough — a matching name with different bytes means the
     archive is stale and the file being deleted is not the file backed up. */
  const unbacked = legacy.filter((o) => archive.get(o.name) !== o.etag);
  if (unbacked.length) {
    throw new Error(
      `${unbacked.length} object(s) have no byte-identical copy in the archive, e.g. "${unbacked[0].name}". ` +
        `REFUSING to delete anything. Re-run scripts/backup-297-objects.ts.`,
    );
  }
  console.log(`all ${legacy.length} objects verified present in the archive by name AND content hash\n`);

  if (DRY_RUN) {
    console.log(`would delete ${legacy.length} object(s); ${keep} would remain.`);
    console.log("Dry run complete — nothing deleted.");
    return;
  }

  if (legacy.length > REMOVE_LIMIT) throw new Error(`${legacy.length} exceeds the ${REMOVE_LIMIT}-key remove() limit`);
  const { data: removed, error } = await db.storage.from(BUCKET).remove(legacy.map((o) => o.name));
  if (error) throw new Error(`remove: ${error.message}`);
  console.log(`Storage API reported ${(removed ?? []).length} object(s) removed.`);

  const after = await listAll(db);
  const stillThere = after.filter((o) => !newSlugs.has(o.name.split("/")[0]));
  console.log(`bucket now holds ${after.length} object(s); ${stillThere.length} legacy remain.`);
  if (stillThere.length !== 0) throw new Error(`${stillThere.length} legacy object(s) survived the delete.`);
  if (after.length !== keep) throw new Error(`expected ${keep} objects to remain, found ${after.length}`);

  console.log(`\nDeleted ${legacy.length}. The ${keep} new objects are untouched.`);
  console.log(`The only copy of those files is now ${path.relative(ROOT, ARCHIVE)} — do not delete it.`);
  console.log(`Next: apply supabase/sql/migrations/0030_content_v2_cutover.up.sql`);
}

main().catch((e) => {
  console.error("\nDELETE FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
