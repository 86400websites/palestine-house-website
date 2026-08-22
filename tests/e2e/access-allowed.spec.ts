import { expect, test } from "@playwright/test";
import {
  ADMIN_ROUTES,
  PLATFORM_ROUTES,
  SECTION_TOPIC_COUNTS,
  attachConsoleCapture,
  discoverPlatformContent,
  expectClean,
  hasHorizontalScroll,
  type PlatformContent,
} from "./helpers/app";
import { ROLES } from "./helpers/roles";

/* Sections B/C of docs/FEATURE-LIST.md — the ALLOWED half: the platform
   actually works for the people it exists for. */

let content: PlatformContent;

test.beforeAll(async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  content = await discoverPlatformContent(browser, baseURL!);
});

test.describe("as the pending partner", () => {
  test.use({ storageState: ROLES.pending.storageState });

  test("AC-005: /account is reachable while pending — the one deliberate exception", async ({
    page,
  }) => {
    const errors = attachConsoleCapture(page);
    await page.goto("/account");
    await expect(page.getByLabel("Display name")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Password" })).toBeVisible();
    // It exposes nothing beyond the caller's own account surface: no
    // focus-area content, no other person's email.
    const body = await page.content();
    for (const marker of content.gatedMarkers) {
      expect(body.includes(marker), "gated content on /account").toBe(false);
    }
    expectClean(errors, "/account (pending)");
  });
});

test.describe("as the approved partner", () => {
  test.use({ storageState: ROLES.approved.storageState });

  test("AC-007: the five platform pages render clean with real content", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    for (const path of PLATFORM_ROUTES) {
      const errors = attachConsoleCapture(page);
      const response = await page.goto(path);
      expect(response!.status(), `${path}`).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(await hasHorizontalScroll(page), `${path} scrolls sideways`).toBe(false);
      expectClean(errors, path);
    }
  });

  test("CT-001: the sections list 5 · 6 · 6 · 5 focus areas — 22 in all", async ({
    page,
  }) => {
    let total = 0;
    for (const [section, expected] of Object.entries(SECTION_TOPIC_COUNTS)) {
      await page.goto(section);
      // The cards stream in, and their guide links sit in collapsed bodies —
      // wait attached, then count UNIQUE guide targets (one per focus area).
      await page.waitForSelector('a[href$="/guide"]', {
        state: "attached",
        timeout: 60_000,
      });
      const unique = new Set(
        await page.$$eval('a[href$="/guide"]', (as) =>
          as.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""),
        ),
      );
      expect(unique.size, `${section} focus-area count`).toBe(expected);
      total += unique.size;
    }
    expect(total).toBe(22);
  });

  test("CT-002: a focus area shows exactly the private model", async ({
    page,
  }) => {
    await page.goto("/setup");
    await page.waitForSelector('a[href$="/guide"]', {
      state: "attached",
      timeout: 60_000,
    });
    // A topic card closed: summary + Explore + Watch Video. Opened with
    // Explore: the one Simple guide card (Read Now · Download Now) and the
    // templates below — the exact D-PP-f model.
    await expect(page.getByRole("button", { name: /^Explore/ }).first()).toBeVisible();
    await expect(page.getByText("Watch Video").first()).toBeVisible();
    await page.getByRole("button", { name: /^Explore/ }).first().click();
    await expect(page.getByRole("link", { name: /Read Now/ }).first()).toBeVisible({
      timeout: 20_000,
    });
    expect(await page.content()).toContain("Download Now");
    // And none of the retired card types exist in this model.
    for (const retired of ["Overview", "Checklist", "Watch out for"]) {
      expect(
        await page.getByRole("heading", { name: retired }).count(),
        `retired "${retired}" card rendered`,
      ).toBe(0);
    }
  });

  test("CT-003 / AC-007: every one of the 22 guide pages opens with content", async ({
    page,
  }) => {
    test.setTimeout(300_000);
    expect(content.guideLinks.length, "guide link count").toBe(22);
    for (const link of content.guideLinks) {
      const errors = attachConsoleCapture(page);
      const response = await page.goto(link);
      expect(response!.status(), link).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
      // The reader streams its body — let the page settle before measuring.
      await page.waitForLoadState("networkidle").catch(() => {});
      const text = await page.locator("main").innerText();
      expect(text.length, `${link} looks empty`).toBeGreaterThan(400);
      expectClean(errors, link);
    }
  });

  test("CT-004: a template downloads through a signed URL and the bytes arrive", async ({
    page,
  }) => {
    await page.goto("/setup");
    await page.waitForSelector('a[href$="/guide"]', {
      state: "attached",
      timeout: 60_000,
    });
    // Open the first focus area — the guide card lives in the expanded body.
    await page.getByRole("button", { name: /^Explore/ }).first().click();
    const download = page.getByRole("link", { name: /Download Now/ }).first();
    const button = page.getByRole("button", { name: /Download Now/ }).first();
    const control = (await download.count()) > 0 ? download : button;
    await expect(control).toBeVisible({ timeout: 20_000 });
    await control.scrollIntoViewIfNeeded();
    const waiting = page.waitForEvent("download", { timeout: 45_000 });
    await control.click();
    const file = await waiting;
    const path = await file.path();
    expect(path, "no file arrived").toBeTruthy();
    const { statSync } = await import("node:fs");
    expect(statSync(path!).size, "empty download").toBeGreaterThan(1_000);
  });

  test("CT-006: Ctrl/⌘+K search finds real content and navigates", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const input = page.getByPlaceholder(/Search focus areas/);
    await page.keyboard.press("ControlOrMeta+k");
    try {
      await expect(input).toBeVisible({ timeout: 5_000 });
    } catch {
      // A second Ctrl+K would TOGGLE a just-opened dialog shut — fall back to
      // the footer's real entry point instead.
      await page.getByRole("button", { name: "Search all resources" }).first().click();
      await expect(input).toBeVisible({ timeout: 15_000 });
    }
    const query = content.gatedMarkers[0].split(" ")[0];
    await input.fill(query);
    /* The overlay is a NATIVE <dialog> — implicit dialog role, no role
       attribute, so '[role="dialog"]' never matches it (first-run lesson).
       Results render inside .pw-search-results as links. */
    const results = page.locator("dialog.pw-overlay .pw-search-results a[href]");
    await expect(results.first()).toBeVisible({ timeout: 30_000 });
    const href = await results.first().getAttribute("href");
    await results.first().click();
    await page.waitForURL(`**${href}`);
  });

  test("PG-009 (signed in): the header offers Sign out", async ({ page }) => {
    await page.goto("/");
    await expect
      .poll(
        async () => page.$$eval("header", (els) =>
          els.map((el) => el.textContent ?? "").join(" "),
        ),
        { timeout: 15_000 },
      )
      .toContain("Sign out");
  });
});

test.describe("as the HQ admin", () => {
  test.use({ storageState: ROLES.admin.storageState });

  test("AC-008: every /admin route renders for the admin", async ({ page }) => {
    test.setTimeout(120_000);
    for (const path of ADMIN_ROUTES) {
      const errors = attachConsoleCapture(page);
      await page.goto(path);
      if (path === "/admin") {
        await page.waitForURL("**/admin/approvals");
      }
      await expect(page.locator("h1").first()).toBeVisible();
      expectClean(errors, path);
    }
  });
});
