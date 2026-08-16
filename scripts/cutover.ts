/**
 * scripts/cutover.ts — PP6c. THE DRAFT <-> LIVE SWITCH for the 22 new focus areas.
 *
 *   pnpm exec tsx scripts/cutover.ts --to live  --dry-run
 *   pnpm exec tsx scripts/cutover.ts --to live
 *   pnpm exec tsx scripts/cutover.ts --to draft        # the reverse, same command
 *
 * WHAT IT IS FOR
 * --------------
 * PP6c's exit gate asks that the cutover be "reversible in one statement". This
 * is that statement, in both directions, and the reverse is not a theoretical
 * escape hatch — it is exercised at 6c-d, before the forward flip has ever run,
 * to put the pilot back to Draft. A rollback path that has never been executed
 * is a hypothesis, and this sprint deletes production content on the strength
 * of it.
 *
 * THE ONE GUARD THAT MATTERS
 * --------------------------
 * It acts ONLY on the 22 focus-area slugs in `docs/content-v2-spec.json`, and it
 * asserts that it found all 22 before it changes anything. The old 33 are still
 * in the database and still Live until `0030` removes them; a cutover that
 * reached them would unpublish the entire platform that partners are using
 * today. So the target set is an allow-list derived from the spec, never
 * "everything", never a pattern, and never a NOT-IN of the old slugs — an
 * allow-list fails closed when the spec is wrong, and the alternatives fail
 * open.
 *
 * It drives `admin_set_platform_topic_published`, the CMS's own RPC, with the
 * admin's own session. Same reasoning as the loader: publication state is
 * exactly the kind of thing that must go through the audited path, and a raw
 * UPDATE would bypass whatever that RPC does now or grows later.
 *
 * THE BREAK-GLASS ROLLBACK, EXECUTED RATHER THAN DOCUMENTED
 * ---------------------------------------------------------
 * If the app, the CMS or this script is unavailable, one SQL statement takes
 * all 22 back to Draft:
 *
 *     update public.platform_topics t
 *     set published = false
 *     from public.platform_groups g
 *     where g.id = t.group_id
 *       and g.slug like '%-focus-areas';
 *
 * Verified on TEST at PP6c step 6c-f — actually run, not merely written down,
 * because a rollback nobody has executed is a hypothesis and this sprint
 * deletes production content on the strength of one. Result: 55 live -> 33 live
 * / 22 draft, the legacy 33 untouched, and **all 409 resource rows and 407
 * Storage objects still present** — the cutover hides content, it never
 * destroys it.
 *
 * ⚠️ The `like '%-focus-areas'` predicate was checked before being trusted: it
 * matches exactly the four new groups and **no legacy group** (the legacy ones
 * are `setup-toolkit`, `support-toolkit`, `run-the-house-day-to-day`, and so
 * on). Once `0030` has removed the legacy groups the predicate matches
 * everything, which is then still the correct meaning — roll the whole new
 * platform back — but it is worth knowing that its selectivity comes from a
 * naming convention rather than from a flag.
 *
 * TEST only — the host is asserted against the known TEST project ref before a
 * single request. Production is cut over by the owner, deliberately, by hand.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseArgs } from "./lib/argv";
import { withSession } from "./lib/session";

const ROOT = process.cwd();
const SPEC = path.join(ROOT, "docs/content-v2-spec.json");
const TEST_REF = "sdszcralogcrujtyghig";

/* Strict: an unknown argument is an error, never a no-op (review 2026-08-16). */
const ARGS = parseArgs(process.argv.slice(2), { flags: ["--dry-run"], options: ["--to"] });
const DRY_RUN = ARGS.has("--dry-run");
const TO = (() => {
  const v = ARGS.get("--to");
  if (v !== "live" && v !== "draft") {
    throw new Error('Pass --to live or --to draft (e.g. `--to live --dry-run`).');
  }
  return v;
})();
const TARGET_PUBLISHED = TO === "live";

interface TopicRow {
  id: string;
  slug: string;
  title: string;
  published: boolean;
}

