# Test Report — Palestine House — 2026-08-22

One row per feature from [`docs/FEATURE-LIST.md`](../FEATURE-LIST.md) (approved by the owner 2026-08-22). Every result in plain words. The newest report is the current truth. **This is the first automated whole-site measurement this project has ever had** — the site launched 2026-06-19 and had never run a suite before today.

---

## Run header

- **Run type:** **FULL** — all 98 tests, no skips, no retries used on the green run.
  *(Count as measured at `b2ef492`. The later commits of this sprint added the `@morning` specs and, after the D-SYS-1 review, per-project `grep` — the suite now schedules **136** on a full run and **34** for the morning check. The site code is byte-identical throughout; no assertion measured on 2026-08-22 was removed.)*
- **Environment:** deployed Vercel **Preview** of branch `claude/sprint-sys2-launch-gate-run` (deployment built from `43cee57`; site code identical to `main` = `cecb0d9` — every commit on this branch is tests and docs only, zero `src/` changes). Preview URL recorded in the session log; reached through the sanctioned Protection Bypass (protection is ON).
- **Data separation confirmed:** two ways, by the robot — no production ref appears in anything the Preview serves (`tests/e2e/setup/verify-preview-env.ts` tripwire), and the three robot accounts, which exist **only** in the non-production project, signed in successfully through the real `/login` form. A Preview on the production database could not have let them in.
- **Viewports:** desktop (1440) **and 320px** — every visual line ran at both.
- **Roles exercised:** anonymous ✅ · pending partner ✅ · approved partner ✅ · HQ admin ✅ — plus two disposable robot applicants per run for the apply → decline / apply → approve journeys.
- **Feature list version:** approved 2026-08-22 by the owner · 54 lines · 3 proof-cell corrections during the run, each change-logged in the list and re-stated under "For the owner to re-approve" below — no line was silently weakened.
- **Totals:** 98 automated tests → **98 PASS · 0 FAIL** · manual lines: MN-001 **PASS** (owner-confirmed), MN-003 **partial** (3 of 4 steps robot-proven — see below), MN-002 standing (relaunch ritual) · 3 pending SYS1.5 (PR-001..003 — the controls do not exist yet, so they are *not tested*, not passed).
- **Real emails sent during the green run:** 4 to the HQ inbox (1 contact · 2 application notifications · 1 Ask HQ), all subject-lined ROBOT TEST; plus 6 to the robots' undeliverable `.invalid` addresses (2 application confirmations, 1 decline, 1 approval — these never arrive anywhere). **Across the whole 20-round fix loop: roughly 60 ROBOT-TEST-marked emails reached the HQ inbox** — more than intended, owned plainly below.

## Results

**Section A — public shell: all PASS.** Every public page renders clean at both sizes with zero console errors (PG-001); every same-origin link resolves (PG-002); a wrong URL gets the branded 404 (PG-003); header and footer are identical everywhere (PG-004); all nine retired workspace paths and their sub-pages 307 to `/dashboard` (PG-005); `/focus-areas` states 22 · 88 and no page anywhere shows the retired numbers (PG-006); the Apply button reaches `/apply` from every page and the review promise is stated on home and on `/apply` (PG-007); sitemap/robots/manifest expose only the public shell (PG-008); the header knows signed-in from signed-out (PG-009).

**Section B — the approval gate: all PASS.** This is the section that matters most, and every cell held:

| ID | Result | In plain words |
|---|---|---|
| AC-001 | PASS | An anonymous visitor typing any of the 28 gated URLs ends up on the sign-in page, and the raw response carries no focus-area title, no guide text, no storage path — checked against real content titles read at runtime |
| AC-002 | PASS | Same for all six admin URLs — no admin content renders for a stranger |
| AC-003 | PASS | A pending partner sees "Your application is under review." and nothing else — no summary, no guide, no template, anywhere |
| AC-004 | PASS | A pending partner's Ctrl/⌘+K search returns an empty index — the raw payload carries no titles, ids, storage paths or bucket names |
| AC-005 | PASS | A pending partner CAN reach `/account` (the one deliberate exception) and it shows only their own details |
| AC-006 | PASS | An approved partner opening any admin URL gets the branded 404 page with zero admin content — approved is never admin |
| AC-007 | PASS | An approved partner gets everything: all five platform pages with real content, clean at both sizes |
| AC-008 | PASS | The HQ admin reaches all six admin screens |
| AC-009 | PASS | Nothing gated is ever built into a denied response — the streamed body of a denied request carries no content markup |
| AC-010 | PASS | Login works, sign-out works, and the same door is shut again immediately after |
| AC-011 | PASS | An already-signed-in visitor who opens `/login` is sent straight on |
| AC-012 | PASS | A wrong password gets a clear message and no session |
| AC-013 | PASS | Password-reset requests answer identically whether or not the account exists, and a garbage reset link fails to a safe page with no session |
| AC-014 | PASS | Apply = sign-up: one submission creates the pending account + application and lands the applicant on the pending dashboard |
| AC-015 | PASS | Decline holds the door shut (the declined message shows, nothing resolves); approve is the one unlock (content appears with no re-login) |

