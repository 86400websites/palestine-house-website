/**
 * scripts/load-content.ts — PP6b LOADER.
 *
 * Takes what `scripts/ingest-content.ts` extracted into `docs/content-v2-spec.json`
 * and creates it in the database as DRAFT, plus its template files in the private
 * Storage bucket. This is the pipeline PP6c reruns over all 22 focus areas; PP6b
 * proves it on one.
 *
 *   pnpm exec tsx scripts/load-content.ts --focus 1.1 --dry-run
 *   pnpm exec tsx scripts/load-content.ts --focus 1.1
 *   pnpm exec tsx scripts/load-content.ts --all                   # PP6c, TEST
 *   pnpm exec tsx scripts/load-content.ts --all --target prod     # PP7, the owner
 *
 * IT DRIVES THE CMS's OWN RPCs, AND THAT IS THE POINT
 * ---------------------------------------------------
 * Every write goes through `admin_upsert_platform_group`,
 * `admin_upsert_platform_topic` and `admin_register_resource_file` — the exact
 * functions the three admin screens call. Nothing is inserted directly. Three
 * reasons, in order of how much they matter:
 *
 *   1. `platform_topics.published` and `platform_groups.published` default to
 *      TRUE at the column level (0029 made them additive so the live 33 were
 *      untouched). A hand-written INSERT therefore lands LIVE. The RPCs default
 *      to Draft. Loading unreleased content through raw SQL would publish it the
 *      moment it appeared, which is the one thing this sprint must not do.
 *   2. Creating a focus area is a two-table transaction — `platform_topics`
 *      .element_id is NOT NULL, UNIQUE and a foreign key — and the RPC is where
 *      that transaction lives. Doing it by hand invites a half-created row.
 *   3. Loading content through the same path the owner uses is what makes the
 *      pilot evidence about the CMS rather than about a script.
 *
 * It also uses the ADMIN's OWN SESSION, never a service key: the 0029 storage
 * policies admit `is_admin()`, so an upload that works here is an upload that
 * works from the browser. A service key would prove nothing about either.
 *
 * SAFETY
 * ------
 * TEST BY DEFAULT. Production requires `--target prod`, typed out, and PP7 built
 * it so that reaching production by accident is impossible rather than unlikely:
 * the `PROD_*` variables are read BY NAME with **no fallback** to the default
 * client, the host is asserted exactly before the first request, and a typed
 * confirmation naming the production project ref is demanded after every guard
 * has passed and before the first write. If stdin is not a terminal it refuses
 * outright — a production load has a person at the keyboard, so it cannot be
 * reached from a pipe, a CI job or an agent. Full reasoning at `connect()`.
 *
 * Credentials are read out of `.env.local` by this script — never passed on a
 * command line, never printed.
 *
 * IDEMPOTENT. Re-running finds what it created last time — group by slug, focus
 * area by slug, and a file by its CODE (or doc_key for the guide, never by its
 * title, which changes) — and updates instead of duplicating, so a partial run
 * can simply be repeated.
 *
 * WHAT "IT NEVER PUBLISHES" DOES AND DOES NOT MEAN. Stated too broadly at first
 * and corrected by the independent review, 2026-08-15:
 *   - it never sets a focus area Live. `p_published` is null on update, which
 *     the RPC reads as "leave the current state alone", and creates default to
 *     Draft.
 *   - it DOES create a group published, matching the CMS's own createGroupAction:
 *     a group is only a heading, an unpublished one would hide every focus area
 *     filed under it, and a group with no published topic returns no rows to a
 *     partner anyway — so it is invisible until its first focus area goes Live.
 *   - and updating an already-LIVE focus area would put new words in front of
 *     partners immediately, which is a publishing act even though no flag
 *     moved. It therefore REFUSES to touch a Live row unless --allow-live is
 *     passed deliberately.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import * as readline from "node:readline/promises";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseArgs } from "./lib/argv";
import { withSession } from "./lib/session";
import { findByCode } from "./lib/identity";
import { assertCodesHaveNotShifted as checkShift } from "./lib/shift";

const ROOT = process.cwd();
const SPEC = path.join(ROOT, "docs/content-v2-spec.json");
const SRC = path.join(
  ROOT,
  "docs/source-assets/Resource/Palestine House Website Content - Complet and Formatted",
);
const TOPIC_PHOTO_DIR = path.join(ROOT, "public/assets/workspace/topics");

/* The non-production project (PROJECT-STATUS.md §6). Vercel Preview and
   Development point here, which is why the pilot is reviewed here and why this
   script has no production mode at all. */
