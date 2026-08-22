import { expect, test, type Browser, type BrowserContext } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { ROLES, rolePassword } from "./helpers/roles";

/* The write journeys — run ONCE per full run (their own Playwright project,
   serial, desktop), never per-viewport, because several of them send a real,
   TEST-marked email to the HQ inbox or mutate non-production data that the
   viewport specs read.

   Emails per full run: one contact (J1), TWO application pairs (J2 — one
   applicant per decision branch, since a decision is final in the approvals
   UI), one Ask HQ (J3). Every subject line announces the robot.
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
  await expect(
    page.getByText("Thanks — your message is on its way.").first(),
  ).toBeVisible({ timeout: 30_000 });
});

test("AC-014/AC-015/AD-001/FM-004/FM-005/FM-008/IN-002 (J2): the applicant journeys — apply, duplicate-proof, decline holds, approve unlocks", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(420_000);
  /* Two disposable robot applicants, because a decision is FINAL in the
     approvals UI (Approve/Decline render only while status is pending — by
     design): one applicant proves the declined branch, the other the
     approved branch. Cost, stated: TWO marked-TEST application email pairs
     per full run. */
  const runId = Date.now().toString(36);

  const applyAs = async (email: string, label: string) => {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await page.goto("/apply");
    await page.getByLabel("Your name").fill(label);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel(/^Password/).fill(`Gate-${runId}-probe!`);
    await page.getByLabel("City", { exact: true }).fill("Robot Test City");
    await page.getByLabel(/Organisation/).fill("Automated Launch Gate");
    await page
      .getByLabel(/Tell us about your city/)
      .fill(
        "ROBOT TEST APPLICATION from the automated test suite. Not a real application — the robot admin decides and the account is cleaned up.",
      );
    await page.getByRole("button", { name: /submit|apply|send/i }).click();
    // A successful apply signs the applicant in and lands them on the pending
    // dashboard (S6 step 3.5 — the in-form thank-you is a fallback only).
    await page.waitForURL("**/dashboard", { timeout: 60_000 });
    await expect(
      page.getByRole("heading", { name: "Your application is under review." }),
    ).toBeVisible({ timeout: 30_000 });
    return { context, page };
  };

  const declineEmail = `e2e-applicant-decline-${runId}@robot-test.invalid`;
  const approveEmail = `e2e-applicant-approve-${runId}@robot-test.invalid`;

  // AC-014: apply = sign-up, twice (one applicant per decision branch).
  const d = await applyAs(declineEmail, `ROBOT TEST Applicant D ${runId}`);
  const a = await applyAs(approveEmail, `ROBOT TEST Applicant A ${runId}`);

  // FM-004: a duplicate submission cannot create a second application — the
  // signed-in retry lands back on /dashboard.
  await d.page.goto("/apply");
  const dupForm = d.page.getByLabel("Your name");
  if (await dupForm.isVisible().catch(() => false)) {
    await dupForm.fill(`ROBOT TEST Applicant D ${runId}`);
    await d.page.getByLabel("Email").fill(declineEmail);
    await d.page.getByLabel(/^Password/).fill(`Gate-${runId}-probe!`);
    await d.page.getByLabel("City", { exact: true }).fill("Robot Test City");
    await d.page.getByLabel(/Tell us about your city/).fill("ROBOT TEST duplicate probe.");
    await d.page.getByRole("button", { name: /submit|apply|send/i }).click();
    await d.page.waitForURL("**/dashboard", { timeout: 45_000 });
  }

  // AD-001: both applications sit in the queue — exactly ONE row each
  // (FM-004's proof). Selecting a row opens the detail pane with the actions.
  const admin = await roleContext(browser, baseURL!, "admin");
  const m = await admin.newPage();
  await m.goto("/admin/approvals");
  const declineRow = m.locator("tbody tr").filter({ hasText: declineEmail });
  const approveRow = m.locator("tbody tr").filter({ hasText: approveEmail });
  await expect(declineRow, "one row for the decline applicant").toHaveCount(1, {
    timeout: 30_000,
  });
  await expect(approveRow, "one row for the approve applicant").toHaveCount(1);

  // Decline branch — AC-015's "declined stays locked out".
  await declineRow.click();
  const detail = m.locator("aside");
  await expect(detail).toContainText(declineEmail);
  await detail.getByRole("button", { name: "Decline" }).click();
  await expect(declineRow.getByText("Declined")).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(
      async () => {
        await d.page.goto("/dashboard");
        return d.page
          .getByRole("heading", { name: "We’re not moving forward right now." })
          .count();
      },
      { timeout: 45_000 },
    )
    .toBeGreaterThan(0);
  await d.page.goto("/setup");
  expect(await d.page.locator('a[href$="/guide"]').count()).toBe(0);

  // Approve branch — the one unlock this site has.
  await approveRow.click();
  await expect(detail).toContainText(approveEmail);
  await detail.getByRole("button", { name: "Approve" }).click();
  await expect(approveRow.getByText("Approved")).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(
      async () => {
        await a.page.goto("/setup");
        return a.page.locator('a[href$="/guide"]').count();
      },
      { timeout: 45_000 },
    )
    .toBeGreaterThan(0);

  await d.context.close();
  await a.context.close();
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
  // The form prefills name + work email; the robot supplies the two required
  // choices: a focus area and the question itself.
  await p.getByLabel("What do you need help with?").selectOption({ label: "Other" });
  await p
    .getByLabel("Your question")
    .fill(`${TEST_SUBJECT} — automated launch-gate test question. No reply needed.`);
  await send.click();
  // The form replaces itself with the success view (approved copy).
  await expect(
    p.getByRole("heading", { name: "Your question is ready." }),
  ).toBeVisible({ timeout: 30_000 });
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

  // Display name: change, verify it stuck, restore. The save is a server
  // action — poll with reloads rather than racing the commit.
  const original = ROLES.pending.fullName;
  const saveName = async (value: string) => {
    await p.goto("/account");
    await p.getByLabel("Display name").fill(value);
    await p.getByRole("button", { name: "Save changes" }).click();
    await expect
      .poll(
        async () => {
          await p.reload();
          return p.getByLabel("Display name").inputValue();
        },
        { timeout: 30_000 },
      )
      .toBe(value);
  };
  await saveName(`${original} (renamed)`);
  await saveName(original);

  // Password: /account deliberately offers NO in-place change — the Password
  // card links to the reset flow (/forgot-password). The robot asserts the
  // path exists; the reset flow's safety is AC-013's, and the full email walk
  // is the owner's manual line (MN-003).
  await p.goto("/account");
  const changeLink = p.getByRole("link", { name: "Change password" });
  await expect(changeLink).toBeVisible();
  await expect(changeLink).toHaveAttribute("href", "/forgot-password");
  await pending.close();
});

