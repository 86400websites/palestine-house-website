# Sprint E1 — Email switch-on: application-received emails + Resend runbook

| | |
|---|---|
| **Date built** | 2026-07-09 — BUILD COMPLETE (pre-merge); PR pending owner review + merge. |
| **Branch / PR** | `claude/sprint-e1-email-switch-on` / PR — *(fill on merge)* |
| **Goal** | Complete the site's email automation and sign off every email task: finalize the live email set as **Resend-only, 4 flows** (Mailchimp dormant by owner decision), add the one missing flow (**application received → HQ + applicant**), close the outstanding S12 copy-sign-off carryover, and rewrite the owner switch-on runbook so going live is keys + DNS + a redeploy. |

## Owner decisions (2026-07-09, AskUserQuestion gates)

1. **Mailchimp: skip — leave dormant.** No account, no keys. The apply-tag code (`upsertContact`, tag `applicant`) stays a clean no-op; the booklet lead magnet it once served was removed in DR1-8. Switch-on later = add the three `MAILCHIMP_*` vars, nothing else.
2. **Final email set = exactly 4 flows** (all Resend, all plain-text): contact form → HQ · support form → HQ · **application received → HQ AND the applicant (new)** · approve/decline → the applicant.
3. **Addresses:** `RESEND_FROM_EMAIL = RESEND_TO_EMAIL = info@palestine-house.com` (existing Microsoft-365 mailbox). Sending domain **`palestine-house.com`**.
4. **DNS location verified by nameserver lookup (2026-07-09): GoDaddy** (`ns11/ns12.domaincontrol.com`; root MX `*.mail.protection.outlook.com`; root SPF `v=spf1 include:secureserver.net -all`). Resend's records ride the `send.` subdomain + `resend._domainkey`, so the mailbox MX and root SPF are untouched by the switch-on.

## What shipped

- **E1-1 — copy gate.** Both NEW strings drafted per brand voice and **owner-approved as drafted**: the HQ notification (subject `New application: {name} — {city}`; body = name/email/city/organisation/why + `/admin/approvals` link; reply-to = the applicant) and the applicant confirmation (subject `We received your application — Palestine House`; "under review" echoing the dashboard pending state; `/dashboard` + `/contact` links; reply-to = `RESEND_TO_EMAIL`). In the same gate the **four existing S12 bodies (contact/support formats + approved + declined) were signed off verbatim — the PROJECT-STATUS carryover "owner sign-off on the S12 email + decline copy" is CLOSED.**
- **E1-2 — code.** One block in `applyAction` (`src/lib/auth/actions.ts`) + two imports (`sendEmail`, `SITE_URL`): two best-effort awaited sends inside a single S12-style try/catch, **after** the applications insert and the Mailchimp tag, **before** `redirect("/dashboard")` (which stays outside the try/catch — `NEXT_REDIRECT` never swallowed). Skipped on the idempotent-retry path (that applicant was emailed on their first apply). The HQ half guards on `RESEND_TO_EMAIL` (same as contact/support); the applicant half needs only the sending pair. An email failure **never blocks sign-up** — logged `[resend] apply emails failed (continuing):`.
- **E1-3 — docs + trackers.** `docs/EMAIL-SETUP-CHECKLIST.md` **rewritten to reality** (Resend-only; the 4 flows; GoDaddy DNS steps with the mailbox-safety note; the **all-three-vars call-out**; Vercel Production + Preview scoping; the live test matrix incl. a decline test; dormant-Mailchimp appendix). `SUPABASE-VERCEL-SETUP.md` email section updated (from-address, application-received flow, dormant Mailchimp, GoDaddy + send-subdomain note). `PROJECT-STATUS.md` §1/§2/§3/§6/§8 + `ROADMAP.md` (email item flipped to done; the stale booklet lead-magnet line struck per DR1-8) updated in lockstep. This record.

**Invariants held:** no DB migration; the `is_approved` + `is_admin()` gates + CSP (`connect-src 'self'`) byte-identical; the only `src/` change is `src/lib/auth/actions.ts` (additive email code); no new env var names (all six were documented in S12); no dependency change; no secrets in the diff; `.env.local` untracked.