const TEST_REF = "sdszcralogcrujtyghig";
/* PROJECT-STATUS.md §6. Reachable only via `--target prod` and only with the
   PROD_* credentials; see TARGETS below. */
const PROD_REF = "jwogtqizqujwhbvpoziu";
const BUCKET = "resources";

/* Mirrors src/lib/admin/file-actions.ts. Word documents and PDFs only. */
const CONTENT_TYPE: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

/* STRICT. An unknown argument is an error, never a no-op — the review of
   2026-08-16 rated this Certain, because D-PP-r documented `--target prod`,
   the owner was told to use it, and this script silently ignored it and ran
   against TEST. `--target` is accepted here ONLY so that it fails loudly with
   an explanation until PP7 implements it; it is not a working flag. */
const ARGS = parseArgs(process.argv.slice(2), {
  flags: ["--dry-run", "--all", "--allow-live", "--replace-files", "--photos-only", "--allow-retitle"],
  options: ["--focus", "--target"],
});

/* D-PP-r, built at PP7 step 7-h. TEST unless production is asked for by name.
   Anything else is an error rather than a default — "--target production" or
   "--target PROD" silently becoming TEST is the same class of failure as the
   ignored argument that made this flag necessary in the first place. */
const TARGET_ARG = ARGS.get("--target");
if (TARGET_ARG !== null && TARGET_ARG !== "test" && TARGET_ARG !== "prod") {
  throw new Error(`--target must be "test" or "prod", not ${JSON.stringify(TARGET_ARG)}.`);
}
const TARGET: "test" | "prod" = TARGET_ARG === "prod" ? "prod" : "test";

const DRY_RUN = ARGS.has("--dry-run");
const ALL = ARGS.has("--all");
/* Permission to rewrite a focus area partners can already see. Off by default. */
const ALLOW_LIVE = ARGS.has("--allow-live");
/* Re-upload the bytes of files that are already registered. Off by default,
   because matching by code cannot tell an edited document from an unchanged
   one — see replaceBytes(). */
const REPLACE_FILES = ARGS.has("--replace-files");
/* Copy the mapped topic photographs into the working tree and stop, without
   connecting to anything. Added at PP6c step 6c-c so the 21 new binaries land
   in their own reviewable commit instead of inside the content-load commit,
   and so a later photo remap in content-migration-map.md §4 can be applied on
   its own. It reuses ensurePhoto() rather than reimplementing the copy — one
   mechanism, which is the same reason D-PP-r put the production path behind a
   flag on this script instead of in a second script. Safe without the preflight
   guards because it writes no database row and touches no partner-visible
   surface: every target filename is new (verified at 6c-c — 22 distinct sources
   to 22 distinct targets, none of which is a live photo). */
const PHOTOS_ONLY = ARGS.has("--photos-only");
/* Confirmation that a code whose registered title no longer matches the spec is
   a genuine RENAME and not a deletion-induced code shift. Off by default: the
   two are indistinguishable from title and code alone, and guessing wrong
   attaches one document's name to another's bytes (M1, PP7). */
const ALLOW_RETITLE = ARGS.has("--allow-retitle");
const FOCUS = ARGS.get("--focus");

if (!ALL && !FOCUS) {
  throw new Error("Pass --focus <N.M> (e.g. --focus 1.1) or --all");
}

interface TemplateEntry {
  code: string;
  title: string;
  fileName: string;
  relPath: string;
  type: string;
  sortOrder: number;
}
interface FocusAreaEntry {
  number: string;
  sectionSlug: string;
  groupSlug: string;
  slug: string;
  title: string;
  code: string;
  summary: string;
  guideMd: string;
  guideFile: { fileName: string; relPath: string; title: string };
  photo: { source: string; target: string; imagePath: string };
  templates: TemplateEntry[];
}
interface ContentSpec {
  sections: { slug: string; label: string; groupSlug: string; groupName: string }[];
  focusAreas: FocusAreaEntry[];
}

/* Byte-for-byte the objectKey() in src/lib/admin/file-actions.ts, minus its
   time-based tail: a deterministic stem is what makes a re-run recognise the
   object it wrote last time instead of orphaning it. The RPC re-validates the
   shape server-side either way (no leading slash, no traversal, no scheme). */
