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
 *   pnpm exec tsx scripts/load-content.ts --all            # PP6c
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
 * TEST only. The target host is asserted against the known TEST project ref
 * before a single request, and the credentials are read out of `.env.local` by
 * this script — they are never passed on a command line or printed.
 *
 * IDEMPOTENT. Re-running finds what it created last time (group by slug, focus
 * area by slug, file by title+code) and updates instead of duplicating, so a
 * partial run can simply be repeated. It never publishes: `p_published` is left
 * null on update, which the RPC reads as "leave the current state alone".
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
const BUCKET = "resources";

/* Mirrors src/lib/admin/file-actions.ts. Word documents and PDFs only. */
const CONTENT_TYPE: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

const DRY_RUN = process.argv.includes("--dry-run");
const ALL = process.argv.includes("--all");
const FOCUS = (() => {
  const i = process.argv.indexOf("--focus");
  return i === -1 ? null : process.argv[i + 1];
})();

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

function objectKey(elementSlug: string, prefix: string, title: string, ext: string): string {
  return `${elementSlug}/${prefix}-${slugify(title) || "file"}.${ext}`;
}

function step(message: string): void {
  console.log(`  ${message}`);
}

async function connect(): Promise<SupabaseClient> {
  process.loadEnvFile(path.join(ROOT, ".env.local"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const email = process.env.TEST_PARTNER_EMAIL;
  const password = process.env.TEST_PARTNER_PASSWORD;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / _PUBLISHABLE_KEY in .env.local");
  if (!email || !password) {
    throw new Error("Missing TEST_PARTNER_EMAIL / TEST_PARTNER_PASSWORD in .env.local");
  }

  /* Exact host match over https, NOT a substring test, so a look-alike host can
     never receive a session or a write. The same guard the old ingest carried. */
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== `${TEST_REF}.supabase.co`) {
    throw new Error(
      `Refusing to run against "${parsed.host}". This script targets the TEST project only ` +
        `(https://${TEST_REF}.supabase.co); production content is loaded by PP6c, deliberately, by hand.`,
    );
  }
  console.log(`target: ${parsed.host} (TEST)`);

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed: ${error.message}`);

  const { data: isAdmin, error: adminErr } = await db.rpc("is_admin");
  if (adminErr) throw adminErr;
  if (isAdmin !== true) {
    throw new Error(
      "The signed-in account is not an admin on this project, so no write RPC will accept it. " +
        "If it was removed from `admins` for a partner-path test, put it back first.",
    );
  }
  return db;
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
  const existing = rows.find((t) => t.slug === fa.slug) ?? null;

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
  const row = ((after as TopicRow[] | null) ?? []).find((t) => t.slug === fa.slug);
  if (!row) throw new Error(`focus area "${fa.slug}" is missing immediately after upsert`);
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
  const { error: upErr } = await db.storage
    .from(BUCKET)
    .upload(args.key, bytes, { contentType, upsert: true });
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
    await db.storage.from(BUCKET).remove([args.key]);
    throw new Error(`register "${args.title}": ${regErr.message}`);
  }
  return bytes.length;
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
  const existing =
    (data as { id: string; title: string; code: string | null; doc_key: string | null }[] | null) ??
    [];

  /* The guide FILE — the Simple Guide document itself, behind the card's
     "Download Now". Without it that button honestly says "coming soon", which
     is correct but is not the finished experience. doc_key='guide' keeps it out
     of the templates grid and the partial unique index allows only one. */
  if (existing.some((r) => r.doc_key === "guide")) {
    step(`guide file "${fa.guideFile.title}" already registered`);
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

  for (const t of fa.templates) {
    const already = existing.find((r) => r.title === t.title && r.code === t.code);
    if (already) {
      step(`template ${t.code} "${t.title}" already registered`);
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
  const db = await connect();

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

  await db.auth.signOut();
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
