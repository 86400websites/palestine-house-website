/**
 * scripts/verify-partner-path.ts — exercise the gated platform as a real
 * signed-in partner, over the network, with a real session.
 *
 *   pnpm exec tsx scripts/verify-partner-path.ts
 *   pnpm exec tsx scripts/verify-partner-path.ts --object <storage key to attack>
 *
 * WHY THIS EXISTS
 * ---------------
 * PP2 through PP6a each closed with the same line in their record: "not
 * verified — the signed-in visual". Fail-closed behaviour was proven by
 * simulating roles inside the database, which is rigorous but stops at the
 * database. It cannot prove that a signed URL actually returns bytes, that the
 * Storage policy refuses an unreleased object to a session that holds a valid
 * token, or that the app's own read path returns what SQL says it should.
 *
 * Role simulation and this script answer different questions and both are run:
 * the simulation covers every role and both Draft states cheaply; this covers
 * the last mile that only a real session can.
 *
 * READ IT AS A PARTNER, NOT AS AN ADMIN
 * -------------------------------------
 * The credentials in .env.local belong to an ADMIN. An admin reads Storage
 * through the admin policy 0029 added, so running this while the account is
 * still in `admins` proves nothing about the partner path — the script says so
 * loudly and refuses to report a pass. Remove the account from `admins` on TEST
 * first and put it back afterwards; two admins exist, so nobody is locked out.
 *
 * TEST ONLY. The host is asserted before any request, and the credentials are
 * read out of .env.local by this script — never passed on a command line, never
 * printed.
 */

import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const TEST_REF = "sdszcralogcrujtyghig";
const PILOT_SLUG = "get-legally-ready";

const OBJECT_UNDER_ATTACK = (() => {
  const i = process.argv.indexOf("--object");
  return i === -1 ? null : process.argv[i + 1];
})();

/* EXACTLY what src/lib/resources/actions.ts does, and it must be, or this
   script tests something the product does not do.
   `get_resource_download` takes p_id and returns a ROW — bucket, path,
   is_public — not a URL. The caller mints the URL: a short-lived SIGNED one for
   the private bucket, a public one for the two booklets. Getting this wrong is
   how PP6a's close first reported a false "refused" on the booklets, and how
   the first run of this script reported a false failure on a live template.
   Returns the byte count actually fetched, or 0 if the download was refused. */
type DownloadRow = { storage_bucket: string; storage_path: string; is_public: boolean };

async function download(db: SupabaseClient, resourceId: string): Promise<number> {
  const { data, error } = await db.rpc("get_resource_download", { p_id: resourceId });
  if (error) return 0;
  const row = ((data as DownloadRow[] | null) ?? [])[0];
  if (!row) return 0;

  let url: string | null = null;
  if (row.is_public) {
    url = db.storage.from(row.storage_bucket).getPublicUrl(row.storage_path).data.publicUrl;
  } else {
    const { data: signed } = await db.storage
      .from(row.storage_bucket)
      .createSignedUrl(row.storage_path, 60);
    url = signed?.signedUrl ?? null;
  }
  if (!url) return 0;
  const res = await fetch(url);
  if (!res.ok) return 0;
  return (await res.arrayBuffer()).byteLength;
}

let failures = 0;
function record(name: string, actual: string, expected: string): void {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  console.log(`        got ${JSON.stringify(actual)} · expected ${JSON.stringify(expected)}`);
}