function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/* A UNIQUE key per create, exactly as src/lib/admin/file-actions.ts does.
   PP6b first used a deterministic key so re-runs would be idempotent, and the
   independent review showed what that costs: `upsert: true` plus a lookup that
   could miss an existing row meant a create could overwrite a LIVE object, fail
   registration on the unique (bucket, path), and then have its compensation
   delete the object the original row still pointed at. A harmless rename would
   have broken a working download.
   Idempotence does not need a predictable key — it needs a stable IDENTITY to
   match on, which is now the template code (or doc_key for the guide). With
   that, a create only ever happens for a file that has no row, so a fresh key
   can never collide with anything in use. */
function objectKey(elementSlug: string, prefix: string, title: string, ext: string): string {
  const tail = Date.now().toString(36);
  return `${elementSlug}/${prefix}-${slugify(title) || "file"}-${tail}.${ext}`;
}

function step(message: string): void {
  console.log(`  ${message}`);
}

/**
 * THE TWO TARGETS (D-PP-r, built at PP7 step 7-h).
 *
 * One pipeline, two destinations — rejected alternatives on the record: a
 * separate production script would have been a second implementation of a
 * pipeline that took two blocking review rounds to get right, and the bugs would
 * have been in the copy rather than in the original.
 *
 * Everything here is designed so that an accidental production write is
 * IMPOSSIBLE rather than merely unlikely:
 *
 *   - TEST is the default. Production requires `--target prod`, typed out.
 *   - production reads the `PROD_*` variables BY NAME and **never falls back**
 *     to the default client if they are absent. That is the specific defect the
 *     `.env.local` incident of 2026-08-16 would have become under a laxer
 *     design: `.env.local` had been pointed at production, and a script that
 *     "just uses whatever is configured" would have written there believing it
 *     was on TEST.
 *   - each target asserts its own host EXACTLY, over https, before the first
 *     request — so even correct-looking credentials pointed at the wrong project
 *     stop the run.
 *   - and no service key, ever. The admin's own session, because an upload that
 *     succeeds through RLS proves the storage policies admit it, whereas one
 *     that succeeds through a service key proves nothing.
 */
const TARGETS = {
  test: {
    label: "TEST",
    ref: TEST_REF,
    urlVar: "NEXT_PUBLIC_SUPABASE_URL",
    keyVar: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    emailVar: "TEST_PARTNER_EMAIL",
    passwordVar: "TEST_PARTNER_PASSWORD",
  },
  prod: {
    label: "PRODUCTION",
    ref: PROD_REF,
    urlVar: "PROD_SUPABASE_URL",
    keyVar: "PROD_SUPABASE_PUBLISHABLE_KEY",
    emailVar: "PROD_ADMIN_EMAIL",
    passwordVar: "PROD_ADMIN_PASSWORD",
  },
} as const;

async function connect(): Promise<SupabaseClient> {
  const t = TARGETS[TARGET];
  process.loadEnvFile(path.join(ROOT, ".env.local"));

  const url = process.env[t.urlVar];
  const key = process.env[t.keyVar];
  const email = process.env[t.emailVar];
  const password = process.env[t.passwordVar];

  /* NO FALLBACK. Named variables or nothing. */
  const missing = [
    [t.urlVar, url],
    [t.keyVar, key],
    [t.emailVar, email],
    [t.passwordVar, password],
  ]
    .filter(([, v]) => !v)
    .map(([n]) => n);
  if (missing.length) {
    throw new Error(
      `--target ${TARGET} needs ${missing.join(", ")} in .env.local.\n` +
        `This script reads ONLY those names for this target and never falls back to another ` +
        `client, so a .env.local pointed somewhere else cannot silently redirect the run.`,
    );
  }

  /* Exact host match over https, NOT a substring test, so a look-alike host can
     never receive a session or a write. */
  const parsed = new URL(url!);
  if (parsed.protocol !== "https:" || parsed.hostname !== `${t.ref}.supabase.co`) {
    throw new Error(
      `${t.urlVar} is "${parsed.host}", not the ${t.label} project (https://${t.ref}.supabase.co). ` +
        `Refusing: the target and the credentials must agree before anything is written.`,
    );
  }
  console.log(`target: ${parsed.host} (${t.label})`);

  const db = createClient(url!, key!, { auth: { persistSession: false } });
  const { error } = await db.auth.signInWithPassword({ email: email!, password: password! });
  if (error) throw new Error(`sign-in failed: ${error.message}`);

  const { data: isAdmin, error: adminErr } = await db.rpc("is_admin");
  if (adminErr) throw adminErr;
  if (isAdmin !== true) {
    throw new Error(
      `The signed-in account is not an admin on ${t.label}, so no write RPC will accept it. ` +
        "If it was removed from `admins` for a partner-path test, put it back first.",
    );
  }
  return db;
}

