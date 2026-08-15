/* Regression checks for stripGuideCover (PP4).
 *
 *   pnpm exec tsx scripts/verify-guide-cover.mts
 *
 * This is the one piece of the product that ALTERS an owner-authored body — it
 * removes the Word cover block from the top of a Simple guide so the reader
 * does not print the topic title twice. It is therefore the one piece that can
 * silently lose content, which is exactly what an independent review found on
 * 2026-08-13: compaction was ASCII-only, so a leading Arabic line compacted to
 * nothing and was deleted as if it were punctuation.
 *
 * The cases below are the real openings (verbatim shapes from all 33 guides,
 * including every awkward variant the DOCX export produced) plus the boundary
 * cases the review asked for. Run this after ANY edit to guide-cover.ts, and
 * before trusting it against content the owner has edited through PP6's CMS.
 *
 * Not wired into package.json or CI yet — see the PP4 record's follow-ups. */

import { stripGuideCover } from "../src/lib/workspace-v2/guide-cover.ts";

let failures = 0;

function check(name: string, actual: string, expected: string) {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) {
    console.log(`        expected: ${JSON.stringify(expected)}`);
    console.log(`        actual:   ${JSON.stringify(actual)}`);
  }
}

const body = (...lines: string[]) => lines.join("\n\n");

/* ------------------------------------------------------------------ *
 * The real openings — every distinct shape across the 33 guides.
 * ------------------------------------------------------------------ */

check(
  "banner + title + subtitle (the common shape, 21 of 33)",
  stripGuideCover(
    body(
      "__SIMPLE GUIDE__",
      "__Customer Service & Recovery__",
      "*Palestine House Local Operations Playbook*",
      "__PURPOSE OF THIS GUIDE__",
      "This guide tells you what to do when a guest is unhappy.",
    ),
    ["Customer Service & Recovery", "Customer Service & Recovery"],
  ),
  body(
    "__PURPOSE OF THIS GUIDE__",
    "This guide tells you what to do when a guest is unhappy.",
  ),
);

check(
  "letter-spaced banner",
  stripGuideCover(
    body(
      "__S I M P L E   G U I D E__",
      "__Business Model & Revenue__",
      "*Palestine House Local Operations Playbook*",
      "__1__",
    ),
    ["Business Model & Revenue", "Business Model & Revenue"],
  ),
  "__1__",
);

check(
  "banner and title sharing one line",
  stripGuideCover(
    body(
      "__SIMPLE GUIDE   Menu & Palestinian Culinary Identity__",
      "Palestine House Local Operations Playbook   │   10 Steps",
      "__What this guide covers__",
    ),
    ["Menu & Palestinian Culinary Identity", "Menu & Palestinian Culinary Identity"],
  ),
  "__What this guide covers__",
);

check(
  "toolkit banner with a trailing title, five cover lines deep",
  stripGuideCover(
    body(
      "PALESTINE HOUSE   │   PARTNER OPERATIONS TOOLKIT",
      "Technology Stack & Data",
      "__SIMPLE GUIDE__",
      "__Technology Stack & Data__",
      "*Palestine House Local Operations Playbook*",
      "__LIFECYCLE STAGE__",
    ),
    ["Technology Stack & Data", "Technology Stack & Data"],
  ),
  "__LIFECYCLE STAGE__",
);

check(
  "Markdown-heading form, with a horizontal rule inside the block",
  stripGuideCover(
    body(
      "# SIMPLE GUIDE",
      "## Mission, Values & Guest Promise",
      "*Palestine House Local Operations Playbook*",
      "---",
      "## PURPOSE OF THIS GUIDE",
    ),
    ["Mission, Values and Guest Promise", "Mission, Values & Guest Promise"],
  ),
  "## PURPOSE OF THIS GUIDE",
);

check(
  "accented title against an unaccented element title",
  stripGuideCover(
    body(
      "__SIMPLE GUIDE__",
      "__Aswātna Studio Collaboration__",
      "*Palestine House Local Operations Playbook   |   10 Steps*",
      "__What this guide covers__",
    ),
    ["Aswātna Studio Collaboration", "Aswatna Studio Collaboration"],
  ),
  "__What this guide covers__",
);

check(
  "a section-numbered subtitle",
  stripGuideCover(
    body(
      "__SIMPLE GUIDE__",
      "__Community Partnerships__",
      "Palestine House Local Operations Playbook — Section 14",
      "For Local Partners and House Teams",
    ),
    ["Community Partnerships", "Community Partnerships"],
  ),
  "For Local Partners and House Teams",
);

/* ------------------------------------------------------------------ *
 * The owner's DELIVERED content (PP6b, 2026-08-15). A different export,
 * a different cover shape, and — measured before any of this was written
 * — stripGuideCover fired on ZERO of the 22.
 *
 * Two things changed. Every delivered document carries Word bookmark
 * anchors (19-21 each; none of the original 33 carry any), whose ids
 * survive compaction and read as content. And the cover opens one line
 * higher, on `Palestine House: <Section>`, whose section label was not
 * cover vocabulary. The third argument is that label.
 *
 * Every case below is a VERBATIM opening from the delivered files.
 * ------------------------------------------------------------------ */

