# Sprint S3 — Auth complete

| | |
|---|---|
| **Date merged** | 2026-06-16 |
| **Branch / PR** | `claude/sprint-s3-auth-complete` / **#19** (record on `docs/s3-sprint-record`) |
| **Goal** | Turn the no-op auth/apply shells into real Supabase auth via `@supabase/ssr`: clients + `middleware.ts` session refresh, live login/logout, forgot/update password, and Apply-live = sign-up → pending account + `applications` record. No route protection (S4), no rate-limit/Turnstile (S9). |

## What shipped

Executed in this Claude Code session in owner-gated sub-steps (push-per-step into the open PR), not pasted into a fresh session. Auth runs **server-side** (Server Actions / Route Handlers) so the browser never calls `supabase.co` — **CSP `connect-src` stays `'self'`** and **every public marketing page stays statically rendered**.

- **3a-i — plumbing:** `@supabase/ssr` (+ `@supabase/supabase-js`); `src/lib/supabase/client.ts` (browser) + `server.ts` (server), both reading only `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (no secret key); `src/middleware.ts` cookie-backed session **refresh** (no route protection) + `src/lib/supabase/middleware.ts` helper; `src/lib/safe-redirect.ts` (request-origin derivation + allow-list, blocks host-header poisoning + open redirects).
- **3a-ii — login/logout:** `src/lib/auth/actions.ts` `signInAction`/`signOutAction` (verbatim, non-revealing error copy); `LoginForm` wired via `useActionState` with a validated `next` redirect; the locked header swaps **Sign in ↔ Sign out** via a same-origin `GET /api/auth/session` probe (returns only `{ authed }`, `Cache-Control: no-store`) — keeps pages static + CSP tight. Mobile divider made robust (`:last-child` + `display:contents` form) so the chrome looks identical signed-in/out.
- **3b — password reset:** `requestPasswordResetAction` (neutral confirmation; `redirectTo` built from the request origin so Preview emails resolve to Preview) + `updatePasswordAction`; `src/app/auth/confirm/route.ts` exchanges the email code/token for a recovery session then forwards to an allow-listed `next`; update signs out after so "you can sign in now" is literal.
- **3c — Apply live = sign-up:** `applyAction` zod-validates the 6 fields, `signUp` (instant session — email confirmation OFF — with `full_name` in metadata), then the just-authenticated user inserts its own **`pending`** `applications` row under S2's owner-scoped RLS; approved confirmation verbatim; fails closed with brand-voice errors.
- **DB:** migration **`0008_handle_new_user_full_name`** — the new-user trigger now copies a trimmed `full_name` from sign-up metadata onto `profiles` (blank → NULL); still SECURITY DEFINER, `search_path=''`, EXECUTE locked. Applied + verified on **test + prod**.
- **Decision:** owner-approved **Password field** added to the Apply form (the locked mockup/copy had none, but `/login` is password-based). Auth pages aligned to `noindex,nofollow` (SECURITY-CHECKLIST §6). Trackers updated (PROJECT-STATUS §1/§2/§4/§7/§8, ROADMAP, SUPABASE-VERCEL-SETUP refs filled in).

## Prompt used

This sprint was planned by `/sprint-prompt` (plan file) and executed inline. The gated master prompt (section E of the plan):

<details><summary>Exact implementation prompt (GATE 0 + 5 gated sub-steps)</summary>

```text
You are my senior engineer for the Palestine House website, working in Claude Code.

Session start: read docs/PROJECT-STATUS.md §1–§2, then the S3 scope + exit gate in docs/ROADMAP.md (Stage 2). CLAUDE.md governs everything below. This sprint introduces real authentication — docs/SUPABASE-VERCEL-SETUP.md (env + auth-redirect guidance) and docs/SECURITY-CHECKLIST.md §15 are binding, not optional.

Sprint: S3 — Auth complete (3a clients+middleware+login · 3b forgot/update password · 3c Apply live = sign-up)
Branch: claude/sprint-s3-auth-complete (create from latest main)

Goal:
Turn the existing no-op auth/apply form shells into real Supabase authentication via @supabase/ssr. Ship browser + server clients, middleware.ts session refresh, live login/logout, live forgot/update password with same-origin validated redirects, and Apply-live = sign-up creating a pending account + an applications record. Build NO route protection / gated shell / dashboard / admin / approval-flip (that is S4); NO Turnstile or rate-limiting (S9). Keep CSP tight: auth mutations run server-side (Server Actions / Route Handlers), so connect-src stays 'self'.

Confirmed decisions (do not reopen):
- Email confirmation is OFF: signUp returns a session immediately, so the just-created user inserts their own applications row under S2's existing owner-scoped insert policy (with check user_id = auth.uid() AND status = 'pending'). HQ approval (is_approved) is still the real gate.
- Auth via @supabase/ssr; all auth/apply network calls run server-side under the cookie-backed server client. Do NOT loosen the CSP in next.config.ts.

GATE 0 — OWNER ACTIONS FIRST (do not start sub-step 1 until I confirm all three):
1) The S2 PR is merged to main. 2) On both Supabase projects, Authentication → "Confirm email" is OFF and Redirect URLs include localhost + the Preview wildcard + Production. 3) NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are present locally and in Vercel Preview/Production.

