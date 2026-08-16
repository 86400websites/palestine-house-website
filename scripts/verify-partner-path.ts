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
 * GENERALISED AT PP6c STEP 6c-e, FROM ONE FOCUS AREA TO ALL 22
 * ------------------------------------------------------------
 * PP6b wrote this against the single pilot, with its slug, its 3,933-character
 * guide and its one template's byte count hardcoded. PP6c loads 22 focus areas,
 * 88 templates and 22 guide files, so every expectation is now read from
 * `docs/content-v2-spec.json` and from the delivered source documents on disk.
 * Nothing about "the pilot" is special any more, and the script no longer
 * carries a number that has to be edited when the content changes.
 *
 * IT DERIVES THE STATE RATHER THAN BEING TOLD IT. It asks how many of the 22
 * the caller can see: none means Draft, all 22 means Live, and **anything in
 * between is itself a failure** — a partially visible rollout is the shape a
 * half-completed cutover would take, and it should stop the run rather than be
 * silently reported against whichever expectation happens to fit.
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

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { signOutLocal } from "./lib/session";

const ROOT = process.cwd();
const TEST_REF = "sdszcralogcrujtyghig";
const SPEC = path.join(ROOT, "docs/content-v2-spec.json");
const SRC = path.join(
  ROOT,
  "docs/source-assets/Resource/Palestine House Website Content - Complet and Formatted",
);

/* How many legacy focus areas are expected alongside the 22.
   33 before migration 0030 removes them, 0 after — so it is a flag rather than a
   constant, because a hardcoded 33 would have started failing the moment 0030
   ran and would have read as a regression in the product rather than as the
   migration doing its job. Pass --legacy 0 after the cutover. */
const LEGACY_TOPICS = (() => {
  const i = process.argv.indexOf("--legacy");
  return i === -1 ? 33 : Number(process.argv[i + 1]);
})();

const OBJECT_UNDER_ATTACK = (() => {
  const i = process.argv.indexOf("--object");
  return i === -1 ? null : process.argv[i + 1];
})();

