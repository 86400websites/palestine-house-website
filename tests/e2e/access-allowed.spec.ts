import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  ADMIN_ROUTES,
  PLATFORM_ROUTES,
  SECTION_TOPIC_COUNTS,
  attachConsoleCapture,
  discoverPlatformContent,
  expectClean,
  hasHorizontalScroll,
  openPanel,
  panelGroup,
  type PlatformContent,
} from "./helpers/app";
import { ROLES } from "./helpers/roles";

/* Sections B/C of docs/FEATURE-LIST.md — the ALLOWED half: the platform
   actually works for the people it exists for.

   Focus-area titles and slugs are public (/focus-areas, and this repo). The titles
   of the private files are not: where a test needs one it reads it off the page at
   run time and never commits it. */

let content: PlatformContent;

test.beforeAll(async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  content = await discoverPlatformContent(browser, baseURL!);
});

const SHARED_HEADING = "Shared resources from other focus areas";
const WORD = "Download Word File";
const LAYOUT = "Download Editable Layout";

/* Who borrows what (CR1): section → focus-area slug → its shared rows, each as
   badge · home focus area · download label. Written out rather than imported from
   src/lib/workspace-v2/shared-resources.ts so the suite stays an independent
   witness. 10 focus areas, 13 rows (docs/content-refresh-cr1-reconciliation.md). */
const SHARED_ROWS: Record<string, Record<string, [string, string, string][]>> = {
  "/setup": {
    "get-legally-ready": [["1.5", "Get Ready to Open", WORD]],
    "find-and-prepare-the-space": [["1.5", "Get Ready to Open", WORD]],
  },
  "/operate": {
    money: [["2.6", "Conduct a Monthly Check-Up", WORD]],
    "members-and-visitors": [["3.5", "Learn from the Event", WORD]],
  },
  "/program": {
    "plan-the-calendar": [["3.2", "Plan an Event", WORD]],
    "plan-an-event": [
      ["3.5", "Learn from the Event", WORD],
      ["3.5", "Learn from the Event", WORD],
    ],
    "connect-to-the-wider-palestine-house-network": [
      ["4.4", "Ask the Community for Help", WORD],
    ],
  },
  "/support": {
    marketing: [
      ["3.4", "Promote the Event", WORD],
      ["3.4", "Promote the Event", LAYOUT],
      ["3.4", "Promote the Event", LAYOUT],
    ],
    "sponsorship-fundraising": [["4.3", "Build Partnerships", WORD]],
    "learn-from-other-palestine-houses": [
      ["4.4", "Ask the Community for Help", WORD],
    ],
  },
};

/* Press a download control and prove a real file arrived through a signed URL, not
   just a link. Returns the name the browser would save it under. */
