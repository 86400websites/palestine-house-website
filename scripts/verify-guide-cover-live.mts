/**
 * scripts/verify-guide-cover-live.mts — A/B the cover strip against REAL bodies.
 *
 *   pnpm exec tsx scripts/verify-guide-cover-live.mts --baseline 8fbff9d
 *   pnpm exec tsx scripts/verify-guide-cover-live.mts            # current only
 *
 * scripts/verify-guide-cover.mts covers hand-written shapes. This covers the
 * two populations that actually exist, which is where every real defect in this
 * function has come from:
 *
 *   1. the LIVE guide bodies in the database — the content already shipped.
 *      With --baseline, the version at that git ref is run beside the working
 *      one and the outputs must be BYTE-IDENTICAL. That is the whole safety
 *      argument for changing this file: whatever it now does differently, it
 *      must do nothing differently to content partners are already reading.
 *   2. the DELIVERED .docx on disk — the content arriving. Every one must have
 *      its cover removed, and none may still open on cover matter.
 *
 * The two versions are called with DIFFERENT SIGNATURES on purpose, because
 * that is the change under test: the pre-PP6b function took (markdown, titles)
 * and the current one takes (markdown, titles, sectionLabel) — the label being
 * separated out after it was found deleting a legitimate heading when passed as
 * an ordinary title key (independent review, 2026-08-15).
 *
 * Reads .env.local itself and asserts the TEST host before any request; no
 * credential is printed or passed on a command line.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";
import { signOutLocal } from "./lib/session.js";
import { stripGuideCover as CURRENT } from "../src/lib/workspace-v2/guide-cover.ts";

const ROOT = process.cwd();
const TEST_REF = "sdszcralogcrujtyghig";
const SRC = path.join(
  ROOT,
  "docs/source-assets/Resource/Palestine House Website Content - Complet and Formatted",
);
const SECTION_LABEL: Record<string, string> = {
  setup: "Setup",
  operate: "Operate",
  program: "Program",
  support: "Support",
};

const BASELINE = (() => {
  const i = process.argv.indexOf("--baseline");
  return i === -1 ? null : process.argv[i + 1];
})();

const mammoth = createRequire(import.meta.url)("mammoth") as {
  convertToMarkdown(i: { path: string }): Promise<{ value: string }>;
};

let failures = 0;
function fail(message: string): void {
  failures += 1;
  console.log(`FAIL  ${message}`);
}

/* The pre-change signature. Typed separately so the difference is explicit
   rather than papered over with `any`. */
type Baseline = (m: string | null | undefined, titles: readonly string[]) => string;

async function loadBaseline(ref: string): Promise<Baseline> {
  const source = execFileSync(
    "git",
    ["show", `${ref}:src/lib/workspace-v2/guide-cover.ts`],
    { encoding: "utf8", cwd: ROOT, maxBuffer: 8 * 1024 * 1024 },
  );
  const file = path.join(
    await fs.mkdtemp(path.join(os.tmpdir(), "ph-cover-")),
    "baseline.mts",
  );
  await fs.writeFile(file, source, "utf8");
  const mod = (await import(pathToFileURL(file).href)) as {
    stripGuideCover: Baseline;
  };
  return mod.stripGuideCover;
}

