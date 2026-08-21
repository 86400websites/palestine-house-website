import { expect, test, type Browser, type BrowserContext } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { ROLES, rolePassword } from "./helpers/roles";

/* The write journeys — run ONCE per full run (their own Playwright project,
   serial, desktop), never per-viewport, because several of them send a real,
   TEST-marked email to the HQ inbox or mutate non-production data that the
   viewport specs read.

   Emails per full run: at most one per flow — contact (J1), the apply
   notification (J2), Ask HQ (J3). Every subject line announces the robot.
   All data mutations are on the NON-PRODUCTION project (the Preview's
   database) and every one is reverted or deleted before the journey ends. */

test.describe.configure({ mode: "serial" });

async function roleContext(
  browser: Browser,
  baseURL: string,
  role: keyof typeof ROLES,
): Promise<BrowserContext> {
  return browser.newContext({ baseURL, storageState: ROLES[role].storageState });
}

const TEST_SUBJECT = "ROBOT TEST — automated launch gate (please ignore)";

test("FM-002 (J1): the contact form works end to end — one marked-TEST email to HQ", async ({
  page,
}) => {
  await page.goto("/contact");
  await page.getByLabel("Name").fill("ROBOT TEST — launch gate");
  await page.getByLabel("Email").fill("e2e-contact@robot-test.invalid");
  await page.getByLabel("Subject").fill(TEST_SUBJECT);
  await page
    .getByLabel("Message")
    .fill(
      "This is an automated test submission from the Palestine House launch gate. No reply needed.",
    );
  await page.getByRole("button", { name: /send/i }).click();
  await expect(page.locator('[role="status"], [aria-live]')).toContainText(
    /thank|received|sent|touch/i,
    { timeout: 30_000 },
  );
});

test("AC-014/AC-015/AD-001/FM-004/FM-005/FM-008/IN-002 (J2): the whole applicant journey — apply, duplicate-proof, decline holds, approve unlocks", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(300_000);
  const runId = Date.now().toString(36);
  const email = `e2e-applicant-${runId}@robot-test.invalid`;
  const applicant = await browser.newContext({ baseURL });
  const a = await applicant.newPage();

  // AC-014: apply = sign-up. One submission, unmistakably a robot.
  await a.goto("/apply");
  await a.getByLabel("Your name").fill(`ROBOT TEST Applicant ${runId}`);
  await a.getByLabel("Email").fill(email);
  await a.getByLabel(/^Password/).fill(`Gate-${runId}-probe!`);
  await a.getByLabel("City").fill("Robot Test City");
  await a.getByLabel(/Organisation/).fill("Automated Launch Gate");
  await a
    .getByLabel(/Tell us about your city/)
    .fill(
      "ROBOT TEST APPLICATION from the automated test suite. Not a real application — decline or approve is driven by the robot admin and reverted.",
    );
  await a.getByRole("button", { name: /submit|apply|send/i }).click();
  await expect(
    a.getByText("Thank you — your application is in, and your account is created."),
  ).toBeVisible({ timeout: 45_000 });

  // The new account is pending (the gate's default).
  await a.goto("/dashboard");
  await expect(
    a.getByRole("heading", { name: "Your application is under review." }),
  ).toBeVisible();

  // FM-004: a duplicate submission cannot create a second application — the
  // signed-in retry lands on /dashboard instead.
  await a.goto("/apply");
  const form = a.getByLabel("Your name");
  if (await form.isVisible().catch(() => false)) {
    await form.fill(`ROBOT TEST Applicant ${runId}`);
    await a.getByLabel("Email").fill(email);
    await a.getByLabel(/^Password/).fill(`Gate-${runId}-probe!`);
    await a.getByLabel("City").fill("Robot Test City");
    await a.getByLabel(/Tell us about your city/).fill("ROBOT TEST duplicate probe.");
    await a.getByRole("button", { name: /submit|apply|send/i }).click();
    await a.waitForURL("**/dashboard", { timeout: 45_000 });
  }

  // AD-001: the application is in the queue, exactly once.
  const admin = await roleContext(browser, baseURL!, "admin");
  const m = await admin.newPage();
  await m.goto("/admin/approvals");
  const row = m.locator("li, tr, article, div.approval-card").filter({ hasText: email }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  expect(await m.getByText(email).count(), "duplicate queue rows").toBe(1);

  // Decline first — AC-015's "declined stays locked out".
  await row.getByRole("button", { name: "Decline" }).click();
  await expect(row).toContainText("Declined", { timeout: 30_000 });
  await a.goto("/dashboard");
  await expect(
    a.getByRole("heading", { name: "We’re not moving forward right now." }),
  ).toBeVisible({ timeout: 30_000 });
  await a.goto("/setup");
  expect(await a.getByRole("link", { name: "Read Now" }).count()).toBe(0);

  // Approve — the one unlock this site has.
  await m.reload();
  const rowAgain = m.locator("li, tr, article, div.approval-card").filter({ hasText: email }).first();
  await rowAgain.getByRole("button", { name: "Approve" }).click();
  await expect(rowAgain).toContainText("Approved", { timeout: 30_000 });

  await a.goto("/setup");
  await expect
    .poll(async () => a.getByRole("link", { name: "Read Now" }).count(), {
      timeout: 30_000,
    })
    .toBeGreaterThan(0);

  await applicant.close();
  await admin.close();
});