async function downloadVia(
  page: Page,
  control: Locator,
  what: string,
): Promise<string> {
  await expect(control, `${what}: no control`).toBeVisible({ timeout: 20_000 });
  await control.scrollIntoViewIfNeeded();
  const waiting = page.waitForEvent("download", { timeout: 45_000 });
  await control.click();
  const file = await waiting;
  // A boolean, so a failure never prints the URL and the token in it.
  expect(file.url().includes("/object/sign/"), `${what}: not a signed URL`).toBe(true);
  const path = await file.path();
  expect(path, `${what}: no file arrived`).toBeTruthy();
  expect(statSync(path!).size, `${what}: empty download`).toBeGreaterThan(1_000);
  return file.suggestedFilename();
}

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

  test("PG-008 (noindex): the gated pages say noindex", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
      "content",
      /noindex/,
      { timeout: 30_000 },
    );
  });

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

  test("CT-001: the sections list 5 · 6 · 6 · 5 focus areas — 22 in all, holding 83 templates", async ({
    page,
  }) => {
    let total = 0;
    let templates = 0;
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
      // The proof number, counted behind the gate: each focus area's pill counts
      // its own templates, so an Overview or a shared row can never inflate this.
      const pills = await page.$$eval(".pw-meta-pill", (els) =>
        els.map((el) => parseInt(el.textContent ?? "", 10)),
      );
      expect(pills.length, `${section} focus areas with templates`).toBe(expected);
      templates += pills.reduce((sum, n) => sum + n, 0);
    }
    expect(total).toBe(22);
    expect(
      templates,
      "the template count behind the gate (a leftover ROBOT TEST template shows here: delete it by hand, the journeys that sweep it will not run)",
    ).toBe(83);
  });

  test("CT-002: a focus area shows exactly the private model", async ({
    page,
  }) => {
    // Get Legally Ready: its one template is the logo, and it borrows one shared
    // resource, so the pill below has something to be wrong about.
    const panel = await openPanel(page, "/setup", "get-legally-ready");

    // A closed card beside it: summary + Read more + Explore + Watch Video, and a
    // panel that stays shut. What Read more discloses is private and stays
    // unasserted; only that it opens and closes.
    const closed = page.locator("#topic-plan-the-money");
    const more = page.locator("#topic-plan-the-money-intro");
    await expect(closed.locator(".pw-topic-desc")).toBeVisible();
    await expect(closed.locator(".pw-topic-desc")).not.toBeEmpty();
    await expect(closed.getByRole("button", { name: /^Explore/ })).toBeVisible();
    await expect(closed.getByRole("button", { name: "Watch Video" })).toBeVisible();
    await expect(page.locator("#topic-plan-the-money-body")).toBeHidden();
    await expect(more).toBeHidden();
    await closed.getByRole("button", { name: "Read more" }).click();
    await expect(more).toBeVisible();
    await closed.getByRole("button", { name: "Show less" }).click();
    await expect(more).toBeHidden();

    // The open panel: two resource-introduction lines, then the groups, each its
    // own distinct thing. CR1 put its new layout in here, so it has to fit at 320px.
    expect(await hasHorizontalScroll(page), "open panel scrolls sideways").toBe(false);
    await expect(panel.locator(".pw-resource-intro p")).toHaveCount(2);

    // Overview: one download row, badged OV. A row, deliberately not a card.
    const overview = panelGroup(panel, "Overview");
    await expect(overview.locator(".pw-template-row")).toHaveCount(1);
    await expect(overview.locator(".pw-template-code")).toHaveText("OV");
    const overviewDownload = overview.getByRole("button", {
      name: /^Download Word File: /,
    });
    await expect(overviewDownload).toBeVisible();

    // Simple Guide: the ONE card on the panel (D-PP-f). It carries the document's
    // own title, so only its presence is asserted, and that it is not the generic
    // name the card falls back to when the guide row is missing.
    const guide = panelGroup(panel, "Simple Guide");
    await expect(panel.locator(".pw-start-card")).toHaveCount(1);
    await expect(guide.locator(".pw-start-card")).toHaveCount(1);
    await expect(guide.locator(".pw-start-title")).not.toBeEmpty();
    await expect(guide.locator(".pw-start-title")).not.toHaveText("Simple Guide");
    await expect(guide.getByRole("link", { name: /^Read Now/ })).toHaveAttribute(
      "href",
      "/setup/get-legally-ready/guide",
    );
    await expect(
      guide.getByRole("button", { name: WORD, exact: true }),
    ).toBeVisible();
    await expect(guide.locator(".pw-template-row")).toHaveCount(0);

    // Templates: this focus area's own files, each labelled by what it is. The
    // Overview is not among them, and the pill does not count the shared row.
    const templates = panelGroup(panel, "Templates");
    await expect(templates.locator(".pw-template-code")).toHaveText(["LOGO"]);
    await expect(templates.locator(".pw-template-kind")).toHaveText(["Download Logo"]);
    await expect(
      templates.getByRole("button", { name: /^Download Logo: / }),
    ).toBeVisible();
    const overviewName = await overviewDownload.getAttribute("aria-label");
    await expect(
      templates.getByRole("button", { name: overviewName!, exact: true }),
    ).toHaveCount(0);
    await expect(panelGroup(panel, SHARED_HEADING).locator(".pw-template-row")).toHaveCount(1);
    await expect(templates.locator(".pw-meta-pill")).toHaveText(/^1 file/);

    // And none of the retired card types exist in this model. ("Overview" left
    // this list at CR1: it is a group now, and still not a card.)
    for (const retired of ["Checklist", "Watch out for"]) {
      expect(
        await page.getByRole("heading", { name: retired }).count(),
        `retired "${retired}" card rendered`,
      ).toBe(0);
    }

    // Explore is how a partner opens every focus area; the deep link above is only
    // how this suite gets here. One open at a time, so the first panel closes.
    await closed.getByRole("button", { name: /^Explore/ }).click();
    await expect(page.locator("#topic-plan-the-money-body")).toBeVisible();
    await expect(panel).toBeHidden();
    await expect(closed.getByRole("button", { name: /^Back to Main Menu/ })).toBeVisible();
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

  test("CT-004: a template, the guide and the Overview download through a signed URL and the bytes arrive", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    // Plan the Finances: all Word files, so "Download Word File" can be held to
    // its word. The file's name comes from the storage key (CR1).
    const panel = await openPanel(page, "/setup", "plan-the-money");
    const template = await downloadVia(
      page,
      panelGroup(panel, "Templates")
        .getByRole("button", { name: /^Download Word File: / })
        .first(),
      "a template",
    );
    expect(template, "the template's file name").toMatch(/\.docx$/i);
    const guide = await downloadVia(
      page,
      panelGroup(panel, "Simple Guide").getByRole("button", { name: WORD, exact: true }),
      "the Simple Guide",
    );
    expect(guide, "the guide's file name").toMatch(/\.docx$/i);
    const overview = await downloadVia(
      page,
      panelGroup(panel, "Overview").getByRole("button", {
        name: /^Download Word File: /,
      }),
      "the Overview",
    );
    expect(overview, "the Overview's file name").toMatch(/\.docx$/i);
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
      await page.getByRole("button", { name: "Search Resources" }).first().click();
      await expect(input).toBeVisible({ timeout: 15_000 });
    }
    /* The overlay is a NATIVE <dialog> — implicit dialog role, no role
       attribute, so '[role="dialog"]' never matches it (first-run lesson).
       Results render inside .pw-search-results as links. */
    const dialog = page.locator("dialog.pw-overlay");

    // The empty field offers the four shortcuts. They resolve by exact title and
    // an unresolved one silently drops out, so a retitled card shows up here.
    await expect(dialog.locator(".pw-search-shortcut")).toHaveText(
      [
        /Get Ready to Open/,
        /Manage Daily House Operations/,
        /Plan the Programming Calendar/,
        /Ask the Community for Help/,
      ],
      { timeout: 30_000 },
    );

    // A focus area's full title reaches all four kinds of entry. Only the kinds
    // are asserted; the file titles beside them stay out of this repo.
    await input.fill(content.gatedMarkers[0]);
    const results = dialog.locator(".pw-search-results a[href]");
    const kind = (label: string) =>
      dialog.locator(".pw-result-kind").filter({ hasText: new RegExp(`^${label}$`) });
    for (const label of ["FOCUS AREA", "OVERVIEW", "GUIDE", "TEMPLATE"]) {
      await expect(kind(label).first(), `no ${label} result`).toBeVisible({
        timeout: 30_000,
      });
    }

    // Four chips still; an Overview narrows under Guides, never under Templates.
    await expect(dialog.locator(".pw-filter-chip")).toHaveText([
      "All",
      "Focus Areas",
      "Guides",
      "Templates",
    ]);
    await dialog.getByRole("button", { name: "Guides", exact: true }).click();
    await expect(kind("OVERVIEW").first()).toBeVisible();
    await expect(kind("GUIDE").first()).toBeVisible();
    await expect(kind("TEMPLATE")).toHaveCount(0);
    await expect(kind("FOCUS AREA")).toHaveCount(0);
    await dialog.getByRole("button", { name: "All", exact: true }).click();

    await expect(results.first()).toBeVisible({ timeout: 30_000 });
    const href = await results.first().getAttribute("href");
    await results.first().click();
    await page.waitForURL(`**${href}`);
  });

  test("CT-006 (same page): choosing a hit for a card on this very page opens the card", async ({
    page,
  }) => {
    /* Link changes a fragment with pushState, which fires no hashchange, so this
       once scrolled to the card and left it shut, while the same hit from any other
       page opened it. Found at CR1, whose shortcuts lead here. */
    await page.goto("/setup");
    await page.waitForSelector('a[href$="/guide"]', {
      state: "attached",
      timeout: 60_000,
    });
    await page.getByRole("button", { name: "Search Resources" }).first().click();
    const dialog = page.locator("dialog.pw-overlay");
    const shortcut = dialog
      .locator(".pw-search-shortcut")
      .filter({ hasText: "Get Ready to Open" });
    await expect(shortcut).toBeVisible({ timeout: 30_000 });
    await shortcut.click();
    await expect(dialog).toBeHidden({ timeout: 15_000 });
    await expect(page.locator("#topic-get-ready-to-open.is-open")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("CT-008: a shared resource shows under the focus areas that borrow it, badged with its home — and is indexed once", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    let borrowers = 0;
    let rows = 0;
    for (const [section, expected] of Object.entries(SHARED_ROWS)) {
      await page.goto(section);
      await page.waitForSelector('a[href$="/guide"]', {
        state: "attached",
        timeout: 60_000,
      });
      // Panels are server-rendered while closed, so all of them can be read here.
      // Only the focus areas in the table carry the group at all.
      await expect(
        page
          .locator(".pw-topic-body section")
          .filter({
            has: page.getByRole("heading", {
              name: SHARED_HEADING,
              exact: true,
              includeHidden: true,
            }),
          }),
        `${section} focus areas with shared resources`,
      ).toHaveCount(Object.keys(expected).length);

      for (const [slug, shared] of Object.entries(expected)) {
        const group = panelGroup(page.locator(`#topic-${slug}-body`), SHARED_HEADING);
        await expect(group.locator(".pw-template-code"), `${slug} badges`).toHaveText(
          shared.map(([badge]) => badge),
        );
        const names = await group
          .locator(".pw-template-download")
          .evaluateAll((els) => els.map((el) => el.getAttribute("aria-label") ?? ""));
        shared.forEach(([, home, label], i) => {
          expect(
            names[i].startsWith(`${label}: `) && names[i].endsWith(` (${home})`),
            `${slug} row ${i + 1} is not labelled "${label}" with its home "${home}"`,
          ).toBe(true);
        });
        borrowers += 1;
        rows += names.length;
      }
    }
    expect(borrowers).toBe(10);
    expect(rows).toBe(13);

    // As a partner meets it: Manage Marketing borrows the Word file and both
    // editable layouts from Promote the Event. The pill still counts its own files
    // only, and the shared layout really downloads.
    const panel = await openPanel(page, "/support", "marketing");
    expect(await hasHorizontalScroll(page), "open panel scrolls sideways").toBe(false);
    const own = panelGroup(panel, "Templates");
    const ownRows = await own.locator(".pw-template-row").count();
    await expect(own.locator(".pw-meta-pill")).toHaveText(new RegExp(`^${ownRows} file`));
    const shared = panelGroup(panel, SHARED_HEADING);
    await expect(shared).toBeVisible();
    const layout = await downloadVia(
      page,
      shared.getByRole("button", { name: /^Download Editable Layout: / }).first(),
      "a shared layout",
    );
    expect(layout, "the shared layout's file name").toMatch(/\.svg$/i);

    // One file, one search result: indexed at its home, never again at the card
    // that borrows it. The title is read from the row, so it is not committed here.
    const rowName = await shared.locator(".pw-template-download").first().getAttribute("aria-label");
    const title = rowName!.replace(/^[^:]+: /, "").replace(/ \([^)]*\)$/, "");
    await page.getByRole("button", { name: "Search Resources" }).first().click();
    await page.getByPlaceholder(/Search focus areas/).fill(title);
    const templateHits = () =>
      page.$$eval(
        "dialog.pw-overlay .pw-search-result",
        (hits, wanted) =>
          hits
            .filter(
              (hit) =>
                hit.querySelector(".pw-result-kind")?.textContent === "TEMPLATE" &&
                hit.querySelector(".pw-result-title")?.textContent === wanted,
            )
            .map((hit) => hit.querySelector(".pw-result-path")?.textContent ?? ""),
        title,
      );
    await expect.poll(templateHits, { timeout: 30_000 }).toHaveLength(1);
    expect((await templateHits())[0], "indexed away from its home").toContain(
      "Promote the Event",
    );
  });

  test("CT-009: all 26 Watch Video placements are disabled buttons with the message, none a link, and pressing one on each page toasts", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const placements: Record<string, number> = {
      "/dashboard": 4,
      ...SECTION_TOPIC_COUNTS,
    };
    let total = 0;
    for (const [path, expected] of Object.entries(placements)) {
      await page.goto(path);
      // The exact accessible name is the message: disabled, and it says why.
      const videos = page.getByRole("button", {
        name: "Watch Video. Video coming soon.",
        exact: true,
        disabled: true,
      });
      // A journey that crashed before clearing its link leaves one here: clear it in the CMS.
      await expect(videos, `${path} placements`).toHaveCount(expected, {
        timeout: 60_000,
      });
      await expect(
        page.getByRole("link", { name: "Watch Video" }),
        `${path} links a video`,
      ).toHaveCount(0);
      total += expected;
      // A press before hydration does nothing, so press until the toast answers.
      // Pressing twice only restarts it, which is also why this presses one per page:
      // the next press would find the last one's toast still showing and prove nothing.
      // force: the robot waits for an aria-disabled control to enable, and a person does
      // not; this is what a person pressing it gets.
      const toast = page.locator(".pw-toast");
      await expect(async () => {
        await videos.first().click({ force: true });
        await expect(toast).toHaveText("Video coming soon.", { timeout: 2_000 });
      }).toPass({ timeout: 30_000 });
      await expect(page, `${path}: Watch Video navigated`).toHaveURL(
        new RegExp(`${path}$`),
      );
    }
    expect(total).toBe(26);
  });

  test("CT-010: the banner and footer Community Contacts links land on the /support block", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    for (const name of ["Request Community Contacts", "Community Contacts"]) {
      await page.goto("/dashboard");
      const link = page
        .locator("footer.pw-footer")
        .getByRole("link", { name, exact: true });
      await expect(link, `${name} target`).toHaveAttribute(
        "href",
        "/support#community-contacts",
      );
      await link.click();
      await page.waitForURL("**/support#community-contacts", { timeout: 45_000 });
      const block = page.locator("section#community-contacts");
      await expect(block).toBeVisible({ timeout: 45_000 });
      // Visible is not landed: the block sits below every card on the page, so this
      // is what proves the page scrolled to it. The scroll can be smooth, hence the wait.
      await expect(block).toBeInViewport({ timeout: 15_000 });
    }
  });

  test.describe("a click that is lost, not slow", () => {
    /* No retry, for the same reason nothing here clicks twice: a second try is what hid
       this bug, so a pass on the retry must not read as a pass. */
    test.describe.configure({ retries: 0 });

    test("CT-012: a link to a gated page answers the first click", async ({
      page,
    }, testInfo) => {
      /* React could drop the wake-up for a navigation whose data had already arrived, so
         the click did nothing and only a second one worked. patches/next@15.5.28.patch
         carries React's own fix. Two checks, because the bug is a race. Reading the copy
         of React this checkout ships is certain, and the clicks prove the behaviour:
         patches/README.md has what they caught with the fix taken out. */
      test.setTimeout(480_000);
      const shipped = readFileSync(
        join(
          process.cwd(),
          "node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.production.js",
        ),
        "utf8",
      );
      expect(
        shipped.includes("0 === (executionContext & 2) && prepareFreshStack(root, 0)"),
        "React's fix is missing: see patches/README.md",
      ).toBe(false);

      /* The header's tabs on a desktop; on a phone the closed menu's links exist but cannot
         be pressed, so the footer's. Half the clicks are section to guide, the route that
         lost the most before the fix. */
      const tabs = testInfo.project.name.startsWith("mobile") ? "footer.pw-footer" : "header nav";
      const toGuide = [
        "/setup#topic-get-ready-to-open",
        '#topic-get-ready-to-open a[href="/setup/get-ready-to-open/guide"]',
      ];
      const clicks = [
        ["/operate", `${tabs} a[href="/program"]`],
        toGuide,
        ["/program", `${tabs} a[href="/support"]`],
        toGuide,
        ["/support", `${tabs} a[href="/setup"]`],
        toGuide,
      ];
      for (let round = 0; round < 3; round += 1) {
        for (const [from, selector] of clicks) {
          const link = page.locator(selector).filter({ visible: true }).first();
          // A slow load may be tried again. The click never is.
          await expect(async () => {
            await page.goto(from);
            await expect(link, `${from} offers ${selector}`).toBeVisible({ timeout: 45_000 });
          }).toPass({ timeout: 120_000 });
          // Hydrated, so the router takes this click: before that, the browser would simply
          // follow the link and this would prove nothing.
          await expect
            .poll(
              () =>
                link.evaluate((a) => Object.keys(a).some((key) => key.startsWith("__reactProps$"))),
              { timeout: 45_000 },
            )
            .toBe(true);
          // A deep link's highlight ends in a React update, which would rescue a lost click.
          await expect(page.locator(".pw-topic.is-flash")).toHaveCount(0, { timeout: 10_000 });
          await page.evaluate(() => {
            (window as unknown as { ct012?: boolean }).ct012 = true;
          });
          await link.click();
          await page.waitForURL(`**${selector.match(/href="([^"]+)"/)![1]}`, {
            timeout: 45_000,
          });
          expect(
            await page.evaluate(() => (window as unknown as { ct012?: boolean }).ct012),
            `${from}: the click reloaded the page instead of using the router`,
          ).toBe(true);
        }
      }
    });
  });

  test("CT-011: the private chrome carries the community wording", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveTitle(/^Overview\b/);
    // DOM-checked, so the 320px menu state does not matter.
    const nav = await page.$$eval('nav[aria-label="Community platform"] a', (as) =>
      as.map((a) => [a.textContent, a.getAttribute("href")]),
    );
    expect(nav).toEqual([
      ["Overview", "/dashboard"],
      ["Setup", "/setup"],
      ["Operate", "/operate"],
      ["Program", "/program"],
      ["Support", "/support"],
    ]);
    await expect(page.locator('header a[href="/account"]')).toHaveText(
      "Community Platform",
    );
    // The banner's search entry and the footer column's.
    await expect(
      page
        .locator("footer.pw-footer")
        .getByRole("button", { name: "Search Resources", exact: true }),
    ).toHaveCount(2);
    // Hidden parts of the shell count too (the mobile panel), so textContent.
    const shell = await page.locator(".pw-root").textContent();
    for (const retired of ["Partner Platform", "Ask HQ", "Search all resources"]) {
      expect(shell, `the shell still says "${retired}"`).not.toContain(retired);
    }
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

  test("PG-008 (noindex): the admin pages say noindex", async ({ page }) => {
    await page.goto("/admin/approvals");
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
      "content",
      /noindex/,
      { timeout: 30_000 },
    );
  });

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
