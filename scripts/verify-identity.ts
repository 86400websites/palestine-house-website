/**
 * scripts/verify-identity.ts — PP7 step 7-d.
 * Watches `findByCode()` refuse the shapes a slug lookup used to wave through.
 *
 *   pnpm exec tsx scripts/verify-identity.ts
 *
 * The bug this replaces: `load-content.ts` identified a focus area by SLUG, so a
 * renamed one was invisible — the Live guard did not fire, and the loader then
 * CREATED a duplicate instead of updating. A published focus area could be
 * silently doubled, by a command whose whole safety story was "it refuses to
 * touch Live content".
 *
 * Offline. No network, no credentials, no database.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { type IdentityRow, findByCode } from "./lib/identity";

let checks = 0;
let failures = 0;

function refuses(label: string, run: () => unknown, mustMention: string): void {
  checks += 1;
  try {
    run();
    failures += 1;
    console.log(`  FAIL  ${label} — it ACCEPTED this`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes(mustMention)) console.log(`  PASS  ${label} — refused`);
    else {
      failures += 1;
      console.log(`  FAIL  ${label} — refused for the wrong reason: ${msg.slice(0, 100)}`);
    }
  }
}

function equals(label: string, actual: unknown, expected: unknown): void {
  checks += 1;
  if (JSON.stringify(actual) === JSON.stringify(expected)) console.log(`  PASS  ${label}`);
  else {
    failures += 1;
    console.log(`  FAIL  ${label} — got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  }
}

const SPEC = JSON.parse(
  readFileSync(path.join(process.cwd(), "docs/content-v2-spec.json"), "utf8"),
) as { focusAreas: { slug: string; number: string }[] };

interface Row extends IdentityRow {
  published: boolean;
}

const LIVE_ROWS: Row[] = SPEC.focusAreas.map((f) => ({
  slug: f.slug,
  element_code: f.number,
  published: true,
}));

function main(): void {
  console.log("findByCode() — identity is the code, not the slug\n");

  const first = SPEC.focusAreas[0];
  const fa = { code: first.number, slug: first.slug };

  console.log("THE NORMAL CASES");
  equals("finds the row by code", findByCode(LIVE_ROWS, fa)?.slug, first.slug);
  equals("returns null when the focus area genuinely is not there", findByCode([], fa), null);

  console.log("\nTHE SHAPE THE SLUG LOOKUP USED TO MISS");
  /* THE BUG, exactly: the row is Live, the code matches, the slug has been
     changed. The old lookup returned undefined here, so the Live guard saw
     "does not exist", let the run proceed, and the loader created a second
     focus area for a code that already had one. */
  const renamed: Row[] = LIVE_ROWS.map((r) =>
    r.element_code === fa.code ? { ...r, slug: `${r.slug}-renamed-by-hand` } : r,
  );
  equals(
    "a slug lookup finds NOTHING here (the old behaviour)",
    renamed.find((r) => r.slug === fa.slug) ?? null,
    null,
  );
  refuses("a renamed focus area", () => findByCode(renamed, fa), "is a rename someone made deliberately");

  console.log("\nTHE OTHER AMBIGUITIES");
  refuses(
    "two rows sharing one code",
    () => findByCode([...LIVE_ROWS, { slug: "duplicate-area", element_code: fa.code, published: false }], fa),
    "should be impossible",
  );
  refuses(
    "the spec's slug already belongs to a different code",
    () => findByCode([{ slug: fa.slug, element_code: "9.9", published: true }], fa),
    "already belongs to",
  );

  console.log("\nAND THE GUARD IT PROTECTS");
  /* The point of all of the above: with identity on the code, a renamed LIVE row
     is still seen as Live, so --allow-live is still demanded. */
  let sawLive = false;
  try {
    sawLive = Boolean(findByCode(renamed, fa)?.published);
  } catch {
    sawLive = true; /* refusing is also "did not silently proceed" */
  }
  equals("a renamed LIVE focus area cannot slip past the Live guard", sawLive, true);

  console.log(`\n${checks} checks · ${failures === 0 ? "ALL IDENTITY CHECKS PASSED" : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
