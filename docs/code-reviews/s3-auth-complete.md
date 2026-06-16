# Codex review brief — S3 (Auth complete)

> **How to use:** point your Codex review task at this file ("read and execute
> `docs/code-reviews/s3-auth-complete.md`"). It supplements — does not replace —
> `AGENTS.md`, which is your standing rulebook. Run the **Primary** review; run the
> **Deep-dive** as an optional second pass on the two highest-risk files.
> Branch under review: `claude/sprint-s3-auth-complete` vs `main`. Review the DIFF
> only; do not change anything, push, or merge. (Ignore *this* brief file itself —
> it is documentation, not shipping code.)

---

## Primary — comprehensive S3 review

You are my independent code reviewer for the Palestine House website. Read `AGENTS.md`
in the repo root FIRST — it governs you: review style (serious issues only), review
priorities, the Security checks, the 🔴 Palestine House gating checks (blocking), the
Supabase / App-Router / Vercel checks, and the required finding + merge-recommendation
format. Follow it exactly.

**Scope:** review the DIFF of branch `claude/sprint-s3-auth-complete` vs `main` only —
not the whole repo. Only code that ships in a production build is in scope. Do NOT make
changes, push, or merge. Verify every claim against the diff.

### What this sprint (S3 — Auth complete) shipped, so you know intent
Turns the no-op auth/apply shells into real Supabase auth via `@supabase/ssr`, with a
deliberate architecture choice: ALL auth mutations run server-side (Server Actions /
Route Handlers) so the browser never calls `supabase.co` and the CSP `connect-src`
stays `'self'`; auth state reaches the client header via a same-origin probe so every
public marketing page stays statically rendered. Email confirmation is OFF (instant
session). Apply = sign-up creates a pending account + an owner-scoped `applications`
row; an owner-approved Password field was added to the Apply form.

### Intentionally OUT of scope (do not flag as missing — sequenced/documented)
- Route PROTECTION / gated pages / `/dashboard` / `/admin` / approval flip → **S4**.
  `src/middleware.ts` is session-REFRESH only this sprint.
- Rate-limiting (Upstash) + Turnstile on the public Apply write → **S9**. Logged in
  `PROJECT-STATUS.md` §7 as an accepted, documented deferral. Don't treat the deferral
  itself as a novel finding — but DO assess the residual risk: can the unthrottled
  Apply write be abused to reach anything beyond spam signups (gated data, breaking the
  pending→admin approval workflow, RLS bypass)? Confirm it still zod-validates and fails
  closed.
- `docs/page-copy/` is gitignored (OneDrive is canon) — the `apply-partner.md` copy
  change won't be in the diff; the Password-field decision is recorded in
  `PROJECT-STATUS.md` §4. Don't flag the copy file as missing.

### Files to review (the whole S3 surface)
- `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`  (clients + session refresh)
- `src/middleware.ts`                                         (matcher; refresh-only)
- `src/lib/safe-redirect.ts`                                  (origin allow-list + next)
- `src/lib/auth/actions.ts`                                   (all Server Actions)
- `src/app/auth/confirm/route.ts`                             (code/token → session)
- `src/app/api/auth/session/route.ts`                         (auth-state probe)
- `src/components/layout/site-header.tsx`                     (Sign in ↔ Sign out)
- `src/components/sections/auth-forms.tsx`, `apply-form.tsx`
- `src/app/login/page.tsx`                                    (next param)
- `src/app/{login,forgot-password,update-password}/page.tsx`  (robots noindex,nofollow)
- `supabase/sql/migrations/0008_handle_new_user_full_name.up.sql` / `.down.sql`
- `supabase/sql/verification/0008_verify_*.sql`
- `next.config.ts`                                            (CONFIRM CSP unchanged)

### High-value questions to answer explicitly (this is where bugs hide)
1. **safe-redirect.ts:** can a forged `x-forwarded-host` / `host` header produce an
   off-origin auth redirect OR an off-origin password-reset email link (host-header
   poisoning)? Is the allow-list (localhost, `*-86400-s-projects.vercel.app`,
   `palestine-house-website.vercel.app`) airtight — any regex/substring bypass (e.g.
   `evil-86400-s-projects.vercel.app.attacker.com`, embedded dots, userinfo `@`, ports,
   uppercase, trailing dot)? Are ALL fallbacks (VERCEL_BRANCH_URL, VERCEL_URL,
   NEXT_PUBLIC_SITE_URL, localhost) themselves validated?
2. **Open redirect:** can `?next=` on `/login` or `/auth/confirm` send a user
   off-origin? Confirm `safeNextPath` rejects absolute, protocol-relative (`//`), and
   backslash targets.
3. **Apply write path (`applyAction`):** can a caller forge `status` (not `'pending'`),
   set `is_approved`, or insert an `applications` row for a different `user_id`? Confirm
   it relies on S2's owner-scoped RLS (`with check user_id = auth.uid() AND status =
   'pending'`) and never the secret key. Assess the partial-failure window (account
   created but the insert fails): exploitable/inconsistent state, or can it block the
   user from ever applying again?
4. **Secrets / boundary:** is `SUPABASE_SECRET_KEY` / `service_role` truly absent from
   all client-reachable code? Do the browser/server/middleware clients use ONLY
   `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`? Any secret
   crossing a Server→Client prop boundary?
5. **middleware (refresh-only):** does the matcher run where it should and skip assets?
   Does it ever fail-open/closed incorrectly or accidentally gate a route? Is the "no
   Supabase env → pass through" guard safe (could it mask a misconfig in Production)?
6. **/api/auth/session:** does it leak anything beyond a boolean for the CURRENT caller?
   Any caching (CDN/proxy) that could serve one user's auth state to another? Confirm
   `Cache-Control: no-store`.
7. **updatePasswordAction:** is the recovery-session requirement sound — can a password
   be changed WITHOUT a valid recovery session (e.g. an already-authed normal session)?
   Is the post-update `signOut` correct? Any replay/hijack via `/auth/confirm`?
8. **Enumeration:** confirm login errors are neutral (no "email exists" leak). Apply
   surfaces "that email already has an account" — judge whether that signup-time
   enumeration is acceptable here, and whether it's derived safely (no upstream error
   body leaked).
9. **0008 migration:** is `handle_new_user` still hardened (SECURITY DEFINER,
   `search_path = ''`, fully-qualified, EXECUTE revoked from public/anon/authenticated)?
   Is `CREATE OR REPLACE` + the re-asserted revokes correct? Is the metadata read
   (`raw_user_meta_data ->> 'full_name'`, `trim`, `nullif`) injection-safe? Is the
   `.down.sql` an exact, safe revert? Expand-only / backwards-compatible?
10. **CSP / headers:** confirm `next.config.ts` is UNCHANGED (`connect-src 'self'`) — the
    whole server-side-auth design depends on it. Flag any weakening.
11. **App Router:** any new hydration mismatch from the header defaulting
    `authed=null → "Sign in"`? Server Actions used correctly (no secret leak, correct
    revalidation/redirect)? Auth pages noindexed?

### Output
Per `AGENTS.md` "How to report findings": for each finding give Severity
(Critical/High/Medium/Low) · Location (`path:line` + route) · Issue · Why it matters ·
Suggested fix · Confidence. Then a prioritized list grouped **Blocking / Non-blocking /
Missing checks**, and a clear **merge recommendation** (approve / request changes /
blocking). Any failure of the `AGENTS.md` 🔴 gating checks is blocking. No style nits;
do not critique approved copy or the locked design.

---

## Deep-dive (optional second pass — the two highest-risk surfaces)

You are my independent reviewer. Read `AGENTS.md` first (it governs you). Review ONLY
two files from the `claude/sprint-s3-auth-complete` diff vs `main`, in depth — assume an
attacker is probing them. Do not change anything.

1. **`src/lib/safe-redirect.ts`** — the same-origin guard for auth redirects +
   reset-email links. Try to break it: forged `Host` / `X-Forwarded-Host` /
   `X-Forwarded-Proto`; allow-list regex bypasses (suffix tricks, embedded dots,
   userinfo `@`, ports, uppercase, trailing-dot hosts); whether every fallback
   (`VERCEL_BRANCH_URL`, `VERCEL_URL`, `NEXT_PUBLIC_SITE_URL`, localhost) is itself
   validated; whether `safeNextPath` can ever yield an absolute/protocol-relative/
   backslash target. For each: a concrete bypass input (or confirm it holds) + a fix.

2. **`src/lib/auth/actions.ts` `applyAction` + `src/app/auth/confirm/route.ts`** — the
   only account-creation path and the recovery-session exchange. Walk the exact
   sequence: zod → `signUp` (instant session) → owner-scoped `applications` insert.
   Probe: status forging, cross-user `user_id`, `is_approved` escalation, reliance on
   the secret key, the signup/insert partial-failure window, code/token replay or
   swapping `type`, and the failure → `/forgot-password` fallback. Give exploit-or-
   confirm + a fix per point.

Report per `AGENTS.md` format with severity, exact location, and a merge call.
