/**
 * scripts/verify-cutover-rpc.ts — PP7 step 7-g.
 * Watches `admin_cutover_focus_areas` (0032) REFUSE, against the live database.
 *
 *   pnpm exec tsx scripts/verify-cutover-rpc.ts
 *
 * The RPC is what makes the cutover atomic — the moment the owner's 22 focus
 * areas become visible to every approved partner. Its predecessor was a loop of
 * 22 separate calls that could leave 11 Live and 11 Draft.
 *
 * Every case below is a manifest the RPC must REJECT, and each is driven through
 * a real admin session against TEST. A refusal changes nothing by definition, so
 * none of them can damage the database — but the last case proves that claim by
 * reading the publication state back afterwards rather than asserting it.
 *
 * TEST only.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { withSession } from "./lib/session";

const ROOT = process.cwd();
const SPEC = path.join(ROOT, "docs/content-v2-spec.json");
const TEST_REF = "sdszcralogcrujtyghig";

let checks = 0;
let failures = 0;

interface Entry {
  code: string;
  slug: string;
  group_slug: string;
}

async function connect(): Promise<SupabaseClient> {
  process.loadEnvFile(path.join(ROOT, ".env.local"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== `${TEST_REF}.supabase.co`) {
    throw new Error(`Refusing to run against "${parsed.host}" — TEST only.`);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.auth.signInWithPassword({
    email: process.env.TEST_PARTNER_EMAIL!,
    password: process.env.TEST_PARTNER_PASSWORD!,
  });
  if (error) throw new Error(`sign-in failed: ${error.message}`);
  const { data: isAdmin } = await db.rpc("is_admin");
  if (isAdmin !== true) throw new Error("The signed-in account is not an admin on TEST.");
  console.log(`target: ${parsed.host} (TEST), signed in as admin\n`);
  return db;
}

async function refuses(
  db: SupabaseClient,
  label: string,
  manifest: unknown,
  published: boolean,
  mustMention: string,
): Promise<void> {
  checks += 1;
  const { error } = await db.rpc("admin_cutover_focus_areas", {
    p_manifest: manifest,
    p_published: published,
  });
  if (!error) {
    failures += 1;
    console.log(`  FAIL  ${label} — it ACCEPTED this and changed publication state`);
    return;
  }
  if (!error.message.toLowerCase().includes(mustMention.toLowerCase())) {
    failures += 1;
    console.log(`  FAIL  ${label} — refused for the wrong reason: ${error.message.slice(0, 110)}`);
    return;
  }
  console.log(`  PASS  ${label} — refused`);
}

async function main(): Promise<void> {
  const spec = JSON.parse(await fs.readFile(SPEC, "utf8")) as {
    sections: { slug: string; groupSlug: string }[];
    focusAreas: { number: string; slug: string; sectionSlug: string }[];
  };
  const groupOf = new Map(spec.sections.map((s) => [s.slug, s.groupSlug]));
  const REAL: Entry[] = spec.focusAreas.map((f) => ({
    code: f.number,
    slug: f.slug,
    group_slug: groupOf.get(f.sectionSlug)!,
  }));

  const db = await connect();
  await withSession(db, () => run(db, REAL));
}

async function run(db: SupabaseClient, REAL: Entry[]): Promise<void> {
  const before = await publishedCount(db);
  console.log(`publication state before: ${before.live} live / ${before.draft} draft\n`);
  console.log("REFUSALS — every one of these must change nothing");

  /* The shape the old slug-only guard would have accepted: right slug, right
     section, WRONG code. Identity is the code. */
  await refuses(
    db,
    "one entry's code does not match its slug",
    REAL.map((e, i) => (i === 0 ? { ...e, code: "9.9" } : e)),
    true,
    "did not match",
  );

  /* A renamed focus area — the M2 shape, now also closed here. */
  await refuses(
    db,
    "one entry's slug has been renamed",
    REAL.map((e, i) => (i === 1 ? { ...e, slug: `${e.slug}-renamed` } : e)),
    true,
    "did not match",
  );

  /* Right code, right slug, wrong section: two of three is not a match. */
  await refuses(
    db,
    "one entry names the wrong section",
    REAL.map((e, i) => (i === 2 ? { ...e, group_slug: "operate-focus-areas" } : e)),
    true,
    "did not match",
  );

  await refuses(db, "a duplicated code", [...REAL, REAL[0]], true, "duplicate");
  await refuses(db, "an empty manifest", [], true, "non-empty");
  await refuses(db, "a null manifest", null, true, "non-empty");
  await refuses(db, "a manifest that is not an array", { code: "1.1" }, true, "non-empty");
  await refuses(
    db,
    "an entry missing group_slug",
    REAL.map((e, i) => (i === 3 ? { code: e.code, slug: e.slug } : e)),
    true,
    "needs code, slug and group_slug",
  );
  await refuses(db, "p_published null", REAL, null as unknown as boolean, "must be true or false");

  console.log("\nAND THE STATE IS UNCHANGED");
  const after = await publishedCount(db);
  checks += 1;
  if (after.live === before.live && after.draft === before.draft) {
    console.log(`  PASS  still ${after.live} live / ${after.draft} draft — nine refusals wrote nothing`);
  } else {
    failures += 1;
    console.log(`  FAIL  state moved: ${before.live}/${before.draft} -> ${after.live}/${after.draft}`);
  }

  console.log(`\n${checks} checks · ${failures === 0 ? "ALL CUTOVER-RPC CHECKS PASSED" : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

async function publishedCount(db: SupabaseClient): Promise<{ live: number; draft: number }> {
  const { data, error } = await db.rpc("admin_list_platform_topics");
  if (error) throw error;
  const rows = (data as { published: boolean }[] | null) ?? [];
  return {
    live: rows.filter((r) => r.published).length,
    draft: rows.filter((r) => !r.published).length,
  };
}

main().catch((e) => {
  console.error("\nVERIFY FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