/**
 * THE TYPED CONFIRMATION (D-PP-r). Production only, mutations only.
 *
 * It sits AFTER the Live guard and the code-shift detector — a run that is going
 * to be refused should be refused before a human is asked to type anything — and
 * BEFORE the first write.
 *
 * The phrase is the production project ref rather than "yes", because "yes" is
 * something the hands type without the eyes reading. And if stdin is not a
 * terminal it REFUSES rather than assuming consent: a production load must have
 * a person at the keyboard, so it cannot be reached from a script, a pipe, a CI
 * job or an agent.
 */
async function confirmProduction(plan: string): Promise<void> {
  const phrase = PROD_REF;
  console.log(`\n${"=".repeat(72)}`);
  console.log("YOU ARE ABOUT TO WRITE TO PRODUCTION.");
  console.log(`${"=".repeat(72)}`);
  console.log(plan);
  console.log(`${"=".repeat(72)}`);

  if (!process.stdin.isTTY) {
    throw new Error(
      "Refusing: --target prod requires a typed confirmation and stdin is not a terminal. " +
        "A production load is done by a person at a keyboard, not by a pipe, a CI job or an agent.",
    );
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const typed = (await rl.question(`\nType the production project ref (${phrase}) to proceed: `)).trim();
    if (typed !== phrase) {
      throw new Error("Confirmation did not match. Nothing has been written.");
    }
  } finally {
    rl.close();
  }
  console.log("Confirmed.\n");
}

async function ensureGroup(
  db: SupabaseClient,
  sectionSlug: string,
  groupSlug: string,
  groupName: string,
): Promise<string> {
  const { data, error } = await db.rpc("admin_list_platform_groups");
  if (error) throw error;
  const rows = (data as { id: string; section_slug: string; slug: string }[] | null) ?? [];
  const found = rows.find((g) => g.section_slug === sectionSlug && g.slug === groupSlug);
  if (found) {
    step(`group "${groupSlug}" already exists`);
    return found.id;
  }
  if (DRY_RUN) {
    step(`WOULD create group "${groupName}" in ${sectionSlug}`);
    return "00000000-0000-0000-0000-000000000000";
  }
  /* Published, like the CMS's own createGroupAction: a group is a heading, and
     an unpublished one would hide every focus area filed under it. The TOPICS
     are what stay Draft — and an empty or all-Draft group returns no rows to a
     partner anyway, so it is invisible until its first focus area goes Live. */
  const { data: id, error: upErr } = await db.rpc("admin_upsert_platform_group", {
    p_id: null,
    p_section_slug: sectionSlug,
    p_slug: groupSlug,
    p_name: groupName,
    p_description: null,
    p_sort_order: 100,
    p_published: true,
  });
  if (upErr) throw new Error(`create group "${groupSlug}": ${upErr.message}`);
  step(`created group "${groupName}"`);
  return id as string;
}

type TopicRow = {
  id: string;
  element_id: string;
  element_slug: string;
  element_code: string;
  slug: string;
  published: boolean;
};

