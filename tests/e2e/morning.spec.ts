import { expect, test } from "@playwright/test";
import { ADMIN_ROUTES, PLATFORM_ROUTES, probe } from "./helpers/app";

/* The morning check's own gate spec — the one that matters most on a live
   site and the reason the daily run exists at all: if the approval gate ever
   broke open, this is what says so before a partner (or a stranger) finds it.

   OPTION A, deliberately: logged out, read-only, ZERO credentials. It signs
   in as nobody, submits nothing, creates nothing, emails nobody — safe to
   run against Production every morning (BROWSER-TOOLS.md §6).

   The other @morning specs are tagged in place: PG-001 (every public page
   renders clean, both viewports), PG-003 (branded 404), PG-008 (sitemap /
   robots / manifest), PR-004 (the six security headers), SMOKE-01 (the
   homepage with no console errors). */

test("MORNING-01 @morning: the gate is still shut for a stranger", async ({
  request,
  page,
}) => {
  test.setTimeout(120_000);

  // Every gated and admin route: a signed-out visitor is sent to sign in,
  // and the response carries no platform shell.
  for (const path of [...PLATFORM_ROUTES, "/account", ...ADMIN_ROUTES]) {
    const { status, location, body } = await probe(request, path);
    if (status >= 300 && status < 400) {
      expect(location, `${path} redirect target`).toContain("/login");
    } else {
      expect(status, `${path} status for a stranger`).toBe(200);
      // "/login?next=", not "/login": the header's Sign in link would
      // satisfy the bare string on any page (D-SYS-1 finding F4).
      expect(
        body,
        `${path} carries no redirect instruction to the sign-in page`,
      ).toContain("/login?next=");
    }
    expect(
      body.includes("pw-topic-card") || body.includes('/guide"'),
      `${path} served platform content to a stranger`,
    ).toBe(false);
  }

  // Browser truth: typing the partner dashboard's URL lands on sign-in.
  await page.goto("/dashboard");
  await page.waitForURL(/\/login/, { timeout: 30_000 });
});

test("MORNING-02 @morning: the front door is open for business", async ({
  page,
}) => {
  // The conversion path a real visitor uses: home → Apply, form present.
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.goto("/apply");
  await expect(page.getByLabel("Your name")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  // Nothing is submitted — this is a live site.
});
