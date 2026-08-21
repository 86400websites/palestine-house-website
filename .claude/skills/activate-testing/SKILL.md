---
name: activate-testing
description: Launch Gate operator for Palestine House — scan the whole repo, draft docs/FEATURE-LIST.md for the owner to approve, write one Playwright test per approved line (the four roles and the approval gate first), run the full suite against the deployed Preview, report in plain English, drive the fix and re-run loop, and issue the GO / NO-GO verdict. The harness was installed at SYS2 (tests/e2e/, pnpm run test:e2e, four robot roles on the non-production project) — verify Phase 0 is intact, then operate Phases 1-5. Triggers - "activate the testing setup", "/activate-testing", "run the launch gate", "run the tests", "run all tests", "re-run the failed tests", "is the site ready to launch", "test the whole site", and before any launch or major release.
---

# Activate Testing — Launch Gate operator (Palestine House)

> ✅ **HARNESS INSTALLED AT SYS2 (2026-08-22).** `@playwright/test` is a dev dependency; `playwright.config.ts` targets a deployed Preview via `PLAYWRIGHT_BASE_URL` (desktop + 320px profiles, bypass header by name); `tests/e2e/` holds the auth setup for the three signed-in roles and the suite; `pnpm run test:e2e` runs it (deliberately not named `test` — see `tests/e2e/README.md`); the robot accounts live in the **non-production** Supabase project; `.github/workflows/morning-check.yml` exists **disabled**. On any fresh run, first confirm Phase 0 still holds (`docs/testing-setup/SETUP-CHECKLIST.md` — deps installed, robots signable-in, Preview reachable through the bypass); repair it before operating. The gate itself is passed only by a 100%-green full run with the owner's signed GO on the latest `docs/test-reports/` report.

You are the **Launch Gate operator**. You prove, with evidence, that every feature of this site works — and you speak to the owner only in plain English. He does not read code, logs or stack traces; you translate everything.

This skill uses **Playwright the test framework**, installed by SYS2 as a repo dev dependency (pnpm — never npm or yarn). It is **not** the global Playwright MCP / Agent Browser behind `/browser-qa` and `docs/BROWSER-TOOLS.md` — those stay the exploratory, human-driven tools. This suite is the permanent, versioned test asset of the repo.

Read, don't restate — these bind every phase:
- `docs/testing-setup/TESTING-GUIDE.md` — the promises made to the owner. Never break them.
- `docs/testing-setup/SETUP-CHECKLIST.md` — Phase 0 definition of done.
- `docs/TECH-ARCHITECTURE.md` — stack, commands, environments.
- `docs/SECURITY-CHECKLIST.md` **§8** (Route Handlers + abuse controls), **§13** (production deployment), **§15** (blocking invariants) — what the suite must verify. *(The generic SOP cites "§5" for this; here §5 is RLS. §8/§13/§15 are the right sections.)*
- `docs/SUPABASE-MCP-SAFETY.md` and `docs/ENV-VARS-SAFETY.md` — non-production rules; variable **names** only, never values.
- `docs/QA-CHECKLIST.md` (its "Automated tests" block is the gate SYS2 closes) and `docs/WORKFLOW.md` §9–§12 — the sprint loop that fixes what this gate finds.
- `docs/PROJECT-STATUS.md` §4 (the D-SYS decisions) and §7 (known issues) — what is deliberately not shipped yet.

## Phases

State which phase you are in at the start of every run. Never skip an owner gate.

### Phase 0 — SETUP (once — sprint SYS2's first half)

Execute `docs/testing-setup/SETUP-CHECKLIST.md` exactly, as one normal PR through `docs/WORKFLOW.md` §9–§12. Test users are created in the **non-production Supabase project only** (`supabase-test`), with unmistakably fake identities — never in Production, which is read-only from here (`docs/SUPABASE-MCP-SAFETY.md`). Record test-account **emails only** where the checklist says, never passwords. Do not proceed to Phase 1 until the smoke test passes against a deployed Preview.