async function upsertFocusArea(
  db: SupabaseClient,
  fa: FocusAreaEntry,
  groupId: string,
): Promise<TopicRow | null> {
  const { data, error } = await db.rpc("admin_list_platform_topics");
  if (error) throw error;
  const rows = (data as TopicRow[] | null) ?? [];
  const existing = findByCode(rows, fa);

  /* REFUSE TO REWRITE LIVE CONTENT WITHOUT BEING TOLD TO.
     This script never changes the Draft/Live flag — but that is not the same as
     being safe on a Live row. Re-running it over a published focus area
     rewrites its summary, photograph and guide, and those land in front of
     partners immediately with no review step in between. Over 22 focus areas at
     PP6c that is a content-publishing event disguised as a re-run.
     Draft rows are freely updated; a Live one needs --allow-live, said out
     loud. Raised by the independent review, 2026-08-15. */
  if (existing?.published && !ALLOW_LIVE) {
    throw new Error(
      `"${fa.title}" (/${fa.slug}) is LIVE. Re-running would rewrite content partners can already see. ` +
        `Move it back to Draft in the CMS, or pass --allow-live if that is what you intend.`,
    );
  }

  if (DRY_RUN) {
    step(`WOULD ${existing ? "update" : "create"} focus area "${fa.title}" (/${fa.slug})`);
    return existing;
  }

  const { error: upErr } = await db.rpc("admin_upsert_platform_topic", {
    p_id: existing?.id ?? null,
    p_group_id: groupId,
    /* Ignored on update — the RPC freezes the slug so a rename never breaks a
       partner's bookmark. Sent only on create. */
    p_slug: existing ? null : fa.slug,
    p_title: fa.title,
    p_description: fa.summary,
    /* D-PP-m routes the whole of the Overview's remainder into the guide, so
       there is no second card line. Left empty rather than invented. */
    p_intro: null,
    p_icon: null,
    p_image_path: fa.photo.imagePath,
    p_image_position: "50% 50%",
    p_youtube_url: null,
    p_sort_order: Number(fa.number.split(".")[1]) || 0,
    /* null = leave the current state alone. On create the RPC defaults to
       Draft. This script can therefore never publish anything. */
    p_published: null,
    p_element_code: fa.code,
    p_simple_guide_md: fa.guideMd,
  });
  if (upErr) throw new Error(`upsert focus area "${fa.slug}": ${upErr.message}`);
  step(`${existing ? "updated" : "created"} focus area "${fa.title}" (/${fa.slug})`);

  const { data: after, error: afterErr } = await db.rpc("admin_list_platform_topics");
  if (afterErr) throw afterErr;
  const row = ((after as TopicRow[] | null) ?? []).find((t) => t.element_code === fa.code);
  if (!row) throw new Error(`focus area ${fa.code} "/${fa.slug}" is missing immediately after upsert`);
  return row;
}

/* One upload: the object first, then the row, and if the row is refused take
   the object back out. Identical in ordering to src/lib/admin/file-actions.ts,
   because a loader that compensates differently from the CMS is a second
   contract nobody is maintaining. */
async function putFile(
  db: SupabaseClient,
  args: {
    elementId: string;
    absSourcePath: string;
    key: string;
    title: string;
    docKey: "guide" | null;
    code: string | null;
    type: string;
    sortOrder: number;
  },
): Promise<number> {
  const ext = path.extname(args.key).slice(1).toLowerCase();
  const contentType = CONTENT_TYPE[ext];
  if (!contentType) throw new Error(`unsupported file type ".${ext}" for ${args.key}`);

  const bytes = await fs.readFile(args.absSourcePath);
  /* upsert:FALSE, like the CMS. With a unique key a collision means something
     is genuinely wrong, and failing loudly is right; overwriting would risk
     clobbering bytes another row depends on. It also makes the compensation
     below provably safe: if the upload failed we wrote nothing, so there is
     nothing of anyone else's to remove. */
  const { error: upErr } = await db.storage
    .from(BUCKET)
    .upload(args.key, bytes, { contentType, upsert: false });
  if (upErr) throw new Error(`upload ${args.key}: ${upErr.message}`);

  const { error: regErr } = await db.rpc("admin_register_resource_file", {
    p_element_id: args.elementId,
    p_storage_path: args.key,
    p_title: args.title,
    p_doc_key: args.docKey,
    p_code: args.code,
    p_type: args.type,
    p_version: "v1",
    p_sort_order: args.sortOrder,
  });
  if (regErr) {
    /* Safe to remove: the upload above succeeded with upsert:false, so this key
       did not exist a moment ago and belongs to nobody else. */
    await db.storage.from(BUCKET).remove([args.key]);
    throw new Error(`register "${args.title}": ${regErr.message}`);
  }
  return bytes.length;
}

/* A file's stable identity, which is NOT its title. Titles come from filenames
   and change when the owner tidies a name; matching on one meant a rename read
   as "a new file", with the consequences described on objectKey above. A
   template is identified by its code within its focus area, and the guide by
   doc_key, both of which the database itself constrains to be unique there. */
type ExistingFile = { id: string; title: string; code: string | null; doc_key: string | null };

