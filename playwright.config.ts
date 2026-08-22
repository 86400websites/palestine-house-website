import { defineConfig, type Project } from "@playwright/test";

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

/* Nothing but the morning check may aim at Production, and "nothing" is
   enforced STRUCTURALLY, not by permission. The write journeys create
   accounts, draft focus areas, edit page copy, upload files and add admins —
   safe on the test database, catastrophic on the live one.

   The first version of this guard only *lifted the refusal* when
   MORNING_CHECK=1, which meant one environment variable admitted all 136
   tests (including the 9 write journeys) to the live site; the only thing
   left stopping them was that the robots do not exist in production, which
   the config's own comment admitted was luck. A post-merge audit reproduced
   it. Now: against a production host the config EXPORTS ONLY the two
   read-only morning projects, so the write journeys are not merely refused —
   they do not exist to be run. Provable: `--list` against a production URL
   returns 34, never 136. */
const PRODUCTION_HOSTS = [
  "palestine-house-website.vercel.app",
  "www.palestine-house.com",
  "palestine-house.com",
];
/* Vercel also serves the live app under generated aliases (…-git-main-….
   vercel.app). Treat any host that is not clearly a per-commit Preview as
   production-shaped: Preview deployments carry a per-deployment hash of the
   form `<project>-<hash>-<scope>.vercel.app`, while the git-branch aliases
   spell the branch out. Better to refuse a Preview by mistake (a loud,
   harmless error) than to admit the live site by mistake. */
const host = new URL(baseURL).host;
const isProductionTarget =
  PRODUCTION_HOSTS.includes(host) || /-git-[a-z0-9-]+-/.test(host);

if (isProductionTarget && process.env.MORNING_CHECK !== "1") {
  throw new Error(
    `REFUSING: PLAYWRIGHT_BASE_URL points at Production (${host}). ` +
      "Only the morning check may target the live site, and it is read-only " +
      "(docs/BROWSER-TOOLS.md §6). Point this at a deployed Preview.",
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

/* Every project this suite can run. Against a PRODUCTION target only the
   read-only `morning-*` pair is exported below — the write journeys are not
   refused at run time, they are absent. */
const ALL_PROJECTS: Project[] = [
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
    /* The morning check's own projects — deliberately WITHOUT the `setup`
       dependency, so the daily production run needs no robot credentials and
       creates no session at all (Option A). Selecting `desktop` would drag
       `setup` in with it; these two exist so the live run can stay
       credential-free. Used only by .github/workflows/morning-check.yml. */
    /* `grep` lives HERE, not only in the workflow's --grep flag: a project
       that merely *happens* to be invoked with the right flag is not a
       safety property. With it, these two can never schedule a credentialed
       spec however they are invoked, and the default full run stays
       deterministic. (Found by the D-SYS-1 independent review, which caught
       `pnpm run test:e2e` silently ballooning to 192 tests — ~90 of them
       credentialed specs in projects with no auth-setup dependency.) */
    {
      name: "morning-desktop",
      grep: /@morning/,
      testIgnore: /journeys\.spec\.ts/,
      use: { browserName: "chromium", viewport: DESKTOP },
    },
    {
      name: "morning-mobile",
      grep: /@morning/,
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
];

/* The structural half of the production guard (see PRODUCTION_HOSTS above).
   A guard that merely refuses can be argued past with one env var; a guard
   that removes the capability cannot. */
const PROJECTS = isProductionTarget
  ? ALL_PROJECTS.filter((project) => project.name?.startsWith("morning-"))
  : ALL_PROJECTS;

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
  projects: PROJECTS,
});
