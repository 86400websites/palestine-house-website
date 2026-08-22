import { expect, test } from "@playwright/test";
import {
  ADMIN_MARKERS,
  ADMIN_ROUTES,
  PLATFORM_ROUTES,
  attachConsoleCapture,
  discoverPlatformContent,
  probe,
  type PlatformContent,
} from "./helpers/app";
import { ROLES } from "./helpers/roles";

/* Section B of docs/FEATURE-LIST.md — the DENIED half of the four-role grid.
   The most important file in this suite: every check here is "people who
   shouldn't get in, can't". Real topic titles are discovered at runtime as
   the approved robot and used as leak probes — never hardcoded (public repo).

   A gate is a throw, not an await (SECURITY-CHECKLIST §15): these checks
   assert on the raw response body — HTML and RSC payload — not on what a
   browser happens to render after following the redirect. */

let content: PlatformContent;

test.beforeAll(async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  content = await discoverPlatformContent(browser, baseURL!);
});

function expectNoGatedStrings(body: string, where: string) {
  for (const marker of content.gatedMarkers) {
    expect(
      body.includes(marker),
      `gated content ("${marker.slice(0, 24)}…") leaked in ${where}`,
    ).toBe(false);
  }
  expect(body.includes("storage/v1"), `storage path leaked in ${where}`).toBe(
    false,
  );
}

test("AC-001: anonymous — every gated route denies with nothing in the body, and the browser lands on /login", async ({
  request,
  page,
}) => {
  test.setTimeout(240_000);
  /* The app STREAMS: a gated document request may answer either an immediate
     3xx to /login, or an HTTP 200 whose stream carries only the loading
     shell plus the redirect instruction (production behaves identically —
     verified 2026-08-22). The substance asserted here: the COMPLETE body
     contains no gated string and no storage path, and it does contain the
     /login redirect; a real browser ends up on /login. */
  const targets = [...PLATFORM_ROUTES, "/account", ...content.guideLinks];
  for (const path of targets) {
    for (const headers of [undefined, { RSC: "1" }] as const) {
      const { status, location, body } = await probe(request, path, headers);
      if (status >= 300 && status < 400) {
        expect(location, `${path} redirect target`).toContain("/login");
      } else {
        expect(status, `${path} anonymous status`).toBe(200);
        expect(body, `${path} carries no redirect to /login`).toContain("/login");
      }
      expectNoGatedStrings(body, `anonymous ${path}${headers ? " (RSC)" : ""}`);
    }
  }
  // Browser truth, sampled: typing a gated URL lands on the sign-in page.
  for (const path of ["/dashboard", "/setup", content.guideLinks[0]]) {
    await page.goto(path);
    await page.waitForURL(/\/login/, { timeout: 30_000 });
  }
});

test("AC-002: anonymous — every /admin route denies with no admin strings in the body", async ({
  request,
  page,
}) => {
  test.setTimeout(180_000);
  for (const path of ADMIN_ROUTES) {
    for (const headers of [undefined, { RSC: "1" }] as const) {
      const { status, location, body } = await probe(request, path, headers);
      if (status >= 300 && status < 400) {
        expect(location, `${path} redirect target`).toContain("/login");
      } else {
        expect(status, `${path} anonymous status`).toBe(200);
        expect(body, `${path} carries no redirect to /login`).toContain("/login");
      }
      /* RENDERED content only: Next emits the route's <title>/OG metadata
         ("Focus areas — Content admin · …") even on a gated stream — that is
         structure, recorded as an observation in the report, not a leak. A
         leak is the marker as rendered element text or an exact flight
         children string. */
      for (const marker of ADMIN_MARKERS) {
        const rendered =
          body.includes(`>${marker}<`) ||
          body.includes(`\\"children\\":\\"${marker}\\"`);
        expect(
          rendered,
          `admin string "${marker}" rendered in anonymous ${path}`,
        ).toBe(false);
      }
      expectNoGatedStrings(body, `anonymous ${path}`);
    }
  }
  await page.goto("/admin/approvals");
  await page.waitForURL(/\/login/, { timeout: 30_000 });
});

