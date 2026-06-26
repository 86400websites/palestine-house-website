# S12 — Email-automation placeholders + settings

| | |
|---|---|
| **Status** | ⬜ Ready to run (not started) |
| **Branch** | `claude/sprint-s12-email-automation-placeholders` (from latest `main`) |
| **Decision** | D-S10-b replan (owner direction, 2026-06-26) — Stage 3 resequenced; this sprint wires Mailchimp + Resend as honest no-op placeholders, switch-on by env vars + a verified domain alone |
| **Goal** | Wire all the public/gated email touchpoints (booklet capture, newsletter, apply tagging, contact, support, approval/decline + declined→contact) to Mailchimp + Resend behind clean no-op placeholders, so the owner goes live by adding keys + verifying the sending domain only — no real-delivery test required this sprint |

> This is the **ready-to-run brief** (not a post-merge record). Paste the prompt below into a fresh Claude Code session to run S12 in owner-gated sub-steps; save the completed record (Mode B, `/sprint-prompt save`) **after** the PR merges. **Re-validate against repo state before running** — the codebase will have moved on (S10 and S11 land before S12). Scope + exit gate: `ROADMAP.md` §B (S12 row); env names: `docs/SUPABASE-VERCEL-SETUP.md`; security envelope: `docs/SECURITY-CHECKLIST.md` §8 + `AGENTS.md`. **DEPENDS ON S3 (auth/apply) + S4 (approve/decline) — both must be merged before this runs.** *(ROADMAP lists the S12 dependency as S3 only; this brief additionally requires S4 because the deferred approval/decline email hooks `decideApplicationAction` + `admin_set_application_status` (S4) — both must be on `main`.)* **Rate-limiting + Turnstile are NOT in this sprint — they are S14.**

## Scope (11 gated sub-steps)

