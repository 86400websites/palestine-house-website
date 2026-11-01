/**
 * scripts/cr1-content.ts — CR1 LOADER: the content replacement, in explicit steps.
 *
 *   pnpm exec tsx scripts/cr1-content.ts --step <step> --target <test|prod> [--dry-run] [--max-ops N] [--phase switched|retired]
 *
 *   forward:   snapshot → upload → switch → verify --phase switched → retire → verify --phase retired → cleanup
 *   rollback:  restore-objects (only if cleanup ran) → rollback → rollback-sql (a person runs it) → verify-rollback → remove-new-objects
 *
 * The private spec comes from `scripts/cr1-extract.ts`. The historical
 * `load-content.ts` targets the previous release and is not reused; the mechanisms
 * that took review rounds to get right are: connect.ts, withSession, strict args.
 *
 * WHY THESE ARE SEPARATE STEPS, AND WHY IN THIS ORDER
 * ---------------------------------------------------
 *  - `upload` is INERT. New objects go to new keys and no row points at them, so
 *    `is_published_object` refuses them to every partner.
 *  - `switch` repoints rows, registers new ones and rewrites the words. Every row
 *    is valid before and after its own update, so a partner downloading mid-run
 *    gets the old file or the new file, never a broken one. It first refuses if the
 *    content has changed since the snapshot, which a later rollback would silently
 *    undo.
 *  - `retire` only runs after `verify --phase switched` passes, and removes ROWS.
 *    Their bytes stay, because a row can be put back only if its object still exists.
 *  - `cleanup` removes only the objects named in this target's own snapshot, only
 *    when the archive holds a verified copy, and only after asking the database
 *    again, immediately before each batch, that nothing references them. There is
 *    no listing-based deletion and no pattern-based deletion anywhere in this file.
 *
 * RE-RUNNING IS THE RECOVERY. Each step reads current state and does only what is
 * still missing, so an interrupted or partly failed run is repeated, not repaired.
 * `--max-ops N` stops after N mutations to prove exactly that on TEST.
 *
 * A DRY RUN NEVER CONNECTS. `--dry-run` returns before any client exists: it cannot
 * touch rows, Storage, or even an auth session. It plans from the private spec and
 * the target's last snapshot.
 *
 * THE ADMIN'S OWN SESSION, NEVER A SERVICE KEY (see scripts/lib/connect.ts). So an
 * upload that succeeds here proves the storage policies admit it, and production
 * demands a typed confirmation at a real terminal, per step.
 *
 * Output is counts. Ids, keys, titles and bodies stay in the private folder.
 */

import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { PLATFORM_JOURNEY, PLATFORM_PAGES } from "../src/lib/workspace-v2/spec";
import { NO_VIDEO_LINK, SHARED_RESOURCES } from "../src/lib/workspace-v2/shared-resources";
import { parseArgs } from "./lib/argv";
import { confirmProduction, connectTarget, resolveTarget, type TargetName } from "./lib/connect";
import {
  BUCKET,
  LEARNER_ROOT,
  OVERVIEW_CODE,
  SPEC_PATH,
  TOPICS,
  targetDir,
  type Cr1Spec,
  type SpecFile,
} from "./lib/cr1";
import { withSession } from "./lib/session";

const STEPS = [
  "snapshot",
  "upload",
  "switch",
  "verify",
  "retire",
  "cleanup",
  "restore-objects",
  "rollback",
  "rollback-sql",
  "verify-rollback",
  "remove-new-objects",
] as const;
type Step = (typeof STEPS)[number];

const ARGS = parseArgs(process.argv.slice(2), {
  flags: ["--dry-run"],
  options: ["--step", "--target", "--max-ops", "--phase"],
});

const STEP = ARGS.get("--step") as Step | null;
if (!STEP || !STEPS.includes(STEP)) {
  throw new Error(`--step must be one of: ${STEPS.join(", ")}`);
}
/* No default: every step names its database out loud (the rule connect.ts sets for
   destructive scripts, applied here to all of them). */
const TARGET: TargetName = resolveTarget(ARGS.get("--target"), true);
const DRY_RUN = ARGS.has("--dry-run");
const MAX_OPS = ARGS.get("--max-ops") ? Number(ARGS.get("--max-ops")) : Infinity;
if (Number.isNaN(MAX_OPS) || MAX_OPS < 1) throw new Error("--max-ops must be a positive number");
const PHASE = (ARGS.get("--phase") ?? "retired") as "switched" | "retired";
if (PHASE !== "switched" && PHASE !== "retired") throw new Error('--phase must be "switched" or "retired"');

const DIR = targetDir(TARGET);
const SNAPSHOT_PATH = path.join(DIR, "snapshot.json");
const BACKUP_DIR = path.join(DIR, "backup");
const BACKUP_MANIFEST_PATH = path.join(DIR, "backup-manifest.json");
const LEDGER_PATH = path.join(DIR, "ledger.jsonl");
const BASELINE_PATH = path.join(DIR, "baseline-rows.json");
const ROLLBACK_SQL_PATH = path.join(DIR, "rollback-retired-rows.sql");

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------
interface TopicRow {
  id: string;
  group_id: string;
  section_slug: string;
  slug: string;
  title: string;
  description: string | null;
  intro: string | null;
  icon: string | null;
  image_path: string | null;
  image_position: string | null;
  youtube_url: string | null;
  sort_order: number;
  published: boolean;
  element_id: string;
  element_slug: string;
  element_code: string;
}
interface SectionRow {
  slug: string;
  label: string;
  subtitle: string | null;
  eyebrow: string | null;
  title: string;
  lead: string | null;
  hero_image_path: string | null;
  hero_position: string | null;
  journey_image_path: string | null;
  journey_image_position: string | null;
  journey_desc: string | null;
  journey_icon: string | null;
  youtube_url: string | null;
}
interface FileRow {
  id: string;
  title: string;
  code: string | null;
  doc_key: string | null;
  type: string;
  version: string | null;
  sort_order: number;
  is_public: boolean;
}
interface SnapshotFile extends FileRow {
  element_id: string;
  element_code: string;
  element_slug: string;
  storage_bucket: string;
  storage_path: string;
  etag: string;
  size: number;
  mimetype: string;
}
interface Snapshot {
  takenAt: string;
  target: TargetName;
  sections: SectionRow[];
  topics: TopicRow[];
  guides: Record<string, string | null>;
  files: SnapshotFile[];
}
interface BackupEntry {
  storage_path: string;
  bytes: number;
  sha256: string;
  md5: string;
  mimetype: string;
}
interface StoredObject {
  name: string;
  size: number;
  md5: string;
  mimetype: string;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
class StopAtMaxOps extends Error {}

let ops = 0;
/* A video link is the owner's, set in the CMS at any time, so the release neither adds
   nor removes one. A section with no link can hold a non-URL (NO_VIDEO_LINK), which
   every reader treats as nothing, so it compares as nothing here too. */
function videoLink(value: string | null): string | null {
  return value && /^https?:\/\//i.test(value) ? value : null;
}

function counted(what: string, detail: Record<string, unknown>): void {
  ops += 1;
  mkdirSync(DIR, { recursive: true });
  appendFileSync(LEDGER_PATH, `${JSON.stringify({ at: new Date().toISOString(), step: STEP, what, ...detail })}\n`);
  if (ops >= MAX_OPS) throw new StopAtMaxOps();
}

const sha256 = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
const md5 = (b: Uint8Array) => createHash("md5").update(b).digest("hex");

function loadSpec(): Cr1Spec {
  if (!existsSync(SPEC_PATH)) throw new Error("No private spec. Run: pnpm exec tsx scripts/cr1-extract.ts");
  return JSON.parse(readFileSync(SPEC_PATH, "utf8")) as Cr1Spec;
}

function loadSnapshot(): Snapshot {
  if (!existsSync(SNAPSHOT_PATH)) {
    throw new Error(`No snapshot for ${TARGET}. Run --step snapshot first; nothing changes before one exists.`);
  }
  return JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as Snapshot;
}

function allFiles(spec: Cr1Spec): SpecFile[] {
  return spec.topics.flatMap((t) => [t.overview, t.guide, ...t.templates]);
}

async function rpc<T>(db: SupabaseClient, fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

/* Reads retry, because a read that fails twice in a row tells us nothing about the
   content. Writes never retry: re-running the step is the retry, and it starts by
   looking at what actually committed. */
async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i += 1) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw last;
}

async function downloadBytes(db: SupabaseClient, key: string): Promise<Uint8Array> {
  return withRetry(async () => {
    const { data, error } = await db.storage.from(BUCKET).download(key);
    if (error || !data) throw new Error(`download failed: ${error?.message ?? "no data"}`);
    return new Uint8Array(await data.arrayBuffer());
  });
}

