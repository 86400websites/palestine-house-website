# S7 — Exhaustive launch QA findings

> Sprint **S7 (Final review & launch)**, Step 2 (7a QA discovery). Branch `claude/sprint-s7-final-review-launch`.
> Method: 6 deep read-only audit lenses (access-gate · data-layer · public-pages · workspace-pages · auth-flows · cross-cutting) across every route × auth state, then an **adversarial verify pass** on every candidate finding (read the cited code; refute or confirm; strip false-positives). 16 candidates → **11 confirmed real defects** (after merging 2 duplicate pairs), 2 false-positives, 1 out-of-scope.
> This log is the Step 2 deliverable. **No fixes applied yet** — fixes happen in Step 3 after owner review.

## Build baseline (green)

`pnpm run typecheck` ✅ exit 0 · `pnpm run lint` ✅ exit 0 · `pnpm run build` ✅ exit 0 — 34 routes compile; route classification correct (every `(workspace)` route is dynamic `ƒ`, public pages static `○`). One non-fatal build **warning** captured as **S7-12** below.

## Severity summary (confirmed real defects)

| Sev | Count | IDs |
|---|---|---|
| **High** | 2 | S7-01, S7-02 |
| **Medium** | 1 | S7-03 |
| **Low** | 6 | S7-04, S7-05, S7-06, S7-07, S7-08, S7-09 |
| **Nit** | 3 | S7-10, S7-11, S7-12 (informational) |
| Dismissed | 3 | D1 (false-positive), D2 (false-positive), D3 (out-of-scope → moves to Step 6 polish) |

Legend: `[ ]` open · `[x]` fixed + re-verified (ticked in Step 3) · `[~]` accepted, no code change (rationale inline).

## Step 3 outcome (fixes applied)

All defects resolved except S7-10 (locked copy, kept verbatim — see its entry) and S7-12 / D1 / D2 (accepted as-is). Each fix is the smallest safe change; the suite (typecheck/lint/build) stays green. Fixes by ID: S7-01, S7-02, S7-03, S7-04, S7-05, S7-06, S7-07, S7-08, S7-09, S7-11.

---

## HIGH

### `[x]` S7-01 — Double chrome on every gated route except `/dashboard`
- **Area:** layout / route grouping · **Type:** functional/layout
- **Files:** `src/components/layout/site-chrome.tsx:14` (`GATED_PREFIXES`); root mount `src/app/layout.tsx:78`; workspace shell `src/app/(workspace)/layout.tsx:35` + `src/components/workspace/workspace-shell.tsx:189,295`
- **Routes:** `/plan`, `/build`, `/operate`, `/academy`, `/resources`, `/resources/[category]`, `/tools`, `/account`, `/support`, `/elements/[slug]`
- **What's wrong:** `SiteChrome` only suppresses the public marketing header+footer for paths under `GATED_PREFIXES = ["/dashboard","/admin"]`. The `(workspace)` group is pathless, so its other 10 routes resolve to top-level paths that don't match — they receive the public `SiteHeader` + `SiteFooter` **on top of** their own `WorkspaceShell` chrome. Result: public header → full-viewport workspace shell nested inside the public `<main>` → public footer, with **two `<main>` landmarks** (`#main-content` + `#ws-main`), **two "Skip to content" links**, and the public **"Apply to bring a House" CTA band + booklet lead form leaking into the authenticated partner area**. `/dashboard` is correct only because it's the sole workspace path in the list. (Verifier revised blocker→high: severe + breaks nearly the whole private platform's layout & HTML/a11y validity, but no data/gating breach — owner may elevate to blocker.)
- **Repro:** Sign in (approved) → open `/plan` (or any listed route). Public header+footer wrap the workspace sidebar/topbar shell; two stacked chromes.
- **Proposed fix (preferred):** move the public `SiteChrome` (header/footer) out of the root `app/layout.tsx` into a **`(public)` route-group layout**, so the `(workspace)` and `admin` groups own their chrome exclusively and the wiring can't drift. *Lighter-touch alt:* extend `GATED_PREFIXES` to include every workspace prefix (brittle — must update per new route). Verify each gated path renders only the workspace shell with a single `<main>`.

