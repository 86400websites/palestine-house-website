---
name: handle-error
description: Incident lane for Palestine House — turn any post-launch problem into what actually happened in plain words, how bad it is, a fix that travels the normal sprint loop, a permanent regression case so it cannot silently return, the affected person informed, and the incident logged closed. Two doors join one lane - a user report (works today) and a Sentry alert (arrives in SYS3). Investigates Vercel, the read-only Supabase production MCP, Resend and a real browser; never writes to Production and never puts a real person's identity into a committed file. Triggers - "/handle-error", "a user reported", "a partner cannot log in", "the application did not submit", "the download is broken", "Ask HQ never arrived", "sentry alert", "check the logs", "why did this break", "is this a bug or is the gate working".
---

# Handle Error — incident lane (Palestine House)

**Status: INSTALLED at SYS1, NOT FULLY ACTIVATED.** **Door B — a human reports something — works today.** **Door A — a Sentry alert — does not exist yet: Sentry is installed by sprint SYS3** (`docs/ROADMAP.md` Stage 5), so until then there is **no client-side error stream at all**. Say that plainly rather than implying a browser error left a trace. The permanent regression suite arrives in **SYS2**; see *The compounding rule*.

You are the **incident operator**. The owner never reads a stack trace — you translate, always. You investigate, verify and close; you do not implement the fix here.

## ⚠️ Privacy — read this first

Incidents involve **real partners and applicants**, and **this GitHub repo is public**.

- **Never write a person's name, email, message body, application text or account id into any committed file** — not the incident record, not a commit message, not a PR title, not a sprint prompt. Identify people by an **opaque reference** you invent for the incident (`INC-2026-08-22-01 · reporter A`), and keep the mapping out of the repo (the owner holds it).
- Never quote a Supabase row that carries identity. Read what you need, report the shape of it ("the profile exists, `is_approved` is false"), not the contents.
- Env vars and services **by name only** (`docs/ENV-VARS-SAFETY.md`). Never open, read or paste `.env.local`; a missing variable is a symptom to report, never a value to fetch.
- `/admin/approvals` shows applicant emails on screen. Redact or skip — never capture them.

## Read, don't restate — cite file + section in every finding

- `docs/error-tracking/ERROR-TRACKING-GUIDE.md` — the promises, the doors, the lane · `docs/error-tracking/SETUP-CHECKLIST.md` — the SYS3 one-time setup.
- `docs/error-tracking/templates/INCIDENT-LOG-TEMPLATE.md` and `USER-UPDATE-TEMPLATE.md` — the two skeletons.
- `docs/ROLLBACK.md` — the first move when Production is down or losing data; Step 7 (write the incident note) and *What to tell users* are binding · `docs/ROLLBACK-RUNBOOK.md` for the data lever.
- `docs/WORKFLOW.md` §9–§12 (local → PR → Preview → production), §13 (rollback), §15 (never do this) · `docs/templates/BUG-FIX-PROMPT-TEMPLATE.md`.
- `docs/SECURITY-CHECKLIST.md` §15 (blocking invariants), §8 (Route Handlers + abuse controls), §13 (production) · `docs/SUPABASE-MCP-SAFETY.md` §1, §3 · `docs/BROWSER-TOOLS.md` §6.
- `docs/PROJECT-STATUS.md` §7 (known issues — read it before declaring anything new) and §4 (the D-SYS decisions).

## Intake — two doors, one record

Open the record before investigating. **Where the record lives today:** `docs/INCIDENT-LOG.md` is **seeded by SYS3**; until it exists, `PROJECT-STATUS.md` §7 holds the incident while it is open and §8 records it when it closes (`ROLLBACK.md` Step 7). Use the template's fields either way.

- **Door A — Sentry alert (SYS3 onward).** Issue reference, first-seen, how many accounts. Not available before SYS3.
- **Door B — a human reports it (today).** What they were doing, which page, when, on what device — and their **opaque reference**, not their identity. Ask the owner for anything missing; do not guess.

## Investigate — where the logs actually are, in this order

Stop when the cause is proven. "Couldn't find it" is a **status**, never a conclusion.

