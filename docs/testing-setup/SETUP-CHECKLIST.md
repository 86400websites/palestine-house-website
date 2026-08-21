# Testing Setup — One-Time Checklist

The one-time setup that turns testing into a single ask forever after: `/activate-testing`.

> ## ✅ PART 1 DONE AT SYS1 · PARTS 2–4 RUNNING AT SYS2 (started 2026-08-22)
>
> Installed at **SYS1** (2026-08-22). **Activation began at SYS2 — "Testing launch gate"** ([`ROADMAP.md`](../ROADMAP.md) §B, Stage 5) on branch `claude/sprint-sys2-testing-launch-gate`. Each box below is ticked only when the work is actually done; the per-box state notes say what remains.

Every box says **who** does it and **where it stands today**. The owner's total hands-on time across the whole thing is about 20 minutes.

**Prerequisites, all already satisfied here:** the site lives in a GitHub repo, deploys to Vercel with PR Previews, and has a **non-production Supabase project** separate from Production ([`PROJECT-STATUS.md`](../PROJECT-STATUS.md) §6, [`SUPABASE-MCP-SAFETY.md`](../SUPABASE-MCP-SAFETY.md)).

**Not applicable here and deliberately deleted rather than marked N/A:** every payment, Stripe and test-card step from the source SOP. Palestine House has no payment surface of any kind.

---

## Part 1 — Put the files in place

**State: ✅ DONE at SYS1, 2026-08-22. This install is what did it.**

- [x] **Owner:** decided the module goes in at SYS1 so SYS2 can be started by name. *(Done — the SOP source folder was consumed by this install; the module is now permanently in-repo.)*
- [x] **Claude Code:** `activate-testing` placed at `.claude/skills/activate-testing/SKILL.md`. *(Done — alongside the existing `sprint-prompt`, `close` and `browser-qa` skills.)*
- [x] **Claude Code:** the guide, this checklist and the three templates placed under `docs/testing-setup/`. *(Done — see [`00-START-HERE.md`](./00-START-HERE.md).)*
- [x] **Claude Code:** every file states that the module is installed but not activated, and names SYS2 as the sprint that activates it. *(Done.)*

Nothing in Part 1 installed a package, wrote a test, or changed anything under `src/`. That was the scope fence, and it held.

## Part 2 — Install the tester (one normal PR) — **SYS2**

**State: ✅ DONE at SYS2, 2026-08-22 — except the environment-separation confirmation, blocked on the Part 3 bypass (Preview protection is ON, so the Preview cannot be read until the bypass exists).**

- [x] **Claude Code:** add `@playwright/test` as a **dev** dependency with **pnpm** (`pnpm add -D @playwright/test`) — never npm, never yarn. Free software: no account, no key, no cost. Commit the updated `pnpm-lock.yaml`. *(Done — `@playwright/test` 1.62, lockfile committed.)*
- [x] **Claude Code:** create the Playwright config. Tests live in `tests/e2e/`. The target URL comes from the `PLAYWRIGHT_BASE_URL` environment variable (name only — the value is supplied per run, never committed). Two browser profiles: **desktop and 320px**. *(Done — `playwright.config.ts`: desktop 1440×900 + mobile 320×568; no default target, refuses to run without one.)*
  - ⚠️ **320px, not 390px.** This repo's own gates require desktop **and 320px** ([`DESIGN.md`](../DESIGN.md) §10, [`QA-CHECKLIST.md`](../QA-CHECKLIST.md) → "The two viewports"). The SYS2 row in [`ROADMAP.md`](../ROADMAP.md) still carries the SOP's generic **390px** — that is the source SOP's default, not a Palestine House decision. Build the profile at 320px and correct the roadmap row in the same PR, or have the owner confirm otherwise. Do not silently ship the narrower coverage.
- [x] **Claude Code:** one auth-setup step per role — **anonymous · pending partner · approved partner · HQ admin**. Anonymous needs no state; the other three each need a stored session. *(Done — `tests/e2e/auth.setup.ts` signs each role in through the real `/login` form; sessions stored under gitignored `playwright/.auth/`.)*
- [x] **Claude Code:** create the test users. **See the rules below — this is the box most worth getting exactly right.** *(Done 2026-08-22, non-production project only, via `tests/e2e/setup/create-test-users.ts` — the real `signUp` door, `.invalid` addresses, passwords generated into the local gitignored `.env.local` and nowhere else. Approval/admin flips applied through the `supabase-test` MCP. Emails recorded in `tests/e2e/README.md` and, when generated, `docs/FEATURE-LIST.md`.)*
- [ ] **Claude Code:** confirm environment separation before a single test runs: *(pending — blocked on the Part 3 bypass; verified the moment the Preview is readable, before the smoke test)*
  - Preview and Development env vars point at the **non-production** Supabase project, Production points at Production ([`PROJECT-STATUS.md`](../PROJECT-STATUS.md) §6). Verify, do not assume.
  - ⚠️ **Resend is set in Preview too.** `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `RESEND_TO_EMAIL` are configured in **both** Production and Preview, so a Preview `/contact` or Ask HQ submission **delivers a real email to a real inbox** ([`BROWSER-TOOLS.md`](../BROWSER-TOOLS.md) §6). Robot submissions must be unmistakably marked as tests, kept few, and flagged to the owner before the run.
  - If anything live-keyed turns up in Preview, **stop and report** — that is a blocker per [`ENV-VARS-SAFETY.md`](../ENV-VARS-SAFETY.md) and [`SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) §12.