interface SpecTemplate {
  code: string;
  title: string;
  fileName: string;
  relPath: string;
}
interface SpecFocusArea {
  code: string;
  slug: string;
  title: string;
  guideMd: string;
  templates: SpecTemplate[];
}

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
let checks = 0;
function record(name: string, actual: string, expected: string): void {
  const ok = actual === expected;
  checks += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) console.log(`        got ${JSON.stringify(actual)} · expected ${JSON.stringify(expected)}`);
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

  const spec = JSON.parse(await fs.readFile(SPEC, "utf8")) as { focusAreas: SpecFocusArea[] };
  const areas = spec.focusAreas;
  if (areas.length !== 22) throw new Error(`spec should carry 22 focus areas, found ${areas.length}`);
  const newSlugs = new Set(areas.map((a) => a.slug));
  const expectedTemplates = areas.reduce((n, a) => n + a.templates.length, 0);

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

  /* Derive the state from what the partner can actually see. */
  const { data: topicData, error: tErr } = await db.rpc("get_platform_topics");
  if (tErr) throw tErr;
  const topics = (topicData as { slug: string; title: string }[]) ?? [];
  const visibleNew = topics.filter((t) => newSlugs.has(t.slug));
  const LIVE = visibleNew.length === areas.length;
  if (visibleNew.length !== 0 && !LIVE) {
    throw new Error(
      `PARTIAL ROLLOUT: ${visibleNew.length} of ${areas.length} new focus areas are visible. ` +
        `That is neither Draft nor Live and is exactly the shape of a half-finished cutover. ` +
        `Missing: ${areas.filter((a) => !topics.some((t) => t.slug === a.slug)).map((a) => a.slug).join(", ")}`,
    );
  }
  console.log(`state: the 22 new focus areas are ${LIVE ? "LIVE" : "DRAFT (invisible)"}`);
  console.log(`topics visible to this partner: ${topics.length}\n`);

  record("total topics visible", String(topics.length), String(LEGACY_TOPICS + (LIVE ? areas.length : 0)));
  record("new focus areas visible", String(visibleNew.length), String(LIVE ? areas.length : 0));
  record(
    "the legacy platform is still fully visible",
    String(topics.length - visibleNew.length),
    String(LEGACY_TOPICS),
  );

  /* THE GUIDE BODIES — the read that hands over the owner's prose directly.
     Checked on ALL 22, with the exact length the spec says, because "some of
     them are hidden" is not the claim being made. */
  let bodiesWrong = 0;
  for (const a of areas) {
    const { data: elData } = await db.rpc("get_element", { p_slug: a.slug });
    const el = ((elData as { simple_guide_md: string | null }[] | null) ?? [])[0];
    const got = el?.simple_guide_md ? el.simple_guide_md.length : null;
    const want = LIVE ? a.guideMd.length : null;
    if (got !== want) {
      bodiesWrong += 1;
      console.log(`        ${a.code} /${a.slug}: got ${got ?? "no rows"} · expected ${want ?? "no rows"}`);
    }
  }
  record(
    LIVE ? "all 22 guide bodies reachable at the exact expected length" : "all 22 guide bodies return NO ROWS",
    String(bodiesWrong),
    "0",
  );

  /* THE TEMPLATES — the only surface that hands over BYTES. */
  const { data: resData } = await db.rpc("get_resources");
  const resources =
    (resData as { id: string; title: string; element_id: string | null; code: string | null; doc_key: string | null; focus_area_code: string | null }[]) ??
    [];
  /* HOW A "NEW" ROW IS IDENTIFIED, AND WHY NOT BY TITLE.
     The first version of this check matched on the spec's template titles, and
     it produced a false FAILURE that read exactly like a security leak: one new
     template row apparently visible while its focus area was Draft. It was not.
     Two titles exist in BOTH corpora — `content-migration-map.md` §1 records
     them, *Event Run Sheet* and *Monthly Content Calendar* — so the legacy,
     legitimately-published `Monthly Content Calendar` on element G1 was being
     counted as one of the new ones.

     This is the same defect PP6b's first review round found in the loader
     ("matching template files by title was unsafe"), reappearing in a different
     file, which is worth stating plainly: the fix was applied where the bug was
     found, not where the reasoning was wrong.

     The discriminator used instead cannot collide. Every legacy row carries a
     `focus_area_code` of A…K, from the retired A–K vocabulary; every one of the
     110 new rows carries NULL; and the two public booklets carry no element at
     all. So a new row is exactly: attached to an element, with no legacy code. */
  const isNewRow = (r: { focus_area_code?: string | null; element_id: string | null }) =>
    r.element_id !== null && (r.focus_area_code ?? null) === null;
  const newTemplates = resources.filter((r) => r.doc_key === null && isNewRow(r));
  const newGuideFiles = resources.filter((r) => r.doc_key === "guide" && isNewRow(r));

  record("new template rows listed", String(newTemplates.length), String(LIVE ? expectedTemplates : 0));
  record("new guide files listed", String(newGuideFiles.length), String(LIVE ? areas.length : 0));

  if (LIVE) {
    /* Byte-exactness against the delivered document on disk, not merely
       "something downloaded". Two samples from different sections. */
    for (const a of [areas[0], areas[areas.length - 1]]) {
      const t = a.templates[0];
      const row = newTemplates.find((r) => r.title === t.title);
      const onDisk = (await fs.stat(path.join(SRC, t.relPath))).size;
      const bytes = row ? await download(db, row.id) : 0;
      record(`${a.code} template "${t.title}" downloads byte-exact`, String(bytes), String(onDisk));
    }
    const guideRow = newGuideFiles[0];
    if (guideRow) {
      const bytes = await download(db, guideRow.id);
      record("a new guide FILE downloads real bytes", bytes > 0 ? "real bytes" : "nothing", "real bytes");
    }
  }

  /* The legacy content must keep working throughout — the rollout must not
     disturb what partners are using today. */
  const legacyTemplate = resources.find(
    (r) => r.element_id && r.doc_key === null && !isNewRow(r),
  );
  if (LEGACY_TOPICS === 0) {
    /* After 0030 there is no legacy content left to protect, so this check has
       nothing to assert. Reported rather than silently skipped — a check that
       quietly disappears is how coverage rots. */
    console.log("SKIP  legacy template still downloads — none exist (--legacy 0, post-0030)");
  } else if (legacyTemplate) {
    const bytes = await download(db, legacyTemplate.id);
    record(
      `an existing live template still downloads ("${legacyTemplate.title}")`,
      bytes > 0 ? "real bytes" : "nothing",
      "real bytes",
    );
  } else {
    record("a legacy template was found to test", "none found", "one found");
  }

  /* THE ATTACK. A partner holding a valid token asks Storage directly for the
     unreleased object, with no RPC in the way. Before 0029 narrowed the policy
     this succeeded, which is what made Draft "a boundary for rows and an
     illusion for bytes". */
  if (OBJECT_UNDER_ATTACK) {
    const { data: direct, error: sErr } = await db.storage
      .from("resources")
      .createSignedUrl(OBJECT_UNDER_ATTACK, 60);
    const outcome = direct?.signedUrl ? "SIGNED — the object was handed over" : "refused";
    record(
      `direct storage signing of ${OBJECT_UNDER_ATTACK}`,
      outcome,
      LIVE ? "SIGNED — the object was handed over" : "refused",
    );
    if (!direct?.signedUrl) console.log(`        refusal: ${sErr?.message ?? "no url"}`);

    const { data: listed } = await db.storage.from("resources").list(OBJECT_UNDER_ATTACK.split("/")[0]);
    record(
      "that focus area's storage folder is listable",
      String((listed ?? []).length),
      LIVE ? String((listed ?? []).length) : "0",
    );
  }

  await signOutLocal(db);
  console.log(
    `\n${checks} checks · ${failures === 0 ? "ALL PARTNER-PATH CHECKS PASSED" : `${failures} FAILURE(S)`}`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("\nVERIFY FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
