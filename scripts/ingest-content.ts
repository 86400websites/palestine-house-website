/**
 * scripts/ingest-content.ts — PP6b EXTRACTOR.
 *
 * Reads the owner's delivered content off disk and turns it into ONE reviewable
 * JSON file, `docs/content-v2-spec.json`. It touches no database, needs no
 * secret, and writes nothing else. Loading is a separate step with a separate
 * script (`scripts/load-content.ts`), because parsing 132 Word documents and
 * writing to a database are different jobs with different failure modes and
 * very different blast radii.
 *
 *   pnpm exec tsx scripts/ingest-content.ts            # extract + write the spec
 *   pnpm exec tsx scripts/ingest-content.ts --dry-run  # report only
 *
 * WHAT REPLACED WHAT, AND WHY (PP6b, 2026-08-15)
 * ----------------------------------------------
 * This file used to ingest the S5 curriculum: 30 focus areas, 267 templates,
 * plus `checklist_items` and `academy_modules`. All of that is gone.
 *   - its source directory, `docs/source-assets/resources/2. Focus Areas/`, no
 *     longer exists on disk;
 *   - it hard-failed unless it found exactly 30 focus areas and 267 templates,
 *     and the delivered content is 22 and 88;
 *   - and its write half fed `checklist_items` and `academy_modules`, which are
 *     retired tables whose read RPCs `0029` has already dropped. CLAUDE.md
 *     forbids adding a caller to them, so "rewrite the front half" was not
 *     enough — the back half had to go too.
 *
 * THE SOURCE (gitignored — OneDrive is canon)
 * -------------------------------------------
 * `docs/source-assets/Resource/Palestine House Website Content - Complet and
 * Formatted/` — 132 .docx, 4 sections, 22 focus areas, 22 Overviews, 22 Simple
 * Guides, 88 templates. The map, the decisions and the full trap list are in
 * `docs/content-migration-map.md`.
 *
 * THE TWO RULES THAT GOVERN EVERYTHING BELOW
 * ------------------------------------------
 *   1. Read the title from INSIDE the document, never from the folder name.
 *      Six of the 22 folders disagree with their documents, and the folder names
 *      carry typos the owner never wrote.
 *   2. Never rewrite the owner's wording. Where his file says `Responsiblity` or
 *      `House-toHouse`, so does the platform. Cleaning it up here would be an
 *      invisible edit to approved content.
 *
 * FAIL LOUDLY. Every structural expectation is asserted, not assumed: the
 * section a document declares must match the folder it sits in, the Overview and
 * the Guide must agree on the title, and the totals must come out at 4 / 22 / 88.
 * A silent partial extraction feeding a content load is the failure this script
 * exists to make impossible.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

// ---- mammoth (script-only devDep, ships no TS types) loaded via require + a typed shim ----
interface MammothResult {
  value: string;
  messages: { type: string; message: string }[];
}
interface Mammoth {
  convertToMarkdown(input: { path: string }): Promise<MammothResult>;
}
const mammoth = createRequire(import.meta.url)("mammoth") as Mammoth;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ROOT = process.cwd();
const SRC = path.join(
  ROOT,
  "docs/source-assets/Resource/Palestine House Website Content - Complet and Formatted",
);
const SPEC_OUT = path.join(ROOT, "docs/content-v2-spec.json");
const TOPIC_PHOTO_DIR = path.join(ROOT, "public/assets/workspace/topics");

const DRY_RUN = process.argv.includes("--dry-run");

const EXPECTED_SECTIONS = 4;
const EXPECTED_FOCUS_AREAS = 22;
const EXPECTED_TEMPLATES = 88;

/* THE EXPECTED SHAPE, focus area by focus area, from
   `docs/content-migration-map.md` §4.

   Totals alone are not an assertion. A template moved from one focus area to
   another leaves both folders non-empty and the grand total at 88, so 4/22/88
   would still pass while a partner found the file under the wrong heading; and
   a missing or duplicated focus-area number would pass as long as the count
   came out right. Raised by the independent review, 2026-08-15.

   Per-area counts and the complete set of numbers close both. If the owner
   genuinely adds or moves a template, this is a one-line edit and a deliberate
   one — which is the point. */