async function connect(): Promise<SupabaseClient> {
  process.loadEnvFile(path.join(ROOT, ".env.local"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const email = process.env.TEST_PARTNER_EMAIL;
  const password = process.env.TEST_PARTNER_PASSWORD;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / _PUBLISHABLE_KEY in .env.local");
  if (!email || !password) throw new Error("Missing TEST_PARTNER_EMAIL / TEST_PARTNER_PASSWORD in .env.local");

  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== `${TEST_REF}.supabase.co`) {
    throw new Error(
      `Refusing to run against "${parsed.host}". This script targets the TEST project only ` +
        `(https://${TEST_REF}.supabase.co); production is cut over by the owner, by hand.`,
    );
  }
  console.log(`target: ${parsed.host} (TEST)`);

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed: ${error.message}`);
  const { data: isAdmin, error: adminErr } = await db.rpc("is_admin");
  if (adminErr) throw adminErr;
  if (isAdmin !== true) throw new Error("The signed-in account is not an admin on this project.");
  return db;
}

async function main(): Promise<void> {
  const spec = JSON.parse(await fs.readFile(SPEC, "utf8")) as {
    focusAreas: { number: string; slug: string; title: string }[];
  };
  const wanted = spec.focusAreas;
  if (wanted.length !== 22) throw new Error(`spec should carry 22 focus areas, found ${wanted.length}`);

  console.log(`PP6c cutover — ${wanted.length} focus area(s) -> ${TO.toUpperCase()} — ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  const db = await connect();
  await withSession(db, () => run(db, wanted));
}

async function run(
  db: SupabaseClient,
  wanted: { number: string; slug: string; title: string }[],
): Promise<void> {
  const { data, error } = await db.rpc("admin_list_platform_topics");
  if (error) throw error;
  const all = (data as TopicRow[] | null) ?? [];
  const bySlug = new Map(all.map((t) => [t.slug, t]));

  /* PREFLIGHT. Resolve every slug before touching one of them, so a spec that
     has drifted from the database stops the run instead of half-completing it. */
  const targets: TopicRow[] = [];
  const missing: string[] = [];
  for (const fa of wanted) {
    const row = bySlug.get(fa.slug);
    if (!row) missing.push(`${fa.number} /${fa.slug}`);
    else targets.push(row);
  }
  if (missing.length) {
    throw new Error(
      `${missing.length} focus area(s) from the spec are not in the database: ${missing.join(", ")}. ` +
        `Run the loader first. Nothing has been changed.`,
    );
  }

  const untouched = all.length - targets.length;
  const alreadyThere = targets.filter((t) => t.published === TARGET_PUBLISHED);
  const toChange = targets.filter((t) => t.published !== TARGET_PUBLISHED);

  console.log(
    `\n${all.length} focus area(s) in the database; ${targets.length} are the new IA, ` +
      `${untouched} are the legacy set and are NOT touched by this script.`,
  );
  console.log(`${alreadyThere.length} already ${TO}, ${toChange.length} to change.\n`);
  for (const t of toChange) console.log(`  ${t.published ? "LIVE " : "DRAFT"} -> ${TO.toUpperCase()}  /${t.slug}`);
  if (!toChange.length) console.log("  (nothing to do)");

  if (DRY_RUN) {
    console.log("\nDry run complete — nothing written.");
    return;
  }

  for (const t of toChange) {
    const { error: setErr } = await db.rpc("admin_set_platform_topic_published", {
      p_id: t.id,
      p_published: TARGET_PUBLISHED,
    });
    if (setErr) throw new Error(`set published on "${t.slug}": ${setErr.message}`);
  }

  /* Read back rather than trust the writes, and report the legacy set too so the
     "did this touch the live platform?" question is answered by evidence. */
  const { data: after, error: afterErr } = await db.rpc("admin_list_platform_topics");
  if (afterErr) throw afterErr;
  const rows = (after as TopicRow[] | null) ?? [];
  const newSlugs = new Set(wanted.map((f) => f.slug));
  const newRows = rows.filter((t) => newSlugs.has(t.slug));
  const legacyRows = rows.filter((t) => !newSlugs.has(t.slug));
  const wrong = newRows.filter((t) => t.published !== TARGET_PUBLISHED);
  if (wrong.length) {
    throw new Error(`${wrong.length} focus area(s) did not take the change: ${wrong.map((t) => t.slug).join(", ")}`);
  }

  console.log(`\nchanged ${toChange.length}; all ${newRows.length} new focus areas are now ${TO.toUpperCase()}.`);
  console.log(
    `legacy set unchanged: ${legacyRows.filter((t) => t.published).length} live / ` +
      `${legacyRows.filter((t) => !t.published).length} draft of ${legacyRows.length}.`,
  );
  console.log(`Reverse with: pnpm exec tsx scripts/cutover.ts --to ${TO === "live" ? "draft" : "live"}`);
}

main().catch((e) => {
  console.error("\nCUTOVER FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
