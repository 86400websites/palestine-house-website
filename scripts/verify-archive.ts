/**
 * scripts/verify-archive.ts — PP7 step 7-b. IS THE COLD BACKUP STILL INTACT?
 *
 *   pnpm exec tsx scripts/verify-archive.ts
 *   pnpm exec tsx scripts/verify-archive.ts --dir docs/source-assets/_archive-297-templates.staging
 *
 * Exit 0 = the archive is byte-for-byte what production held. Exit 1 = it is not,
 * and nothing destructive may run.
 *
 * WHY A SEPARATE SCRIPT, WHEN THE EXPORTER ALREADY CHECKS ITSELF
 * --------------------------------------------------------------
 * Because until PP7 the only documented way to verify the archive was to re-run
 * the exporter — and the exporter downloads. `docs/archive-297-manifest.json`
 * literally published
 *
 *     howToVerify: pnpm exec tsx scripts/backup-297-objects.ts
 *
 * so the answer to "is my only copy of these 297 files still good?" was a command
 * that opens every one of them for writing. If Storage had by then been mutated,
 * the good bytes were overwritten by the new ones and only THEN did the aggregate
 * check fail — reporting a corrupt archive that the check itself had corrupted.
 * The independent review of 2026-08-16 raised it; this script is the answer.
 *
 * STRUCTURALLY READ-ONLY, not merely intended to be:
 *   - it imports no Supabase client and opens no socket;
 *   - it reads no credentials and never touches `.env.local`;
 *   - the only filesystem calls in it are `readdir` and `readFile`.
 *
 * That is what makes it safe to run at three in the morning during an incident,
 * which is the only moment anyone will ever want it.
 *
 * It re-hashes every file rather than trusting `_manifest-full.json`. A manifest
 * is a claim about bytes; this is the bytes.
 */

import path from "node:path";
import {
  ARCHIVE_REL,
  EXPECTED_COUNT,
  checkArchive,
  printChecks,
  readArchive,
} from "./lib/archive";
import { parseArgs } from "./lib/argv";

const ROOT = process.cwd();

/* Strict: an unknown argument is an error, never a no-op (review 2026-08-16). */
const ARGS = parseArgs(process.argv.slice(2), { flags: [], options: ["--dir"] });
const DIR = ARGS.get("--dir") ?? ARCHIVE_REL;

async function main(): Promise<void> {
  const abs = path.resolve(ROOT, DIR);
  console.log(`verifying ${path.relative(ROOT, abs) || abs}\n`);

  const { files, skipped } = await readArchive(abs);
  if (skipped.length) console.log(`skipped ${skipped.length} bookkeeping file(s): ${skipped.join(", ")}\n`);

  const { ok, checks } = checkArchive(files);
  printChecks(checks);

  if (!ok) {
    console.error(
      `\nARCHIVE IS NOT VALID. Nothing destructive may run against Storage.\n` +
        `This directory is the only copy of the ${EXPECTED_COUNT} legacy template files: a .down.sql\n` +
        `restores rows, never bytes. If the counts are far off, check that --dir points at the\n` +
        `archive and not at a staging directory from an interrupted export.`,
    );
    process.exit(1);
  }

  console.log(`\nARCHIVE VALID — ${files.length} objects, byte-for-byte what production held.`);
  console.log("Read-only: no network call, no credential read, no file opened for writing.");
}

main().catch((e) => {
  console.error("\nVERIFY FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