test("FM-006 (J3): Ask HQ works for an approved partner — and its form never shows for a pending one", async ({
  browser,
  baseURL,
}) => {
  const approved = await roleContext(browser, baseURL!, "approved");
  const p = await approved.newPage();
  await p.goto("/support");
  const opener = p.getByRole("button", { name: /ask hq/i }).first();
  if (await opener.isVisible().catch(() => false)) {
    await opener.click();
  }
  const send = p.getByRole("button", { name: "Send question" });
  await expect(send).toBeVisible({ timeout: 20_000 });
  const region = p.locator("form").filter({ has: send });
  const boxes = region.locator("input[type='text'], input:not([type]), textarea");
  const count = await boxes.count();
  await boxes.nth(0).fill(TEST_SUBJECT);
  if (count > 1) {
    await boxes
      .nth(count - 1)
      .fill("Automated launch-gate test question. No reply needed.");
  }
  await send.click();
  await expect(p.getByText(/received|thank|sent|touch/i).first()).toBeVisible({
    timeout: 30_000,
  });
  await approved.close();

  const pending = await roleContext(browser, baseURL!, "pending");
  const q = await pending.newPage();
  await q.goto("/support");
  expect(
    await q.getByRole("button", { name: "Send question" }).count(),
    "the Ask HQ form rendered for a pending partner",
  ).toBe(0);
  await pending.close();
});

test("FM-007 (J4): /account saves a display name and changes a password — as the pending partner", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(180_000);
  const pending = await roleContext(browser, baseURL!, "pending");
  const p = await pending.newPage();
  await p.goto("/account");

  // Display name: change, verify it stuck, restore.
  const original = ROLES.pending.fullName;
  await p.getByLabel("Display name").fill(`${original} (renamed)`);
  await p.getByRole("button", { name: "Save changes" }).click();
  await p.reload();
  await expect(p.getByLabel("Display name")).toHaveValue(`${original} (renamed)`);
  await p.getByLabel("Display name").fill(original);
  await p.getByRole("button", { name: "Save changes" }).click();
  await p.reload();
  await expect(p.getByLabel("Display name")).toHaveValue(original);

  // Password: change to a temporary one, prove it works, change it back.
  const current = rolePassword("pending");
  const temporary = `${current}X1`;
  const section = p.locator("section, form, div").filter({
    has: p.getByRole("heading", { name: "Password" }),
  }).last();
  const setPassword = async (value: string) => {
    const fields = section.locator("input[type='password']");
    const n = await fields.count();
    expect(n, "no password fields found on /account").toBeGreaterThan(0);
    for (let i = 0; i < n; i += 1) await fields.nth(i).fill(value);
    await section.getByRole("button").last().click();
    await p.waitForTimeout(2_000);
  };
  await setPassword(temporary);

  // The temporary password signs in.
  const probeCtx = await browser.newContext({ baseURL });
  const probePage = await probeCtx.newPage();
  await probePage.goto("/login");
  await probePage.getByLabel("Email").fill(ROLES.pending.email);
  await probePage.getByLabel("Password").fill(temporary);
  await probePage.getByRole("button", { name: "Sign in" }).click();
  await probePage.waitForURL("**/dashboard", { timeout: 45_000 });
  await probeCtx.close();

  // Restore the real one so the stored session setup stays true.
  await p.goto("/account");
  await setPassword(current);
  await pending.close();
});

