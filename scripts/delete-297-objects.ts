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
import { createHash } from "node:crypto";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseArgs } from "./lib/argv";

const ROOT = process.cwd();
const ARCHIVE = path.join(ROOT, "docs/source-assets/_archive-297-templates");
const SPEC = path.join(ROOT, "docs/content-v2-spec.json");
const TEST_REF = "sdszcralogcrujtyghig";
const BUCKET = "resources";

const EXPECTED_COUNT = 297;
const EXPECTED_BYTES = 5_320_962;
const EXPECTED_FINGERPRINT = "6fde792718130d12071b69459f9d70ab";

/* The Storage API removes at most 1000 keys per call; 297 fits, but the batch
   is explicit rather than implicit so a future larger corpus fails visibly. */
const REMOVE_LIMIT = 1000;

/* Strict: an unknown argument is an error, never a no-op (review 2026-08-16). */
const ARGS = parseArgs(process.argv.slice(2), { flags: ["--dry-run"] });
const DRY_RUN = ARGS.has("--dry-run");

function md5(b: Buffer): string {
  return createHash("md5").update(b).digest("hex");
}

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
 *  from a previous run's say-so. */
async function verifyArchive(): Promise<Map<string, string>> {
  const byName = new Map<string, string>();
  let bytes = 0;
  const walk = async (dir: string, prefix = ""): Promise<void> => {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(abs, rel);
      else if (entry.name.endsWith(".docx") || entry.name.endsWith(".pdf")) {
        const buf = await fs.readFile(abs);
        byName.set(rel, md5(buf));
        bytes += buf.length;
      }
    }
  };
  await walk(ARCHIVE);

  const rows = [...byName.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const fingerprint = createHash("md5")
    .update(rows.map(([n, h]) => `${n}|${h}|${0}`).join("\n"))
    .digest("hex");

  console.log(`archive: ${byName.size} file(s), ${bytes.toLocaleString("en-US")} bytes`);
  if (byName.size !== EXPECTED_COUNT) {
    throw new Error(`archive holds ${byName.size} files, expected ${EXPECTED_COUNT}. REFUSING to delete anything.`);
  }
  if (bytes !== EXPECTED_BYTES) {
    throw new Error(`archive is ${bytes} bytes, expected ${EXPECTED_BYTES}. REFUSING to delete anything.`);
  }
  /* Recompute the 6c-b fingerprint exactly: name|md5|size, sorted by name. */
  const sized = await Promise.all(
    rows.map(async ([n, h]) => `${n}|${h}|${(await fs.stat(path.join(ARCHIVE, n))).size}`),
  );
  const fp = createHash("md5").update(sized.join("\n")).digest("hex");
  if (fp !== EXPECTED_FINGERPRINT) {
    throw new Error(`archive fingerprint ${fp} != ${EXPECTED_FINGERPRINT}. REFUSING to delete anything.`);
  }
  console.log(`archive fingerprint ${fp} — matches production's. Backup is valid.\n`);
  void fingerprint;
  return byName;
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
    await db.auth.signOut();
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

  await db.auth.signOut();
  console.log(`\nDeleted ${legacy.length}. The ${keep} new objects are untouched.`);
  console.log(`The only copy of those files is now ${path.relative(ROOT, ARCHIVE)} — do not delete it.`);
  console.log(`Next: apply supabase/sql/migrations/0030_content_v2_cutover.up.sql`);
}

main().catch((e) => {
  console.error("\nDELETE FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
