import { expect, test } from "@playwright/test";

/* Section F of docs/FEATURE-LIST.md.

   PR-001 / PR-002 / PR-003 (rate limiting, Turnstile) have NO specs here on
   purpose: those controls do not exist yet (PROJECT-STATUS §7 #1; they arrive
   in SYS1.5 — D-SYS-9/D-SYS-11). A spec asserting a control that does not
   exist either fails forever or gets weakened until it lies. The suite
   therefore carries no skipped stubs either — a GO must never ride on a
   skipped test. Their feature-list lines are marked "pending SYS1.5" and the
   specs are added in that sprint, where rejection is the PASS. */

test("PR-004: the six security headers are present and the CSP is the one we ship", async ({
  request,
}) => {
  const response = await request.get("/");
  const headers = response.headers();

  for (const name of [
    "content-security-policy",
    "strict-transport-security",
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy",
  ]) {
    expect(headers[name], `missing header: ${name}`).toBeTruthy();
  }

  /* Shape, not a frozen literal (D-SYS-10 adds the Sentry ingest origin to
     connect-src at SYS3 — this test must not fail that day for no defect). */
  const csp = headers["content-security-policy"];
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("frame-src https://www.youtube-nocookie.com");
  expect(csp).toContain("object-src 'none'");

  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
});