test("CT-007/AD-003 (J5): Draft hides a focus area everywhere; Live restores it; reorder works", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(300_000);
  const admin = await roleContext(browser, baseURL!, "admin");
  const m = await admin.newPage();
  m.on("dialog", (dialog) => void dialog.accept());
  await m.goto("/admin/content/focus-areas");

  // The screen is a table per section: Title · Live/Draft · files · ↑↓ · Edit.
  // Work on the FIRST topic of the first table — its title is read at runtime
  // and never committed anywhere (public repo).
  const firstTable = m.locator("table").first();
  await expect(firstTable.locator("tbody tr").first()).toBeVisible({
    timeout: 30_000,
  });
  const title = (
    await firstTable.locator("tbody tr").first().locator("td").first().textContent()
  )?.trim();
  expect(title, "could not read the first topic's title").toBeTruthy();

  // AD-003 reorder: move it down, then back up — the table order follows.
  await m.getByRole("button", { name: `Move ${title} down` }).click();
  await expect(
    firstTable.locator("tbody tr").nth(1).locator("td").first(),
  ).toHaveText(title!, { timeout: 30_000 });
  await m.getByRole("button", { name: `Move ${title} up` }).click();
  await expect(
    firstTable.locator("tbody tr").first().locator("td").first(),
  ).toHaveText(title!, { timeout: 30_000 });

  // CT-007: open the editor and move it back to Draft.
  const row = () => m.locator("tbody tr").filter({ hasText: title! }).first();
  const makeItLive = async () => {
    await m.goto("/admin/content/focus-areas");
    await row().getByRole("button", { name: "Edit" }).click();
    await m.getByRole("button", { name: "Make it Live" }).click();
    await expect(row().getByText("Live")).toBeVisible({ timeout: 30_000 });
  };
  await row().getByRole("button", { name: "Edit" }).click();
  await m.getByRole("button", { name: "Move back to Draft" }).click();
  await expect(row().getByText("Draft")).toBeVisible({ timeout: 30_000 });

  const approved = await roleContext(browser, baseURL!, "approved");
  const p = await approved.newPage();
  const countAll = async () => {
    let count = 0;
    for (const section of ["/setup", "/operate", "/program", "/support"]) {
      await p.goto(section);
      await p
        .waitForSelector('a[href$="/guide"]', { state: "attached", timeout: 30_000 })
        .catch(() => {});
      count += new Set(
        await p.$$eval('a[href$="/guide"]', (as) =>
          as.map((el) => (el as HTMLAnchorElement).getAttribute("href") ?? ""),
        ),
      ).size;
    }
    return count;
  };

  let restored = false;
  try {
    // The approved partner no longer sees it: 21 focus areas, title nowhere.
    await expect.poll(countAll, { timeout: 120_000 }).toBe(21);
    for (const section of ["/setup", "/operate", "/program", "/support"]) {
      await p.goto(section);
      expect(
        (await p.content()).includes(title!),
        `"${title}" still on ${section}`,
      ).toBe(false);
    }

    // Restore Live, and the world comes back.
    await makeItLive();
    restored = true;
    await expect.poll(countAll, { timeout: 120_000 }).toBe(22);
  } finally {
    // NEVER leave the store drafted — a mid-test crash once poisoned a later
    // run. Best-effort self-heal before handing the worker back.
    if (!restored) {
      await makeItLive().catch(() => {});
    }
    await approved.close();
    await admin.close();
  }
});

