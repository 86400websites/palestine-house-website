/**
 * scripts/lib/pg-errors.ts — did the database DEFINITIVELY refuse, or did the
 * transport lose the answer?
 *
 * A PostgreSQL error carries a five-character SQLSTATE (`42501`, `22023`,
 * `23505`, `P0001` …): the statement REACHED the database and was REFUSED, so
 * nothing committed and compensating actions (deleting a freshly uploaded
 * object) are safe. The pinned PostgREST client deliberately reports transport
 * failures with an empty `code` — those are AMBIGUOUS: the write may have
 * committed with its response lost, and compensation would destroy the bytes a
 * live row now owns.
 *
 * Round 4 (H5) taught `replaceBytes` this rule; round 5 found `putFile` never
 * learned it. One definition, both callers, no third copy to drift.
 */

export function isDefinitiveRefusal(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return typeof code === "string" && /^[0-9A-Z]{5}$/.test(code);
}