const clean = (md: string) =>
  md
    .replace(/<a\b[^>]*>\s*<\/a>/gi, "")
    .replace(/\r\n/g, "\n")
    .replace(/\\([^\w\s])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const plain = (l: string) =>
  l.replace(/<a\b[^>]*>\s*<\/a>/gi, "").replace(/^#{1,6}\s*/, "").replace(/[*_`]/g, "").replace(/\s+/g, " ").trim();

async function main(): Promise<void> {
  const baseline = BASELINE ? await loadBaseline(BASELINE) : null;
  console.log(
    baseline
      ? `A/B: baseline ${BASELINE} vs the working tree`
      : "current version only (pass --baseline <ref> to A/B)",
  );

  // ---- population 1: the live bodies ----------------------------------------
  process.loadEnvFile(path.join(ROOT, ".env.local"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== `${TEST_REF}.supabase.co`) {
    throw new Error(`Refusing to run against "${parsed.host}" — TEST only.`);
  }
  const db = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
  const { error: authErr } = await db.auth.signInWithPassword({
    email: process.env.TEST_PARTNER_EMAIL!,
    password: process.env.TEST_PARTNER_PASSWORD!,
  });
  if (authErr) throw new Error(`sign-in failed: ${authErr.message}`);

  const { data: topics, error } = await db.rpc("get_platform_topics");
  if (error) throw error;
  const rows = (topics ?? []) as {
    title: string;
    element_slug: string;
    section_slug: string;
  }[];

  let identical = 0;
  let fired = 0;
  for (const r of rows) {
    const { data } = await db.rpc("get_element", { p_slug: r.element_slug });
    const el = ((data as { title: string; simple_guide_md: string | null }[]) ?? [])[0];
    const md = el?.simple_guide_md ?? "";
    const now = CURRENT(md, [r.title, el?.title ?? ""], SECTION_LABEL[r.section_slug]);
    if (now !== md) fired += 1;
    if (baseline) {
      const before = baseline(md, [r.title, el?.title ?? ""]);
      if (before === now) identical += 1;
      else fail(`LIVE ${r.element_slug}: baseline ${before.length} chars vs current ${now.length}`);
    }
  }
  await signOutLocal(db);
  console.log(
    `live bodies: ${rows.length} · strip fires on ${fired}` +
      (baseline ? ` · byte-identical to baseline on ${identical}/${rows.length}` : ""),
  );

  // ---- population 2: the delivered guides -----------------------------------
  const dirs = async (d: string) =>
    (await fs.readdir(d, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
  const files = async (d: string) =>
    (await fs.readdir(d, { withFileTypes: true })).filter((e) => e.isFile()).map((e) => e.name);
  const LABEL_BY_PREFIX: Record<string, string> = {
    "1": "Setup",
    "2": "Operate",
    "3": "Program",
    "4": "Support",
  };

  let delivered = 0;
  let deliveredFired = 0;
  for (const sec of (await dirs(SRC)).sort()) {
    const label = LABEL_BY_PREFIX[sec[0]];
    for (const fa of (await dirs(path.join(SRC, sec))).sort()) {
      const faDir = path.join(SRC, sec, fa);
      const gd = (await files(faDir)).find((f) => /simple\s*guide/i.test(f) && /\.docx$/i.test(f));
      if (!gd) continue;
      delivered += 1;
      const md = clean((await mammoth.convertToMarkdown({ path: path.join(faDir, gd) })).value);
      const lines = md.split("\n").map(plain).filter(Boolean);
      let end = 1;
      while (end < lines.length && !/simple\s*guide\s*$/i.test(lines[end])) end += 1;
      const title = lines
        .slice(1, end + 1)
        .join(" ")
        .replace(/\s*Simple Guide\s*$/i, "")
        .replace(/\s+/g, " ")
        .trim();

      const out = CURRENT(md, [title, title], label);
      if (out !== md) deliveredFired += 1;
      else fail(`DELIVERED ${fa}: the strip did not fire`);

      const head = plain(out.split("\n").filter((l) => l.trim())[0] ?? "");
      if (/^palestine house/i.test(head) || /simple guide$/i.test(head)) {
        fail(`DELIVERED ${fa}: still opens on cover matter -> ${JSON.stringify(head)}`);
      }
      /* Idempotence on real content, not only on the constructed case. */
      if (CURRENT(out, [title, title], label) !== out) {
        fail(`DELIVERED ${fa}: not idempotent`);
      }
    }
  }
  console.log(`delivered guides: ${delivered} · strip fires on ${deliveredFired}`);

  console.log(`\n${failures === 0 ? "A/B CLEAN" : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("\nVERIFY FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