test("AD-002 (J6): the pages editor saves — and the platform shows it", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(300_000);
  const admin = await roleContext(browser, baseURL!, "admin");
  const m = await admin.newPage();
  const marker = " (ROBOT TEST)";

  // The screen lists the five fixed pages; Edit opens the one editor.
  const openSetupEditor = async () => {
    await m.goto("/admin/content/pages");
    await m
      .locator("tbody tr")
      .filter({ hasText: "Setup" })
      .getByRole("button", { name: "Edit" })
      .click();
    const field = m.locator("textarea").first();
    await expect(field).toBeVisible({ timeout: 30_000 });
    return field;
  };

  const approved = await roleContext(browser, baseURL!, "approved");
  const p = await approved.newPage();
  const setupShows = async (needle: string) => {
    await p.goto("/setup");
    return (await p.locator("main").innerText()).includes(needle);
  };

  const field = await openSetupEditor();
  const original = await field.inputValue();
  let reverted = false;
  const revert = async () => {
    const again = await openSetupEditor();
    await again.fill(original);
    await m.getByRole("button", { name: "Save" }).first().click();
    await expect
      .poll(async () => setupShows(marker), { timeout: 60_000 })
      .toBe(false);
    reverted = true;
  };

  try {
    // Edit: append the marker, save, and see it on the partner's /setup.
    await field.fill(`${original}${marker}`);
    await m.getByRole("button", { name: "Save" }).first().click();
    await expect
      .poll(async () => setupShows(marker), { timeout: 60_000 })
      .toBe(true);

    // Restore immediately — the platform's copy is locked content.
    await revert();
  } finally {
    // NEVER leave the marker in the store — a crash mid-test once left one.
    if (!reverted) {
      await revert().catch(() => {});
    }
    await approved.close();
    await admin.close();
  }
});

