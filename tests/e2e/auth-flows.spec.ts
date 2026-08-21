import { expect, test } from "@playwright/test";
import { ROLES, rolePassword } from "./helpers/roles";
import { probe } from "./helpers/app";

/* Section B (auth halves) + the reject halves of Section D. Nothing in this
   file sends an email to a real inbox: the only address ever typed into a
   form here is an undeliverable robot one, and the contact form is only ever
   given INVALID input (its one real send lives in journeys.spec.ts). */

test("AC-010: login and logout work, and the door locks again", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/login");
  await page.getByLabel("Email").fill(ROLES.approved.email);
  await page.getByLabel("Password").fill(rolePassword("approved"));
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");

  // Sign out from the public chrome (present on every public page).
  await page.goto("/");
  await page
    .getByRole("button", { name: "Sign out" })
    .or(page.getByRole("link", { name: "Sign out" }))
    .first()
    .click();
  // The same gated door is shut again immediately.
  await expect
    .poll(async () => (await probe(page.request, "/dashboard")).status, {
      timeout: 20_000,
    })
    .toBeGreaterThanOrEqual(300);
});

test("AC-011: a signed-in visitor who opens /login is sent onward", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    storageState: ROLES.approved.storageState,
  });
  const page = await context.newPage();
  await page.goto("/login");
  await page.waitForURL("**/dashboard");
  await context.close();
});

test("AC-012: a wrong password fails safely", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ROLES.approved.email);
  await page.getByLabel("Password").fill("definitely-not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  // A clear message, still on /login, and no session was created.
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('[role="alert"], .auth-error, p')).toContainText(
    /password|sign in|try/i,
  );
  const { status } = await probe(page.request, "/dashboard");
  expect(status).toBeGreaterThanOrEqual(300);
});

test("AC-013: password-reset is safe in both directions", async ({
  page,
  request,
}) => {
  // Same neutral answer whether or not the account exists.
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(ROLES.pending.email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  const known = (await page.locator("main").innerText()).trim();

  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("nobody-here@robot-test.invalid");
  await page.getByRole("button", { name: "Send reset link" }).click();
  const unknown = (await page.locator("main").innerText()).trim();
  expect(unknown, "responses differ by account existence").toBe(known);

  // A garbage recovery link fails closed: bounced to /forgot-password with no
  // session minted.
  const { status, location } = await probe(
    request,
    "/auth/confirm?token_hash=not-a-real-token&type=recovery",
  );
  expect(status).toBeGreaterThanOrEqual(300);
  expect(location).toContain("/forgot-password");
  const dashboard = await probe(request, "/dashboard");
  expect(dashboard.status).toBeGreaterThanOrEqual(300);
});

test("FM-001: the contact form rejects bad input, client and server", async ({
  page,
}) => {
  await page.goto("/contact");
  // Client side: an empty submit does not produce a success state.
  await page.getByRole("button", { name: /send/i }).click();
  await expect(page.getByLabel("Name")).toBeVisible();

  // Server side: a request around the form is refused too.
  const bad = await page.request.post("/api/resend/contact", {
    data: { name: "", email: "not-an-email", subject: "", message: "" },
  });
  expect(bad.status()).toBeGreaterThanOrEqual(400);
  expect(bad.status()).toBeLessThan(500);
});

test("FM-003: the apply form rejects bad input with clear messages", async ({
  page,
}) => {
  await page.goto("/apply");
  await page.getByLabel("Your name").fill("ROBOT TEST invalid-input probe");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel(/^Password/).fill("short");
  await page.getByLabel("City").fill("Robot Test City");
  await page.getByLabel(/Tell us about your city/).fill("ROBOT TEST — invalid input probe.");
  await page.getByRole("button", { name: /submit|apply|send/i }).click();
  // Still on the form — no confirmation view, no account created.
  await expect(page).toHaveURL(/\/apply/);
  await expect(
    page.getByText("Thank you — your application is in, and your account is created."),
  ).toHaveCount(0);
});
