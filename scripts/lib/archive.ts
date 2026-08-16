/**
 * scripts/lib/archive.ts — the cold backup of the 297 legacy template objects,
 * in one place.
 *
 * WHY THIS EXISTS
 * ---------------
 * `0030` deletes 297 Storage objects, and a `.down.sql` restores rows, never
 * bytes. `docs/source-assets/_archive-297-templates/` is therefore the only copy
 * those files have, and three scripts now depend on knowing whether it is intact:
 * the exporter, the deleter's interlock, and the read-only verifier PP7 adds.
 *
 * Before PP7 each of them carried its own copy of the expected count, the
 * expected byte total, the fingerprint, and its own re-implementation of the
 * fingerprint formula. That is three chances to drift on the one artefact that
 * cannot be regenerated — and the drift had already started: the deleter
 * computed a SECOND fingerprint over `name|md5|0`, with the size hardcoded to
 * zero, then discarded it with `void`. Harmless, because the real check sat
 * beside it and did stat each file, but it is exactly the shape of thing that
 * gets copied into the next script by someone reading quickly.
 *
 * So the constants and the formula live here, once.
 *
 * THE FINGERPRINT IS NOT ARBITRARY. It is production's own aggregate, computed
 * server-side as
 *
 *     md5(string_agg(
 *           name ||'|'|| replace(metadata->>'eTag','"','') ||'|'|| (metadata->>'size'),
 *           E'\n' order by name))
 *     from storage.objects where bucket_id = 'resources';
 *
 * The `replace()` is load-bearing — Storage stores eTags QUOTED, and a digest
 * taken over the quoted form is a different (equally valid, but unreproducible)
 * value. The form below is the one a file on disk can reproduce, which is the
 * entire point of a backup you can verify.
 */

import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

/** Relative to the repo root. Gitignored — the bytes stay out of a public repo. */
export const ARCHIVE_REL = "docs/source-assets/_archive-297-templates";
/** Where an export lands BEFORE it has been proven. Never the live archive. */
export const STAGING_REL = `${ARCHIVE_REL}.staging`;
/** The per-object listing, beside the bytes rather than in the public repo. */
export const FULL_MANIFEST_NAME = "_manifest-full.json";

/* Production's measured values, read-only, 2026-08-16 (PP6c step 6c-a).
   Re-checkable at any time with the query in the header comment. */
export const EXPECTED_COUNT = 297;
export const EXPECTED_BYTES = 5_320_962;
export const EXPECTED_FINGERPRINT = "6fde792718130d12071b69459f9d70ab";

export interface ArchiveFile {
  /** Storage key, forward-slashed, relative to the archive root. */
  name: string;
  md5: string;
  size: number;
}

export function md5(bytes: Buffer): string {
  return createHash("md5").update(bytes).digest("hex");
}

/** The eTag Storage reports is a quoted MD5 hex string. Normalise, and refuse
 *  anything that is not a plain 32-hex digest — a multipart eTag (`<md5>-<n>`)
 *  is NOT the MD5 of the bytes, so silently comparing against one would make the
 *  per-object assertion meaningless exactly when it matters most. */
export function normaliseEtag(raw: string | undefined, name: string): string {
  const etag = (raw ?? "").replace(/^"|"$/g, "").trim().toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(etag)) {
    throw new Error(
      `object "${name}" has eTag ${JSON.stringify(raw)}, which is not a plain MD5 digest. ` +
        `A multipart eTag cannot be compared against the file's MD5; back this object up by hand ` +
        `and re-check the assertions before trusting this run.`,
    );
  }
  return etag;
}

/** Byte-for-byte the order the original export used: UTF-16 code-unit order on
 *  the key. Changing it changes the fingerprint, which would invalidate a
 *  backup that is in fact perfectly good — so it is spelled out rather than
 *  left to `Array.prototype.sort`'s default, which is the same thing today but
 *  is not a promise anyone made in writing. */
export function sortByName<T extends { name: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/** md5(join('\n', sorted `name|md5|size`)). The ONE definition. */
export function fingerprintOf(rows: readonly ArchiveFile[]): string {
  return createHash("md5")
    .update(
      sortByName([...rows])
        .map((r) => `${r.name}|${r.md5}|${r.size}`)
        .join("\n"),
    )
    .digest("hex");
}

/* Files that are part of the archive's bookkeeping or the operating system's,
   not part of the backup. Named exactly rather than filtered by extension: an
   extension allow-list silently ignores a stray file, and "silently ignored" is
   how a corpus quietly stops matching its own count. */
const NOT_CONTENT = new Set([FULL_MANIFEST_NAME, "desktop.ini", "Thumbs.db", ".DS_Store"]);

export interface ArchiveRead {
  files: ArchiveFile[];
  /** Anything skipped, reported rather than swallowed. */
  skipped: string[];
}

/** Walk a directory, hashing every file. Pure read — opens nothing for writing,
 *  needs no credentials and makes no network call. */
export async function readArchive(dir: string): Promise<ArchiveRead> {
  const files: ArchiveFile[] = [];
  const skipped: string[] = [];

  const walk = async (abs: string, prefix = ""): Promise<void> => {
    let entries;
    try {
      entries = await fs.readdir(abs, { withFileTypes: true });
    } catch (e) {
      throw new Error(
        `cannot read ${dir}: ${e instanceof Error ? e.message : e}. ` +
          `This directory is the ONLY copy of the 297 legacy template files.`,
      );
    }
    for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const child = path.join(abs, entry.name);
      if (entry.isDirectory()) {
        await walk(child, rel);
        continue;
      }
      if (NOT_CONTENT.has(entry.name)) {
        skipped.push(rel);
        continue;
      }
      const buf = await fs.readFile(child);
      files.push({ name: rel, md5: md5(buf), size: buf.length });
    }
  };

  await walk(dir);
  return { files: sortByName(files), skipped };
}