/* A CODE IS NOT A STABLE IDENTITY, so before trusting one, prove it has not
   moved. Codes are T01..Tnn assigned by alphabetical filename order, so
   renaming "Palestine House Setup Checklist.docx" to "A Palestine House Setup
   Checklist.docx" makes it T01 and demotes the Brand Guide to T02. Matching on
   code alone would then relabel each file as the other — both downloads
   silently wrong, and no error anywhere. Found by the independent review,
   2026-08-15.

   A pure rename stays safe and is still handled as a rename: the old title
   simply disappears from the spec. A SWAP is refused, and detecting it is
   exact — the title currently registered under this code turning up in the spec
   under a DIFFERENT code is precisely what a reordering looks like, and cannot
   arise any other way.

   Called from the preflight, before anything is written, and again inside the
   file loop so it cannot be bypassed by a future caller. */
/* Delegates to scripts/lib/shift.ts, where the rule has its own test suite. */
function assertCodesHaveNotShifted(fa: FocusAreaEntry, existing: ExistingFile[]): void {
  checkShift(fa.title, fa.templates, existing, ALLOW_RETITLE);
}
/* PUSH NEW BYTES for a file that is already registered.
   Matching by code means an EDITED source document under an unchanged filename
   is not noticed — the row is found, nothing is re-uploaded, and the partner
   keeps downloading the old version. Detecting that automatically would need
   the stored object's size or hash, and `admin_list_resource_files` withholds
   the storage path by design, so this is deliberate rather than automatic:
   --replace-files re-uploads the targeted focus areas through the CMS's own
   replace lifecycle. Raised by the independent review, 2026-08-15. */
async function replaceBytes(
  db: SupabaseClient,
  row: ExistingFile,
  fa: FocusAreaEntry,
  source: { fileName: string; relPath: string; title: string; code?: string },
  topic: TopicRow,
): Promise<void> {
  const ext = path.extname(source.fileName).slice(1).toLowerCase();
  const contentType = CONTENT_TYPE[ext];
  if (!contentType) throw new Error(`unsupported file type ".${ext}"`);

  const key = objectKey(
    topic.element_slug,
    source.code ? slugify(source.code) || "file" : "guide",
    source.title,
    ext,
  );
  const bytes = await fs.readFile(path.join(SRC, source.relPath));
  const { error: upErr } = await db.storage
    .from(BUCKET)
    .upload(key, bytes, { contentType, upsert: false });
  if (upErr) throw new Error(`upload ${key}: ${upErr.message}`);

  /* The RPC matches on id AND element AND private AND bucket, and hands back
     the key it replaced. If it refuses, the row still points at the old object,
     so the new one is the only thing to take away. */
  const { data, error } = await db.rpc("admin_replace_resource_file", {
    p_id: row.id,
    p_element_id: topic.element_id,
    p_storage_path: key,
  });
  if (error) {
    await db.storage.from(BUCKET).remove([key]);
    throw new Error(`replace "${row.title}" on ${fa.number}: ${error.message}`);
  }
  const oldPath = typeof data === "string" ? data : null;
  if (oldPath && oldPath !== key) {
    await db.storage.from(BUCKET).remove([oldPath]);
  }
  step(`replaced bytes for "${row.title}" (${bytes.length.toLocaleString()} bytes)`);
}

async function renameIfNeeded(
  db: SupabaseClient,
  row: ExistingFile,
  title: string,
): Promise<void> {
  if (row.title === title) return;
  const { error } = await db.rpc("admin_update_resource_meta", {
    p_id: row.id,
    p_title: title,
    p_code: row.code,
    p_type: null,
    p_version: null,
    p_sort_order: null,
  });
  if (error) throw new Error(`rename "${row.title}" -> "${title}": ${error.message}`);
  step(`renamed "${row.title}" -> "${title}" (metadata only; the file did not move)`);
}

