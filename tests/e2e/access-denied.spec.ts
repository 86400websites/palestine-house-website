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

test("AC-001: anonymous — every gated route redirects to /login with nothing in the body", async ({
  request,
}) => {
  test.setTimeout(180_000);
  const targets = [...PLATFORM_ROUTES, "/account", ...content.guideLinks];
  for (const path of targets) {
    for (const headers of [undefined, { RSC: "1" }] as const) {
      const { status, location, body } = await probe(request, path, headers);
      expect(status, `${path} should redirect anonymously`).toBeGreaterThanOrEqual(300);
      expect(status, `${path} should redirect anonymously`).toBeLessThan(400);
      expect(location, `${path} redirect target`).toContain("/login");
      expectNoGatedStrings(body, `anonymous ${path}${headers ? " (RSC)" : ""}`);
    }
  }
});

test("AC-002: anonymous — every /admin route redirects with no admin strings in the body", async ({
  request,
}) => {
  for (const path of ADMIN_ROUTES) {
    for (const headers of [undefined, { RSC: "1" }] as const) {
      const { status, location, body } = await probe(request, path, headers);
      expect(status, `${path} should redirect anonymously`).toBeGreaterThanOrEqual(300);
      expect(status, `${path} should redirect anonymously`).toBeLessThan(400);
      expect(location, `${path} redirect target`).toContain("/login");
      for (const marker of ADMIN_MARKERS) {
        expect(
          body.includes(marker),
          `admin string "${marker}" leaked in anonymous ${path}`,
        ).toBe(false);
      }
      expectNoGatedStrings(body, `anonymous ${path}`);
    }
  }
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
        await page.getByRole("link", { name: "Read Now" }).count(),
        `pending partner saw a Read Now card on ${path}`,
      ).toBe(0);
      expect(body.includes("storage/v1"), `storage path on ${path}`).toBe(false);
    }
    expect(errors, `console errors:\n${errors.join("\n")}`).toHaveLength(0);
  });

  test("AC-004: the pending partner's search is empty and leaks nothing", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const indexResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        !!response.request().headers()["next-action"],
      { timeout: 30_000 },
    );
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByPlaceholder(/Search focus areas/)).toBeVisible();
    const response = await indexResponse;
    const payload = await response.text();
    // The index for a pending caller is EMPTY: no titles, no resource ids,
    // no storage paths, no bucket names (D-PP-j).
    for (const marker of content.gatedMarkers) {
      expect(payload.includes(marker), "search index leaked a title").toBe(false);
    }
    expect(payload.includes("storage/v1"), "search index leaked a path").toBe(false);
    expect(payload.includes('"resources"'), "search index named a bucket").toBe(false);

    await page.getByPlaceholder(/Search focus areas/).fill("a");
    // No result links appear for a caller who should see nothing.
    await expect(page.locator('[role="dialog"] a[href]')).toHaveCount(0);
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

  test("AC-006: approved is never admin — every /admin route is a 404", async ({
    page,
  }) => {
    for (const path of ADMIN_ROUTES) {
      const response = await page.goto(path);
      expect(response!.status(), `${path} for an approved non-admin`).toBe(404);
      for (const marker of ADMIN_MARKERS) {
        const body = await page.content();
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
  /* The mechanism behind AC-001/002/003: a denied response must be a bare
     redirect. Sampled explicitly here so the invariant has its own line:
     the anonymous response for a content-bearing gated page carries no
     page-own markup at all. */
  const sample = ["/setup", content.guideLinks[0], "/admin/approvals"];
  for (const path of sample) {
    const { status, body } = await probe(request, path);
    expect(status).toBeGreaterThanOrEqual(300);
    expect(status).toBeLessThan(400);
    expect(body.includes("pw-page-title"), `${path} streamed its shell`).toBe(false);
    expectNoGatedStrings(body, `AC-009 ${path}`);
  }
});
