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

/* An anchor element with NOTHING between its tags. Word's exporter emits one
   per bookmark, and the owner's final content is full of them: every one of the
   132 delivered documents carries 19-21, while not one of the 33 bodies this
   file was written against carries a single one (measured against production,
   2026-08-15 — `simple_guide_md like '%<a id=%'` returns 0 rows).

   They are why this file stopped working on the new content. `compact()` keeps
   letters and digits, so `<a id="get-legally-ready-simple-guide"></a>Palestine
   House: Set up` compacts to AIDGETLEGALLYREADYSIMPLEGUIDEAPALESTINEHOUSESETUP,
   and the id fragments that survive subtraction look exactly like content — so
   the first line of every new guide was classified as content and nothing was
   ever removed.

   Removing them here is safe in the strongest sense available: the pattern
   matches only an element with an EMPTY body, so there is no text to lose. It
   is deliberately not a general tag strip, which could hide real prose. And it
   only affects CLASSIFICATION — the lines this function keeps are returned
   verbatim, anchors and all, because removing the cover block is the only
   licence this file has over an owner-authored body. (The ingest strips the
   anchors from the stored text separately, so in practice the reader never sees
   them; this keeps the classifier honest for anything pasted through the CMS.)

   Their ids are not even meaningful: `get-legally-ready` heads every one of the
   22 Overviews, and `step-1.-register-our-local-entity` appears inside Monthly
   Check-Up. One is mid-line inside bold — `__Palestine House__<a id=…></a>:
   __Support __` — which is why this runs over the whole line rather than only
   its start. */
const EMPTY_ANCHOR = /<a\b[^>]*>\s*<\/a>/gi;

function stripEmptyAnchors(line: string): string {
  return line.replace(EMPTY_ANCHOR, "");
}

/* A cover block never runs longer than five lines in the real content; this is
   a backstop, not the mechanism — the "first unrecognised line wins" rule is. */
const MAX_COVER_LINES = 8;

/* How many extra lines the scan may look at beyond what it is allowed to
   remove, so that a title wrapped over several lines can still finish inside a
   maximum-length cover block. Slack for the scan only — it never raises the
   number of lines that may be deleted. */
const MAX_TITLE_LINES = 4;

/* Letters and digits only, accents folded, upper-cased. Collapses every way the
   export writes the same words: `__S I M P L E   G U I D E__`, `# SIMPLE
   GUIDE`, `Aswātna` vs `Aswatna`, `Retail / Shop Operations` vs `Retail Shop
   Operations`, `&` vs nothing.

   UNICODE-AWARE, and that is load-bearing rather than tidy. An earlier version
   kept `[A-Z0-9]` only, which compacted any non-Latin line — Arabic, for
   instance — to the empty string, and an empty compaction is what this file
   reads as "punctuation only, therefore cover matter". A leading Arabic line
   was silently deleted from the reader. Found by independent review, 2026-08-13.
   With `\p{L}\p{N}` such a line compacts to itself and is content. */