test("CT-007/AD-003 (J5): Draft hides a focus area everywhere; Live restores it", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(300_000);
  const admin = await roleContext(browser, baseURL!, "admin");
  const m = await admin.newPage();
  await m.goto("/admin/content/focus-areas");

  // Work on the FIRST live topic the editor lists — its title is read at
  // runtime and never committed anywhere.
  const draftButton = m.getByRole("button", { name: "Move back to Draft" }).first();
  await expect(draftButton).toBeVisible({ timeout: 30_000 });
  const scope = m.locator("li, article, section, tr").filter({ has: draftButton }).first();
  const title = (await scope.locator("h2, h3, strong").first().textContent())?.trim();
  expect(title, "could not read the topic's title").toBeTruthy();

  await draftButton.click();
  await expect(scope.getByText("Draft").first()).toBeVisible({ timeout: 30_000 });

  // The approved partner no longer sees it: 21 focus areas, title nowhere.
  const approved = await roleContext(browser, baseURL!, "approved");
  const p = await approved.newPage();
  let total = 0;
  for (const section of ["/setup", "/operate", "/program", "/support"]) {
    await p.goto(section);
    total += await p.getByRole("link", { name: "Read Now" }).count();
    expect((await p.content()).includes(title!), `"${title}" still on ${section}`).toBe(
      false,
    );
  }
  expect(total, "focus-area count while one is Draft").toBe(21);

  // Restore Live, and the world comes back.
  await m.reload();
  await m.getByRole("button", { name: "Make it Live" }).first().click();
  await expect(m.getByText("Live").first()).toBeVisible({ timeout: 30_000 });
  total = 0;
  for (const section of ["/setup", "/operate", "/program", "/support"]) {
    await p.goto(section);
    total += await p.getByRole("link", { name: "Read Now" }).count();
  }
  expect(total, "focus-area count after restore").toBe(22);
  await approved.close();
  await admin.close();
});

test("AD-002 (J6): the pages editor saves — and the platform shows it", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(180_000);
  const admin = await roleContext(browser, baseURL!, "admin");
  const m = await admin.newPage();
  await m.goto("/admin/content/pages");

  const field = m.locator("textarea").first();
  await expect(field).toBeVisible({ timeout: 30_000 });
  const original = await field.inputValue();
  const marker = " (ROBOT TEST)";
  await field.fill(`${original}${marker}`);
  await m.getByRole("button", { name: "Save" }).first().click();
  await expect(m.getByText(/saved|saving/i).first()).toBeVisible({ timeout: 30_000 }).catch(() => {});

  // Restore immediately — the platform's copy is locked content.
  await m.reload();
  const after = m.locator("textarea").first();
  await expect(after).toHaveValue(`${original}${marker}`, { timeout: 30_000 });
  await after.fill(original);
  await m.getByRole("button", { name: "Save" }).first().click();
  await m.reload();
  await expect(m.locator("textarea").first()).toHaveValue(original, {
    timeout: 30_000,
  });
  await admin.close();
});

