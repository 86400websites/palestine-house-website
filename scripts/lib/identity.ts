/**
 * scripts/lib/identity.ts — which database row is this spec entry?
 *
 * THE CODE IS THE IDENTITY. THE SLUG IS NOT.
 *
 * Every lookup in `load-content.ts` used to be `rows.find(t => t.slug ===
 * fa.slug)`, and the independent review of 2026-08-16 pointed out what that
 * costs. A focus area whose slug no longer matches the spec is INVISIBLE to a
 * slug lookup, so:
 *
 *   - the Live guard finds nothing, concludes the focus area does not exist, and
 *     never demands `--allow-live`;
 *   - `upsertFocusArea` then sees `existing = null` and calls the RPC with
 *     `p_id: null` — CREATE — producing a second focus area for a code that
 *     already has one, instead of updating the row the operator meant.
 *
 * A published focus area gets quietly duplicated, and the guard that exists to
 * stop unreviewed writes reaching partners never fires.
 *
 * The code (`1.1` … `4.5`) is the stable identity, and the reason is written
 * into the schema: `admin_upsert_platform_topic` FREEZES the slug on update,
 * precisely so a rename cannot break a partner's bookmark. The slug is the one
 * field designed to drift. Keying identity on it was the mistake.
 *
 * This refuses rather than guesses on every ambiguous shape. Writing the spec's
 * content into a row somebody renamed, or creating a second focus area under a
 * slug that already belongs to a different code, are decisions for a person.
 */

export interface IdentityRow {
  slug: string;
  element_code: string;
}

export interface IdentityEntry {
  code: string;
  slug: string;
}

/** The matching row, or null if this focus area is genuinely not there yet.
 *  Throws on anything ambiguous. */
export function findByCode<T extends IdentityRow>(
  rows: readonly T[],
  fa: IdentityEntry,
): T | null {
  const byCode = rows.filter((t) => t.element_code === fa.code);
  if (byCode.length > 1) {
    throw new Error(
      `${byCode.length} focus areas carry the code ${fa.code} (${byCode.map((t) => `/${t.slug}`).join(", ")}). ` +
        `That should be impossible and this script will not guess which one you meant. Nothing has been written.`,
    );
  }
  const existing = byCode[0] ?? null;

  if (existing && existing.slug !== fa.slug) {
    throw new Error(
      `${fa.code} is in the database as "/${existing.slug}" but the spec calls it "/${fa.slug}". ` +
        `The slug is frozen on update, so this is a rename someone made deliberately — and writing ` +
        `the spec's content into it, or creating a second focus area under the spec's slug, are both ` +
        `decisions for a person. Fix the slug in the spec or in the database. Nothing has been written.`,
    );
  }

  /* The reverse collision: the spec's slug already taken by a DIFFERENT code.
     Deliberately a slug lookup — this is the collision case, not the identity
     one, and without it a load would either collide on the unique index or
     create a duplicate depending on which way the data was wrong. */
  const clash = rows.find((t) => t.slug === fa.slug && t.element_code !== fa.code);
  if (clash) {
    throw new Error(
      `"/${fa.slug}" already belongs to ${clash.element_code}, not ${fa.code}. Loading would ` +
        `either collide or create a duplicate. Nothing has been written.`,
    );
  }

  return existing;
}
