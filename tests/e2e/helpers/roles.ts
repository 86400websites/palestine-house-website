/* The four test roles — the spine of the Launch Gate
   (docs/testing-setup/TESTING-GUIDE.md §4).

   The three signed-in robots live in the NON-PRODUCTION Supabase project only
   (docs/testing-setup/SETUP-CHECKLIST.md "Test users — the rules"). Their
   addresses use the RFC 2606 reserved `.invalid` TLD, which can never receive
   mail, and their display names announce what they are. Emails are recorded
   here and in docs/FEATURE-LIST.md so any later reader knows these accounts
   are robots; passwords live only in the runner's environment
   (.env.local locally — gitignored), never in a commit and never in chat. */

export type RoleName = "pending" | "approved" | "admin";

export const ROLES: Record<
  RoleName,
  {
    email: string;
    fullName: string;
    passwordEnvVar: string;
    storageState: string;
  }
> = {
  /* Account exists, is_approved = false — the exact shape of "someone who
     shouldn't get in". The core invariant of the site. */
  pending: {
    email: "e2e-pending-partner@robot-test.invalid",
    fullName: "ROBOT TEST Pending Partner",
    passwordEnvVar: "E2E_PENDING_PASSWORD",
    storageState: "playwright/.auth/pending.json",
  },
  /* is_approved = true — proves the platform actually works. */
  approved: {
    email: "e2e-approved-partner@robot-test.invalid",
    fullName: "ROBOT TEST Approved Partner",
    passwordEnvVar: "E2E_APPROVED_PASSWORD",
    storageState: "playwright/.auth/approved.json",
  },
  /* In the admins table — /admin/* works for them and 404s for everyone else. */
  admin: {
    email: "e2e-hq-admin@robot-test.invalid",
    fullName: "ROBOT TEST HQ Admin",
    passwordEnvVar: "E2E_ADMIN_PASSWORD",
    storageState: "playwright/.auth/admin.json",
  },
};

export function rolePassword(role: RoleName): string {
  const name = ROLES[role].passwordEnvVar;
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Test-account passwords live in the runner's ` +
        "environment only (.env.local locally). Run " +
        "`pnpm exec tsx tests/e2e/setup/create-test-users.ts` to (re)create " +
        "the robots — see tests/e2e/README.md.",
    );
  }
  return value;
}
