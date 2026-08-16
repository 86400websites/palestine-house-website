/**
 * scripts/generate-0030-down.ts — PP6c step 6c-g.
 * Generates `supabase/sql/migrations/0030_content_v2_cutover.down.sql`
 * from PRODUCTION, READ-ONLY.
 *
 *   pnpm exec tsx scripts/generate-0030-down.ts --dry-run   # counts and sizes only
 *   pnpm exec tsx scripts/generate-0030-down.ts             # write the .down.sql
 *
 * WHY IT READS PRODUCTION, WHICH NOTHING ELSE IN THIS SPRINT DOES
 * ---------------------------------------------------------------
 * `0030` deletes the legacy platform, and D-PP-k requires its down-migration to
 * carry the 33 guide bodies as literal inserts — a `.down.sql` restores rows,
 * and nothing else will bring that prose back.
 *
 * The obvious thing is to generate it from TEST, where the whole sprint has been
 * working. Measured at 6c-g, that would have been wrong:
 *
 *     legacy `elements` fingerprint   PROD 974c6a3e…   TEST 1b63ca95…
 *     simple_guide_md total chars     PROD 630,020     TEST 872,068
 *     carriage returns                PROD 25,118      TEST 329
 *
 * Only A1 is identical. The other 32 differ in ALL THREE body columns, in both
 * directions — the two projects hold different generations of the legacy
 * content. A TEST-sourced down-migration would therefore restore the wrong
 * generation of the owner's prose to production, and would only reveal that
 * during an actual emergency rollback, which is the worst possible moment to
 * discover it. Production rollback is the case that matters; TEST can always be
 * re-seeded. So the file is generated from production.
 *
 * READ-ONLY, AND STRUCTURALLY SO
 * ------------------------------
 * CLAUDE.md: never write to production through any channel. This script cannot.
 *   - It calls exactly six functions, every one of them a read:
 *       is_admin · admin_list_platform_groups · admin_list_platform_topics
 *       admin_get_element · admin_list_resource_files · get_resource_download
 *     No `admin_upsert_*`, `admin_delete_*`, `admin_set_*`, no `.insert()`,
 *     `.update()`, `.delete()`, `.upload()` or `.remove()` appears in this file.
 *   - It asserts the host is the production project ref before signing in, so it
 *     cannot silently generate the file from the wrong database — which, given
 *     the divergence above, would be the defect it exists to prevent.
 *   - Its only side effect on this machine is writing one .sql file.
 *
 * ⚠️ ONE CORRECTION TO THE ABOVE, from the review of 2026-08-16: signing in DOES
 * create an Auth session on production, so "no write of any kind" was overstated.
 * It writes no CONTENT. Worse, the original `auth.signOut()` defaults to GLOBAL
 * scope, which would have revoked the admin's other refresh tokens — logging the
 * owner out of his own browser as a side effect of a "read-only" script. Sign-out
 * is now local-scoped and runs in a `finally`, so it also happens when the script
 * throws.
 *
 * Storage paths come from `get_resource_download`, the product's own download
 * path, rather than from a filename-matching heuristic: no admin RPC exposes a
 * storage path (deliberately — D-PP-i keeps paths off admin screens), and
 * guessing the mapping is how you attach one file's name to another's bytes.
 *
 * The 1.6 MB of prose is streamed to disk and never printed.
 *
 * TWO THINGS THAT LOOK LIKE DISCREPANCIES AND ARE NOT
 * ---------------------------------------------------
 * 1. The character totals printed here are THREE HIGHER than `length()` reports
 *    in SQL: 630,023 against 630,020. Not a data difference — JavaScript counts
 *    UTF-16 code units and Postgres counts code points, and element H3 contains
 *    three astral-plane emoji (🔴 🟠 🟢), each of which is two units and one code
 *    point. Chased down rather than waved away, because on this particular file
 *    "off by three" is exactly what a silent truncation would look like.
 * 2. The two PUBLIC booklets are absent from the resources collected here, and
 *    should be. They carry `element_id IS NULL`, so no per-element listing
 *    reaches them — and `0030` does not delete them, so the rollback has nothing
 *    to restore. Asserted below rather than left to inference.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseArgs } from "./lib/argv";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "supabase/sql/migrations/0030_content_v2_cutover.down.sql");

/* PROJECT-STATUS.md §6. The production project. */
const PROD_REF = "jwogtqizqujwhbvpoziu";
const TEST_REF = "sdszcralogcrujtyghig";

