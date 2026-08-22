# Sprint SYS2 — Testing launch gate (Playwright)

| | |
|---|---|
| **Date** | 2026-08-22 — setup merged as **PR #91**; the gate run is open on `claude/sprint-sys2-launch-gate-run` awaiting the D-SYS-1 review + owner merge |
| **Branch / PR** | `claude/sprint-sys2-testing-launch-gate` / **#91 (merged)** · `claude/sprint-sys2-launch-gate-run` / open |
| **Goal** | Install the automated Launch Gate, then run it: every feature of the site proven by robot, in plain English, before a partner meets the broken thing. |

## What shipped

**Half 1 — the harness (PR #91, merged):**
- `@playwright/test` as a pnpm dev dependency; sixth script **`test:e2e`** (deliberately not `test` — a script named `test` would be auto-invoked by `CLAUDE.md`'s after-task ritual and `/close`, and this suite cannot run without a deployed Preview URL).
- `playwright.config.ts`: `PLAYWRIGHT_BASE_URL` **required** (no default, never Production), desktop 1440 + **320px** profiles, Vercel bypass header by name only, evidence folders gitignored.
- `tests/e2e/`: one auth-setup step per role through the real `/login` form; the robot-role module; SMOKE-01.
- Three robot accounts in the **non-production project only** (`e2e-{pending-partner,approved-partner,hq-admin}@robot-test.invalid`), created through the real `signUp` door; approval/admin flips applied via the `supabase-test` MCP. Passwords generated straight into the gitignored `.env.local`.
- `.github/workflows/morning-check.yml` added **disabled**; `ci.yml` untouched (D-SYS-4).
- Every doc asserting "no test script / five scripts" flipped: the three the checklist names plus four more docs, four templates, the testing-setup banners and four skill headers.

**Half 2 — the gate itself (open branch):**
- `docs/FEATURE-LIST.md` — 54 plain-English lines from a whole-repo scan, **owner-approved in writing before a single spec was written**.
- 98 specs across 8 files: public shell, the four roles in **both directions**, gated content, forms, admin, protection, integrations — every visual line at desktop **and** 320px, plus nine serial write-journeys.
- **FULL run 98/98 GREEN** on the deployed Preview; report at `docs/test-reports/2026-08-22-test-report.md`; **GO signed by the owner** (Mohammad Katada Siddiqui, 2026-08-22).
- **Morning check switched ON as Option A** — logged-out, read-only, **zero standing credentials** — with two dedicated `morning-*` Playwright projects that carry no auth-setup dependency (that is what keeps the live run credential-free). Verified by running the workflow's exact command against **production: 34/34 green**.
- `LAUNCH-CHECKLIST.md`'s Launch Gate line **ticked for the first time since the site launched on 2026-06-19**.

## Prompt used

<details><summary>The operating prompt</summary>

```text
/activate-testing   (the Launch Gate operator skill)

Phase 0: verify the harness (SETUP-CHECKLIST).
Phase 1: scan the whole repo — code is the source of truth — draft
         docs/FEATURE-LIST.md, STOP for the owner's written approval.
Phase 2: one spec per approved line, tagged with its ID, in tests/e2e/;
         every protected boundary gets an allowed AND a denied assertion;
         desktop + 320px; never assert a control that does not exist yet.
Phase 3: full run against the deployed Preview; plain-English report.
Phase 4: fix loop → full re-run → GO / NO-GO.
Phase 5: propose the @morning selection; the owner decides A / B / C.
```

</details>

## Checks & results

typecheck ✅ · lint ✅ · build ✅ (39 routes) · **suite 98/98 on the deployed Preview** (desktop + 320px, four roles) · **morning check 34/34 against production** (read-only, credential-free) · environment separation proven two ways (bundle tripwire + robot sign-ins that can only succeed against the non-production project).

## Deviations & learnings

- **D-SYS-11** (recorded in `PROJECT-STATUS.md` §4): SYS2 ran **before** SYS1.5, reversing D-SYS-9, on the owner's direction. Trade-off accepted and honoured: the abuse-control lines exist but are marked *pending SYS1.5*, and **no spec asserts a 429 or a CAPTCHA** — PR-001..003 have no stubs at all, because a GO must never ride on a skipped test.
- **Zero site defects.** All 33 first-run failures were the tests learning the real architecture. The five that cost the most, now encoded in the suite: **gates stream** (a denied route can answer 200 whose stream carries only a shell plus the redirect — assert content absence and where the browser lands, never the status code; production behaves identically, verified read-only); **guide links live in collapsed card bodies** (`state: "attached"`, not visibility); the **search overlay is a native `<dialog>`** with no `role` attribute; **apply lands on the pending dashboard** (the in-form thank-you is a defensive fallback); a **decision is final in the approvals UI** (hence two disposable applicants per run).
- **Sign-out revokes every session the account holds.** AC-010 killed the shared stored session mid-run until it was moved to the very end of the serial journeys. Do not reorder it.
- **Write journeys must self-heal.** Two crashed runs left the test database dirty (a topic Drafted; a "(ROBOT TEST)" marker in a section lead) and poisoned the *next* run. Every mutating journey now restores state in `finally`, and the files journey sweeps robot templates before and after. Both incidents were cleaned through the `supabase-test` MCP.
- **Journeys never retry** (`retries: 0` on that project): a retry re-sent the contact email. The fix loop still ran the full suite ~20 times and put **~60 ROBOT-TEST emails** in the HQ inbox — owned in the report, and `tests/e2e/README.md` now documents email-free iteration (`--project=desktop --project=mobile-320`).
- **Vercel's bypass cookie variant poisons redirect assertions.** Send `x-vercel-protection-bypass` alone; `x-vercel-set-bypass-cookie` answers with a 307-to-self that every location assertion then reads.
- **Three feature-list proof cells were corrected**, each change-logged and re-approved by the owner — never silently edited: PG-007 (which page carries the literal tagline), AC-006 (the denial substance is the 404 page + zero content, not the status code), FM-007 (`/account` has no in-place password form by design; it links into the reset flow).

## Follow-ups

- **MN-003 is partial** — `PROJECT-STATUS.md` §7 #7. The reset request, the token issue + send, the link being accepted at `/update-password`, and the fail-closed behaviour are all proven; the final submit is not. No site defect and no evidence of one: Supabase stops issuing recovery tokens to undeliverable addresses, and `SUPABASE_SECRET_KEY` is not in the local secrets file. `tests/e2e/setup/verify-reset-flow.ts link` closes it automatically the moment that key exists.
- **Owner, after merge:** add `PRODUCTION_URL` as a GitHub Actions **repository variable** (not a secret) — the morning check's only setup step — and confirm GitHub notifications are set to email on failed workflows.
- **Option B upgrade** stays open: a dedicated obviously-fake approved production account would add a daily login canary at the cost of a standing credential. One commit away; deliberately not taken.
- **SYS1.5** (Upstash + Turnstile) now runs after this sprint; when it merges, the PR-001..003 specs are written and the feature list's *pending SYS1.5* markers clear.
- **§7 #6** (Next.js HIGH advisories) was cleared en route by the Dependabot merge — production is on `15.5.23`.