/* The admin's view of the bucket, walked folder by folder. */
async function listObjects(db: SupabaseClient, prefix = ""): Promise<StoredObject[]> {
  const out: StoredObject[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await withRetry(() => db.storage.from(BUCKET).list(prefix, { limit: 1000, offset }));
    if (error) throw new Error(`list: ${error.message}`);
    const rows = data ?? [];
    for (const row of rows) {
      const full = prefix ? `${prefix}/${row.name}` : row.name;
      if (row.id === null) {
        out.push(...(await listObjects(db, full)));
      } else {
        const meta = (row.metadata ?? {}) as { eTag?: string; size?: number; mimetype?: string };
        out.push({
          name: full,
          size: Number(meta.size ?? 0),
          md5: String(meta.eTag ?? "").replace(/"/g, ""),
          mimetype: String(meta.mimetype ?? ""),
        });
      }
    }
    if (rows.length < 1000) return out;
  }
}

async function readTopics(db: SupabaseClient): Promise<TopicRow[]> {
  return rpc<TopicRow[]>(db, "admin_list_platform_topics");
}

async function readFiles(db: SupabaseClient, elementId: string): Promise<FileRow[]> {
  return rpc<FileRow[]>(db, "admin_list_resource_files", { p_element_id: elementId });
}

/* The admin RPCs withhold storage paths by design, so the one sanctioned read of a
   path is the partner's own download RPC. It is is_approved()-gated: an admin who is
   not also approved cannot run this tool, and is told so plainly in preflight. */
async function pathOf(db: SupabaseClient, id: string): Promise<{ storage_bucket: string; storage_path: string; is_public: boolean } | null> {
  const rows = await withRetry(() =>
    rpc<{ storage_bucket: string; storage_path: string; is_public: boolean }[]>(db, "get_resource_download", { p_id: id }),
  );
  return rows[0] ?? null;
}

async function assertCanRead(db: SupabaseClient): Promise<void> {
  const approved = await rpc<boolean>(db, "is_approved");
  if (approved !== true) {
    throw new Error("The signed-in admin is not also approved, so resource paths cannot be read. Approve the account first.");
  }
}

function assertTopicSet(topics: TopicRow[]): void {
  const want = TOPICS.map((t) => t.slug).sort();
  const got = topics.map((t) => t.slug).sort();
  if (JSON.stringify(want) !== JSON.stringify(got)) {
    throw new Error(`Expected the 22 known focus areas, found ${topics.length}. Refusing: this is not the release CR1 was built against.`);
  }
  for (const t of TOPICS) {
    const row = topics.find((x) => x.slug === t.slug)!;
    if (row.section_slug !== t.section || row.element_code !== t.number) {
      throw new Error(`Focus area ${t.number} is not where CR1 expects it. Refusing.`);
    }
  }
}

/* The live state against the snapshot, field by field and row by row by id. Lines name
   focus-area numbers, codes and field names only. `verify-rollback` needs this answer,
   and so do `snapshot` and `switch` before anything has moved: a CMS edit made after the
   snapshot would otherwise be overwritten, then restored to the older version by a later
   rollback, with nothing saying so. `pointsAtNew` says a row has already moved, which
   makes the differences a part-finished switch's own. */
async function differencesFromSnapshot(
  db: SupabaseClient,
  spec: Cr1Spec,
  snapshot: Snapshot,
): Promise<{ fails: string[]; rows: number; pointsAtNew: boolean }> {
  const fails: string[] = [];
  const objects = new Map((await listObjects(db)).map((o) => [o.name, o]));
  const isNew = (key?: string) => Boolean(key?.includes(`/${spec.keyFolder}/`));
  let pointsAtNew = false;

  const topics = await readTopics(db);
  for (const was of snapshot.topics) {
    const cur = topics.find((t) => t.id === was.id);
    if (!cur) {
      fails.push(`${was.element_code}: focus area missing`);
      continue;
    }
    for (const k of ["group_id", "title", "description", "intro", "icon", "image_path", "image_position", "sort_order", "published", "slug"] as const) {
      if (cur[k] !== was[k]) fails.push(`${was.element_code}: ${k}`);
    }
    if (videoLink(cur.youtube_url) !== videoLink(was.youtube_url)) fails.push(`${was.element_code}: youtube_url`);
    const guide = (await rpc<{ simple_guide_md: string | null }[]>(db, "admin_get_element", { p_slug: was.element_slug }))[0]?.simple_guide_md;
    if (guide !== snapshot.guides[was.element_slug]) fails.push(`${was.element_code}: guide body`);
  }

  const seen = new Set<string>();
  for (const t of topics) {
    for (const row of await readFiles(db, t.element_id)) {
      const where = await pathOf(db, row.id);
      if (isNew(where?.storage_path)) pointsAtNew = true;
      const was = snapshot.files.find((f) => f.id === row.id);
      if (!was) {
        fails.push(`${t.element_code}: a row not in the snapshot`);
        continue;
      }
      seen.add(row.id);
      for (const k of ["title", "code", "doc_key", "type", "version", "sort_order", "is_public"] as const) {
        if (row[k] !== was[k]) fails.push(`${t.element_code} ${row.code}: ${k}`);
      }
      if (where?.storage_path !== was.storage_path) fails.push(`${t.element_code} ${row.code}: object key`);
      const obj = objects.get(was.storage_path);
      if (!obj || obj.md5 !== was.etag) fails.push(`${t.element_code} ${row.code}: object bytes`);
    }
  }
  const missing = snapshot.files.filter((f) => !seen.has(f.id));
  if (missing.length) fails.push(`${missing.length} snapshot rows are missing (has the rollback SQL been run?)`);

  const sections = await rpc<SectionRow[]>(db, "admin_list_platform_sections");
  for (const was of snapshot.sections) {
    const cur = sections.find((s) => s.slug === was.slug);
    for (const k of ["label", "title", "subtitle", "eyebrow", "lead", "hero_image_path", "hero_position", "journey_image_path", "journey_image_position", "journey_desc", "journey_icon"] as const) {
      if (cur?.[k] !== was[k]) fails.push(`section ${was.slug}: ${k}`);
    }
    if (videoLink(cur?.youtube_url ?? null) !== videoLink(was.youtube_url)) fails.push(`section ${was.slug}: youtube_url`);
  }
  return { fails, rows: seen.size, pointsAtNew };
}

// ---------------------------------------------------------------------------
// snapshot — current rows and current bytes, BEFORE anything changes
// ---------------------------------------------------------------------------
async function stepSnapshot(db: SupabaseClient, spec: Cr1Spec): Promise<void> {
  await assertCanRead(db);
  const topics = await readTopics(db);
  assertTopicSet(topics);

  const objects = await listObjects(db);
  const byName = new Map(objects.map((o) => [o.name, o]));
  const files: SnapshotFile[] = [];

  for (const t of topics) {
    for (const row of await readFiles(db, t.element_id)) {
      const where = await pathOf(db, row.id);
      if (!where) throw new Error(`A row in ${t.element_code} has no readable path. Refusing to snapshot a partial state.`);
      const obj = byName.get(where.storage_path);
      if (!obj) throw new Error(`A row in ${t.element_code} points at a missing object. Fix this before going further.`);
      files.push({
        ...row,
        element_id: t.element_id,
        element_code: t.element_code,
        element_slug: t.element_slug,
        storage_bucket: where.storage_bucket,
        storage_path: where.storage_path,
        etag: obj.md5,
        size: obj.size,
        mimetype: obj.mimetype,
      });
    }
  }

  const pristine = !files.some((f) => f.storage_path.includes(`/${spec.keyFolder}/`));

  if (existsSync(SNAPSHOT_PATH)) {
    const prior = loadSnapshot();
    if (!pristine) {
      console.log("A snapshot already exists and this target has moved on since. Keeping the original; not overwriting it.");
      return;
    }
    const { fails } = await differencesFromSnapshot(db, spec, prior);
    if (fails.length) {
      throw new Error(`A snapshot exists and this target differs from it (${fails.length} difference(s), first: ${fails[0]}). Move the old private snapshot.json aside deliberately before taking another.`);
    }
    console.log("Snapshot already taken and still matches. Re-verifying the archive.");
  } else if (!pristine) {
    throw new Error("This target already points at CR1 objects and no snapshot exists. Refusing to record a mixed state as the original.");
  }

  /* Every row CR1 will touch must be what CR1 thinks it is. A title edited in the
     CMS since the identity map was written means a human decides, not this script. */
  const problems: string[] = [];
  for (const t of spec.topics) {
    const mine = files.filter((f) => f.element_code === t.number);
    /* By count, because the CMS does not stop a second row taking a code already in use.
       A row this map does not know would pass here and then fail verify for good. */
    const expectedRows = 1 + t.templates.filter((x) => x.oldCode).length + t.retired.length;
    if (mine.length !== expectedRows) {
      problems.push(`${t.number}: ${mine.length} private rows, expected ${expectedRows}. A file has been added or removed in the CMS.`);
    }
    const guide = mine.find((f) => f.doc_key === "guide");
    if (!guide) problems.push(`${t.number}: no guide row`);
    else if (guide.title !== t.guide.oldTitle) problems.push(`${t.number}: guide row has an unexpected title`);
    for (const tmpl of t.templates) {
      if (!tmpl.oldCode) continue;
      const row = mine.find((f) => f.code === tmpl.oldCode && f.doc_key === null);
      if (!row) problems.push(`${t.number} ${tmpl.oldCode}: row missing`);
      else if (row.title !== tmpl.oldTitle) problems.push(`${t.number} ${tmpl.oldCode}: unexpected title`);
    }
    for (const gone of t.retired) {
      const row = mine.find((f) => f.code === gone.code && f.doc_key === null);
      if (!row) problems.push(`${t.number} ${gone.code}: row to retire is missing`);
      else if (row.title !== gone.oldTitle) problems.push(`${t.number} ${gone.code}: unexpected title`);
    }
    if (mine.some((f) => f.code === OVERVIEW_CODE)) problems.push(`${t.number}: an Overview row already exists`);
  }
  if (pristine && problems.length) {
    throw new Error(`The live rows do not match the identity map:\n  ${problems.join("\n  ")}\nNothing was written.`);
  }

  const guides: Record<string, string | null> = {};
  for (const t of topics) {
    const rows = await rpc<{ simple_guide_md: string | null }[]>(db, "admin_get_element", { p_slug: t.element_slug });
    guides[t.element_slug] = rows[0]?.simple_guide_md ?? null;
  }
  const sections = await rpc<SectionRow[]>(db, "admin_list_platform_sections");

  /* The keys can all be back on the old files while the words are still CR1's: an
     interrupted rollback does that. A true original cannot carry CR1's words, and this
     is the one record a rollback relies on. */
  const carriesCr1Words =
    topics.some((t) => spec.topics.find((s) => s.slug === t.slug)?.summary === t.description) ||
    sections.some((s) => sectionTargets().find((w) => w.slug === s.slug)?.lead === s.lead);
  if (!existsSync(SNAPSHOT_PATH) && carriesCr1Words) {
    throw new Error("This target already carries CR1's words, so it cannot be recorded as the original. Nothing was written. If a rollback was interrupted, put the moved snapshot.json back and re-run --step rollback.");
  }

  mkdirSync(DIR, { recursive: true });
  if (!existsSync(SNAPSHOT_PATH)) {
    const snapshot: Snapshot = { takenAt: new Date().toISOString(), target: TARGET, sections, topics, guides, files };
    writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 1));
  }

  /* THE BYTES. The historical 297-file archive is not a backup of this release. */
  const manifest: BackupEntry[] = [];
  let downloaded = 0;
  for (const f of loadSnapshot().files) {
    const file = path.join(BACKUP_DIR, ...f.storage_path.split("/"));
    let bytes: Uint8Array | null = existsSync(file) ? new Uint8Array(readFileSync(file)) : null;
    if (!bytes || md5(bytes) !== f.etag || bytes.length !== f.size) {
      bytes = await downloadBytes(db, f.storage_path);
      if (md5(bytes) !== f.etag || bytes.length !== f.size) {
        throw new Error(`An object in ${f.element_code} did not match its stored checksum on download. Nothing archived as good.`);
      }
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, bytes);
      downloaded += 1;
    }
    /* Read it back: what counts is what is on disk, not what was in memory. */
    const back = new Uint8Array(readFileSync(file));
    if (md5(back) !== f.etag) throw new Error("An archived file did not read back identical.");
    manifest.push({ storage_path: f.storage_path, bytes: back.length, sha256: sha256(back), md5: f.etag, mimetype: f.mimetype });
  }
  writeFileSync(BACKUP_MANIFEST_PATH, JSON.stringify(manifest, null, 1));
  const aggregate = createHash("md5")
    .update([...manifest].sort((a, b) => a.storage_path.localeCompare(b.storage_path)).map((m) => `${m.storage_path}|${m.md5}|${m.bytes}`).join("\n"))
    .digest("hex");

  console.log(`snapshot: ${topics.length} focus areas · ${files.length} private rows · ${sections.length} sections`);
  console.log(`archive:  ${manifest.length} objects verified on disk (${downloaded} downloaded now) · ${manifest.reduce((n, m) => n + m.bytes, 0)} bytes · fingerprint ${aggregate}`);
}