1. **Is it even a bug?** A refusal is often the gate working correctly: a pending partner blocked from `/setup`, an unapproved caller getting an empty search index, an anonymous caller redirected from `/admin/*`. That is **support, not a defect** — go straight to the user update and explain their status kindly. Say which it is, early and plainly.
2. **A real browser** — `/browser-qa` (`docs/BROWSER-TOOLS.md`). **Production is READ-ONLY: navigate, screenshot, read console and headers — never submit a form, never create an account, never trigger a write there.** Reproduce anything that writes on **Preview**, against the non-production database, with obviously-fake test data.
3. **Vercel** — which deployment is live and when it shipped; the **function / runtime logs** for server-side failures that never reached the browser (Server Actions, Route Handlers, RSC renders).
4. **Supabase** — project logs plus the **read-only production MCP** (`supabase-prod-readonly`). It is **READ-ONLY, and Production must never be written through any channel** — not the MCP, not the SQL editor, not a script (`docs/SUPABASE-MCP-SAFETY.md` §1, §3). Write-shaped checks go to the **test** project.
5. **Resend** — for "the email never came" on `/contact` (`src/app/api/resend/contact/route.ts`) and **Ask HQ** (`/support`, `src/lib/support/actions.ts`). Sent · bounced · spam-flagged · never triggered? ⚠️ **Ask HQ stores the request through its RPC *before* it emails, and an email failure is caught, logged and ignored** — so "Ask HQ never arrived" normally means HQ's notification did not send, **not** that the partner's message was lost. Confirm the stored request exists (read-only, shape not contents) before telling anyone anything was lost. **Auth email — sign-in and password reset — is sent by Supabase, not Resend** (`supabase.auth.resetPasswordForEmail`), so a reset-email failure is a Supabase auth question.
6. **Sentry** — SYS3 only. Absent today.
7. **Never diagnose a rate limit or a CAPTCHA.** The public writes (`/apply`, contact, `/support`) are **unthrottled** until SYS1.5 (`PROJECT-STATUS.md` §7 #1, D-SYS-9). A 429 or a challenge is not something this site can produce yet.

### The failure modes this site actually has (there are no payments)

An application that did not submit (`/apply` is sign-up **and** application in one) · sign-in or password reset failing (`/login`, `/forgot-password`, `/update-password`) · **approval not unlocking the platform** (approved in `/admin/approvals`, still pending at `/dashboard`) · a **template download failing** (private Storage bucket, server-issued signed URL — expired, wrong object, or caller not approved) · **Ask HQ not reaching HQ** · a guide or toolkit page erroring (`/setup` `/operate` `/program` `/support`, `/{section}/{topic}/guide`) · an admin CMS action failing (`/admin/content` + `pages` `focus-areas` `files` `admins`).

## Report to the owner — one paragraph, then the numbers

Plain words: **what happened · who it hit (this one person / some / everyone) · whether it is a bug at all · proposed severity · the recommended next step.** No stack trace as an explanation.

## Severity — keyed to this project's stakes

- **🔴 Security incident (top).** Gated content reachable by an unapproved or anonymous caller — a guide body, a topic summary, a template or signed URL, an applicant's or partner's data, an admin surface. **This is not a bug, it is a security incident.** Tell the owner immediately, re-verify **`SECURITY-CHECKLIST.md` §15 end to end**, and treat `ROLLBACK.md` as live. Keep the reproduction out of public places (PR title, commit message, issue) until it is fixed.
- **Blocker.** Production down, or a partner-facing path losing data (an application accepted and lost). `docs/ROLLBACK.md` **first** if people are affected, then the fix.
- **High.** A core path broken for a real person, no data loss and no exposure — cannot sign in, download fails, approval does not unlock. Fix sprint this week.
- **Medium / Low.** A dated entry in `PROJECT-STATUS.md` §7 and, if it is real work, `docs/POST-LAUNCH-BACKLOG.md` (its *Intake format*), carrying the incident reference. Tell the owner it is **parked, not lost**.

## Act — the fix travels the normal loop, always

`/sprint-prompt` (with `docs/templates/BUG-FIX-PROMPT-TEMPLATE.md`) → owner-gated sub-steps → branch → `WORKFLOW.md` §9 local checks (`pnpm run typecheck`, `pnpm run lint`, `pnpm run build`) → §10 PR → §11 Preview at desktop **and 320px** → **independent review if the diff touches a risky surface — auth, the approval gate, RLS/schema, env handling, security headers, CSP (`WORKFLOW.md` §8, D-SYS-1)** → the **owner merges** → §12 production smoke test → `/close`.

**Never hotfix on `main`** (`WORKFLOW.md` §15). For a production emergency the lever is `docs/ROLLBACK.md`, not a fast commit.

## The compounding rule — every fixed bug becomes a permanent test

A fix is not finished until this exact bug can never silently return.

- **Honest state:** the Launch Gate suite — `tests/e2e/`, `docs/FEATURE-LIST.md`, `docs/test-reports/` — **arrives in SYS2 and does not exist today**. `package.json` defines five scripts (`dev`, `build`, `start`, `lint`, `typecheck`) and **no `test`**.
- **Until then:** write the regression case into the incident record as a concrete **steps → expected result** line, phrased so it can be pasted straight into the suite the moment SYS2 lands. Flag it for the feature list the owner will approve.
- **Once SYS2 exists:** the regression test is added in the fix's own PR — failing before, passing after — and a gate incident becomes a four-role case (anonymous · pending partner · approved partner · HQ admin). The suite itself is driven by `/activate-testing`.
- For a gate incident today, the manual stand-in is the **four-role walk** in `/browser-qa`, run on the fix's Preview and recorded.

## Close the loop — always with the human

1. **Draft** the user message from `docs/error-tracking/templates/USER-UPDATE-TEMPLATE.md`, in the brand voice (`docs/page-copy/00-global/brand-voice.md` — gitignored, OneDrive is canon). **The owner sends it**, from the HQ address in `docs/EMAIL-SETUP-CHECKLIST.md`. You never contact a partner or applicant. Draft for exactly the people affected, no one else. Say what broke, for how long, whether anything they submitted was lost, and that it is fixed — no internals, no unconfirmed cause, never blame the reporter.
2. **Complete the record:** cause · severity · fix PR · regression case (or test id, once SYS2) · **user informed ✓** or a recorded `n/a — no user was affected`. **Status becomes Closed only when the regression and user-informed fields are both filled.**
3. **If the incident produced a new rule, put the rule where it will be read** — `CLAUDE.md`, `AGENTS.md`, or the relevant checklist — not only in the log (`ROLLBACK.md` Step 7). An unrecorded incident is a scheduled repeat.

## Never

- Never write to Production through any channel while investigating — MCP, SQL editor, script or browser. Reproduce writes on Preview with fake data.
- Never put a real name, email, message body or account id into a committed file; never quote `.env.local` or any secret value.
- Never dismiss a report without checking the logs **and** attempting reproduction; never blame the user.
- Never mark an incident fixed without its regression case, or Closed without the user-informed field.
- Never present a stack trace as an explanation, and never claim a Sentry finding before SYS3 ships it.
- Never test for, or claim, a rate limit or CAPTCHA before SYS1.5.
- Never hotfix on `main`, never fix "while you're in there", never skip the review gate on a risky diff.
