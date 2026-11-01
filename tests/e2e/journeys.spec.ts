import { expect, test, type Browser, type BrowserContext } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { DECLINED_HEADING, PENDING_HEADING, openPanel } from "./helpers/app";
import { ROLES, rolePassword } from "./helpers/roles";

/* The write journeys — run ONCE per full run (their own Playwright project,
   serial, desktop), never per-viewport, because several of them send a real,
   TEST-marked email to the HQ inbox or mutate non-production data that the
   viewport specs read.

   Emails per full run: one contact (J1), TWO application pairs (J2 — one
   applicant per decision branch, since a decision is final in the approvals
   UI). Every subject line announces the robot. J3 sends none and writes nothing:
   the Ask HQ form it used to submit left at CR1, and the block in its place only
   links to the contact form.
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
  await page.getByLabel("Your name").fill("ROBOT TEST — launch gate");
  await page.getByLabel("Email address").fill("e2e-contact@robot-test.invalid");
  await page.getByLabel("Subject").fill(TEST_SUBJECT);
  await page
    .getByLabel("Your message")
    .fill(
      "This is an automated test submission from the Palestine House launch gate. No reply needed.",
    );
  await page.getByRole("button", { name: "Send Message" }).click();
  await expect(
    page.getByText("Thank you. Your enquiry has been submitted.").first(),
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
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel(/^Password/).fill(`Gate-${runId}-probe!`);
    await page.getByLabel("City", { exact: true }).fill("Robot Test City");
    await page.getByLabel(/Organization or group name/).fill("Automated Launch Gate");
    await page
      .getByLabel("What interests you about Palestine House?")
      .fill(
        "ROBOT TEST APPLICATION from the automated test suite. Not a real application — the robot admin decides and the account is cleaned up.",
      );
    await page.getByRole("button", { name: "Send Application" }).click();
    // A successful apply signs the applicant in and lands them on the pending
    // dashboard (S6 step 3.5 — the in-form thank-you is a fallback only).
    await page.waitForURL("**/dashboard", { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: PENDING_HEADING })).toBeVisible({
      timeout: 30_000,
    });
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
    await d.page.getByLabel("Email address").fill(declineEmail);
    await d.page.getByLabel(/^Password/).fill(`Gate-${runId}-probe!`);
    await d.page.getByLabel("City", { exact: true }).fill("Robot Test City");
    await d.page
      .getByLabel("What interests you about Palestine House?")
      .fill("ROBOT TEST duplicate probe.");
    await d.page.getByRole("button", { name: "Send Application" }).click();
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
        return d.page.getByRole("heading", { name: DECLINED_HEADING }).count();
      },
      { timeout: 45_000 },
    )
    .toBeGreaterThan(0);
  // A declined account gets the same truthful answer on every section page (CR1),
  // and waiting for it means the count below reads a finished page.
  for (const section of ["/setup", "/operate", "/program", "/support"]) {
    await d.page.goto(section);
    await expect(
      d.page.getByRole("heading", { name: DECLINED_HEADING }),
      `no declined notice on ${section}`,
    ).toBeVisible({ timeout: 30_000 });
    expect(
      await d.page.locator('a[href$="/guide"]').count(),
      `declined account saw a guide link on ${section}`,
    ).toBe(0);
  }

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

