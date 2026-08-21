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

  // Signed in: true — and still nothing else.
  const context = await browser.newContext({
    baseURL,
    storageState: ROLES.approved.storageState,
  });
  const signedIn = await context.request.get("/api/auth/session");
  expect(signedIn.status()).toBe(200);
  const body = await signedIn.json();
  expect(body).toEqual({ authed: true });
  const raw = await signedIn.text();
  expect(raw.includes("@"), "an email leaked from the session probe").toBe(false);
  await context.close();
});