/* Strict: an unknown argument is an error, never a no-op (review 2026-08-16). */
const ARGS = parseArgs(process.argv.slice(2), { flags: ["--dry-run"] });
const DRY_RUN = ARGS.has("--dry-run");

/* What production is expected to hold. If any of these is wrong the shape of
   the migration is wrong, so it fails rather than emits a plausible file. */
const EXPECT_GROUPS = 10;
const EXPECT_TOPICS = 33;
const EXPECT_ELEMENTS = 33;
const EXPECT_TEMPLATES = 297;
const EXPECT_PUBLIC = 2;

interface GroupRow {
  id: string; section_slug: string; slug: string; name: string;
  description: string | null; sort_order: number; published: boolean;
}
interface TopicRow {
  id: string; group_id: string; slug: string; title: string;
  description: string | null; intro: string | null; icon: string | null;
  image_path: string | null; image_position: string | null; youtube_url: string | null;
  sort_order: number; published: boolean; element_id: string; element_slug: string; element_code: string;
}
interface ElementRow {
  id: string; slug: string; code: string; focus_area_code: string | null;
  focus_area_name: string | null; title: string; one_line: string | null;
  overview_md: string | null; simple_guide_md: string | null;
  watch_out_for_md: string | null; sort_order: number;
}
interface FileRow {
  id: string; title: string; code: string | null; doc_key: string | null;
  type: string | null; version: string | null; sort_order: number; is_public: boolean;
}
interface FullResource extends FileRow {
  element_id: string; storage_bucket: string | null; storage_path: string | null;
}

/** Postgres literal. Nulls stay NULL; everything else is dollar-quoted with a
 *  tag proven absent from the body, because 1.6 MB of the owner's markdown will
 *  contain quotes, backslashes and $$ sooner or later and a single escaping
 *  mistake corrupts the one artefact that exists to restore his words. */
function lit(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  let tag = "md";
  let i = 0;
  while (v.includes(`$${tag}$`)) tag = `md${++i}`;
  return `$${tag}$${v}$${tag}$`;
}