### Phase 1 — FEATURE LIST (scan → draft → owner approval)

Scan the **actual codebase end to end** — code is the source of truth; docs may have missed something.

1. Enumerate every route under `src/app/` — public shell `/` `/model` `/experience` `/bring-ph` `/our-support` `/focus-areas` `/about` `/contact` `/apply` `/privacy` `/terms`; auth `/login` `/forgot-password` `/update-password` `/auth/confirm`; gated `/dashboard` `/setup` `/operate` `/program` `/support`, the guide reader `/{section}/[topic]/guide`, `/account`; HQ `/admin` `/admin/approvals` `/admin/content` + `pages` `focus-areas` `files` `admins`. Then every Route Handler under `src/app/api/`, every form, every RPC and table policy, every email trigger, every redirect in `next.config.ts`, and the Ctrl/⌘+K search.
2. Cross-check against the approved scope docs both ways — **promised but missing in code** → report to the owner immediately as a pre-test finding; **built but undocumented** → include it, marked `(found in code, not in docs)`.
3. Fill `docs/FEATURE-LIST.md` from `docs/testing-setup/templates/FEATURE-LIST-TEMPLATE.md`: one plain-English line per feature with a stable ID, plus the template's baseline lines (every page renders clean, denied state per protected boundary, 404, the two viewports, links).
4. **STOP. Present the list to the owner for approval.** Not one test before written approval. After approval, any change to a line goes back to him — never silently edit an approved line.

**The four roles are the spine of the list.** Every gated surface gets a line per role: **anonymous visitor · pending partner (account exists, not approved) · approved partner · HQ admin**. The approval gate (`profiles.is_approved`) is the core invariant of this site.

### Phase 2 — WRITE TESTS (one per approved line)

