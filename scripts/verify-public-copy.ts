/**
 * scripts/verify-public-copy.ts — the website must say what the owner supplied, and
 * the numbers must be the real ones. PP7 built it (D-PP-a / D-PP-s); CR1 re-pointed
 * it at the supplied copy documents.
 *
 *   pnpm exec tsx scripts/verify-public-copy.ts
 *   pnpm exec tsx scripts/verify-public-copy.ts --without-delivery
 *
 * WHAT IT CHECKS
 * --------------
 *  1. Public_Website_Copy.docx, sections 1–9 and 12: the strings its labels designate
 *     as website copy appear in the code, word for word. Hand-applying a large document
 *     is exactly where a paraphrase or a missed block slips in. The document mixes copy
 *     with instructions, so this reads its labels ("Heading", "Body", "Card 1 - …") and
 *     skips the instruction ones ("Location", "Action"). Some skipped labels also carry
 *     copy, which UNDER_SKIPPED_LABELS asserts by name; a few low-risk ones ("Page
 *     label", "Provider name", footer link lines) are checked by neither. The match is
 *     across all the public files together, not page by page, because many strings sit
 *     on several pages; UNDER_SKIPPED_LABELS is per file.
 *  2. Privacy_Policy.md: the /privacy page says exactly the delivered policy.
 *  3. /focus-areas: each focus area's public one-liner is its private card summary,
 *     which is what stops the two drifting (the D-PP-s condition, now fed by
 *     Private_Website_Copy.docx through the private spec).
 *  4. The numbers: 4 · 22 · 83, and no surviving old band.
 *  5. Nothing central survives: no HQ, no Terms, no licensed operating system, on any
 *     public page or in the private shell's own strings.
 *
 * Checks 1–3 need the delivery, which is private and gitignored. `--without-delivery`
 * runs 4 and 5 alone, and its verdict says PARTIAL rather than that the copy matches.
 *
 * TYPOGRAPHIC QUOTES ARE NORMALISED, and that is the one licensed difference. The
 * pages use curly quotes as house style and JSX rejects bare apostrophes. Words may
 * not drift; glyphs may. Everything else is compared exactly.
 *
 * Offline. No network, no credentials, no database.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { parseArgs } from "./lib/argv";
import { COPY_ROOT, SPEC_PATH, TOPICS, type Cr1Spec } from "./lib/cr1";

interface Mammoth {
  convertToHtml(input: { path: string }): Promise<{ value: string }>;
}
const mammoth = createRequire(import.meta.url)("mammoth") as Mammoth;

const ARGS = parseArgs(process.argv.slice(2), { flags: ["--without-delivery"] });
const WITHOUT_DELIVERY = ARGS.has("--without-delivery");

const ROOT = process.cwd();
const src = (rel: string) => path.join(ROOT, "src", rel);

let checks = 0;
let failures = 0;

function check(label: string, ok: boolean, detail = ""): void {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

/** Curly → straight, entities → characters, whitespace collapsed. */
function normalise(s: string): string {
  return s
    .replace(/&rsquo;|&lsquo;|&apos;|&#39;|&#x27;|[‘’]/g, "'")
    .replace(/&ldquo;|&rdquo;|&quot;|[“”]/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripComments(s: string): string {
  return s
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

/** What a reader would see: comments out, JSX tags out, `{" "}` as a space. Inline
 *  tags vanish without a gap, so "Aswātna</a>, contact" stays one run of text. */
function visibleText(source: string): string {
  return normalise(
    stripComments(source)
      .replace(/\{\s*["'`]\s*["'`]\s*\}/g, " ")
      .replace(/<\/?[A-Za-z][^<>]*?>/g, ""),
    /* JSX drops a line break beside a tag, so "</a>\n, contact" renders with no gap. */
  ).replace(/ ([,.;:!?])/g, "$1");
}

/** Everything in a file that could reach a reader, including attribute values such
 *  as title="…" and plain strings, which visibleText's tag removal would lose. */
function allStrings(source: string): string {
  return `${normalise(stripComments(source))} ${visibleText(source)}`;
}

/* A listed path that has gone throws, and the run says it failed. Dropping it quietly
   would turn a renamed folder into a smaller scan that still passes. */
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(p) ? [p] : [];
  });
}

/* Every surface the public can read. */
const PUBLIC_FILES = [
  ...[
    "app/page.tsx", "app/layout.tsx", "app/manifest.ts", "app/opengraph-image.tsx",
    "app/not-found.tsx", "app/error.tsx", "app/global-error.tsx",
  ].map(src),
  ...[
    "model", "experience", "bring-ph", "our-support", "apply", "login", "contact", "privacy",
    "about", "focus-areas", "forgot-password", "update-password",
  ].flatMap((r) => walk(src(`app/${r}`))),
  ...walk(src("components/layout")),
  ...walk(src("components/sections")),
  src("lib/site.ts"),
  src("lib/auth/actions.ts"),
  src("lib/admin/actions.ts"),
  src("app/api/resend/contact/route.ts"),
  src("components/workspace-v2/pw-pending-state.tsx"),
];

/* The private shell's own strings. Topic text lives in the database. */
const PRIVATE_SHELL_FILES = [
  ...walk(src("app/(platform)")),
  ...walk(src("lib/workspace-v2")),
  ...walk(src("lib/account")),
  ...walk(src("lib/resources")),
  ...walk(src("components/workspace-v2")),
];

const read = (p: string) => readFileSync(p, "utf8");

// ---------------------------------------------------------------------------
// 1. The supplied document, against the code
// ---------------------------------------------------------------------------
type Block = { tag: string; html: string };

function blocksOf(html: string): Block[] {
  const out: Block[] = [];
  const re = /<(h[1-6]|p|ul|ol|table)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push({ tag: m[1], html: m[2] });
  return out;
}

const textOf = (html: string) => normalise(html.replace(/<[^>]+>/g, ""));

/* Labels the parser skips: their text is instructions for the implementer, or mixes
   instructions with copy. UNDER_SKIPPED_LABELS asserts the copy some of them carry. */
const INSTRUCTION_LABEL = /^(Current text to locate|Current block|Current labels|Current closing note|Location|Location anchor|Action|Image handling|Status and scope|Editorial basis|Model to communicate everywhere|Keep the existing website structure|Implementation distinction|Existing timeline link|Existing map link|Existing section link|Existing contact line|Page label|Provider name|Contact link|Form labels|Password-reset link|Replacement statistics|Bring a House|Explore|Account|Information|Contact|Replacement labels|Under-submit helper|Email subjects, for existing notification templates only)$/i;

/* Plain sentences that sit between copy blocks and instruct rather than publish. Each
   was read and judged; a new one must be added on purpose. */
const INSTRUCTION_SENTENCE = [
  "Do not retain claims about automatic stage tracking",
  "These resources already exist under private Setup",
  "Describe Aswātna's cultural role consistently",
  "Keep the actual copyright owner",
  "Keep links to the final Terms of Use",
  "Use access-confirmation language",
  "Do not promise that entries are preserved",
  "Link the existing contact text",
  "Link the email to mailto",
  "The existing form recipient must receive",
  "Keep the current form controls",
  "Replace the heading and body of all three",
  "Do not grant private access",
  "Remove the repeated hero helper",
  "Do not globally replace",
  "Replace Our Support with",
  /* The document makes these conditional, and the condition does not hold here. */
  "Request community access.", // 1.1: a nav helper "where the existing menu has one"; the Apply button has none
  "These are possibilities, not a required program.", // 2.4: "where the existing component supports it"; the gallery has no text slot
  "A little more information will help.", // 7.5: "only where this state exists"; it does not
  "Please respond to the specific question", // 7.5: the same state
].map(normalise);

function isInstruction(sentence: string): boolean {
  return INSTRUCTION_SENTENCE.some((p) => sentence.startsWith(p));
}

function designatedStrings(html: string): { section: string; text: string }[] {
  const out: { section: string; text: string }[] = [];
  let section = "";
  let inScope = false;
  let copyMode = false;

  const add = (text: string) => {
    const t = normalise(text);
    if (t && !isInstruction(t)) out.push({ section, text: t });
  };

  for (const b of blocksOf(html)) {
    if (/^h[1-6]$/.test(b.tag)) {
      const title = textOf(b.html);
      const n = title.match(/^(\d+)\.?\s/)?.[1];
      if (b.tag === "h1") {
        inScope = Boolean(n) && (Number(n) <= 9 || Number(n) === 12);
        /* 10 and 11 are the Terms and Privacy notes: overridden by the owner. */
      }
      section = title;
      copyMode = false;
      continue;
    }
    if (!inScope) continue;

    if (b.tag === "table") {
      /* Three tables carry copy. Header row first, so column positions are known. */
      const rows = [...b.html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((r) =>
        [...r[1].matchAll(/<t[dh]>([\s\S]*?)<\/t[dh]>/g)].map((c) => textOf(c[1])),
      );
      const head = rows[0] ?? [];
      const col = (name: string) => head.findIndex((h) => h === name);
      for (const row of rows.slice(1)) {
        if (col("Final label") >= 0) {
          add(row[col("Final label")]);
          if (!/Keep existing/.test(row[2] ?? "")) add(row[2] ?? "");
        } else if (col("Final visible copy") >= 0) {
          const value = row[col("Final visible copy")];
          if (!/^Retain the actual/.test(value)) add(value.replace(/\.\.\.$/, ""));
        } else if (col("Value") >= 0) {
          add(row[col("Value")]);
          add(row[col("Label")]);
        } else if (col("Title") >= 0) {
          add(row[col("Title")]);
          add(row[col("Description")]);
        }
      }
      continue;
    }

    if (b.tag === "ul" || b.tag === "ol") {
      if (!copyMode) continue;
      for (const li of b.html.matchAll(/<li>([\s\S]*?)<\/li>/g)) {
        const bold = li[1].match(/^<strong>([\s\S]*?)<\/strong>\s*-?\s*([\s\S]*)$/);
        if (bold) {
          add(textOf(bold[1]));
          add(textOf(bold[2]));
        } else {
          add(textOf(li[1]));
        }
      }
      continue;
    }

    const labelled = b.html.match(/^<strong>([\s\S]*?)<\/strong>\s*([\s\S]*)$/);
    if (labelled) {
      const label = textOf(labelled[1]).replace(/:$/, "");
      const rest = textOf(labelled[2]).replace(/^[:\s]+/, "");
      if (INSTRUCTION_LABEL.test(label)) {
        copyMode = false;
        continue;
      }
      /* "Card 1 - A place to gather" is a title carried in the label itself. */
      const cardTitle = label.match(/^(?:Card \d+|Column \d+|Milestone \d+|Note \d+ heading|Step \d+)\s*[-–]\s*(.+)$/);
      if (cardTitle) add(cardTitle[1]);
      if (rest) {
        /* "Apply to Join -> /apply | Explore the Community -> /our-support" */
        if (/->/.test(rest)) {
          for (const part of rest.split("|")) add(part.split("->")[0]);
        } else {
          /* "Button: Sign in." — the full stop ends the document's sentence. */
          add(/^Button/i.test(label) ? rest.replace(/\.$/, "") : rest);
        }
        copyMode = false;
      } else {
        copyMode = true;
      }
      continue;
    }
    if (copyMode && b.tag === "p") add(textOf(b.html));
  }
  return out;
}

/* Copy the document states under labels the parser has to skip, each asserted in its
   own file. All of it is public page text. */
const UNDER_SKIPPED_LABELS: [string, string][] = [
  ["app/page.tsx", "Explore the Model"],
  ["components/sections/home/home-hero.tsx", "Explore the Model"],
  ["app/bring-ph/page.tsx", "Ask a Question About Joining"],
  ["app/bring-ph/page.tsx", "Shared principles"],
  ["app/bring-ph/page.tsx", "A shared cultural purpose leaves room for local character"],
  ["app/bring-ph/page.tsx", "Your pace"],
  ["app/our-support/page.tsx", "Explore Local Opening Guidance"],
  ["app/our-support/page.tsx", "Your pace,"],
  ["app/our-support/page.tsx", "your local opening plan."],
  ["app/apply/page.tsx", "A question about joining? Contact us before applying if you need clarification."],
  ["components/sections/apply-form.tsx", "Submitting creates your account and requests community access. Your details will be used to handle your application and account. Please do not include sensitive personal information."],
  ["lib/auth/actions.ts", "Palestine House - Community application received"],
  ["lib/admin/actions.ts", "Palestine House - Your community access is ready"],
  ["components/sections/auth-forms.tsx", 'label="Email address"'],
  ["components/sections/auth-forms.tsx", 'label="Password"'],
  ["components/sections/contact-form.tsx", ">Your name<"],
  ["components/sections/contact-form.tsx", "Email address"],
  ["components/sections/contact-form.tsx", "Subject"],
  ["components/sections/contact-form.tsx", "Your message"],
  ["components/sections/contact-form.tsx", "Send Message"],
];

const DESIGNATED_STRINGS = 267;

async function checkPublicDocument(): Promise<void> {
  console.log("\nTHE SUPPLIED PUBLIC COPY IS ON THE PAGES, WORD FOR WORD");
  const docx = path.join(COPY_ROOT, "Public_Website_Copy.docx");
  const html = (await mammoth.convertToHtml({ path: docx })).value;
  const wanted = designatedStrings(html);
  const corpus = allStrings(PUBLIC_FILES.map(read).join("\n"));

  const missing = wanted.filter((w) => !corpus.includes(w.text));
  /* Pinned: a revised document the parser cannot read must not pass by finding less to
     check. A real change to the document is deliberate, and this number moves with it. */
  check(`${wanted.length} designated strings found in the code`, wanted.length === DESIGNATED_STRINGS && missing.length === 0, `${missing.length} missing, ${DESIGNATED_STRINGS} expected`);
  for (const m of missing.slice(0, 60)) {
    console.log(`        [${m.section.slice(0, 40)}] ${m.text.slice(0, 120)}`);
  }
  for (const [rel, text] of UNDER_SKIPPED_LABELS) {
    check(`${rel} says "${text.slice(0, 50)}"`, allStrings(read(src(rel))).includes(normalise(text)));
  }
}

// ---------------------------------------------------------------------------
// 2. Privacy
// ---------------------------------------------------------------------------
function checkPrivacy(): void {
  console.log("\nTHE PRIVACY PAGE IS THE DELIVERED POLICY");
  const md = read(path.join(COPY_ROOT, "Privacy_Policy.md"));
  const want = normalise(
    md
      .replace(/^#\s+.*$/m, "")
      .replace(/\*\*/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"),
  );
  const page = read(src("app/privacy/page.tsx"));
  const inner = page.slice(page.indexOf("<LegalLayout"), page.indexOf("</LegalLayout>"));
  const got = visibleText(inner.slice(inner.indexOf(">") + 1));
  check("every word of the policy, in order", got === want, got === want ? "" : `first difference near: ${firstDiff(got, want)}`);
  check('the title is the policy\'s own', /title="Privacy Policy"/.test(page));
  check('"86400 Studio" keeps its emphasis', /<strong>86400 Studio<\/strong>/.test(page));
  check("the contact form link works", /<Link href="\/contact">contact form<\/Link>/.test(page));
  const layout = read(src("components/sections/legal-layout.tsx"));
  check("no placeholder notice survives", !/placeholder|pending legal review/i.test(stripComments(layout)));
}

function firstDiff(a: string, b: string): string {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i += 1;
  return JSON.stringify(a.slice(Math.max(0, i - 20), i + 40));
}

// ---------------------------------------------------------------------------
// 3. /focus-areas
// ---------------------------------------------------------------------------
function checkFocusAreas(page: string): void {
  console.log("\nTHE 22 ONE-LINERS ARE THE PRIVATE CARD SUMMARIES");
  const spec = JSON.parse(read(SPEC_PATH)) as Cr1Spec;
  const pairs: [string, string][] = [];
  const re = /\[\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*,?\s*\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripComments(page))) !== null) {
    pairs.push([m[1].replace(/\\"/g, '"'), m[2].replace(/\\"/g, '"')]);
  }
  check("the page lists exactly 22 focus areas", pairs.length === TOPICS.length, `${pairs.length}`);

  const byTitle = new Map(spec.topics.map((t) => [normalise(t.title), t]));
  let misses = 0;
  for (const [title, summary] of pairs) {
    const t = byTitle.get(normalise(title));
    if (!t || normalise(summary) !== normalise(t.summary)) {
      misses += 1;
      console.log(`        drifted: "${title}"`);
    }
  }
  check("every title and one-liner matches the supplied copy", misses === 0, `${misses} drifted`);
  const onPage = new Set(pairs.map(([t]) => normalise(t)));
  const absent = spec.topics.filter((t) => !onPage.has(normalise(t.title)));
  check("no focus area is missing from the public map", absent.length === 0, absent.map((t) => t.number).join(", ") || "none");
}

// ---------------------------------------------------------------------------
// 4 and 5. Numbers and surviving claims. No delivery needed.
// ---------------------------------------------------------------------------
function checkNumbers(): void {
  console.log("\nTHE NUMBERS");
  for (const page of ["focus-areas", "bring-ph", "our-support"]) {
    const body = stripComments(read(src(`app/${page}/page.tsx`)));
    for (const [n, what] of [["4", "resource sections"], ["22", "focus areas"], ["83", "templates and practical tools"]]) {
      check(`/${page} states ${n} ${what}`, new RegExp(`n:\\s*"${n}",\\s*label:\\s*"${what}"`, "i").test(body));
    }
  }
}

const BANNED: [string, RegExp][] = [
  ["HQ", /\bHQ\b/],
  ["headquarters", /headquarters/i],
  ["the old 88", /\b88\b/],
  ["297", /\b297\b/],
  ["200+", /200\+/],
  ["eleven focus areas", /eleven focus/i],
  ["thirty-three", /thirty-three/i],
  ["the A–K vocabulary", /\bA[–-]K\b/],
  ["a 120-day launch", /120[- ]day/i],
  ["Terms of Use", /Terms of Use/i],
  ["a /terms link", /\/terms\b/],
  ["Apply to bring a House", /Apply to bring a House/i],
  ["Partner Platform", /Partner Platform/i],
  ["licensed operating system", /licen[cs]ed? (an )?operating system/i],
  ["a promised reply", /We['’]ll get back to you/i],
  ["Ask HQ", /Ask HQ/i],
];

function checkClaims(): void {
  console.log("\nNOTHING CENTRAL SURVIVES ON A PUBLIC PAGE");
  const pub = PUBLIC_FILES.map((p) => [path.relative(ROOT, p), allStrings(read(p))] as const);
  for (const [what, re] of BANNED) {
    const hits = pub.filter(([, text]) => re.test(text)).map(([file]) => file);
    check(`no "${what}"`, hits.length === 0, hits.join(", "));
  }

  console.log("\nNOR IN THE PRIVATE SHELL'S OWN STRINGS");
  const priv = PRIVATE_SHELL_FILES.map((p) => [path.relative(ROOT, p), allStrings(read(p))] as const);
  for (const [what, re] of BANNED) {
    const hits = priv.filter(([, text]) => re.test(text)).map(([file]) => file);
    check(`no "${what}"`, hits.length === 0, hits.join(", "));
  }

  console.log("\nTERMS IS GONE; COMMUNITY CONTACTS IS WHERE THE LINKS SAY");
  check("the /terms route no longer exists", !existsSync(src("app/terms")));
  check("/terms is out of the sitemap's route list", !/"\/terms"/.test(read(src("lib/site.ts"))));
  const contacts = read(src("components/workspace-v2/pw-community-contacts.tsx"));
  check('the block carries id="community-contacts"', /id="community-contacts"/.test(contacts));
  const footer = read(src("components/workspace-v2/pw-footer-actions.tsx"));
  check("the banner links to /support#community-contacts", /\/support#community-contacts/.test(footer));
}

// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  if (WITHOUT_DELIVERY) {
    console.log("--without-delivery: the document, Privacy and one-liner checks are NOT being run.");
  } else {
    if (!existsSync(COPY_ROOT) || !existsSync(SPEC_PATH)) {
      throw new Error(
        "The delivery or its private spec is not on disk. Run scripts/cr1-extract.ts, or pass --without-delivery to run only the checks that do not need it.",
      );
    }
    await checkPublicDocument();
    checkPrivacy();
    checkFocusAreas(read(src("app/focus-areas/page.tsx")));
  }

  checkNumbers();
  checkClaims();

  const verdict = failures
    ? `${failures} FAILURE(S)`
    : WITHOUT_DELIVERY
      ? "PARTIAL: numbers and surviving strings only. The document, Privacy and one-liner checks did NOT run."
      : "PUBLIC COPY MATCHES WHAT THE OWNER SUPPLIED";
  console.log(`\n${checks} checks · ${verdict}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("\nCHECK FAILED TO RUN:", e instanceof Error ? e.message : e);
  process.exit(2);
});
