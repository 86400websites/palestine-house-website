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
 * Boundary cases — what must NOT be removed.
 * ------------------------------------------------------------------ */

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
