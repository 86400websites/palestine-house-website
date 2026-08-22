import { defineConfig } from "@playwright/test";

/* Playwright config — the Launch Gate harness (SYS2).
   docs/testing-setup/TESTING-GUIDE.md is the owner-facing contract;
   docs/testing-setup/SETUP-CHECKLIST.md Part 2 defines this file's shape.

   The suite targets a DEPLOYED Vercel Preview via PLAYWRIGHT_BASE_URL —
   never Production (docs/BROWSER-TOOLS.md §6). The only Production runs are
   the @morning specs, driven by .github/workflows/morning-check.yml once the
   owner switches it on.

   Env vars (names only — values live in .env.local / the runner env, never in
   git): PLAYWRIGHT_BASE_URL, VERCEL_AUTOMATION_BYPASS_SECRET (only if Vercel
   Preview protection is on), E2E_PENDING_PASSWORD, E2E_APPROVED_PASSWORD,
   E2E_ADMIN_PASSWORD. */

try {
  // Local runs keep secrets in the gitignored .env.local; CI supplies real env.
  process.loadEnvFile(".env.local");
} catch {
  /* no .env.local (e.g. CI) — the environment must already carry the vars */
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL;
if (!baseURL) {
  throw new Error(
    "PLAYWRIGHT_BASE_URL is not set. Point it at the deployed Vercel Preview " +
      "under test (see docs/testing-setup/SETUP-CHECKLIST.md Part 2). The " +
      "suite never invents a target and never defaults to Production.",
  );
}

/* Vercel deployment protection: when the owner has protection on, requests
   carry the sanctioned bypass header — the only allowed door
   (docs/testing-setup/SETUP-CHECKLIST.md Part 3). Referenced by NAME only. */
/* Header only — never x-vercel-set-bypass-cookie: that variant answers every
   request with a 307 cookie-setting hop to the SAME path, which poisons all
   redirect-location assertions (found the hard way on the first full run). */
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const extraHTTPHeaders = bypassSecret
  ? { "x-vercel-protection-bypass": bypassSecret }
  : undefined;

/* The two viewports this repo gates every page at: desktop and 320px —
   DESIGN.md §10 and QA-CHECKLIST.md "The two viewports". 320 is the hard
   floor ("verify every breakpoint from 320px up"); 1440 matches the desktop
   capture width in QA-CHECKLIST.md Part 2. */
const DESKTOP = { width: 1440, height: 900 };
const MOBILE_320 = { width: 320, height: 568 };

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  /* One retry everywhere: the target is a cold serverless Preview on a
     free-tier database — a single transient slow round-trip must not paint a
     working feature red. A genuine defect fails twice. */
  retries: 1,
  /* Evidence stays local and gitignored — never committed (activate-testing
     skill: "Never commit test artifacts"). */
  outputDir: "test-results",
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL,
    extraHTTPHeaders,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    /* One auth-setup step per role (SETUP-CHECKLIST Part 2): each signs in
       once through the real /login form and saves its session for the role
       specs to reuse. Anonymous needs no state. */
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      /* One sign-in at a time: three parallel logins contend on the
         free-tier test stack (cold serverless + free Supabase auth) and
         push past the timeout. Serial is reliable; speed is irrelevant here. */
      fullyParallel: false,
      use: { viewport: DESKTOP },
    },
    {
      name: "desktop",
      dependencies: ["setup"],
      testIgnore: /journeys\.spec\.ts/,
      use: { browserName: "chromium", viewport: DESKTOP },
    },
    {
      name: "mobile-320",
      dependencies: ["setup"],
      testIgnore: /journeys\.spec\.ts/,
      use: { browserName: "chromium", viewport: MOBILE_320, hasTouch: true },
    },
    /* The write journeys run ONCE, serially, after both viewport projects:
       they send the run's few marked-TEST emails and briefly mutate
       non-production data (draft toggle, robot applicant, test upload) that
       the read-only specs above must never race. */
    {
      name: "journeys",
      dependencies: ["desktop", "mobile-320"],
      testMatch: /journeys\.spec\.ts/,
      fullyParallel: false,
      /* NEVER retried: several journeys send a real email or mutate data —
         an automatic re-run means a duplicate submission (learned when a
         retry re-sent the contact email). A journey failure is investigated,
         not repeated. */
      retries: 0,
      use: { browserName: "chromium", viewport: DESKTOP },
    },
  ],
});
