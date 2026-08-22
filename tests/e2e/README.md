# Launch Gate test suite (Playwright)

Installed at **SYS2**. The owner-facing contract is
[`docs/testing-setup/TESTING-GUIDE.md`](../../docs/testing-setup/TESTING-GUIDE.md);
the operator is the [`activate-testing`](../../.claude/skills/activate-testing/SKILL.md)
skill. This suite is the permanent, versioned test asset of the repo — not the
exploratory browser tooling in `docs/BROWSER-TOOLS.md`.

## Environment variables (names only — values NEVER in git or chat)

| Name | What it is | Where the value lives |
|---|---|---|
| `PLAYWRIGHT_BASE_URL` | The deployed Vercel **Preview** under test. Required — there is no default and the suite never targets Production (except approved `@morning` specs via their own workflow). | Per run (shell), optionally `.env.local` |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Vercel's sanctioned Protection Bypass for Automation — only needed if Preview protection is on. | Vercel Preview env + GitHub Actions secrets |
| `E2E_PENDING_PASSWORD` | Pending-partner robot password | `.env.local` (gitignored) — written by the setup script |
| `E2E_APPROVED_PASSWORD` | Approved-partner robot password | same |
| `E2E_ADMIN_PASSWORD` | HQ-admin robot password | same |

## The robot accounts

Non-production Supabase project **only** (`docs/SUPABASE-MCP-SAFETY.md`).
Obviously fake, on the RFC 2606 `.invalid` TLD (cannot receive mail):

- `e2e-pending-partner@robot-test.invalid` — account exists, **not** approved
- `e2e-approved-partner@robot-test.invalid` — approved partner
- `e2e-hq-admin@robot-test.invalid` — approved + in `admins`

(Re)create them: `pnpm exec tsx tests/e2e/setup/create-test-users.ts` —
it hard-refuses to run against anything but the non-production project.

## Running

```
# against a deployed Preview (the normal gate run)
$env:PLAYWRIGHT_BASE_URL = "<preview-url>"   # PowerShell
pnpm run test:e2e
```

The script is deliberately named `test:e2e`, **not** `test`: a script named
`test` would be auto-invoked by the after-task ritual in `CLAUDE.md` and by
the `/close` skill on every future sprint, and this suite cannot run without
a deployed Preview URL (the reasoning is recorded in
`docs/notes/system-compliance-audit-2026-08-21.md`). The launch gate and the
morning check invoke it deliberately; nothing invokes it by accident.

`pnpm run test:e2e` runs every spec at both mandatory viewports (desktop 1440 and
**320px** — `DESIGN.md` §10). Auth sessions are created once per role by
`auth.setup.ts` through the real `/login` form and stored under
`playwright/.auth/` (gitignored).

## Iterating without sending email

The journeys project (`journeys.spec.ts`) sends real, ROBOT-TEST-marked email
from the Preview and never auto-retries. When iterating on anything else, run
the email-free projects only:

```
pnpm run test:e2e -- --project=desktop --project=mobile-320
```

Run the full suite (journeys included) only when the journeys changed or a
verdict needs a full run. The first fix loop ran full ~20 times and put ~60
robot emails in the HQ inbox — once was enough to learn this.

## Rules that bind every spec

- Target Previews, never Production; `@morning`-tagged specs are the only
  sanctioned Production runs, via `.github/workflows/morning-check.yml`.
- No test asserts a `429` or CAPTCHA until SYS1.5 ships those controls, and
  no test hammers `/apply`, `/contact` or Ask HQ — Preview form submissions
  send **real email** (Resend is live in Preview), so writes are few, clearly
  marked as tests, and flagged to the owner first.
- Every protected boundary gets an allowed **and** a denied assertion; denied
  means no gated string in the HTML **or** the RSC payload.
- Artifacts (`test-results/`, `playwright-report/`, traces, screenshots) are
  gitignored evidence — never committed.
