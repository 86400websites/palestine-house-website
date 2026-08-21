# Morning Check — Daily Watch on the Live Site

> **This is a SKELETON. The `[BRACKETS]` stay brackets in this file, forever.** Copy the workflow out to `.github/workflows/morning-check.yml`, fill the copy, leave this original alone — same rule as [`docs/templates/`](../../templates/README.md).
>
> ⛔ **Installed at SYS1 · installed-as-disabled and switched on in SYS2.** There is no test runner in this repo today — `package.json` defines exactly five scripts (`dev`, `build`, `start`, `lint`, `typecheck`), there is no `tests/e2e/`, and `.github/workflows/` contains exactly one file: `ci.yml`. **`.github/workflows/morning-check.yml` arrives in SYS2.**

After the Launch Gate passes, GitHub re-runs a handful of critical tests against the **live** site every morning and notifies the owner **only on failure**. Silence = all green. This is how a silently broken form or an expired key gets caught before a partner notices.

---

## 🔴 The decision this template does NOT make

A daily run against **Production** is one of two quite different things. This module deliberately does not choose; the owner chooses at activation, and the choice is recorded in [`PROJECT-STATUS.md`](../../PROJECT-STATUS.md) before the workflow is enabled.

### Option A — logged-out only

The run signs in as nobody. It checks:

- the public shell renders clean at both viewports,
- `/apply` loads and its form is present,
- gated URLs correctly bounce an anonymous visitor to `/login`, with no gated string in the response,
- `/admin/*` is unreachable anonymously.

**Cost:** zero standing credentials. Nothing to leak, nothing to rotate, nothing that holds access to partner content.
**Blind spot:** it cannot tell you that a *real approved partner* can still get in this morning. It proves the door is shut, not that the key works.

### Option B — logged-out, plus one dedicated obviously-fake APPROVED production account

Everything in Option A, plus a daily login that proves an approved partner still reaches gated content.

**What it buys:** the login canary — the single failure mode most likely to go unnoticed for days.
**What it costs, stated honestly:** that account is a **real approved account in the production database**. It holds genuine access to all 22 focus areas, every guide and every template. Its password lives as a GitHub Actions secret. A leaked Actions secret is then a leaked partner login, and the account also sits permanently in the production `profiles` table looking like a partner.

If Option B is chosen, these are conditions, not suggestions:

- 🔴 The account is **obviously fake** — a name and address no one could mistake for a real partner, on a domain that cannot receive mail. It never appears in a committed file.
- 🔴 It is used **for nothing else**, ever, by anyone.
- 🔴 It is **read-only in behaviour**: sign in, read one gated page, sign out. It never submits a form, never triggers an email, never writes.
- 🔴 It is **approved, never an admin.** It must not be in the `admins` table.
- 🔴 The owner knows it exists, and a rotation moment is agreed up front.

### Option C — defer the morning check entirely

Also legitimate. SYS2's exit gate in [`ROADMAP.md`](../../ROADMAP.md) accepts the morning-check selection being **"deliberately deferred"**, provided the deferral is recorded. Doing nothing silently is not the same as deciding to wait.

> **Decision record — fill at activation:** Option `[A / B / C]` · chosen by `[NAME]` · `[DATE]` · recorded in `[PROJECT-STATUS.md §N]`

## The standing constraint: Production is read-only to automation

[`BROWSER-TOOLS.md`](../../BROWSER-TOOLS.md) §6 is binding and channel-independent — it applies to Playwright exactly as it applies to a browser tool:

> **On Production the browser tools are READ-ONLY** — navigate, screenshot, read headers, read console. Never submit a form, never create an account, never trigger a write, never exercise a destructive path on Production.

So the morning check **navigates and reads**. It never applies, never contacts, never asks HQ, never approves, never edits content. Two Palestine House specifics make that concrete:

- `/contact` and the Ask HQ form on `/support` send **real email through Resend**. A robot must never submit either, on any environment it does not own.
- `/apply` is sign-up. A robot submission creates a real pending account in the production approvals queue. Never.

The one real production submission stays a human task, by hand, per [`LAUNCH-CHECKLIST.md`](../../LAUNCH-CHECKLIST.md) Phase 3.

## Rules for the selection