// ---------------------------------------------------------------------------
// upload — new objects at new keys. Inert: no row points at them yet.
// ---------------------------------------------------------------------------
async function stepUpload(db: SupabaseClient, spec: Cr1Spec): Promise<void> {
  const files = allFiles(spec);
  const existing = new Map((await listObjects(db)).map((o) => [o.name, o]));
  let uploaded = 0;
  let already = 0;

  for (const f of files) {
    const bytes = new Uint8Array(readFileSync(path.join(LEARNER_ROOT, f.relPath)));
    if (sha256(bytes) !== f.sha256) throw new Error(`Source file changed since extraction: re-run cr1-extract. (${f.relPath})`);

    const present = existing.get(f.storageKey);
    if (present) {
      if (present.md5 !== f.md5 || present.size !== f.bytes) {
        /* Never overwritten. Two different byte streams claiming one key means
           something is wrong, and upsert would hide which one was right. */
        throw new Error(`An object already at a CR1 key does not match the delivery: ${f.relPath}`);
      }
      already += 1;
      continue;
    }

    const { error } = await db.storage.from(BUCKET).upload(f.storageKey, bytes, { contentType: f.contentType, upsert: false });
    if (error) throw new Error(`upload of ${f.relPath}: ${error.message}. Re-run this step; anything finished is kept.`);
    const back = await downloadBytes(db, f.storageKey);
    if (sha256(back) !== f.sha256) throw new Error(`Uploaded bytes did not read back identical: ${f.relPath}`);
    uploaded += 1;
    counted("upload", { key: f.storageKey, sha256: f.sha256 });
    if (uploaded % 25 === 0) console.log(`  ${uploaded + already}/${files.length}`);
  }
  console.log(`upload: ${uploaded} uploaded and read back · ${already} already present and matching · ${files.length} total`);
}

// ---------------------------------------------------------------------------
// switch — repoint, register, rewrite
// ---------------------------------------------------------------------------
async function assertObjectsReady(db: SupabaseClient, spec: Cr1Spec): Promise<void> {
  const existing = new Map((await listObjects(db)).map((o) => [o.name, o]));
  const missing = allFiles(spec).filter((f) => {
    const o = existing.get(f.storageKey);
    return !o || o.md5 !== f.md5 || o.size !== f.bytes;
  });
  if (missing.length) throw new Error(`${missing.length} new objects are missing or wrong. Run --step upload first. No row was changed.`);
}

function assertArchiveReady(): void {
  if (!existsSync(BACKUP_MANIFEST_PATH)) throw new Error("No verified archive for this target. Run --step snapshot first.");
  const manifest = JSON.parse(readFileSync(BACKUP_MANIFEST_PATH, "utf8")) as BackupEntry[];
  const snapshot = loadSnapshot();
  /* Key by key, not just the count: a retaken snapshot whose archive pass died sits beside
     an older manifest of the same length. */
  const archived = new Map(manifest.map((m) => [m.storage_path, m.md5]));
  if (manifest.length !== snapshot.files.length || snapshot.files.some((f) => archived.get(f.storage_path) !== f.etag)) {
    throw new Error("The archive and the snapshot disagree. Run --step snapshot again.");
  }
  for (const m of manifest) {
    const file = path.join(BACKUP_DIR, ...m.storage_path.split("/"));
    if (!existsSync(file) || sha256(new Uint8Array(readFileSync(file))) !== m.sha256) {
      throw new Error("An archived file is missing or changed. Do not continue until the archive is whole.");
    }
  }
}

/* Identity, never similarity. A replaced row is found by the id its snapshot recorded
   under its old code, so a code that moved on an earlier run cannot confuse a re-run.
   A new row is found by its final code among rows the snapshot has never seen. */
async function ensureRow(
  db: SupabaseClient,
  args: {
    elementId: string;
    existing: FileRow[];
    match: (r: FileRow) => boolean;
    file: SpecFile;
    docKey: "guide" | null;
    code: string | null;
    type: string;
    sortOrder: number;
    mustExist: boolean;
  },
): Promise<"created" | "repointed" | "metadata" | "unchanged"> {
  const row = args.existing.find(args.match);
  if (!row) {
    if (args.mustExist) throw new Error(`A row that must be replaced in place is missing (${args.code ?? "guide"}). Refusing to invent a new identity for it.`);
    const { error } = await db.rpc("admin_register_resource_file", {
      p_element_id: args.elementId,
      p_storage_path: args.file.storageKey,
      p_title: args.file.title,
      p_doc_key: args.docKey,
      p_code: args.code,
      p_type: args.type,
      p_version: "v1",
      p_sort_order: args.sortOrder,
    });
    if (error) throw new Error(`register failed (${error.message}). Re-run --step switch: it looks before it writes.`);
    counted("register", { element: args.elementId, code: args.code, key: args.file.storageKey });
    return "created";
  }

  let result: "repointed" | "metadata" | "unchanged" = "unchanged";
  const where = await pathOf(db, row.id);
  if (!where) throw new Error("A row's path could not be read. Refusing to continue blind.");
  if (where.storage_path !== args.file.storageKey) {
    const { data, error } = await db.rpc("admin_replace_resource_file", {
      p_id: row.id,
      p_element_id: args.elementId,
      p_storage_path: args.file.storageKey,
    });
    if (error) throw new Error(`repoint failed (${error.message}). Re-run --step switch: it looks before it writes.`);
    /* The RPC hands back the old key. It is NOT deleted here; cleanup owns that. */
    counted("repoint", { id: row.id, from: data, to: args.file.storageKey });
    result = "repointed";
  }
  if (row.title !== args.file.title || row.sort_order !== args.sortOrder || row.code !== args.code) {
    const { error } = await db.rpc("admin_update_resource_meta", {
      p_id: row.id,
      p_title: args.file.title,
      p_code: args.code,
      p_type: null,
      p_version: null,
      p_sort_order: args.sortOrder,
    });
    if (error) throw new Error(`metadata update failed (${error.message}). Re-run --step switch.`);
    counted("meta", { id: row.id, title: args.file.title, code: args.code, sort: args.sortOrder });
    if (result === "unchanged") result = "metadata";
  }
  return result;
}

