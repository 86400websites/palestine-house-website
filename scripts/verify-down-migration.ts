/**
 * scripts/verify-down-migration.ts — PP7 step 7-f.
 * Validates `0030_content_v2_cutover.down.sql` without executing it.
 *
 *   pnpm exec tsx scripts/verify-down-migration.ts
 *
 * WHY OFFLINE VALIDATION IS NOT AN EXCUSE
 * ---------------------------------------
 * This file is 1.68 MB. There is no channel from the build environment that can
 * push that much SQL: no `psql` on this machine, no Postgres connection string
 * in `.env.local` (checked at 7-f — only Supabase API credentials are there),
 * and the Supabase JS client executes no arbitrary SQL. So the file is applied by
 * hand in the SQL Editor, which is the documented process for every migration in
 * this project, and **its end-to-end execution is the owner's step, not this
 * engine's.**
 *
 * What this script does instead is make that owner run boring: it checks every
 * property that could make the file fail halfway through and leave production
 * half-restored during an incident. A rollback that fails at insert 200 of 373 is
 * worse than one that fails at insert 1.
 *
 * WHAT IT CHECKS
 *   1. the transaction wrapper is present and balanced (one begin, one commit);
 *   2. every statement is a recognised insert into a known table;
 *   3. every insert names the columns it fills, and the values arity matches;
 *   4. every dollar-quoted literal is balanced and terminated — the failure mode
 *      that would corrupt 1.6 MB of the owner's prose;
 *   5. `on conflict (id) do nothing` on every insert, which is what makes a
 *      partial rollback re-runnable;
 *   6. FOREIGN KEY ORDER: elements before topics, groups before topics, elements
 *      before resources. Getting this wrong is how the file fails at row 200.
 *   7. the row counts match what production reported.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "./lib/argv";

/* `--file` exists so this validator can be pointed at deliberately corrupted
   copies and watched to FAIL. A checker nobody has seen reject anything is the
   same hypothesis as a rollback nobody has run. */
const ARGS = parseArgs(process.argv.slice(2), { flags: ["--expect-fail"], options: ["--file"] });
const EXPECT_FAIL = ARGS.has("--expect-fail");
const FILE = path.resolve(
  process.cwd(),
  ARGS.get("--file") ?? "supabase/sql/migrations/0030_content_v2_cutover.down.sql",
);

const EXPECT: Record<string, number> = {
  "public.elements": 33,
  "public.platform_groups": 10,
  "public.platform_topics": 33,
  "public.resources": 297,
};

let checks = 0;
let failures = 0;

