import { expect, test } from "@playwright/test";
import {
  PUBLIC_ROUTES,
  RETIRED_CHILD_SAMPLES,
  RETIRED_PARENTS,
  attachConsoleCapture,
  expectClean,
  hasHorizontalScroll,
  probe,
} from "./helpers/app";

/* Section A of docs/FEATURE-LIST.md — the public shell. */

for (const route of PUBLIC_ROUTES) {
  test(`PG-001: ${route} renders clean`, async ({ page }) => {
    const errors = attachConsoleCapture(page);
    const response = await page.goto(route);
    expect(response!.status(), `${route} did not return 200`).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(await hasHorizontalScroll(page), "horizontal scroll").toBe(false);
    expectClean(errors, route);
  });
}

test("PG-002: every same-origin link on every public page resolves", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const seen = new Set<string>();
  const broken: string[] = [];
  for (const route of PUBLIC_ROUTES) {
    await page.goto(route);
    const hrefs = await page.$$eval("a[href]", (as) =>
      as.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""),
    );
    for (const href of hrefs) {
      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#")
      ) {
        continue;
      }
      const path = href.split("#")[0];
      if (!path || seen.has(path)) continue;
      seen.add(path);
      const res = await page.request.get(path, { maxRedirects: 5 });
      if (res.status() >= 400) broken.push(`${path} -> ${res.status()} (on ${route})`);
    }
  }
  expect(broken, `dead links:\n${broken.join("\n")}`).toHaveLength(0);
});

test("PG-003: a wrong URL shows the site's own 404 page", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-page-xyz");
  expect(response!.status()).toBe(404);
  await expect(page.locator("h1")).toContainText("This page isn’t here.");
  // Branded, not bare: the site chrome is present.
  await expect(
    page.getByRole("link", { name: /Palestine House/ }).first(),
  ).toBeVisible();
});

test("PG-004: header and footer are identical on every page", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const shape = async (route: string) => {
    await page.goto(route);
    const nav = await page.$$eval("header a[href]", (as) =>
      as.map((a) => (a as HTMLAnchorElement).getAttribute("href")).sort(),
    );
    const footer = await page.$$eval("footer a[href]", (as) =>
      as.map((a) => (a as HTMLAnchorElement).getAttribute("href")).sort(),
    );
    return JSON.stringify({ nav, footer });
  };
  const reference = await shape("/");
  for (const route of PUBLIC_ROUTES.slice(1)) {
    expect(await shape(route), `chrome differs on ${route}`).toBe(reference);
  }
});

test("PG-005: the retired workspace paths 307 to /dashboard", async ({
  request,
}) => {
  for (const path of [...RETIRED_PARENTS, ...RETIRED_CHILD_SAMPLES]) {
    const { status, location } = await probe(request, path);
    expect(status, `${path} status`).toBe(307);
    expect(location, `${path} target`).toContain("/dashboard");
  }
});

test("PG-006: the proof numbers are consistent and the retired ones are gone", async ({
  page,
}) => {
  test.setTimeout(120_000);
  // The pages that state the numbers state today's: 4 · 22 · 88.
  for (const route of ["/", "/focus-areas"]) {
    await page.goto(route);
    const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    expect(text, `${route} lacks the focus-area count`).toContain("22");
    expect(text, `${route} lacks the template count`).toContain("88");
  }
  // The retired band appears nowhere on the public shell.
  for (const route of PUBLIC_ROUTES) {
    await page.goto(route);
    const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    for (const retired of ["297", "33 topics", "11 focus areas", "200+"]) {
      expect(text, `${route} still shows retired number "${retired}"`).not.toContain(
        retired,
      );
    }
  }
});

test("PG-007: the Apply conversion is reachable from every page", async ({
  page,
}) => {
  test.setTimeout(120_000);
  for (const route of PUBLIC_ROUTES) {
    await page.goto(route);
    // The green Apply button lives in the header on every page (DOM-checked,
    // so the 320px menu state does not matter).
    const applyHrefs = await page.$$eval('header a[href="/apply"]', (as) => as.length);
    expect(applyHrefs, `${route} header has no Apply link`).toBeGreaterThan(0);
  }
  await page.goto("/apply");
  await expect(
    page.getByText("Every application is reviewed by HQ."),
  ).toBeVisible();
});

test("PG-008: sitemap, robots and manifest resolve and expose only the public shell", async ({
  request,
}) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    new URL(m[1]).pathname,
  );
  expect(locs.length).toBeGreaterThan(0);
  for (const path of locs) {
    expect(
      (PUBLIC_ROUTES as readonly string[]).includes(path),
      `sitemap lists a non-public path: ${path}`,
    ).toBe(true);
  }
  expect((await request.get("/robots.txt")).status()).toBe(200);
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  expect(await manifest.json()).toHaveProperty("name");
});

test("PG-009: a signed-out visitor sees Sign in", async ({ page }) => {
  await page.goto("/");
  const signIn = await page.$$eval('header a[href="/login"]', (as) => as.length);
  expect(signIn, "no Sign in link in the header").toBeGreaterThan(0);
});