/* Between `switch` and `retire` a retired row still exists. Its old badge could equal
   a final code in the same focus area, and a cross-link resolves by code, so it steps
   aside first. Only the code moves: same row, same title, same file. */
const retiringCode = (oldCode: string) => `OLD-${oldCode}`;

function sectionTargets(): {
  slug: string;
  label: string;
  title: string;
  eyebrow: string;
  lead: string;
  journeyDesc: string | null;
}[] {
  return (Object.keys(PLATFORM_PAGES) as (keyof typeof PLATFORM_PAGES)[]).map((slug) => {
    const page = PLATFORM_PAGES[slug];
    const journey = PLATFORM_JOURNEY.find((j) => j.page === slug);
    return { slug, label: page.label, title: page.title, eyebrow: page.eyebrow, lead: page.lead, journeyDesc: journey?.desc ?? null };
  });
}

async function stepSwitch(db: SupabaseClient, spec: Cr1Spec): Promise<void> {
  await assertCanRead(db);
  const snapshot = loadSnapshot();
  const snapshotIds = new Set(snapshot.files.map((f) => f.id));
  const wasRow = (number: string, oldCode: string) => {
    const hit = snapshot.files.find((f) => f.element_code === number && f.code === oldCode && f.doc_key === null);
    if (!hit) throw new Error(`${number} ${oldCode} is not in the snapshot.`);
    return hit;
  };
  assertArchiveReady();
  await assertObjectsReady(db, spec);
  const topics = await readTopics(db);
  assertTopicSet(topics);

  const drift = await differencesFromSnapshot(db, spec, snapshot);
  if (!drift.pointsAtNew && drift.fails.length) {
    throw new Error(
      `The live content has changed since the snapshot (${drift.fails.length} difference(s), first: ${drift.fails[0]}). Nothing was written. A later rollback would silently undo that change. If a file was added, download it if you need it, delete it at Admin, Content, Files, and re-run this step. If a rollback was interrupted, re-run --step rollback. Otherwise move this target's private snapshot.json aside, re-run --step snapshot, then this step.`,
    );
  }

  await confirmProduction(
    TARGET,
    [
      "  CR1 switch: partner-visible content changes NOW, one row at a time.",
      `  ${spec.totals.guides} guides and 76 templates repointed in place · 29 new rows · ${spec.totals.topics} focus areas rewritten · 5 sections rewritten`,
      "  Old objects are NOT deleted and the 12 retired rows are NOT removed by this step.",
    ].join("\n"),
  );

  const tally = { created: 0, repointed: 0, metadata: 0, unchanged: 0, topics: 0, sections: 0 };

  for (const t of spec.topics) {
    const row = topics.find((x) => x.slug === t.slug)!;
    const existing = await readFiles(db, row.element_id);

    tally[
      await ensureRow(db, {
        elementId: row.element_id,
        existing,
        match: (r) => r.doc_key === "guide",
        file: t.guide,
        docKey: "guide",
        code: null,
        type: "guide",
        sortOrder: 0,
        mustExist: true,
      })
    ] += 1;

    tally[
      await ensureRow(db, {
        elementId: row.element_id,
        existing,
        match: (r) => r.doc_key === null && r.code === OVERVIEW_CODE && !snapshotIds.has(r.id),
        file: t.overview,
        docKey: null,
        code: OVERVIEW_CODE,
        type: "guide",
        sortOrder: 0,
        mustExist: false,
      })
    ] += 1;

    for (const gone of t.retired) {
      const was = wasRow(t.number, gone.code);
      const cur = existing.find((r) => r.id === was.id);
      if (cur && cur.code !== retiringCode(gone.code)) {
        const { error } = await db.rpc("admin_update_resource_meta", {
          p_id: was.id,
          p_title: cur.title,
          p_code: retiringCode(gone.code),
          p_type: null,
          p_version: null,
          p_sort_order: null,
        });
        if (error) throw new Error(`could not set a retiring row aside (${error.message}). Re-run --step switch.`);
        counted("set-aside", { id: was.id, code: gone.code });
      }
    }

    for (const tmpl of t.templates) {
      const id = tmpl.oldCode ? wasRow(t.number, tmpl.oldCode).id : null;
      tally[
        await ensureRow(db, {
          elementId: row.element_id,
          existing,
          match: id
            ? (r) => r.id === id
            : (r) => r.doc_key === null && r.code === tmpl.code && !snapshotIds.has(r.id),
          file: tmpl,
          docKey: null,
          code: tmpl.code,
          type: "form",
          sortOrder: tmpl.sortOrder,
          mustExist: tmpl.oldCode !== null,
        })
      ] += 1;
    }

    const guideNow = (await rpc<{ simple_guide_md: string | null }[]>(db, "admin_get_element", { p_slug: row.element_slug }))[0]?.simple_guide_md;
    const same =
      row.title === t.title &&
      row.description === t.summary &&
      row.intro === t.introMd &&
      guideNow === t.guideMd;
    if (!same) {
      const { error } = await db.rpc("admin_upsert_platform_topic", {
        p_id: row.id,
        p_group_id: row.group_id,
        p_slug: null,
        p_title: t.title,
        p_description: t.summary,
        p_intro: t.introMd,
        p_icon: row.icon,
        p_image_path: row.image_path,
        p_image_position: row.image_position,
        /* This RPC writes the link it is given, blank included, so it gets the one
           already there: a finished video added in the CMS stays. */
        p_youtube_url: row.youtube_url,
        p_sort_order: row.sort_order,
        p_published: null,
        p_element_code: row.element_code,
        p_simple_guide_md: t.guideMd,
      });
      if (error) throw new Error(`focus area ${t.number} update failed (${error.message}). Re-run --step switch.`);
      counted("topic", { number: t.number });
      tally.topics += 1;
    }
  }

  const sections = await rpc<SectionRow[]>(db, "admin_list_platform_sections");
  for (const want of sectionTargets()) {
    const cur = sections.find((s) => s.slug === want.slug);
    if (!cur) throw new Error(`Section ${want.slug} is missing.`);
    if (
      cur.label === want.label &&
      cur.title === want.title &&
      cur.eyebrow === want.eyebrow &&
      cur.lead === want.lead &&
      (want.journeyDesc === null || cur.journey_desc === want.journeyDesc)
    ) {
      continue;
    }
    const { error } = await db.rpc("admin_update_platform_section", {
      p_slug: want.slug,
      p_label: want.label,
      p_title: want.title,
      p_eyebrow: want.eyebrow,
      p_lead: want.lead,
      p_journey_desc: want.journeyDesc,
    });
    if (error) throw new Error(`section ${want.slug} update failed (${error.message}). Re-run --step switch.`);
    counted("section", { slug: want.slug });
    tally.sections += 1;
  }

  console.log(
    `switch: created ${tally.created} · repointed ${tally.repointed} · metadata-only ${tally.metadata} · already right ${tally.unchanged} · focus areas rewritten ${tally.topics} · sections rewritten ${tally.sections}`,
  );
}

// ---------------------------------------------------------------------------
// verify — through the partner's own read and download path
// ---------------------------------------------------------------------------
type ResourceRow = {
  id: string;
  title: string;
  type: string;
  element_id: string | null;
  is_public: boolean;
  sort_order: number;
  code: string | null;
  doc_key: string | null;
};

/* Worth saying once at the end of a verify, and no reason to fail one. */
const notes = new Set<string>();