async function uploadFiles(
  db: SupabaseClient,
  fa: FocusAreaEntry,
  topic: TopicRow,
): Promise<void> {
  const { data, error } = await db.rpc("admin_list_resource_files", {
    p_element_id: topic.element_id,
  });
  if (error) throw error;
  const existing = (data as ExistingFile[] | null) ?? [];

  /* The guide FILE — the Simple Guide document itself, behind the card's
     "Download Now". Without it that button honestly says "coming soon", which
     is correct but is not the finished experience. doc_key='guide' keeps it out
     of the templates grid and the partial unique index allows only one. */
  const existingGuide = existing.find((r) => r.doc_key === "guide");
  if (existingGuide) {
    step(`guide file already registered`);
    if (!DRY_RUN) {
      if (REPLACE_FILES) {
        await replaceBytes(db, existingGuide, fa, fa.guideFile, topic);
      }
      await renameIfNeeded(db, existingGuide, fa.guideFile.title);
    }
  } else if (DRY_RUN) {
    step(`WOULD upload guide file "${fa.guideFile.title}"`);
  } else {
    const ext = path.extname(fa.guideFile.fileName).slice(1).toLowerCase();
    const size = await putFile(db, {
      elementId: topic.element_id,
      absSourcePath: path.join(SRC, fa.guideFile.relPath),
      key: objectKey(topic.element_slug, "guide", fa.guideFile.title, ext),
      title: fa.guideFile.title,
      docKey: "guide",
      code: null,
      type: "guide",
      sortOrder: 0,
    });
    step(`uploaded + registered GUIDE "${fa.guideFile.title}" (${size.toLocaleString()} bytes)`);
  }

  assertCodesHaveNotShifted(fa, existing);

  for (const t of fa.templates) {
    /* Matched on CODE, having just proved above that no code has moved. A
       retitled template is the same template. */
    const already = existing.find((r) => r.doc_key === null && r.code === t.code);
    if (already) {
      step(`template ${t.code} already registered`);
      if (!DRY_RUN) {
        if (REPLACE_FILES) await replaceBytes(db, already, fa, t, topic);
        await renameIfNeeded(db, already, t.title);
      }
      continue;
    }
    const ext = path.extname(t.fileName).slice(1).toLowerCase();
    const key = objectKey(topic.element_slug, slugify(t.code) || "file", t.title, ext);
    if (DRY_RUN) {
      step(`WOULD upload ${t.code} "${t.title}" -> ${key}`);
      continue;
    }
    const size = await putFile(db, {
      elementId: topic.element_id,
      absSourcePath: path.join(SRC, t.relPath),
      key,
      title: t.title,
      docKey: null, // a template, not the one guide file
      code: t.code,
      type: t.type,
      sortOrder: t.sortOrder,
    });
    step(`uploaded + registered ${t.code} "${t.title}" (${size.toLocaleString()} bytes)`);
  }
}

/* D-PP-o: the photograph is COPIED to the new slug, never renamed, so the live
   33 keep rendering until 0030 removes them. Committed to the repo — it is a
   static asset, not data. */
async function ensurePhoto(fa: FocusAreaEntry): Promise<void> {
  const from = path.join(TOPIC_PHOTO_DIR, fa.photo.source);
  const to = path.join(TOPIC_PHOTO_DIR, fa.photo.target);
  const source = await fs.readFile(from);
  try {
    const current = await fs.readFile(to);
    if (current.equals(source)) {
      step(`photo ${fa.photo.target} already in place`);
      return;
    }
  } catch {
    /* not there yet */
  }
  if (DRY_RUN) {
    step(`WOULD copy photo ${fa.photo.source} -> ${fa.photo.target}`);
    return;
  }
  await fs.writeFile(to, source);
  step(`copied photo ${fa.photo.source} -> ${fa.photo.target}  (git add this)`);
}

async function main(): Promise<void> {
  const spec = JSON.parse(await fs.readFile(SPEC, "utf8")) as ContentSpec;
  const targets = ALL
    ? spec.focusAreas
    : spec.focusAreas.filter((f) => f.number === FOCUS);
  if (targets.length === 0) {
    throw new Error(`No focus area numbered "${FOCUS}" in the spec.`);
  }

  console.log(
    `PP6b content load — ${targets.length} focus area(s) — ${DRY_RUN ? "DRY RUN" : "LIVE"}`,
  );

  /* --photos-only: working-tree copies, then stop. Deliberately BEFORE
     connect(), so it needs no credentials, opens no session and cannot write a
     row even by accident. */
  if (PHOTOS_ONLY) {
    console.log("--photos-only: copying mapped photographs, no database connection\n");
    for (const fa of targets) {
      console.log(`${fa.number} ${fa.title}`);
      await ensurePhoto(fa);
    }
    console.log(
      DRY_RUN
        ? "\nDry run complete — nothing written."
        : "\nPhotographs copied. Nothing else was touched; `git add public/assets/workspace/topics`.",
    );
    return;
  }

  const db = await connect();
  await withSession(db, () => run(db, spec, targets));
}