## Checks & results

typecheck ✅ · lint ✅ · build ✅ (46 routes, unchanged — no route added/removed). Env-absent posture re-verified from the code: with zero `RESEND_*` vars the helper returns `{ configured:false }` and Apply behaves exactly as before (honest no-op; sign-up + redirect unaffected). Live delivery is intentionally **not** tested pre-merge (S12 precedent) — the owner verifies via the checklist's Part 4 test matrix once keys + DNS exist.

**E1-4 exit-gate review (adversarial 5-lens multi-agent workflow — control-flow · security/boundary · gates-intact · docs-accuracy · copy-verbatim — every finding independently re-verified): 8 confirmed (1 Medium docs + 7 Low), 0 blocking.** Copy-verbatim and gates-intact lenses = clean (shipped strings match the approved table character-for-character; zero protected paths in the range). Fixed on-branch (6): the HQ email's `Organisation:` line now falls back to `—` for a whitespace-only value (`||` not `??`) · the **Medium** — the checklist's Preview-test advice now warns that Preview-sent emails carry `http://localhost:3000` links (`NEXT_PUBLIC_SITE_URL` is Production-scoped; confirm delivery on Preview, links on Production) · the ROADMAP email item reworded "build-side complete, live when the owner executes the checklist" (was over-claiming "live") · the stale "lead-magnet route / deferred to S14" hardening sentence in `SUPABASE-VERCEL-SETUP.md` updated to the backlog reality · "public forms fail closed" narrowed to the contact form (apply/support/approval degrade gracefully) · the observability note now distinguishes what reaches the Resend dashboard vs Vercel-logs-only (skips + network failures). Accepted, documented below (2): no fetch timeout on the two awaited sends · unbounded `name`/`city` lengths. Path-guard CLEAN (only `src/lib/auth/actions.ts` under `src/`); secret scan of the range clean; `.env.local` untracked.

## Risks accepted / follow-ups

- **No fetch timeout on the two awaited sends** (exit-gate finding, accepted LOW): if `api.resend.com` *hangs* (rather than errors), `applyAction` can run until the Vercel function limit and the applicant sees a server-action error — but the account + application are already saved and a resubmit hits the idempotent-retry path (instant redirect, no emails), so nothing is lost. Same posture as the S12 Mailchimp tag. Optional hardening for the backlog: `AbortSignal.timeout` in `src/lib/resend/client.ts`.
- **Applicant confirmation rides an unthrottled public write** (`/apply`; rate-limit/Turnstile = backlog hardening, required before scale). Accepted: Supabase email-uniqueness bounds it to one send-pair per address ever (the retry path redirects before the email block); content is fixed apart from the applicant's own fields.
- **Pre-existing nit (not fixed, logged for the hardening pass):** `applySchema` has no max lengths on `name`/`city`/`why`, so a hostile applicant can inflate the HQ email body.
- **Silent gated-flow send failures** stay by design — the helper `console.error`s (Vercel function logs) and the Resend dashboard → Emails shows every attempt/rejection.
- **Stale comment** in `src/lib/support/actions.ts:10-12` ("Email delivery is DEFERRED…" — it shipped in S12) — cosmetic, left to keep the diff to one src file.
- **OneDrive canonical copy set** should gain the two new email bodies (owner side; shipped code is the source of truth, DR3.1 precedent).
- **Emailed links follow `NEXT_PUBLIC_SITE_URL`** — until the pending domain cutover they carry working `…vercel.app` links; recommended: do the cutover first or in the same sitting (checklist header notes this).

## Switch-on (owner, post-merge)

Everything is in `docs/EMAIL-SETUP-CHECKLIST.md`: Resend account → add `palestine-house.com` → paste the records at GoDaddy → Verified → API key → the three `RESEND_*` vars in Vercel (Production + Preview, server-only) → redeploy → run the Part 4 live test matrix.
