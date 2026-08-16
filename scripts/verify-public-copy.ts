/**
 * scripts/verify-public-copy.ts — PP7 step 7-j (D-PP-a / D-PP-s).
 * The public focus-area map must be the owner's words, and the numbers must be
 * the real ones.
 *
 *   pnpm exec tsx scripts/verify-public-copy.ts
 *
 * WHY THIS EXISTS
 * ---------------
 * D-PP-s let this engine draft the public copy — a deliberate, scoped exception
 * to CLAUDE.md's verbatim-copy rule — on one condition: **each focus area's
 * public one-liner is its own Overview's opening sentence**, which is also its
 * private card summary, so public and private cannot drift.
 *
 * That condition is only worth anything if something checks it. The 22 sentences
 * are hand-copied into `src/app/focus-areas/page.tsx` (they cannot be imported:
 * `docs/content-v2-spec.json` also carries 68,000 characters of gated guide
 * bodies, and bundling that into a public page is exactly the disclosure this
 * project has been careful about). Hand-copying 22 sentences is precisely where
 * a paraphrase slips in.
 *
 * So: extract them back out of the page and compare to the spec.
 *
 * TYPOGRAPHIC QUOTES ARE NORMALISED, and that is the one licensed difference.
 * The public pages use curly quotes and apostrophes as house style — and JSX
 * rejects bare apostrophes under react/no-unescaped-entities — while the spec
 * holds the straight characters the .docx exported. Words may not drift;
 * glyphs may. Everything else is compared exactly.
 *
 * Offline. No network, no credentials, no database.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PAGE = path.join(ROOT, "src/app/focus-areas/page.tsx");
const SUPPORT = path.join(ROOT, "src/app/our-support/page.tsx");
const BRING = path.join(ROOT, "src/app/bring-ph/page.tsx");
const SPEC = path.join(ROOT, "docs/content-v2-spec.json");

let checks = 0;
let failures = 0;

function check(label: string, ok: boolean, detail = ""): void {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

/** Curly → straight, so house typography is not mistaken for drift. */
function normalise(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

interface Spec {
  sections: { slug: string; label: string }[];
  focusAreas: { number: string; title: string; summary: string; sectionSlug: string; templates: unknown[] }[];
}

function main(): void {
  const spec = JSON.parse(readFileSync(SPEC, "utf8")) as Spec;
  const page = readFileSync(PAGE, "utf8");
  const support = readFileSync(SUPPORT, "utf8");
  const bring = readFileSync(BRING, "utf8");

  /* The page lists each focus area as ["Title", "Summary"]. Comments are
     stripped first so the explanatory prose above cannot be mistaken for copy. */
  const body = page.replace(/\/\*[\s\S]*?\*\//g, "");
  const pairs: [string, string][] = [];
  const re = /\[\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*,?\s*\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    pairs.push([m[1].replace(/\\"/g, '"'), m[2].replace(/\\"/g, '"')]);
  }

  console.log(`spec: ${spec.focusAreas.length} focus areas · page: ${pairs.length} entries\n`);

  console.log("THE 22 ONE-LINERS ARE THE OWNER'S OWN SENTENCES (D-PP-s)");
  check("the page lists exactly 22 focus areas", pairs.length === 22, `${pairs.length}`);

  const byTitle = new Map(spec.focusAreas.map((f) => [normalise(f.title), f]));
  let titleMisses = 0;
  let summaryMisses = 0;
  for (const [title, summary] of pairs) {
    const fa = byTitle.get(normalise(title));
    if (!fa) {
      titleMisses += 1;
      console.log(`        no focus area in the spec is titled "${title}"`);
      continue;
    }
    if (normalise(summary) !== normalise(fa.summary)) {
      summaryMisses += 1;
      console.log(`        ${fa.number} drifted:`);
      console.log(`          page: ${normalise(summary)}`);
      console.log(`          spec: ${normalise(fa.summary)}`);
    }
  }
  check("every title on the page exists in the spec", titleMisses === 0, `${titleMisses} unknown`);
  check(
    "every one-liner matches its Overview's opening sentence",
    summaryMisses === 0,
    summaryMisses === 0 ? `${pairs.length}/${pairs.length}` : `${summaryMisses} drifted`,
  );

  /* And the reverse: nothing the owner shipped is missing from the map. */
  const onPage = new Set(pairs.map(([t]) => normalise(t)));
  const missing = spec.focusAreas.filter((f) => !onPage.has(normalise(f.title)));
  check(
    "no focus area is missing from the public map",
    missing.length === 0,
    missing.map((f) => f.number).join(", ") || "none",
  );

  console.log("\nTHE SECTIONS");
  for (const s of spec.sections) {
    check(`"${s.label}" is named on the page`, new RegExp(`"${s.label}"`).test(body));
  }

  console.log("\nTHE NUMBERS (D-PP-a)");
  const templates = spec.focusAreas.reduce((n, f) => n + f.templates.length, 0);
  const expect: [string, string][] = [
    ["4", "sections"],
    ["22", "focus areas"],
    [String(templates), "templates"],
  ];
  for (const [n, what] of expect) {
    check(`/focus-areas states ${n} ${what}`, new RegExp(`"${n}"`).test(body));
  }
  check("88 is the real template total", templates === 88, String(templates));

  console.log("\nNOTHING FROM THE RETIRED IA SURVIVES AS COPY");
  /* Comments are stripped from all three so this cannot be satisfied — or
     tripped — by the explanations written above the code. */
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const surfaces: [string, string][] = [
    ["/focus-areas", strip(page)],
    ["/our-support", strip(support)],
    ["/bring-ph", strip(bring)],
  ];
  const banned: [string, RegExp][] = [
    ["297", /\b297\b/],
    ["200+ checklist", /200\+/],
    ["eleven focus areas", /eleven/i],
    ["thirty-three", /thirty-three/i],
    ["the A–K vocabulary", /A[–-]K/],
    ["checklist", /checklist/i],
  ];
  for (const [name, src] of surfaces) {
    for (const [what, re] of banned) {
      check(`${name} no longer says "${what}"`, !re.test(src));
    }
  }

  console.log(`\n${checks} checks · ${failures === 0 ? "PUBLIC COPY MATCHES THE OWNER'S CONTENT" : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