check(
  "delivered: Setup — leading anchor + section line (1.1, verbatim)",
  stripGuideCover(
    body(
      '<a id="get-legally-ready-simple-guide"></a>Palestine House: Set up',
      "Get Legally Ready Simple Guide",
      '<a id="step-1.-register-our-local-entity"></a>',
      "Step 1. Register Our Local Entity",
      "We first check whether we need to register a company.",
    ),
    ["Get Legally Ready", "Get Legally Ready"],
    "Setup",
  ),
  body(
    "Step 1. Register Our Local Entity",
    "We first check whether we need to register a company.",
  ),
);

check(
  "delivered: Support — anchor MID-LINE inside bold (4.5, verbatim)",
  stripGuideCover(
    body(
      '__Palestine House__<a id="step-1.-register-our-local-entity"></a>: __Support __',
      "__Learn from Other Palestine Houses Simple Guide__",
      "__Step 1. Share a Good Idea When It Works__",
    ),
    ["Learn from Other Palestine Houses", "Learn from Other Palestine Houses"],
    "Support",
  ),
  "__Step 1. Share a Good Idea When It Works__",
);

check(
  "delivered: Operate — section label differs from the topic title (2.6)",
  stripGuideCover(
    body(
      '<a id="get-legally-ready"></a>__Palestine House: Operate__',
      "__Monthly Check-Up Simple Guide__",
      '## <a id="step-1"></a>__Step 1. Book the Same Hour Every Month__',
    ),
    ["Monthly Check-Up", "Monthly Check-Up"],
    "Operate",
  ),
  '## <a id="step-1"></a>__Step 1. Book the Same Hour Every Month__',
);

check(
  "delivered: Program — the fourth section label (3.5)",
  stripGuideCover(
    body(
      '<a id="get-legally-ready"></a>__Palestine House: Program__',
      "__Learn the Event Simple Guide__",
      "After every event, we take a few minutes to look back.",
    ),
    ["Learn the Event", "Learn the Event"],
    "Program",
  ),
  "After every event, we take a few minutes to look back.",
);

check(
  "delivered: a title WRAPPED over two cover lines (3.6, verbatim)",
  stripGuideCover(
    body(
      '<a id="get-legally-ready"></a>__Palestine House: Program__',
      "__Connect to the Wider Palestine__",
      "__House Network Simple Guide__",
      "__Step 1. Ask for Programming Support__",
    ),
    [
      "Connect to the Wider Palestine House Network",
      "Connect to the Wider Palestine House Network",
    ],
    "Program",
  ),
  "__Step 1. Ask for Programming Support__",
);

/* ------------------------------------------------------------------ *
 * Boundary cases — what must NOT be removed.
 * ------------------------------------------------------------------ */

check(
  "a wrapped title that never completes deletes NOTHING it held back",
  stripGuideCover(
    body(
      "__SIMPLE GUIDE__",
      "Connect to the Wider Palestine",
      "and then something else entirely.",
    ),
    [
      "Connect to the Wider Palestine House Network",
      "Connect to the Wider Palestine House Network",
    ],
    "Program",
  ),
  body("Connect to the Wider Palestine", "and then something else entirely."),
);

check(
  "a continuation must match from the START of the line, not anywhere in it",
  stripGuideCover(
    body(
      "__SIMPLE GUIDE__",
      "Connect to the Wider Palestine",
      "Our House Network is thriving.",
    ),
    [
      "Connect to the Wider Palestine House Network",
      "Connect to the Wider Palestine House Network",
    ],
    "Program",
  ),
  body("Connect to the Wider Palestine", "Our House Network is thriving."),
);

check(
  "an anchor around REAL TEXT is content and is never stripped",
  stripGuideCover(
    body('<a href="https://example.org">Read the local rules</a>', "More."),
    ["Get Legally Ready", "Get Legally Ready"],
    "Setup",
  ),
  body('<a href="https://example.org">Read the local rules</a>', "More."),
);

check(
  "a kept line keeps its anchors verbatim — classification only",
  stripGuideCover(
    body(
      '<a id="c"></a>Palestine House: Setup',
      '<a id="d"></a>Step 1. Do the thing.',
    ),
    ["Whatever", "Whatever"],
    "Setup",
  ),
  '<a id="d"></a>Step 1. Do the thing.',
);

check(
  "the section label alone does not license a removal without a marker",
  stripGuideCover(
    body("Setup", "The first real paragraph."),
    ["Get Legally Ready", "Get Legally Ready"],
    "Setup",
  ),
  body("Setup", "The first real paragraph."),
);

check(
  "a heading naming ANOTHER section survives — the label is scoped",
  stripGuideCover(
    body("__SIMPLE GUIDE__", "Support"),
    ["Get Legally Ready", "Get Legally Ready"],
    "Setup",
  ),
  "Support",
);