1. **(12-0) Setup + deps** — add the `resend` + `@mailchimp/mailchimp_marketing` packages (pnpm); confirm the S12 env var **names** already exist in `.env.example` + `docs/SUPABASE-VERCEL-SETUP.md` (no values, no `NEXT_PUBLIC_` prefix); confirm `.gitignore` still excludes `.env.local`. No code wiring yet.
2. **(12-1) Mailchimp client helper** — `src/lib/mailchimp/client.ts`: server-only helper that instantiates the SDK **only when** `MAILCHIMP_API_KEY` + `MAILCHIMP_SERVER_PREFIX` + `MAILCHIMP_AUDIENCE_ID` are all present; typed `upsertContact({ email, tags })`; **no-ops cleanly** (returns a neutral not-configured result, never throws, never fakes a send) when any env var is absent. Log a one-line `not configured` notice in dev only.
3. **(12-2) Lead-magnet booklet capture** — Route Handler `src/app/api/mailchimp/booklet-capture/route.ts` (POST, zod-validates email + booklet preference single/both [+ a newsletter opt-in flag, per the decision below]); tags `lead-booklet-a` and/or `lead-booklet-b` (+ `newsletter` when opted in). Wire `src/components/sections/lead-form.tsx` to POST to it; replace the honest "check back soon" no-op with the **owner-approved success copy** (draft + gate). No-ops to success when env absent; **fails closed in Production** if the key is required but missing.
4. **(12-3) Apply tagging** — in `applyAction` (`src/lib/auth/actions.ts`), **after** the application row inserts and **before** the `/dashboard` redirect, call the Mailchimp helper to tag the applicant. **Graceful-degrade only** — a tag failure must never block sign-up: the account + application are already saved; log and continue. (Confirm the trigger timing at the gate — recommend tag on apply success, see decision.)
5. **(12-4) Resend client helper** — `src/lib/resend/client.ts`: server-only helper that instantiates Resend **only when** `RESEND_API_KEY` + `RESEND_FROM_EMAIL` are present; typed `sendEmail({ to, subject, ... , replyTo? })`; **no-ops cleanly** (neutral not-configured result, never throws/fakes) when absent.
6. **(12-5) Contact form → Resend** — Route Handler `src/app/api/resend/contact/route.ts` (POST, zod-validates name/email/subject/message); emails `RESEND_TO_EMAIL` from `RESEND_FROM_EMAIL`, `reply-to` = the submitter's email. Wire `src/components/sections/contact-form.tsx` to POST to it; replace the honest no-op micro-copy with the **owner-approved confirmation** (draft + gate). No-ops to success when env absent; **fails closed in Production** when required-but-missing. *(Optional `contacts` audit table is proposal-first — see decision; default = email only, no new migration.)*
7. **(12-6) Support email** — in `submitSupportRequestAction` (`src/lib/support/actions.ts`), **after** the `submit_support_request` RPC succeeds, send the owner a Resend email (`to` = `RESEND_TO_EMAIL`, `reply-to` = the submitter's account email from the authenticated session — `supabase.auth.getUser()` → `user.email`; `profiles` does not store email). **Graceful-degrade** — the request is already stored (0019); an email failure is logged, the user still sees the existing "Got it — we'll be in touch." confirmation. Approval-gated path is unchanged.
8. **(12-7) Approval / decline email** *(deferred from S4)* — in `decideApplicationAction` (`src/lib/admin/actions.ts`), **after** the `admin_set_application_status` RPC succeeds, send the applicant a Resend email: on `approved` → the owner-approved "you're approved, sign in" copy; on `declined` → the owner-approved "not moving forward, questions? contact us" copy with a link to public `/contact`. **CONFIRM the applicant-email read path at the gate** — `admin_set_application_status` returns **only a boolean** (the new approval state) and admin RLS on `applications` is owner-scoped, so the applicant email is **not** in hand inside the action; it must come from `admin_list_applications()` (find the row by id) **or** an extended/returns-email RPC. If an RPC change is needed it is a **versioned migration** (up + `.down.sql` + grants, TEST-first per `WORKFLOW.md` §14) — propose it first; do not assume the email is already available. **Graceful-degrade** — the status flip is authoritative; an email failure is logged, the admin toast is unchanged. Both bodies drafted per brand-voice + gated. `is_admin()` gate untouched.
9. **(12-8) Declined → contact path** — in the gated dashboard pending branch (`src/app/(workspace)/dashboard/page.tsx`, the `!approved` branch ~line 36), distinguish a **declined** applicant (read `applications.status === 'declined'`) from a pending one and show the **owner-approved** "we're not moving forward right now — questions? Contact us" message linking to public `/contact`. No auth/gate/RLS change; the link target is the public contact page (no privileged info leaks). Draft + gate the copy.
10. **(12-9) Env + domain docs** — confirm (don't re-add) the S12 env var **names** + format hints in `docs/SUPABASE-VERCEL-SETUP.md` (e.g. `MAILCHIMP_SERVER_PREFIX` = a region like `us1`/`eu1`); document the **Resend sending-domain SPF / DKIM / DMARC** verification checklist for the owner to run once the domain exists. Leave a short code comment at each public write noting rate-limiting + Turnstile are **deferred to S14** (the known gap). No real keys, no real domain anywhere.
11. **(12-10) Exit gate** — full-diff review of the whole sprint (the two client helpers + all six email touchpoints): every integration no-ops cleanly with env vars absent (never fakes a send), keys are server-only (no `NEXT_PUBLIC_`), public writes stay zod-validated + fail-closed in Production, the approval/admin/support gates are untouched, no secrets in the diff, CSP unchanged. *(Note: `SECURITY-CHECKLIST.md` §15's rate-limit/Turnstile clause is a known, owner-accepted deferral to S14 — ROADMAP S14 row; `PROJECT-STATUS.md` §5/§7 — so for the new lead-magnet/contact routes the bar is zod + fail-closed-in-Production + the deferred-gap comment, NOT §15's rate-limit/Turnstile.)* `pnpm run typecheck && lint && build` green. Update `docs/PROJECT-STATUS.md` (§1/§2 + change log + §6 infra status) and tick **S12** in `docs/ROADMAP.md`. **Run the Codex independent review (below) — this sprint touches secrets + public writes.**

## Prompt used

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

## Independent review (required)

This sprint touches **secrets** (six provider API keys) and **public writes** (apply, contact, lead-magnet) — per `AGENTS.md` an independent Codex review is **required** before merge. Run it on the branch diff after 12-10, then fix any blocking finding and re-review.

```text
You are my independent code reviewer for the Palestine House website.
Read AGENTS.md in the repo root — it defines your rules, priorities, and the
blocking gating checks. Review the branch DIFF only (vs main), not the whole repo.

This is the S12 email-automation sprint (Mailchimp + Resend wired as no-op
placeholders). Focus your review on:
- Secret safety: no provider key (MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX,
  MAILCHIMP_AUDIENCE_ID, RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_TO_EMAIL)
  behind a NEXT_PUBLIC_* name, hardcoded, committed, or read in client code;
  no .env.local or secret value in the diff.
- Server/client boundary: Mailchimp/Resend SDKs are called ONLY from Route
  Handlers / Server Actions / server-only modules — never the browser.
- No-op + fail-closed envelope: each integration no-ops cleanly (and never
  FAKES a send) when its env vars are absent; the PUBLIC writes (apply, contact,
  lead-magnet) fail closed in Production rather than silently dropping a
  submission; support + approval/decline degrade gracefully (data stored/flipped,
  email failure logged).
- Input validation: every Route Handler zod-validates its body; params/headers
  treated as untrusted; error responses leak no stack traces or upstream bodies.
- Gating intact: the approval gate on submit_support_request and the is_admin()
  gate on admin_set_application_status / decideApplicationAction are unchanged;
  the declined→contact path links only to PUBLIC /contact (no privileged leak).
- CSP/headers unchanged (connect-src 'self'); no new migration unless an
  approved table/RPC ships with up + .down.sql + RLS default-deny / grants.

NOTE: Upstash rate-limiting + Turnstile on public writes are a known,
owner-accepted deferral to S14 (ROADMAP S14 row; PROJECT-STATUS §5/§7) — do NOT
block on the SECURITY-CHECKLIST §15 rate-limit/Turnstile clause for the new
lead-magnet/contact routes; for THIS sprint treat zod-validation +
fail-closed-in-Production + the deferred-gap comment as the bar.

Report serious issues only — correctness, security/data safety, secret leaks,
broken gating, App Router boundary mistakes, build/deploy/env risks. No style
nits; do not critique approved copy or the locked design. Any failure of the
AGENTS.md "Palestine House gating checks" (other than the noted S14 deferral) is
blocking.

Return: Blocking issues · Non-blocking issues · Missing checks · exact
file:line locations · suggested fix for each · merge recommendation
(approve / request changes / blocking). Do not make changes, push, or merge.
```

## Re-validate before running

This brief was authored against `main` at the close of S9 (latest migration **0022**) with **S10 active and S11 not yet built**. Before pasting the prompt, re-confirm against live repo state — these will likely have moved:

- **Dependencies merged:** S3 (auth/apply — `applyAction`) and S4 (approve/decline — `decideApplicationAction` + the `admin_set_application_status` RPC) are both on `main`. ROADMAP lists the S12 dependency cell as **S3 only**; this brief additionally requires **S4** because the deferred approval/decline email hooks `decideApplicationAction` + `admin_set_application_status` (S4) — both must be on `main`. **Also confirm S10 and S11 are merged** (they run before S12 in the D-S10-b sequence) so you branch from the right `main`.
- **Live file paths + signatures** (re-read before editing each — S10/S11 may have refactored them):
  - `src/components/sections/lead-form.tsx`, `src/components/sections/contact-form.tsx` (public no-op forms today; the in-file "Sprint 8a/8b" comments are stale — S8 became Visual Polish, the email wiring is S12).
  - `src/lib/auth/actions.ts` (`applyAction` — insert then `redirect('/dashboard')`), `src/lib/support/actions.ts` (`submitSupportRequestAction` — after the `submit_support_request` RPC; the action already holds the auth user, so reply-to = `user.email`), `src/lib/admin/actions.ts` (`decideApplicationAction` — after the `admin_set_application_status` RPC; the action holds only the application `id`, NOT the applicant email).
  - `src/app/(workspace)/dashboard/page.tsx` (the `!approved` branch — the declined→contact injection point).
- **Existing RPCs/tables to hook (no new migration expected — but confirm the approval-email read path):** `admin_set_application_status` (0009, returns boolean only), `admin_list_applications` (0009, the only admin path that returns `applications.email`), `submit_support_request` (0019), `applications` (status `pending|approved|declined`, RLS owner-scoped), `support_requests`, `profiles` (`is_approved`; does NOT store email). The applicant email for the approval/decline email comes from `admin_list_applications()` or a new returns-email RPC — not directly from the action, and not from `profiles`.
- **Latest migration number = 0022.** A `contacts` audit table (or a returns-email RPC), if the owner approves it, would be the **next free number — 0023 today**, but S11 ships migrations, so confirm the next free number against `supabase/sql/migrations/` at run time, and ship up + `.down.sql` + RLS default-deny / grants TEST-first per `WORKFLOW.md` §14.
- **Env var names** are already in `.env.example` + `docs/SUPABASE-VERCEL-SETUP.md` (all six server-only, no `NEXT_PUBLIC_`); confirm none drifted before relying on them.
- **CSP** (`next.config.ts`) needs **no change** — both providers run server-side (`connect-src 'self'`).
- **Out of scope:** Upstash rate-limiting + Turnstile are **S14** — do not add them; leave the deferred-gap comments only. `SECURITY-CHECKLIST.md` §15's rate-limit/Turnstile clause is that S14 deferral (ROADMAP S14 row; `PROJECT-STATUS.md` §5/§7) — known and owner-accepted, not a blocker for this sprint's new public-write routes. No real-delivery verification this sprint — the owner verifies once the keys + the SPF/DKIM/DMARC-verified Resend domain exist.