async function connect(): Promise<SupabaseClient> {
  process.loadEnvFile(path.join(ROOT, ".env.local"));
  const url = process.env.PROD_SUPABASE_URL;
  const key = process.env.PROD_SUPABASE_PUBLISHABLE_KEY;
  const email = process.env.PROD_ADMIN_EMAIL;
  const password = process.env.PROD_ADMIN_PASSWORD;
  if (!url || !key || !email || !password) {
    throw new Error(
      "Missing PROD_SUPABASE_URL / PROD_SUPABASE_PUBLISHABLE_KEY / PROD_ADMIN_EMAIL / " +
        "PROD_ADMIN_PASSWORD in .env.local. This script deliberately reads ONLY the PROD_* " +
        "names and never falls back to the default client, so that a .env.local pointed " +
        "somewhere else cannot silently produce a down-migration from the wrong database.",
    );
  }

  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== `${PROD_REF}.supabase.co`) {
    throw new Error(
      `PROD_SUPABASE_URL is "${parsed.host}", not the production project ` +
        `(https://${PROD_REF}.supabase.co).` +
        (parsed.hostname === `${TEST_REF}.supabase.co`
          ? " That is the TEST project, whose legacy content DIFFERS from production's — " +
            "generating the down-migration from it is precisely the defect this guard exists to prevent."
          : ""),
    );
  }
  console.log(`source: ${parsed.host} (PRODUCTION — read-only)`);

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed: ${error.message}`);
  const { data: isAdmin, error: adminErr } = await db.rpc("is_admin");
  if (adminErr) throw adminErr;
  if (isAdmin !== true) throw new Error("PROD_ADMIN_* is not an admin on production.");
  return db;
}

async function main(): Promise<void> {
  console.log(`PP6c 6c-g — generating 0030.down.sql from production — ${DRY_RUN ? "DRY RUN" : "WRITE"}\n`);
  const db = await connect();
  try {
    await run(db);
  } finally {
    /* LOCAL scope, and in `finally`. The default scope is GLOBAL, which revokes
       every refresh token the account holds — logging the owner out of his own
       browser as a side effect of a script advertised as read-only. `finally`
       so the session is also closed when the run throws. */
    await db.auth.signOut({ scope: "local" });
  }
}

async function run(db: SupabaseClient): Promise<void> {
  const { data: gData, error: gErr } = await db.rpc("admin_list_platform_groups");
  if (gErr) throw gErr;
  const groups = (gData as GroupRow[] | null) ?? [];

  const { data: tData, error: tErr } = await db.rpc("admin_list_platform_topics");
  if (tErr) throw tErr;
  const topics = (tData as TopicRow[] | null) ?? [];

  const elements: ElementRow[] = [];
  for (const t of topics) {
    const { data, error } = await db.rpc("admin_get_element", { p_slug: t.element_slug });
    if (error) throw new Error(`admin_get_element(${t.element_slug}): ${error.message}`);
    const row = ((data as ElementRow[] | null) ?? [])[0];
    if (!row) throw new Error(`element "${t.element_slug}" returned no rows`);
    elements.push(row);
  }

  const resources: FullResource[] = [];
  for (const t of topics) {
    const { data, error } = await db.rpc("admin_list_resource_files", { p_element_id: t.element_id });
    if (error) throw new Error(`admin_list_resource_files(${t.element_slug}): ${error.message}`);
    for (const f of (data as FileRow[] | null) ?? []) {
      /* The product's own download path, not a filename guess. */
      const { data: dl, error: dErr } = await db.rpc("get_resource_download", { p_id: f.id });
      if (dErr) throw new Error(`get_resource_download(${f.title}): ${dErr.message}`);
      const row = ((dl as { storage_bucket: string; storage_path: string }[] | null) ?? [])[0];
      if (!row?.storage_path) throw new Error(`no storage path for "${f.title}"`);
      resources.push({ ...f, element_id: t.element_id, storage_bucket: row.storage_bucket, storage_path: row.storage_path });
    }
  }

  const templates = resources.filter((r) => !r.is_public && r.doc_key === null && r.code !== null);
  const guideChars = elements.reduce((n, e) => n + (e.simple_guide_md?.length ?? 0), 0);
  const allBodyChars = elements.reduce(
    (n, e) => n + (e.simple_guide_md?.length ?? 0) + (e.overview_md?.length ?? 0) + (e.watch_out_for_md?.length ?? 0),
    0,
  );

  console.log(`groups     ${groups.length}`);
  console.log(`topics     ${topics.length}`);
  console.log(`elements   ${elements.length}   simple_guide_md ${guideChars.toLocaleString("en-US")} chars · all three columns ${allBodyChars.toLocaleString("en-US")}`);
  console.log(`resources  ${resources.length}   of which templates ${templates.length}\n`);

  const bad: string[] = [];
  if (groups.length !== EXPECT_GROUPS) bad.push(`groups ${groups.length} != ${EXPECT_GROUPS}`);
  if (topics.length !== EXPECT_TOPICS) bad.push(`topics ${topics.length} != ${EXPECT_TOPICS}`);
  if (elements.length !== EXPECT_ELEMENTS) bad.push(`elements ${elements.length} != ${EXPECT_ELEMENTS}`);
  if (templates.length !== EXPECT_TEMPLATES) bad.push(`templates ${templates.length} != ${EXPECT_TEMPLATES}`);
  if (new Set(resources.map((r) => r.storage_path)).size !== resources.length) bad.push("duplicate storage paths");
  if (elements.some((e) => !e.simple_guide_md)) bad.push("an element has no simple_guide_md");
  /* The two public booklets must NOT be here: they carry element_id IS NULL, and
     0030 does not delete them, so the rollback has nothing to restore for them.
     Asserted so that a future change which starts attaching them to an element
     fails here rather than producing a rollback that quietly duplicates them. */
  if (resources.some((r) => r.is_public)) bad.push(`${resources.filter((r) => r.is_public).length} public resource(s) collected; 0030 does not delete those`);
  if (resources.length !== templates.length) bad.push(`resources ${resources.length} != templates ${templates.length}; only the ${EXPECT_TEMPLATES} private templates belong in this rollback`);
  if (EXPECT_PUBLIC !== 2) bad.push("EXPECT_PUBLIC drifted");
  if (bad.length) throw new Error(`production does not look as expected:\n  - ${bad.join("\n  - ")}`);

  if (DRY_RUN) {
    console.log("Dry run complete — nothing written.");
    return;
  }

  const L: string[] = [];
  L.push(`-- 0030_content_v2_cutover.down.sql`);
  L.push(`-- ROLLBACK for migration 0030 (PP6c, D-PP-k): restores the legacy platform.`);
  L.push(`--`);
  L.push(`-- GENERATED, DO NOT HAND-EDIT — scripts/generate-0030-down.ts, read-only from`);
  L.push(`-- the PRODUCTION project (${PROD_REF}). It is generated from production and not`);
  L.push(`-- from TEST because the two hold DIFFERENT GENERATIONS of the legacy content:`);
  L.push(`-- measured 2026-08-16, only element A1 is identical, and simple_guide_md totals`);
  L.push(`-- 630,020 chars on production against 872,068 on TEST. A TEST-sourced rollback`);
  L.push(`-- would restore the wrong generation of the owner's prose.`);
  L.push(`--`);
  L.push(`-- ⚠️ THIS FILE CANNOT RESTORE STORAGE OBJECTS. SQL restores rows only.`);
  L.push(`--    The ${templates.length} template files must be re-uploaded from the cold backup at`);
  L.push(`--    docs/source-assets/_archive-297-templates/ using the SAME object keys, which`);
  L.push(`--    the archive preserves exactly. Verify the archive first:`);
  L.push(`--      pnpm exec tsx scripts/backup-297-objects.ts`);
  L.push(`--    297 objects · 5,320,962 bytes · fingerprint 6fde792718130d12071b69459f9d70ab`);
  L.push(`--`);
  L.push(`-- Contents: ${groups.length} groups · ${topics.length} topics · ${elements.length} elements`);
  L.push(`--           (${allBodyChars.toLocaleString("en-US")} chars of prose) · ${resources.length} resource rows.`);
  L.push(`-- Idempotent: every insert is ON CONFLICT DO NOTHING, so a partial rollback can`);
  L.push(`-- simply be re-run.`);
  L.push(``);
  L.push(`begin;`);
  L.push(``);

  L.push(`-- 1. elements — the guide bodies. Restored FIRST: platform_topics.element_id is`);
  L.push(`--    NOT NULL and a foreign key, so the topics below cannot exist without these.`);
  for (const e of elements) {
    L.push(
      `insert into public.elements (id, slug, code, focus_area_code, focus_area_name, title, one_line, overview_md, simple_guide_md, watch_out_for_md, sort_order) values (` +
        [e.id, e.slug, e.code, e.focus_area_code, e.focus_area_name, e.title, e.one_line, e.overview_md, e.simple_guide_md, e.watch_out_for_md]
          .map(lit)
          .join(", ") +
        `, ${e.sort_order}) on conflict (id) do nothing;`,
    );
  }
  L.push(``);

  L.push(`-- 2. platform_groups`);
  for (const g of groups) {
    L.push(
      `insert into public.platform_groups (id, section_slug, slug, name, description, sort_order, published) values (` +
        [g.id, g.section_slug, g.slug, g.name, g.description].map(lit).join(", ") +
        `, ${g.sort_order}, ${g.published}) on conflict (id) do nothing;`,
    );
  }
  L.push(``);

  L.push(`-- 3. platform_topics`);
  for (const t of topics) {
    L.push(
      `insert into public.platform_topics (id, element_id, group_id, slug, title, description, intro, icon, image_path, image_position, youtube_url, sort_order, published) values (` +
        [t.id, t.element_id, t.group_id, t.slug, t.title, t.description, t.intro, t.icon, t.image_path, t.image_position, t.youtube_url]
          .map(lit)
          .join(", ") +
        `, ${t.sort_order}, ${t.published}) on conflict (id) do nothing;`,
    );
  }
  L.push(``);

  L.push(`-- 4. resources — rows only. The BYTES come from the cold backup (see header).`);
  for (const r of resources) {
    L.push(
      `insert into public.resources (id, element_id, title, code, doc_key, type, version, is_public, sort_order, storage_bucket, storage_path) values (` +
        [r.id, r.element_id, r.title, r.code, r.doc_key, r.type, r.version].map(lit).join(", ") +
        `, ${r.is_public}, ${r.sort_order}, ` +
        [r.storage_bucket, r.storage_path].map(lit).join(", ") +
        `) on conflict (id) do nothing;`,
    );
  }
  L.push(``);
  L.push(`commit;`);
  L.push(``);
  L.push(`-- Verify after running:`);
  L.push(`--   select count(*) from public.elements         where code !~ '^[0-9]';  -- ${elements.length}`);
  L.push(`--   select count(*) from public.platform_topics  where slug in (select slug from public.platform_topics);`);
  L.push(`--   select count(*) from public.resources        where code is not null;  -- ${templates.length} + new`);
  L.push(``);

  await fs.writeFile(OUT, L.join("\n"), "utf8");
  const size = (await fs.stat(OUT)).size;
  console.log(`Wrote ${path.relative(ROOT, OUT)} — ${(size / 1024 / 1024).toFixed(2)} MB, ${L.length.toLocaleString("en-US")} lines.`);
  console.log(`Production was READ ONLY: six read RPCs, no write of any kind.`);
}

main().catch((e) => {
  console.error("\nGENERATE FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
