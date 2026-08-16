/**
 * scripts/verify-0030-guard.ts — PP7 step 7-d.
 * The manifest inside `0030` must be the spec. Both directions, exactly.
 *
 *   pnpm exec tsx scripts/verify-0030-guard.ts
 *
 * WHY THIS EXISTS
 * ---------------
 * `0030`'s guard used to count: "are there 22 live, published, numeric-coded
 * focus areas?" — and accepted any 22. The review put a decoy to it and the
 * decoy passed. A count is not an identity, and the migration that follows the
 * guard deletes the real platform.
 *
 * The guard is now an exact manifest of the 22: code, slug, section, template
 * count. Which introduces a second, quieter risk — a manifest hand-typed into
 * SQL drifts from the spec it was copied out of, and the drift shows up as a
 * migration that refuses to run on the day it is needed, or worse, one that
 * accepts something it should not.
 *
 * So the manifest is generated from `docs/content-v2-spec.json`, and this script
 * parses it back OUT of the .sql file and compares the two, row by row, in both
 * directions. It reads files. It touches no database.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MIGRATION = path.join(ROOT, "supabase/sql/migrations/0030_content_v2_cutover.up.sql");
const SPEC = path.join(ROOT, "docs/content-v2-spec.json");

interface Row {
  code: string;
  slug: string;
  group: string;
  templates: number;
}

let failures = 0;
function fail(msg: string): void {
  failures += 1;
  console.log(`  FAIL  ${msg}`);
}

/** Pull the `insert into _pp7_expected ... values (...);` rows out of the SQL. */
function parseManifest(sql: string): Row[] {
  const start = sql.indexOf("insert into _pp7_expected");
  if (start === -1) throw new Error("no `insert into _pp7_expected` in the migration — the guard is gone");
  const end = sql.indexOf(";", start);
  if (end === -1) throw new Error("the manifest insert is not terminated");
  const body = sql.slice(start, end);

  const rows: Row[] = [];
  const re = /\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(\d+)\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    rows.push({ code: m[1], slug: m[2], group: m[3], templates: Number(m[4]) });
  }
  return rows;
}

function main(): void {
  const sql = readFileSync(MIGRATION, "utf8");
  const spec = JSON.parse(readFileSync(SPEC, "utf8")) as {
    sections: { slug: string; groupSlug: string }[];
    focusAreas: { number: string; slug: string; sectionSlug: string; templates: unknown[] }[];
  };

  const groupOf = new Map(spec.sections.map((s) => [s.slug, s.groupSlug]));
  const expected: Row[] = spec.focusAreas.map((f) => ({
    code: f.number,
    slug: f.slug,
    group: groupOf.get(f.sectionSlug) ?? `!! no section "${f.sectionSlug}"`,
    templates: f.templates.length,
  }));

  const manifest = parseManifest(sql);
  console.log(`spec:     ${expected.length} focus areas, ${expected.reduce((n, r) => n + r.templates, 0)} templates`);
  console.log(`manifest: ${manifest.length} focus areas, ${manifest.reduce((n, r) => n + r.templates, 0)} templates\n`);

  console.log("MANIFEST vs SPEC");

  if (manifest.length !== 22) fail(`the manifest holds ${manifest.length} rows, expected 22`);
  if (expected.length !== 22) fail(`the spec holds ${expected.length} focus areas, expected 22`);

  /* Spec -> manifest. */
  const byCode = new Map(manifest.map((r) => [r.code, r]));
  for (const want of expected) {
    const got = byCode.get(want.code);
    if (!got) {
      fail(`${want.code} /${want.slug} is in the spec but NOT in the migration's manifest`);
      continue;
    }
    if (got.slug !== want.slug) fail(`${want.code}: manifest slug "${got.slug}" != spec "${want.slug}"`);
    if (got.group !== want.group) fail(`${want.code}: manifest section "${got.group}" != spec "${want.group}"`);
    if (got.templates !== want.templates) {
      fail(`${want.code}: manifest expects ${got.templates} template(s), the spec ships ${want.templates}`);
    }
  }

  /* Manifest -> spec. The direction that catches a row nobody removed. */
  const specCodes = new Set(expected.map((r) => r.code));
  for (const got of manifest) {
    if (!specCodes.has(got.code)) fail(`${got.code} /${got.slug} is in the manifest but NOT in the spec`);
  }

  /* Duplicates would be accepted by the primary key at apply time, not here. */
  for (const key of ["code", "slug"] as const) {
    const seen = new Set<string>();
    for (const r of manifest) {
      if (seen.has(r[key])) fail(`duplicate ${key} "${r[key]}" in the manifest`);
      seen.add(r[key]);
    }
  }

  /* The guard must still assert the things the review asked for. Cheap string
     checks, but they catch a guard quietly reverted to counting rows. */
  console.log("\nGUARD SHAPE");
  const required: [string, string][] = [
    ["refuses a draft focus area", "is a DRAFT"],
    ["requires a non-empty guide body", "simple_guide_md"],
    ["requires exactly one guide file", "guide file(s), expected exactly 1"],
    ["checks per-area template counts", "template(s), expected"],
    ["rejects unnamed numeric-coded elements", "the manifest does not name"],
    ["re-checks publication before commit", "REFUSING TO COMMIT"],
  ];
  for (const [label, needle] of required) {
    if (sql.includes(needle)) console.log(`  PASS  ${label}`);
    else fail(`${label} — "${needle}" is not in the migration`);
  }

  if (failures === 0) console.log("\nMANIFEST MATCHES THE SPEC — 22 focus areas, 88 templates, both directions.");
  else console.log(`\n${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
