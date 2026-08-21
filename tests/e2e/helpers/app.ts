import type { APIRequestContext, Browser, Page } from "@playwright/test";

/* Shared route maps and utilities for the Launch Gate suite. Route lists
   mirror docs/FEATURE-LIST.md (approved 2026-08-22); if a route is added to
   the app, it gets a feature-list line first, then joins these lists. */

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
  "/terms",
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
   Used to assert a denied response carries none of the page's own strings. */
export const ADMIN_MARKERS = [
  "Approvals",
  "Focus areas",
  "Files",
  "Admins",
] as const;

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
  if (guideLinks.length === 0 || gatedMarkers.length === 0) {
    throw new Error(
      "Discovery as the approved robot found no gated content — cannot run " +
        "leak probes against an empty baseline. Check the approved robot and " +
        "the Preview before trusting any denied-state result.",
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
