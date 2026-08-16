/**
 * scripts/verify-shift-detector.ts — PP7 step 7-g.
 * The case the old detector let through, and the ones it caught.
 *
 *   pnpm exec tsx scripts/verify-shift-detector.ts
 *
 * Template codes come from alphabetical filename order, so adding or removing
 * one source document re-letters every document after it. Load the spec's titles
 * onto rows matched by code after that, and a partner downloads "Beta" and gets
 * Alpha's bytes.
 *
 * The old detector raised only on a clean two-way SWAP — where the displaced
 * title reappears in the same focus area's spec under another code. A DELETION
 * removes the title from the spec entirely, so the swap branch never fired and
 * the shift was waved through as "a pure rename".
 *
 * Case 3 below is that exact scenario. It is the whole reason this file exists.
 * Offline; no network, no credentials.
 */

import { type ShiftRegistered, type ShiftTemplate, assertCodesHaveNotShifted } from "./lib/shift";

let checks = 0;
let failures = 0;

const reg = (code: string, title: string): ShiftRegistered => ({ code, title, doc_key: null });
const tpl = (code: string, title: string): ShiftTemplate => ({ code, title });

function refuses(label: string, run: () => void, mustMention: string): void {
  checks += 1;
  try {
    run();
    failures += 1;
    console.log(`  FAIL  ${label} — ACCEPTED (a document's name would land on another's bytes)`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes(mustMention)) console.log(`  PASS  ${label} — refused`);
    else {
      failures += 1;
      console.log(`  FAIL  ${label} — refused for the wrong reason: ${msg.slice(0, 90)}`);
    }
  }
}

function accepts(label: string, run: () => void): void {
  checks += 1;
  try {
    run();
    console.log(`  PASS  ${label} — accepted`);
  } catch (e) {
    failures += 1;
    console.log(`  FAIL  ${label} — refused a legitimate load: ${e instanceof Error ? e.message : e}`);
  }
}

function main(): void {
  console.log("assertCodesHaveNotShifted() — code/title drift on a focus area's templates\n");

  console.log("THE ORDINARY CASES");
  accepts("nothing has moved", () =>
    assertCodesHaveNotShifted(
      "Plan the Money",
      [tpl("t01", "Alpha"), tpl("t02", "Beta"), tpl("t03", "Gamma")],
      [reg("t01", "Alpha"), reg("t02", "Beta"), reg("t03", "Gamma")],
      false,
    ),
  );
  accepts("a focus area with nothing registered yet", () =>
    assertCodesHaveNotShifted("Plan the Money", [tpl("t01", "Alpha")], [], false),
  );
  accepts("the guide row is ignored (doc_key is not null)", () =>
    assertCodesHaveNotShifted(
      "Plan the Money",
      [tpl("t01", "Alpha")],
      [{ code: "t01", title: "Something else entirely", doc_key: "guide" }, reg("t01", "Alpha")],
      false,
    ),
  );

  console.log("\nTHE SWAP — caught before PP7 too");
  refuses(
    "two documents exchange codes",
    () =>
      assertCodesHaveNotShifted(
        "Plan the Money",
        [tpl("t01", "Beta"), tpl("t02", "Alpha")],
        [reg("t01", "Alpha"), reg("t02", "Beta")],
        false,
      ),
    "Template codes have shifted",
  );

  console.log("\nTHE DELETION-INDUCED SHIFT — WAVED THROUGH BEFORE PP7 (M1)");
  /* `Alpha` (t01) was deleted from the source folder, so `Beta` slid from t02 to
     t01 and `Gamma` from t03 to t02. The database still holds Alpha/Beta/Gamma
     at t01/t02/t03. "Alpha" is nowhere in the new spec, so the swap branch never
     fires — and every one of these rows would have been retitled onto the wrong
     bytes. */
  const shifted = () =>
    assertCodesHaveNotShifted(
      "Plan the Money",
      [tpl("t01", "Beta"), tpl("t02", "Gamma")],
      [reg("t01", "Alpha"), reg("t02", "Beta"), reg("t03", "Gamma")],
      false,
    );
  refuses("a deleted document re-lettered everything after it", shifted, "is nowhere in this focus area's spec");

  console.log("\nAND THE RENAME IT CANNOT BE TOLD APART FROM");
  refuses(
    "a plain retitle, unconfirmed",
    () =>
      assertCodesHaveNotShifted(
        "Plan the Money",
        [tpl("t01", "Alpha (2026 edition)")],
        [reg("t01", "Alpha")],
        false,
      ),
    "If you know it is a rename, pass --allow-retitle",
  );
  accepts("a plain retitle, confirmed with --allow-retitle", () =>
    assertCodesHaveNotShifted("Plan the Money", [tpl("t01", "Alpha (2026 edition)")], [reg("t01", "Alpha")], true),
  );
  /* --allow-retitle is a human saying "this one is a rename". It must NOT become
     a blanket override for the swap, which is provably a shift. */
  refuses(
    "--allow-retitle does NOT excuse a provable swap",
    () =>
      assertCodesHaveNotShifted(
        "Plan the Money",
        [tpl("t01", "Beta"), tpl("t02", "Alpha")],
        [reg("t01", "Alpha"), reg("t02", "Beta")],
        true,
      ),
    "Template codes have shifted",
  );

  console.log(`\n${checks} checks · ${failures === 0 ? "ALL SHIFT-DETECTOR CHECKS PASSED" : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