function check(label: string, ok: boolean, detail = ""): void {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

interface Stmt {
  table: string;
  columns: string[];
  /** Index of the statement's first line in the file, 1-based. */
  line: number;
  onConflict: boolean;
  /** Number of top-level comma-separated values. */
  valueCount: number;
}

/** Split a `values (...)` body at top level, stepping over dollar-quoted runs. */
function countValues(sql: string, from: number): { count: number; end: number } | null {
  let i = sql.indexOf("values (", from);
  if (i === -1) return null;
  i += "values (".length;
  let depth = 1;
  let count = 1;
  while (i < sql.length) {
    if (sql.startsWith("$", i)) {
      /* a dollar-quoted literal: $tag$ … $tag$ — skip it whole */
      const m = /^\$([A-Za-z0-9_]*)\$/.exec(sql.slice(i));
      if (m) {
        const tag = m[0];
        const close = sql.indexOf(tag, i + tag.length);
        if (close === -1) return null; /* unterminated */
        i = close + tag.length;
        continue;
      }
    }
    const c = sql[i];
    if (c === "(") depth += 1;
    else if (c === ")") {
      depth -= 1;
      if (depth === 0) return { count, end: i };
    } else if (c === "," && depth === 1) count += 1;
    i += 1;
  }
  return null;
}

function main(): void {
  const sql = readFileSync(FILE, "utf8");
  const bytes = Buffer.byteLength(sql, "utf8");
  console.log(`${path.relative(process.cwd(), FILE)} — ${(bytes / 1024 / 1024).toFixed(2)} MB\n`);

  console.log("TRANSACTION");
  const begins = (sql.match(/^begin;$/gm) ?? []).length;
  const commits = (sql.match(/^commit;$/gm) ?? []).length;
  check("exactly one begin", begins === 1, `${begins}`);
  check("exactly one commit", commits === 1, `${commits}`);
  check("begin precedes commit", sql.indexOf("\nbegin;") < sql.indexOf("\ncommit;"));
  check("no rollback left in the file", !/^rollback;$/m.test(sql));

  console.log("\nSTATEMENTS");
  const stmts: Stmt[] = [];
  const lines = sql.split("\n");
  let unterminated = 0;

  for (let n = 0; n < lines.length; n += 1) {
    const line = lines[n];
    if (!line.startsWith("insert into ")) continue;
    const head = /^insert into (\S+) \(([^)]*)\) values \(/.exec(line);
    if (!head) {
      failures += 1;
      console.log(`  FAIL  line ${n + 1}: insert with an unrecognised shape`);
      continue;
    }
    /* The statement may span many lines (dollar-quoted prose contains newlines),
       so measure from the whole remaining text, not the line. */
    const offset = lines.slice(0, n).reduce((a, l) => a + l.length + 1, 0);
    const counted = countValues(sql, offset);
    if (!counted) {
      unterminated += 1;
      continue;
    }
    const tail = sql.slice(counted.end, counted.end + 40);
    stmts.push({
      table: head[1],
      columns: head[2].split(",").map((c) => c.trim()),
      line: n + 1,
      onConflict: /^\)\s*on conflict \(id\) do nothing;/.test(tail),
      valueCount: counted.count,
    });
  }

  check("every dollar-quoted literal is terminated", unterminated === 0, `${unterminated} unterminated`);
  check("statements parsed", stmts.length === 373, `${stmts.length} (expected 373)`);

  const byTable: Record<string, Stmt[]> = {};
  for (const s of stmts) (byTable[s.table] ??= []).push(s);

  console.log("\nROW COUNTS");
  for (const [table, want] of Object.entries(EXPECT)) {
    check(table, (byTable[table]?.length ?? 0) === want, `${byTable[table]?.length ?? 0} (expected ${want})`);
  }
  const unknown = Object.keys(byTable).filter((t) => !(t in EXPECT));
  check("no inserts into unexpected tables", unknown.length === 0, unknown.join(", ") || "none");

  console.log("\nPER-STATEMENT SHAPE");
  const arityMismatch = stmts.filter((s) => s.columns.length !== s.valueCount);
  check(
    "column count matches value count on every insert",
    arityMismatch.length === 0,
    arityMismatch.length ? `first at line ${arityMismatch[0].line} (${arityMismatch[0].table})` : "373/373",
  );
  const noGuard = stmts.filter((s) => !s.onConflict);
  check(
    "on conflict (id) do nothing on every insert",
    noGuard.length === 0,
    noGuard.length ? `${noGuard.length} missing, first at line ${noGuard[0].line}` : "373/373",
  );
  const missingFac = byTable["public.resources"]?.filter((s) => !s.columns.includes("focus_area_code")) ?? [];
  check(
    "every resources insert carries focus_area_code (M4)",
    missingFac.length === 0,
    missingFac.length ? `${missingFac.length} missing` : "297/297",
  );

  console.log("\nFOREIGN KEY ORDER (how a rollback fails at row 200)");
  const first = (t: string) => byTable[t]?.[0]?.line ?? Infinity;
  const last = (t: string) => byTable[t]?.[byTable[t].length - 1]?.line ?? -Infinity;
  check(
    "all elements inserted before the first topic (topics.element_id NOT NULL)",
    last("public.elements") < first("public.platform_topics"),
    `elements end ${last("public.elements")}, topics start ${first("public.platform_topics")}`,
  );
  check(
    "all groups inserted before the first topic (topics.group_id)",
    last("public.platform_groups") < first("public.platform_topics"),
    `groups end ${last("public.platform_groups")}, topics start ${first("public.platform_topics")}`,
  );
  check(
    "all elements inserted before the first resource (resources.element_id)",
    last("public.elements") < first("public.resources"),
    `elements end ${last("public.elements")}, resources start ${first("public.resources")}`,
  );

  console.log(`\n${checks} checks · ${failures === 0 ? "DOWN-MIGRATION STRUCTURALLY VALID" : `${failures} FAILURE(S)`}`);
  if (failures === 0 && !EXPECT_FAIL) {
    console.log("\n⚠️ Structure only. Executing the file end to end is the owner's step —");
    console.log("   see docs/ROLLBACK-RUNBOOK.md.");
  }
  /* --expect-fail inverts the exit code, for the corruption suite. */
  const good = EXPECT_FAIL ? failures > 0 : failures === 0;
  if (EXPECT_FAIL) console.log(good ? "\n(expected failures — the check works)" : "\n(NO failures — the check MISSED this)");
  process.exit(good ? 0 : 1);
}

main();