const EXPECTED_TEMPLATE_COUNTS: Record<string, number> = {
  "1.1": 2, "1.2": 5, "1.3": 4, "1.4": 5, "1.5": 4,
  "2.1": 5, "2.2": 6, "2.3": 6, "2.4": 5, "2.5": 4, "2.6": 3,
  "3.1": 3, "3.2": 5, "3.3": 5, "3.4": 4, "3.5": 2, "3.6": 4,
  "4.1": 5, "4.2": 5, "4.3": 3, "4.4": 1, "4.5": 2,
};

/* The delivered folders are numbered 1..4 and the platform's four toolkit
   sections are fixed by `platform_sections_slug_shape`, so this is a mapping,
   not a guess. Each document also DECLARES its own section on its first line
   ("Palestine House: Set Up"), and that declaration is checked against this
   table — a document filed under the wrong number fails the run.

   `declares` is compared after folding away case, spaces and punctuation, so
   the delivered "Set Up" and "Set up" both reduce to "setup". */
const SECTIONS = [
  { prefix: "1", slug: "setup", label: "Setup", declares: "setup" },
  { prefix: "2", slug: "operate", label: "Operate", declares: "operate" },
  { prefix: "3", slug: "program", label: "Program", declares: "program" },
  { prefix: "4", slug: "support", label: "Support", declares: "support" },
] as const;

/* One group per section (D-PP-n). The CMS derives a group's slug from its name,
   so these names are chosen to produce the slugs recorded in
   content-migration-map.md §3. A section with exactly one group renders as a
   flat list with no accordion header, which is why the name is never shown to a
   partner — it exists so the CMS has something to file focus areas under. */
const GROUP_NAME_SUFFIX = "focus areas";

/* D-PP-o: the 22 new focus areas reuse 22 of the 33 existing photographs,
   remapped by subject. Source of truth for this table is
   `docs/content-migration-map.md` §4; the owner reviews 1.1's at the pilot and
   the other 21 before PP6c goes Live. Each source file is asserted to exist. */
const PHOTO_BY_NUMBER: Record<string, string> = {
  "1.1": "legal-compliance-and-risk",
  "1.2": "business-model-and-revenue",
  "1.3": "facility-operations",
  "1.4": "org-structure-and-roles",
  "1.5": "launching-a-new-house",
  "2.1": "financial-operations-and-controls",
  "2.2": "operating-model",
  "2.3": "food-and-beverage-operations",
  "2.4": "membership-model-and-benefits",
  "2.5": "hiring-onboarding-and-training",
  "2.6": "reporting-kpis-and-audits",
  "3.1": "programming-model-and-pillars",
  "3.2": "event-production-sops",
  "3.3": "aswatna-studio-collaboration",
  "3.4": "local-marketing-playbook",
  "3.5": "customer-service-and-recovery",
  "3.6": "global-campaigns",
  "4.1": "brand-experience-standards",
  "4.2": "sustainability-and-impact",
  "4.3": "community-partnerships",
  "4.4": "crisis-management",
  "4.5": "continuous-improvement-and-knowledge-sharing",
};

/* The seven values `resources_type_check` allows. Rendered nowhere — this is
   bookkeeping, kept only so the column carries something honest. */
type ResourceType =
  | "form"
  | "script"
  | "log"
  | "report"
  | "approval"
  | "guide"
  | "booklet";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/* An anchor element with an empty body. Word's exporter emits one per bookmark
   and the delivered documents are full of them (19-21 each; the previous 33
   carried none). They are removed from the STORED text here, so the reader and
   the CMS textarea both show clean prose. They are also handled independently
   at render time by src/lib/workspace-v2/guide-cover.ts, for anything pasted
   through the CMS later. Only empty elements match, so no text can be lost. */
const EMPTY_ANCHOR = /<a\b[^>]*>\s*<\/a>/gi;

function stripAnchors(value: string): string {
  return value.replace(EMPTY_ANCHOR, "");
}

/* Undo mammoth's backslash escaping and normalise blank runs. Unchanged from
   the previous version of this script — it is the one piece that still applies. */