async function verifyDownload(db: SupabaseClient, id: string, file: SpecFile, fails: string[], label: string): Promise<void> {
  const where = await pathOf(db, id);
  if (!where) return void fails.push(`${label}: no download row for ${file.relPath}`);
  if (where.storage_path !== file.storageKey || where.storage_bucket !== BUCKET || where.is_public) {
    return void fails.push(`${label}: wrong object for ${file.relPath}`);
  }
  /* Exactly what src/lib/resources/actions.ts does: the last path segment names the
     download. If that action ever stops doing so, this stops being evidence. */
  const filename = where.storage_path.split("/").pop() as string;
  if (filename !== file.fileName) return void fails.push(`${label}: filename would be wrong for ${file.relPath}`);
  /* Signed afresh on each try, so a stall cannot outlive the URL's 60 seconds. A 5xx or a
     dropped body is retried like any other read, and if it lasts the line says so,
     because that is the connection and not the content (the runbook tells them apart).
     A 4xx is not retried: a refused URL is not transient. */
  const NO_URL = "no signed URL after retries";
  const got = await withRetry(async () => {
    const signed = await db.storage.from(BUCKET).createSignedUrl(where.storage_path, 60, { download: filename });
    if (signed.error || !signed.data?.signedUrl) throw new Error(NO_URL);
    const r = await fetch(signed.data.signedUrl);
    if (r.status >= 500) throw new Error(`HTTP ${r.status}`);
    return { signedUrl: signed.data.signedUrl, res: r, bytes: new Uint8Array(await r.arrayBuffer()) };
  }).catch((e: Error) => e);
  if (got instanceof Error) {
    return void fails.push(`${label}: ${got.message === NO_URL ? NO_URL : "HTTP 5xx or no connection after retries"} for ${file.relPath}`);
  }
  const { signedUrl, res, bytes } = got;
  if (!res.ok) return void fails.push(`${label}: HTTP ${res.status} for ${file.relPath}`);
  if (sha256(bytes) !== file.sha256) fails.push(`${label}: bytes differ for ${file.relPath}`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.startsWith(file.contentType)) fails.push(`${label}: content type "${type}" for ${file.relPath}`);
  const disposition = decodeURIComponent(res.headers.get("content-disposition") ?? "");
  if (file.contentType === "image/svg+xml") {
    /* Storage hardens an SVG itself: a bare `attachment`, a sandboxing CSP and nosniff,
       and no filename in the header. The browser then takes the name from the URL's
       last segment, which is the supplied filename (confirmed in a real browser). The
       attachment is what this release relies on. The CSP is Storage's own extra, seen
       only on TEST so far, so its absence is reported and does not fail the check. */
    const urlName = decodeURIComponent(new URL(signedUrl).pathname.split("/").pop() ?? "");
    if (!/^attachment/i.test(disposition) || urlName !== file.fileName) {
      fails.push(`${label}: SVG not served as an attachment under its name: ${file.relPath}`);
    }
    if (!/sandbox/.test(res.headers.get("content-security-policy") ?? "")) {
      notes.add("Storage sent an SVG without its sandboxing CSP. It still downloads as an attachment.");
    }
  } else if (!/attachment/i.test(disposition) || !disposition.includes(file.fileName)) {
    fails.push(`${label}: disposition "${disposition}" for ${file.relPath}`);
  }
}