test("FM-006 (J3): the Community Contacts block links an approved partner to /contact and submits nothing — and never shows for a pending one", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(180_000);
  /* The block replaced the Ask HQ form at CR1. It holds guidance and a link, so
     this journey writes no row and sends no email: the contact form it leads to is
     opened here and never filled. The old RPC and its table remain in the database,
     unreached; the watcher below is what would notice a page reaching for them. */
  const approved = await roleContext(browser, baseURL!, "approved");
  const p = await approved.newPage();
  const writes: string[] = [];
  p.on("request", (request) => {
    if (
      request.method() === "POST" &&
      (request.headers()["next-action"] || request.url().includes("/api/"))
    ) {
      writes.push(request.url());
    }
  });

  await p.goto("/support");
  const block = p.locator("section#community-contacts");
  await expect(block).toBeVisible({ timeout: 30_000 });
  await expect(
    block.getByRole("heading", { name: "Need a community contact?" }),
  ).toBeVisible();
  await expect(block.locator("form, input, select, textarea, button")).toHaveCount(0);
  await expect(block).toContainText("it does not post a question to community members");
  // The optional Aswātna line: its address and its site, both plain links.
  await expect(block.locator('a[href^="mailto:"]')).toHaveCount(1);
  await expect(block.locator('a[href="https://aswatnastudio.com/"]')).toHaveCount(1);

  const link = block.getByRole("link", { name: "Request Community Contacts" });
  await expect(link).toHaveAttribute("href", "/contact");
  await link.click();
  await p.waitForURL("**/contact", { timeout: 45_000 });
  await expect(p.getByRole("button", { name: "Send Message" })).toBeVisible({
    timeout: 30_000,
  });
  expect(writes, "the Community Contacts walk submitted something").toHaveLength(0);
  await approved.close();

  // Pending: the pending notice, and none of the block in what was sent.
  const pending = await roleContext(browser, baseURL!, "pending");
  const q = await pending.newPage();
  await q.goto("/support");
  await expect(q.getByRole("heading", { name: PENDING_HEADING })).toBeVisible({
    timeout: 30_000,
  });
  await expect(q.locator("#community-contacts")).toHaveCount(0);
  expect(
    (await q.content()).includes("Need a community contact?"),
    "the Community Contacts block reached a pending partner",
  ).toBe(false);
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
  const approved = await roleContext(browser, baseURL!, "approved");
  const p = await approved.newPage();
  const guideLinks = async () => {
    const all = new Set<string>();
    for (const section of ["/setup", "/operate", "/program", "/support"]) {
      await p.goto(section);
      await p
        .waitForSelector('a[href$="/guide"]', { state: "attached", timeout: 30_000 })
        .catch(() => {});
      for (const href of await p.$$eval('a[href$="/guide"]', (as) =>
        as.map((el) => (el as HTMLAnchorElement).getAttribute("href") ?? ""),
      )) {
        all.add(href);
      }
    }
    return all;
  };
  const countAll = async () => (await guideLinks()).size;
  const before = await guideLinks();

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

    // Its guide URL, known from before, is now the private not-found page.
    const after = await guideLinks();
    const gone = [...before].filter((href) => !after.has(href));
    expect(gone, "exactly one guide should have dropped out").toHaveLength(1);
    await p.goto(gone[0]);
    await expect(p.getByRole("heading", { name: "That page doesn’t exist." })).toBeVisible({
      timeout: 30_000,
    });

    // And search does not offer it. The shortcuts appear once the index has arrived.
    await p.goto("/dashboard");
    await p.getByRole("button", { name: "Search Resources" }).first().click();
    const dialog = p.locator("dialog.pw-overlay");
    await expect(dialog.locator(".pw-search-shortcut").first()).toBeVisible({
      timeout: 30_000,
    });
    await dialog.getByPlaceholder(/Search focus areas/).fill(title!);
    await expect(dialog.locator(".pw-result-title").filter({ hasText: title! })).toHaveCount(0);

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
    /* .first(): during a client transition the old and new <main> can both
       be mounted for a moment, and a bare locator("main") then fails strict
       mode. Observed once on a slow Preview; not a site defect (the id is
       React's, and only one survives the transition). */
    return (await p.locator("main").first().innerText()).includes(needle);
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

  const serverAnswered = () =>
    m.waitForResponse(
      (r) =>
        r.request().method() === "POST" && !!r.request().headers()["next-action"],
      { timeout: 45_000 },
    );

  const openFocusArea = async () => {
    await m.goto("/admin/content/files");
    /* The visible one: while the page streams in, a second copy of this select can
       be in the document for a moment. */
    await m
      .getByLabel("Focus area")
      .filter({ visible: true })
      .first()
      .selectOption({ label: "Find and Prepare the Space" });
    await expect(m.getByRole("button", { name: "+ Add template" })).toBeVisible({
      timeout: 30_000,
    });
  };

  /* Delete every ROBOT TEST template through the app's own flow (typed-name
     confirmation). Runs BEFORE the test (sweeping any leftover from a
     crashed earlier run) and again in finally. */
  const deleteRobotTemplates = async () => {
    for (let i = 0; i < 6; i += 1) {
      await openFocusArea();
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
      /* Wait for the server, then let the fresh load above answer. This screen can
         sit on "Deleting…" after the delete has finished (PROJECT-STATUS §7 #14), so
         its own list proves nothing, and the old check on the Edit button passed
         while the delete was still running, because an open row has none. The
         partner-side poll after this is what proves the store is back. */
      const done = serverAnswered();
      await m.getByRole("button", { name: "Delete for good" }).click();
      await done;
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
    /* React resets a form when its action finishes, refused or not, so a submit
       puts every field back first. */
    const submitAddForm = async (code: string, path: string, rowTitle = title) => {
      await addForm.locator('input[name="title"]').fill(rowTitle);
      await addForm.locator('input[name="code"]').fill(code);
      await addForm.locator('input[type="file"]').setInputFiles(path);
      const done = serverAnswered();
      await addForm.getByRole("button", { name: "Add template" }).click();
      await done;
    };
    // A fresh load, because this screen can go stale after a change that saved.
    const expectSaved = async (rowTitle: string) => {
      await openFocusArea();
      await expect(m.getByRole("button", { name: `Edit “${rowTitle}”` })).toBeVisible({
        timeout: 30_000,
      });
    };

    // The type check refuses what it should — and says what arrived.
    const txtPath = testInfo.outputPath("robot-test.txt");
    writeFileSync(txtPath, "not a document");
    await addForm.locator('input[type="file"]').setInputFiles(txtPath);
    await expect(
      addForm.getByText(
        "That’s a .txt file. Please save it as .docx, a PNG or an SVG and upload it again.",
      ),
    ).toBeVisible({ timeout: 10_000 });

    // A PDF too: the copy has no download label for one (D-CR1-5).
    const refusedPdfPath = testInfo.outputPath("robot-test-refused.pdf");
    writeFileSync(refusedPdfPath, "%PDF-1.4");
    await addForm.locator('input[type="file"]').setInputFiles(refusedPdfPath);
    await expect(
      addForm.getByText(
        "That’s a .pdf file. Please save it as .docx, a PNG or an SVG and upload it again.",
      ),
    ).toBeVisible({ timeout: 10_000 });

    // The size check refuses a file over 4 MB, client-side, before any upload.
    const bigPath = testInfo.outputPath("robot-test-too-big.docx");
    writeFileSync(bigPath, Buffer.alloc(4_200_000, 0x20));
    await addForm.locator('input[type="file"]').setInputFiles(bigPath);
    await expect(addForm.getByText(/over 4 MB/)).toBeVisible({ timeout: 10_000 });

    // The two formats CR1 added carry the server's own checks, both made before
    // anything is stored: a PNG needs the code LOGO, and an SVG may not script.
    const pngPath = testInfo.outputPath("robot-test-logo.png");
    writeFileSync(pngPath, "not really a logo");
    await submitAddForm("T99", pngPath);
    await expect(addForm.getByText(/doesn’t match its code/)).toBeVisible({
      timeout: 30_000,
    });
    const svgPath = testInfo.outputPath("robot-test-layout.svg");
    writeFileSync(
      svgPath,
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
    await submitAddForm("SVG-9", svgPath);
    await expect(addForm.getByText(/it has a script element/)).toBeVisible({
      timeout: 30_000,
    });

    // A tiny Word file goes through and lands in the list. This screen reads a
    // .docx by its name only, so a zip's first bytes are enough.
    const docxPath = testInfo.outputPath("robot-test-template.docx");
    writeFileSync(docxPath, Buffer.from([0x50, 0x4b, 0x05, 0x06, ...new Array(18).fill(0)]));
    await submitAddForm("T99", docxPath);
    await expectSaved(title);

    // A row's code says what it is, so it cannot be edited into something untrue.
    await m.getByRole("button", { name: `Edit “${title}”` }).click();
    const renameForm = m
      .locator("form")
      .filter({ has: m.getByRole("button", { name: "Save name" }) });
    for (const [code, refusal] of [
      ["LOGO", /doesn’t match its code/],
      ["OV", /already has its Overview/],
      ["T01", /already has a file with the code T01/],
    ] as const) {
      await renameForm.locator('input[name="code"]').fill(code);
      const answered = serverAnswered();
      await renameForm.getByRole("button", { name: "Save name" }).click();
      await answered;
      await expect(renameForm.getByText(refusal)).toBeVisible({ timeout: 30_000 });
    }
    await openFocusArea();

    // A real PNG and a clean SVG go through as well, each under its own code.
    const realPngPath = testInfo.outputPath("robot-test-real-logo.png");
    writeFileSync(
      realPngPath,
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64",
      ),
    );
    const cleanSvgPath = testInfo.outputPath("robot-test-clean-layout.svg");
    writeFileSync(
      cleanSvgPath,
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
    );
    const logoTitle = `ROBOT TEST template ${runId} logo (delete me)`;
    const layoutTitle = `ROBOT TEST template ${runId} layout (delete me)`;
    for (const [code, path, rowTitle] of [
      ["LOGO", realPngPath, logoTitle],
      ["SVG-9", cleanSvgPath, layoutTitle],
    ]) {
      await m.getByRole("button", { name: "+ Add template" }).click();
      await submitAddForm(code, path, rowTitle);
      await expectSaved(rowTitle);
    }

    // The partner side serves them: the topic's grid now carries all three.
    const approved = await roleContext(browser, baseURL!, "approved");
    const p = await approved.newPage();
    const robotRowsOnSetup = async () => {
      await p.goto("/setup");
      const html = await p.content();
      return [title, logoTitle, layoutTitle].filter((t) => html.includes(t)).length;
    };
    await expect.poll(robotRowsOnSetup, { timeout: 60_000 }).toBe(3);

    // And each row hands its file over, under the name it was uploaded with: the stored
    // key ends in the file's own name since CR1.
    const panel = await openPanel(p, "/setup", "find-and-prepare-the-space");
    for (const [name, fileName] of [
      [`Download Word File: ${title}`, "robot-test-template.docx"],
      [`Download Logo: ${logoTitle}`, "robot-test-real-logo.png"],
      [`Download Editable Layout: ${layoutTitle}`, "robot-test-clean-layout.svg"],
    ]) {
      const row = panel.getByRole("button", { name, exact: true });
      await expect(row).toBeVisible({ timeout: 30_000 });
      const waiting = p.waitForEvent("download", { timeout: 45_000 });
      await row.click();
      expect((await waiting).suggestedFilename()).toBe(fileName);
    }

    // And all are deleted again — typed-name confirmation, store back as it was.
    await deleteRobotTemplates();
    await expect.poll(robotRowsOnSetup, { timeout: 60_000 }).toBe(0);
    await approved.close();
  } finally {
    // NEVER leave a robot template in the store.
    await deleteRobotTemplates().catch(() => {});
    await admin.close();
  }
});

