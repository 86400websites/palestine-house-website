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
 * It acts ONLY on the 22 focus areas in `docs/content-v2-spec.json`, and every
 * one must resolve before anything changes. The old 33 are still in the database
 * and still Live until `0030` removes them; a cutover that reached them would
 * unpublish the entire platform partners are using today. So the target set is
 * an allow-list derived from the spec, never "everything", never a pattern, and
 * never a NOT-IN of the old slugs — an allow-list fails closed when the spec is
 * wrong, and the alternatives fail open.
 *
 * ⚠️ PP7 CHANGED TWO THINGS ABOUT THAT GUARD, both raised as blocking by the
 * independent review of 2026-08-16.
 *
 * 1. **IT WAS 22 SEPARATE CALLS.** The flip was a `for` loop issuing one
 *    `admin_set_platform_topic_published` per focus area. A failure at row 12
 *    left **11 Live and 11 Draft**, with no rollback and no record of which half
 *    had landed — a half-published platform in front of every approved partner,
 *    at the single most visible moment in the whole migration. It is now ONE
 *    call to `admin_cutover_focus_areas` (migration `0032`), which resolves all
 *    22 and flips them in a single UPDATE. All or none.
 *
 * 2. **IT RESOLVED ON SLUG ALONE.** The slug is the one field this schema
 *    deliberately lets drift: `admin_upsert_platform_topic` freezes it on update
 *    precisely so a rename cannot break a partner's bookmark. Identity is now
 *    the CODE, with slug and section checked against it — the same correction
 *    made to the loader (see `scripts/lib/identity.ts`).
 *
 * It still goes through the CMS's own RPC surface with the admin's own session.
 * Same reasoning as the loader: publication state must go through the audited
 * path, and a raw UPDATE would bypass whatever that path does now or grows
 * later.
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
 * TEST BY DEFAULT; production via `--target prod` (review round 4, H1 — the
 * runbook used to point at this script for production while it hard-refused
 * production). The shared mechanism in scripts/lib/connect.ts applies: PROD_*
 * variables by name with no fallback, exact host assertion, and a typed
 * confirmation that refuses when stdin is not a terminal. The owner runs it;
 * this engine writes to production through no channel.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseArgs } from "./lib/argv";
import { withSession } from "./lib/session";
import { confirmProduction, connectTarget, resolveTarget } from "./lib/connect";

const ROOT = process.cwd();
const SPEC = path.join(ROOT, "docs/content-v2-spec.json");

/* Strict: an unknown argument is an error, never a no-op (review 2026-08-16).
   `--target prod` added at review round 4 (H1): the production runbook told the
   owner to run this at step 5 while it hard-refused production — the flip would
   have gone to TEST with the operator believing otherwise. */
const ARGS = parseArgs(process.argv.slice(2), { flags: ["--dry-run"], options: ["--to", "--target"] });
const DRY_RUN = ARGS.has("--dry-run");
const TARGET = resolveTarget(ARGS.get("--target"));
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
  element_code: string;
  /* `admin_list_platform_topics` returns the group's SECTION slug ("setup"),
     not the group's own slug ("setup-focus-areas"). The RPC manifest needs the
     latter to join `platform_groups.slug`; this preflight checks the former.
     They are two different columns on the same row and confusing them is how a
     check silently passes on everything. */
  section_slug: string;
}


/** The manifest the RPC resolves against: code + slug + section, for all 22.
 *  Built from the spec, never typed, and every section must resolve — a spec
 *  whose `sectionSlug` does not name a real section would otherwise become a
 *  manifest entry with an undefined group and fail deep inside the database. */
interface ManifestEntry {
  code: string;
  slug: string;
  /** `platform_groups.slug`, e.g. "setup-focus-areas" — what the RPC joins on. */
  group_slug: string;
  /** `platform_groups.section_slug`, e.g. "setup" — what the preflight reads
   *  back, because that is the column `admin_list_platform_topics` returns. */
  section_slug: string;
}

function buildManifest(spec: ContentSpec): ManifestEntry[] {
  const groupOf = new Map(spec.sections.map((s) => [s.slug, s.groupSlug]));
  return spec.focusAreas.map((fa) => {
    const group_slug = groupOf.get(fa.sectionSlug);
    if (!group_slug) {
      throw new Error(`focus area ${fa.number} names section "${fa.sectionSlug}", which the spec does not define.`);
    }
    return { code: fa.number, slug: fa.slug, group_slug, section_slug: fa.sectionSlug };
  });
}

interface ContentSpec {
  sections: { slug: string; groupSlug: string }[];
  focusAreas: { number: string; slug: string; title: string; sectionSlug: string }[];
}