function cleanMd(md: string): string {
  return stripAnchors(md)
    .replace(/\r\n/g, "\n")
    .replace(/\\([^\w\s])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* A line reduced to its words, for STRUCTURAL comparison only. Never stored. */
function plain(line: string): string {
  return stripAnchors(line)
    .replace(/^#{1,6}\s*/, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fold(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/* Byte-for-byte the slugify the CMS uses (src/lib/admin/content-actions.ts).
   It is duplicated rather than imported because that module is a "use server"
   boundary and cannot be loaded into a plain Node script — but the two must not
   drift, or a focus area created by this script would get a different address
   from one created through the form. The regression check for that is that a
   re-run of the loader finds the row it created last time. */
function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function resourceType(name: string): ResourceType {
  const n = name.toLowerCase();
  if (/\bscript\b/.test(n)) return "script";
  if (/\blog\b/.test(n)) return "log";
  if (/report|summary|dashboard|kpi/.test(n)) return "report";
  if (/approval|sign-?off|escalation|breach|request to hq/.test(n))
    return "approval";
  if (/guide|reference|card|playbook|\bsop\b|policy|framework|matrix|protocol/.test(n))
    return "guide";
  return "form";
}

/* The first sentence, and everything after it.
 *
 * QUOTE-AWARE, and that is load-bearing rather than tidy: focus area 2.6 opens
 *   Instead of complex performance management, we have one monthly "How are we
 *   doing?" review.
 * and a split on the first `.!?` truncates the owner's sentence mid-quote. A
 * terminator only ends the sentence when it is outside quotation marks AND is
 * followed by the end of the line or by whitespace and a capital. */
/* Full stops that do not end a sentence. Lower-cased and matched as suffixes of
   the text up to and including the stop, so "e.g." matches on its final dot but
   not on the one after the "e". */
const ABBREVIATIONS = [
  "e.g.", "i.e.", "etc.", "vs.", "no.", "fig.", "approx.",
  "mr.", "mrs.", "ms.", "dr.", "prof.", "st.",
];

function splitFirstSentence(text: string): { first: string; rest: string } {
  const OPEN = new Set(['"', "“", "‘"]);
  const CLOSE = new Set(['"', "”", "’"]);
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    /* A straight quote is both marks, so toggle; the curly ones are directional.
       The apostrophe in "don't" is U+2019, which would close an unopened quote —
       hence only closing while actually inside one. */
    if (OPEN.has(ch) && !quoted) quoted = true;
    else if (CLOSE.has(ch) && quoted) quoted = false;
    if (quoted) continue;
    if (ch !== "." && ch !== "!" && ch !== "?") continue;

    /* An abbreviation's full stop is not a sentence ending. None of the 22
       delivered summaries contains one today, but PP6c reruns this over content
       that can change and a wrong split here silently truncates the owner's
       first sentence onto the card. Raised by the independent review. */
    if (ch === ".") {
      const before = text.slice(0, i + 1).toLowerCase();
      if (ABBREVIATIONS.some((a) => before.endsWith(a))) continue;
    }

    /* Consume any closing quote that belongs to the sentence being ended. */
    let end = i + 1;
    while (end < text.length && CLOSE.has(text[end])) end += 1;

    const after = text.slice(end);
    if (!after.trim()) return { first: text.slice(0, end).trim(), rest: "" };
    const next = after.match(/^\s+(\S)/);
    if (next && next[1] === next[1].toUpperCase()) {
      return { first: text.slice(0, end).trim(), rest: after.trim() };
    }
  }
  return { first: text.trim(), rest: "" };
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

function fail(where: string, message: string): never {
  throw new Error(`${where}: ${message}`);
}

// ---------------------------------------------------------------------------
// The model
// ---------------------------------------------------------------------------
export interface TemplateEntry {
  code: string; // T01, T02 … the badge on the card
  title: string; // the delivered filename, verbatim, minus the version suffix
  fileName: string;
  relPath: string; // relative to SRC, so the spec is readable and portable
  type: ResourceType;
  sortOrder: number;
}

export interface FocusAreaEntry {
  number: string; // "1.1"
  sectionSlug: string;
  groupSlug: string;
  slug: string;
  title: string;
  code: string; // elements.code — the delivered number
  summary: string; // platform_topics.description — the Overview's first sentence
  guideMd: string; // elements.simple_guide_md — Overview remainder + the guide
  /* The Simple Guide document itself, offered as the card's "Download Now".
     The same words the reader shows, as a file the partner can keep — which is
     why it is the delivered .docx and not something generated from the text.
     Registered with doc_key='guide', so the partial unique index allows exactly
     one per focus area and the templates-grid predicate excludes it. */
  guideFile: { fileName: string; relPath: string; title: string };
  photo: { source: string; target: string; imagePath: string };
  templates: TemplateEntry[];
  sourceDir: string;
  stats: { overviewChars: number; guideChars: number; summaryChars: number };
}

export interface ContentSpec {
  generatedBy: string;
  source: string;
  sections: { slug: string; label: string; groupSlug: string; groupName: string }[];
  totals: { sections: number; focusAreas: number; templates: number };
  focusAreas: FocusAreaEntry[];
}

// ---------------------------------------------------------------------------
// Parsing one focus area
// ---------------------------------------------------------------------------

/* Every delivered document opens the same way:
 *
 *     Palestine House: <Section>      <- the section it declares
 *     <Title>                         <- ONE OR MORE lines: 3.6 wraps
 *     Overview                        <- Overviews only
 *     <first prose line>
 *
 * The Guide's title line ends " Simple Guide" instead of being followed by an
 * Overview heading. Reading the title as "the second line" is wrong, which is
 * how the migration map came to record 3.6's title as "Connect to the Wider
 * Palestine". The block runs until the terminator, however many lines it takes.
 */
function parseCover(
  lines: string[],
  where: string,
  section: (typeof SECTIONS)[number],
  /* Returns null while the line is still title (or not yet the end), and the
     title fragment CARRIED BY the terminator line otherwise — "" for the
     Overview, whose "Overview" heading is a separator and not part of the name,
     and the leading words for the Guide, whose terminator IS the last title
     line ("<Title> Simple Guide"). Conflating those two produced the title
     "Get Legally Ready Overview" on the first run. */
  terminator: (line: string) => string | null,
): { title: string; bodyStart: number } {
  const head = plain(lines[0] ?? "");
  const declared = head.match(/^Palestine House\s*:\s*(.+)$/i)?.[1];
  if (!declared) {
    fail(where, `first line is not "Palestine House: <Section>" — got ${JSON.stringify(head)}`);
  }
  if (fold(declared) !== section.declares) {
    fail(
      where,
      `declares section ${JSON.stringify(declared.trim())} but sits under ${section.slug}`,
    );
  }

  const titleParts: string[] = [];
  for (let i = 1; i < lines.length && i <= 6; i += 1) {
    const text = plain(lines[i]);
    if (!text) continue;
    const carried = terminator(text);
    if (carried !== null) {
      if (carried) titleParts.push(carried);
      const title = titleParts.join(" ").replace(/\s+/g, " ").trim();
      if (!title) fail(where, "no title found above the cover terminator");
      return { title, bodyStart: i + 1 };
    }
    titleParts.push(text);
  }
  fail(where, "cover block never terminated within 6 lines");
}

async function toMarkdown(file: string): Promise<string> {
  const raw = (await mammoth.convertToMarkdown({ path: file })).value;
  const md = cleanMd(raw);
  /* If an anchor with real text inside it ever appears, the empty-anchor strip
     above is no longer sufficient and this script must be revisited before it
     silently changes what a partner reads. */
  if (/<a\b/i.test(md)) {
    fail(path.basename(file), "contains a non-empty <a> element — review before ingesting");
  }
  return md;
}

async function parseFocusArea(
  section: (typeof SECTIONS)[number],
  faDir: string,
  folderName: string,
): Promise<FocusAreaEntry> {
  const where = `${section.slug}/${folderName}`;
  const number = folderName.match(/^(\d+\.\d+)/)?.[1];
  if (!number) fail(where, "folder name has no N.M prefix");

  const files = await listFiles(faDir);
  /* EXACTLY ONE of each, not "the first one found". `find()` silently picks a
     winner, so a stray "Overview-old.docx" left beside the real one would be
     ingested or ignored at random while every total still came out at 4/22/88.
     Raised by the independent review, 2026-08-15. */
  const overviews = files.filter((f) => /overview/i.test(f) && /\.docx$/i.test(f));
  const guides = files.filter((f) => /simple\s*guide/i.test(f) && /\.docx$/i.test(f));
  if (overviews.length !== 1) {
    fail(where, `expected exactly 1 Overview .docx, found ${overviews.length}: ${overviews.join(" | ")}`);
  }
  if (guides.length !== 1) {
    fail(where, `expected exactly 1 Simple Guide .docx, found ${guides.length}: ${guides.join(" | ")}`);
  }
  const overviewFile = overviews[0];
  const guideFile = guides[0];

  const overviewMd = await toMarkdown(path.join(faDir, overviewFile));
  const guideMdRaw = await toMarkdown(path.join(faDir, guideFile));

  const overviewLines = overviewMd.split("\n");
  const guideLines = guideMdRaw.split("\n");

  const ov = parseCover(overviewLines, `${where} [Overview]`, section, (t) =>
    /^overview$/i.test(t) ? "" : null,
  );
  const gd = parseCover(guideLines, `${where} [Simple Guide]`, section, (t) =>
    /simple\s*guide$/i.test(t) ? t.replace(/\s*Simple Guide\s*$/i, "").trim() : null,
  );

  /* Two independent documents naming the same focus area. If they disagree, a
     human has to choose — this script must not. */
  if (fold(ov.title) !== fold(gd.title)) {
    fail(
      where,
      `Overview says ${JSON.stringify(ov.title)} but the Simple Guide says ${JSON.stringify(gd.title)}`,
    );
  }
  const title = ov.title;

  /* D-PP-m — the split. The Overview's opening sentence becomes the card
     summary; everything after it becomes the head of the Simple Guide, so it is
     the first thing a partner reads on Read Now. No Overview card returns, and
     no heading is invented to introduce it: inventing one would be writing copy. */
  const overviewBody = overviewLines
    .slice(ov.bodyStart)
    .join("\n")
    .replace(/^\s+/, "")
    .trimEnd();
  const firstLineEnd = overviewBody.indexOf("\n");
  const firstLine = (firstLineEnd === -1 ? overviewBody : overviewBody.slice(0, firstLineEnd)).trim();
  const afterFirstLine = firstLineEnd === -1 ? "" : overviewBody.slice(firstLineEnd + 1);
  const { first: summary, rest: firstLineRest } = splitFirstSentence(firstLine);

  if (summary.length < 25) {
    fail(where, `summary looks truncated (${summary.length} chars): ${JSON.stringify(summary)}`);
  }
  if (!/[.!?]["”’]?$/.test(summary)) {
    fail(where, `summary does not end on a sentence terminator: ${JSON.stringify(summary)}`);
  }

  const overviewRest = [firstLineRest, afterFirstLine.trim()].filter(Boolean).join("\n\n");
  const guideBody = guideLines.slice(gd.bodyStart).join("\n").replace(/^\s+/, "").trimEnd();
  if (!guideBody.trim()) fail(where, "Simple Guide has no body after its cover");
  const guideMd = [overviewRest, guideBody].filter(Boolean).join("\n\n");

  /* Templates. The folder is called Template-Samples, Template or Templates
     depending on the focus area — all three are accepted, and exactly one must
     be present. */
  const subDirs = await listDirs(faDir);
  if (subDirs.length !== 1) {
    fail(where, `expected exactly one templates folder, found ${subDirs.length}`);
  }
  if (!/^templates?(-samples)?$/i.test(subDirs[0])) {
    fail(where, `unexpected templates folder name ${JSON.stringify(subDirs[0])}`);
  }
  const tmplDir = path.join(faDir, subDirs[0]);
  const tmplFiles = (await listFiles(tmplDir)).filter((f) => /\.docx$/i.test(f)).sort();
  if (tmplFiles.length === 0) fail(where, "templates folder is empty");

  const templates: TemplateEntry[] = tmplFiles.map((fileName, i) => {
    const ext = path.extname(fileName);
    /* THE TEMPLATE TITLE RULE (settled at PP6b, one rule for all 88): the
       delivered filename, minus its extension and minus the `_V.1` version
       suffix, and nothing else. The owner's wording is never edited — where his
       file says "Responsiblity" or "House-toHouse", so does the card. The
       cleaned-up names in content-migration-map.md §4 are therefore a summary,
       not the source; PP6c re-syncs that table from this spec. */
    const base = fileName.slice(0, fileName.length - ext.length);
    const templateTitle = base.replace(/_V\.\d+(\.\d+)*$/i, "").trim();
    if (/_V\.\d/i.test(templateTitle)) {
      fail(where, `unhandled version suffix in ${JSON.stringify(fileName)}`);
    }
    if (!templateTitle) fail(where, `template filename reduces to nothing: ${fileName}`);
    return {
      code: `T${String(i + 1).padStart(2, "0")}`,
      title: templateTitle,
      fileName,
      relPath: path.relative(SRC, path.join(tmplDir, fileName)).split(path.sep).join("/"),
      type: resourceType(templateTitle),
      sortOrder: i + 1,
    };
  });

  const photoSlug = PHOTO_BY_NUMBER[number];
  if (!photoSlug) fail(where, `no photograph mapped for ${number} (content-migration-map.md §4)`);
  const photoSource = `${photoSlug}.jpg`;
  if (!(await exists(path.join(TOPIC_PHOTO_DIR, photoSource)))) {
    fail(where, `mapped photograph is missing: public/assets/workspace/topics/${photoSource}`);
  }

  const slug = slugify(title);
  if (!slug) fail(where, `title does not make a usable web address: ${JSON.stringify(title)}`);

  return {
    number,
    sectionSlug: section.slug,
    groupSlug: slugify(`${section.label} ${GROUP_NAME_SUFFIX}`),
    slug,
    title,
    code: number,
    summary,
    guideMd,
    /* Same naming rule as the templates: the delivered filename, minus its
       extension and version suffix, never re-worded. */
    guideFile: {
      fileName: guideFile,
      relPath: path.relative(SRC, path.join(faDir, guideFile)).split(path.sep).join("/"),
      title: path
        .basename(guideFile, path.extname(guideFile))
        .replace(/_V\.\d+(\.\d+)*$/i, "")
        .replace(/\s*-\s*$/, "")
        .trim(),
    },
    photo: {
      source: photoSource,
      target: `${slug}.jpg`,
      imagePath: `/assets/workspace/topics/${slug}.jpg`,
    },
    templates,
    sourceDir: path.relative(SRC, faDir).split(path.sep).join("/"),
    stats: {
      overviewChars: overviewMd.length,
      guideChars: guideMd.length,
      summaryChars: summary.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
async function buildSpec(): Promise<ContentSpec> {
  if (!(await exists(SRC))) fail("source", `not found: ${SRC}`);

  const sectionDirs = (await listDirs(SRC)).sort();
  if (sectionDirs.length !== EXPECTED_SECTIONS) {
    fail("source", `expected ${EXPECTED_SECTIONS} section folders, found ${sectionDirs.length}`);
  }

  const focusAreas: FocusAreaEntry[] = [];
  const seenSlugs = new Set<string>();

  for (const dirName of sectionDirs) {
    const prefix = dirName.match(/^(\d+)\./)?.[1];
    const section = SECTIONS.find((s) => s.prefix === prefix);
    if (!section) fail("source", `section folder has no known 1-4 prefix: ${dirName}`);

    for (const folderName of (await listDirs(path.join(SRC, dirName))).sort()) {
      const entry = await parseFocusArea(
        section,
        path.join(SRC, dirName, folderName),
        folderName,
      );
      if (seenSlugs.has(entry.slug)) {
        fail(entry.sourceDir, `two focus areas produce the same address "${entry.slug}"`);
      }
      seenSlugs.add(entry.slug);
      focusAreas.push(entry);
    }
  }

  const templates = focusAreas.reduce((n, f) => n + f.templates.length, 0);
  if (focusAreas.length !== EXPECTED_FOCUS_AREAS) {
    fail("totals", `expected ${EXPECTED_FOCUS_AREAS} focus areas, extracted ${focusAreas.length}`);
  }
  if (templates !== EXPECTED_TEMPLATES) {
    fail("totals", `expected ${EXPECTED_TEMPLATES} templates, extracted ${templates}`);
  }

  /* The complete NUMBER SET, so a missing 3.4 cannot be masked by a duplicated
     3.3, and the PER-AREA counts, so a template cannot migrate between focus
     areas unnoticed. Totals are not a shape. */
  const found = focusAreas.map((f) => f.number).sort();
  const wanted = Object.keys(EXPECTED_TEMPLATE_COUNTS).sort();
  const missing = wanted.filter((n) => !found.includes(n));
  const unexpected = found.filter((n) => !wanted.includes(n));
  const duplicated = found.filter((n, i) => found.indexOf(n) !== i);
  if (missing.length || unexpected.length || duplicated.length) {
    fail(
      "totals",
      `focus-area numbers do not match the expected set — missing [${missing}], ` +
        `unexpected [${unexpected}], duplicated [${duplicated}]`,
    );
  }
  for (const f of focusAreas) {
    const want = EXPECTED_TEMPLATE_COUNTS[f.number];
    if (f.templates.length !== want) {
      fail(
        f.sourceDir,
        `expected ${want} templates for ${f.number}, found ${f.templates.length} ` +
          `(content-migration-map.md §4). If the owner really changed this, update EXPECTED_TEMPLATE_COUNTS.`,
      );
    }
  }

  return {
    generatedBy: "scripts/ingest-content.ts (PP6b)",
    source:
      "docs/source-assets/Resource/Palestine House Website Content - Complet and Formatted",
    sections: SECTIONS.map((s) => ({
      slug: s.slug,
      label: s.label,
      groupSlug: slugify(`${s.label} ${GROUP_NAME_SUFFIX}`),
      groupName: `${s.label} ${GROUP_NAME_SUFFIX}`,
    })),
    totals: { sections: EXPECTED_SECTIONS, focusAreas: focusAreas.length, templates },
    focusAreas,
  };
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
function report(spec: ContentSpec): void {
  console.log("\n================ CONTENT MODEL (v2) ================");
  console.log(`sections    : ${spec.totals.sections}`);
  console.log(`focus areas : ${spec.totals.focusAreas}`);
  console.log(`templates   : ${spec.totals.templates}`);

  let lastSection = "";
  for (const f of spec.focusAreas) {
    if (f.sectionSlug !== lastSection) {
      lastSection = f.sectionSlug;
      console.log(`\n--- ${f.sectionSlug} ---`);
    }
    console.log(
      `  ${f.number}  ${f.title.padEnd(46).slice(0, 46)} /${f.slug}`.padEnd(100) +
        `templates=${String(f.templates.length).padStart(2)} guide=${String(f.stats.guideChars).padStart(5)} summary=${String(f.stats.summaryChars).padStart(3)}`,
    );
    console.log(`        photo: ${f.photo.source} -> ${f.photo.target}`);
    console.log(`        summary: ${f.summary}`);
  }

  const longest = [...spec.focusAreas].sort(
    (a, b) => b.stats.summaryChars - a.stats.summaryChars,
  )[0];
  const shortest = [...spec.focusAreas].sort(
    (a, b) => a.stats.summaryChars - b.stats.summaryChars,
  )[0];
  console.log(
    `\nsummary length: ${shortest.stats.summaryChars}-${longest.stats.summaryChars} chars` +
      ` (shortest ${shortest.number}, longest ${longest.number})`,
  );
}

// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log(`PP6b content extraction — ${DRY_RUN ? "DRY RUN (no spec written)" : "writing the spec"}`);
  const spec = await buildSpec();
  report(spec);

  if (DRY_RUN) {
    console.log("\nDry run complete — nothing written.");
    return;
  }
  await fs.writeFile(SPEC_OUT, `${JSON.stringify(spec, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${path.relative(ROOT, SPEC_OUT)}`);
  console.log("No database was touched — loading is scripts/load-content.ts.");
}

main().catch((e) => {
  console.error("\nEXTRACTION FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
