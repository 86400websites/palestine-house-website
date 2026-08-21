# Error Tracking — Start Here

> This folder is the **after-launch safety net**: when something breaks for a real partner or applicant, you hear about it, you understand it in plain words, it gets fixed through a normal sprint, the fix gets a permanent test so it cannot quietly return, and the affected person hears back from you.
>
> Companion docs: [`../WORKFLOW.md`](../WORKFLOW.md) (the delivery chain), [`../ROLLBACK.md`](../ROLLBACK.md) (when a Blocker means revert-first), [`../SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) (§9 form / input validation — it holds the PII-in-logs box, §10 security headers + CSP, §15 the blocking invariants), [`../SUPABASE-MCP-SAFETY.md`](../SUPABASE-MCP-SAFETY.md) (how database logs may be read), [`../POST-LAUNCH-BACKLOG.md`](../POST-LAUNCH-BACKLOG.md) (where Medium and Low findings go).

---

## 🟡 Status: INSTALLED, NOT ACTIVATED

| | |
|---|---|
| **Installed** | **SYS1** — this folder, its guide, its checklist and its two templates, plus the `/handle-error` skill. Documentation only. |
| **Activated** | **SYS3 — Error tracking (Sentry)**. Scope and exit gate: [`../ROADMAP.md`](../ROADMAP.md) Stage 5 · board row: [`../PROJECT-STATUS.md`](../PROJECT-STATUS.md) §2. |
| **In the codebase today** | **Zero Sentry code.** No `@sentry/nextjs` in `package.json`, no `instrumentation.ts`, no `sentry.*.config.*`, no `sentry` match anywhere in `src/`, and no `SENTRY` name in `.env.example`. Verified at SYS1 by reading `package.json` and searching `src/`. |
| **Therefore** | **No error reaches anyone right now.** [`../../src/app/error.tsx`](../../src/app/error.tsx) and [`../../src/app/global-error.tsx`](../../src/app/global-error.tsx) are real error boundaries — they render a calm "That didn't work." and a Try again button — but both destructure only `reset`. They report **nothing**, to nobody. A crash on Production is currently invisible unless a human writes in. |

**Do not treat anything in this folder as live.** Every step below describes what SYS3 will switch on. Until the owner confirms a test alert actually arrived (`SETUP-CHECKLIST.md` Part 4), the alert channel does not exist.

---

## ⚠️ Read this before SYS3 is planned: the CSP conflict

This site ships a tight Content-Security-Policy from [`../../next.config.ts`](../../next.config.ts), including **`connect-src 'self'`**. Sentry's browser reporting POSTs each event to its own ingest origin — which `connect-src 'self'` **silently blocks**. No console error you would notice on a normal page, no events, no alerts. Installing the SDK without touching the CSP produces a system that looks installed and reports nothing.

**This is already decided — do not reopen it.** **D-SYS-10** (owner, 2026-08-21; [`../PROJECT-STATUS.md`](../PROJECT-STATUS.md) §4, full entry in [`../notes/system-compliance-audit-2026-08-21.md`](../notes/system-compliance-audit-2026-08-21.md) → *Decision log*): **the Sentry ingest origin is added to `connect-src` in SYS3**, and the "YouTube embed origin only" phrasing is updated in the **same PR** in `next.config.ts`'s own comment, [`../../CLAUDE.md`](../../CLAUDE.md)'s Hosting note, and [`../TECH-ARCHITECTURE.md`](../TECH-ARCHITECTURE.md). Details and the rejected alternative: `ERROR-TRACKING-GUIDE.md` §1.

---

## What it does, in one paragraph

Sentry — a free error-tracking service, the only account this module needs — sits inside the site like a black-box recorder. When an error happens to a real user it records who it was (their account identifier, if signed in), which page, which device, what the error said, and their last few clicks, then emails you. That is **Door A**: most problems reach you before anyone writes in. **Door B** is when someone does write in — *"my application never went through"*, *"I can't sign in"*, *"the download does nothing"*. You paste their message into `/handle-error` and Claude Code checks the logs this site actually has — the Vercel logs, the Resend delivery log, Mailchimp, the database, and (only from SYS3) Sentry — then tells you in one plain paragraph what happened, whether it is even a bug, and how bad it is. From there both doors join the same lane: severity → fix sprint → new permanent test → user informed → incident logged closed.

**This site takes no payments.** There is no Stripe, no checkout, no card flow, and no payment surface of any kind. The SOP's payment content has been removed from this folder rather than marked N/A — the failure modes here are applications, sign-in, approval, downloads, Ask HQ and guide pages.

## Files in this folder

| File | What it is | Who reads it | State |
|---|---|---|---|
| [`ERROR-TRACKING-GUIDE.md`](./ERROR-TRACKING-GUIDE.md) | The plain-English guide: the CSP decision, the two doors, the lane, severities, what Sentry cannot see | **Owner** — read this first | Filled for this project |
| [`SETUP-CHECKLIST.md`](./SETUP-CHECKLIST.md) | The one-time setup, every box marked with **who** does it and **when** | Owner + Claude Code | **Nothing ticked. Nothing done.** |
| [`templates/INCIDENT-LOG-TEMPLATE.md`](./templates/INCIDENT-LOG-TEMPLATE.md) | Skeleton for the running register | Claude Code fills | Skeleton — keeps its `[BRACKETS]` |
| [`templates/USER-UPDATE-TEMPLATE.md`](./templates/USER-UPDATE-TEMPLATE.md) | Ready-to-send messages for affected partners and applicants | Owner sends | Skeleton — keeps its `[BRACKETS]` |
| [`../../.claude/skills/handle-error/SKILL.md`](../../.claude/skills/handle-error/SKILL.md) | The `/handle-error` skill that investigates and drives every incident | Claude Code | Installed at SYS1, alongside these docs |

## What arrives later

| Thing | Path | Arrives in |
|---|---|---|
| The Sentry SDK, the DSN env var, user context, scrubbing, environment tags, source maps, the wired error boundaries, the **D-SYS-10 CSP amendment** | `package.json`, `instrumentation*.ts`, `next.config.ts`, `src/app/error.tsx`, `src/app/global-error.tsx` | **SYS3** |
| The live incident register | `docs/INCIDENT-LOG.md` | **SYS3 seeds it**; rows are added at the first real incident |
| The regression-test half of the lane — a permanent test per incident | `tests/e2e/`, `docs/FEATURE-LIST.md`, a `test` script, the morning check (`.github/workflows/morning-check.yml`) | **SYS2** |

**The lane has a dependency.** Step 4 of the incident lane ("a new test, always") needs the testing launch gate — the companion module at [`../testing-setup/00-START-HERE.md`](../testing-setup/00-START-HERE.md), installed at SYS1 and activated in SYS2. `package.json` today defines exactly five scripts — `dev`, `build`, `start`, `lint`, `typecheck` — and **no `test` script**; there is no `tests/` directory. SYS2 lands before SYS3 for exactly this reason. If an incident somehow happens before SYS2 ships, log it with **"regression test owed — testing gate pending"** rather than marking it Closed.

## Copy map — already applied at SYS1

| SOP source item | Where it now lives in this repo |
|---|---|
| The module folder, minus the skill | `docs/error-tracking/` ← you are here |
| `handle-error.md` | `.claude/skills/handle-error/SKILL.md` |
| The incident register | `docs/INCIDENT-LOG.md` — **not created yet**, seeded in SYS3 |

The SOP source folder (`docs/Website-Development-System/`) is untracked and is being deleted. This folder is the permanent copy. It has been filled from verified repo facts: the SOP's generic `SECURITY-CHECKLIST §5` citations for abuse controls are repointed here to **§8** (Route Handlers), **§10** (headers/CSP), **§13** (production deployment) and **§15** (blocking invariants), because in this repo **§5 is Row Level Security**.

## First action

1. Read [`ERROR-TRACKING-GUIDE.md`](./ERROR-TRACKING-GUIDE.md) once — about ten minutes. Start with §1, the CSP decision.
2. Do **Part 1** of [`SETUP-CHECKLIST.md`](./SETUP-CHECKLIST.md) — four owner boxes, roughly five minutes, and it is a prerequisite for planning SYS3: the DSN is what names the exact ingest origin the CSP has to allow.
3. Everything after that is sprint SYS3.