### `[x]` S7-02 — `/account` "Change password" dead-ends (silently bounces to `/forgot-password`)
- **Area:** auth/account · **Type:** broken flow · *(merged from two independent findings)*
- **Files:** `src/app/(workspace)/account/account-form.tsx:89` (link target) → `src/lib/auth/actions.ts:96-101` (silent redirect); page has no guard `src/app/update-password/page.tsx`; `ph-recovery` cookie set only at `src/app/auth/confirm/route.ts:42-50`
- **What's wrong:** The Account page's "Change password" button links to `/update-password`, but `updatePasswordAction` hard-requires the httpOnly `ph-recovery` marker that is **only** ever set by the recovery-email landing (`/auth/confirm`). A normally-authenticated user (pending or approved) fills the "Set a new password" form, submits, and because `fromRecovery` is false the action `redirect("/forgot-password")` — **password never changes, no message, input lost**. The in-app change-password flow is non-functional for every user who tries it.
- **Repro:** Sign in → `/account` → "Change password" → enter valid matching password → Submit → redirected to `/forgot-password`, unchanged, no explanation.
- **Proposed fix (owner approach choice):** **(a)** *(simplest, recommended)* repoint the Account affordance to the working recovery flow — replace the `/update-password` link with a button calling `requestPasswordResetAction` (same as `/forgot-password`) showing the neutral "check your email" confirmation; **OR (b)** build a real in-app change (relax `updatePasswordAction` to accept a freshly authenticated session, ideally with current-password re-auth + a page guard). **Do not** simply loosen the recovery-only guard without re-auth — that reintroduces the "any session can change password" exposure the marker was added (S3) to close. Either way the UI must not present a form guaranteed to fail.

---

## MEDIUM

### `[x]` S7-03 — Pending users' Support path dead-ends with no `/contact` fallback
- **Area:** workspace/support + dashboard pending state · **Type:** navigational dead-end
- **Files:** `src/app/(workspace)/support/page.tsx:16-17` (pending → `PendingState`); `src/components/workspace/pending-state.tsx:24-31` + `src/app/(workspace)/dashboard/page.tsx:51-58` ("Support is one click away"); `src/components/workspace/workspace-shell.tsx:233-242` (always-live footer Support link)
- **What's wrong:** Both pending surfaces tell the user "Stuck? Support is one click away," and the sidebar footer Support link is always clickable for pending users. But `/support` is approval-gated → a pending session gets the same "under review" `PendingState` notice. The page's own comment says pending users should "use the public `/contact` page meanwhile," yet **nothing in the pending UI links to `/contact`** — the user loops back to the identical message with no way to get help.
- **Repro:** Sign in as `is_approved=false` → `/dashboard` → click "Support" → land on `/support`, same "under review" notice, no form, no `/contact` link.
- **Proposed fix:** In the `/support` pending branch, render `PendingState` with an added "Need help now? Use our contact form" → `<Link href="/contact">`. Optionally point the "Support" help line in `PendingState` / dashboard pending branch at `/contact` for unapproved users. (`/contact` already exists and is anon-safe — purely additive, no gating impact.)

---

## LOW

### `[x]` S7-04 — `/update-password` gives no feedback when it can't accept a submission
- **Files:** `src/lib/auth/actions.ts:96-101` (bare redirect); `src/app/update-password/page.tsx` (unconditional form). *Related to S7-02.*
- **What's wrong:** When the `ph-recovery` marker is absent or expired (600s maxAge), the action silently `redirect("/forgot-password")` **after** the user filled+submitted — input dropped, no reason shown. Reachable by any direct visitor.
- **Proposed fix:** Signal the reason (e.g. `/forgot-password?expired=1` + a one-line note using approved auth copy), or convert `/update-password` to a server component that reads the cookie up front and renders a "request a fresh link" state when absent. **Do not loosen** the `actions.ts:96` guard. New copy from `docs/page-copy/02-auth-pages` (owner to confirm wording).

