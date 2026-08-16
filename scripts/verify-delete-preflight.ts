/**
 * scripts/verify-delete-preflight.ts — PP7 step 7-c.
 * Watches the object-deletion preflight REFUSE.
 *
 *   pnpm exec tsx scripts/verify-delete-preflight.ts
 *
 * WHY THIS EXISTS
 * ---------------
 * `checkMigrationHasRun()` is the last thing between a mistyped command and 297
 * Storage objects that no `.down.sql`, flag or Supabase backup can bring back.
 * Until PP7 there was nothing there at all: `delete-297-objects.ts` made no
 * database call whatsoever, so it would have deleted the files out from under
 * 297 live rows without noticing.
 *
 * TEST currently sits on the far side of `0030`, so running the real script
 * proves only that the check PASSES when everything is already fine. That is the
 * exact shape of test this sprint series keeps getting caught by — PP6b named it,
 * PP6c did not escape it, and the review that produced PP7 found it again in
 * `0030`'s guard. So the cases below are the refusals, driven with fabricated
 * inputs:
 *
 *   1. the legacy platform is still there  — 0030 has not been applied
 *   2. a DECOY 22                          — right count, wrong focus areas
 *   3. 21 of the 22                        — a partial rollout
 *   4. the guide files are missing         — right areas, wrong row count
 *   5. the real thing                      — and only this one passes
 *
 * Offline. No network, no credentials, no database.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import {
  EXPECTED_NEW_ROWS,
  type PreflightArea,
  type PreflightTopic,
  checkMigrationHasRun,
} from "./lib/preflight";

let checks = 0;
let failures = 0;

function refuses(label: string, run: () => void, mustMention: string): void {
  checks += 1;
  let message: string | null = null;
  try {
    run();
  } catch (e) {
    message = e instanceof Error ? e.message : String(e);
  }
  if (message === null) {
    failures += 1;
    console.log(`  FAIL  ${label} — it ACCEPTED this. Nothing would have stopped the deletion.`);
    return;
  }
  if (!message.toLowerCase().includes(mustMention.toLowerCase())) {
    failures += 1;
    console.log(`  FAIL  ${label} — refused, but for the wrong reason: ${message.slice(0, 120)}`);
    return;
  }
  console.log(`  PASS  ${label} — refused`);
}

function accepts(label: string, run: () => void): void {
  checks += 1;
  try {
    run();
    console.log(`  PASS  ${label} — accepted`);
  } catch (e) {
    failures += 1;
    console.log(`  FAIL  ${label} — refused a valid state: ${e instanceof Error ? e.message : e}`);
  }
}

/* The real 22, read from the spec rather than hand-copied. An earlier draft
   pasted the slugs in, which made the accept case a tautology — the same list
   on both sides of the comparison proves only that a string equals itself. */
const SPEC = JSON.parse(
  readFileSync(path.join(process.cwd(), "docs/content-v2-spec.json"), "utf8"),
) as { focusAreas: { slug: string; number: string }[] };

const REAL: PreflightArea[] = SPEC.focusAreas.map((f) => ({ slug: f.slug }));
const CODES = SPEC.focusAreas.map((f) => f.number);

const asTopics = (areas: readonly PreflightArea[]): PreflightTopic[] =>
  areas.map((a, i) => ({ slug: a.slug, element_id: `id-${i}`, element_code: CODES[i] ?? `9.${i}` }));

function main(): void {
  if (REAL.length !== 22) {
    console.error(`the spec carries ${REAL.length} focus areas, expected 22`);
    process.exit(1);
  }
  console.log(`spec: ${REAL.length} focus areas, codes ${CODES[0]}…${CODES[CODES.length - 1]}\n`);

  console.log("checkMigrationHasRun() — the interlock before 297 irreversible deletions\n");

  console.log("REFUSALS");

  /* 1. The state PP6c's ordering would actually have hit: 0030 not yet applied,
        so every one of the 297 objects is still named by a live row. */
  refuses(
    "the legacy platform is still in the database (0030 not applied)",
    () =>
      checkMigrationHasRun(
        [
          ...asTopics(REAL),
          { slug: "mission-values-guest-promise", element_id: "old-1", element_code: "A1" },
          { slug: "governance-ethics", element_id: "old-2", element_code: "B2" },
        ],
        EXPECTED_NEW_ROWS,
        REAL,
      ),
    "0030 has NOT been applied",
  );

  /* 2. THE DECOY. Exactly 22 focus areas, every code numeric, every count right —
        and not one of them is a focus area this content ships. This is the hole
        the review found in 0030's own guard, tested here rather than assumed
        away. */
  refuses(
    "a DECOY 22 — right count, right code shape, wrong focus areas",
    () =>
      checkMigrationHasRun(
        asTopics(Array.from({ length: 22 }, (_, i) => ({ slug: `decoy-${i}` }))),
        EXPECTED_NEW_ROWS,
        REAL,
      ),
    "are absent",
  );

  /* 3. A rollout that stopped one short. */
  refuses(
    "21 of the 22 — a partial rollout",
    () => checkMigrationHasRun(asTopics(REAL.slice(0, 21)), EXPECTED_NEW_ROWS, REAL),
    "22",
  );

  /* 4. The right focus areas, but the guide files never landed: 88 rows, not 110.
        A count that looks plausible is the one worth catching. */
  refuses(
    "the 22 guide files are missing (88 rows, not 110)",
    () => checkMigrationHasRun(asTopics(REAL), 88, REAL),
    "resource row",
  );

  /* 5. And the legacy rows still present alongside a complete new rollout — the
        state right before 0030 runs, which is when this is most likely called. */
  refuses(
    "both platforms present at once (55 focus areas)",
    () =>
      checkMigrationHasRun(
        [
          ...asTopics(REAL),
          ...Array.from({ length: 33 }, (_, i) => ({
            slug: `legacy-${i}`,
            element_id: `old-${i}`,
            element_code: `${"ABCDEFGHIJK"[i % 11]}${(i % 3) + 1}`,
          })),
        ],
        407,
        REAL,
      ),
    "0030 has NOT been applied",
  );

  console.log("\nTHE ONE STATE THAT MAY PROCEED");
  accepts("the real 22, with 110 resource rows", () =>
    checkMigrationHasRun(asTopics(REAL), EXPECTED_NEW_ROWS, REAL),
  );

  console.log(`\n${checks} checks · ${failures === 0 ? "ALL PREFLIGHT CHECKS PASSED" : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
