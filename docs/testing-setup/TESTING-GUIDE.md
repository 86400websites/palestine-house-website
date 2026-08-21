# Testing Guide — How the Launch Gate Works

Written for the owner. No jargon survives past this line without being explained.

> ## ✅ INSTALLED AT SYS1 · ACTIVATED AT SYS2 (2026-08-22)
>
> The harness this guide describes is real: Playwright lives in the repo (`tests/e2e/`, `pnpm run test:e2e`), the four robot roles exist in the non-production project, and the morning-check workflow is in place, disabled. `docs/FEATURE-LIST.md` and `docs/test-reports/` are produced by the gate itself — steps 2–5 below — and the gate is passed only on a 100%-green full run with the owner's signed **GO**.

---

## 0. The situation this is walking into

Most of the SOP assumes a site that has not launched. **Palestine House launched on 2026-06-19** and has been serving real partners ever since — real applications, real HQ approvals, real accounts reading real gated content.

In all that time, **no automated test has ever run against this site.** Not before launch, not since. What has gated every release is:

- **CI** on every PR — [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), workflow **CI**, job **`verify`**: typecheck, lint, build, a gitleaks secret scan, and a `pnpm audit`. That proves the code compiles and carries no committed secret. It has never proved that a form works.
- **Manual QA sweeps** — including an exhaustive route × auth-state pass at launch (11 real defects found, 10 fixed) and a multi-role walkthrough across Stage 4.
- **Independent review** — 15 recorded reviews in [`code-reviews/`](../code-reviews/), several of which returned blocking Criticals that the build agent's own checks had missed.

That is genuine, and it found genuine bugs. It is also **not repeatable**, so it says nothing about the commit that merged yesterday. [`LAUNCH-CHECKLIST.md`](../LAUNCH-CHECKLIST.md) states this outright and refuses to tick the Launch Gate box.

**Consequence to expect:** the first full run of this gate is not a rubber stamp before launch. It is the first measurement ever taken of a site that has been live for two months. It will find things. Every FAIL in that first report is a defect a partner might otherwise have met.

## 1. What this system is

A robot user tests **every feature the site has** — it visits every public page, signs up through Apply, logs in and out, fills every form, opens a guide, downloads a template, uses the Ctrl/⌘+K search, and tries doors it should not be allowed through. Every feature gets a PASS or a FAIL. Failures get fixed through the normal sprint workflow, the robot re-checks, and only when **everything** is green does the run earn its GO.

The point: you find the broken things. Not a partner, not HQ, not three weeks later.

**No payments.** Palestine House has no Stripe, no checkout, no card flow, no test cards. The source SOP's payment section has been removed from every file in this module rather than left in as "N/A".

## 2. The two moving parts

**Playwright — the tester.** Free software that Claude Code installs *inside this repository* as a development dependency, like adding a tool to a toolbox. No Playwright account, no signup, no monthly fee. It drives a real browser exactly as a person would: click, type, scroll, submit. It arrives in **SYS2** and is not installed today.

*(Not to be confused with the browser tools in [`BROWSER-TOOLS.md`](../BROWSER-TOOLS.md) and the `browser-qa` skill. Those let Claude Code **look at** pages while working — exploratory, per sprint, human-driven. Playwright here is the **permanent suite** that lives in the repo forever and re-runs on demand. Both stay.)*

**The morning check — the watchman.** After the gate passes, GitHub re-runs a handful of critical tests against the live site every morning. If one fails, you get an email. **Silence means all green** — no news is good news. This is how you catch the form that silently stopped working three weeks after a deploy. It carries one decision only you can make; see §6.

Error tracking (Sentry) is the third part of the full picture and has its own module: `docs/error-tracking/` + `/handle-error`, **activated in SYS3**. Testing prevents defects before release; error tracking catches whatever slips through after.

## 3. The golden safety rule

**The robot never touches the production database.**

The whole gate runs against a **Vercel Preview** deployment, whose Preview and Development environment variables point at the **non-production Supabase project**, separate from Production ([`PROJECT-STATUS.md`](../PROJECT-STATUS.md) §6, [`SUPABASE-MCP-SAFETY.md`](../SUPABASE-MCP-SAFETY.md)). Test users are obviously-fake accounts created in that non-production project only.

Three project-specific traps that must be respected, all of them already documented:

1. **A Preview contact submission sends a real email.** `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `RESEND_TO_EMAIL` are set in **both** Production and Preview, so `/contact` and the gated Ask HQ form on `/support` deliver to a real inbox from Preview ([`BROWSER-TOOLS.md`](../BROWSER-TOOLS.md) §6). Robot submissions must be unmistakably marked as tests, kept few, and expected by HQ.
2. **On Production, automation is read-only.** Navigate, screenshot, read headers, read console — never submit, never create an account, never trigger a write ([`BROWSER-TOOLS.md`](../BROWSER-TOOLS.md) §6). The rule is channel-independent: it applies to Playwright exactly as it applies to a browser tool.
3. **The real production submission stays a human task.** [`LAUNCH-CHECKLIST.md`](../LAUNCH-CHECKLIST.md) Phase 3 has the owner perform one real submission by hand on the live domain. That never becomes the robot's job.

## 4. The four roles — the heart of the whole thing

This site is two shells behind one gate, and the gate is `profiles.is_approved`. Four roles:

| Role | Public shell | Gated platform | `/account` | `/admin/*` |
|---|---|---|---|---|
| **Anonymous visitor** | Full access | Redirect to `/login` — and no gated strings in the HTML *or* the RSC payload | Redirect to `/login` | Redirect to `/login` |
| **Pending partner** (account exists, `is_approved = false`) | Full access | `/dashboard` shows the pending state. No guide body, no topic summary, no template row resolves. Ctrl/⌘+K returns an **empty** index | **Accessible** — the one deliberate exception, so they can set name and password while they wait | Not an admin |
| **Approved partner** | Full access | Full access: 4 sections · 22 focus areas · 88 templates, downloads via server-issued signed URLs | Accessible | Not an admin |
| **HQ admin** (in the `admins` table) | Full access | Full access | Accessible | Full access |

A signed-in non-admin who reaches an `/admin/*` route gets a **404**. Being approved is never being an admin.

**Every one of those cells is a test.** The "allowed" cells and the "denied" cells equally — a gate you have only ever tested from the inside is a gate you have not tested. This is the single most valuable thing the suite will do for this project, and it is why the **pending-partner** account matters as much as the approved one: a pending account is the exact shape of "someone who shouldn't get in", and it is the shape a real bot signup takes.

The binding statements of what must hold are [`SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) §15 (blocking invariants), §8 (Route Handlers and abuse controls) and §13 (production deployment). Read them; do not paraphrase them. One of §15's rules is easy to break and hard to see: **a gate is a throw, not an await** — a gated page must short-circuit before it constructs any JSX.

## 5. The five steps, and who does what

### Step 1 — Setup (once)
Follow [`SETUP-CHECKLIST.md`](./SETUP-CHECKLIST.md). Part 1 (the files) is already done — this install did it. Parts 2–4 are SYS2 work. Your hands-on part is roughly 20 minutes, most of it one Vercel question and one merge.

### Step 2 — The feature list (your ten most important minutes)
You say **`/activate-testing`**.

Claude Code scans the **whole repository** — every route under `src/app/`, every Route Handler, every Supabase RPC and RLS policy, every email trigger — *and* cross-checks the docs. Two sources, checked against each other:

- Promised in the docs but missing from the code → flagged to you immediately. That is a finding before a single test runs.
- Built in the code but never documented → still goes on the list, still gets tested.

The result is `docs/FEATURE-LIST.md`: one plain-English line per feature. For example — *"A pending partner opening `/setup` sees the pending state and no focus-area summary"*, or *"An anonymous visitor who types a guide URL directly is redirected to `/login` and the guide text appears nowhere in the response."*

**You read the list and approve it in writing.** Add anything missing. This is the guarantee of the whole system: everything on the list gets tested; anything off the list is exactly where "a partner says something's broken" comes from later. Ten minutes of full attention here beats everything else combined.

### Step 3 — Tests written
Claude Code turns every approved line into one test, at both viewports the repo actually requires: **desktop and 320px** ([`DESIGN.md`](../DESIGN.md) §10, [`QA-CHECKLIST.md`](../QA-CHECKLIST.md)). It always includes the reverse checks — people who shouldn't get in, can't — for all four roles. You do nothing here beyond answering the odd question.

> ⚠️ **Not testable today: abuse controls.** `/apply`, `/contact` and the Ask HQ write are live **without rate limiting and without Turnstile** ([`PROJECT-STATUS.md`](../PROJECT-STATUS.md) §7 issue #1, open since S3c). Hammering a form today gets you through, not blocked. **Do not write a test that expects a 429 or a CAPTCHA challenge, and do not let a report claim one.** Those controls arrive in **SYS1.5** (**D-SYS-9**), which is why SYS1.5 runs before SYS2. Their feature-list lines are written now and marked *pending SYS1.5*.

### Step 4 — Run → report
One ask: "run the tests." The robot works through everything and writes `docs/test-reports/[date]-test-report.md`: one row per feature, PASS or FAIL, every failure explained in plain words with a severity.

| Severity | Means | Response |
|---|---|---|
| **Blocker** | The approval gate, login, or the whole site is affected — anything that lets the wrong person see gated content, or stops the right person getting in | Nothing ships with one open |
| **High** | A real feature is broken for some users | Fixed before the run is called green |
| **Medium** | Annoying, but the site works | Fix now or next sprint — your call, logged |
| **Low** | Cosmetic | Backlog ([`POST-LAUNCH-BACKLOG.md`](../POST-LAUNCH-BACKLOG.md)) |

Nobody's first run is all green — least of all a site that has run two months without a suite. That is the system working, not failing.

### Step 5 — Fix → re-run → GO
The report becomes a fix sprint through the normal workflow — branch → local checks → PR → Preview → review → merge ([`WORKFLOW.md`](../WORKFLOW.md) §6–§12). Nothing new to learn. Anything risky picks up the mandatory independent review under [`WORKFLOW.md`](../WORKFLOW.md) §8 (**D-SYS-1**).

While fixing, the robot re-runs **just the failed tests** for fast feedback. But the GO verdict only ever comes from a **full re-run of every test**, because a fix can quietly break something that was passing. *Failed ones to iterate, all of them to finish.* A full run costs robot time, not your time — never economize on the final one.

**All green on a full run = GO**, recorded in the report.

## 6. After the gate: the morning check

Once the gate passes, Claude Code proposes a handful of critical tests to run daily against the **live** site. You approve the selection before it is switched on.

- You get an email **only when something fails.** A daily "all fine" email would train you to stop reading — the silence is the feature.
- Only safe-to-repeat checks go in. Nothing that creates real data: no application, no account, no email to a real inbox.

**One decision is yours and is deliberately not made in this module.** A daily production run can be one of two things, and they are not equally cheap:

- **(a) Logged-out only** — pages render clean, the public shell is up, `/apply` loads, and gated URLs correctly bounce an anonymous visitor to `/login`. No production credentials exist anywhere. Safest by a distance, and it still catches "the site is down" and "the gate broke open".
- **(b) With a dedicated, obviously-fake APPROVED production account** — additionally proves that a real partner can get in and reach real content every morning. The cost is honest: that account holds **genuine access to all gated content**, and its password lives as a GitHub Actions secret. A leaked Actions secret is then a leaked partner login.

Option (b) buys the login canary. Option (a) buys zero standing credential risk. **You choose at activation.** Deferring the morning check entirely is also a legitimate outcome — SYS2's exit gate allows it, provided the deferral is recorded.

Either way, the run stays read-only against Production, per [`BROWSER-TOOLS.md`](../BROWSER-TOOLS.md) §6.

## 7. Living with the system

- **The tests stay in the repo forever.** Before any big release or redesign, say "run the launch gate" and get a fresh full report. Per-sprint QA ([`QA-CHECKLIST.md`](../QA-CHECKLIST.md)) continues as normal — the gate is the whole-site pass on top of it.
- **The feature list is a living document.** New feature shipped → its line gets added → its test exists. Every defect found in production also earns a test here, so the same defect cannot quietly return. The system gets stronger with every incident.
- **A failing test is a question, not always a bug.** Sometimes the test is wrong, or the feature changed on purpose. Say so — Claude Code will state plainly whether the site or the test needs fixing. Changed lines on the feature list come back to you for re-approval; nothing is silently rewritten.
- **Content numbers move.** The proof numbers are **4 sections · 22 focus areas · 88 templates** today. When real content is added they change, and the feature-list lines that count things change with them — never the other way round.

## 8. What you never do

You never read code, never read logs, never open a terminal. You read two documents — the feature list and the test report — and you approve three things in writing: the setup PR, the feature list, and the morning-check selection (or its deferral). Everything else is Claude Code's job.

---

Next step → [`SETUP-CHECKLIST.md`](./SETUP-CHECKLIST.md).