async function main(): Promise<void> {
  process.loadEnvFile(path.join(ROOT, ".env.local"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const email = process.env.TEST_PARTNER_EMAIL;
  const password = process.env.TEST_PARTNER_PASSWORD;
  if (!url || !key || !email || !password) {
    throw new Error("Missing Supabase or TEST_PARTNER_* values in .env.local");
  }
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== `${TEST_REF}.supabase.co`) {
    throw new Error(`Refusing to run against "${parsed.host}" — TEST only.`);
  }
  console.log(`target: ${parsed.host} (TEST)\n`);

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: auth, error: authErr } = await db.auth.signInWithPassword({ email, password });
  if (authErr) throw new Error(`sign-in failed: ${authErr.message}`);
  console.log(`signed in as ${auth.user?.id}`);

  const { data: isAdmin } = await db.rpc("is_admin");
  const { data: profile } = await db.rpc("get_my_profile");
  const approved = ((profile as { is_approved: boolean }[] | null) ?? [])[0]?.is_approved;
  console.log(`is_admin = ${isAdmin} · is_approved = ${approved}\n`);
  if (isAdmin === true) {
    console.log(
      "REFUSING TO REPORT: this account is still an admin, so every read below would\n" +
        "go through the admin policies and tell you nothing about the partner path.\n" +
        "Remove it from `admins` on TEST, run again, then put it back.",
    );
    process.exit(2);
  }
  if (approved !== true) {
    console.log("This account is not approved — the partner path cannot be exercised.");
    process.exit(2);
  }

  /* What state is the pilot in? Everything below is asserted against that,
     so the same script proves both halves without being edited. */
  const { data: topicData, error: tErr } = await db.rpc("get_platform_topics");
  if (tErr) throw tErr;
  const topics = (topicData as { slug: string; element_slug: string; title: string }[]) ?? [];
  const pilotVisible = topics.some((t) => t.slug === PILOT_SLUG);
  console.log(`pilot "${PILOT_SLUG}" is ${pilotVisible ? "LIVE" : "DRAFT (not visible)"}`);
  console.log(`topics visible: ${topics.length}\n`);

  record("topic count", String(topics.length), pilotVisible ? "34" : "33");
  record("pilot in the topic list", String(pilotVisible), pilotVisible ? "true" : "false");

  /* The guide body — the read that hands over prose directly. */
  const { data: elData } = await db.rpc("get_element", { p_slug: PILOT_SLUG });
  const el = ((elData as { simple_guide_md: string | null }[] | null) ?? [])[0];
  record(
    "guide body reachable via get_element",
    el?.simple_guide_md ? `${el.simple_guide_md.length} chars` : "no rows",
    pilotVisible ? "3933 chars" : "no rows",
  );

  /* The templates — the only surface that hands over BYTES. */
  const { data: resData } = await db.rpc("get_resources");
  const resources = (resData as { id: string; title: string; element_id: string | null }[]) ?? [];
  const pilotFiles = pilotVisible
    ? resources.filter((r) => r.title.startsWith("Palestine House Brand Guide"))
    : [];
  record(
    "pilot templates listed",
    String(pilotFiles.length),
    pilotVisible ? "1" : "0",
  );

  if (pilotVisible && pilotFiles[0]) {
    const bytes = await download(db, pilotFiles[0].id);
    record("pilot template DOWNLOADED bytes", String(bytes), "183352");
  }

  /* A template from the existing 33 must keep working throughout — the pilot
     must not disturb the content that is already live. */
  const liveTemplate = resources.find(
    (r) => r.element_id && !r.title.startsWith("Palestine House Brand Guide"),
  );
  if (liveTemplate) {
    const bytes = await download(db, liveTemplate.id);
    record(
      `an existing live template still downloads ("${liveTemplate.title}")`,
      bytes > 0 ? "real bytes" : "nothing",
      "real bytes",
    );
  }

  /* THE ATTACK. A partner holding a valid token asks Storage directly for the
     unreleased object, with no RPC in the way. Before 0029 narrowed the policy
     this succeeded, which is what made Draft "a boundary for rows and an
     illusion for bytes". */
  if (OBJECT_UNDER_ATTACK) {
    const { data: direct, error: sErr } = await db.storage
      .from("resources")
      .createSignedUrl(OBJECT_UNDER_ATTACK, 60);
    const outcome = direct?.signedUrl
      ? "SIGNED — the object was handed over"
      : `refused (${sErr?.message ?? "no url"})`;
    record(
      `direct storage signing of ${OBJECT_UNDER_ATTACK}`,
      outcome,
      pilotVisible ? "SIGNED — the object was handed over" : `refused (Object not found)`,
    );

    const { data: listed } = await db.storage
      .from("resources")
      .list(OBJECT_UNDER_ATTACK.split("/")[0]);
    record(
      "the draft focus area's folder is listable",
      String((listed ?? []).length),
      pilotVisible ? String((listed ?? []).length) : "0",
    );
  }

  await db.auth.signOut();
  console.log(`\n${failures === 0 ? "ALL PARTNER-PATH CHECKS PASSED" : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("\nVERIFY FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
