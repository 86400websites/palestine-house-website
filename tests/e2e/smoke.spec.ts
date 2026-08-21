import { expect, test } from "@playwright/test";

/* SMOKE — the one test that proves the pipeline is alive end to end
   (SETUP-CHECKLIST Part 4): the homepage of the deployed Preview loads with
   no console errors. Runs at both repo-mandated viewports (desktop + 320px)
   via the two projects in playwright.config.ts.

   Tagged @morning: safe to repeat anywhere — it reads one public page and
   writes nothing. */

test("SMOKE-01 @morning: homepage loads with no console errors", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(String(error));
  });

  const response = await page.goto("/");
  expect(response, "the homepage did not respond").toBeTruthy();
  expect(response!.status(), "the homepage did not return HTTP 200").toBe(200);

  // The page actually rendered: the hero heading is visible.
  await expect(page.locator("h1").first()).toBeVisible();

  // No horizontal scroll — the 320px hard floor (DESIGN.md §10).
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow, "the page scrolls horizontally").toBe(false);

  expect(
    consoleErrors,
    `console errors on the homepage:\n${consoleErrors.join("\n")}`,
  ).toHaveLength(0);
});
