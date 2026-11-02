/**
 * scripts/cr1-extract.ts — CR1 EXTRACTOR. Offline: no network, no credentials.
 *
 *   pnpm exec tsx scripts/cr1-extract.ts
 *
 * Reads the owner's delivery and writes ONE private file, `_private/cr1-spec.json`,
 * for `scripts/cr1-content.ts` to load. Same split as PP6b, for the same reason:
 * parsing documents and writing to a database have different blast radii. The
 * historical `ingest-content.ts` targets the previous release and is not reused:
 * its Overview-to-summary split is exactly what this delivery's handover replaces.
 *
 * WHAT IT PROVES BEFORE IT WRITES ANYTHING
 * ----------------------------------------
 *  - every file is present and byte-identical to the manifest taken when the
 *    delivery was moved out of `public/`;
 *  - the totals on disk: 22 Overviews, 22 Simple Guides, 83 practical resources
 *    (80 DOCX, 1 PNG, 2 SVG), 26 scripts, 3 copy documents;
 *  - for each focus area, three independent lists agree: the folder on disk, the
 *    upload table in Private_Website_Copy.docx, and the private identity map;
 *  - every old template code is either mapped or retired, exactly once, and no
 *    code is reused for different content;
 *  - every cross-link names a resource that really lives in the focus area it
 *    claims, and matches `src/lib/workspace-v2/shared-resources.ts`;
 *  - the PNG is a PNG and the SVGs contain nothing active or external;
 *  - each stored guide body has the same words in the same order as its document,
 *    apart from the cover block, once rendered.
 *
 * Printed output is counts, apart from a failure line, which can quote what failed.
 * Titles, bodies and keys otherwise stay in the private file.
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { marked } from "marked";
import { checkSvgSafety, isPng } from "../src/lib/admin/file-safety";
import { fileKindOf, SHARED_RESOURCES } from "../src/lib/workspace-v2/shared-resources";
import { stripGuideCover } from "../src/lib/workspace-v2/guide-cover";
import {
  CONTENT_TYPE,
  COPY_ROOT,
  DELIVERY,
  DELIVERY_MANIFEST_PATH,
  displayTitle,
  EXPECTED,
  fold,
  IDENTITY_PATH,
  LEARNER_ROOT,
  OVERVIEW_CODE,
  SPEC_PATH,
  TOPICS,
  VIDEO_MAP_PATH,
  wordsOf,
  type Cr1Spec,
  type SpecCrossLink,
  type SpecFile,
  type SpecRetired,
  type SpecTemplate,
  type SpecTopic,
} from "./lib/cr1";

interface MammothResult {
  value: string;
}
interface Mammoth {
  convertToHtml(input: { path: string }): Promise<MammothResult>;
  convertToMarkdown(input: { path: string }): Promise<MammothResult>;
  extractRawText(input: { path: string }): Promise<MammothResult>;
}
const mammoth = createRequire(import.meta.url)("mammoth") as Mammoth;

const ROOT = process.cwd();
const OLD_SPEC = path.join(ROOT, "docs/content-v2-spec.json");

function fail(message: string): never {
  throw new Error(message);
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const rel = (base: string, p: string) => path.relative(base, p).split(path.sep).join("/");

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/* Block boundaries separate words; inline markup never does ("Templates</a>;" is
   one word followed by its semicolon, exactly as the document has it). */
