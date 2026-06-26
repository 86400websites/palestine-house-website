# Sprint S12 — Email-automation placeholders + settings

| | |
|---|---|
| **Date merged** | 2026-06-27 — PR #41 (merge `405643b`); post-merge `/close` = **GO**. |
| **Branch / PR** | `claude/sprint-s12-email-automation-placeholders` (deleted post-merge) / **#41** (merge `405643b`) |
| **Goal** | Wire Mailchimp + Resend across the six public/gated email touchpoints behind honest no-op placeholders, so the owner goes live by **adding keys + verifying the Resend sending domain alone** — no real-delivery test, no migration. |

## What shipped

Built in 11 owner-gated sub-steps (push-per-step into the open branch); every new user-facing string drafted + owner-approved at its gate; all four open scope questions answered via `AskUserQuestion` and all landed **zero-migration**.

- **12-0 — Setup + deps.** Added `resend@6.16.0` + `@mailchimp/mailchimp_marketing@3.0.80` (and only these). Completed the six server-only env **names** in `.env.example` (`RESEND_FROM_EMAIL`, `RESEND_TO_EMAIL`, `MAILCHIMP_SERVER_PREFIX`, `MAILCHIMP_AUDIENCE_ID` added with format hints; all commented, no values, no `NEXT_PUBLIC_`). `.env.local` confirmed gitignored.
- **12-1 — Mailchimp helper.** `src/lib/mailchimp/client.ts` (server-only): `upsertContact({ email, tags })` configures the SDK only when all three `MAILCHIMP_*` vars are present, idempotent `setListMember` (md5-lowercased-email hash) + `updateListMemberTags`; returns `{ configured:false }` and no-ops when absent — never throws, never fakes a send. Untyped SDK covered by a minimal local shim `src/types/mailchimp__mailchimp_marketing.d.ts` (not a third package).
- **12-2 — Booklet capture.** `POST /api/mailchimp/booklet-capture` (zod `{ email, booklet:'a'|'b'|'both' }`) tags `lead-booklet-a/b`. Wired **both** `LeadForm` (sections) and `FooterLeadForm` (layout) — the brief named only the first. Owner-approved success copy ("Thanks — the booklet is on its way." / "…booklets are on their way."); locked layout/classes unchanged.
- **12-3 — Apply tagging.** `applyAction` best-effort tags the applicant `['applicant']` after the insert, before `redirect()` (so `NEXT_REDIRECT` isn't swallowed). Graceful-degrade; never blocks sign-up.
- **12-4 — Resend helper.** `src/lib/resend/client.ts` (server-only): `sendEmail({ to, subject, text, html?, replyTo? })`, configured only when `RESEND_API_KEY` + `RESEND_FROM_EMAIL` present; guards both the returned `{ error }` and a thrown network failure; no-ops cleanly otherwise.
- **12-5 — Contact → Resend.** `POST /api/resend/contact` (zod `{ name, email, subject, message }`) emails `RESEND_TO_EMAIL` from `RESEND_FROM_EMAIL`, reply-to = submitter. **Email-only, no table/migration** (owner decision). Treats a missing `RESEND_TO_EMAIL` as not-configured. Form shows the approved verbatim "Thanks — your message is on its way."
- **12-6 — Support email.** `submitSupportRequestAction` best-effort emails the owner after the RPC succeeds; reply-to = the auth-session `user.email` (`profiles` stores no email). Graceful-degrade; confirmation unchanged.
- **12-7 — Approve/decline email.** `decideApplicationAction` reads the applicant via `admin_list_applications()` by id (the action holds only a boolean + id) and best-effort sends the owner-approved approved/declined body (declined → public `/contact`). Graceful-degrade; `is_admin()` gate untouched.
- **12-8 — Declined → contact.** Dashboard `!approved` branch reads the caller's own `applications.status` (owner-scoped RLS) and renders the approved declined notice + `/contact` link; pending unchanged. New `.ws-notice-link` style.
- **12-9 — Env + domain docs.** `SUPABASE-VERCEL-SETUP.md` gained an Email-integrations section (format hints + Resend SPF/DKIM/DMARC steps); S14 rate-limit/Turnstile deferral commented at each public write.
- **12-10 — Exit gate.** Adversarial **6-lens multi-agent review** (secret-safety · server/client boundary · no-op/fail-closed · input-validation · gating-intact · correctness/build, each finding adversarially verified) = **PASS, 0 blocking**; one non-blocking Preview-env finding fixed (see Deviations). Updated `PROJECT-STATUS.md` §1/§2/§6/§8 + `ROADMAP.md` S12 row. Added `docs/EMAIL-SETUP-CHECKLIST.md` (owner switch-on guide).

**Invariants held:** the `is_approved` approval gate + the `is_admin()` admin gate + the approval-gated `submit_support_request` are byte-identical (additive email code only); **no DB migration**; CSP unchanged (`connect-src 'self'` — both providers run server-side); all six provider keys server-only (no `NEXT_PUBLIC_`); no secrets in the diff; `.env.local` untracked.

## Prompt used

<details><summary>Exact implementation prompt</summary>

```text
You are my senior engineer for the Palestine House website, working in Claude Code.

Session start: read docs/PROJECT-STATUS.md §1–§2 (active sprint + open decisions), then the S12 scope + exit gate in docs/ROADMAP.md §B (the "S12 — Email-automation placeholders + settings" row), then docs/SECURITY-CHECKLIST.md §8 (API route rules) and docs/SUPABASE-VERCEL-SETUP.md (the env-var matrix). CLAUDE.md governs everything below. This sprint touches SECRETS (provider API keys) and PUBLIC WRITES (apply, contact, lead-magnet) — treat every step as a security-sensitive change.

Sprint: S12 — Email-automation placeholders + settings
Branch: claude/sprint-s12-email-automation-placeholders (create from latest main)

Goal:
Wire Mailchimp (booklet capture lead-booklet-a/b + newsletter + apply tagging) and Resend (contact + support + the approval/decline email + the declined→contact path) fully, behind HONEST no-op placeholders, so the owner goes live by adding keys + verifying the Resend sending domain ALONE. Each integration must no-op cleanly without its env vars (degrade gracefully, NEVER claim a send that did not happen), keep provider keys server-only (never NEXT_PUBLIC), keep public writes zod-validated and fail-closed in Production, and require NO real-delivery verification this sprint (the owner verifies when the keys/domain exist). Do NOT add Upstash rate-limiting or Turnstile — that is S14; leave a short comment at each public write noting the gap. Document the new env var NAMES only and the Resend SPF/DKIM/DMARC sending-domain steps. No new migration EXPECTED — S12 hooks into existing Server Actions, RPCs (admin_set_application_status / 0009, submit_support_request / 0019), and tables (applications, support_requests, profiles) — BUT confirm the approval/decline email's applicant-email read needs none (see step 8).

Execute in gated sub-steps (one owner gate after each):
1. (12-0) Setup + deps: add the resend + @mailchimp/mailchimp_marketing packages with pnpm (and only these). Confirm the S12 env var NAMES already exist in .env.example AND docs/SUPABASE-VERCEL-SETUP.md (MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX, MAILCHIMP_AUDIENCE_ID, RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_TO_EMAIL) — all server-only, NONE with a NEXT_PUBLIC_ prefix; add any missing NAME (no value). Confirm .gitignore still excludes .env.local. No wiring yet. STOP.
2. (12-1) Mailchimp client helper: create src/lib/mailchimp/client.ts — a server-only module that instantiates the Mailchimp SDK ONLY when MAILCHIMP_API_KEY + MAILCHIMP_SERVER_PREFIX + MAILCHIMP_AUDIENCE_ID are ALL present, exposes a typed upsertContact({ email, tags }), and no-ops cleanly (returns a neutral { configured:false } result, never throws, never fakes a send) when any is absent. Dev-only one-line "mailchimp not configured" log; silent in prod. STOP.
3. (12-2) Lead-magnet booklet capture: create src/app/api/mailchimp/booklet-capture/route.ts (POST), zod-validate { email, booklet: 'a'|'b'|'both', newsletter?: boolean }, call upsertContact with tags lead-booklet-a and/or lead-booklet-b (+ 'newsletter' when opted in). Wire src/components/sections/lead-form.tsx to POST to it and show the APPROVED success copy on a 200 (draft it per brand-voice and WAIT for my approval first). No-op → success when env absent; FAIL CLOSED in Production if a required key is missing (never silently drop the address). STOP.
4. (12-3) Apply tagging: in src/lib/auth/actions.ts applyAction, AFTER the applications row inserts and BEFORE the redirect('/dashboard'), call the Mailchimp helper to tag the applicant. GRACEFUL-DEGRADE ONLY — a tag failure must NEVER block sign-up (the account + application are already saved); log and continue. Confirm the tag trigger + which tags with me at the gate before wiring. STOP.
5. (12-4) Resend client helper: create src/lib/resend/client.ts — a server-only module that instantiates Resend ONLY when RESEND_API_KEY + RESEND_FROM_EMAIL are present, exposes a typed sendEmail({ to, subject, text/html, replyTo? }), and no-ops cleanly (neutral { configured:false }, never throws/fakes) when absent. STOP.
6. (12-5) Contact form → Resend: create src/app/api/resend/contact/route.ts (POST), zod-validate { name, email, subject, message }, send to RESEND_TO_EMAIL from RESEND_FROM_EMAIL with reply-to = the submitter's email. Wire src/components/sections/contact-form.tsx to POST to it and show the APPROVED confirmation on success (draft + WAIT for approval; the long-intended line is "Thanks — your message is on its way." but confirm it against docs/page-copy/01-public-pages/contact.md). No-op → success when env absent; FAIL CLOSED in Production when required-but-missing. Whether to also persist contacts to a new audit table is PROPOSAL-FIRST (see "Open scope questions") — default is email only, no migration. STOP.
7. (12-6) Support email: in src/lib/support/actions.ts submitSupportRequestAction, AFTER the submit_support_request RPC succeeds, send the owner a Resend email (to RESEND_TO_EMAIL, reply-to = the submitter's account email from the authenticated session — supabase.auth.getUser() → user.email; NOTE: profiles does NOT store the email, so read it from the auth user object the action already holds, not profiles). GRACEFUL-DEGRADE — the request is already stored (0019); an email failure is logged, the user still sees the existing approved "Got it — we'll be in touch." The approval-gate on this action is unchanged. STOP.
8. (12-7) Approval / decline email (deferred from S4): in src/lib/admin/actions.ts decideApplicationAction, AFTER the admin_set_application_status RPC succeeds, send the applicant a Resend email — approved → an approved "you're in, sign in to access your account" body; declined → an approved "thanks for applying, we're not moving forward, questions? contact us [link to public /contact]" body. CONFIRM THE EMAIL-FETCH PATH AT THE GATE FIRST: admin_set_application_status returns ONLY a boolean (the new approval state), and admin RLS on the applications table is owner-scoped (user_id = auth.uid()), so the applicant email is NOT already in hand inside this action — it must come from admin_list_applications() (find the row by id) OR an extended/returns-email RPC. If an RPC change is needed, that is a VERSIONED MIGRATION (up + .down.sql + grants, RLS-safe, TEST project first per WORKFLOW.md §14) — propose it before wiring; do NOT assume the email is available. Draft BOTH bodies per brand-voice and WAIT for my approval. GRACEFUL-DEGRADE — the status flip is authoritative; an email failure is logged, the admin toast is unchanged. The is_admin() gate is untouched. STOP.
9. (12-8) Declined → contact path: in src/app/(workspace)/dashboard/page.tsx, inside the existing !approved branch, distinguish a DECLINED applicant (read this user's applications.status === 'declined') from a pending one, and render an APPROVED "we're not moving forward right now — questions? Contact us" message linking to public /contact instead of the generic under-review notice. Draft the copy + WAIT for approval. No auth / gate / RLS change; the link target is the public contact page so nothing privileged leaks. STOP.
10. (12-9) Env + domain docs: confirm (don't duplicate) the S12 env var NAMES + format hints in docs/SUPABASE-VERCEL-SETUP.md (e.g. MAILCHIMP_SERVER_PREFIX is a region like us1/us2/eu1; RESEND_FROM_EMAIL is on the verified sending domain). Document the Resend sending-domain SPF / DKIM / DMARC verification checklist for me to run once the domain exists. Add a short code comment at each public write noting rate-limiting + Turnstile are DEFERRED to S14. No real keys, no real domain, anywhere. STOP.
11. (12-10) Sprint exit gate — full-diff review of the whole sprint (the two client helpers + all six email touchpoints): every integration no-ops cleanly with env vars absent (and NEVER fakes a send), all six provider keys are server-only (no NEXT_PUBLIC_ anywhere), every public write stays zod-validated AND fails closed in Production, the approval/admin/support gates are byte-identical, no secret is in the diff, CSP is unchanged (connect-src 'self' — both providers run server-side). NOTE: docs/SECURITY-CHECKLIST.md §15's rate-limit/Turnstile clause is a KNOWN, owner-accepted deferral to S14 (ROADMAP S14 row; PROJECT-STATUS §5/§7) — do NOT treat §15's Upstash/Turnstile requirement as a hard fail for the new lead-magnet/contact routes this sprint; the bar for THIS sprint is zod + fail-closed-in-Production + the deferred-gap comment. Run pnpm run typecheck && pnpm run lint && pnpm run build. Then update docs/PROJECT-STATUS.md (§1, §2 board, §6 infra status, change log) and tick S12 in docs/ROADMAP.md. STOP.

Per-step protocol (every sub-step, no exceptions):
1. Read the exact input(s) for this sub-step BEFORE coding: the target form/action/route file, the matching docs/page-copy/ canon, docs/SECURITY-CHECKLIST.md §8, and docs/SUPABASE-VERCEL-SETUP.md for env names.
2. Build it: smallest safe change, one focused concern. Provider SDKs are called ONLY from Route Handlers / Server Actions / server-only library modules — never from a Client Component.
3. Verify: pnpm run typecheck && pnpm run lint && pnpm run build; then spot-check the affected form/route — confirm with env vars ABSENT it submits and shows the honest success/confirmation (no thrown error, no faked send), and that nothing else broke.
4. Self-review the diff for any secret leak, NEXT_PUBLIC_ misuse, missing zod, or fail-open path; fix before committing (full review at the exit gate).
5. Commit AND push to the task branch — every sub-step, so I review live in the open PR.
6. Report in ≤6 lines: what shipped, checks run, anything flagged — then STOP and WAIT for "proceed". Never start the next sub-step without it. For ANY new user-facing string (lead/contact/support/approval/decline/declined-to-contact copy) AND any schema/scope decision (e.g. a contacts audit table, or the approval-email RPC change), show me the draft and WAIT for my approval before shipping it.

Owner remote commands: "proceed" = next step · "pause" = hold · "status" = where are we ·
"fix <thing>" = fix before continuing · "skip to <n>" = jump (record the skip in PROJECT-STATUS.md).

Locked inputs (read before coding; never invent, never paraphrase):
- Brand voice for ALL new strings (success/confirmation/approval/decline/declined-to-contact): docs/page-copy/00-global/brand-voice.md (warm, short, concrete; never charity tone, hype, slogans, or filler; no exclamation marks).
- Existing approved copy on the touched pages: docs/page-copy/01-public-pages/contact.md, the shared-ctas / booklet lead-magnet copy, and docs/page-copy/03-member-workspace/ (dashboard pending state, support). Reuse the long-intended approved lines where they already exist; only draft NEW strings where none exist, and get my approval.
- Env names + the matrix: docs/SUPABASE-VERCEL-SETUP.md (MAILCHIMP_*, RESEND_* are all server-only). Never add a value, never a NEXT_PUBLIC_ prefix.
- Security envelope: docs/SECURITY-CHECKLIST.md §8 + AGENTS.md "Security checks" (zod-validate inputs; no-op cleanly when env absent in local/Preview; fail closed in Production; no secret behind NEXT_PUBLIC_; no stack traces / upstream error bodies leaked).
- Proof numbers are fixed: 10 · 30 · 200+ · 267 · 120-day launch. Header/footer chrome is locked — never redesign per page.

Before editing:
1. Inspect the repo (package.json, next.config.ts, src/app/, the four form components, the three Server Actions, and supabase/sql/migrations to confirm the existing RPCs/tables) and read every locked input above.
2. Propose a short plan and confirm scope before changing files — especially: (a) the Mailchimp apply-tag trigger + tags, (b) whether the contact form also persists to a new audit table or emails only, (c) the no-op-vs-fail-closed posture per write, (d) how the approval/decline email obtains the applicant email (admin_list_applications() lookup vs a new returns-email RPC migration).

While editing:
- Smallest safe change; one focused concern per commit; no unrelated refactors.
- Call the Mailchimp/Resend SDKs ONLY from Route Handlers / Server Actions / server-only modules. NEVER call a provider API from the browser. Server Components stay the default; "use client" only where the form already is.
- NEVER put a provider key behind a NEXT_PUBLIC_* name; NEVER hardcode or commit a secret; NEVER commit .env.local. Read provider env vars only server-side.
- Each integration MUST no-op cleanly when its env vars are absent (degrade gracefully; NEVER claim a send that did not happen) AND fail closed in Production for the PUBLIC writes (apply, contact, lead-magnet) — never silently drop a submission. Support + approval/decline emails are gated (approval-gated / admin-only), so on a send failure store/flip the data, log, and continue.
- Public writes stay zod-validated (the Route Handler re-validates server-side even though the form already does — defence in depth).
- Do NOT add Upstash rate-limiting or Turnstile (that is S14) — add a short code comment at each public write noting the deferred gap. SECURITY-CHECKLIST §15's rate-limit/Turnstile clause is the S14 deferral, so don't treat it as a blocker for the new public-write routes THIS sprint; zod + fail-closed-in-Production + the deferred-gap comment is the bar.
- No DB migration this sprint UNLESS I approve one at the gate — either the optional contacts audit table OR a returns-email RPC for the approval/decline email if that read needs it (then: versioned up + .down.sql + RLS default-deny / grants in the PR, TEST project first per WORKFLOW.md §14).
- Do not change CSP / next.config.ts — both providers run server-side; connect-src stays 'self'.

Verification (must pass before reporting done):
- pnpm run typecheck && pnpm run lint && pnpm run build
- git status — .env.local untracked, no secret in the diff, no NEXT_PUBLIC_ provider key.
- Manual, at 320px AND desktop (with env vars ABSENT — the Preview/local default):
  - Lead-magnet form submits and shows the approved success copy (no thrown error; the address is captured / the no-op is honest, not a faked send).
  - Contact form submits and shows the approved confirmation (no-op honest send).
  - Apply still creates the pending account + application and lands on /dashboard even with Mailchimp unconfigured (tagging is best-effort).
  - Support submit still stores + shows "Got it — we'll be in touch." with Resend unconfigured; the reply-to (when configured) is the submitter's account email from the auth session (user.email), not from profiles.
  - Approve/decline in /admin/approvals still flips status + shows the admin toast with Resend unconfigured; no error surfaced.
  - A declined applicant signing in sees the declined message + a working link to public /contact (a pending applicant still sees the under-review notice).

When the sprint is complete, in the same branch: update docs/PROJECT-STATUS.md (§1, §2 board, §6 infra status, change log) and tick S12 in docs/ROADMAP.md.

Report at the end: summary · files changed · commands + results · risks/follow-ups · suggested commit message · sprint status. Push policy: commit + push after every gated sub-step (standing authorization, 2026-06-12) so I review in the open PR; never merge, never push beyond the task branch.

Open scope questions to raise at the relevant gate (don't decide silently):
- Apply tagging: tag immediately on apply success (recommended — capture the lead now; owner segments later) vs only on approval.
- Lead-magnet: keep the single form and tag both lead-booklet-a + lead-booklet-b (recommended) vs split forms; whether to add a newsletter opt-in that also tags 'newsletter' (the lead copy already says "No spam. Unsubscribe anytime.").
- Contact form record: email-only (recommended default; no migration) vs a new contacts audit table (next free migration number — 0023 today, but S11 ships migrations; confirm against supabase/sql/migrations/ at run time: contact_name/email/subject/message/created_at, RLS default-deny, admin-read) — proposal-first if you want the audit log.
- Approval/decline email-fetch: admin_list_applications() lookup by id (recommended — no migration; reuses the existing admin RPC) vs a new/extended returns-email RPC (proposal-first; a versioned migration if approved).
- No-op log destination: dev console only vs Sentry in prod, so you can see why emails aren't flowing during setup.
- Failed-send posture per write (recommended: graceful-degrade for contact/support/approval where the data is captured + logged; fail-closed for the public lead-magnet/contact submissions in Production so nothing is silently dropped — confirm the exact line for each).
```

</details>

## Checks & results

typecheck ✅ · lint ✅ · build ✅ (46 routes; `/api/mailchimp/booklet-capture` + `/api/resend/contact` dynamic `ƒ`). Run after every sub-step.

- **Exit-gate review (workflow):** adversarial 6-lens (secret-safety · server/client boundary · no-op/fail-closed · input-validation · gating-intact · correctness/build) with each finding adversarially verified = **PASS, 0 blocking.** One non-blocking Preview-env finding fixed.
- **Independent Codex review:** **Approve — zero blocking, no fix/re-review cycle.** Confirmed `.env.local` not in diff, provider vars server-only (no `NEXT_PUBLIC_`), SDK imports confined to server-only modules, public routes zod + fail-closed via `VERCEL_ENV`, admin/support gates intact, CSP/headers unchanged (`connect-src 'self'`).
- **Manual delivery smoke:** intentionally **not** run — this sprint ships no-op placeholders; the owner verifies live once the keys + Resend domain exist (see `docs/EMAIL-SETUP-CHECKLIST.md`).

## Deviations & learnings

- **Fail-closed must key on `VERCEL_ENV`, not `NODE_ENV`** (the one exit-gate fix). Vercel sets `NODE_ENV=production` for **both** Production and Preview builds, so a `NODE_ENV`-gated fail-closed would have made keyless PR Previews return 503 + a form error instead of the intended honest no-op. Single-sourced as `isProductionRuntime()` in `src/lib/env.ts` (used by both public routes + both helpers' dev-notices). **Reusable in S14** (the same distinction applies to rate-limit/Turnstile fail-closed posture).
- **Two lead forms, not one.** The booklet capture is split into `LeadForm` (sections) **and** `FooterLeadForm` (layout); the brief named only the first. Wired both — otherwise the footer would keep silently no-op'ing.
- **Local `.d.ts` shim instead of `@types`.** `@mailchimp/mailchimp_marketing` ships no types; rather than add a third package (the brief said "only these two"), added a minimal `src/types/mailchimp__mailchimp_marketing.d.ts` covering just the SDK surface used. `resend` ships its own types.
- **No newsletter opt-in** (owner decision) → the brief's `newsletter?: boolean` field was dropped; the booklet route schema is `{ email, booklet }` and every form sends `booklet:'both'` (the `single` prop is only a button-label nicety). The owner judged a checkbox would add an element not in the locked mockup.
- **All four scope decisions landed zero-migration:** tag on apply-success · contact email-only (no `contacts` table) · approval-email via the existing `admin_list_applications()` (no returns-email RPC). So **no migration this sprint** (next free was 0025, unused).
- **`page-copy` absent from this clone** (gitignored — OneDrive is canon, and the owner clones fresh per sprint). Read the brand-voice / contact / dashboard / admin canon from the `AI Reference Materials\page-copy\` mirror; confirmed the contact confirmation verbatim ("Thanks — your message is on its way.").
- **Process note:** the exit-gate review workflow first failed on a script typo (`confirmedReal` shorthand vs the declared `realConfirmed`) after all agents had run; resumed from the cached run ID, so only the fixed assembly re-ran (no agents re-spent).

## Follow-ups

- **Switch-on (owner, env-vars-only):** add the six server-only `MAILCHIMP_*` / `RESEND_*` vars in Vercel + verify the Resend SPF/DKIM/DMARC sending domain, then redeploy. Step-by-step: **`docs/EMAIL-SETUP-CHECKLIST.md`** (and the technical matrix in `docs/SUPABASE-VERCEL-SETUP.md`).
- **Booklet delivery needs a Mailchimp automation** (tag → send): the site only *tags* the contact; a Mailchimp journey keyed on `lead-booklet-a/b` actually emails the booklet. Flagged in the checklist.
- **Merge path:** open the PR → Vercel-Preview check (forms should honestly no-op to success on the keyless Preview) → merge → `/close`, then flip this record's Date merged / PR.
- **Deferred to S14:** Upstash rate-limiting + Turnstile on the public writes (deferred-gap comments in place at each route) — the `SECURITY-CHECKLIST.md` §15 clause for these routes is the accepted S14 deferral (`PROJECT-STATUS.md` §5/§7).
