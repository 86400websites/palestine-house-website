# Testing Setup — Start Here

> ## ⛔ INSTALLED, NOT ACTIVATED
>
> These documents were installed at **SYS1** (2026-08-22) from the `Website-Development-System` SOP pack, adapted to this repo. **They are activated in SYS2 — "Testing launch gate"** ([`ROADMAP.md`](../ROADMAP.md) §B, Stage 5).
>
> **Nothing in this folder runs anything today.** As of this install the repo has:
> - **no test runner** — `package.json` defines exactly five scripts: `dev`, `build`, `start`, `lint`, `typecheck`. There is no `test` script and none is being added here.
> - **no `@playwright/test`** dependency, **no `playwright.config`**, **no `tests/e2e/`**.
> - **no `docs/FEATURE-LIST.md`**, **no `docs/test-reports/`**, **no `.github/workflows/morning-check.yml`**.
>
> All of those arrive in **SYS2**. Installing them now was deliberately out of scope: SYS1 is docs-and-config only.

This folder is the **Launch Gate**: the system that proves every feature of the site works — big or small — *before* a real partner finds out that it doesn't.

---

## The retrofit, stated plainly

The SOP assumes the gate goes in before a site launches. **This site launched on 2026-06-19** and has been serving real partners ever since. So this is the retrofit path, and the honest version of it is this:

**Palestine House has been live for two months with no automated tests at all.** Not one. Every release since — S8 through S12, the DR design refresh, the whole eight-sprint Stage 4 platform revamp, and production migration `0034` — was gated by CI (typecheck · lint · build · gitleaks · audit), by manual QA sweeps, and by independent review. That is real work and it found real defects. It is not a repeatable suite, and it proves nothing about any later commit. [`LAUNCH-CHECKLIST.md`](../LAUNCH-CHECKLIST.md) records the same fact under "The two that were never satisfied", and [`QA-CHECKLIST.md`](../QA-CHECKLIST.md) Part 1 → Automated tests carries the unticked box.

So the first full run of this gate will not be a pre-launch formality. It will be **the first measurement ever taken of a running production site**. Expect it to find things. That is the system working.

## What it does, in one paragraph

Claude Code scans the entire repository — not the docs, the actual code: every page, form, Route Handler, RPC, access gate and email trigger — and writes a plain-English list of every feature. **You approve that list.** It then turns every approved line into an automated Playwright test: a robot user that clicks, logs in, fills forms, downloads a template, and tries doors it is not allowed through. The robot runs all the tests, delivers a PASS/FAIL report in plain words, failures become a normal fix sprint, and the gate re-runs until everything is green. Green = good. After that, a small daily "morning check" re-runs the most critical tests against the live site and emails you only when something fails.

**There is no payment step anywhere in this.** Palestine House has no Stripe, no checkout, no card flow and no payment surface of any kind. Every payment and test-card clause from the source SOP has been removed rather than marked N/A, so nobody comes looking for one later.

## The one thing this site most needs proven

The core invariant here is the **approval gate** (`profiles.is_approved`). Four roles use this site:

| Role | What it is |
|---|---|
| **Anonymous visitor** | No session. Public shell only. |
| **Pending partner** | Account exists, `is_approved = false`. Waiting for HQ. |
| **Approved partner** | Full access to the gated platform — 4 sections · 22 focus areas · 88 templates. |
| **HQ admin** | Additionally in the `admins` table, server-checked. |

