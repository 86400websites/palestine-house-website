/**
 * scripts/verify-archive-promote.ts — PP7 step 7-b.
 * Tests the two-rename archive swap, INCLUDING its failure path.
 *
 *   pnpm exec tsx scripts/verify-archive-promote.ts
 *
 * WHY THIS EXISTS
 * ---------------
 * `promoteStaging()` moves the directory that is the only copy of 297 files
 * which `0030` deletes and no `.down.sql` can restore. The thing it replaced —
 * the original backup script writing downloads straight into that directory —
 * also looked obviously correct, and the independent review rated it blocking.
 *
 * The lesson PP6b named and PP6c still did not escape is that **a test which
 * exercises the safe variant of a risk reads as coverage and is not.** Verifying
 * that a promotion works when everything is fine would be exactly that test. So
 * the cases below are the awkward ones: a promotion that fails halfway, and a
 * stale superseded copy from a previous run.
 *
 * Offline. Temp directories only. Touches no real archive, no network, no
 * credentials.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promoteStaging } from "./lib/archive";

let failures = 0;
let checks = 0;

function check(label: string, actual: unknown, expected: unknown): void {
  checks += 1;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : ` — got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`}`);
}

async function readOrNull(p: string): Promise<string | null> {
  try {
    return await fs.readFile(p, "utf8");
  } catch {
    return null;
  }
}

/** A directory holding one marker file, so we can tell the copies apart. */
async function makeDir(dir: string, marker: string): Promise<void> {
  await fs.mkdir(path.join(dir, "a1"), { recursive: true });
  await fs.writeFile(path.join(dir, "a1", "marker.txt"), marker, "utf8");
}

async function scenario(name: string, body: (root: string) => Promise<void>): Promise<void> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ph-promote-"));
  console.log(`\n${name}`);
  try {
    await body(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  console.log("promoteStaging() — the two-rename archive swap\n");

  const P = (root: string) => ({
    archive: path.join(root, "archive"),
    staging: path.join(root, "archive.staging"),
    superseded: path.join(root, "archive.superseded"),
  });

  await scenario("1. no previous archive — staging simply becomes the archive", async (root) => {
    const p = P(root);
    await makeDir(p.staging, "NEW");
    const r = await promoteStaging(p);
    check("outcome", r.outcome, "fresh");
    check("archive holds the new bytes", await readOrNull(path.join(p.archive, "a1/marker.txt")), "NEW");
    check("staging is gone", await readOrNull(path.join(p.staging, "a1/marker.txt")), null);
    check("no superseded copy was made", r.superseded, null);
  });

  await scenario("2. an archive exists — it is displaced, not overwritten", async (root) => {
    const p = P(root);
    await makeDir(p.archive, "OLD");
    await makeDir(p.staging, "NEW");
    const r = await promoteStaging(p);
    check("outcome", r.outcome, "replaced");
    check("archive holds the NEW bytes", await readOrNull(path.join(p.archive, "a1/marker.txt")), "NEW");
    check("the OLD archive survives as .superseded", await readOrNull(path.join(p.superseded, "a1/marker.txt")), "OLD");
    check("staging is gone", await readOrNull(path.join(p.staging, "a1/marker.txt")), null);
  });

  await scenario("3. a stale .superseded from a previous run is replaced, never accumulated", async (root) => {
    const p = P(root);
    await makeDir(p.archive, "OLD");
    await makeDir(p.staging, "NEW");
    await makeDir(p.superseded, "ANCIENT");
    await promoteStaging(p);
    check("archive holds the NEW bytes", await readOrNull(path.join(p.archive, "a1/marker.txt")), "NEW");
    check(".superseded is the OLD archive, not the ANCIENT one", await readOrNull(path.join(p.superseded, "a1/marker.txt")), "OLD");
  });

  /* THE CASE THAT MATTERS. The first rename succeeds and the second fails, which
     is the only window in which the operator can be left with no archive at all.
     Forced through the documented seam so it happens on exactly the second call,
     every time — an earlier draft of this test raced an un-awaited `rm` against
     the guard, which is the sort of test that passes until the day it matters. */
  await scenario("4. the second rename FAILS — the original archive is put back", async (root) => {
    const p = P(root);
    await makeDir(p.archive, "OLD");
    await makeDir(p.staging, "NEW");

    let calls = 0;
    const renameFailingOnTheSecondCall = async (from: string, to: string): Promise<void> => {
      calls += 1;
      if (calls === 2) throw new Error("EPERM: simulated — a handle was open in the directory");
      await fs.rename(from, to);
    };

    let threw: string | null = null;
    try {
      await promoteStaging({ ...p, rename: renameFailingOnTheSecondCall });
    } catch (e) {
      threw = e instanceof Error ? e.message : String(e);
    }

    check("it threw rather than reporting success", threw !== null, true);
    check("it got as far as the second rename", calls >= 2, true);
    check("THE ARCHIVE IS STILL THERE", await readOrNull(path.join(p.archive, "a1/marker.txt")), "OLD");
    check("the staged copy also survives", await readOrNull(path.join(p.staging, "a1/marker.txt")), "NEW");
    check(
      "the error tells the operator to verify",
      typeof threw === "string" && threw.includes("verify-archive"),
      true,
    );
  });

  await scenario("6. two of the three paths are the same — refused before anything moves", async (root) => {
    const p = P(root);
    await makeDir(p.archive, "OLD");
    await makeDir(p.staging, "NEW");
    let threw = false;
    try {
      /* The transposition that type-checks: archive and superseded the same. */
      await promoteStaging({ ...p, superseded: p.archive });
    } catch {
      threw = true;
    }
    check("refused", threw, true);
    check("archive untouched", await readOrNull(path.join(p.archive, "a1/marker.txt")), "OLD");
    check("staging untouched", await readOrNull(path.join(p.staging, "a1/marker.txt")), "NEW");
  });

  await scenario("5. nothing staged — it refuses instead of destroying the archive", async (root) => {
    const p = P(root);
    await makeDir(p.archive, "OLD");
    let threw = false;
    try {
      await promoteStaging(p);
    } catch {
      threw = true;
    }
    check("refused", threw, true);
    check("archive untouched", await readOrNull(path.join(p.archive, "a1/marker.txt")), "OLD");
  });

  console.log(`\n${checks} checks · ${failures === 0 ? "ALL PROMOTION CHECKS PASSED" : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("\nVERIFY FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