### `[x]` S7-05 — Hardcoded "Stage · Plan & Prepare" top-bar label contradicts real stage
- **Files:** `src/components/workspace/workspace-shell.tsx:184` (rendered 257-260)
- **What's wrong:** Shell hardcodes `stageLabel = approved ? "Plan & Prepare" : "Awaiting approval"`. An approved partner mid-build sees `/dashboard` showing "Current stage: Design & Build" while the persistent top-bar badge on the same screen reads "Stage · Plan & Prepare" — the two indicators disagree (authoritative stage comes from `deriveProgressSnapshot` in `progress.ts`).
- **Proposed fix (recommended, low-risk):** drop the hardcoded stage word from the top bar (render a stage-neutral label or remove "Stage · …") so it can never contradict `/dashboard`. *Alt:* pass the derived `stageLabel` into `WorkspaceShell` from the layout (adds a progress read to every gated render — prefer the neutral label for launch).

### `[x]` S7-06 — `/apply` auto-signs-in existing accounts + email-enumeration oracle
- **Area:** auth (security hardening) · **Files:** `src/lib/auth/actions.ts:183-194` (signInWithPassword fallback + distinguishable message); auto-session redirect at `:220/:246`
- **What's wrong:** The public, unauthenticated Apply form handles a duplicate email by calling `signInWithPassword` with visitor-supplied creds. A **correct** password silently establishes a session and redirects to `/dashboard` (the public form becomes a second, unthrottled login); a **wrong** password returns the distinct "That email already has an account…" copy; a brand-new email goes through signUp — **three observably different responses disclose account existence**. This contradicts the codebase's own non-disclosure invariant (`signInAction` uses neutral "That email or password doesn't match.", with an explicit comment that copy "must not reveal whether the email is registered"). Not a gate bypass (`is_approved` stays false; no gated content exposed) and distinct from the deferred rate-limit/Turnstile.
- **Proposed fix:** In the "already registered" branch, stop auto-signing-in from the anon endpoint; return the neutral message for **all** duplicate-email outcomes regardless of password correctness. If the "stranded account, no application row" recovery must stay, gate it strictly behind the already-authenticated branch (`actions.ts:173-174`). *(Owner may choose to defer as low-sev hardening — but it's a small, safe change.)*

### `[x]` S7-07 — DB `youtube_url` rendered into `<a href>` with no scheme validation (latent stored-XSS)
- **Area:** data-layer / DB-sourced content · **Files:** `src/app/(workspace)/academy/page.tsx:44`, `src/app/(workspace)/elements/[slug]/element-tabs.tsx:239`; column `supabase/sql/migrations/0015_academy_modules.up.sql:20` (no CHECK); contrast `src/lib/workspace/markdown.ts:50` (body links *are* scheme-restricted to http/https/mailto)
- **What's wrong:** `academy_modules.youtube_url` flows raw into an anchor `href` in two places with no scheme check. React 19 does not strip `javascript:`/`data:` hrefs, and the CSP (`script-src 'self' 'unsafe-inline'`) does not block `javascript:` URI navigation — so a bad value would execute on click. **Latent today** (all `youtube_url` are null → empty-state branch taken; column is HQ-authored + `is_approved()`-gated; no untrusted write path), so not exploitable at launch, but it's a real defense-in-depth gap and inconsistent with the scheme policy already enforced for markdown body links.
- **Proposed fix:** add a shared `safeHttpUrl()` helper (returns the value only if it parses as `http:`/`https:`, else null → existing "video coming" empty state) applied where `youtube_url` enters the render layer (ideally in `getAcademyModules()` so both consumers get the cleaned value). Optional defense-in-depth: DB `CHECK (youtube_url is null or youtube_url ~ '^https://')` — a new numbered migration, applied to TEST then owner-to-PROD.

### `[x]` S7-08 — Authenticated users not redirected away from `/login` and `/apply`
- **Files:** `src/app/login/page.tsx:16`, `src/app/apply/page.tsx:36`
- **What's wrong:** Neither page checks the session server-side, so a signed-in user (pending/approved/admin) who navigates directly (URL/bookmark/back-button) to `/login` sees "Welcome back" and to `/apply` sees the application form. Functionally safe (an authed `/apply` submit is idempotent → `/dashboard`) but a wrong state. The header CTA already flips to "My Dashboard", so reached mainly by direct nav.
- **Proposed fix:** add an early `supabase.auth.getUser()` guard in both server components; `redirect('/dashboard')` when a session exists (honor a safe `?next` on `/login` via the existing `safe-redirect` helper). Single `getUser()` call so anon visitors are unaffected.

### `[x]` S7-09 — Literal `[contact email]` placeholder token shown on `/privacy` and `/terms`
- **Files:** `src/app/privacy/page.tsx:55-56`, `src/app/terms/page.tsx:68`
- **What's wrong:** Both legal pages render "Contact us at **[contact email]**." — an unfilled merge token reaching the public DOM. Distinct from the intended "pending legal review" bracketed legal copy; this reads as a wiring defect. A working `/contact` link already sits beside it.
- **Proposed fix:** drop the " at [contact email]" clause (rely on the existing `/contact` link) or substitute a real `mailto:` once the address is finalized. Do not ship the raw bracket token.

---

## NIT

### `[~]` S7-10 — `/build` empty-state copy ("Nothing checked off yet") misdescribes its trigger
- **Files:** `src/app/(workspace)/build/page.tsx:39-54`
- **What's wrong:** The empty branch renders only when `model.totalItems === 0`, i.e. `getChecklist()` returned `[]` (fails closed on RPC error) — a "no items / load failure" condition, not "zero progress" (a user who's checked nothing still has `totalItems > 0` and sees the full tracker). The heading misleads on the load-failure path.
- **Proposed fix:** reword to match the real trigger (e.g. "Your checklist isn't available right now. Refresh in a moment…").