"People who shouldn't get in, can't" is not one line on the feature list. It is **the** line. Half of every test in the gate is a denied-state assertion, and the pending-partner tests matter as much as the approved-partner ones. See [`SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) §15 for the invariants themselves — read them, do not paraphrase them.

## The five steps

1. **Setup** (once) — [`SETUP-CHECKLIST.md`](./SETUP-CHECKLIST.md). Part 1 is done; Parts 2–4 are SYS2.
2. **Feature list** — Claude Code drafts it; **you approve it** (your ten most important minutes).
3. **Tests written** — one test per approved line, including every denied state for all four roles.
4. **Run → report** — full run, plain-English PASS/FAIL report with severities.
5. **Fix → re-run → GO** — failures become a fix sprint; failed tests re-run while fixing; the **full suite** re-runs before the GO verdict.

Then: approve the morning-check selection (or defer it — see below) and record the result.

## Files in this folder

| File | What it is | Who reads it | State |
|---|---|---|---|
| [`TESTING-GUIDE.md`](./TESTING-GUIDE.md) | The plain-English guide to the whole system | **The owner** — read this first | Installed, filled for this repo |
| [`SETUP-CHECKLIST.md`](./SETUP-CHECKLIST.md) | The one-time setup, box by box, marked Owner / Claude Code with each box's real current state | Owner + Claude Code | Installed; Part 1 done, Parts 2–4 pending SYS2 |
| [`templates/FEATURE-LIST-TEMPLATE.md`](./templates/FEATURE-LIST-TEMPLATE.md) | Skeleton for the feature list you approve | Claude Code fills, owner approves | Skeleton — `[BRACKETS]` stay |
| [`templates/TEST-REPORT-TEMPLATE.md`](./templates/TEST-REPORT-TEMPLATE.md) | Skeleton for the PASS/FAIL report | Claude Code fills, owner reads | Skeleton — `[BRACKETS]` stay |
| [`templates/MORNING-CHECK-TEMPLATE.md`](./templates/MORNING-CHECK-TEMPLATE.md) | The daily GitHub check + how alerts reach you | Claude Code installs, owner approves | Skeleton — carries one **unresolved decision** for the owner |

The three template files are **skeletons on purpose**. Copy them out, fill the copy, leave the original alone — the same rule as [`docs/templates/`](../templates/README.md).

## Where the generated files will land

| Item | Destination | State today |
|---|---|---|
| The `/activate-testing` skill | `.claude/skills/activate-testing/SKILL.md` | Installed with this module at SYS1 — invoking it starts SYS2's work |
| Approved feature list | `docs/FEATURE-LIST.md` | **Arrives in SYS2** |
| Test reports | `docs/test-reports/[YYYY-MM-DD]-test-report.md` | **Arrives in SYS2** |
| The tests | `tests/e2e/` | **Arrives in SYS2** |
| Morning check workflow | `.github/workflows/morning-check.yml` | **Arrives in SYS2**, added disabled |

⚠️ The morning check is a **new, separate workflow file**. It never touches [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), and in particular never renames its `verify` job — that job's display name is the branch-protection required check (**D-SYS-4**).

## What this is not

- **Not the browser-QA skill.** [`BROWSER-TOOLS.md`](../BROWSER-TOOLS.md) and the `browser-qa` skill are the *exploratory* layer: a human-driven look at a deployed Preview, per sprint. This is the *permanent, repeatable* suite. They coexist; neither replaces the other.
- **Not the per-PR sheet.** [`QA-CHECKLIST.md`](../QA-CHECKLIST.md) gates each PR. The Launch Gate is the whole-site pass on top of it.
- **Not CI.** A green `verify` job means the code compiles, lints and builds. It has never meant a feature works.
- **Not error tracking.** That is the other half of the picture and its own module — `docs/error-tracking/` + `/handle-error`, installed at SYS1 alongside this one and **activated in SYS3**. Testing prevents defects before release; error tracking catches whatever slips through after.

## First action

Read [`TESTING-GUIDE.md`](./TESTING-GUIDE.md) once (15 minutes). Then, when SYS1.5 has merged and SYS2 is the active sprint, work through [`SETUP-CHECKLIST.md`](./SETUP-CHECKLIST.md).

**Order matters.** SYS2 runs *after* SYS1.5 (public-write hardening) on purpose: the abuse controls change how `/apply` and `/contact` behave, and the suite should be written against final-form behavior instead of being rewritten a week later ([`ROADMAP.md`](../ROADMAP.md) Stage 5).