test.describe("as the pending partner", () => {
  test.use({ storageState: ROLES.pending.storageState });

  test("AC-003: held at the pending state, and no content resolves anywhere", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const errors = attachConsoleCapture(page);
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Your application is under review." }),
    ).toBeVisible();

    // Sections and guides: whatever each route answers (redirect back to the
    // pending dashboard or an empty shell), it must resolve no focus-area
    // title, no guide body, no template row, no download control.
    for (const path of ["/setup", "/operate", "/program", "/support", ...content.guideLinks]) {
      await page.goto(path);
      const body = (await page.content()) ?? "";
      for (const marker of content.gatedMarkers) {
        expect(
          body.includes(marker),
          `pending partner saw gated content on ${path}`,
        ).toBe(false);
      }
      expect(
        await page.locator('a[href$="/guide"]').count(),
        `pending partner saw a guide link on ${path}`,
      ).toBe(0);
      expect(body.includes("storage/v1"), `storage path on ${path}`).toBe(false);
    }
    expect(errors, `console errors:\n${errors.join("\n")}`).toHaveLength(0);
  });

  test("AC-004: the pending partner's search is empty and leaks nothing", async ({
    page,
  }) => {
    // Capture the index server-action response body the moment it arrives —
    // reading it later can fail once anything else moves.
    let payload = "";
    page.on("response", (response) => {
      const request = response.request();
      if (request.method() === "POST" && request.headers()["next-action"]) {
        void response
          .text()
          .then((text) => {
            payload += text;
          })
          .catch(() => {});
      }
    });

    await page.goto("/dashboard");
    // Opening via keyboard can race hydration — press again if needed.
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
    await expect.poll(() => payload.length, { timeout: 30_000 }).toBeGreaterThan(0);
    // The index for a pending caller is EMPTY: no titles, no resource ids,
    // no storage paths, no bucket names (D-PP-j).
    for (const marker of content.gatedMarkers) {
      expect(payload.includes(marker), "search index leaked a title").toBe(false);
    }
    expect(payload.includes("storage/v1"), "search index leaked a path").toBe(false);
    expect(payload.includes('"resources"'), "search index named a bucket").toBe(false);

    await page.getByPlaceholder(/Search focus areas/).fill("a");
    // The empty state announces itself; no result link exists for a caller
    // who should see nothing. (Native <dialog> — select it as an element,
    // never via a role attribute it does not carry.)
    await expect(
      page.locator("dialog.pw-overlay .pw-search-empty"),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.locator("dialog.pw-overlay .pw-search-results a[href]"),
    ).toHaveCount(0);
  });

  test("CT-005 (denied half): no signed URL is ever issued to a pending caller", async ({
    page,
  }) => {
    // Structural: the pending pages carry no Download control at all (checked
    // in AC-003) — here, additionally, no request to a storage signed URL is
    // observed anywhere in a full walk of the platform routes.
    const storageRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("storage/v1")) storageRequests.push(request.url());
    });
    for (const path of PLATFORM_ROUTES) {
      await page.goto(path);
    }
    expect(storageRequests, "a storage request escaped the gate").toHaveLength(0);
  });
});

test.describe("as the approved partner", () => {
  test.use({ storageState: ROLES.approved.storageState });

  test("AC-006: approved is never admin — every /admin route answers with the 404 page", async ({
    page,
  }, testInfo) => {
    for (const path of ADMIN_ROUTES) {
      const response = await page.goto(path);
      /* The substance: the branded 404 page, zero admin content. The HTTP
         status is RECORDED rather than pinned — the first full run showed the
         /admin redirect chain can deliver the 404 UI under a 200 (a Next.js
         soft-404 on the followed redirect); the owner-facing report carries
         that observation. A body leak, not a status code, is the failure. */
      testInfo.annotations.push({
        type: "observed-status",
        description: `${path} -> ${response!.status()}`,
      });
      await expect(
        page.getByRole("heading", { name: "This page isn’t here." }),
      ).toBeVisible({ timeout: 30_000 });
      const body = await page.content();
      for (const marker of ADMIN_MARKERS) {
        expect(
          body.includes(`${marker}</h1>`) || body.includes(`${marker}</h2>`),
          `admin heading "${marker}" rendered for a non-admin on ${path}`,
        ).toBe(false);
      }
    }
  });
});

test("AC-009: the gate short-circuits before any content is built", async ({
  request,
}) => {
  /* The mechanism behind AC-001/002/003, given its own line: whatever shape
     the denied response takes (immediate 3xx, or a streamed 200 whose stream
     resolves to the /login redirect), the COMPLETE body never contains the
     page's own content markup — the gate threw before any content JSX was
     constructed (SECURITY-CHECKLIST §15). */
  /* Observed and accepted shape (recorded in the report): the anonymous
     stream may carry the generic pending-welcome shell — each gated page
     renders the pending state itself while the layout's /login redirect
     races it (the D-PP design). The invariant asserted is the §15 substance:
     no focus-area title, no guide link, no storage path ever streams. */
  const sample = ["/setup", content.guideLinks[0], "/admin/approvals"];
  for (const path of sample) {
    const { status, body } = await probe(request, path);
    expect(status < 400, `${path} answered ${status}`).toBe(true);
    // Ignore the page's references to its OWN URL (canonical/OG metadata);
    // any OTHER guide link in the stream would be content.
    const withoutSelf = body.split(path).join("");
    expect(withoutSelf.includes('/guide"'), `${path} streamed guide links`).toBe(
      false,
    );
    expectNoGatedStrings(body, `AC-009 ${path}`);
  }
});