- [x] **Claude Code:** add the morning-check workflow from [`templates/MORNING-CHECK-TEMPLATE.md`](./templates/MORNING-CHECK-TEMPLATE.md) as a **new** file at `.github/workflows/morning-check.yml`, **disabled** — it is switched on only after the gate passes and the owner has answered its open decision. *(Done — schedule commented out; manual dispatch cannot reach any site while the `PRODUCTION_URL` variable is unset; `ci.yml` untouched.)*
  - 🔴 **Never touch [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) to do this.** Its job display name — `Install · Typecheck · Lint · Build`, job id `verify` — is the branch-protection required check. Renaming it breaks merges or, worse, leaves the rule pointing at a check nobody emits (**D-SYS-4**; the file itself carries the warning).
- [x] **Claude Code:** decide and record whether a `test` script is added to `package.json`. [`QA-CHECKLIST.md`](../QA-CHECKLIST.md) Part 1 says *"`package.json` defines exactly five scripts … never invent a sixth."* SYS2 is the sprint entitled to change that. Whatever is chosen, update that line in `QA-CHECKLIST.md`, `TECHNICAL-INTEGRITY.md` and `LAUNCH-CHECKLIST.md` in the same PR so no doc is left asserting "no test script" after one exists. *(Decided 2026-08-22: the sixth script is **`test:e2e`**, deliberately not `test` — a script named `test` would be auto-invoked by `CLAUDE.md`'s after-task ritual and `/close`, and the suite cannot run without a deployed Preview URL; the compliance audit recorded this exact reasoning. All three docs updated in this PR, plus the other stale "no test script" lines repo-wide.)*

### Test users — the rules, not the preference

- 🔴 **Non-production Supabase project only. Never production.** Not "carefully in production", not "one small one in production". Never. This mirrors the governing rule in [`SUPABASE-MCP-SAFETY.md`](../SUPABASE-MCP-SAFETY.md): Claude builds and proves on test; the human ships to production; Claude may verify production but never change it. The one exception anywhere in this module is the morning check, which is a separate decision with its own risk write-up ([`templates/MORNING-CHECK-TEMPLATE.md`](./templates/MORNING-CHECK-TEMPLATE.md)).
- 🔴 **Obviously fake.** Names and email addresses that no human being could mistake for a real partner or a real applicant, on a domain that cannot receive mail. Never a real person's name, never a real inbox, never anything that would look like a genuine applicant in the approvals queue.
- 🔴 **Four roles, and the pending one is not optional:**

  | Test user | What it proves |
  |---|---|
  | **Anonymous** (no account) | Public shell works; every gated URL bounces to `/login` with no gated string in the HTML *or* the RSC payload |
  | **Pending partner** — account exists, `is_approved = false` | **The core invariant.** `/dashboard` shows the pending state; no guide body, topic summary or template row resolves; Ctrl/⌘+K returns an empty index; `/account` is still reachable (the one deliberate exception) |
  | **Approved partner** | The platform actually works: 4 sections · 22 focus areas · 88 templates, guide reader, signed-URL downloads |
  | **HQ admin** (in the `admins` table) | `/admin/*` works for an admin — and 404s for the approved partner above |

  **The pending-partner account is as important as the approved one.** "People who shouldn't get in, can't" is the invariant this site most needs proven, and a pending account is the exact shape of the person who shouldn't get in — it is also the exact shape a bot signup takes, since `/apply` is a public write. A suite that only ever logs in as someone with access has not tested the gate.
- **Record emails, never passwords.** The fake addresses go in `docs/FEATURE-LIST.md` when it is generated, so a later reader knows which accounts are robots. Passwords go in the runner's environment and nowhere else — never a file, never a commit, never chat.
- **This repo is public.** Nothing that identifies a real partner, applicant, admin or inbox belongs in any committed file, ever.

## Part 3 — Unlock the robot's door (only if Previews are password-protected) — **OWNER, then SYS2**

**State: ✅ ANSWERED — protection is ON (verified empirically at SYS2, 2026-08-22: the branch Preview 302s to Vercel SSO). ⏳ The bypass steps below are with the owner.**

Vercel can protect Preview links so strangers cannot see unfinished work. If that protection is on, the robot needs a **sanctioned key** through that door — never a workaround, never a scraped cookie.

Whether it is on **cannot be determined from this repository**: it is a Vercel project setting, not a file. Nothing in `vercel.json`, `next.config.ts` or [`PROJECT-STATUS.md`](../PROJECT-STATUS.md) §6 records it. So this part opens with a question, not an instruction.

- [x] **👤 Owner — first, answer the question:** in Vercel → this project → **Settings → Deployment Protection**, is Preview protection **on or off**? Report the answer; do not paste any screen contents. *(Answered 2026-08-22: **ON** — confirmed both by the owner's settings screenshots and by probing the branch Preview, which redirects to Vercel SSO.)*
- [ ] **👤 Owner:** enable **Protection Bypass for Automation**. Vercel generates a secret for you.
- [ ] **👤 Owner:** add that secret in two places — the Vercel project's **Preview** environment variables, and **GitHub → Settings → Secrets and variables → Actions**. The variable name to use in both is:

  **`VERCEL_AUTOMATION_BYPASS_SECRET`** — *name only.*

  🔴 The **value** is typed directly into those two dashboards and nowhere else. Never into a file, never into a commit, never into `.env.example`, never into chat, never into a message to any agent. [`ENV-VARS-SAFETY.md`](../ENV-VARS-SAFETY.md) and [`WORKFLOW.md`](../WORKFLOW.md) §14 are the binding rules.
- [ ] **👤 Owner:** confirm in the same breath that **Preview still points at the non-production Supabase project** — that is the other half of SYS2's entry gate in [`ROADMAP.md`](../ROADMAP.md).
- [x] **Claude Code:** reference the secret **by name only** in the Playwright config, so test requests carry the bypass header. The name may appear in code and in `.env.example`; the value must never be read, echoed or logged. *(Done — `playwright.config.ts` sends `x-vercel-protection-bypass` when the env var is present. For local gate runs the owner also types the value into the gitignored `.env.local` — the repo's designated local-secret store — which the config loads at runtime without any agent reading it.)*

## Part 4 — Prove it works, then close — **SYS2**

**State: ⛔ NOT DONE.**

- [ ] **Claude Code:** write **one** smoke test — the homepage loads with no console errors — and run it against a **deployed Preview**, not localhost, to prove the pipeline is alive end to end. Local green is necessary and never sufficient ([`WORKFLOW.md`](../WORKFLOW.md) §11).
- [ ] **Claude Code:** run the normal pre-PR checks — `pnpm run typecheck`, `pnpm run lint`, `pnpm run build` ([`WORKFLOW.md`](../WORKFLOW.md) §9) — and confirm CI's `verify` job is green on the head being reviewed.
- [ ] **👤 Owner:** merge the setup PR through the normal workflow: branch → PR → Preview → review → merge ([`WORKFLOW.md`](../WORKFLOW.md) §6, §10–§12). Claude Code does not merge.
  - ⚠️ **The independent review is a merge gate here, not a nicety.** [`WORKFLOW.md`](../WORKFLOW.md) §8 (**D-SYS-1**) makes it mandatory whenever a diff touches auth, the approval gate, RLS/schema, **env handling**, security headers or CSP — and this PR touches env handling (`PLAYWRIGHT_BASE_URL`, the bypass secret, GitHub Actions secrets) and creates stored auth sessions for three roles. Commission it over an immutable `<merge-base>..<head>` range and save the verdict to `docs/code-reviews/`.
- [ ] **Claude Code:** update the trackers in the same PR — [`PROJECT-STATUS.md`](../PROJECT-STATUS.md) and the SYS2 row in [`ROADMAP.md`](../ROADMAP.md) — plus the three docs that currently assert "no automated tests exist": [`QA-CHECKLIST.md`](../QA-CHECKLIST.md) Part 1 → Automated tests, [`LAUNCH-CHECKLIST.md`](../LAUNCH-CHECKLIST.md) → "The two that were never satisfied", and [`TECHNICAL-INTEGRITY.md`](../TECHNICAL-INTEGRITY.md) Wall 4a. Those lines were written honestly; they become wrong the day the suite runs, and a stale honest line is still a wrong line.
- [ ] **👤 Owner:** confirm in one line, dated, that setup is done — in the PR or in `PROJECT-STATUS.md`.

---

**Then the gate itself.** Setup finished is not the gate passed. From here the whole system is: **`/activate-testing`** → approve the feature list → *"run the tests"* → read the report → fix → full re-run → **GO**. See [`TESTING-GUIDE.md`](./TESTING-GUIDE.md) §5.

**SYS2's exit gate**, from [`ROADMAP.md`](../ROADMAP.md): a full run **100% green**, the owner signs the **GO** verdict on the latest report in `docs/test-reports/`, the feature list is approved and committed, and the morning-check selection is agreed **or** deliberately deferred with the deferral recorded.
