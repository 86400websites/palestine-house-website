import type { APIRequestContext, Browser, Locator, Page } from "@playwright/test";

/* Shared route maps and utilities for the Launch Gate suite. Route lists
   mirror docs/FEATURE-LIST.md (approved 2026-08-22, changed at CR1); if a route
   is added to the app, it gets a feature-list line first, then joins these
   lists. /terms left this one at CR1 and has its own line (PG-010). */

export const PUBLIC_ROUTES = [
  "/",
  "/model",
  "/experience",
  "/bring-ph",
  "/our-support",
  "/focus-areas",
  "/about",
  "/contact",
  "/apply",
  "/privacy",
] as const;

export const PLATFORM_ROUTES = [
  "/dashboard",
  "/setup",
  "/operate",
  "/program",
  "/support",
] as const;

export const SECTION_TOPIC_COUNTS: Record<string, number> = {
  "/setup": 5,
  "/operate": 6,
  "/program": 6,
  "/support": 5,
};

export const ADMIN_ROUTES = [
  "/admin",
  "/admin/approvals",
  "/admin/content",
  "/admin/content/pages",
  "/admin/content/focus-areas",
  "/admin/content/files",
  "/admin/content/admins",
] as const;

/* PG-005 — next.config.ts redirects: nine parents, four with children. */
export const RETIRED_PARENTS = [
  "/plan",
  "/build",
  "/food",
  "/programming",
  "/academy",
  "/tools",
  "/live",
  "/elements",
  "/resources",
] as const;
export const RETIRED_CHILD_SAMPLES = [
  "/live/123",
  "/elements/c2",
  "/resources/anything",
  "/academy/some-module",
] as const;

/* Admin page-owned labels (public knowledge — they appear in CLAUDE.md).
   Used to assert a denied response carries none of the page's own strings. Each page's
   heading ends in a full stop, so the bare word alone never matches a leaked heading:
   these are the words as they render. */
export const ADMIN_MARKERS = [
  "Approvals",
  "Approvals.",
  "Content admin.",
  "Pages.",
  "Focus areas",
  "Focus areas.",
  "Files",
  "Files.",
  "Admins",
  "Admins.",
] as const;

/* The two notices an unapproved account gets on /dashboard, the four section pages
   and every guide URL (PwPendingState). Public copy, and the leak-probe guard below
   needs them as well as the specs. */
export const PENDING_HEADING = "Your community access is being arranged.";
export const DECLINED_HEADING = "We cannot offer community access at the moment.";

/* Console capture with exactly one environmental exclusion: Vercel's
   Preview-only toolbar script being CSP-blocked by the site (see
   smoke.spec.ts for the rationale). */
export function attachConsoleCapture(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("vercel.live")) {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    errors.push(String(error));
  });
  return errors;
}

export async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
}

/* Request a path WITHOUT following redirects, so the denied response itself
   (status, Location, body) can be inspected — the "no gated string in the
   HTML or the RSC payload" checks live on this. */
export async function probe(
  request: APIRequestContext,
  path: string,
  headers?: Record<string, string>,
): Promise<{ status: number; location: string; body: string }> {
  let response = await request.get(path, { maxRedirects: 0, headers });
  /* Vercel's protection can answer some requests with a redirect-to-self hop
     that sets its bypass cookie. That hop is infrastructure, not the app —
     follow it exactly once so assertions see the app's own answer. */
  const location = response.headers()["location"] ?? "";
  if (
    response.status() >= 300 &&
    response.status() < 400 &&
    (location === path || location.endsWith(path))
  ) {
    response = await request.get(path, { maxRedirects: 0, headers });
  }
  return {
    status: response.status(),
    location: response.headers()["location"] ?? "",
    body: await response.text(),
  };
}

/* Open one focus area by its deep link. The ids are the card's deep-link contract
   (pw-topic-card.tsx), built from the slug, which the CMS can never change, so this
   survives a retitled card. It also proves hydration: only the mounted explorer can
   open the panel from the hash, so a click made after this returns reaches React. */
export async function openPanel(
  page: Page,
  section: string,
  slug: string,
): Promise<Locator> {
  await page.goto(`${section}#topic-${slug}`);
  const panel = page.locator(`#topic-${slug}-body`);
  // A streaming page can briefly hold a hidden copy under the same id (tests/e2e/README.md).
  await panel.filter({ visible: true }).waitFor({ state: "visible", timeout: 60_000 });
  return panel;
}

/* One named group inside a focus-area panel, open or closed: "Overview", "Simple
   Guide", "Templates" or the shared resources. The heading is matched exactly
   because a Simple Guide card's own title is a heading too. */
