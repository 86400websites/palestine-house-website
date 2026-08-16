/**
 * scripts/delete-297-objects.ts — PP6c step 6c-g. THE IRREVERSIBLE HALF.
 *
 *   pnpm exec tsx scripts/delete-297-objects.ts --dry-run
 *   pnpm exec tsx scripts/delete-297-objects.ts
 *
 * Removes the 297 legacy template objects from the private `resources` bucket,
 * through the Storage API, immediately AFTER migration 0030 has deleted the rows
 * that named them.
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
 * WHY AFTER THE MIGRATION AND NOT BEFORE — REVERSED AT PP7
 * --------------------------------------------------------
 * PP6c ran this FIRST, reasoning that "the storage paths live in
 * `public.resources`, and 0030 deletes those rows, so afterwards this script
 * would have nothing to work from."
 *
 * That reason was false, and one grep at PP7's kickoff showed it: **this script
 * has never read `public.resources`.** It derives the delete set from the
 * Storage listing and the 22 new focus-area slugs in the spec — every object
 * whose top-level folder is not one of the 22. Emptying the table takes nothing
 * away from it.
 *
 * With the stated reason gone, the independent review's argument decides, and it
 * is about which half-finished state you would rather be left in:
 *
 *   objects first, then the migration fails  ->  297 LIVE rows pointing at files
 *                                                that no longer exist. Partners
 *                                                get broken downloads and no
 *                                                retry repairs it.
 *
 *   rows first, then this script fails       ->  297 unreachable files costing
 *                                                5.3 MB. Inert, invisible, and
 *                                                the fix is to run it again.
 *
 * One is user-visible and unrecoverable; the other is untidy. Hence rows first.
 *
 * THE TWO INTERLOCKS
 * ------------------
 * This is the one action in the whole series that no `.down.sql` can undo, so it
 * refuses to start until BOTH hold:
 *
 * 1. THE COLD BACKUP IS INTACT, re-verified from the bytes on disk here and now —
 *    not trusted because a previous run said so:
 *      297 files · 5,320,962 bytes · md5(name|md5|size, sorted) = 6fde7927…
 *    and every single object it is about to delete must be present in that
 *    archive BY NAME AND BY CONTENT HASH.
 *
 * 2. **0030 HAS ACTUALLY COMMITTED** (new at PP7 — the script previously made no
 *    database call whatsoever, so it would happily delete 297 files out from
 *    under 297 live rows). Checked through the CMS's own admin RPCs:
 *      - not one legacy focus area remains (no `element_code` outside 1.1…4.5);
 *      - exactly the 22 spec focus areas are present;
 *      - they carry exactly 110 resource rows (88 templates + 22 guides), so the
 *        table holds the new content and nothing else.
 *    Any of those failing means the migration has not run, or has not run fully,
 *    and there is no safe object to delete.
 *
 * ⚠️ WHY THE PREFLIGHT COUNTS ROWS RATHER THAN COMPARING STORAGE PATHS. The
 * exact check — "no surviving row references any object I am about to delete" —
 * needs every surviving row's `storage_path`, and no admin RPC exposes one:
 * D-PP-i keeps paths off admin surfaces deliberately. The only RPC that returns
 * a path, `get_resource_download`, resolves nothing for an UNPUBLISHED topic, so
 * building the check on it would silently miss every Draft row and fail OPEN on
 * the one step that cannot be retried. Counting through the admin RPCs sees
 * Draft and Live alike, so that is what this does.
 *
 * TEST only. Production is done by the owner, by hand, deliberately.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseArgs } from "./lib/argv";
import { withSession } from "./lib/session";
import { ARCHIVE_REL, EXPECTED_COUNT, checkArchive, printChecks, readArchive } from "./lib/archive";
import {
  type PreflightArea as SpecArea,
  type PreflightTopic as TopicRow,
  checkMigrationHasRun,
} from "./lib/preflight";

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

/**
 * INTERLOCK 2 — has `0030` actually committed?
 *
 * Before PP7 this script made no database call at all, which is what made the
 * old ordering unsafe in both directions: nothing stopped it deleting 297 files
 * out from under 297 live rows.
 *
 * Read through `admin_list_platform_topics` and `admin_list_resource_files`
 * because they are the CMS's own reads and they see Draft as well as Live. A
 * check that cannot see a Draft row would fail open exactly where this one must
 * not.
 */
async function assertMigrationHasRun(db: SupabaseClient, expected: SpecArea[]): Promise<void> {
  const { data, error } = await db.rpc("admin_list_platform_topics");
  if (error) throw new Error(`admin_list_platform_topics: ${error.message}`);
  const topics = (data as TopicRow[] | null) ?? [];

  /* Counted before the shape is judged, so the error can say which is wrong. */
  let rows = 0;
  for (const t of topics) {
    const { data: files, error: fErr } = await db.rpc("admin_list_resource_files", {
      p_element_id: t.element_id,
    });
    if (fErr) throw new Error(`admin_list_resource_files(${t.slug}): ${fErr.message}`);
    rows += ((files as unknown[] | null) ?? []).length;
  }

  checkMigrationHasRun(topics, rows, expected);

  console.log(
    `0030 confirmed applied: 0 legacy focus areas · ${topics.length} new focus areas · ` +
      `${rows} resource rows\n`,
  );
}

async function main(): Promise<void> {
  console.log(`delete the legacy template objects — ${DRY_RUN ? "DRY RUN" : "LIVE"}\n`);

  const archive = await verifyArchive();

  const spec = JSON.parse(await fs.readFile(SPEC, "utf8")) as { focusAreas: SpecArea[] };
  const expected = spec.focusAreas;
  if (expected.length !== 22) throw new Error(`spec should carry 22 focus areas, found ${expected.length}`);
  const newSlugs = new Set(expected.map((f) => f.slug));

  const db = await connect();
  await withSession(db, async () => {
    await assertMigrationHasRun(db, expected);
    await run(db, archive, newSlugs);
  });
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
  /* 0030 ran BEFORE this script (PP7 reversed the order), and the preflight
     above refused to start until it had confirmed so. Nothing follows. */
  console.log(`0030 was already applied — this was the last destructive step. Verify with`);
  console.log(`  supabase/sql/verification/0030_verify_PROD_safe_readonly.sql`);
  console.log(`To put these files back: pnpm exec tsx scripts/restore-297-objects.ts`);
}

main().catch((e) => {
  console.error("\nDELETE FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
