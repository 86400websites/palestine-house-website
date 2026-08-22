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
import { createClient } from "@supabase/supabase-js";
import { ROLES, rolePassword } from "./helpers/roles";

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
        /* "/login?next=" — the app's real redirect signature. A bare
           "/login" would be satisfied by the public header's own Sign in
           link, which every 200 carries, so it proved nothing (D-SYS-1
           review finding F4). */
        expect(
          body,
          `${path} carries no redirect instruction to the sign-in page`,
        ).toContain("/login?next=");
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
        /* "/login?next=" — the app's real redirect signature. A bare
           "/login" would be satisfied by the public header's own Sign in
           link, which every 200 carries, so it proved nothing (D-SYS-1
           review finding F4). */
        expect(
          body,
          `${path} carries no redirect instruction to the sign-in page`,
        ).toContain("/login?next=");
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

  test("AC-003 (raw): nothing gated is in the pending partner's RESPONSES either", async ({
    request,
  }) => {
    /* The check above reads the finished page. This one reads what the server
       actually SENT to the pending session — raw HTML and the RSC payload.
       The PP8 8-k failure shape (content streamed, then replaced by React) is
       invisible to page.content() and visible here, and that shape is exactly
       what SECURITY-CHECKLIST §15 exists to catch.

       This probe was recorded as shipped in the D-SYS-1 review record and was
       NOT actually present — the script that wrote it aborted before saving,
       and nobody re-checked. A post-merge audit caught the false record. The
       lesson this project already had: a step that reports success still has
       to be verified. The `request` fixture inherits this describe's pending
       storageState. */
    test.setTimeout(180_000);
    for (const path of [...PLATFORM_ROUTES, ...content.guideLinks]) {
      for (const headers of [undefined, { RSC: "1" }] as const) {
        const { body } = await probe(request, path, headers);
        expectNoGatedStrings(body, `pending ${path}${headers ? " (RSC)" : ""}`);
        expect(
          body.includes('/guide"'),
          `pending partner was sent a guide link in ${path}`,
        ).toBe(false);
      }
    }
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

  test("CT-005 (denied half): the ISSUER refuses a pending caller — no signed URL exists to leak", async ({
    page,
  }) => {
    /* Attack the issuer, not the button. A pending partner sees no Download
       control at all (AC-003), so "no storage request fired" is nearly
       trivially true and would stay green even if get_resource_download lost
       its is_approved() check. This calls the RPC that mints signed URLs
       directly — as the approved robot (must WORK, proving the probe is
       real) and as the pending robot (must return NOTHING).
       (D-SYS-1 review finding F3.) */
    test.setTimeout(120_000);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(
      Boolean(url && key),
      "Supabase env vars missing — cannot probe the issuer",
    ).toBe(true);

    const listAs = async (role: "approved" | "pending") => {
      const client = createClient(url!, key!, { auth: { persistSession: false } });
      const { error: signInError } = await client.auth.signInWithPassword({
        email: ROLES[role].email,
        password: rolePassword(role),
      });
      expect(signInError, `${role} robot could not sign in`).toBeNull();
      const { data } = await client.rpc("get_resources");
      /* NO signOut() here. Its default scope is GLOBAL: it revokes every
         session that robot holds server-side, including the stored sessions
         the other specs are using in parallel — which is exactly what
         AC-010 taught this suite, and what this probe reintroduced on its
         first run (15 spurious auth timeouts). The client is created with
         persistSession:false, so there is nothing local to clean up. */
      return ((data ?? []) as { id: string }[]);
    };

    const downloadAs = async (role: "approved" | "pending", resourceId: string) => {
      const client = createClient(url!, key!, { auth: { persistSession: false } });
      await client.auth.signInWithPassword({
        email: ROLES[role].email,
        password: rolePassword(role),
      });
      const result = await client.rpc("get_resource_download", { p_id: resourceId });
      /* NO signOut() here. Its default scope is GLOBAL: it revokes every
         session that robot holds server-side, including the stored sessions
         the other specs are using in parallel — which is exactly what
         AC-010 taught this suite, and what this probe reintroduced on its
         first run (15 spurious auth timeouts). The client is created with
         persistSession:false, so there is nothing local to clean up. */
      return result;
    };

    // The approved robot lists templates — a REAL resource id, and proof the
    // probe below is not shooting at a blank.
    const rows = await listAs("approved");
    expect(rows.length, "approved robot listed no templates").toBeGreaterThan(0);
    const realId = rows[0].id;

    // Same id, approved caller: the issuer WORKS.
    const allowed = await downloadAs("approved", realId);
    expect(
      ((allowed.data ?? []) as unknown[]).length,
      "the issuer refused an APPROVED partner — this probe is not measuring the gate",
    ).toBeGreaterThan(0);

    // Same id, pending caller: NOTHING — no row, so no bucket, no path, no URL.
    const denied = await downloadAs("pending", realId);
    expect(
      ((denied.data ?? []) as unknown[]).length,
      "🔴 the download issuer returned a row to a PENDING partner",
    ).toBe(0);
    const serialised = JSON.stringify(denied);
    expect(serialised.includes("storage/v1"), "storage path leaked to pending").toBe(
      false,
    );
    expect(serialised.includes('"resources"'), "bucket name leaked to pending").toBe(
      false,
    );

    // And the passive check stays: nothing in the UI even asks for a file.
    const storageRequests: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("storage/v1")) storageRequests.push(r.url());
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