async function signInAs(emailVar: string, passwordVar: string): Promise<SupabaseClient | null> {
  const email = process.env[emailVar];
  const password = process.env[passwordVar];
  if (!email || !password) return null;
  const url = TARGET === "prod" ? process.env.PROD_SUPABASE_URL! : process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = TARGET === "prod" ? process.env.PROD_SUPABASE_PUBLISHABLE_KEY! : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${emailVar} sign-in failed: ${error.message}`);
  return client;
}

async function verifyContent(db: SupabaseClient, spec: Cr1Spec, fails: string[], label: string, withDownloads: boolean): Promise<number> {
  const snapshot = loadSnapshot();
  const topics = await withRetry(() => rpc<(TopicRow & { group_slug: string })[]>(db, "get_platform_topics"));
  const resources = await withRetry(() => rpc<ResourceRow[]>(db, "get_resources"));
  if (topics.length !== 22) fails.push(`${label}: ${topics.length} focus areas, expected 22`);

  const privateRows = resources.filter((r) => !r.is_public);
  const publicRows = resources.filter((r) => r.is_public);
  if (publicRows.length !== 2) fails.push(`${label}: ${publicRows.length} public booklet rows, expected 2`);

  let checkedDownloads = 0;
  let templates = 0;

  for (const t of spec.topics) {
    const row = topics.find((x) => x.slug === t.slug);
    if (!row) {
      fails.push(`${label}: focus area ${t.number} missing`);
      continue;
    }
    const before = snapshot.topics.find((x) => x.slug === t.slug)!;
    if (row.id !== before.id || row.element_id !== before.element_id) fails.push(`${t.number}: identity changed`);
    if (row.title !== t.title) fails.push(`${t.number}: title`);
    if (row.description !== t.summary) fails.push(`${t.number}: summary`);
    if (row.intro !== t.introMd) fails.push(`${t.number}: expanded copy`);
    if (videoLink(row.youtube_url) !== videoLink(before.youtube_url)) fails.push(`${t.number}: video link changed`);
    if (row.image_path !== before.image_path) fails.push(`${t.number}: photograph changed`);
    if (row.sort_order !== before.sort_order) fails.push(`${t.number}: card order changed`);

    const element = await withRetry(() => rpc<{ simple_guide_md: string | null }[]>(db, "get_element", { p_slug: row.element_slug }));
    if (element[0]?.simple_guide_md !== t.guideMd) fails.push(`${t.number}: guide body`);

    const mine = privateRows.filter((r) => r.element_id === row.element_id);
    const guide = mine.filter((r) => r.doc_key === "guide");
    if (guide.length !== 1) fails.push(`${t.number}: ${guide.length} guide rows`);
    else {
      const was = snapshot.files.find((f) => f.element_code === t.number && f.doc_key === "guide");
      if (guide[0].id !== was?.id) fails.push(`${t.number}: guide identity changed`);
      if (guide[0].title !== t.guide.title) fails.push(`${t.number}: guide title`);
      if (withDownloads) {
        await verifyDownload(db, guide[0].id, t.guide, fails, label);
        checkedDownloads += 1;
      }
    }

    const overview = mine.filter((r) => r.doc_key === null && r.code === OVERVIEW_CODE);
    if (overview.length !== 1) fails.push(`${t.number}: ${overview.length} overview rows`);
    else {
      if (overview[0].title !== t.overview.title) fails.push(`${t.number}: overview title`);
      if (snapshot.files.some((f) => f.id === overview[0].id)) fails.push(`${t.number}: overview reused an old identity`);
      if (withDownloads) {
        await verifyDownload(db, overview[0].id, t.overview, fails, label);
        checkedDownloads += 1;
      }
    }

    const grid = mine.filter((r) => r.doc_key === null && r.code !== OVERVIEW_CODE && r.code !== null);
    templates += grid.length;
    for (const tmpl of t.templates) {
      const hit = grid.filter((r) => r.code === tmpl.code);
      if (hit.length !== 1) {
        fails.push(`${t.number} ${tmpl.code}: ${hit.length} rows`);
        continue;
      }
      if (hit[0].title !== tmpl.title) fails.push(`${t.number} ${tmpl.code}: title`);
      if (hit[0].sort_order !== tmpl.sortOrder) fails.push(`${t.number} ${tmpl.code}: order`);
      const was = tmpl.oldCode
        ? snapshot.files.find((f) => f.element_code === t.number && f.code === tmpl.oldCode && f.doc_key === null)
        : null;
      if (tmpl.oldCode && hit[0].id !== was?.id) fails.push(`${t.number} ${tmpl.code}: a replacement lost its id`);
      if (!tmpl.oldCode && snapshot.files.some((f) => f.id === hit[0].id)) fails.push(`${t.number} ${tmpl.code}: a new resource reused an old id`);
      if (withDownloads) {
        await verifyDownload(db, hit[0].id, tmpl, fails, label);
        checkedDownloads += 1;
      }
    }
    for (const gone of t.retired) {
      const was = snapshot.files.find((f) => f.element_code === t.number && f.code === gone.code && f.doc_key === null);
      const still = grid.filter((r) => r.id === was?.id);
      if (PHASE === "retired" && still.length) fails.push(`${t.number} ${gone.code}: retired row still present`);
      if (PHASE === "switched" && still.length !== 1) fails.push(`${t.number} ${gone.code}: expected to still be present`);
    }
    const expectedGrid = t.templates.length + (PHASE === "switched" ? t.retired.length : 0);
    if (grid.length !== expectedGrid) fails.push(`${t.number}: ${grid.length} grid rows, expected ${expectedGrid}`);
  }

  const wantTemplates = PHASE === "retired" ? 83 : 95;
  if (templates !== wantTemplates) fails.push(`${label}: ${templates} grid rows, expected ${wantTemplates}`);

  /* Every cross-link lands on the same single row as its home card, by code. */
  for (const [from, refs] of Object.entries(SHARED_RESOURCES)) {
    if (!spec.topics.some((t) => t.slug === from)) fails.push(`cross-link from unknown topic ${from}`);
    for (const ref of refs) {
      const home = topics.find((x) => x.slug === ref.topicSlug);
      const specHome = spec.topics.find((t) => t.slug === ref.topicSlug);
      const hit = privateRows.filter((r) => r.element_id === home?.element_id && r.code === ref.code && r.doc_key === null);
      if (hit.length !== 1) fails.push(`cross-link ${from} -> ${ref.topicSlug} ${ref.code}: ${hit.length} rows`);
      else if (hit[0].title !== specHome?.templates.find((x) => x.code === ref.code)?.title) {
        fails.push(`cross-link ${from} -> ${ref.topicSlug} ${ref.code}: wrong resource`);
      }
    }
  }

  const sections = await withRetry(() => rpc<SectionRow[]>(db, "get_platform_sections"));
  if (sections.length !== 5) fails.push(`${label}: ${sections.length} sections`);
  for (const want of sectionTargets()) {
    const cur = sections.find((s) => s.slug === want.slug);
    if (!cur) fails.push(`section ${want.slug} missing`);
    else {
      if (cur.label !== want.label) fails.push(`section ${want.slug}: label`);
      if (cur.title !== want.title) fails.push(`section ${want.slug}: title`);
      if (cur.lead !== want.lead) fails.push(`section ${want.slug}: lead`);
      if (cur.eyebrow !== want.eyebrow) fails.push(`section ${want.slug}: eyebrow`);
      if (want.journeyDesc !== null && cur.journey_desc !== want.journeyDesc) fails.push(`section ${want.slug}: card description`);
      const before = snapshot.sections.find((s) => s.slug === want.slug);
      if (videoLink(cur.youtube_url) !== videoLink(before?.youtube_url ?? null)) fails.push(`section ${want.slug}: video link changed`);
    }
  }
  return checkedDownloads;
}

/* A pending or anonymous caller gets nothing: no rows, no path, no bytes. */
async function verifyDenied(client: SupabaseClient, spec: Cr1Spec, fails: string[], label: string): Promise<void> {
  const snapshot = loadSnapshot();
  const topics = await rpc<unknown[]>(client, "get_platform_topics").catch(() => []);
  const resources = await rpc<ResourceRow[]>(client, "get_resources").catch(() => []);
  const sections = await rpc<unknown[]>(client, "get_platform_sections").catch(() => []);
  if (topics.length) fails.push(`${label}: read ${topics.length} focus areas`);
  if (resources.some((r) => !r.is_public)) fails.push(`${label}: read private resource rows`);
  if (sections.length) fails.push(`${label}: read ${sections.length} sections`);
  const element = await rpc<unknown[]>(client, "get_element", { p_slug: spec.topics[0].slug }).catch(() => []);
  if (element.length) fails.push(`${label}: read a guide body`);
  const sampleId = snapshot.files[0].id;
  const row = await rpc<unknown[]>(client, "get_resource_download", { p_id: sampleId }).catch(() => []);
  if (row.length) fails.push(`${label}: resolved a download path`);
  for (const file of [spec.topics[0].guide, spec.topics[0].overview, spec.topics[14].templates[0]]) {
    const { data } = await client.storage.from(BUCKET).createSignedUrl(file.storageKey, 60);
    if (data?.signedUrl) fails.push(`${label}: was issued a signed URL`);
    const { data: bytes } = await client.storage.from(BUCKET).download(file.storageKey);
    if (bytes) fails.push(`${label}: downloaded private bytes`);
  }
}

async function stepVerify(db: SupabaseClient, spec: Cr1Spec): Promise<void> {
  await assertCanRead(db);
  const fails: string[] = [];

  await verifyContent(db, spec, fails, "admin", false);

  /* On TEST the proof runs as a plain approved partner, who reaches the bucket only
     through the is_published_object policy. On production the owner's admin session
     carries it (the account is approved too), and the policy path was proven here. */
  const partner = await signInAs("CR1_PARTNER_EMAIL", "CR1_PARTNER_PASSWORD");
  let downloads = 0;
  if (partner) {
    const isAdmin = await rpc<boolean>(partner, "is_admin");
    if (isAdmin) fails.push("the partner test account is an admin, which would prove nothing");
    downloads = await verifyContent(partner, spec, fails, "partner", true);
    await partner.auth.signOut({ scope: "local" });
  } else {
    downloads = await verifyContent(db, spec, fails, "admin", true);
  }

  const pending = await signInAs("CR1_PENDING_EMAIL", "CR1_PENDING_PASSWORD");
  if (pending) {
    await verifyDenied(pending, spec, fails, "pending");
    await pending.auth.signOut({ scope: "local" });
  }
  const url = TARGET === "prod" ? process.env.PROD_SUPABASE_URL! : process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = TARGET === "prod" ? process.env.PROD_SUPABASE_PUBLISHABLE_KEY! : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  await verifyDenied(createClient(url, key, { auth: { persistSession: false } }), spec, fails, "anonymous");

  const objects = await listObjects(db);
  const newKeys = new Set(allFiles(spec).map((f) => f.storageKey));
  const present = objects.filter((o) => newKeys.has(o.name)).length;
  if (present !== newKeys.size) fails.push(`${present} of ${newKeys.size} new objects present`);

  console.log(`verify (--phase ${PHASE}): ${downloads} downloads byte-checked as ${partner ? "a plain approved partner" : "the approved admin"} · ${present} new objects present · bucket holds ${objects.length}`);
  console.log(`  denied checks: anonymous${pending ? " + pending" : ""}`);
  for (const note of notes) console.log(`  note: ${note}`);
  if (fails.length) {
    console.log(`\nFAILED (${fails.length}):\n  ${fails.slice(0, 60).join("\n  ")}`);
    process.exitCode = 1;
  } else {
    console.log("  ALL CHECKS PASSED");
  }
}

// ---------------------------------------------------------------------------
// retire — rows only, after verification; the bytes stay
// ---------------------------------------------------------------------------
async function stepRetire(db: SupabaseClient, spec: Cr1Spec): Promise<void> {
  await assertCanRead(db);
  const snapshot = loadSnapshot();
  assertArchiveReady();

  /* Replacements must be working before anything is taken away. */
  /* Every replacement's bytes, checked here rather than trusted from an earlier
     `verify`: removing rows must not depend on someone having read that output. */
  const fails: string[] = [];
  await verifyContent(db, spec, fails, "preflight", true);
  /* The rows this step exists to remove are expected to still be counted, on a first
     run or part-way through a re-run, so only those complaints are set aside. */
  const relevant = fails.filter((f) => !/retired row still present|expected to still be present|grid rows, expected/.test(f));
  if (relevant.length) {
    throw new Error(`Replacements are not fully in place (${relevant.length} problems). Nothing retired. First: ${relevant[0]}`);
  }

  await confirmProduction(
    TARGET,
    `  CR1 retire: removes the 12 superseded rows from the library.\n  Their files stay in Storage and in the archive until cleanup.`,
  );

  const topics = await readTopics(db);
  let removed = 0;
  let already = 0;
  for (const t of spec.topics) {
    if (t.retired.length === 0) continue;
    const row = topics.find((x) => x.slug === t.slug)!;
    const existing = await readFiles(db, row.element_id);
    for (const gone of t.retired) {
      /* Identity, not similarity: the exact row the snapshot recorded under this
         code, still carrying its old title and its old object. */
      const was = snapshot.files.find((f) => f.element_code === t.number && f.code === gone.code && f.doc_key === null);
      if (!was) throw new Error(`${t.number} ${gone.code} is not in the snapshot.`);
      const hit = existing.find((r) => r.id === was.id);
      if (!hit) {
        already += 1;
        continue;
      }
      const where = await pathOf(db, hit.id);
      if (was.title !== gone.oldTitle || hit.title !== gone.oldTitle || where?.storage_path !== was.storage_path) {
        throw new Error(`${t.number} ${gone.code} is not the row the snapshot recorded. Refusing to remove it.`);
      }
      const { error } = await db.rpc("admin_delete_resource_file", { p_id: hit.id, p_confirm_title: hit.title });
      if (error) throw new Error(`retire of ${t.number} ${gone.code} failed (${error.message}). Re-run --step retire.`);
      counted("retire", { id: hit.id, code: gone.code, number: t.number });
      removed += 1;
    }
  }
  console.log(`retire: ${removed} rows removed · ${already} already gone · files kept for cleanup or rollback`);
}

// ---------------------------------------------------------------------------
// cleanup — only explicitly mapped, unreferenced, archived objects
// ---------------------------------------------------------------------------
async function stepCleanup(db: SupabaseClient, spec: Cr1Spec): Promise<void> {
  await assertCanRead(db);
  const snapshot = loadSnapshot();
  assertArchiveReady();

  const fails: string[] = [];
  await verifyContent(db, spec, fails, "preflight", true);
  if (fails.length) throw new Error(`The retired state does not verify (${fails.length} problems). No object removed. First: ${fails[0]}`);

  const newKeys = new Set(allFiles(spec).map((f) => f.storageKey));
  const targets = snapshot.files.map((f) => f.storage_path);
  if (targets.some((k) => newKeys.has(k))) throw new Error("A superseded key collides with a new key. Refusing.");

  const present = new Set((await listObjects(db)).map((o) => o.name));
  const toRemove = targets.filter((k) => present.has(k));

  await confirmProduction(
    TARGET,
    `  CR1 cleanup: permanently removes ${toRemove.length} superseded objects from Storage.\n  Each is in the private archive. Rollback after this needs --step restore-objects.`,
  );

  let removed = 0;
  for (let i = 0; i < toRemove.length; i += 20) {
    const batch = toRemove.slice(i, i + 20);
    /* Asked again immediately before the delete, not once at the start. */
    const referenced = await rpc<{ storage_path: string }[]>(db, "admin_referenced_paths_among", { p_paths: batch });
    if (referenced.length) {
      throw new Error(`${referenced.length} object(s) in this batch are referenced by a live row. Stopping; nothing in this batch was removed.`);
    }
    const { error } = await db.storage.from(BUCKET).remove(batch);
    if (error) throw new Error(`remove failed (${error.message}). Re-run --step cleanup.`);
    for (const key of batch) counted("remove-old", { key });
    removed += batch.length;
  }

  const after = await listObjects(db);
  const stray = after.filter((o) => !newKeys.has(o.name));
  console.log(`cleanup: ${removed} superseded objects removed · bucket now holds ${after.length} · not in the CR1 set: ${stray.length}`);
}

// ---------------------------------------------------------------------------
// rollback
// ---------------------------------------------------------------------------
async function stepRestoreObjects(db: SupabaseClient): Promise<void> {
  const manifest = JSON.parse(readFileSync(BACKUP_MANIFEST_PATH, "utf8")) as BackupEntry[];
  assertArchiveReady();
  const present = new Map((await listObjects(db)).map((o) => [o.name, o]));
  const missing = manifest.filter((m) => !present.has(m.storage_path));

  await confirmProduction(TARGET, `  CR1 restore-objects: re-uploads ${missing.length} archived objects to their original keys.`);

  let restored = 0;
  for (const m of manifest) {
    const cur = present.get(m.storage_path);
    if (cur) {
      if (cur.md5 !== m.md5) throw new Error("An object at an original key does not match the archive. Refusing to overwrite it.");
      continue;
    }
    const bytes = new Uint8Array(readFileSync(path.join(BACKUP_DIR, ...m.storage_path.split("/"))));
    const { error } = await db.storage.from(BUCKET).upload(m.storage_path, bytes, { contentType: m.mimetype, upsert: false });
    if (error) throw new Error(`restore failed (${error.message}). Re-run --step restore-objects.`);
    const back = await downloadBytes(db, m.storage_path);
    if (md5(back) !== m.md5) throw new Error("A restored object did not read back identical.");
    restored += 1;
    counted("restore", { key: m.storage_path });
  }
  console.log(`restore-objects: ${restored} restored and read back · ${manifest.length - restored} already present`);
}

/* Everything the admin RPCs can put back. Rows retired at --step retire come back
   through --step rollback-sql instead: their ORIGINAL ids can only be restored by
   SQL, and an exact rollback means exact ids. */
async function stepRollback(db: SupabaseClient, spec: Cr1Spec): Promise<void> {
  await assertCanRead(db);
  const snapshot = loadSnapshot();
  const objects = new Set((await listObjects(db)).map((o) => o.name));
  const absent = snapshot.files.filter((f) => !objects.has(f.storage_path));
  if (absent.length) {
    throw new Error(`${absent.length} original objects are gone (cleanup has run). Run --step restore-objects first. Nothing was changed.`);
  }
  const topics = await readTopics(db);
  assertTopicSet(topics);

  /* Found here, before the first write, so a rollback cannot stop half way through the
     library. The check inside the loop stays for a row added after this one ran. */
  const known = new Map(snapshot.files.map((f) => [f.id, f]));
  const foreign = new Set<string>();
  const detached: string[] = [];
  for (const t of topics) {
    for (const row of await readFiles(db, t.element_id)) {
      const where = await pathOf(db, row.id);
      const onCr1Key = where?.storage_path.includes(`/${spec.keyFolder}/`);
      const was = known.get(row.id);
      if (!was) {
        if (!onCr1Key) foreign.add(t.element_code);
      } else if (where && !onCr1Key && where.storage_path !== was.storage_path) {
        detached.push(`${t.element_code} ${row.code ?? "guide"}`);
      }
    }
  }
  if (foreign.size) {
    throw new Error(
      `Focus area(s) ${[...foreign].join(", ")} hold a file added in the CMS since CR1, or a replacement for a file CR1 added, which this rollback will not remove. This run changed nothing. Download it if you need it, delete it at Admin, Content, Files (if the focus area is in Draft, publish it instead), then re-run --step rollback.`,
    );
  }
  /* These rows were CR1's replacements and have been replaced again. The rollback puts them
     back correctly, so this is no reason to refuse, but deleting one in the CMS would be
     worse: a snapshot row must stay. So: say so, and let a person stop and save the file. */
  if (detached.length) {
    console.log(
      `  Replaced in the CMS since CR1: ${detached.join(", ")}.\n  Rollback puts these rows back on the snapshot's file. Each replacement stays in the private bucket, attached to nothing, reachable only in the Supabase Storage browser. Stop now and download it first if you need it.`,
    );
  }

  await confirmProduction(
    TARGET,
    "  CR1 rollback: puts the previous release's rows, focus-area text, guide bodies and section copy back,\n  and removes the rows CR1 added. New objects stay until --step remove-new-objects.",
  );

  const tally = { deleted: 0, repointed: 0, metadata: 0, topics: 0, sections: 0 };

  for (const t of topics) {
    const existing = await readFiles(db, t.element_id);
    for (const row of existing) {
      if (known.has(row.id)) continue;
      const where = await pathOf(db, row.id);
      if (!where?.storage_path.includes(`/${spec.keyFolder}/`)) {
        throw new Error(`${t.element_code}: a file was added or replaced in the CMS while this rollback ran. Delete it at Admin, Content, Files, then re-run --step rollback.`);
      }
      const { error } = await db.rpc("admin_delete_resource_file", { p_id: row.id, p_confirm_title: row.title });
      if (error) throw new Error(`rollback delete failed (${error.message}). Re-run --step rollback.`);
      counted("rollback-delete", { id: row.id });
      tally.deleted += 1;
    }
    for (const row of existing) {
      const was = snapshot.files.find((f) => f.id === row.id);
      if (!was) continue;
      const where = await pathOf(db, row.id);
      if (where?.storage_path !== was.storage_path) {
        const { data, error } = await db.rpc("admin_replace_resource_file", {
          p_id: row.id,
          p_element_id: t.element_id,
          p_storage_path: was.storage_path,
        });
        if (error) throw new Error(`rollback repoint failed (${error.message}). Re-run --step rollback.`);
        /* The RPC hands back the key it left. The ledger is the only trace of a file
           replaced in the CMS once a re-run no longer sees it. */
        counted("rollback-repoint", { id: row.id, from: data, to: was.storage_path });
        tally.repointed += 1;
      }
      if (row.title !== was.title || row.sort_order !== was.sort_order || row.code !== was.code) {
        const { error } = await db.rpc("admin_update_resource_meta", {
          p_id: row.id,
          p_title: was.title,
          p_code: was.code,
          p_type: was.type,
          p_version: was.version,
          p_sort_order: was.sort_order,
        });
        if (error) throw new Error(`rollback metadata failed (${error.message}). Re-run --step rollback.`);
        counted("rollback-meta", { id: row.id });
        tally.metadata += 1;
      }
    }

    const was = snapshot.topics.find((x) => x.slug === t.slug)!;
    const guideNow = (await rpc<{ simple_guide_md: string | null }[]>(db, "admin_get_element", { p_slug: t.element_slug }))[0]?.simple_guide_md;
    const same = t.title === was.title && t.description === was.description && t.intro === was.intro && videoLink(t.youtube_url) === videoLink(was.youtube_url) && guideNow === snapshot.guides[t.element_slug];
    if (!same) {
      const { error } = await db.rpc("admin_upsert_platform_topic", {
        p_id: t.id,
        p_group_id: was.group_id,
        p_slug: null,
        p_title: was.title,
        p_description: was.description,
        p_intro: was.intro,
        p_icon: was.icon,
        p_image_path: was.image_path,
        p_image_position: was.image_position,
        p_youtube_url: was.youtube_url,
        p_sort_order: was.sort_order,
        p_published: was.published,
        p_element_code: was.element_code,
        p_simple_guide_md: snapshot.guides[t.element_slug],
      });
      if (error) throw new Error(`rollback of ${t.element_code} failed (${error.message}). Re-run --step rollback.`);
      counted("rollback-topic", { number: t.element_code });
      tally.topics += 1;
    }
  }

  const sections = await rpc<SectionRow[]>(db, "admin_list_platform_sections");
  for (const was of snapshot.sections) {
    const cur = sections.find((s) => s.slug === was.slug);
    if (cur && cur.label === was.label && cur.title === was.title && cur.eyebrow === was.eyebrow && cur.lead === was.lead && cur.journey_desc === was.journey_desc && videoLink(cur.youtube_url) === videoLink(was.youtube_url)) continue;
    const { error } = await db.rpc("admin_update_platform_section", {
      p_slug: was.slug,
      p_label: was.label,
      p_title: was.title,
      p_eyebrow: was.eyebrow,
      p_lead: was.lead,
      p_journey_desc: was.journey_desc,
      /* A blank keeps whatever is there, which is right unless the link has to change.
         Taking a link off has to be said, so "none" is written only then. */
      p_youtube_url:
        videoLink(cur?.youtube_url ?? null) === videoLink(was.youtube_url)
          ? null
          : (was.youtube_url ?? NO_VIDEO_LINK),
    });
    if (error) throw new Error(`rollback of section ${was.slug} failed (${error.message}). Re-run --step rollback.`);
    counted("rollback-section", { slug: was.slug });
    tally.sections += 1;
  }

  const stillRetired = snapshot.files.length - (await Promise.all(topics.map((t) => readFiles(db, t.element_id)))).flat().length;
  console.log(`rollback: removed ${tally.deleted} added rows · repointed ${tally.repointed} · metadata ${tally.metadata} · focus areas ${tally.topics} · sections ${tally.sections}`);
  if (detached.length) console.log(`  files replaced in the CMS and now attached to nothing: ${detached.length}`);
  console.log(`  rows still to restore with their original ids: ${stillRetired}. Next: --step rollback-sql, and a person runs that file.`);
}