### `[x]` S7-11 — `/build` "Blocked?" note form can re-expand after a status round-trip (stale local state)
- **Files:** `src/app/(workspace)/build/build-tracker.tsx:233` (state), 290-333 (toggle + gated form)
- **What's wrong:** `blocking` local state is never reset after "Mark blocked" (the form hides via a guard but `blocking` stays true, and the toggle button no longer renders to flip it). Round-trip blocked → complete → reopen brings status back to `not_started` with `blocking` still true → the empty blocked-note form spontaneously re-expands. Harmless, dismissible; contrived multi-step path on one item.
- **Proposed fix:** `useEffect(() => { if (item.status === 'blocked') setBlocking(false) }, [item.status])` so the toggle clears once committed.

### `[~]` S7-12 — (informational) Supabase Edge-Runtime build warning
- **Source:** `pnpm run build` warning — `process.version` (Node API) used by `@supabase/supabase-js` via `src/lib/supabase/middleware.ts`, unsupported in the Edge Runtime.
- **Assessment:** known, benign warning common to `@supabase/ssr` in middleware; build succeeds and middleware works. **Recommend accept / no change for launch** (suppressing it means restructuring the supabase client import boundary — not worth the risk). Logged for completeness.

---

## Dismissed (verified false-positive / out-of-scope — no fix)

- **D1 — middleware "fails open" without Supabase env** (`src/lib/supabase/middleware.ts:12-14`) → **false-positive.** Documented "integrations no-op when unconfigured" convention; gating is authoritative and **fails closed** at `(workspace)/layout.tsx` (`getUser()` + redirect) and `server.ts`'s non-null env assertions. Optional post-launch hardening: a production-only boot assertion that env vars exist. Not a launch defect.
- **D2 — academy `element_code[0]` unguarded** (`academy/page.tsx:75`) → **false-positive.** `element_code` derives from `elements.code` (`text NOT NULL`, curated catalog, no untrusted write path); the `undefined`-bucket condition cannot occur. Defensive-only; no fix required.
- **D3 — no root `loading.tsx`** → **out-of-scope as a "bug"** (cosmetic; routes function correctly without a streamed skeleton). **However** the owner explicitly opted to add a root `loading.tsx` as **Step 6 launch polish**, so it will be added there — not in the Step 3 fix pass.

---