test("AD-006 (J10): a video link pasted in the CMS goes live with no code change, and comes off again", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(360_000);
  /* The owner adds finished videos without a sprint, so this is the promise: paste a
     link, save, and the partner's button works; clear it, and the placeholder is back.
     Both kinds of placement: the four on /dashboard (Pages screen) and the 22 on the
     focus-area cards (Focus areas screen). The link is a well-formed id that is no video. */
  const LINK = "https://www.youtube.com/watch?v=aaaaaaaaaaa";
  const admin = await roleContext(browser, baseURL!, "admin");
  const m = await admin.newPage();
  // Every step is bounded, so a stuck one fails here while the page is still alive for the
  // clean-up below. A test that times out closes the browser before its finally can work.
  m.setDefaultTimeout(60_000);
  const approved = await roleContext(browser, baseURL!, "approved");
  const p = await approved.newPage();

  const savePage = async (value: string) => {
    await m.goto("/admin/content/pages?page=setup");
    const field = m.locator('input[name="youtubeUrl"]').filter({ visible: true }).first();
    await expect(field).toBeVisible({ timeout: 60_000 });
    await field.fill(value);
    await m.getByRole("button", { name: "Save", exact: true }).click();
  };
  const editFocusArea = async () => {
    await m.goto("/admin/content/focus-areas");
    await m
      .locator("tbody tr")
      .filter({ hasText: "Get Ready to Open" })
      .first()
      .getByRole("button", { name: "Edit" })
      .click();
    const field = m.locator('input[name="youtubeUrl"]').filter({ visible: true }).first();
    await expect(field).toBeVisible({ timeout: 60_000 });
    return field;
  };
  // Bounded: with nothing changed this button stays disabled, and a click would wait out
  // the whole test and report that instead of the real failure.
  const pressSave = () =>
    m.getByRole("button", { name: /^Save/ }).first().click({ timeout: 30_000 });
  const saveFocusArea = async (value: string) => {
    const field = await editFocusArea();
    await field.fill(value);
    await pressSave();
  };
  const guideText = m.locator('textarea[name="simpleGuideMd"]');
  const saved = () => expect(m.getByText("Saved.").first()).toBeVisible({ timeout: 30_000 });
  // Set just before the first Save on the card: that Save is meant to be refused, and if a
  // bug lets it through, the link and the edited guide are what the clean-up must put back.
  let guideBefore: string | null = null;
  const dashboardVideos = () => p.getByRole("link", { name: "Watch Video" });
  const cardVideos = () =>
    p.locator("#topic-get-ready-to-open").getByRole("link", { name: "Watch Video" });

  try {
    // The Overview: refused when it is not YouTube, live when it is, for that card only.
    await savePage("https://example.com/a-video");
    await expect(m.getByText(/doesn’t look like a YouTube link/)).toBeVisible({ timeout: 30_000 });
    await expect(
      m.locator('input[name="youtubeUrl"]').filter({ visible: true }).first(),
    ).toHaveValue("https://example.com/a-video");
    await savePage(LINK);
    await expect(m.getByText("Saved.")).toBeVisible({ timeout: 30_000 });
    await p.goto("/dashboard");
    await expect(dashboardVideos()).toHaveCount(1, { timeout: 60_000 });
    await expect(dashboardVideos()).toHaveAttribute("href", LINK);
    await expect(dashboardVideos()).toHaveAttribute("target", "_blank");
    await expect(
      p.getByRole("button", { name: "Watch Video. Video coming soon." }),
    ).toHaveCount(3);

    // A refusal loses nothing, and writes nothing: what was typed stays for correcting, and
    // the photo does not drop to the select's first option, which a second Save would write.
    const field = await editFocusArea();
    const photo = m.locator('select[name="imagePath"]');
    const photoBefore = await photo.inputValue();
    expect(photoBefore, "this card needs a photo to lose").not.toBe("");
    const guideNow = await guideText.inputValue();
    const edited = `${guideNow}\nNever saved: this Save is refused.`;
    await guideText.fill(edited);
    await field.fill("https://example.com/a-video");
    guideBefore = guideNow;
    await pressSave();
    await expect(m.getByText(/doesn’t look like a YouTube link/)).toBeVisible({ timeout: 30_000 });
    await expect(field).toHaveValue("https://example.com/a-video");
    await expect(guideText).toHaveValue(edited);
    await expect(photo).toHaveValue(photoBefore);
    // And the store says so, read back from the server.
    await expect(await editFocusArea()).toHaveValue("");
    await expect(guideText).toHaveValue(guideNow);

    // A focus-area card, the same way.
    await saveFocusArea(LINK);
    await saved();
    await p.goto("/setup");
    await expect(cardVideos()).toHaveAttribute("href", LINK, { timeout: 60_000 });
    await expect(p.getByRole("link", { name: "Watch Video" })).toHaveCount(1);
  } finally {
    // NEVER leave a link behind: CT-009 expects all 26 back on the placeholder. Each wait
    // for "Saved." follows a press that worked, so a Save with nothing to do costs no more.
    await savePage("").then(saved).catch(() => {});
    if (guideBefore !== null) {
      const original = guideBefore;
      await editFocusArea()
        .then(async (field) => {
          if ((await guideText.inputValue()) !== original) await guideText.fill(original);
          await field.fill("");
          await pressSave();
          await saved();
        })
        .catch(() => {});
    }
  }

  // Cleared, and every one of them says so again.
  await p.goto("/dashboard");
  await expect(
    p.getByRole("button", { name: "Watch Video. Video coming soon." }),
  ).toHaveCount(4, { timeout: 60_000 });
  await expect(dashboardVideos()).toHaveCount(0);
  await p.goto("/setup");
  await expect(p.locator("#topic-get-ready-to-open")).toBeVisible({ timeout: 60_000 });
  await expect(cardVideos()).toHaveCount(0);

  await approved.close();
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
    /* The refusal itself: the row is already showing, so its being visible straight
       after the click would pass before the server had answered. */
    await expect(m.getByText("You can’t remove your own admin access.")).toBeVisible({
      timeout: 30_000,
    });
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
