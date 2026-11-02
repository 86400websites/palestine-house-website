import { expect, test } from "@playwright/test";
import { ROLES } from "./helpers/roles";
import { probe } from "./helpers/app";

/* Section B (auth halves) + the reject halves of Section D. Nothing in this
   file sends an email to a real inbox: the only address ever typed into a
   form here is an undeliverable robot one, and the contact form is only ever
   given INVALID input (its one real send lives in journeys.spec.ts). */

/* AC-010 (login + logout) lives in journeys.spec.ts as the FINAL test of the
   whole run: the site's sign-out revokes every session the account holds
   (global scope), so running it here would kill the stored session that all
   the other approved-partner specs share — the second full run proved it. */

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
  await page.waitForURL("**/dashboard", { timeout: 55_000 });
  await context.close();
});

test("AC-012: a wrong password fails safely", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ROLES.approved.email);
  await page.getByLabel("Password").fill("definitely-not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  // A clear message inside the form, still on /login, no session created. The refusal
  // itself, because the form's own "Password" label would satisfy any text check.
  await expect(page.locator(".auth-note")).toBeVisible({ timeout: 30_000 });
  await expect(page).toHaveURL(/\/login/);
  const known = (await page.locator(".auth-note").innerText()).trim();
  // An address with no account gets the same words, so the message reveals nothing.
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody-here@robot-test.invalid");
  await page.getByLabel("Password").fill("definitely-not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".auth-note")).toBeVisible({ timeout: 30_000 });
  expect(
    (await page.locator(".auth-note").innerText()).trim(),
    "the message differs by account existence",
  ).toBe(known);
  // No session was created: a gated URL still lands on the sign-in page.
  await page.goto("/dashboard");
  await page.waitForURL(/\/login/, { timeout: 30_000 });
});

test("AC-013: password-reset is safe in both directions", async ({
  page,
  request,
}) => {
  // Same neutral answer whether or not the account exists.
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(ROLES.pending.email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  // The answer itself: read straight after the click, both reads would be the form.
  await expect(page.locator(".auth-note")).toBeVisible({ timeout: 30_000 });
  const known = (await page.locator("main").innerText()).trim();

  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("nobody-here@robot-test.invalid");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.locator(".auth-note")).toBeVisible({ timeout: 30_000 });
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
  // And no session was minted by the garbage link.
  await page.goto("/dashboard");
  await page.waitForURL(/\/login/, { timeout: 30_000 });
});

test("FM-001: the contact form rejects bad input, client and server", async ({
  page,
}) => {
  await page.goto("/contact");
  // Client side: an empty submit is stopped at the first field, and produces no
  // success state.
  await page.getByRole("button", { name: "Send Message" }).click();
  await expect(page.locator("#c-name")).toBeFocused();
  await expect(
    page.getByText("Thank you. Your enquiry has been submitted."),
  ).toHaveCount(0);

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
  await page.getByLabel("Email address").fill("not-an-email");
  await page.getByLabel(/^Password/).fill("short");
  await page.getByLabel("City", { exact: true }).fill("Robot Test City");
  await page
    .getByLabel("What interests you about Palestine House?")
    .fill("ROBOT TEST — invalid input probe.");
  await page.getByRole("button", { name: "Send Application" }).click();
  // A refusal from either layer first: the browser focuses the bad field, or the
  // server's message renders. A submission that went through shows neither.
  await expect(page.locator("#a-email:focus, .auth-error").first()).toBeVisible({
    timeout: 30_000,
  });
  // Still on the form — no confirmation view, no account created.
  await expect(page).toHaveURL(/\/apply/);
  await expect(
    page.getByText("Thank you. Your application has been received."),
  ).toHaveCount(0);

  /* The server's own check, the only one on this public write until SYS1.5. With the
     browser's taken away, each bad field gets its own message and nothing is created.
     React resets the form when its action finishes, so each case fills it again. */
  await page.locator("form.apply-form").evaluate((form: HTMLFormElement) => {
    form.noValidate = true;
  });
  for (const [email, password, city, message] of [
    ["not-an-email", "long-enough-password", "Robot Test City", "Please enter a valid email."],
    ["e2e-applicant-refused@robot-test.invalid", "short", "Robot Test City", "Choose a password with at least 8 characters."],
    ["e2e-applicant-refused@robot-test.invalid", "long-enough-password", "", "Please fill in all the required fields."],
  ]) {
    await page.getByLabel("Your name").fill("ROBOT TEST invalid-input probe");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel(/^Password/).fill(password);
    await page.getByLabel("City", { exact: true }).fill(city);
    await page
      .getByLabel("What interests you about Palestine House?")
      .fill("ROBOT TEST — invalid input probe.");
    await page.getByRole("button", { name: "Send Application" }).click();
    await expect(page.locator(".auth-error")).toHaveText(message, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/apply/);
  }
});

test("PG-008 (noindex): the sign-in page says noindex", async ({ page }) => {
  // The gated and admin halves are in access-allowed.spec.ts, under their own roles.
  await page.goto("/login");
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
    "content",
    /noindex/,
    { timeout: 30_000 },
  );
});