/* ------------------------------------------------------------------ *
 * The independent review's cases, 2026-08-15. The first is the one this
 * file MISSED: it tested a heading naming a DIFFERENT section, which was
 * never the dangerous case. Its own section's name is.
 * ------------------------------------------------------------------ */

check(
  "REVIEW: a heading naming the topic's OWN section survives (was deleted)",
  stripGuideCover(
    body("# SIMPLE GUIDE", "## Program", "The first real paragraph."),
    ["Plan an Event", "Plan an Event"],
    "Program",
  ),
  body("## Program", "The first real paragraph."),
);

check(
  "REVIEW: the label still comes off the real cover line, which names the House",
  stripGuideCover(
    body("Palestine House: Program", "Plan an Event Simple Guide", "Step 1."),
    ["Plan an Event", "Plan an Event"],
    "Program",
  ),
  "Step 1.",
);

check(
  "REVIEW: indentation of the first kept line is preserved (Markdown code block)",
  stripGuideCover(
    ["__SIMPLE GUIDE__", "", "    const keep = true;", "", "after"].join("\n"),
    ["X", "X"],
    "Setup",
  ),
  ["    const keep = true;", "", "after"].join("\n"),
);

/* f(f(x)) === f(x). A long cover block used to exhaust one shared budget
 * partway through a wrapped title: the first call kept the title and a second
 * call removed it. Two bounds now — what may be removed, and how far the scan
 * may look — so the result no longer depends on how often it is applied. */
{
  const long = body(
    "PALESTINE HOUSE",
    "SIMPLE GUIDE",
    "10 Steps",
    "Section 3",
    "PARTNER OPERATIONS TOOLKIT",
    "LOCAL OPERATIONS PLAYBOOK",
    "SIMPLE GUIDE",
    "Connect to the Wider Palestine",
    "House Network Simple Guide",
    "Real content here.",
  );
  const keys = [
    "Connect to the Wider Palestine House Network",
    "Connect to the Wider Palestine House Network",
  ];
  const once = stripGuideCover(long, keys, "Program");
  check(
    "REVIEW: idempotent at the MAX_COVER_LINES boundary",
    stripGuideCover(once, keys, "Program"),
    once,
  );
}

check(
  "a leading non-Latin line is CONTENT, not punctuation (review finding)",
  stripGuideCover(
    body("مرحبا بكم", "Operational details remain."),
    ["Operating Model", "Operating Model"],
  ),
  body("مرحبا بكم", "Operational details remain."),
);

check(
  "a title-only opening with no cover marker is left alone (review finding)",
  stripGuideCover(
    body("Operations", "The first real paragraph."),
    ["Operations", "Operations"],
  ),
  body("Operations", "The first real paragraph."),
);

check(
  "a marker later in the prefix still licenses removing an earlier title line",
  stripGuideCover(
    body("Operations", "__SIMPLE GUIDE__", "The first real paragraph."),
    ["Operations", "Operations"],
  ),
  "The first real paragraph.",
);

check(
  "content that merely mentions Palestine House is not cover matter",
  stripGuideCover(
    body("__SIMPLE GUIDE__", "Palestine House runs on volunteers."),
    ["Operating Model", "Operating Model"],
  ),
  "Palestine House runs on volunteers.",
);

check(
  "a heading that contains the title plus real words survives",
  stripGuideCover(
    body(
      "__SIMPLE GUIDE__",
      "__Org Structure & Roles__",
      "__ORG STRUCTURE & ROLES LIFECYCLE STAGES__",
    ),
    ["Org Structure & Roles", "Org Structure & Roles"],
  ),
  "__ORG STRUCTURE & ROLES LIFECYCLE STAGES__",
);

check(
  "an all-cover document is never emptied",
  stripGuideCover(
    body("__SIMPLE GUIDE__", "__Operating Model__"),
    ["Operating Model", "Operating Model"],
  ),
  body("__SIMPLE GUIDE__", "__Operating Model__"),
);

check("an empty body stays empty", stripGuideCover("", ["X", "X"]), "");
check("a null body stays empty", stripGuideCover(null, ["X", "X"]), "");

check(
  "a body with no cover block at all is untouched",
  stripGuideCover(
    body("__PURPOSE OF THIS GUIDE__", "Straight into the content."),
    ["Operating Model", "Operating Model"],
  ),
  body("__PURPOSE OF THIS GUIDE__", "Straight into the content."),
);

check(
  "the scan stops at the first unrecognised line and keeps the rest verbatim",
  stripGuideCover(
    body(
      "__SIMPLE GUIDE__",
      "__Operating Model__",
      "Real content.",
      "__SIMPLE GUIDE__",
      "More content.",
    ),
    ["Operating Model", "Operating Model"],
  ),
  body("Real content.", "__SIMPLE GUIDE__", "More content."),
);

console.log(
  `\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} FAILURE(S)`}`,
);
process.exit(failures === 0 ? 0 : 1);