export function panelGroup(panel: Locator, heading: string): Locator {
  return panel.locator("section").filter({
    has: panel
      .page()
      .getByRole("heading", { name: heading, exact: true, includeHidden: true }),
  });
}

export type PlatformContent = {
  /* All /{section}/{topic}/guide hrefs, discovered as the approved robot. */
  guideLinks: string[];
  /* A handful of real topic titles (gated content), discovered at runtime —
     NEVER hardcoded, because this repo is public. Used only as leak probes:
     a denied response must not contain any of them. */
  gatedMarkers: string[];
};

let cached: PlatformContent | null = null;

/* Discover the gated surface as the approved robot. Cached per worker. */
export async function discoverPlatformContent(
  browser: Browser,
  baseURL: string,
): Promise<PlatformContent> {
  if (cached) return cached;
  const context = await browser.newContext({
    baseURL,
    storageState: "playwright/.auth/approved.json",
  });
  const page = await context.newPage();

  const guideLinks: string[] = [];
  for (const section of ["/setup", "/operate", "/program", "/support"]) {
    /* The section pages STREAM their topic cards — scraping at `load` races
       the content and reads an empty page (first-run lesson). Wait for the
       first guide link, retrying the navigation once on a transient failure. */
    let hrefs: string[] = [];
    for (let attempt = 0; attempt < 2 && hrefs.length === 0; attempt += 1) {
      try {
        await page.goto(section);
        /* state:"attached", NOT the visible default: the guide links live
           inside the topic cards' collapsed bodies (server-rendered, hidden
           until "Explore" opens them) — a visibility wait never resolves. */
        await page.waitForSelector('a[href$="/guide"]', {
          state: "attached",
          timeout: 45_000,
        });
        hrefs = await page.$$eval('a[href$="/guide"]', (as) =>
          as.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""),
        );
      } catch {
        hrefs = [];
      }
    }
    guideLinks.push(...hrefs.filter(Boolean));
  }

  const gatedMarkers: string[] = [];
  for (const link of guideLinks.filter((_, i) => i % 6 === 0).slice(0, 4)) {
    await page.goto(link);
    const h1 = (await page.locator("h1").first().textContent())?.trim();
    if (h1 && h1.length > 3) gatedMarkers.push(h1);
  }

  await context.close();

  /* The baseline IS the leak probe. An empty one makes every denied-state
     assertion vacuous; a GARBAGE one is worse, because it still passes.
     (D-SYS-1 review finding F5: a failed guide navigation lands on the
     branded 404, whose h1 is 22 chars long and would sail through a bare
     length check — after which every "no gated string leaked" check would be
     asserting that denied pages do not contain the 404 heading, which they
     never do.) Refuse anything that is not real, distinct gated content. */
  if (guideLinks.length !== 22) {
    throw new Error(
      `Discovery found ${guideLinks.length} guide links, expected 22. The ` +
        "baseline is not the real platform — refusing to run leak probes " +
        "against it. Check the approved robot and the Preview first. A focus " +
        "area a crashed J5 left in Draft shows here: restore it by hand, the " +
        "journeys that would restore it will not run.",
    );
  }
  /* Every heading a denied or failed guide navigation can land on. A guide URL
     answers these, so a stale list stops recognising a poisoned baseline: the h1 a
     pending session gets is "Welcome.", the notice under it is one of the two
     below, and a missing guide 404s inside the platform shell, which has its own
     wording. */
  const DENIAL_HEADINGS = [
    "This page isn’t here.",
    "That page doesn’t exist.",
    PENDING_HEADING,
    DECLINED_HEADING,
    "Welcome.",
  ];
  const poisoned = gatedMarkers.filter((m) => DENIAL_HEADINGS.includes(m));
  if (poisoned.length > 0) {
    throw new Error(
      `Discovery captured a denial/pending heading as a gated marker ` +
        `(${poisoned.length} of ${gatedMarkers.length}). The approved robot is ` +
        "not seeing real content — every leak probe built on this would pass " +
        "vacuously.",
    );
  }
  if (new Set(gatedMarkers).size < 3) {
    throw new Error(
      `Only ${new Set(gatedMarkers).size} distinct gated markers — the ` +
        "baseline is not real content. Refusing to run leak probes.",
    );
  }
  cached = { guideLinks: [...new Set(guideLinks)], gatedMarkers };
  return cached;
}

export function expectClean(errors: string[], where: string): void {
  if (errors.length > 0) {
    throw new Error(`console errors on ${where}:\n${errors.join("\n")}`);
  }
}
