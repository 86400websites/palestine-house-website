import { expect, test as setup } from "@playwright/test";
import { ROLES, rolePassword, type RoleName } from "./helpers/roles";

/* One auth-setup step per role (SETUP-CHECKLIST Part 2): each robot signs in
   once through the real /login form — so every full run also re-proves the
   login path for all three signed-in roles — and saves its session state for
   the role specs to reuse. Anonymous specs simply use no stored state.

   Every role lands on /dashboard after sign-in (the pending partner sees the
   pending state there — that page IS their landing, by design). */

const roles: RoleName[] = ["pending", "approved", "admin"];

for (const role of roles) {
  setup(`sign in: ${role}`, async ({ page }) => {
    const { email, storageState } = ROLES[role];

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(rolePassword(role));
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL("**/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.context().storageState({ path: storageState });
  });
}