**Section C — gated content: all PASS.** 5 · 6 · 6 · 5 focus areas = 22 (CT-001); each focus area shows exactly the model — summary, one Simple guide card, Watch Video, templates — and none of the retired card types (CT-002); all 22 guide pages open with real content (CT-003); a template really downloads through a signed URL, bytes on disk (CT-004); a pending or anonymous caller never receives a signed URL or a storage path (CT-005); search finds content and navigates for an approved partner (CT-006); a Drafted focus area vanishes everywhere — section pages, guide URL, census 22→21 — and returns on Live (CT-007).

**Section D — forms and email: all PASS.** Contact rejects bad input client- and server-side and delivers when valid (FM-001/002); Apply rejects bad input (FM-003); a duplicate application cannot be created — one queue row, re-submit lands on the dashboard (FM-004); applying notifies both sides — **FM-005 and FM-008 PASS via MN-001 (the owner opened the HQ inbox and confirmed the application-received pair and the approve/decline copy); there is no automated send-boundary assertion**, and the D-SYS-1 review was right to flag that the earlier wording implied one; Ask HQ works for an approved partner and its form never renders for a pending one (FM-006); `/account` saves the display name and offers the password-change path (FM-007); approve/decline sends the right email variant (FM-008 — same MN-001 evidence).

**Section E — HQ admin: all PASS.** The approvals queue lists, approves and declines (AD-001); the pages editor saves and the platform shows it — then it was restored (AD-002); the focus-areas editor edits, toggles Draft↔Live and reorders — restored (AD-003); the files manager refuses a `.txt` **naming what arrived**, refuses an over-4 MB file, uploads a real PDF that appears in the partner's grid, and deletes it behind the typed-name confirmation — store left exactly as found (AD-004); admin management adds and removes an admin, and **refuses self-removal** (AD-005 — the last-admin refusal is enforced by the same server rule, deliberately not exercised live because it would mean touching the owner's own admin row).