const sq = (v: string | null | undefined) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);

/* Offline, and it writes a private file rather than running anything. Restoring an
   original id needs SQL, and production SQL is run by the owner, by hand. */
function stepRollbackSql(spec: Cr1Spec): void {
  const snapshot = loadSnapshot();
  const retired = spec.topics.flatMap((t) =>
    t.retired.map((g) => {
      const row = snapshot.files.find((f) => f.element_code === t.number && f.code === g.code && f.doc_key === null);
      if (!row) throw new Error(`${t.number} ${g.code} is not in the snapshot.`);
      return row;
    }),
  );
  const baseline = existsSync(BASELINE_PATH)
    ? new Map((JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as { id: string; created_at: string }[]).map((r) => [r.id, r.created_at]))
    : null;
  if (!baseline) console.warn("  ! no baseline-rows.json for this target: restored rows would take now() as created_at");

  const values = retired.map((r) => {
    const created = baseline?.get(r.id);
    return `  (${sq(r.id)}, ${sq(r.title)}, ${sq(r.type)}, null, ${sq(r.element_id)}, ${sq(r.version)}, ${sq(r.storage_bucket)}, ${sq(r.storage_path)}, false, ${r.sort_order}, ${created ? `${sq(created)}::timestamptz` : "now()"}, ${sq(r.code)}, null)`;
  });
  const sql = [
    `-- PRIVATE. CR1 rollback for target "${TARGET}": the ${retired.length} retired rows, with their original ids.`,
    "-- Run AFTER --step rollback, in the Supabase SQL Editor of this same project.",
    "begin;",
    "insert into public.resources (id, title, type, focus_area_code, element_id, version, storage_bucket, storage_path, is_public, sort_order, created_at, code, doc_key)",
    "values",
    `${values.join(",\n")}`,
    "on conflict (id) do nothing;",
    "do $$",
    "begin",
    `  if (select count(*) from public.resources where is_public = false) <> ${snapshot.files.length} then`,
    `    raise exception 'expected ${snapshot.files.length} private rows after rollback; run --step rollback first';`,
    "  end if;",
    "end $$;",
    "commit;",
    "",
  ].join("\n");
  mkdirSync(DIR, { recursive: true });
  writeFileSync(ROLLBACK_SQL_PATH, sql);
  console.log(`rollback-sql: wrote ${retired.length} rows to the target's private folder (rollback-retired-rows.sql). Nothing was run.`);
}

