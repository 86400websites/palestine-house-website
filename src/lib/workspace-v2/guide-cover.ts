/* Dropping a Simple guide's cover block before it is rendered (PP4, owner
   decision 2026-08-13).

   Every one of the 33 bodies is an exported Word document, and each opens with
   the cover matter that document carried: a PALESTINE HOUSE / PARTNER
   OPERATIONS TOOLKIT banner, a SIMPLE GUIDE banner, the document's own title,
   and a "Palestine House Local Operations Playbook" subtitle. The reader page
   prints the topic title as its h1 immediately above, so without this the same
   title appears twice within a screen and reads as a bug.

   This is the only place in the product that alters an owner-authored body, so
   it is written to be provably conservative:

     - it only ever removes lines from the START of the document, and stops
       dead at the first line it does not recognise;
     - a line is removed only if, once emphasis and punctuation are stripped,
       NOTHING is left but the known cover vocabulary and the topic's own title;
     - it never removes the last remaining content, so a body cannot be emptied.

   The vocabulary was read off all 33 bodies rather than guessed (step 4c). The
   real openings vary far more than one sample suggests — the banner may be
   letter-spaced (`__S I M P L E   G U I D E__`), share a line with the title
   (`__SIMPLE GUIDE   Menu & Palestinian Culinary Identity__`), appear as a
   Markdown heading (`# SIMPLE GUIDE`), or run to five stacked lines — which is
   why this matches on normalised content instead of on line patterns.

   Pure and dependency-free on purpose: it is the one piece of PP4 that can be
   run over all 33 real openings outside the app, which is how it was verified. */

/* Everything that may appear in a cover line besides the title itself. Order
   matters: the longer PALESTINE HOUSE prefix is removed before the playbook
   phrase it runs into. */
const COVER_PHRASES = [
  "PARTNEROPERATIONSTOOLKIT",
  "PALESTINEHOUSE",
  "LOCALOPERATIONSPLAYBOOK",
  "SIMPLEGUIDE",
];

/* "| 10 Steps", "| 8 Steps", "— Section 13". */
const COVER_PATTERNS = [/\d+STEPS?/g, /SECTION\d+/g];

/* A cover block never runs longer than five lines in the real content; this is
   a backstop, not the mechanism — the "first unrecognised line wins" rule is. */
const MAX_COVER_LINES = 8;

/* Letters and digits only, accents folded, upper-cased. Collapses every way the
   export writes the same words: `__S I M P L E   G U I D E__`, `# SIMPLE
   GUIDE`, `Aswātna` vs `Aswatna`, `Retail / Shop Operations` vs `Retail Shop
   Operations`, `&` vs nothing. */
function compact(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function isCoverLine(line: string, titleKeys: string[]): boolean {
  let rest = compact(line);
  if (!rest) return true; // a rule, a row of dashes, punctuation only

  for (const key of titleKeys) {
    if (!key) continue;
    while (rest.includes(key)) rest = rest.replace(key, "");
  }
  for (const phrase of COVER_PHRASES) {
    while (rest.includes(phrase)) rest = rest.replace(phrase, "");
  }
  for (const pattern of COVER_PATTERNS) rest = rest.replace(pattern, "");

  /* Only if NOTHING of substance survives. A line like "ORG STRUCTURE & ROLES
     LIFECYCLE STAGES" keeps "LIFECYCLESTAGES" and is therefore content. */
  return rest.length === 0;
}

export function stripGuideCover(
  markdown: string | null | undefined,
  titles: readonly string[],
): string {
  if (!markdown) return "";

  const titleKeys = titles.map(compact).filter(Boolean);
  const lines = markdown.split(/\r?\n/);

  let cut = 0; // index of the first line that is kept
  let seen = 0; // non-blank lines inspected

  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].trim()) continue;
    if (seen >= MAX_COVER_LINES) break;
    if (!isCoverLine(lines[i], titleKeys)) break;
    seen += 1;
    cut = i + 1;
  }

  if (cut === 0) return markdown;

  const kept = lines.slice(cut).join("\n");
  /* If the whole document was cover matter, keep the original: showing the
     banner is better than showing nothing. */
  return kept.trim() ? kept.replace(/^\s+/, "") : markdown;
}
