import { expect, test } from "@playwright/test";
import { ROLES } from "./helpers/roles";

/* Section G of docs/FEATURE-LIST.md. IN-002 (Mailchimp stays a clean no-op)
   is proven by the applicant journey succeeding end to end with Mailchimp
   absent — see journeys.spec.ts J2; it needs no spec of its own. */

test("IN-001: the session probe reveals a boolean and nothing else", async ({
  request,
  browser,
  baseURL,
}) => {
  // Anonymous: false — and no other keys, no identity, ever.
  const anon = await request.get("/api/auth/session");
  expect(anon.status()).toBe(200);
  const anonBody = await anon.json();
  expect(anonBody).toEqual({ authed: false });

  // Signed in: true — and still nothing else. Asserted the way the header
  // actually uses it (an in-page fetch), polled because the probe validates
  // the session against the free-tier auth server, which can be slow under
  // parallel load.
  const context = await browser.newContext({
    baseURL,
    storageState: ROLES.approved.storageState,
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect
    .poll(
      async () =>
        page.evaluate(async () => {
          const res = await fetch("/api/auth/session", { cache: "no-store" });
          return res.text();
        }),
      { timeout: 30_000 },
    )
    .toBe(JSON.stringify({ authed: true }));
  await context.close();
});