export interface Check {
  label: string;
  ok: boolean;
  detail: string;
}

/** The three aggregate assertions, in the order a failure is most useful.
 *  Assertion 4 (the fingerprint) subsumes 1–3, but they stay separate because a
 *  failure should say WHICH property broke: a lone mismatched digest is the
 *  least actionable possible error on the one step that cannot be retried. */
export function checkArchive(files: readonly ArchiveFile[]): { ok: boolean; checks: Check[] } {
  const bytes = files.reduce((n, f) => n + f.size, 0);
  const fingerprint = fingerprintOf(files);
  const checks: Check[] = [
    {
      label: "object count",
      ok: files.length === EXPECTED_COUNT,
      detail: `${files.length} (expected ${EXPECTED_COUNT})`,
    },
    {
      label: "total bytes",
      ok: bytes === EXPECTED_BYTES,
      detail: `${bytes.toLocaleString("en-US")} (expected ${EXPECTED_BYTES.toLocaleString("en-US")})`,
    },
    {
      label: "aggregate fingerprint = PRODUCTION's",
      ok: fingerprint === EXPECTED_FINGERPRINT,
      detail: `${fingerprint} (expected ${EXPECTED_FINGERPRINT})`,
    },
  ];
  return { ok: checks.every((c) => c.ok), checks };
}

export function printChecks(checks: readonly Check[]): void {
  for (const c of checks) console.log(`  ${c.ok ? "PASS" : "FAIL"}  ${c.label} — ${c.detail}`);
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

export interface PromoteResult {
  /** `"fresh"` = there was no previous archive. `"replaced"` = one was displaced. */
  outcome: "fresh" | "replaced";
  /** Where the displaced archive went, if any. */
  superseded: string | null;
}

/**
 * THE PROMOTION. Two renames with a kept copy between them, rather than one
 * write over the top of the only backup that exists.
 *
 * It lives here, separate from the exporter, for one reason: it is the single
 * most dangerous filesystem operation in the sprint — it moves the directory
 * that is the ONLY copy of 297 files that `0030` deletes and no `.down.sql` can
 * restore. "Obviously correct" is what the original backup script's write path
 * looked like too, and the review found it blocking. So this is a function with
 * a test rather than eight lines inline.
 *
 * THE INVARIANT: at no instant is there less than one complete copy on disk.
 *
 *   archive + staging          -> both present
 *   rename(archive, .superseded)  -> .superseded + staging
 *   rename(staging, archive)      -> .superseded + archive
 *
 * If the process dies between the two renames, the operator finds the archive
 * gone and `.superseded` present, and the recovery is one rename. If the second
 * rename FAILS, this puts the original back itself and throws.
 *
 * Only ever one `.superseded`: any earlier one is removed first — and only ever
 * after the caller has proven the staged copy, so a verified archive exists
 * throughout.
 */
export async function promoteStaging(paths: {
  /** The live archive: the directory that must end up holding the new bytes. */
  archive: string;
  /** The proven copy to move into place. */
  staging: string;
  /** Where a displaced archive is kept. */
  superseded: string;
  /** TEST SEAM, and deliberately one. The recovery path below only runs when the
   *  SECOND rename fails, and there is no cross-platform way to make a rename
   *  fail on demand from outside — the alternatives are a race (remove the
   *  directory and hope the timing holds) or a Windows-only open-handle trick.
   *  A flaky test on the one path that decides whether the operator still has a
   *  backup is worth less than no test, so the seam is explicit. Production
   *  callers never pass it. */
  rename?: (from: string, to: string) => Promise<void>;
}): Promise<PromoteResult> {
  const { archive, staging, superseded } = paths;
  const rename = paths.rename ?? fs.rename;

  if (archive === superseded || archive === staging || staging === superseded) {
    throw new Error(
      `promoteStaging needs three distinct paths; got archive=${archive}, staging=${staging}, ` +
        `superseded=${superseded}. Two of them being equal would delete the archive it is meant to keep.`,
    );
  }
  /* Named rather than positional, and not for style. The three arguments are all
     strings, all absolute paths, all directories — so a transposed call type-checks
     perfectly and moves the only copy of 297 irreplaceable files somewhere nobody
     is looking. That transposition was written, and caught, while building this
     function. A signature that cannot be called wrongly is worth more here than
     one that reads slightly shorter. */
  if (!(await exists(staging))) {
    throw new Error(`nothing to promote: ${staging} does not exist`);
  }

  if (!(await exists(archive))) {
    await rename(staging, archive);
    return { outcome: "fresh", superseded: null };
  }

  if (await exists(superseded)) await fs.rm(superseded, { recursive: true, force: true });
  await rename(archive, superseded);
  try {
    await rename(staging, archive);
  } catch (e) {
    /* Put it back rather than leaving the operator with no archive at all. */
    await rename(superseded, archive).catch(() => {});
    throw new Error(
      `promotion failed after the previous archive was moved aside: ${e instanceof Error ? e.message : e}. ` +
        `The previous archive has been put back. Verify it before anything else: ` +
        `\`pnpm exec tsx scripts/verify-archive.ts\``,
    );
  }
  return { outcome: "replaced", superseded };
}
