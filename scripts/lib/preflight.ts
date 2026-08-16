/**
 * scripts/lib/preflight.ts — "has migration 0030 actually committed?"
 *
 * The decision, kept apart from the fetching, so it can be tested against the
 * shapes that must be REFUSED rather than only the one that should pass. That
 * distinction is the whole lesson of this sprint series: PP6b named it, PP6c
 * still did not escape it, and the review round that produced PP7 found it
 * again in `0030`'s own guard. **A test that exercises the safe variant of a
 * risk reads as coverage and is not.**
 *
 * What this decides is the last thing standing between a mistyped command and
 * 297 Storage objects that no `.down.sql`, flag or Supabase backup can return.
 *
 * WHY IT COUNTS ROWS INSTEAD OF COMPARING STORAGE PATHS
 * -----------------------------------------------------
 * The exact check would be "no surviving row references any object I am about to
 * delete". That needs every surviving row's `storage_path`, and no admin RPC
 * exposes one — D-PP-i keeps paths off admin surfaces deliberately. The single
 * RPC that returns a path, `get_resource_download`, resolves nothing for an
 * UNPUBLISHED topic, so a check built on it would silently skip every Draft row
 * and fail OPEN on the one step that cannot be retried.
 *
 * `admin_list_platform_topics` and `admin_list_resource_files` see Draft and
 * Live alike. So the check is built from what can see everything, and its
 * limitation is written down rather than discovered later.
 */

/** What the database must look like once 0030 has committed: the new corpus and
 *  nothing else. 88 templates + 22 Simple Guide files, one per focus area.
 *  The two public booklets are NOT counted — they live in the `booklets` bucket,
 *  carry `element_id IS NULL` so no per-element listing reaches them, and 0030
 *  does not delete them. */
export const EXPECTED_NEW_TEMPLATES = 88;
export const EXPECTED_NEW_GUIDES = 22;
export const EXPECTED_NEW_ROWS = EXPECTED_NEW_TEMPLATES + EXPECTED_NEW_GUIDES;

export interface PreflightTopic {
  slug: string;
  element_id: string;
  element_code: string;
}

export interface PreflightArea {
  slug: string;
}

/** Throws with an operator-readable reason, or returns silently. */
export function checkMigrationHasRun(
  topics: readonly PreflightTopic[],
  resourceRowCount: number,
  expected: readonly PreflightArea[],
): void {
  /* a) Not one legacy focus area may remain. The retired vocabulary is A1…K3;
        the new focus areas are 1.1…4.5. */
  const legacy = topics.filter((t) => !/^[0-9]/.test(t.element_code ?? ""));
  if (legacy.length) {
    throw new Error(
      `${legacy.length} legacy focus area(s) are still in the database (e.g. ${legacy[0].element_code} ` +
        `/${legacy[0].slug}). Migration 0030 has NOT been applied, so these 297 objects are still ` +
        `referenced by live rows — deleting them would give every approved partner a broken ` +
        `download that no retry repairs. Apply 0030 first. REFUSING.`,
    );
  }

  /* b) Exactly the focus areas the spec describes — not merely the right NUMBER
        of them. This is the same decoy the review found in 0030's own guard:
        counting 22 rows says nothing about which 22 they are. */
  const bySlug = new Set(topics.map((t) => t.slug));
  const missing = expected.filter((f) => !bySlug.has(f.slug)).map((f) => f.slug);
  if (missing.length || topics.length !== expected.length) {
    throw new Error(
      `the database holds ${topics.length} focus area(s); the spec describes ${expected.length}` +
        (missing.length ? `, and ${missing.length} are absent: ${missing.slice(0, 3).join(", ")}` : "") +
        `. REFUSING to delete anything.`,
    );
  }

  /* c) And they carry exactly the new content's rows. 0030's own post-conditions
        asserted the same 88 templates inside its transaction, so agreement here
        means it committed rather than merely started. */
  if (resourceRowCount !== EXPECTED_NEW_ROWS) {
    throw new Error(
      `the ${expected.length} focus areas carry ${resourceRowCount} resource row(s), expected ` +
        `${EXPECTED_NEW_ROWS} (${EXPECTED_NEW_TEMPLATES} templates + ${EXPECTED_NEW_GUIDES} guides). ` +
        `Either 0030 did not complete or the content is not what this script was built against. ` +
        `REFUSING.`,
    );
  }
}