async function run(
  db: SupabaseClient,
  spec: ContentSpec,
  targets: FocusAreaEntry[],
): Promise<void> {
  /* PREFLIGHT, BEFORE ANY MUTATION ANYWHERE.
     The Live guard used to sit inside upsertFocusArea, which runs third — so a
     refused run had already copied a photograph into the working tree and could
     already have created a published group on TEST. A command that advertises
     "I will not touch a Live focus area" must decide that before it touches
     anything at all. Raised by the independent review, 2026-08-15. */
  const { data: preRows, error: preErr } = await db.rpc("admin_list_platform_topics");
  if (preErr) throw preErr;
  const known = (preRows as TopicRow[] | null) ?? [];

  if (!ALLOW_LIVE) {
    /* By CODE, not slug (see findExisting): a renamed focus area is invisible to
       a slug lookup, so this guard used to wave through exactly the published
       row it exists to protect. */
    const live = targets
      .map((fa) => findByCode(known, fa))
      .filter((t): t is TopicRow => Boolean(t?.published));
    if (live.length) {
      throw new Error(
        `${live.length} of the targeted focus area(s) are LIVE: ${live
          .map((t) => `/${t.slug}`)
          .join(", ")}. Re-running would rewrite content partners can already ` +
          `see. Move them back to Draft in the CMS, or pass --allow-live if that is what you intend. ` +
          `Nothing has been written.`,
      );
    }
  }

  /* The code-shift check belongs here too, for the same reason: it decides that
     the run is unsafe, so it must decide it before the run has written anything. */
  for (const fa of targets) {
    const topic = findByCode(known, fa);
    if (!topic) continue;
    const { data, error } = await db.rpc("admin_list_resource_files", {
      p_element_id: topic.element_id,
    });
    if (error) throw error;
    assertCodesHaveNotShifted(fa, (data as ExistingFile[] | null) ?? []);
  }

  /* THE LAST THING BEFORE THE FIRST WRITE (D-PP-r). Every refusal above has
     already had its chance, so anything that gets here is a run the script is
     willing to perform — which is exactly the point at which a person should be
     asked whether they meant production. Skipped for a dry run, which writes
     nothing. */
  if (TARGET === "prod" && !DRY_RUN) {
    const existing = targets.filter((fa) => findByCode(known, fa));
    const files = targets.reduce((n, fa) => n + fa.templates.length + 1, 0);
    await confirmProduction(
      [
        `  project      ${PROD_REF}.supabase.co`,
        `  focus areas  ${targets.length} (${existing.length} already exist and will be UPDATED, ` +
          `${targets.length - existing.length} will be created as Draft)`,
        `  files        up to ${files} uploads (${targets.length} guides + ` +
          `${files - targets.length} templates)`,
        `  publication  unchanged — this script never publishes and never un-publishes`,
        `  photographs  copied into the working tree, not the database`,
      ].join("\n"),
    );
  }

  for (const fa of targets) {
    console.log(`\n${fa.number} ${fa.title}`);
    const section = spec.sections.find((s) => s.slug === fa.sectionSlug);
    if (!section) throw new Error(`spec has no section "${fa.sectionSlug}"`);

    await ensurePhoto(fa);
    const groupId = await ensureGroup(db, section.slug, section.groupSlug, section.groupName);
    const topic = await upsertFocusArea(db, fa, groupId);
    if (topic) {
      await uploadFiles(db, fa, topic);
      step(topic.published ? "state: LIVE (unchanged by this script)" : "state: DRAFT");
    } else {
      /* Dry run against a focus area that does not exist yet: there is no
         element id to list files for, so report the plan from the spec instead
         of silently showing nothing. A dry run that omits the file half would
         be the least useful part of the output. */
      for (const t of fa.templates) {
        step(`WOULD upload ${t.code} "${t.title}" (${path.extname(t.fileName).slice(1)})`);
      }
      step("state: DRAFT (would be created unpublished)");
    }
  }

  /* Precise rather than reassuring: anything this run CREATED is a Draft, but a
     focus area that already existed keeps whatever state the owner put it in —
     this script never publishes and never un-publishes. Saying "everything is a
     Draft" after updating a Live row would be a false statement about exactly
     the thing the sprint is careful about. */
  console.log(
    DRY_RUN
      ? "\nDry run complete — nothing written."
      : "\nLoad complete. Anything CREATED here is a Draft; anything that already existed keeps its current state. Publish from /admin/content/focus-areas.",
  );
}

main().catch((e) => {
  console.error("\nLOAD FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