async function main(): Promise<void> {
  const spec = JSON.parse(await fs.readFile(SPEC, "utf8")) as ContentSpec;
  if (spec.focusAreas.length !== 22) {
    throw new Error(`spec should carry 22 focus areas, found ${spec.focusAreas.length}`);
  }
  const manifest = buildManifest(spec);

  console.log(`cutover — ${manifest.length} focus area(s) -> ${TO.toUpperCase()} — ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  const db = await connectTarget(TARGET);
  await withSession(db, () => run(db, manifest));
}

async function run(db: SupabaseClient, manifest: ManifestEntry[]): Promise<void> {
  const { data, error } = await db.rpc("admin_list_platform_topics");
  if (error) throw error;
  const all = (data as TopicRow[] | null) ?? [];

  /* PREFLIGHT, for the operator's benefit — the RPC re-resolves everything
     itself and is the authority. This exists so a dry run can show the plan, and
     so a drifted spec produces a readable message here rather than a database
     exception. Resolution is on CODE, then slug and section are checked against
     it: identity is the code, because the slug is the field the schema
     deliberately lets drift (see scripts/lib/identity.ts). */
  const byCode = new Map(all.map((t) => [t.element_code, t]));
  const targets: TopicRow[] = [];
  const problems: string[] = [];
  for (const m of manifest) {
    const row = byCode.get(m.code);
    if (!row) {
      problems.push(`${m.code} /${m.slug} — no focus area with that code`);
      continue;
    }
    if (row.slug !== m.slug) {
      problems.push(`${m.code} — database says /${row.slug}, spec says /${m.slug}`);
      continue;
    }
    if (row.section_slug !== m.section_slug) {
      problems.push(`${m.code} /${m.slug} — in section "${row.section_slug}", spec says "${m.section_slug}"`);
      continue;
    }
    targets.push(row);
  }
  if (problems.length) {
    throw new Error(
      `${problems.length} focus area(s) do not match the spec on code, slug AND section:\n  - ` +
        problems.join("\n  - ") +
        `\nNothing has been changed.`,
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

  /* Production only: the typed confirmation, after every refusal above has had
     its chance and before the one mutation. */
  await confirmProduction(TARGET, [
    `  action       flip ${toChange.length} focus area(s) to ${TO.toUpperCase()} (${alreadyThere.length} already there)`,
    `  mechanism    admin_cutover_focus_areas — ONE transaction, all or none`,
    `  legacy set   ${untouched} focus area(s), NOT touched`,
    `  reverse      pnpm exec tsx scripts/cutover.ts --to ${TO === "live" ? "draft" : "live"} --target prod`,
  ].join("\n"));

  /* ONE CALL. Not 22.
     The loop this replaces issued a separate RPC per focus area, so a failure at
     row 12 left 11 Live and 11 Draft with no rollback and no record of which
     half had landed — a half-published platform in front of every approved
     partner. `admin_cutover_focus_areas` (0032) resolves all 22 on code + slug +
     section, refuses unless every one resolves, and flips them in a single
     UPDATE. Raised as blocking by the independent review, 2026-08-16. */
  const { data: result, error: rpcErr } = await db.rpc("admin_cutover_focus_areas", {
    p_manifest: manifest,
    p_published: TARGET_PUBLISHED,
  });
  if (rpcErr) throw new Error(`cutover refused: ${rpcErr.message}`);
  const summary = ((result as { requested: number; changed: number; unchanged: number }[] | null) ?? [])[0];
  console.log(
    `\nRPC: requested ${summary?.requested}, changed ${summary?.changed}, already ${TO} ${summary?.unchanged}.`,
  );

  /* Read back rather than trust the write, and report the legacy set too so the
     "did this touch the live platform?" question is answered by evidence. */
  const { data: after, error: afterErr } = await db.rpc("admin_list_platform_topics");
  if (afterErr) throw afterErr;
  const rows = (after as TopicRow[] | null) ?? [];
  const newCodes = new Set(manifest.map((m) => m.code));
  const newRows = rows.filter((t) => newCodes.has(t.element_code));
  const legacyRows = rows.filter((t) => !newCodes.has(t.element_code));
  const wrong = newRows.filter((t) => t.published !== TARGET_PUBLISHED);
  if (wrong.length) {
    throw new Error(`${wrong.length} focus area(s) did not take the change: ${wrong.map((t) => t.slug).join(", ")}`);
  }
  if (newRows.length !== manifest.length) {
    throw new Error(`read back ${newRows.length} of the ${manifest.length} focus areas in the manifest`);
  }

  console.log(`all ${newRows.length} new focus areas are now ${TO.toUpperCase()}.`);
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