test("AD-004 (J7): the files manager uploads, serves, refuses and deletes", async ({
  browser,
  baseURL,
}, testInfo) => {
  test.setTimeout(300_000);
  const admin = await roleContext(browser, baseURL!, "admin");
  const m = await admin.newPage();

  const openFocusArea = async () => {
    await m.goto("/admin/content/files");
    await m.getByLabel("Focus area").selectOption({ label: "Get Legally Ready" });
    await expect(m.getByRole("button", { name: "+ Add template" })).toBeVisible({
      timeout: 30_000,
    });
  };

  /* Delete every ROBOT TEST template through the app's own flow (typed-name
     confirmation). Runs BEFORE the test (sweeping any leftover from a
     crashed earlier run) and again in finally. */
  const deleteRobotTemplates = async () => {
    await openFocusArea();
    for (let i = 0; i < 6; i += 1) {
      const editBtn = m
        .getByRole("button", { name: /Edit “ROBOT TEST template/ })
        .first();
      if (!(await editBtn.isVisible().catch(() => false))) break;
      const label = (await editBtn.textContent()) ?? "";
      const match = label.match(/“(.+)”/);
      if (!match) break;
      await editBtn.click();
      await m.getByRole("button", { name: "Delete file…" }).last().click();
      await m.locator('input[name="confirm"]').fill(match[1]);
      await m.getByRole("button", { name: "Delete for good" }).click();
      await expect(m.getByRole("button", { name: label.trim() })).toHaveCount(0, {
        timeout: 45_000,
      });
    }
  };

  await deleteRobotTemplates();
  const runId = Date.now().toString(36);
  const title = `ROBOT TEST template ${runId} (delete me)`;

  try {
    await openFocusArea();
    // Open the add-template form (Name · Short code · File · Add template).
    await m.getByRole("button", { name: "+ Add template" }).click();
    const addForm = m
      .locator("form")
      .filter({ has: m.getByRole("button", { name: "Add template" }) });
    await addForm.locator('input[name="title"]').fill(title);
    await addForm.locator('input[name="code"]').fill("T99");

    // The type check refuses what it should — and says what arrived.
    const txtPath = testInfo.outputPath("robot-test.txt");
    writeFileSync(txtPath, "not a document");
    await addForm.locator('input[type="file"]').setInputFiles(txtPath);
    await expect(addForm.getByText(/That’s a \.txt file/)).toBeVisible({
      timeout: 10_000,
    });

    // The size check refuses a file over 4 MB, client-side, before any upload.
    const bigPath = testInfo.outputPath("robot-test-too-big.pdf");
    writeFileSync(bigPath, Buffer.alloc(4_200_000, 0x20));
    await addForm.locator('input[type="file"]').setInputFiles(bigPath);
    await expect(addForm.getByText(/over 4 MB/)).toBeVisible({ timeout: 10_000 });

    // A tiny real PDF goes through and lands in the list.
    const pdfPath = testInfo.outputPath("robot-test-template.pdf");
    writeFileSync(
      pdfPath,
      [
        "%PDF-1.4",
        "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj",
        "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj",
        "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj",
        "trailer<</Root 1 0 R>>",
        "%%EOF",
        "",
      ].join("\n"),
    );
    await addForm.locator('input[type="file"]').setInputFiles(pdfPath);
    await addForm.getByRole("button", { name: "Add template" }).click();
    await expect(m.getByRole("button", { name: `Edit “${title}”` })).toBeVisible({
      timeout: 45_000,
    });

    // The partner side serves it: the topic's grid now carries the template.
    const approved = await roleContext(browser, baseURL!, "approved");
    const p = await approved.newPage();
    await expect
      .poll(
        async () => {
          await p.goto("/setup");
          return (await p.content()).includes(title);
        },
        { timeout: 60_000 },
      )
      .toBe(true);

    // And is deleted again — typed-name confirmation, store back as it was.
    await deleteRobotTemplates();
    await expect
      .poll(
        async () => {
          await p.goto("/setup");
          return (await p.content()).includes(title);
        },
        { timeout: 60_000 },
      )
      .toBe(false);
    await approved.close();
  } finally {
    // NEVER leave a robot template in the store.
    await deleteRobotTemplates().catch(() => {});
    await admin.close();
  }
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

  const pendingRow = () =>
    m.locator("li, tr, article").filter({ hasText: ROLES.pending.email }).first();

  let removed = false;
  try {
    // Add the pending robot (an existing, obviously-fake account) as an admin…
    const emailBox = m.locator("input[type='email'], input[name*='email']").first();
    await emailBox.fill(ROLES.pending.email);
    await m.getByRole("button", { name: /add/i }).first().click();
    await expect(m.getByText(ROLES.pending.email)).toBeVisible({ timeout: 30_000 });

    // …and remove them again. The store ends exactly as it started.
    await pendingRow().getByRole("button", { name: "Remove" }).click();
    await expect(m.getByText(ROLES.pending.email)).toHaveCount(0, { timeout: 30_000 });
    removed = true;

    // Removing yourself is refused — the refusal is the PASS.
    const selfRow = m
      .locator("li, tr, article")
      .filter({ hasText: ROLES.admin.email })
      .first();
    await selfRow.getByRole("button", { name: "Remove" }).click();
    await expect(m.getByText(ROLES.admin.email)).toBeVisible({ timeout: 30_000 });
  } finally {
    /* NEVER leave the pending robot in `admins`. If this test dies between
       the add and the remove, the pending robot becomes a real admin on the
       test project — and AC-003/AC-006 would then fail on the NEXT run
       looking exactly like a gate breach, which is the worst possible false
       alarm. (D-SYS-1 review finding F6; the same lesson J5/J6/J7 already
       carry.) Best-effort, and it must not mask the original failure. */
    if (!removed) {
      try {
        await m.goto("/admin/content/admins");
        if (await pendingRow().count()) {
          await pendingRow().getByRole("button", { name: "Remove" }).click();
          await expect(m.getByText(ROLES.pending.email)).toHaveCount(0, {
            timeout: 30_000,
          });
        }
      } catch {
        /* swallowed: the assertion that brought us here is the real report */
      }
    }
    await admin.close();
  }
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
  // Sign-out is a server action — wait for the header to flip back to
  // "Sign in" (the observable completion) before probing the door.
  await expect
    .poll(
      async () =>
        page.$$eval("header", (els) => els.map((el) => el.textContent ?? "").join(" ")),
      { timeout: 30_000 },
    )
    .toContain("Sign in");
  // The same gated door is shut again.
  await expect
    .poll(
      async () => {
        await page.goto("/dashboard");
        await page.waitForLoadState();
        return page.url();
      },
      { timeout: 45_000 },
    )
    .toMatch(/\/login/);
  await context.close();
});
