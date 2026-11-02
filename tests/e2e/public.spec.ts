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
  test(`PG-001 @morning: ${route} renders clean`, async ({ page }) => {
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
  const fragments = new Map<string, string>();
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
        href.startsWith("tel:")
      ) {
        continue;
      }
      // A fragment must land on something, on this page or on the one it names.
      const [path, fragment] = href.split("#");
      if (fragment) fragments.set(`${path || route}#${fragment}`, route);
      if (!path || seen.has(path)) continue;
      seen.add(path);
      const res = await page.request.get(path, { maxRedirects: 5 });
      if (res.status() >= 400) broken.push(`${path} -> ${res.status()} (on ${route})`);
    }
  }
  for (const [target, route] of fragments) {
    const [path, fragment] = target.split("#");
    await page.goto(path);
    if ((await page.locator(`[id="${fragment}"]`).count()) === 0) {
      broken.push(`${target} has no such anchor (linked from ${route})`);
    }
  }
  expect(broken, `dead links:\n${broken.join("\n")}`).toHaveLength(0);
});

test("PG-003 @morning: a wrong URL shows the site's own 404 page", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-page-xyz");
  expect(response!.status()).toBe(404);
  await expect(page.locator("h1").first()).toContainText("This page isn’t here.");
  // Branded, not bare: the site chrome is present.
  await expect(
    page.getByRole("link", { name: /Palestine House/ }).first(),
  ).toBeVisible();
});

test("PG-004: header and footer are identical on every page", async ({
  page,
}) => {
  test.setTimeout(120_000);
  // Each link's words as well as its target: a relabelled chrome is a changed one.
  const shape = async (route: string) => {
    await page.goto(route);
    const nav = await page.$$eval("header a[href]", (as) =>
      as.map((a) => `${a.getAttribute("href")} ${a.textContent}`).sort(),
    );
    const footer = await page.$$eval("footer a[href]", (as) =>
      as.map((a) => `${a.getAttribute("href")} ${a.textContent}`).sort(),
    );
    return JSON.stringify({ nav, footer });
  };
  const reference = await shape("/");
  for (const route of PUBLIC_ROUTES.slice(1)) {
    expect(await shape(route), `chrome differs on ${route}`).toBe(reference);
  }
  // And the header says what CR1 says: "The Community" is the label, /our-support
  // stays the route. DOM-checked, so the 320px menu state does not matter; the
  // first text node is the label, the sr-only sub-label follows it.
  await page.goto("/");
  const main = await page.$$eval('header nav[aria-label="Main"] a', (as) =>
    as.map((a) => [a.firstChild?.textContent, a.getAttribute("href")]),
  );
  expect(main).toEqual([
    ["The Model", "/model"],
    ["Experience", "/experience"],
    ["Bring a House", "/bring-ph"],
    ["The Community", "/our-support"],
  ]);
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
  // Every page that states the numbers states today's: 4 · 22 · 83, each beside
  // its own label, in either order (the two strips put the label first in the DOM).
  // Case-insensitive, because innerText follows the labels' CSS. (The v3 home
  // deliberately carries no proof-number strip — first-run correction.)
  const beside = (n: string, label: string) =>
    new RegExp(`(?<!\\d)${n}\\s*${label}|${label}\\s*${n}(?!\\d)`, "i");
  for (const route of ["/focus-areas", "/our-support", "/bring-ph"]) {
    await page.goto(route);
    const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    expect(text, `${route} lacks the section count`).toMatch(
      beside("4", "resource sections"),
    );
    expect(text, `${route} lacks the focus-area count`).toMatch(
      beside("22", "focus areas"),
    );
    expect(text, `${route} lacks the template count`).toMatch(
      beside("83", "templates and practical tools"),
    );
  }
  // The retired bands appear nowhere on the public shell: the old IA's, and the
  // 88 that CR1 replaced.
  for (const route of PUBLIC_ROUTES) {
    await page.goto(route);
    const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    for (const retired of ["297", "33 topics", "11 focus areas", "200+"]) {
      expect(text, `${route} still shows retired number "${retired}"`).not.toContain(
        retired,
      );
    }
    expect(text, `${route} still shows the retired 88`).not.toMatch(/\b88\b/);
  }
});

test("PG-007: the Apply conversion is reachable from every page", async ({
  page,
}) => {
  test.setTimeout(120_000);
  for (const route of PUBLIC_ROUTES) {
    await page.goto(route);
    // The green Apply to Join button lives in the header on every page
    // (DOM-checked, so the 320px menu state does not matter).
    const applyLabels = await page.$$eval('header a[href="/apply"]', (as) =>
      as.map((a) => a.textContent?.trim()),
    );
    expect(applyLabels, `${route} header has no Apply to Join link`).toContain(
      "Apply to Join",
    );
    // The review promise and the old call to action left with CR1.
    const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    for (const retired of [
      "reviewed by HQ",
      "HQ reviews your application",
      "Apply to bring a House",
    ]) {
      expect(text, `${route} still says "${retired}"`).not.toContain(retired);
    }
  }
  // What an application is for replaced it: beside the call to action on the
  // pages that carry one, and in /apply's own approved copy.
  for (const route of ["/model", "/experience", "/bring-ph", "/about", "/focus-areas"]) {
    await page.goto(route);
    await expect(
      page.getByText("Apply for community access, not permission to operate a House.").first(),
      `${route} lacks the Apply helper`,
    ).toBeVisible();
  }
  await page.goto("/apply");
  await expect(
    page.getByText(/not an application for permission to open or operate a local House/).first(),
  ).toBeVisible();
});

test("PG-008 @morning: sitemap, robots and manifest resolve and expose only the public shell", async ({
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

test("PG-010: /terms is gone — the site's own 404, and no public page links to it or mentions it", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const response = await page.goto("/terms");
  expect(response!.status()).toBe(404);
  await expect(page.locator("h1").first()).toContainText("This page isn’t here.");
  await expect(
    page.getByRole("link", { name: /Palestine House/ }).first(),
  ).toBeVisible();

  // The sign-in pages wear the same chrome, so they count as public here. "usage
  // terms" on /model is an ordinary use of the word, not a mention of the page,
  // and the pattern lets it through on purpose.
  for (const route of [...PUBLIC_ROUTES, "/login", "/forgot-password"]) {
    await page.goto(route);
    const links = await page.$$eval('a[href*="terms" i]', (as) => as.length);
    expect(links, `${route} links to /terms`).toBe(0);
    const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    expect(text, `${route} mentions the Terms page`).not.toMatch(
      /\b(?:Terms|TERMS)\b|terms (?:of|and|&)/,
    );
  }
});

test("PG-011: /privacy shows the owner's policy and no placeholder notice", async ({
  page,
}) => {
  await page.goto("/privacy");
  await expect(page.locator("h1").first()).toHaveText("Privacy Policy");
  const policy = page.locator(".legal-body");
  await expect(policy).toContainText("86400 Studio");
  await expect(policy.getByRole("link", { name: "contact form" })).toHaveAttribute(
    "href",
    "/contact",
  );
  // The placeholder notice and the on-page contents list left with the old page.
  await expect(page.locator(".legal-note")).toHaveCount(0);
  await expect(page.locator(".legal-toc")).toHaveCount(0);
  const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  for (const retired of [
    "Placeholder, pending legal review",
    "On this page",
    "Your privacy, in plain words",
  ]) {
    expect(text, `/privacy still says "${retired}"`).not.toContain(retired);
  }
});