function compact(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

type LineVerdict = {
  /* Nothing of substance survived once the cover vocabulary was subtracted. */
  cover: boolean;
  /* This line carried a real cover MARKER — a banner or the playbook subtitle —
     rather than merely repeating the topic's title. */
  marker: boolean;
  /* What survived. Empty exactly when `cover` is true. Returned so the caller
     can test it against a title that is still being consumed across lines. */
  residue: string;
};

function classifyLine(
  line: string,
  titleKeys: string[],
  /* The compacted section label ("SETUP"), or "". Deliberately NOT one of the
     titleKeys — see the note on `stripGuideCover`. */
  sectionKey: string,
  /* An unconsumed tail of a title key, carried over from the previous line —
     see the two-line title note on `stripGuideCover`. */
  pending: string,
): LineVerdict | null {
  let rest = compact(stripEmptyAnchors(line));
  /* Genuinely nothing but punctuation: a `---` rule, a row of dashes, or a line
     that held nothing but a Word bookmark. Now that compaction is Unicode-aware
     this can no longer swallow real prose. */
  if (!rest) return { cover: true, marker: false, residue: "" };

  /* A title was mid-flight. This line must continue it EXACTLY, from its very
     start, or the run is broken and nothing of it may be removed. */
  if (pending) {
    if (!rest.startsWith(pending)) return null;
    rest = rest.slice(pending.length);
  }

  /* THE SECTION LABEL IS SUBTRACTED ONLY FROM A LINE THAT ALSO NAMES PALESTINE
     HOUSE, and this restriction is the whole of its safety.

     PP6b first passed the label as an ordinary title key. Title keys are
     subtracted from ANYWHERE in a line, and the label is a short, ordinary
     English word, so a guide whose own first heading was "## Program" had that
     heading deleted whenever a SIMPLE GUIDE banner sat above it — owner content
     destroyed by a body-shape coincidence. Found by the independent review,
     2026-08-15; the sprint's own test missed it because it paired a "Support"
     heading with a "Setup" label instead of the section's own name.

     The real cover line is `Palestine House: Set up`, so requiring the
     PALESTINE HOUSE marker on the same line costs nothing real and makes the
     dangerous case impossible: a bare `## Program` no longer qualifies. */
  const namesPalestineHouse = rest.includes("PALESTINEHOUSE");

  let marker = false;

  for (const key of titleKeys) {
    if (!key) continue;
    while (rest.includes(key)) rest = rest.replace(key, "");
  }
  if (sectionKey && namesPalestineHouse) {
    while (rest.includes(sectionKey)) rest = rest.replace(sectionKey, "");
  }
  for (const phrase of COVER_PHRASES) {
    while (rest.includes(phrase)) {
      rest = rest.replace(phrase, "");
      marker = true;
    }
  }
  /* THE DECORATIONS ONLY COUNT ON A LINE THAT ALREADY CARRIES A BANNER.
     "| 10 Steps" and "— Section 13" never stand alone in the real covers: they
     trail the playbook subtitle. Applied unconditionally they made a line whose
     entire content was `## Section 3` compact to nothing, classify as cover,
     AND set the marker that licenses removal — so a legitimate section heading
     under a SIMPLE GUIDE banner was deleted from the reader. Found by the
     independent review, 2026-08-15. Gating them behind a phrase match on the
     same line keeps every real cover working and makes a bare decoration line
     ordinary content, which is what it is. */
  if (marker) {
    for (const pattern of COVER_PATTERNS) {
      rest = rest.replace(pattern, "");
    }
  }

  /* Only if NOTHING of substance survives. A line like "ORG STRUCTURE & ROLES
     LIFECYCLE STAGES" keeps "LIFECYCLESTAGES" and is therefore content. */
  return { cover: rest.length === 0, marker, residue: rest };
}

/* Is what survived the exact opening of a title that simply has not finished
   yet? Returns the unmatched tail, or "" if this residue starts no title.

   A STRICT prefix only: an exact full match has already been subtracted above,
   and allowing equality here would make the tail empty and the run pointless.
   Nothing is removed on the strength of this alone — the caller holds such
   lines provisionally until the title completes. */
function unfinishedTitleTail(residue: string, titleKeys: string[]): string {
  for (const key of titleKeys) {
    if (key.length > residue.length && key.startsWith(residue)) {
      return key.slice(residue.length);
    }
  }
  return "";
}

/* `titles` is the topic's own name, in the spellings that disagree across the
   two tables. `sectionLabel` is SEPARATE and is not a title key: it is only ever
   subtracted from a line that also names Palestine House, because it is a short
   ordinary word and subtracting it freely deleted a legitimate `## Program`
   heading (independent review, 2026-08-15). Passing it as a third argument
   rather than a third array is deliberate — the array is subtracted globally and
   the label must not be.

   A TITLE MAY ARRIVE IN PIECES. One of the 22 delivered covers wraps its title
   over two lines — `Connect to the Wider Palestine` / `House Network Simple
   Guide` — so neither line contains the whole title and, line by line, both look
   like content. The scan therefore carries an unmatched tail forward: a line
   whose residue is a strict PREFIX of a title is held PROVISIONALLY, and it is
   only removed once a following line continues that title exactly, from its very
   start. If the run breaks, the provisional lines are kept — so a partial match
   that never completes can never delete anything. Found by running the function
   over all 22 delivered guides rather than by reading it (2026-08-15); the
   line-at-a-time version left this one still printing its title twice. */
export function stripGuideCover(
  markdown: string | null | undefined,
  titles: readonly string[],
  sectionLabel?: string,
): string {
  if (!markdown) return "";

  /* LONGEST FIRST. Subtraction is greedy and order-dependent: given "Plan" and
     "Plan an Event", removing the short key first leaves "ANEVENT" behind and
     the cover line survives, while the other order clears it. Sorting makes the
     result independent of the order the caller happened to pass them in.
     Raised by the independent review, 2026-08-15. */
  const titleKeys = titles
    .map(compact)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  const sectionKey = compact(sectionLabel ?? "");
  const lines = markdown.split(/\r?\n/);

  let cut = 0; // index of the first line that is KEPT — confirmed cover only
  let removed = 0; // CONFIRMED cover lines, i.e. lines actually cut
  let inspected = 0; // every non-blank line looked at, provisional ones included
  let sawMarker = false; // the prefix proved itself to be a cover block
  let pending = ""; // unmatched tail of a title still being consumed
  let provisionalMarker = false; // markers seen only on held-back lines
  let provisional = 0; // non-blank lines held back pending a title completing

  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].trim()) continue;
    /* TWO BOUNDS, and separating them is what makes the function idempotent.
       A single counter covering both confirmed and provisional lines meant a
       long cover block could exhaust the budget midway through a wrapped title:
       the first call kept the title, and a second call — now starting past the
       lines the first had removed — removed it. f(f(x)) !== f(x) on a function
       that edits an owner's document is not acceptable even when the difference
       is conservative. Found by the independent review, 2026-08-15.
       `removed` bounds what may be deleted; `inspected` merely stops the scan
       from wandering, and is slack enough to finish any wrapped title. */
    if (inspected >= MAX_COVER_LINES + MAX_TITLE_LINES) break;
    inspected += 1;

    const verdict = classifyLine(lines[i], titleKeys, sectionKey, pending);
    /* null = a title was mid-flight and this line did not continue it. Break
       WITHOUT advancing `cut`, so the held-back lines survive. */
    if (!verdict) break;

    /* THE CAP IS REACHED AND THERE IS STILL COVER TO COME — so this is not a
       cover block this function understands. Return the document untouched
       rather than commit a partial strip: a partial strip is what made the
       function non-idempotent, because a second pass would then finish the job
       the first one abandoned. Nine banner lines produced exactly that.
       Refusing is also the conservative answer — showing a banner is better
       than half-removing one. Found by the independent review, 2026-08-15. */
    if (removed >= MAX_COVER_LINES) {
      if (verdict.cover) return markdown;
      break;
    }

    if (verdict.cover) {
      if (verdict.marker) sawMarker = true;
      /* The run completed, so everything held back is confirmed with it. */
      if (provisionalMarker) sawMarker = true;
      pending = "";
      provisionalMarker = false;
      /* This line, plus every line held back waiting for it. */
      removed += provisional + 1;
      provisional = 0;
      cut = i + 1;
      continue;
    }

    /* Not cover on its own — but it may be the opening of a wrapped title.

       A MARKDOWN HEADING IS NEVER CONSUMED THIS WAY. Two consecutive headings
       whose text happens to concatenate to the topic's title are structure the
       owner wrote, not a wrapped cover title — and the wrapped covers that
       actually exist use bold, not headings, so refusing headings here costs
       nothing real. Without it, `## Connect to the Wider Palestine` followed by
       `## House Network` was deleted from a body that merely had a banner
       above it. Found by the independent review, 2026-08-15. */
    const isHeading = /^\s*#/.test(lines[i]);
    const tail =
      pending || isHeading ? "" : unfinishedTitleTail(verdict.residue, titleKeys);
    if (!tail) break;
    pending = tail;
    provisional += 1;
    if (verdict.marker) provisionalMarker = true;
    /* Deliberately NOT advancing `cut` or `removed`: nothing is removed until
       the title completes on a later line. */
  }

  /* A title on its own is NOT enough to delete. The candidate prefix must
     contain at least one unambiguous cover marker — a PALESTINE HOUSE or SIMPLE
     GUIDE banner, or the playbook subtitle — before anything is removed.
     Without this, a body that legitimately opened with its own title as a
     heading would lose that heading. The real openings all carry a marker (the
     five-line one on `technology-stack-and-data` has two), which is why the
     marker may appear on any line of the prefix rather than the first. */
  if (cut === 0 || !sawMarker) return markdown;

  const kept = lines.slice(cut).join("\n");
  /* If the whole document was cover matter, keep the original: showing the
     banner is better than showing nothing. */
  if (!kept.trim()) return markdown;

  /* Drop only the BLANK LINES the cut left behind — never the indentation of
     the first surviving line. `^\s+` did both, so a body whose first real line
     was indented came back dedented; in Markdown a four-space indent is a code
     block, so that silently changed how an owner's document rendered. The file
     promises kept lines verbatim and now keeps that promise. Found by the
     independent review, 2026-08-15. */
  return kept.replace(/^(?:[ \t]*\r?\n)+/, "");
}