Execute in gated sub-steps (one owner gate after each):
1. (3a-i) Add @supabase/ssr (+ @supabase/supabase-js). Browser + server clients (NEXT_PUBLIC_* only). middleware.ts at the project root for cookie-backed session REFRESH only, matcher excluding assets. safe-redirect.ts: derive the request origin and VALIDATE against an allow-list (localhost, Preview *.vercel.app pattern, Production); a forged host header must never produce an off-origin redirect. No UI behaviour change.
2. (3a-ii) Wire login + logout via a Server Action (signInWithPassword); verbatim non-revealing error copy; success → validated next else "/". Sign-out Server Action + session-aware header (Sign in → Sign out), wiring only.
3. (3b) Forgot → resetPasswordForEmail with redirectTo from safe-redirect → /update-password; verbatim neutral confirmation. /auth/confirm route handler exchanges the code for a session then redirects. Update-password → updateUser; verbatim confirmation + client errors.
4. (3c) Apply live = sign-up. Read 0001/0002 first. Server Action: zod-validate; signUp with options.data.full_name; insert the applications row (status pending) under the new session. Approved confirmation verbatim; fail closed.
5. (sprint exit gate) Full-diff self-review vs SECURITY-CHECKLIST §15; no secrets, server/client boundaries correct, redirects allow-listed, CSP unchanged. Update SUPABASE-VERCEL-SETUP checklists, PROJECT-STATUS (§1/§2 → S3 ✅, change log), tick S3 in ROADMAP.

Per-step protocol: read the locked input(s) first; smallest safe change; Server Components by default; verify typecheck && lint && build; self-review the diff; commit AND push every sub-step; report in ≤6 lines then STOP and WAIT for "proceed".

Locked inputs: docs/page-copy/02-auth-pages/{login,forgot-password,update-password}.md; docs/page-copy/01-public-pages/apply-partner.md; docs/SUPABASE-VERCEL-SETUP.md; SECURITY-CHECKLIST §15; for 3c also supabase/sql/migrations/0001_*/0002_*. Header/footer chrome is locked.

Push policy: commit + push after every gated sub-step (standing authorization) so I review in the open PR; never merge, never push beyond the task branch.
```

</details>

## Checks & results

typecheck ✅ · lint ✅ · build ✅ (all public pages `○ Static`; `ƒ Middleware` + `ƒ /login` + `ƒ /api/auth/session` + `ƒ /auth/confirm` dynamic, as intended) — after every sub-step. CSP unchanged (`connect-src 'self'`), confirmed by header smoke. Runtime smokes: anon header shows Sign in only; `/api/auth/session` → `{"authed":false}`; `/auth/confirm` with no/bad code → safe 307 → `/forgot-password`; **forged `x-forwarded-proto`/`host` resolve only to allow-listed PH origins**. DB: `0008` verified on test (functional) + prod (read-only). **Independent Codex review: 1 blocking + 2 non-blocking, all fixed; re-review = Approve.** No secrets in the diff.

## Deviations & learnings

- **Middleware must live at `src/middleware.ts`, not repo root** — this project uses a `src/` dir, so a root `middleware.ts` is silently ignored (caught via an empty `middleware-manifest.json`).
- **Session-aware header without going dynamic:** reading the session in the layout would force every public page dynamic, and the browser Supabase client would need a CSP loosening. Solved with a same-origin `/api/auth/session` probe consumed by the existing client header → pages stay static + CSP stays `'self'`. (Header re-checks on pathname change so it updates after the sign-in/out redirects.)
- **`handle_new_user` (S2) only inserted `id`** — it did NOT map `full_name` from sign-up metadata, so the dashboard greeting (flag 5d) would always fall back. Resolved with migration **`0008`** (owner applied test-first). Lesson: a "stored as full name" copy note needs a trigger/RPC that actually maps the metadata.
- **Apply password gap → owner decision:** the locked Apply form had no password field but `/login` is password-based. Surfaced rather than guessed; owner approved adding a **Password field** (reliable, standard — no dependence on an email link to ever sign back in). Recorded in PROJECT-STATUS §4; `apply-partner.md` updated (gitignored canon).
- **Supabase SQL Editor ignores a hand-written `begin…rollback`** — the `0008` functional test left throwaway rows in the test DB. Rewrote it to clean up with explicit, idempotent `delete`s (leading delete = self-cleaning + re-runnable). Lesson for S5: functional verification must delete, not rely on rollback.
- **Codex blocking finding (host-header poisoning):** `resolveSafeOrigin` trusted the raw `x-forwarded-proto`, so a forged `x-forwarded-proto: https://attacker.example/%2f` + an allow-listed host produced an attacker-origin redirect string; `safeNextPath` also didn't reject `\`. Fixed by deriving the scheme from the host type (ignore `x-forwarded-proto`), re-parsing via `URL` + re-validating, validating all fallbacks identically, and rejecting backslashes. Lesson: never build an origin from a spoofable proto header.
- **Codex non-blocking, also fixed:** `/update-password` accepted any session → added a short-lived httpOnly `ph-recovery` marker (set by `/auth/confirm`, restricted to the `recovery` OTP type; required + cleared by `updatePasswordAction`). Apply could strand an applicant on a partial insert failure → `applyAction` made idempotent (reuse session / sign-in fallback / one-application check).

## Follow-ups

- **🔶 Apply is a live public write without rate-limiting (Upstash) or Turnstile until S9** — tracked in PROJECT-STATUS §7. On Production it creates real accounts unthrottled; mitigated by the HQ approval gate + email uniqueness + fail-closed validation. Owner accepted the window between S3 merge and S9.
- **Post-login / post-apply landing is `/` for now** — S4 repoints it to `/dashboard` (the pending-state page) and adds the actual route protection + approval enforcement.
- **S4 — Approval gate + `/admin/approvals`** is next (gated shell, pending dashboard, server-side `is_approved` enforcement, approval flip + Resend notification, `admins`-checked admin queue). 🔴 SECURITY-CHECKLIST §15 invariants are verified there.
- Owner's live Preview auth-flow validation is the documented sign-off step (login/logout, Apply→DB rows, reset email → Preview origin, recovery gating bounce).