test("AD-004 (J7): the files manager uploads, serves, refuses and deletes", async ({
  browser,
  baseURL,
}, testInfo) => {
  test.setTimeout(300_000);
  const admin = await roleContext(browser, baseURL!, "admin");
  const m = await admin.newPage();
  await m.goto("/admin/content/files");

  const fileInput = m.locator("input[type='file']").first();
  await expect(fileInput).toBeAttached({ timeout: 30_000 });

  // A tiny real PDF, generated on the spot — nothing gated, nothing real.
  const pdfPath = testInfo.outputPath("robot-test-template.pdf");
  writeFileSync(
    pdfPath,
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
  );

  // The type check refuses what it should.
  const txtPath = testInfo.outputPath("robot-test.txt");
  writeFileSync(txtPath, "not a document");
  await fileInput.setInputFiles(txtPath);
  await expect(m.getByText(/isn.t supported|not supported/i).first()).toBeVisible({
    timeout: 20_000,
  });

  // The real upload goes through and lands in the list.
  await fileInput.setInputFiles(pdfPath);
  const titleBox = m.locator("input[type='text']").last();
  if (await titleBox.isVisible().catch(() => false)) {
    await titleBox.fill("ROBOT TEST template (delete me)");
  }
  const uploadButton = m.getByRole("button", { name: /upload|add|save/i }).first();
  if (await uploadButton.isEnabled().catch(() => false)) {
    await uploadButton.click();
  }
  await expect(m.getByText(/robot-test-template|ROBOT TEST template/i).first()).toBeVisible({
    timeout: 45_000,
  });

  // And is deleted again — the store goes back exactly as it was.
  m.on("dialog", (dialog) => void dialog.accept());
  const rowScope = m
    .locator("li, tr, article")
    .filter({ hasText: /robot-test-template|ROBOT TEST template/i })
    .first();
  await rowScope.getByRole("button", { name: /delete|remove/i }).click();
  await expect(
    m.getByText(/robot-test-template|ROBOT TEST template/i),
  ).toHaveCount(0, { timeout: 45_000 });
  await admin.close();
});

test("AD-005 (J8): admin management adds and removes — and refuses self-removal", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(180_000);
  const admin = await roleContext(browser, baseURL!, "admin");
  const m = await admin.newPage();
  m.on("dialog", (dialog) => void dialog.accept());
  await m.goto("/admin/content/admins");

  // Add the pending robot (an existing, obviously-fake account) as an admin…
  const emailBox = m.locator("input[type='email'], input[name*='email']").first();
  await emailBox.fill(ROLES.pending.email);
  await m.getByRole("button", { name: /add/i }).first().click();
  await expect(m.getByText(ROLES.pending.email)).toBeVisible({ timeout: 30_000 });

  // …and remove them again. The store ends exactly as it started.
  const row = m.locator("li, tr, article").filter({ hasText: ROLES.pending.email }).first();
  await row.getByRole("button", { name: "Remove" }).click();
  await expect(m.getByText(ROLES.pending.email)).toHaveCount(0, { timeout: 30_000 });

  // Removing yourself is refused — the refusal is the PASS.
  const selfRow = m.locator("li, tr, article").filter({ hasText: ROLES.admin.email }).first();
  await selfRow.getByRole("button", { name: "Remove" }).click();
  await expect(m.getByText(ROLES.admin.email)).toBeVisible({ timeout: 30_000 });
  await admin.close();
});

test("AC-010 (J9, runs LAST): login and logout work, and the door locks again", async ({
  browser,
  baseURL,
}) => {
  /* Deliberately the final test of the entire run: the site's sign-out
     revokes EVERY session the account holds (global scope), so it must
     execute only when nothing else still needs the approved robot's stored
     session. Ordering: this file is serial and this test sits last — do not
     move it. */
  test.setTimeout(120_000);
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await page.goto("/login");
  await page.getByLabel("Email").fill(ROLES.approved.email);
  await page.getByLabel("Password").fill(rolePassword("approved"));
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard", { timeout: 55_000 });

  // Sign out from the public chrome (desktop bar or the 320px sheet menu).
  await page.goto("/");
  await expect
    .poll(
      async () =>
        page.$$eval("header", (els) => els.map((el) => el.textContent ?? "").join(" ")),
      { timeout: 30_000 },
    )
    .toContain("Sign out");
  const menuButton = page.getByRole("button", { name: "Open menu" });
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
    await page.getByRole("button", { name: "Sign out" }).last().click();
  } else {
    await page.locator("header form button", { hasText: "Sign out" }).first().click();
  }
  // The same gated door is shut again.
  await page.goto("/dashboard");
  await page.waitForURL(/\/login/, { timeout: 30_000 });
  await context.close();
});