- [ ] **Safe-to-repeat only.** Nothing that creates real data — no application, no account, no email to a real inbox.
- [ ] **Small.** A handful of specs tagged `@morning`, proposed by Claude Code and **approved by the owner** before the workflow is enabled. If it grows into the whole suite it stops being a morning check and starts being noise.
- [ ] **Both directions.** At least one "the gate is still shut" assertion — an anonymous visitor denied a gated URL. That is the invariant this site most needs watched.
- [ ] **Nothing that only SYS1.5 will make true.** No 429, no CAPTCHA assertion, until the abuse controls exist ([`PROJECT-STATUS.md`](../../PROJECT-STATUS.md) §7 #1).
- [ ] **Failure notification verified once** — see below. An unverified alert channel is the same as no alert channel.
- [ ] **Any morning-check failure is an incident**, handled through `/handle-error` and the error-tracking module — the same lane as everything else, **activated in SYS3**.

## The workflow file → `.github/workflows/morning-check.yml`

🔴 **This is a NEW, SEPARATE file.** It never modifies [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml), and it must never reuse or rename that workflow's job. `ci.yml`'s job id `verify`, display name `Install · Typecheck · Lint · Build`, is the **branch-protection required check** (**D-SYS-4**, and the file carries its own warning). Renaming or colliding with it either locks the merge button forever or leaves the protection rule pointing at a check nobody emits.

The checkout step, Corepack, `setup-node` and the Node version below mirror `ci.yml` deliberately — one repo, one toolchain. *(`actions/upload-artifact` has no counterpart in `ci.yml`; SYS2 pins it to the current major itself.)*

```yaml
name: Morning Check

on:
  schedule:
    # GitHub cron is UTC. Pick a time the owner will actually read the email.
    - cron: "[MM] [HH] * * *"   # [HH:MM UTC] = [local time for the owner]
  workflow_dispatch:            # manual run from the Actions tab, anytime

permissions:
  contents: read

concurrency:
  group: morning-check
  cancel-in-progress: true

jobs:
  # Any name EXCEPT the ci.yml job. Never "verify".
  morning-check:
    name: Morning Check — production canary
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      NEXT_TELEMETRY_DISABLED: "1"
    steps:
      - name: Checkout
        uses: actions/checkout@v6

      # pnpm version comes from the "packageManager" field in package.json.
      - name: Enable Corepack
        run: corepack enable

      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install browser
        run: pnpm exec playwright install --with-deps chromium

      - name: Run @morning tests against production
        run: pnpm exec playwright test --grep "@morning"
        env:
          PLAYWRIGHT_BASE_URL: ${{ vars.PRODUCTION_URL }}
          # ── Option B ONLY. Delete these two lines entirely for Option A. ──
          # A dedicated, obviously-fake APPROVED production account. Never an admin.
          # Values live only in GitHub Actions secrets — never in a file, never in chat.
          # MORNING_TEST_EMAIL: ${{ secrets.MORNING_TEST_EMAIL }}
          # MORNING_TEST_PASSWORD: ${{ secrets.MORNING_TEST_PASSWORD }}

      - name: Upload failure artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: morning-check-[DATE]
          path: "[playwright-report/ and/or test-results/ — set to match the config SYS2 writes]"
          retention-days: 7
```

> ⚠️ **Screenshots of gated pages are gated content.** If Option B is chosen, a failure artifact can contain real partner-facing material. Either keep artifacts to the logged-out specs, or keep the retention short and the artifacts private. Never attach one to a public issue or paste one into chat.

## Setup notes

- [ ] **👤 Owner:** GitHub repo → **Settings → Secrets and variables → Actions** → add the **variable** `PRODUCTION_URL` (the live site address). Under Option B, add the two **secrets** named above as well. Values go **only** into that screen — never into a file, never into `.env.example`, never into chat, never into a message to any agent.
- [ ] **Claude Code:** tag the owner-approved specs `@morning`, add the workflow through the normal PR flow ([`WORKFLOW.md`](../../WORKFLOW.md) §10–§12), and confirm the tagged set matches the approved list **exactly** — not a spec more.
- [ ] **Claude Code:** ship it **disabled** first (SYS2 Part 2), and enable it only after the gate is green and the owner has answered the Option A/B/C decision above.

## How the alert reaches you

GitHub emails the repo owner automatically when a scheduled workflow **fails**. To make sure it is on:

- [ ] **👤 Owner:** GitHub → avatar → **Settings → Notifications → Actions** → check **"Only notify for failed workflows"**, with email as a channel.
- [ ] **👤 Owner + Claude Code:** verify once. Claude Code triggers a deliberately failing manual run; the owner confirms the email arrived; Claude Code removes the deliberate failure **in the same sprint**. An unverified alert channel is the same as no alert channel — the same standard SYS3 applies to Sentry.

## When a morning check fails

Do not panic-fix on `main`. [`WORKFLOW.md`](../../WORKFLOW.md) §3 and §15 still apply on a bad morning; they apply *most* on a bad morning.

Say: **"/handle-error — the morning check failed today, here's the email."** It goes down the normal incident lane: understand what actually happened → severity → a fix through branch → PR → Preview → review → merge → and the fixed thing earns a **permanent regression test** in the suite, so the same failure cannot silently return. If it is a production outage rather than a defect, [`ROLLBACK.md`](../../ROLLBACK.md) and [`ROLLBACK-RUNBOOK.md`](../../ROLLBACK-RUNBOOK.md) are the other lane.

*(The `/handle-error` skill is installed; the Sentry half of that lane is **activated in SYS3**.)*
