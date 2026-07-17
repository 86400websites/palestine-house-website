/**
 * scripts/ingest-content.ts — S5 one-time, IDEMPOTENT content ingestion.
 *
 * Loads the FULL existing Palestine House content into the database and the two
 * Storage buckets so the owner never hand-uploads. This is a SANCTIONED ADMIN OP,
 * NOT app code: it runs locally, reads its Supabase target from .env.local, and uses
 * the Supabase secret (service_role) key — which the APP never does (TECH-ARCHITECTURE §7).
 *
 * Target project (set in .env.local — DEDICATED vars so the app's own NEXT_PUBLIC_*
 * can stay pointed elsewhere; the script defaults to TEST and REFUSES any other
 * project unless --i-understand-not-test is passed deliberately):
 *   SUPABASE_INGEST_URL=https://sdszcralogcrujtyghig.supabase.co   (TEST)
 *   SUPABASE_INGEST_SECRET_KEY=sb_secret_…                          (TEST secret)
 * (falls back to NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY if the dedicated vars
 * are absent). Run against the TEST project first; the human ships prod deliberately.
 *
 * What it does (all upserts on content-stable natural keys, so re-running never
 * changes ids and preserves every user's checklist_progress):
 *   - elements          (30) — slug a1..j3, focus area, title, one_line, per-tab bodies
 *   - checklist_items   (200+) — parsed from each topic's Operational Checklist table
 *   - academy_modules   (30) — body = the Simple Guide (the locked Academy-body mapping)
 *   - resources         (267 templates + 2 booklets) — metadata rows
 *   - Storage           — 267 templates -> private `resources` bucket; 2 booklets -> public `booklets`
 *
 * Sources (canonical, never invented):
 *   - docs/page-copy/06-elements/_index.md       -> A1..J3 codes, titles, md filenames
 *   - docs/page-copy/06-elements/<slug>.md       -> per-topic one_line
 *   - docs/page-copy/01-public-pages/focus-areas.md -> the canonical A..J focus-area names (below)
 *   - docs/source-assets/resources/2. Focus Areas/.. -> the per-topic .docx bodies + Templates/
 *   - docs/source-assets/resources/1. Playbook-Booklet/.. -> the 2 public booklet PDFs
 *
 * Usage:
 *   pnpm tsx scripts/ingest-content.ts --dry-run   # parse + report only (no DB, no secret needed)
 *   pnpm tsx scripts/ingest-content.ts             # ingest into the DB pointed at by .env.local
 *
 * Packs (FA11): `--pack food` ingests ONLY Focus Area K ("Café & Culinary
 * Experience", k1..k3) from `docs/source-assets/resources/2. Focus Areas/
 * 11. Café & Culinary Experience/` — its `_pack.md` supplies the K titles +
 * one-lines (docs/page-copy has no K rows yet). Additive and idempotent: the
 * model contains only K, so A–J rows are never touched. No booklets. The
 * default `--pack full` behaviour (all 30 topics from _index.md) is unchanged.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---- mammoth (script-only devDep, ships no TS types) loaded via require + a typed shim ----
interface MammothResult {
  value: string;
  messages: { type: string; message: string }[];
}
interface Mammoth {
  convertToHtml(input: { path: string } | { buffer: Buffer }): Promise<MammothResult>;
  convertToMarkdown(input: { path: string } | { buffer: Buffer }): Promise<MammothResult>;
  extractRawText(input: { path: string } | { buffer: Buffer }): Promise<MammothResult>;
}
const mammoth = createRequire(import.meta.url)("mammoth") as Mammoth;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ROOT = process.cwd();
const COPY_ELEMENTS = path.join(ROOT, "docs/page-copy/06-elements");
const INDEX_MD = path.join(COPY_ELEMENTS, "_index.md");
const SRC = path.join(ROOT, "docs/source-assets/resources");
const FOCUS_AREAS_DIR = path.join(SRC, "2. Focus Areas");
const BOOKLETS_DIR = path.join(SRC, "1. Playbook-Booklet");

const DRY_RUN = process.argv.includes("--dry-run");

// --pack full (default) | food — which content pack to build + ingest.
const PACK: "full" | "food" = (() => {
  const i = process.argv.indexOf("--pack");
  if (i === -1) return "full";
  const v = process.argv[i + 1];
  if (v !== "full" && v !== "food") throw new Error(`Unknown --pack "${v}" (use: full | food)`);
  return v;
})();

// Canonical focus-area names (docs/page-copy/01-public-pages/focus-areas.md, lines 24-33).
const FOCUS_NAME: Record<string, string> = {
  A: "The House Promise",
  B: "Operating Model & Governance",
  C: "People System",
  D: "Programming & Cultural Quality",
  E: "Membership, Community & Service",
  F: "Operations Engine",
  G: "Marketing, Communications & Growth",
  H: "Finance, Reporting & Sustainability",
  I: "Quality Control & Continuous Improvement",
  J: "Appendices & Tools Library",
  // FA11 (2026-07-17): Focus Area 11 — owner-approved name, folder prefix "11.".
  K: "Café & Culinary Experience",
};

const RESOURCES_BUCKET = "resources"; // PRIVATE — the 267 templates
const BOOKLETS_BUCKET = "booklets"; // PUBLIC — the 2 booklets

type ResourceType = "form" | "script" | "log" | "report" | "approval" | "guide" | "booklet";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function normTitle(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics (ā -> a)
    .toLowerCase()
    .replace(/^\s*\d+\.\s*/, "") // strip leading "N. " ordering prefix
    .replace(/&/g, " and ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function kebab(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Light cleanup of mammoth markdown: undo the backslash-escapes it adds.
function cleanMd(md: string): string {
  return md
    .replace(/\r\n/g, "\n")
    .replace(/\\([^\w\s])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function cellText(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function resourceType(name: string): ResourceType {
  const n = name.toLowerCase();
  if (/\bscript\b/.test(n)) return "script";
  if (/\blog\b/.test(n)) return "log";
  if (/report|summary|dashboard|kpi/.test(n)) return "report";
  if (/approval|sign-?off|escalation|breach|request to hq/.test(n)) return "approval";
  if (/guide|reference|card|playbook|\bsop\b|policy|framework|matrix|protocol/.test(n))
    return "guide";
  return "form";
}

function contentTypeFor(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".pdf":
      return "application/pdf";
    case ".pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    default:
      return "application/octet-stream";
  }
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isFile()).map((e) => e.name);
}
async function listDirs(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}
async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Parse the canonical A1..J3 index
// ---------------------------------------------------------------------------
interface IndexEntry {
  code: string; // A1
  slug: string; // a1
  title: string; // canonical title
  templateCount: number;
  mdFile: string; // a1-....md ("" for pack entries — one_line is inline instead)
  one_line?: string | null; // pack entries only (from _pack.md)
}

async function parseIndex(): Promise<IndexEntry[]> {
  const text = await fs.readFile(INDEX_MD, "utf8");
  const out: IndexEntry[] = [];
  for (const line of text.split("\n")) {
    // | A1 | Title | status | 10 | `a1-...md` |
    const m = line.match(
      /^\|\s*([A-J][1-3])\s*\|\s*([^|]+?)\s*\|\s*[^|]*?\s*\|\s*(\d+)\s*\|\s*`([^`]+)`\s*\|/,
    );
    if (!m) continue;
    const code = m[1];
    out.push({
      code,
      slug: code.toLowerCase(),
      title: m[2].trim(),
      templateCount: parseInt(m[3], 10),
      mdFile: m[4].trim(),
    });
  }
  if (out.length !== 30) throw new Error(`_index.md: expected 30 topics, parsed ${out.length}`);
  return out;
}

async function readOneLine(mdFile: string): Promise<string | null> {
  const p = path.join(COPY_ELEMENTS, mdFile);
  if (!(await exists(p))) return null;
  const text = await fs.readFile(p, "utf8");
  // > One line (page intro): **....**
  const m = text.match(/One line[^:]*:\s*\*\*(.+?)\*\*/s);
  return m ? m[1].replace(/\s+/g, " ").trim() : null;
}

// ---------------------------------------------------------------------------
// Map each on-disk topic folder to its code (by normalized title + focus letter)
// ---------------------------------------------------------------------------
interface TopicFolder {
  code: string;
  letter: string;
  dir: string;
}

async function mapTopicFolders(index: IndexEntry[]): Promise<TopicFolder[]> {
  const byNorm = new Map<string, IndexEntry>();
  for (const e of index) byNorm.set(e.code[0] + "|" + normTitle(e.title), e);

  const result: TopicFolder[] = [];
  const usedCodes = new Set<string>();
  const focusDirs = await listDirs(FOCUS_AREAS_DIR);

  for (const fd of focusDirs) {
    const num = parseInt(fd.match(/^(\d+)\./)?.[1] ?? "", 10);
    if (!num || num < 1 || num > 10) throw new Error(`Focus folder has no 1-10 prefix: "${fd}"`);
    const letter = String.fromCharCode(64 + num); // 1->A .. 10->J
    const topicDirs = await listDirs(path.join(FOCUS_AREAS_DIR, fd));
    for (const td of topicDirs) {
      const key = letter + "|" + normTitle(td);
      const entry = byNorm.get(key);
      if (!entry) {
        throw new Error(
          `No A1..J3 match for topic folder "${td}" under focus ${letter} (normalized "${normTitle(td)}")`,
        );
      }
      if (usedCodes.has(entry.code)) throw new Error(`Code ${entry.code} matched twice`);
      usedCodes.add(entry.code);
      result.push({ code: entry.code, letter, dir: path.join(FOCUS_AREAS_DIR, fd, td) });
    }
  }
  if (result.length !== 30)
    throw new Error(`Expected 30 topic folders, mapped ${result.length}`);
  return result;
}

// ---------------------------------------------------------------------------
// FA11 food pack: Focus Area K only. `_pack.md` inside the area folder plays
// the `_index.md` role (K1..K3 code | title | template count | one-line) since
// docs/page-copy carries no K rows yet. Same normalized-title folder matching
// and duplicate/missing guards as the full run; throws unless exactly 3 topics.
// ---------------------------------------------------------------------------
async function parseFoodPack(): Promise<{ index: IndexEntry[]; folders: TopicFolder[] }> {
  const areaDirs = (await listDirs(FOCUS_AREAS_DIR)).filter((d) => /^11\./.test(d));
  if (areaDirs.length !== 1)
    throw new Error(
      `--pack food expects exactly one "11. …" folder under "${FOCUS_AREAS_DIR}", found ${areaDirs.length}`,
    );
  const areaDir = path.join(FOCUS_AREAS_DIR, areaDirs[0]);

  const packMd = path.join(areaDir, "_pack.md");
  if (!(await exists(packMd)))
    throw new Error(`--pack food needs the K metadata file: "${packMd}"`);
  const text = await fs.readFile(packMd, "utf8");

  const index: IndexEntry[] = [];
  for (const line of text.split("\n")) {
    // | K1 | Title | 10 | one line |
    const m = line.match(/^\|\s*(K[1-3])\s*\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|/);
    if (!m) continue;
    const one_line = m[4].replace(/\s+/g, " ").trim();
    if (!one_line) throw new Error(`_pack.md: ${m[1]} has an empty one-line`);
    index.push({
      code: m[1],
      slug: m[1].toLowerCase(),
      title: m[2].trim(),
      templateCount: parseInt(m[3], 10),
      mdFile: "",
      one_line,
    });
  }
  if (index.length !== 3)
    throw new Error(`_pack.md: expected the 3 K1..K3 rows, parsed ${index.length}`);

  const byNorm = new Map(index.map((e) => ["K|" + normTitle(e.title), e]));
  const folders: TopicFolder[] = [];
  const usedCodes = new Set<string>();
  for (const td of await listDirs(areaDir)) {
    const entry = byNorm.get("K|" + normTitle(td));
    if (!entry) {
      throw new Error(
        `No K1..K3 match for topic folder "${td}" (normalized "${normTitle(td)}")`,
      );
    }
    if (usedCodes.has(entry.code)) throw new Error(`Code ${entry.code} matched twice`);
    usedCodes.add(entry.code);
    folders.push({ code: entry.code, letter: "K", dir: path.join(areaDir, td) });
  }
  if (folders.length !== 3)
    throw new Error(`Expected the 3 K topic folders, mapped ${folders.length}`);
  return { index, folders };
}

// ---------------------------------------------------------------------------
// Per-topic docx discovery (suffix glob — filenames are inconsistent)
// ---------------------------------------------------------------------------
// Normalize a filename for tolerant matching: strip diacritics + collapse every
// non-alphanumeric run to a single space (so "_What_To_Watch_Out_For_fixed.docx"
// and "_WTWOF.docx" are both reachable).
function normName(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Pick the first .docx whose normalized name contains any needle (and no excluded
// needle). Tolerates the inconsistent per-topic filenames.
function pickByContains(files: string[], needles: string[], exclude: string[] = []): string | null {
  for (const f of files) {
    if (!/\.docx$/i.test(f)) continue;
    const n = normName(f);
    if (exclude.some((e) => n.includes(e))) continue;
    if (needles.some((ndl) => n.includes(ndl))) return f;
  }
  return null;
}

async function docxToMarkdown(file: string): Promise<string | null> {
  const r = await mammoth.convertToMarkdown({ path: file });
  const v = cleanMd(r.value);
  return v.length ? v : null;
}

// ---------------------------------------------------------------------------
// Checklist parsing: HTML table -> items
// ---------------------------------------------------------------------------
interface ChecklistItem {
  group_label: string | null;
  gate: number | null;
  item_text: string;
  required_document: string | null;
  sort_order: number;
}

async function parseChecklist(file: string): Promise<ChecklistItem[]> {
  const html = (await mammoth.convertToHtml({ path: file })).value;
  const items: ChecklistItem[] = [];
  let currentSection: string | null = null;
  let sort = 0;

  const tables = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
  for (const table of tables) {
    const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    let itemCol = 1;
    let docCol = 4;
    let numCol = 0;
    let headerSeen = false;

    for (const row of rows) {
      const cells = (row.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? []).map(cellText);
      const nonEmpty = cells.filter(Boolean);
      if (nonEmpty.length === 0) continue;

      // Section header (one spanning cell starting with SECTION). Strip the
      // "SECTION A:" / "SECTION:" prefix (the FA11 food docx carry no letter
      // token) so group labels stay clean across packs.
      if (nonEmpty.length === 1 && /^section\b/i.test(nonEmpty[0])) {
        currentSection = nonEmpty[0].replace(/^section\s*[a-z0-9]*\s*[:\-—]\s*/i, "").trim() || nonEmpty[0].trim();
        continue;
      }
      // Skip completion-gate / how-to rows
      if (nonEmpty.length === 1 && /^(completion gate|how to use|pass =|fail =)/i.test(nonEmpty[0]))
        continue;

      // Header row: locate the columns by their labels
      const lower = cells.map((c) => c.toLowerCase());
      const itemIdx = lower.findIndex((c) => c === "checklist item" || c === "item");
      if (!headerSeen && itemIdx >= 0) {
        headerSeen = true;
        itemCol = itemIdx;
        const di = lower.findIndex((c) => c.includes("required document"));
        if (di >= 0) docCol = di;
        const ni = lower.findIndex((c) => c === "#" || c === "no" || c === "item #");
        numCol = ni >= 0 ? ni : 0;
        continue;
      }

      // Item row: numbered first cell + non-trivial item text
      const num = cells[numCol]?.trim() ?? "";
      const itemText = cells[itemCol]?.trim() ?? "";
      if (/^\d{1,3}$/.test(num) && itemText.length > 3) {
        sort += 1;
        const doc = cells[docCol]?.trim();
        items.push({
          group_label: currentSection,
          gate: null,
          item_text: itemText,
          required_document: doc && doc.length ? doc : null,
          sort_order: sort,
        });
      }
    }
  }
  return items;
}

// ---------------------------------------------------------------------------
// Build the full content model from disk
// ---------------------------------------------------------------------------
interface ElementRow {
  slug: string;
  code: string;
  focus_area_code: string;
  focus_area_name: string;
  title: string;
  one_line: string | null;
  overview_md: string | null;
  simple_guide_md: string | null;
  watch_out_for_md: string | null;
  sort_order: number;
}
interface TemplateFile {
  code: string;
  absPath: string;
  fileName: string;
  storagePath: string;
  title: string;
  type: ResourceType;
  sort_order: number;
}
interface Model {
  elements: ElementRow[];
  checklistByCode: Map<string, ChecklistItem[]>;
  academyByCode: Map<string, { title: string; one_line: string | null; body_md: string | null }>;
  templates: TemplateFile[];
  booklets: { absPath: string; fileName: string; title: string }[];
  wtwMissing: string[];
}

async function buildModel(): Promise<Model> {
  let index: IndexEntry[];
  let folders: TopicFolder[];
  if (PACK === "food") {
    ({ index, folders } = await parseFoodPack());
  } else {
    index = await parseIndex();
    folders = await mapTopicFolders(index);
  }
  const byCode = new Map(index.map((e) => [e.code, e]));

  const elements: ElementRow[] = [];
  const checklistByCode = new Map<string, ChecklistItem[]>();
  const academyByCode = new Map<string, { title: string; one_line: string | null; body_md: string | null }>();
  const templates: TemplateFile[] = [];
  const wtwMissing: string[] = [];

  for (const tf of folders.sort((a, b) => a.code.localeCompare(b.code))) {
    const entry = byCode.get(tf.code)!;
    const files = await listFiles(tf.dir);
    // Exclude "video script" everywhere so it never gets mistaken for a body file.
    const overviewF = pickByContains(files, ["overview"], ["video"]);
    const guideF = pickByContains(files, ["simple guide", "simpleguide"], ["video"]);
    const checklistF = pickByContains(files, ["checklist"], ["video"]);
    const wtwF = pickByContains(
      files,
      ["what to watch out for", "watch out for", "wtwof", "wtwo"],
      ["video"],
    );

    const overview_md = overviewF ? await docxToMarkdown(path.join(tf.dir, overviewF)) : null;
    const simple_guide_md = guideF ? await docxToMarkdown(path.join(tf.dir, guideF)) : null;
    const watch_out_for_md = wtwF ? await docxToMarkdown(path.join(tf.dir, wtwF)) : null;
    if (!wtwF) wtwMissing.push(tf.code);

    const one_line = entry.one_line ?? (entry.mdFile ? await readOneLine(entry.mdFile) : null);

    elements.push({
      slug: entry.slug,
      code: tf.code,
      focus_area_code: tf.letter,
      focus_area_name: FOCUS_NAME[tf.letter],
      title: entry.title,
      one_line,
      overview_md,
      simple_guide_md,
      watch_out_for_md,
      sort_order: parseInt(tf.code[1], 10),
    });

    // Academy body = the Simple Guide (locked mapping)
    academyByCode.set(tf.code, { title: entry.title, one_line, body_md: simple_guide_md });

    // Checklist
    const items = checklistF ? await parseChecklist(path.join(tf.dir, checklistF)) : [];
    checklistByCode.set(tf.code, items);

    // Templates
    const templatesDir = path.join(tf.dir, "Templates");
    if (await exists(templatesDir)) {
      const tfiles = (await listFiles(templatesDir)).sort();
      let idx = 0;
      for (const fn of tfiles) {
        idx += 1;
        const ext = path.extname(fn);
        const base = fn.slice(0, fn.length - ext.length);
        const m = base.match(/^T(\d+)\s*[—–-]\s*(.+)$/);
        const tnum = m ? parseInt(m[1], 10) : idx;
        const cleanName = (m ? m[2] : base).trim();
        templates.push({
          code: tf.code,
          absPath: path.join(templatesDir, fn),
          fileName: fn,
          storagePath: `${tf.code.toLowerCase()}/t${String(tnum).padStart(2, "0")}-${kebab(cleanName)}${ext.toLowerCase()}`,
          title: cleanName,
          type: resourceType(cleanName),
          sort_order: tnum,
        });
      }
    }
  }

  // Booklets (public) — full pack only; the food pack ships no booklets.
  const booklets: { absPath: string; fileName: string; title: string }[] = [];
  if (PACK === "full" && (await exists(BOOKLETS_DIR))) {
    for (const fn of (await listFiles(BOOKLETS_DIR)).filter((f) => /\.pdf$/i.test(f)).sort()) {
      const m = fn.match(/^Booklet_([A-Z])_(.+)\.pdf$/i);
      const title = m
        ? `Booklet ${m[1].toUpperCase()} — ${m[2].replace(/_/g, " ")}`
        : fn.replace(/_/g, " ").replace(/\.pdf$/i, "");
      booklets.push({ absPath: path.join(BOOKLETS_DIR, fn), fileName: fn, title });
    }
  }

  return { elements, checklistByCode, academyByCode, templates, booklets, wtwMissing };
}

// ---------------------------------------------------------------------------
// DB + Storage ingestion (idempotent upserts)
// ---------------------------------------------------------------------------
function getEnv(): { url: string; secret: string } {
  try {
    process.loadEnvFile(path.join(ROOT, ".env.local"));
  } catch {
    /* fall through to process.env (CI / exported vars) */
  }
  // Prefer the DEDICATED ingestion vars so this admin op can target TEST while the
  // app's NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY stay pointed wherever local
  // dev needs them. Set these two in .env.local to the TEST project before running:
  //   SUPABASE_INGEST_URL=https://sdszcralogcrujtyghig.supabase.co
  //   SUPABASE_INGEST_SECRET_KEY=sb_secret_…   (the TEST project's secret key)
  const url = process.env.SUPABASE_INGEST_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_INGEST_SECRET_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url)
    throw new Error("Missing SUPABASE_INGEST_URL (or NEXT_PUBLIC_SUPABASE_URL) in .env.local");
  if (!secret)
    throw new Error(
      "Missing SUPABASE_INGEST_SECRET_KEY (or SUPABASE_SECRET_KEY) in .env.local — the sb_secret_… key for the TEST project",
    );
  return { url, secret };
}

async function ensureBucket(db: SupabaseClient, id: string, isPublic: boolean): Promise<void> {
  const { error } = await db.storage.createBucket(id, { public: isPublic });
  if (error && !/already exists/i.test(error.message)) throw error;
}

async function pool<T>(items: T[], size: number, fn: (t: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

async function ingest(model: Model): Promise<void> {
  const { url, secret } = getEnv();
  const host = new URL(url).host;
  console.log(`\nIngesting into: ${host}`);

  // Safety: this script defaults to the TEST project. Production ingestion is run
  // DELIBERATELY by the human (WORKFLOW §14 / SUPABASE-MCP-SAFETY) and must pass
  // --i-understand-not-test, so a mis-pointed .env.local can never write prod by accident.
  const TEST_REF = "sdszcralogcrujtyghig";
  const parsed = new URL(url);
  // Exact-host match over https (NOT a substring include) so a look-alike host such as
  // `${TEST_REF}.evil.example` can never pass the guard and receive the secret/writes.
  const isTestTarget = parsed.protocol === "https:" && parsed.hostname === `${TEST_REF}.supabase.co`;
  if (!isTestTarget && !process.argv.includes("--i-understand-not-test")) {
    throw new Error(
      `Refusing to ingest into non-TEST target "${host}". This script targets the TEST project ` +
        `(https://${TEST_REF}.supabase.co). To run it against another project, pass --i-understand-not-test deliberately.`,
    );
  }

  const db = createClient(url, secret, { auth: { persistSession: false } });

  // 1) elements -> get ids
  const { data: elementRows, error: elErr } = await db
    .from("elements")
    .upsert(model.elements, { onConflict: "slug" })
    .select("id, slug, code");
  if (elErr) throw elErr;
  const idByCode = new Map<string, string>();
  for (const r of elementRows ?? []) idByCode.set((r as { code: string }).code, (r as { id: string }).id);
  console.log(`elements upserted: ${elementRows?.length ?? 0}`);

  // 2) checklist_items
  const checklistRows = [...model.checklistByCode.entries()].flatMap(([code, items]) =>
    items.map((it) => ({
      element_id: idByCode.get(code),
      group_label: it.group_label,
      gate: it.gate,
      item_text: it.item_text,
      required_document: it.required_document,
      sort_order: it.sort_order,
    })),
  );
  const { error: ciErr } = await db
    .from("checklist_items")
    .upsert(checklistRows, { onConflict: "element_id,item_text" });
  if (ciErr) throw ciErr;
  console.log(`checklist_items upserted: ${checklistRows.length}`);

  // 3) academy_modules
  const academyRows = [...model.academyByCode.entries()].map(([code, a]) => ({
    element_id: idByCode.get(code),
    title: a.title,
    one_line: a.one_line,
    length: null,
    youtube_url: null,
    body_md: a.body_md,
    sort_order: parseInt(code[1], 10),
  }));
  const { error: amErr } = await db
    .from("academy_modules")
    .upsert(academyRows, { onConflict: "element_id" });
  if (amErr) throw amErr;
  console.log(`academy_modules upserted: ${academyRows.length}`);

  // 4) resources (templates + booklets)
  const templateRows = model.templates.map((t) => ({
    title: t.title,
    type: t.type,
    focus_area_code: t.code[0],
    element_id: idByCode.get(t.code),
    version: "v1",
    storage_bucket: RESOURCES_BUCKET,
    storage_path: t.storagePath,
    is_public: false,
    sort_order: t.sort_order,
  }));
  const bookletRows = model.booklets.map((b, i) => ({
    title: b.title,
    type: "booklet" as const,
    focus_area_code: null,
    element_id: null,
    version: "v1",
    storage_bucket: BOOKLETS_BUCKET,
    storage_path: b.fileName,
    is_public: true,
    sort_order: i + 1,
  }));
  const { error: rErr } = await db
    .from("resources")
    .upsert([...templateRows, ...bookletRows], { onConflict: "storage_bucket,storage_path" });
  if (rErr) throw rErr;
  console.log(`resources upserted: ${templateRows.length} templates + ${bookletRows.length} booklets`);

  // 5) Storage uploads (idempotent: upsert)
  await ensureBucket(db, RESOURCES_BUCKET, false);
  await ensureBucket(db, BOOKLETS_BUCKET, true);

  let up = 0;
  let fail = 0;
  await pool(model.templates, 8, async (t) => {
    const buf = await fs.readFile(t.absPath);
    const { error } = await db.storage
      .from(RESOURCES_BUCKET)
      .upload(t.storagePath, buf, { upsert: true, contentType: contentTypeFor(path.extname(t.fileName)) });
    if (error) {
      fail += 1;
      console.error(`  upload FAILED ${t.storagePath}: ${error.message}`);
    } else up += 1;
  });
  await pool(model.booklets, 4, async (b) => {
    const buf = await fs.readFile(b.absPath);
    const { error } = await db.storage
      .from(BOOKLETS_BUCKET)
      .upload(b.fileName, buf, { upsert: true, contentType: "application/pdf" });
    if (error) {
      fail += 1;
      console.error(`  booklet upload FAILED ${b.fileName}: ${error.message}`);
    } else up += 1;
  });
  console.log(`storage uploads: ${up} ok, ${fail} failed`);
  if (fail > 0) throw new Error(`${fail} file upload(s) failed`);
}

// ---------------------------------------------------------------------------
// Report (dry-run + post-run summary)
// ---------------------------------------------------------------------------
function report(model: Model): void {
  const ex =
    PACK === "food"
      ? { elements: "3", checklist: "90", academy: "3", templates: "30", booklets: "0" }
      : { elements: "30", checklist: "200+", academy: "30", templates: "267", booklets: "2" };
  const checklistTotal = [...model.checklistByCode.values()].reduce((n, a) => n + a.length, 0);
  console.log("\n================ CONTENT MODEL ================");
  console.log(`elements         : ${model.elements.length} (expect ${ex.elements})`);
  console.log(`checklist_items  : ${checklistTotal} (expect ${ex.checklist})`);
  console.log(`academy_modules  : ${model.academyByCode.size} (expect ${ex.academy})`);
  console.log(`templates        : ${model.templates.length} (expect ${ex.templates})`);
  console.log(`booklets         : ${model.booklets.length} (expect ${ex.booklets})`);
  console.log(`WTW missing (-> null): ${model.wtwMissing.sort().join(", ") || "(none)"}`);

  console.log("\nPer-topic checklist counts:");
  for (const e of model.elements) {
    const n = model.checklistByCode.get(e.code)?.length ?? 0;
    const flag = n === 0 ? "  <-- ZERO" : "";
    const tmpl = model.templates.filter((t) => t.code === e.code).length;
    console.log(
      `  ${e.code} ${e.title.padEnd(44).slice(0, 44)} items=${String(n).padStart(2)} templates=${String(tmpl).padStart(2)}${flag}`,
    );
  }

  const spotCode = PACK === "food" ? "K1" : "A1";
  const spot = model.elements.find((e) => e.code === spotCode);
  if (spot) {
    console.log(`\nSpot-check ${spotCode}:`);
    console.log(`  one_line: ${spot.one_line}`);
    console.log(`  overview_md chars: ${spot.overview_md?.length ?? 0}`);
    console.log(`  simple_guide_md chars: ${spot.simple_guide_md?.length ?? 0}`);
    console.log(`  watch_out_for_md chars: ${spot.watch_out_for_md?.length ?? 0}`);
    console.log(`  first checklist item: ${model.checklistByCode.get(spotCode)?.[0]?.item_text?.slice(0, 90)}`);
  }
}

// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log(
    `S5 content ingestion — pack: ${PACK} — ${DRY_RUN ? "DRY RUN (no DB writes)" : "LIVE"}`,
  );
  const model = await buildModel();
  report(model);

  if (PACK === "food") {
    // The food pack is small and fully known: any mismatch is a hard error.
    if (model.elements.length !== 3) throw new Error("Food pack: element count != 3");
    for (const e of model.elements) {
      const n = model.checklistByCode.get(e.code)?.length ?? 0;
      if (n !== 30) throw new Error(`Food pack: ${e.code} checklist items ${n} != 30`);
    }
    if (model.templates.length !== 30) throw new Error("Food pack: template count != 30");
    if (model.wtwMissing.length > 0)
      throw new Error(`Food pack: What-To-Watch-Out-For missing for ${model.wtwMissing.join(", ")}`);
  } else {
    if (model.elements.length !== 30) throw new Error("Element count != 30");
    if (model.templates.length !== 267)
      console.warn(`WARNING: template count ${model.templates.length} != 267`);
  }

  if (DRY_RUN) {
    console.log("\nDry run complete — no database or storage changes made.");
    return;
  }
  await ingest(model);
  console.log("\nIngestion complete.");
}

main().catch((e) => {
  console.error("\nINGEST FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