**Section F — protection.** PR-004 PASS: all six security headers present, CSP shaped exactly as shipped (YouTube embed origin as the only third-party allowance). PR-001/002/003: **N/A — pending SYS1.5.** The rate-limit and Turnstile controls do not exist yet (§7 #1, deferred behind SYS2 by D-SYS-11); not passed, not failed, not tested. SYS1.5 has not merged, so this does not block the verdict.

**Section G.** IN-001 PASS — the session probe answers exactly `{"authed": true/false}` and nothing else. IN-002 PASS — proven by the applicant journey succeeding end to end with Mailchimp absent.

**Section H — manual lines, the owner's part:**

| ID | Result | What the owner does |
|---|---|---|
| MN-001 | ✅ **PASS** | Owner confirmed 2026-08-22: the ROBOT-TEST emails arrive and read correctly in the HQ inbox (contact · application notification · Ask HQ · approve/decline). The four email flows are verified end to end — sent by the site, delivered by Resend, correct in a real client |
| MN-002 | STANDING | The one real submission by hand on the live domain — the relaunch ritual per `LAUNCH-CHECKLIST.md` Phase 3; not part of this Preview gate |
| MN-003 | ⚠️ **PARTIAL — 3 of 4 steps proven by robot, no human walk performed** | Automated on 2026-08-22 against the Preview: **(1)** a reset request is accepted and Supabase issues a real one-time token and fires the recovery email (auth log shows `mail.send`, type `recovery`); **(2)** that token, opened at `/auth/confirm?…&type=recovery`, **is accepted** — the browser lands on `/update-password` with the set-password form; **(3)** a garbage or expired token fails closed to `/forgot-password` with no session, and the request answers identically for a known and an unknown address (AC-013, green every run). **Unproven: the final submit** — typing the new password, seeing "Done. You can sign in now.", and signing in with it. Two environmental blockers, neither a site defect: Supabase's address validator stops issuing recovery tokens to undeliverable addresses after the first, and `SUPABASE_SECRET_KEY` (which lets the admin API mint a link with no email at all) is not in the local secrets file. **To close it without a human:** add the non-production `SUPABASE_SECRET_KEY` to `.env.local` and run `pnpm exec tsx tests/e2e/setup/verify-reset-flow.ts link` → `complete <token> temp` — the tool is written and waiting |

## Failures, grouped

**None open.** The first run found 33 red results; over ~20 fix-loop rounds every one traced to the *tests* learning the site's real architecture — not one site defect. The site's behaviors that initially *looked* wrong and turned out right, kept as recorded observations:

1. **Gated pages stream** — a denied request can answer HTTP 200 whose stream carries only a loading shell plus the redirect; the browser always lands on `/login` and no content ever streams. Production behaves identically (verified live, read-only). The specs assert the substance, not the status code.
2. **Admin route titles are visible to strangers** (Low, observation): the `<title>`/social metadata of admin pages (e.g. "Focus areas — Content admin") renders even on a denied stream. Structure only — the same class as the resolved §7 #3 — zero data. Logged here; owner may send it to the backlog.
3. **A signed-in non-admin's `/admin` answer is the 404 page under a 200 status** on the redirect-chain hop (a Next.js streaming soft-404). The UI and content denial are complete; recorded per run as an annotation.
4. **The apply thank-you view is a fallback** — a successful apply signs the applicant in and lands on the pending dashboard (S6 step 3.5, by design).
5. **A decision is final in the approvals UI** — Approve/Decline exist only while pending, by design; hence one disposable applicant per branch.

## Owned plainly: the fix-loop email volume

The approved plan was "a few marked-TEST emails per full run" — and per run it was (4 to the HQ inbox). But the fix loop ran the full suite ~20 times, so roughly **60 ROBOT-TEST emails** reached the HQ inbox today. All are subject-lined as robot tests; delete them in one search. Prevented from recurring two ways: journeys never auto-retry, and [`tests/e2e/README.md`](../../tests/e2e/README.md) now instructs iterating with the email-free projects (`--project=desktop --project=mobile-320`) and running journeys only when they are what changed.

## Owner re-approvals (feature-list change log, never silent)

**All three re-approved by the owner, 2026-08-22** ("Ok approved"):

- **PG-007** — the literal tagline lives on the home platform card; `/apply` states the same promise in its own approved copy.
- **AC-006** — the denial substance is the branded 404 page + zero admin content; the HTTP status can read 200 on the hop.
- **FM-007** — `/account` has no in-place password form by design; its Password card links into the reset flow.

## Verdict

**GO** — a FULL run, 98/98, both viewports, all four roles, no test skipped, disabled or weakened, measured at `b2ef492`.

**Then the mandatory D-SYS-1 independent review returned BLOCKING, and it was right.** Its findings were fixed rather than argued with — the config defect (the two morning projects had no `grep` of their own, so a plain `pnpm run test:e2e` ballooned to 192 tests and put credentialed specs inside credential-free projects), a production-URL refusal for every write-capable project, three denial assertions that proved the UI rather than the invariant (AC-003 now reads raw responses, CT-005 now attacks the download issuer itself, AC-001/002 now assert `/login?next=` rather than a string the public header carries anyway), a poisoned-baseline hole in the leak probes, and a missing `finally` that could have left the pending robot in the `admins` table. Record: [`code-reviews/sys2-launch-gate-review.md`](../code-reviews/sys2-launch-gate-review.md). **The GO stands on the re-run after those fixes**, recorded below.

- **Verdict: GO · Date: 2026-08-22 · Signed: Mohammad Katada Siddiqui (owner)** · Full-run report: this file.

**The one thing this GO does not claim**, stated plainly so nobody later believes it did: **MN-003's final step is unproven** — the reset request, the link acceptance and the fail-closed behaviour are all proven, but no robot or human has yet typed a new password on `/update-password` and signed in with it. The owner has consciously accepted this at GO, on the strength of the three proven steps, and it is carried as an open manual line here and in `PROJECT-STATUS.md` §7 until the non-production `SUPABASE_SECRET_KEY` closes it automatically. It is not a discovered defect; it is a gap in coverage.

**On this GO** → the Launch Gate line in [`LAUNCH-CHECKLIST.md`](../LAUNCH-CHECKLIST.md) → "The two that were never satisfied" is ticked for the first time in this project's life. Morning check: set up as **Option A** (logged-out only, **zero standing credentials — nothing to add to GitHub**), which is Claude Code's recommendation and the reversible default; the owner asked how it works rather than choosing, so the A→B upgrade stays open and is one commit away. Details in [`MORNING-CHECK-TEMPLATE.md`](../testing-setup/templates/MORNING-CHECK-TEMPLATE.md) and the workflow's own header.

## Public-repo rule

This report contains no real person's identity, no account id, no project ref, no credential, no gated content excerpt and no storage path. The only addresses referenced are the robots' undeliverable `.invalid` ones.