- One spec per feature line, tagged with its ID, in `tests/e2e/`, grouped by the list's sections. Prefer `data-testid` selectors; add missing ones in the same PR (behavior-neutral).
- Auth: one setup project per role signs in once and saves session state; role specs reuse it.
- **"People who shouldn't get in, can't" is a first-class category, not a footnote.** Every protected boundary gets an **allowed *and* a denied** assertion. An anonymous or pending caller must get **nothing** — no gated page, no guide body, no template row, no topic summary, no signed URL, and an **empty search index carrying no resource ids, storage paths or bucket names** (D-PP-j). Assert the redirect *and* that the page's own strings appear in neither the HTML nor the **RSC payload** — a gate is a throw, not an await (`docs/SECURITY-CHECKLIST.md` §15).
- Admin: `/admin/*` is authorized server-side against the `admins` table — an approved non-admin partner must be denied. `/account` is session-gated only, by design; a pending partner reaches it and sees nothing but his own profile row.
- Every page test runs at **desktop and 320px** — the repo's mandatory pair (`docs/QA-CHECKLIST.md` "The two viewports", `docs/WORKFLOW.md` §11).
- **Abuse controls — read this before writing one.** Rate limiting and Turnstile are **not shipped** (`docs/PROJECT-STATUS.md` §7 #1, D-SYS-9; they arrive in **SYS1.5**). Today a test must **never** assert a `429` or a CAPTCHA challenge, and must never loop or hammer `/apply`, `/contact` or the Ask HQ write. Assert zod validation and honest outcomes only. When SYS1.5 lands, add the rejection tests then — rejection is the PASS.
- **No payments anywhere.** This site has no Stripe, no checkout, no card flow. There is no payment line to test and no test card to enter.
- Emails: assert through the provider's test hooks or logs, or a capture inbox — never a real person's inbox, never a real applicant.
- Real but genuinely un-robotable (e.g. how an email renders in a mail client)? Mark the line `MANUAL` with exact human steps. Manual lines appear in the report like any other and need recorded evidence to PASS.

### Phase 3 — RUN (full) → REPORT

- Target the **deployed Preview** of the release candidate via `PLAYWRIGHT_BASE_URL`, non-production keys, bypass header if configured. Record the URL and the head SHA — an approval never carries to a new head.
- Run the **full suite**. Artifacts (screenshots, traces) go to a gitignored evidence folder — never committed.
- Fill `docs/test-reports/[YYYY-MM-DD]-test-report.md` from `docs/testing-setup/templates/TEST-REPORT-TEMPLATE.md`: one row per feature, PASS/FAIL, every failure explained **in plain words**, with severity (Blocker / High / Medium / Low per the template) and a suggested fix.

### Phase 4 — FIX LOOP → VERDICT

- Failures become a fix sprint — `docs/templates/BUG-FIX-PROMPT-TEMPLATE.md`, or `/sprint-prompt` for anything larger — run through the normal loop: task branch, the **gated sub-step protocol** (commit + push after each gated step, D-SYS-2), `docs/WORKFLOW.md` §9–§12, and **independent review if the fix touches a risky surface** — auth, the approval gate, RLS/schema, env handling, security headers, CSP (`docs/WORKFLOW.md` §8, D-SYS-1). This skill reports and verifies; the fix belongs to the sprint loop.
- While fixing, re-run **only the failed specs** for speed.
- Before any verdict, **always a full re-run** — a fix can break something that was passing. **GO requires a full run, 100 % passing, on the current head.** A partial run can never produce GO. If the test is wrong rather than the site, fix the test, get the changed line re-approved, and note it in the report.
- Record GO / NO-GO in the report. On GO, point the owner to `docs/LAUNCH-CHECKLIST.md` — this gate feeds its "Launch Gate passed" line — and to `/close` for the merge.

### Phase 5 — MORNING CHECK (after GO — the owner's call)

- Propose the 5–7 most critical **safe-to-repeat** specs (public pages render clean, login with the dedicated test account, approved partner allowed / anonymous denied). Nothing that writes: no signups, no applications, no emails, no Ask HQ. Tag approved specs `@morning`.
- Enable `.github/workflows/morning-check.yml` from `docs/testing-setup/templates/MORNING-CHECK-TEMPLATE.md` — daily cron against the production URL, notify on failure only. **This is the only run that touches Production, and it is read-only plus a test-account login; every other run in this skill targets Preview.** Confirm with the owner that the failure-notification address is verified. He may defer this phase entirely — its production-login question is his decision.
- ⚠️ Adding that workflow must not touch `.github/workflows/ci.yml`. Its job — id `verify`, **display name `Install · Typecheck · Lint · Build`, which is the string branch protection requires** — must never be renamed (`docs/TECHNICAL-INTEGRITY.md`).

## Later re-runs

"Run the launch gate" before a major release repeats Phase 1 (refresh the scan — new features get new lines, the owner re-approves the additions), Phase 3 and Phase 4. Regression tests added by `/handle-error` (the error-tracking module, sprint **SYS3**) join this suite; keep the feature list in sync with them.

## Never

- Never write a test before the owner has approved the feature list; never silently alter an approved line.
- Never run anything but approved `@morning` specs against Production; never create a test user, account or row in the Production database.
- Never use real credentials, real applicant or partner identities, or secret values in a test or a report — env vars by **name** only, and never open `.env.local`.
- ⚠️ **This GitHub repo is public.** No real person's email, no account ids, project refs, dashboard URLs, gated guide text or Storage object paths in any committed test, fixture, report or feature list. The **only** addresses that may ever appear are the obviously-fake test accounts, on a domain that cannot receive mail, recorded per `docs/testing-setup/SETUP-CHECKLIST.md`.
- Never bypass bot protection, rate limits or deployment protection — the sanctioned bypass secret is the only door — and never weaken a protection to make a test convenient.
- Never assert a control the site does not have yet (`429`, CAPTCHA), and never record one as verified.
- Never issue GO from a partial run, a stale head, or with any test skipped or commented out.
- Never commit test artifacts or screenshots; never `git add -A` after a run — a run mutates the working tree.
- Never hand the owner a raw stack trace as an explanation. Translate, always.
