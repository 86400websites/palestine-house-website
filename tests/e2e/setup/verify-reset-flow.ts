/* MN-003 — the password-reset walk, robot-driven, operator-assisted.

   WHAT WAS PROVEN ON 2026-08-22 (evidence in the test report):
     ✅ the request is accepted and Supabase issues a real one-time recovery
        token, and fires the recovery email (auth log: mail.send, type
        recovery)
     ✅ that token, used on /auth/confirm?...&type=recovery, is ACCEPTED — the
        browser lands on /update-password with the set-password form
     ✅ a garbage or expired token fails closed to /forgot-password with no
        session, and the request answers identically for a known and an
        unknown address (automated: AC-013, green every run)
     ⚠️ the FINAL submit (type the new password → "Done. You can sign in
        now." → sign in with it) is still unproven by robot. Two blockers,
        both environmental, neither a site defect: Supabase's address
        validator refuses further recovery tokens for undeliverable
        addresses, and SUPABASE_SECRET_KEY (which would let the admin API
        mint a link without email) is not in the local .env.local.

   TO CLOSE IT, either:
     (a) add SUPABASE_SECRET_KEY for the NON-PRODUCTION project to .env.local
         and re-run this tool — the `link` mode then mints the token with no
         email at all; or
     (b) one human walk with a deliverable inbox, once (~2 minutes).

   The robots' `.invalid` addresses can never receive mail (by design), so the
   one-time recovery token cannot arrive in an inbox. This tool splits the walk
   so the operator supplies the token from the NON-PRODUCTION database instead:

     1) pnpm exec tsx tests/e2e/setup/verify-reset-flow.ts request
        → the robot submits /forgot-password for the pending robot, exactly as
          a person would. Supabase stores a one-time recovery token.
     2) The operator reads auth.users.recovery_token for the pending robot
        from the NON-PRODUCTION project (supabase-test MCP — never prod).
     3) pnpm exec tsx tests/e2e/setup/verify-reset-flow.ts complete <token> temp
        → the robot opens the same /auth/confirm link the email would carry,
          sets a temporary password, sees "Done. You can sign in now.", and
          PROVES it by signing in with the new password.
     4) request again, read the fresh token, then:
        pnpm exec tsx tests/e2e/setup/verify-reset-flow.ts complete <token> original
        → restores the robot's stored password the same way, leaving
          everything exactly as found.

   The token is single-use, expires in an hour, and belongs to a robot on the
   non-production project — it unlocks nothing real. Passwords are read from
   the runner's env and never printed. */

import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { ROLES } from "../helpers/roles";

process.loadEnvFile(".env.local");

const BASE = process.env.PLAYWRIGHT_BASE_URL;
if (!BASE) {
  console.error("PLAYWRIGHT_BASE_URL is not set. Nothing was done.");
  process.exit(1);
}
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const original = process.env[ROLES.pending.passwordEnvVar];
if (!original) {
  console.error(`${ROLES.pending.passwordEnvVar} missing from the environment.`);
  process.exit(1);
}
const TEMP = `${original}Xreset1`;

async function main() {
  const [mode, token, which] = process.argv.slice(2);

  if (mode === "link") {
    /* Mint the recovery token through the auth admin API — no email sender,
       no address validator, so the robot's `.invalid` address works. The key
       is read from .env.local and NEVER printed; only the token_hash is
       echoed, and that is single-use, one-hour, robot-only, non-production. */
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY;
    if (!url || !secret) {
      console.error(
        "Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY (non-production) in .env.local.",
      );
      process.exit(1);
    }
    if (!url.includes("sdszcralogcrujtyghig")) {
      console.error("REFUSING: that URL is not the non-production project.");
      process.exit(1);
    }
    const admin = createClient(url, secret, { auth: { persistSession: false } });
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: ROLES.pending.email,
    });
    if (error) {
      console.error(`generateLink failed: ${error.message}`);
      process.exit(1);
    }
    console.log(`TOKEN_HASH=${data.properties.hashed_token}`);
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: BASE,
    extraHTTPHeaders: bypass ? { "x-vercel-protection-bypass": bypass } : undefined,
  });
  const page = await context.newPage();

  if (mode === "request") {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(ROLES.pending.email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await page.waitForTimeout(3_000);
    console.log(
      "Reset requested for the pending robot. Now read auth.users.recovery_token " +
        "from the NON-PRODUCTION project and run: complete <token> temp|original",
    );
  } else if (mode === "complete" && token && (which === "temp" || which === "original")) {
    const target = which === "temp" ? TEMP : original!;
    await page.goto(
      `/auth/confirm?token_hash=${encodeURIComponent(token)}&type=recovery&next=/update-password`,
    );
    await page.waitForURL(/update-password/, { timeout: 30_000 });
    await page.getByLabel("New password", { exact: true }).fill(target);
    await page.getByLabel("Confirm new password").fill(target);
    await page.getByRole("button", { name: "Update password" }).click();
    await page
      .getByText("Done. You can sign in now.")
      .waitFor({ state: "visible", timeout: 30_000 });

    // Prove it: the freshly set password signs in.
    await page.goto("/login");
    await page.getByLabel("Email").fill(ROLES.pending.email);
    await page.getByLabel("Password").fill(target);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/dashboard", { timeout: 45_000 });
    console.log(
      `OK: reset link accepted, "${which}" password set, and it signs in ` +
        "(landed on the pending dashboard).",
    );
  } else {
    console.error("Usage: request | complete <token_hash> temp|original");
    await browser.close();
    process.exit(1);
  }
  await browser.close();
}
void main();