## Fixes applied (Step 3) — what changed

| ID | File(s) | Change |
|---|---|---|
| S7-01 | `src/components/layout/site-chrome.tsx` | `GATED_PREFIXES` now covers the whole `(workspace)` group + `/admin` (was just `/dashboard`,`/admin`), so no gated route gets public chrome. Route-group refactor noted as post-launch follow-up. |
| S7-02 | `src/app/(workspace)/account/account-form.tsx` | "Change password" now links to `/forgot-password` (the working email-reset flow) instead of `/update-password` (which only accepts a recovery session). |
| S7-03 | `src/components/workspace/pending-state.tsx`, `src/app/(workspace)/support/page.tsx` | `PendingState` gains an opt-in `contactFallback` that renders a `/contact` link; `/support`'s pending branch passes it, so a pending partner always has a way to reach us. |
| S7-04 | `src/app/update-password/page.tsx` | Now reads the `ph-recovery` cookie server-side: shows the form only with a valid recovery marker, otherwise a "Send a reset link" prompt — no more silent post-submit bounce. |
| S7-05 | `src/components/workspace/workspace-shell.tsx` | Top-bar badge shows the truthful approval status ("Approved" / "Awaiting approval") instead of a hardcoded "Stage · Plan & Prepare" that contradicted `/dashboard`. No extra DB reads. |
| S7-06 | `src/lib/auth/actions.ts` | `/apply` no longer signs in with the supplied credentials on a duplicate email — returns the same neutral message regardless of password, removing the auto-login + password-based enumeration oracle. |
| S7-07 | `src/lib/workspace/content.ts` | New `safeHttpUrl()` applied in `getAcademyModules()` (the single source for both consumers) — DB `youtube_url` is http(s)-validated before it reaches any `href`; non-http(s) → null → existing empty state. No DB migration (render-layer guard per owner call). |
| S7-08 | `src/app/login/page.tsx`, `src/app/apply/page.tsx` | Both now `getUser()` and redirect an already-authenticated visitor (login → safe `?next`/`/dashboard`; apply → `/dashboard`) instead of showing the auth/apply shell. |
| S7-09 | `src/app/privacy/page.tsx`, `src/app/terms/page.tsx` + canonical `docs/page-copy/01-public-pages/{privacy,terms}.md` | Dropped the unfilled "at [contact email]" clause (no email exists yet, §4); the working `/contact` link remains. Code + copy kept in sync. |
| S7-11 | `src/app/(workspace)/build/build-tracker.tsx` | `BuildItem` resets local `blocking` on status change, so a status round-trip can't spontaneously re-expand an empty "Blocked?" note form. |
| S7-10 | `src/app/(workspace)/build/page.tsx` | **`[~]` No code change.** "Nothing checked off yet." is locked copy (build.md §Empty state) and only surfaces on a checklist-load failure (the 200+ item catalog is never genuinely empty). Rewording would break copy-verbatim; distinguishing load-failure from empty needs an error signal from the data layer — out of scope for a nit. Accepted; owner may revisit. |

## Step 3 fix plan (after owner review)

Fix order: **S7-01** (double chrome — headline, touches layout wiring) → **S7-02 + S7-04** (account/update-password flow, related) → **S7-03** (pending support link) → **S7-05–S7-09** (low) → **S7-10, S7-11** (nits). Each fix: smallest safe change, re-verified against its repro, typecheck/lint/build green, no regression. S7-12 + D1/D2 accepted as-is; D3 deferred to Step 6.

**Owner judgment calls to confirm before Step 3:**
1. **S7-02 approach** — repoint "Change password" to the email-reset flow *(recommended, simplest/safest)* vs build a real in-app change with re-auth?
2. **S7-06** — fix the `/apply` auto-signin/enumeration now *(small safe change, recommended)* or defer as low-sev hardening?
3. **S7-07** — include the optional DB `CHECK` migration for `youtube_url`, or render-layer `safeHttpUrl()` guard only?
4. **S7-04 / S7-09** — any new/replacement strings should come from approved copy; confirm wording or let me use the minimal neutral option.
