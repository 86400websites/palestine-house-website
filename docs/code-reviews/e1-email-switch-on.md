# E1 — Email switch-on: independent Codex review (post-merge)

| | |
|---|---|
| **Date** | 2026-07-09 (post-merge, reviewed `main` at `4d68f09` = PR #55) |
| **Scope** | The merged email implementation as a whole — the E1 range `de7a2c8..4d68f09` (application-received pair in `applyAction` + docs) **plus** the S12-era Resend flows (contact route, support email, approve/decline email) |
| **Verdict** | **GO — zero blocking, zero non-blocking, no fix PR needed.** |

## What Codex confirmed

- **Env usage:** code reads exactly `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `RESEND_TO_EMAIL`; no name mismatches (rg sweeps for `RESEND_`, `MAILCHIMP_`, `NEXT_PUBLIC_RESEND`, `NEXT_PUBLIC_MAILCHIMP`, `sendEmail`, `upsertContact`); no client-side provider-key exposure; Resend imported only through the server-only helper; all sends run in Server Actions or the contact Route Handler.
- **Flow sequencing:** DB/RPC changes happen **before** email in all six paths; an email failure never blocks the user/admin workflow; `applyAction` keeps `redirect("/dashboard")` **outside** the email try/catch.
- **Links:** built from `SITE_URL` / `NEXT_PUBLIC_SITE_URL`; with Production still on the Vercel domain the emails carry **working** vercel.app links (not broken — non-blocking until the domain cutover); Preview emails can fall back to `http://localhost:3000`, matching the checklist caveat.
- **Checks on merged `main`:** `pnpm run typecheck` ✅ (tsc --noEmit) · `pnpm run lint` ✅ (eslint .) · `pnpm run build` ✅ (Next.js 15.5.20 compiled + static pages generated). No test script exists in `package.json`, so none was run (correct — none invented). *(Initial sandboxed runs hit a `fetch failed` environment error; approved reruns passed.)*
- **Production readiness:** a Production **redeploy is required** for the newly added Vercel env vars to take effect; live QA after redeploy = contact, approved-partner support, apply, approve, decline, declined-dashboard `/contact` link, reply-to behavior, email link domains, and at least one spam-placement check (matches `docs/EMAIL-SETUP-CHECKLIST.md` Part 4).

**Files reviewed (per Codex):** `src/lib/resend/client.ts` · `src/lib/mailchimp/client.ts` · `src/lib/env.ts` · `src/lib/site.ts` · `src/lib/auth/actions.ts` · `src/lib/support/actions.ts` · `src/lib/admin/actions.ts` · `src/app/api/resend/contact/route.ts` · `src/components/sections/contact-form.tsx` · `src/app/(workspace)/dashboard/page.tsx` · `src/components/sections/apply-form.tsx` · `src/app/(workspace)/support/support-form.tsx` · the admin approvals components/pages · `.env.example` · `package.json` · the email docs + trackers · migrations `0002`/`0007`/`0010`/`0019`.

## Exact prompt used

<details><summary>Codex review prompt (run by the owner, 2026-07-09)</summary>

```text
You are an independent senior code reviewer (Codex) for the Palestine House website.
This is a REVIEW-ONLY pass: do NOT modify any file, do NOT commit, do NOT push, do
NOT create branches or PRs. If you believe a fix is needed, describe it — changes
happen only after the owner explicitly asks.

## Setup

Repo: 86400websites/palestine-house-website. Check out `main` and confirm HEAD is at
or after merge commit 4d68f09 ("Merge pull request #55 …"). The subject of this
review is the merged EMAIL implementation:

- Primary diff range: de7a2c8..4d68f09 (sprint E1 — 3 commits: f9178cf "Add
  application-received emails to apply action", e265bee docs/trackers, 3651c30
  exit-gate fixes).
- BUT review the email system as a whole on main, because four of the six flows
  predate E1 (built in sprint S12, merged PR #41): the contact route, the support
  email, and the approve/decline emails.

Key files (read all):
- src/lib/resend/client.ts            (sendEmail helper — server-only)
- src/lib/mailchimp/client.ts         (dormant by owner decision — no keys planned)
- src/lib/env.ts                      (isProductionRuntime — VERCEL_ENV keyed)
- src/lib/site.ts                     (SITE_URL — used in email links)
- src/lib/auth/actions.ts             (applyAction — the NEW application-received pair)
- src/lib/support/actions.ts          (support → owner email)
- src/lib/admin/actions.ts            (approve/decline → applicant email)
- src/app/api/resend/contact/route.ts (public contact POST — fail-closed in prod)
- src/components/sections/contact-form.tsx
- src/app/(workspace)/dashboard/page.tsx (declined → /contact UI branch)
- .env.example, docs/EMAIL-SETUP-CHECKLIST.md, docs/SUPABASE-VERCEL-SETUP.md

Deployment facts (owner-confirmed, treat as given): Resend domain
palestine-house.com is VERIFIED (GoDaddy DNS done; Resend receiving intentionally
OFF — Microsoft 365 owns the inbox). Vercel env vars set for Production AND
Preview: RESEND_API_KEY, RESEND_FROM_EMAIL=info@palestine-house.com,
RESEND_TO_EMAIL=info@palestine-house.com. Package manager is pnpm — never npm/yarn.
docs/page-copy/ is gitignored (OneDrive is canon), so you cannot source-compare
email copy against copy files; the shipped strings were owner-approved at gates —
review them for clarity/professionalism, not against a copy source.

## What to check

1. Environment variable usage
   - The code reads exactly RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_TO_EMAIL —
     no name mismatches anywhere (grep the whole repo, including .env.example and
     docs, for RESEND_/MAILCHIMP_ variants and typos).
   - No secret is exposed client-side: no NEXT_PUBLIC_ provider var, no provider
     key reaching a Client Component, and the Resend SDK is imported only from
     server-side modules (the helper imports "server-only" — verify no client
     bundle can pull it in).
   - Email sending runs exclusively in Server Actions / Route Handlers.

2. Email flow coverage — confirm each is correctly wired end-to-end:
   - Contact form → notification to RESEND_TO_EMAIL (info@palestine-house.com).
   - Support/partner form → notification to RESEND_TO_EMAIL.
   - Application submitted → admin notification to RESEND_TO_EMAIL.
   - Application submitted → confirmation email to the applicant.
   - Approval → email to the applicant.
   - Decline → email to the applicant (points to public /contact).
   - Reply-to behavior is sensible per flow (owner notifications should reply to
     the submitter; applicant-facing mail should reply somewhere monitored).
   - Also verify ordering/attribution: DB writes are authoritative and happen
     BEFORE emails; an email failure never blocks sign-up, support submission, or
     the approval/decline status flip; redirect("/dashboard") in applyAction sits
     OUTSIDE any try/catch (a swallowed NEXT_REDIRECT breaks sign-up).

3. Email content and links
   - Links are built from SITE_URL (NEXT_PUBLIC_SITE_URL). Known state: Production
     currently still has the vercel.app URL (the custom-domain cutover to
     www.palestine-house.com is a pending, separate owner task). Flag what the
     links will say, but treat vercel.app links as BLOCKING only if they would be
     broken or unusable — they currently resolve fine.
   - Review the six email bodies/subjects for clarity and professionalism (warm,
     short, concrete; no exclamation marks; no technical jargon leaking to users).

4. Build and quality checks
   - Inspect package.json "scripts" FIRST and run only scripts that exist (expect
     typecheck, lint, build; run test only if a test script exists — do not invent
     commands). Use pnpm. Report exact commands + full pass/fail results.

5. Security and reliability
   - The Resend API key is never logged, echoed in errors, or serialized into a
     response; route handlers leak no stack traces or upstream error bodies.
   - Failure handling: helper returns a neutral result and never throws; public
     contact fails CLOSED in real production (503 unconfigured / 502 failed send,
     keyed on VERCEL_ENV via isProductionRuntime — NOT NODE_ENV, since Vercel sets
     NODE_ENV=production on Preview too); gated flows degrade gracefully with the
     data already saved. Verify user-facing error copy is non-technical.
   - Duplicate-send analysis: confirm the apply flow cannot double-email on
     retries (the idempotent-retry path redirects BEFORE the email block), that
     approve/decline sends once per admin action, and that no render path or
     revalidation can re-trigger a send.

6. Production readiness
   - Confirm whether a Production REDEPLOY is required for the newly added Vercel
     env vars to take effect (state the answer explicitly).
   - List the manual live QA steps to run after redeploy (cross-check them against
     docs/EMAIL-SETUP-CHECKLIST.md Part 4 — flag any gap between the checklist and
     what the code actually needs, including the checklist's own caveats: all
     THREE vars required; Preview-sent emails carry http://localhost:3000 links
     because NEXT_PUBLIC_SITE_URL is Production-scoped).

## Known, owner-accepted context (do NOT count these as blockers; you may list
them as observations if you have something new to add)
- Rate-limiting + Turnstile on the public writes (/apply, contact) are deliberately
  deferred to the Post-MVP hardening backlog (ROADMAP.md §A, "required before
  scale") — an accepted launch posture, documented in PROJECT-STATUS.
- Two accepted LOWs from the E1 exit gate, documented in
  docs/sprint-prompts/e1-email-switch-on.md: no fetch timeout on the awaited sends
  (a hung api.resend.com could run applyAction to the function limit; data is
  saved and a resubmit self-heals via the retry path), and no max-length caps on
  applySchema name/city/why (HQ email body inflatable — backlog hardening).
- Emails are plain-text by design (no HTML templates yet).
- Mailchimp code is intentionally present-but-dormant (no keys planned).

## Output format (return exactly this structure)
1. VERDICT: GO or NO-GO
2. Summary of findings (short prose)
3. Blockers (numbered; empty if none)
4. Non-blocking improvements (numbered; empty if none)
5. Exact files reviewed (list)
6. Exact commands run and their results
7. Fix PR needed? yes/no — and if yes, what it must contain

Remember: review only. Make no changes.
```

</details>