async function stepVerifyRollback(db: SupabaseClient, spec: Cr1Spec): Promise<void> {
  await assertCanRead(db);
  const snapshot = loadSnapshot();
  const { fails, rows } = await differencesFromSnapshot(db, spec, snapshot);

  console.log(`verify-rollback: ${snapshot.topics.length} focus areas · ${rows} rows · ${snapshot.sections.length} sections compared with the snapshot`);
  if (fails.length) {
    console.log(`\nFAILED (${fails.length}):\n  ${fails.slice(0, 40).join("\n  ")}`);
    process.exitCode = 1;
  } else {
    console.log("  MATCHES THE SNAPSHOT EXACTLY");
  }
}

async function stepRemoveNewObjects(db: SupabaseClient, spec: Cr1Spec): Promise<void> {
  const keys = allFiles(spec).map((f) => f.storageKey);
  const referenced = await rpc<{ storage_path: string }[]>(db, "admin_referenced_paths_among", { p_paths: keys });
  if (referenced.length) throw new Error(`${referenced.length} new objects are still referenced by live rows. Roll the rows back first.`);
  const present = new Set((await listObjects(db)).map((o) => o.name));
  const toRemove = keys.filter((k) => present.has(k));
  await confirmProduction(TARGET, `  CR1 remove-new-objects: removes ${toRemove.length} CR1 objects that no row references.`);
  for (let i = 0; i < toRemove.length; i += 20) {
    const batch = toRemove.slice(i, i + 20);
    const again = await rpc<{ storage_path: string }[]>(db, "admin_referenced_paths_among", { p_paths: batch });
    if (again.length) throw new Error("A row started referencing a new object. Stopping.");
    const { error } = await db.storage.from(BUCKET).remove(batch);
    if (error) throw new Error(`remove failed (${error.message}). Re-run this step.`);
    for (const key of batch) counted("remove-new", { key });
  }
  console.log(`remove-new-objects: ${toRemove.length} removed · ${keys.length - toRemove.length} already absent`);
}

// ---------------------------------------------------------------------------
// The dry run — offline by construction
// ---------------------------------------------------------------------------
function planOffline(spec: Cr1Spec): void {
  const have = existsSync(SNAPSHOT_PATH);
  console.log(`DRY RUN — ${STEP} on ${TARGET}. No client was created; nothing can be touched.`);
  console.log(`  snapshot for this target: ${have ? "present" : "not taken yet"}`);
  const replaced = spec.topics.reduce((n, t) => n + t.templates.filter((x) => x.oldCode).length, 0);
  const added = spec.topics.reduce((n, t) => n + t.templates.filter((x) => !x.oldCode).length, 0);
  const retired = spec.topics.reduce((n, t) => n + t.retired.length, 0);
  const links = spec.topics.reduce((n, t) => n + t.crossLinks.length, 0);
  switch (STEP) {
    case "snapshot":
      console.log("  WOULD read rows through admin RPCs and download every current private object to the private archive.");
      break;
    case "upload":
      console.log(`  WOULD upload ${spec.totals.learner} objects to new keys under ${spec.keyFolder}/, skipping any already present and matching.`);
      break;
    case "switch":
      console.log(`  WOULD repoint ${spec.totals.guides} guide rows and ${replaced} template rows in place, keeping their ids.`);
      console.log(`  WOULD register ${spec.totals.overviews} Overview rows and ${added} new template rows.`);
      console.log(`  WOULD rewrite ${spec.totals.topics} focus areas (title, summary, expanded copy, guide body) and 5 sections.`);
      break;
    case "verify":
      console.log(`  WOULD byte-check ${spec.totals.learner} downloads, ${links} cross-links, and denied access (phase ${PHASE}).`);
      break;
    case "retire":
      console.log(`  WOULD remove ${retired} rows after verifying the replacements. Their objects stay.`);
      break;
    case "cleanup":
      console.log("  WOULD remove only the objects named in this target's snapshot, unreferenced and archived.");
      break;
    case "restore-objects":
      console.log("  WOULD re-upload missing archived objects to their original keys.");
      break;
    case "rollback":
      console.log("  WOULD restore rows, focus areas, guide bodies and sections from the snapshot, and remove rows CR1 added.");
      break;
    case "rollback-sql":
      console.log(`  WOULD write a private SQL file restoring ${retired} rows with their original ids. Offline even without --dry-run.`);
      break;
    case "verify-rollback":
      console.log("  WOULD compare the live state with the snapshot field by field.");
      break;
    case "remove-new-objects":
      console.log(`  WOULD remove up to ${spec.totals.learner} new objects, only if no row references them.`);
      break;
  }
}

// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const spec = loadSpec();

  if (DRY_RUN) {
    planOffline(spec);
    return;
  }
  if (STEP === "rollback-sql") {
    stepRollbackSql(spec);
    return;
  }

  const db = await connectTarget(TARGET);
  await withSession(db, async () => {
    switch (STEP) {
      case "snapshot":
        return stepSnapshot(db, spec);
      case "upload":
        await confirmProduction(TARGET, `  CR1 upload: adds up to ${spec.totals.learner} new objects at new keys.\n  Inert: no row points at them, so no partner can reach them yet.`);
        return stepUpload(db, spec);
      case "switch":
        return stepSwitch(db, spec);
      case "verify":
        return stepVerify(db, spec);
      case "retire":
        return stepRetire(db, spec);
      case "cleanup":
        return stepCleanup(db, spec);
      case "restore-objects":
        return stepRestoreObjects(db);
      case "rollback":
        return stepRollback(db, spec);
      case "verify-rollback":
        return stepVerifyRollback(db, spec);
      case "remove-new-objects":
        return stepRemoveNewObjects(db, spec);
    }
  });
}

main().catch((e) => {
  if (e instanceof StopAtMaxOps) {
    console.log(`\nStopped on purpose after ${ops} mutation(s) (--max-ops). Re-run the same step to finish.`);
    return;
  }
  console.error("\nCR1 STEP FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