function stripTags(html: string): string {
  return decode(
    html
      .replace(/<\/?(p|li|ul|ol|h[1-6]|div|table|thead|tbody|tr|td|th|blockquote|pre|hr|br)\b[^>]*>/g, " ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// 1. The delivery on disk
// ---------------------------------------------------------------------------
function checkDelivery(): string {
  if (!existsSync(DELIVERY_MANIFEST_PATH)) fail("delivery manifest missing: the delivery was never verified");
  const manifest = JSON.parse(readFileSync(DELIVERY_MANIFEST_PATH, "utf8")) as {
    rel: string;
    bytes: number;
    sha256: string;
  }[];
  const onDisk = walk(DELIVERY).map((p) => rel(DELIVERY, p)).sort();
  const expected = manifest.map((m) => m.rel).sort();
  if (JSON.stringify(onDisk) !== JSON.stringify(expected)) {
    const missing = expected.filter((r) => !onDisk.includes(r));
    const extra = onDisk.filter((r) => !expected.includes(r));
    fail(`the delivery changed since it was inventoried. missing ${missing.length}, extra ${extra.length}`);
  }
  for (const m of manifest) {
    const sha = createHash("sha256").update(readFileSync(path.join(DELIVERY, m.rel))).digest("hex");
    if (sha !== m.sha256) fail(`the delivery changed since it was inventoried: ${m.rel}`);
  }
  if (manifest.length !== EXPECTED.files) fail(`expected ${EXPECTED.files} files, found ${manifest.length}`);
  return createHash("sha256")
    .update(manifest.map((m) => `${m.rel}|${m.sha256}`).join("\n"))
    .digest("hex");
}

// ---------------------------------------------------------------------------
// 2. Private_Website_Copy.docx: section 3 to 6 cards
// ---------------------------------------------------------------------------
interface DocCard {
  number: string;
  folder: string;
  title: string;
  summary: string;
  introMd: string;
  videoMapping: string;
  script: string;
  uploads: { file: string; place: "Topic folder" | "Templates" }[];
  shared: { path: string }[];
}

type Block = { tag: string; html: string };

function blocksOf(html: string): Block[] {
  const out: Block[] = [];
  const re = /<(h[1-6]|p|ul|ol|table)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push({ tag: m[1], html: m[2] });
  return out;
}

/* A paragraph or list item to Markdown, keeping only what the copy actually uses:
   emphasis and real anchors. A bare URL or address stays bare, and GFM links it
   at render time. */
function inlineMd(html: string): string {
  return decode(
    html
      .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, (_, href: string, text: string) => {
        const t = text.replace(/<[^>]+>/g, "");
        return t === href ? t : `[${t}](${href})`;
      })
      .replace(/<strong>([\s\S]*?)<\/strong>/g, "__$1__")
      .replace(/<em>([\s\S]*?)<\/em>/g, "_$1_")
      .replace(/<br\s*\/?>/g, " ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function labelled(block: Block, label: string): string | null {
  if (block.tag !== "p") return null;
  const m = block.html.match(/^<strong>([^<]*)<\/strong>\s*([\s\S]*)$/);
  if (!m) return null;
  const head = decode(m[1]).trim().replace(/:$/, "");
  return head === label ? stripTags(m[2]) : null;
}

function parseCards(html: string): DocCard[] {
  const blocks = blocksOf(html);
  const cards: DocCard[] = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i];
    if (b.tag !== "h2" || !/^[3-6]\.\d+ Card \d+:/.test(stripTags(b.html))) continue;
    const where = stripTags(b.html);

    let j = i + 1;
    const take = (label: string): string => {
      const v = labelled(blocks[j], label);
      if (v === null) fail(`${where}: expected "${label}", found ${JSON.stringify(stripTags(blocks[j]?.html ?? ""))}`);
      j += 1;
      return v;
    };

    const title = take("Replacement title");
    take("Summary");
    if (blocks[j].tag !== "p") fail(`${where}: Summary paragraph missing`);
    const summary = stripTags(blocks[j].html);
    j += 1;
    take("Expanded body");

    /* Everything up to and including the goal line is website copy, in document
       order: an optional lead, the list, an optional closing note, the goal. */
    const parts: string[] = [];
    for (; ; j += 1) {
      const block = blocks[j];
      if (!block) fail(`${where}: ran out of document before "Our goal is simple"`);
      const goal = labelled(block, "Our goal is simple");
      if (goal !== null) {
        parts.push(`__Our goal is simple:__ ${goal}`);
        j += 1;
        break;
      }
      if (block.tag === "ul") {
        const items = [...block.html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => `- ${inlineMd(m[1])}`);
        if (items.length === 0) fail(`${where}: empty list in Expanded body`);
        parts.push(items.join("\n"));
      } else if (block.tag === "p") {
        parts.push(inlineMd(block.html));
      } else {
        fail(`${where}: unexpected <${block.tag}> in Expanded body`);
      }
    }

    take("Buttons");
    const videoMapping = take("Video mapping");
    const folder = take("Topic folder").replace(/\/+$/, "");
    const script = take("Production script");
    const number = folder.match(/\/(\d\.\d) /)?.[1] ?? fail(`${where}: no N.M in topic folder ${folder}`);

    take("Upload and link these learner resources");
    j += 1; // the instruction paragraph under it
    if (blocks[j].tag !== "table") fail(`${where}: upload table missing`);
    const uploads = [...blocks[j].html.matchAll(/<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g)].map((m) => ({
      file: stripTags(m[1]),
      place: stripTags(m[2]) as "Topic folder" | "Templates",
    }));
    j += 1;

    const shared: { path: string }[] = [];
    if (blocks[j] && labelled(blocks[j], "Shared resources from other focus areas") !== null) {
      j += 2; // the label and its instruction paragraph
      if (blocks[j].tag !== "ul") fail(`${where}: shared-resource list missing`);
      for (const m of blocks[j].html.matchAll(/<li>([\s\S]*?)<\/li>/g)) shared.push({ path: stripTags(m[1]) });
    }

    cards.push({ number, folder, title, summary, introMd: parts.join("\n\n"), videoMapping, script, uploads, shared });
    i = j - 1;
  }
  return cards;
}

function parseVideoTable(html: string): { video: number; page: string; handoverId: string; script: string }[] {
  const start = html.indexOf("Video placement checklist");
  if (start < 0) fail("Private copy: no video placement checklist");
  const table = html.slice(start).match(/<table>([\s\S]*?)<\/table>/)?.[1] ?? fail("video table missing");
  return [...table.matchAll(/<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g)].map((m) => ({
    video: Number(stripTags(m[1])),
    page: stripTags(m[2]),
    handoverId: stripTags(m[3]),
    script: stripTags(m[4]),
  }));
}

// ---------------------------------------------------------------------------
// 3. A guide document to the stored Markdown
// ---------------------------------------------------------------------------
const EMPTY_ANCHOR = /<a\b[^>]*>\s*<\/a>/gi;

function cleanMd(md: string): string {
  return md
    .replace(EMPTY_ANCHOR, "")
    .replace(/\r\n/g, "\n")
    .replace(/\\([^\w\s])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function plain(line: string): string {
  return line
    .replace(/^#{1,6}\s*/, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const SECTION_DECLARES: Record<string, string> = {
  setup: "setup",
  operate: "operate",
  program: "program",
  support: "support",
};

/* Every delivered guide opens with `Palestine House: <Section>`, then a title over
   one or more lines, ending on `Simple Guide`. The reader prints the title as its
   h1, so the cover comes off here. It is matched and asserted, never guessed: the
   declared section must be the folder's, and the words must name this focus area. */
function stripCover(lines: string[], topic: { section: string; title: string; where: string }): { body: string[]; removed: string[] } {
  const nonBlank = lines.map((l, i) => ({ l, i })).filter((x) => x.l.trim());
  const first = plain(nonBlank[0]?.l ?? "");
  const declared = first.match(/^Palestine House\s*:\s*(.+)$/i)?.[1];
  if (!declared) fail(`${topic.where}: first line is not "Palestine House: <Section>", got ${JSON.stringify(first)}`);
  if (fold(declared) !== SECTION_DECLARES[topic.section]) {
    fail(`${topic.where}: declares section ${JSON.stringify(declared)} but sits under ${topic.section}`);
  }
  const titleParts: string[] = [];
  for (let k = 1; k < nonBlank.length && k <= 5; k += 1) {
    const text = plain(nonBlank[k].l);
    if (/simple\s*guide$/i.test(text)) {
      titleParts.push(text.replace(/\s*simple\s*guide$/i, ""));
      const named = fold(titleParts.join(" "));
      if (named !== fold(topic.title)) {
        fail(`${topic.where}: cover names ${JSON.stringify(titleParts.join(" "))}, expected ${JSON.stringify(topic.title)}`);
      }
      const cut = nonBlank[k].i + 1;
      return { body: lines.slice(cut), removed: nonBlank.slice(0, k + 1).map((x) => plain(x.l)) };
    }
    titleParts.push(text);
  }
  fail(`${topic.where}: cover block never reached "Simple Guide"`);
}

const WHOLLY_BOLD = /^(?:__|\*\*)(.+?)\s*(?:__|\*\*)$/;
const STEP_LINE = /^Step\s+\d+\.\s+\S/;
const STRUCTURAL_H2 = /^Our Final Check$/;
const STRUCTURAL_H3 = /^(Simple question|What you need to do:)$/;

/* The export styles the same structure several ways: `Step 3.` is a heading in
   some documents, bold in others, plain text in the rest; `Simple question` is
   usually `###` and once a plain line. A reader that follows the export draws the
   hierarchy differently from guide to guide, so these few known structural lines
   are given one level each. ADDS NO WORD AND CHANGES NO WORD: only the marks
   around a line that is ENTIRELY one of these. Everything else is left alone. */
function normaliseStructure(lines: string[]): string[] {
  return lines.map((line) => {
    const bare = line.trim();
    if (!bare) return line;
    if (/^(?:-|\*\s|>|\d+\.\s)/.test(bare)) return line;

    const heading = bare.match(/^(#{1,6})\s+(.*)$/);
    const inner = heading ? heading[2].trim() : bare;
    const text = (inner.match(WHOLLY_BOLD)?.[1] ?? inner).trim();

    if (STEP_LINE.test(text) || STRUCTURAL_H2.test(text)) return `## ${text}`;
    if (STRUCTURAL_H3.test(text)) return `### ${text}`;
    /* A heading of any other kind: one level below the reader's own h1, and a
       heading is already emphasised, so literal marks inside it would print. */
    if (heading) return `${"#".repeat(Math.max(2, heading[1].length))} ${text}`;
    /* `__text __` is not emphasis in Markdown and would print its underscores. */
    if (WHOLLY_BOLD.test(bare)) return `__${text}__`;
    /* The reader draws a paragraph's only <strong> as a heading (the CSS cannot see
       the text around it), which would break a sentence in two around one bold
       phrase. Such a phrase becomes <b>, which the sanitizer allows: same words,
       same weight, still inline. */
    const bolds = bare.match(/__[^_]+__/g) ?? [];
    if (bolds.length === 1) return line.replace(bolds[0], `<b>${bolds[0].slice(2, -2)}</b>`);
    return line;
  });
}

const SECTION_OF_WORD: Record<string, string> = { Setup: "setup", Operate: "operate", Program: "program", Support: "support" };

/* A document says "Program 3.2" or "Setup 1.1 > Templates"; on the website that is
   a place you can go. These become deep links to the focus-area card, with the
   words untouched, so a package reference resolves to a real destination and never
   to a local path. A reference whose section and number disagree is left as text
   and reported: it is a typo for a human, not something to guess at. */
export function linkifyReferences(md: string, own: { section: string; slug: string }, where: string): string {
  const byNumber = new Map(TOPICS.map((t) => [t.number, t]));
  return md
    .replace(/\b(Setup|Operate|Program|Support) ([1-4]\.[1-6])( > Templates)?/g, (all, word: string, num: string) => {
      const topic = byNumber.get(num);
      if (!topic || topic.section !== SECTION_OF_WORD[word]) {
        console.warn(`  ! ${where}: reference "${all}" does not resolve; left as text`);
        return all;
      }
      return `[${all}](/${topic.section}#topic-${topic.slug})`;
    })
    .replace(/this folder[’']s Templates/g, (all) => `[${all}](/${own.section}#topic-${own.slug})`);
}

async function guideToMarkdown(
  file: string,
  topic: { section: string; slug: string; title: string; number: string },
): Promise<string> {
  const where = `${topic.number} guide`;
  const raw = (await mammoth.convertToMarkdown({ path: file })).value;
  if (/!\[|<img/i.test(raw.replace(/data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+/g, ""))) {
    fail(`${where}: has an inline image in its body; decide how to serve it before ingesting`);
  }
  const cleaned = cleanMd(raw);
  if (/<a\b/i.test(cleaned)) fail(`${where}: non-empty <a> element; review before ingesting`);

  const { body, removed } = stripCover(cleaned.split("\n"), { section: topic.section, title: topic.title, where });
  const structured = normaliseStructure(body).join("\n").replace(/^\s+/, "").trimEnd();
  const md = linkifyReferences(structured, topic, where);

  /* NOTHING LOST, NOTHING ADDED. The document's raw text minus the cover must be
     the same words in the same order as the rendered result. Rendering is `marked`
     alone: the sanitizer only ever removes markup, and the live reader is checked
     over HTTP separately. */
  const rawText = (await mammoth.extractRawText({ path: file })).value;
  const rawWords = wordsOf(rawText);
  const coverWords = wordsOf(removed.join(" "));
  const rendered = wordsOf(stripTags(marked.parse(md, { gfm: true, breaks: true }) as string));
  const expected = rawWords.slice(coverWords.length);
  if (JSON.stringify(rendered) !== JSON.stringify(expected)) {
    let at = 0;
    while (at < rendered.length && rendered[at] === expected[at]) at += 1;
    fail(
      `${where}: words differ from the document at word ${at}: ` +
        `document ${JSON.stringify(expected.slice(at, at + 6).join(" "))} vs rendered ${JSON.stringify(rendered.slice(at, at + 6).join(" "))}`,
    );
  }

  /* The reader runs stripGuideCover on every body. Having already removed the
     cover, it must now be a no-op, or a first line of real text is at risk. */
  const sectionLabel = topic.section[0].toUpperCase() + topic.section.slice(1);
  if (stripGuideCover(md, [topic.title], sectionLabel) !== md) {
    fail(`${where}: the reader's cover stripper would remove text from this body`);
  }
  return md;
}

// ---------------------------------------------------------------------------
// 4. Build
// ---------------------------------------------------------------------------
function fileEntry(absPath: string, keyFolder: string, slug: string): SpecFile {
  const buf = readFileSync(absPath);
  const fileName = path.basename(absPath);
  const ext = path.extname(fileName).toLowerCase();
  const contentType = CONTENT_TYPE[ext] ?? fail(`unsupported file type: ${fileName}`);
  return {
    fileName,
    relPath: rel(LEARNER_ROOT, absPath),
    storageKey: `${slug}/${keyFolder}/${fileName}`,
    contentType,
    bytes: statSync(absPath).size,
    sha256: createHash("sha256").update(buf).digest("hex"),
    md5: createHash("md5").update(buf).digest("hex"),
    title: displayTitle(fileName),
  };
}

function exactlyOne(files: string[], where: string): string {
  if (files.length !== 1) fail(`${where}: expected exactly 1, found ${files.length}`);
  return files[0];
}

async function main(): Promise<void> {
  const fingerprint = checkDelivery();
  const keyFolder = `cr1-${fingerprint.slice(0, 8)}`;
  console.log(`delivery verified against its manifest: ${EXPECTED.files} files`);

  const all = walk(LEARNER_ROOT);
  const scripts = all.filter((f) => /^Video Script - /.test(path.basename(f)));
  const overviews = all.filter((f) => /^Overview - /.test(path.basename(f)));
  const guides = all.filter((f) => /^Simple Guide - /.test(path.basename(f)));
  const templates = all.filter((f) => path.basename(path.dirname(f)) === "Templates");
  const exts = (ext: string) => templates.filter((f) => path.extname(f).toLowerCase() === ext).length;

  const counts: [string, number, number][] = [
    ["overviews", overviews.length, EXPECTED.overviews],
    ["simple guides", guides.length, EXPECTED.guides],
    ["practical resources", templates.length, EXPECTED.templates],
    ["  docx", exts(".docx"), EXPECTED.templateDocx],
    ["  png", exts(".png"), EXPECTED.templatePng],
    ["  svg", exts(".svg"), EXPECTED.templateSvg],
    ["video scripts", scripts.length, EXPECTED.scripts],
    ["learner files", overviews.length + guides.length + templates.length, EXPECTED.learner],
    ["all under the content folder", all.length, EXPECTED.learner + EXPECTED.scripts],
  ];
  for (const [what, got, want] of counts) {
    if (got !== want) fail(`${what}: expected ${want}, found ${got}`);
    console.log(`  ${what.padEnd(30)} ${got}`);
  }
  if (walk(COPY_ROOT).length !== EXPECTED.copyDocs) fail("website-copy folder does not hold exactly 3 files");

  /* Supplied active-format files, before anything can be served. */
  for (const f of templates) {
    const ext = path.extname(f).toLowerCase();
    if (ext === ".png" && !isPng(readFileSync(f))) fail(`${path.basename(f)} is not a PNG`);
    if (ext === ".svg") {
      const problems = checkSvgSafety(readFileSync(f, "utf8"));
      if (problems.length) fail(`${path.basename(f)} failed the SVG check: ${problems.join("; ")}`);
    }
  }
  console.log("  png signature and svg safety checks passed");

  const docHtml = (await mammoth.convertToHtml({ path: path.join(COPY_ROOT, "Private_Website_Copy.docx") })).value;
  const cards = parseCards(docHtml);
  if (cards.length !== TOPICS.length) fail(`Private copy: expected ${TOPICS.length} topic cards, parsed ${cards.length}`);

  const identity = JSON.parse(readFileSync(IDENTITY_PATH, "utf8")) as Record<
    string,
    { map: Record<string, string>; retire: Record<string, string>; add: string[] }
  >;
  const oldSpec = JSON.parse(readFileSync(OLD_SPEC, "utf8")) as {
    focusAreas: {
      number: string;
      title: string;
      guideFile: { title: string };
      templates: { code: string; title: string }[];
    }[];
  };

  const topics: SpecTopic[] = [];
  let replaced = 0;
  let added = 0;
  let retired = 0;

  for (const t of TOPICS) {
    const card = cards.find((c) => c.number === t.number) ?? fail(`Private copy has no card for ${t.number}`);
    const dir = path.join(LEARNER_ROOT, card.folder);
    if (!existsSync(dir)) fail(`${t.number}: topic folder from the document not on disk`);

    const topLevel = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name);
    const overviewName = exactlyOne(topLevel.filter((n) => /^Overview - /.test(n)), `${t.number} overview`);
    const guideName = exactlyOne(topLevel.filter((n) => /^Simple Guide - /.test(n)), `${t.number} guide`);
    const tmplDir = path.join(dir, "Templates");
    const onDisk = readdirSync(tmplDir).sort();

    /* The three lists must agree. A file moved between focus areas leaves every
       total right; only the names catch it. */
    const docTemplates = card.uploads.filter((u) => u.place === "Templates").map((u) => u.file).sort();
    const docTop = card.uploads.filter((u) => u.place === "Topic folder").map((u) => u.file).sort();
    if (JSON.stringify(docTemplates) !== JSON.stringify(onDisk)) {
      fail(`${t.number}: the document's Templates table and the folder disagree`);
    }
    if (JSON.stringify(docTop) !== JSON.stringify([guideName, overviewName].sort((a, b) => a.localeCompare(b, "en")).sort())) {
      fail(`${t.number}: the document's Overview/Simple Guide rows and the folder disagree`);
    }
    const id = identity[t.number] ?? fail(`identity map has no entry for ${t.number}`);
    const mappedFiles = [...Object.values(id.map), ...id.add].sort();
    if (JSON.stringify(mappedFiles) !== JSON.stringify(onDisk)) {
      fail(`${t.number}: identity map and folder disagree`);
    }

    const old = oldSpec.focusAreas.find((f) => f.number === t.number) ?? fail(`no previous-release entry for ${t.number}`);
    const oldCodes = old.templates.map((o) => o.code).sort();
    const coveredCodes = [...Object.keys(id.map), ...Object.keys(id.retire)].sort();
    if (JSON.stringify(oldCodes) !== JSON.stringify(coveredCodes)) {
      fail(`${t.number}: every old template must be mapped or retired exactly once`);
    }

    const guideAbs = path.join(dir, guideName);
    const guide = fileEntry(guideAbs, keyFolder, t.slug);
    const overview = fileEntry(path.join(dir, overviewName), keyFolder, t.slug);

    const oldCodeOf = new Map<string, string>(Object.entries(id.map).map(([code, file]) => [file, code]));

    /* Document table order is the card order, and the BADGE follows it: T01, T02…
       for Word documents, so a card never shows a gap where a retired file used to
       be. The code is the file's kind as well (see fileKindOf): LOGO and SVG-n are
       how a PNG and an SVG are told apart with no schema change. A code is therefore
       NOT an identity here. The row's id is, recorded in the target's snapshot. */
    let docxSeq = 0;
    let svgSeq = 0;
    const specTemplates: SpecTemplate[] = card.uploads
      .filter((u) => u.place === "Templates")
      .map((u, index) => {
        const ext = path.extname(u.file).toLowerCase();
        let code: string;
        if (ext === ".png") code = "LOGO";
        else if (ext === ".svg") code = `SVG-${(svgSeq += 1)}`;
        else code = `T${String((docxSeq += 1)).padStart(2, "0")}`;
        const entry = fileEntry(path.join(tmplDir, u.file), keyFolder, t.slug);
        if (fileKindOf(code) !== (ext === ".png" ? "logo" : ext === ".svg" ? "layout" : "word")) {
          fail(`${t.number}: code ${code} would label ${u.file} wrongly`);
        }
        const oldCode = oldCodeOf.get(u.file) ?? null;
        if (oldCode === null && !id.add.includes(u.file)) fail(`${t.number}: ${u.file} is neither mapped nor added`);
        return {
          ...entry,
          code,
          oldCode,
          oldTitle: oldCode ? old.templates.find((o) => o.code === oldCode)!.title : null,
          sortOrder: index + 1,
        };
      });
    if (specTemplates.some((x) => x.code === OVERVIEW_CODE)) fail(`${t.number}: ${OVERVIEW_CODE} is reserved`);

    const specRetired: SpecRetired[] = Object.entries(id.retire).map(([code, reason]) => ({
      code,
      reason,
      oldTitle: old.templates.find((o) => o.code === code)!.title,
    }));

    replaced += Object.keys(id.map).length;
    added += id.add.length;
    retired += specRetired.length;

    const guideMd = await guideToMarkdown(guideAbs, { ...t, title: card.title });

    topics.push({
      number: t.number,
      section: t.section,
      slug: t.slug,
      title: card.title,
      oldTitle: old.title,
      summary: card.summary,
      introMd: linkifyReferences(card.introMd, t, `${t.number} expanded copy`),
      guideMd,
      guide: { ...guide, oldTitle: old.guideFile.title },
      overview,
      templates: specTemplates,
      retired: specRetired,
      crossLinks: [],
    });
  }

  /* Cross-links resolve second, once every focus area's codes are known. */
  for (const t of TOPICS) {
    const card = cards.find((c) => c.number === t.number)!;
    const topic = topics.find((x) => x.number === t.number)!;
    const links: SpecCrossLink[] = card.shared.map((s) => {
      const homeNumber = s.path.match(/\/(\d\.\d) /)?.[1] ?? fail(`${t.number}: no N.M in shared path ${s.path}`);
      const home = topics.find((x) => x.number === homeNumber) ?? fail(`${t.number}: unknown home ${homeNumber}`);
      const fileName = path.basename(s.path);
      const target = home.templates.find((x) => x.fileName === fileName);
      if (!target) fail(`${t.number}: shared resource ${fileName} is not in ${homeNumber}`);
      if (!existsSync(path.join(LEARNER_ROOT, s.path))) fail(`${t.number}: shared path not on disk: ${s.path}`);
      if (homeNumber === t.number) fail(`${t.number}: a cross-link to its own focus area`);
      return { fileName, homeNumber, homeSlug: home.slug, code: target.code };
    });
    topic.crossLinks = links;

    /* The committed map and the document must say the same thing. */
    const committed = (SHARED_RESOURCES[t.slug] ?? [])
      .map((r) => `${r.topicSlug}|${r.code}`)
      .sort();
    const fromDoc = links.map((l) => `${l.homeSlug}|${l.code}`).sort();
    if (JSON.stringify(committed) !== JSON.stringify(fromDoc)) {
      fail(`${t.number}: src/lib/workspace-v2/shared-resources.ts disagrees with the document's shared list`);
    }
  }
  for (const slug of Object.keys(SHARED_RESOURCES)) {
    if (!TOPICS.some((t) => t.slug === slug)) fail(`shared-resources.ts names unknown topic ${slug}`);
  }

  if (replaced !== EXPECTED.replacedTemplates) fail(`expected ${EXPECTED.replacedTemplates} replaced templates, mapped ${replaced}`);
  if (added !== EXPECTED.addedTemplates) fail(`expected ${EXPECTED.addedTemplates} added templates, mapped ${added}`);
  if (retired !== EXPECTED.retired) fail(`expected ${EXPECTED.retired} retired templates, mapped ${retired}`);

  /* Titles are unique within a focus area, or a card row would be ambiguous. */
  for (const topic of topics) {
    const titles = [topic.overview.title, topic.guide.title, ...topic.templates.map((x) => x.title)];
    if (new Set(titles).size !== titles.length) fail(`${topic.number}: duplicate display title`);
  }

  const videos = parseVideoTable(docHtml);
  if (videos.length !== EXPECTED.scripts) fail(`video table: expected ${EXPECTED.scripts} rows, parsed ${videos.length}`);
  for (const v of videos) {
    if (!scripts.some((s) => path.basename(s) === v.script)) fail(`video ${v.video}: script not in the delivery: ${v.script}`);
  }
  if (new Set(videos.map((v) => v.handoverId)).size !== EXPECTED.scripts) fail("video table: duplicate handover id");
  writeFileSync(VIDEO_MAP_PATH, JSON.stringify(videos, null, 1));

  const spec: Cr1Spec = {
    generatedBy: "scripts/cr1-extract.ts",
    deliveryFingerprint: fingerprint,
    keyFolder,
    totals: {
      topics: topics.length,
      overviews: topics.length,
      guides: topics.length,
      templates: topics.reduce((n, x) => n + x.templates.length, 0),
      learner: topics.reduce((n, x) => n + x.templates.length + 2, 0),
    },
    topics,
  };
  if (spec.totals.templates !== EXPECTED.templates || spec.totals.learner !== EXPECTED.learner) {
    fail(`totals came out ${spec.totals.templates} / ${spec.totals.learner}`);
  }
  writeFileSync(SPEC_PATH, JSON.stringify(spec, null, 1));

  console.log(`\nspec written to the private folder: ${spec.totals.topics} focus areas, ${spec.totals.learner} learner files`);
  console.log(`  replaced templates ${replaced} · added ${added} · retired ${retired} · cross-links ${topics.reduce((n, x) => n + x.crossLinks.length, 0)}`);
  console.log(`  guide words verified against their documents: ${topics.length}/${topics.length}`);
  console.log(`  video placements mapped privately: ${videos.length}`);
}

main().catch((e) => {
  console.error("\nEXTRACTION FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
