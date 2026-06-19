# Codex review brief — S7: Final review & launch

> Hand this whole file to Codex (or any independent reviewer). It is **self-contained**: it explains what S7 is, exactly what to review, the **blocking** checks, the high-risk areas with file pointers, the locked decisions you must **not** flag, and the required output format. Review the **branch diff only** (`claude/sprint-s7-final-review-launch` vs `main`), not the whole repo. Get it with `git diff main...HEAD`.

---

## 0. Your job, in one line

Find anything in the S7 diff that is a **correctness bug, a security/data-safety hole, a broken approval gate, an App Router server/client boundary mistake, a secret leak, a Supabase/RLS risk, an open redirect, a CSP/header regression, or build/deploy breakage** — and nothing else (no style nits, no opinions on approved copy or the locked design). This is the **final pre-launch sprint**; the bar is zero known bugs at go-live.

Read `AGENTS.md` in the repo root first — it defines the reviewer rules and the **Palestine House gating checks**. Any failure of those gating checks is **blocking**.

---

## 1. What S7 is

Palestine House is **two shells behind one gate**: a public marketing site + a private, approval-gated partner reference platform (`profiles.is_approved`). S6 (merged, PR #25) built the whole private platform. **S7 is QA + verification + launch — not a build sprint:** it changes behaviour only to fix a bug or add agreed launch polish. No new features, no redesigns, no DB migrations. Launch is on the existing **Vercel domain** (`https://palestine-house-website.vercel.app`); custom domain is post-launch.

- **Proof numbers are fixed**: **10 focus areas · 30 topics · 200+ checklist items · 267 templates · 3 gates**. Flag any other count.
- Copy is **verbatim** from `docs/page-copy/` (gitignored; OneDrive is canon). When code and an on-disk copy file disagree, a **locked decision in `PROJECT-STATUS.md` §4** wins (see §4 below — the café-card case).

### What S7 changed (the diff, ~16 code files)
- **`src/components/layout/site-chrome.tsx`** — `GATED_PREFIXES` expanded from `["/dashboard","/admin"]` to the **whole `(workspace)` group + `/admin`** (fixes double public+workspace chrome on every gated route except `/dashboard`). Presentation-only.
- **`src/lib/auth/actions.ts`** — `applyAction` duplicate-email branch **no longer calls `signInWithPassword`** (removes a login/account-enumeration oracle on the anonymous Apply form); returns the same neutral message regardless of password.
- **`src/app/login/page.tsx` + `src/app/apply/page.tsx`** — redirect an already-authenticated visitor away (login → `safeNextPath(next,"/dashboard")`; apply → `/dashboard`, but **only if they already have an application row** — a stranded session with no application still reaches the form so `applyAction`'s idempotent recovery can finish).
- **`src/app/update-password/page.tsx`** — now reads the `ph-recovery` cookie server-side and shows a "Send a reset link" prompt when absent, instead of rendering a form that silently bounces on submit. The authoritative gate stays in `updatePasswordAction`.
- **`src/app/(workspace)/account/account-form.tsx`** — "Change password" link repointed `/update-password` → `/forgot-password` (the working email-reset flow).
- **`src/components/workspace/pending-state.tsx` + `support/page.tsx`** — pending `/support` now shows a `/contact` fallback link (optional `contactFallback` prop; default false, 10 other callers unaffected).
- **`src/components/workspace/workspace-shell.tsx`** — top-bar badge shows truthful approval status (was a hardcoded "Plan & Prepare" stage that contradicted `/dashboard`).
- **`src/lib/workspace/content.ts`** — new `safeHttpUrl()` applied in `getAcademyModules()` http(s)-validates `youtube_url` before it reaches any `<a href>` (latent stored-XSS guard; both consumers fall back to the empty state on null).
- **`src/app/(workspace)/build/build-tracker.tsx`** — `useEffect` resets the "Blocked?" toggle on status change (stale-state fix).
- **`src/app/privacy/page.tsx` + `terms/page.tsx`** — dropped the unfilled `[contact email]` token (no email exists yet, §4); `/contact` link stays.
- **`next.config.ts`** — `images.formats: ["image/avif","image/webp"]` (CWV). Security headers/CSP **unchanged**.
- **`src/app/layout.tsx`** — `viewport.themeColor`, Organization `logo` JSON-LD, `openGraph.locale` `en`→`en_US`.
- **New metadata routes** — `src/app/icon.svg` (static favicon), `apple-icon.tsx` (`ImageResponse` PNG), `manifest.ts`, `loading.tsx`, Home `metadata`. All from the brand arch mark.

---

## 2. The gating model (verify it still holds — S7 must not have weakened it)

- `src/app/(workspace)/layout.tsx` gates **session** (anon → `/login`); each data page additionally gates **approval** (returns `<PendingState/>` before any content fetch when `!is_approved`). `/admin/*` checks the `admins` table and `notFound()`s non-admins.
- The `GATED_PREFIXES` change is **presentation-only** (it only decides whether the public header/footer wraps the page) — confirm it does **not** touch the server-side gate, and that no public route prefix collides (notably `/our-support` vs `/support`).
- All workspace reads go through `is_approved()`-gated `SECURITY DEFINER` RPCs under the user session + RLS (publishable key, never the secret/`service_role` key).

---

## 3. Highest-risk areas — review these hard

1. **`applyAction` oracle removal** (`src/lib/auth/actions.ts`): confirm no path leaves a user wrongly signed-in, `userId` is guarded on every failure branch, the response no longer differs by password correctness, and the idempotent recovery (authenticated branch + one-application check) still works.
2. **login/apply redirects** (`login/page.tsx`, `apply/page.tsx`): confirm `redirect()` is at top level (not swallowed by a try/catch), `safeNextPath` blocks open redirects on `/login`, anonymous visitors still reach the form, and the `/apply` conditional (only redirect when an application row exists) preserves the stranded-user recovery path. Confirm both pages being dynamic is fine (no static-export assumption).
3. **`/update-password` gate** (`update-password/page.tsx` + `src/app/auth/confirm/route.ts` + `updatePasswordAction`): the page cookie read is presentation-only; the **authoritative** marker+session check must remain in the action (defense in depth). Confirm the `ph-recovery` value/path/maxAge match end-to-end and a normal session still cannot reset the password.
4. **`youtube_url` sanitization** (`content.ts`): confirm `safeHttpUrl` never throws, passes valid `https`, and that **both** consumers (academy cards + the element Video tab, which sources via `getAcademyModules`) receive the cleaned value so `javascript:`/`data:` can't reach an `<a href>`.
5. **CSP / headers / boundaries**: confirm `next.config.ts` security headers are **unchanged**, AVIF/WebP images are same-origin (`/_next/image`, covered by `img-src 'self'`), the new `icon`/`apple-icon`/`manifest` routes need no CSP change, and no secret/server-only value is passed into a client component anywhere in the diff.

---

## 4. Locked decisions — do NOT flag these (carried from S6 + S7)

- **Home café card reads "A café where the recipes are here to stay."** This is **locked decision §4** (PROJECT-STATUS, 2026-06-12, S1). The on-disk `docs/page-copy/01-public-pages/home.md` is **stale** (still shows the older grandmother's-recipe line) — §4 is authoritative; do **not** flag the code as drift.
- **`GATED_PREFIXES` is a hardcoded path list** (not a route-group split) — the route-group refactor is a noted post-launch follow-up; the current list is verified complete and collision-free.
- **Gates suppressed** on `/build` + `/dashboard` (D-S6-b: `checklist_items.gate` all-null, Gate 2 label unapproved — HQ content pending).
- **Launch without rate-limit/Turnstile** on public writes (D-S6-a) — hardening is post-launch S10; the `/support` write stays `is_approved()`-gated.
- **`/account` Delete section hidden** (D-S6-c); `/account` is session-gated (not approval-gated) and `set_my_account` is `auth.uid()`-scoped, never `is_approved`.
- **Launch on the Vercel domain** (§4); contact/legal email not set yet (§4) — hence the dropped `[contact email]` token and the deferred `/support` email.
- The Supabase **Edge-Runtime build warning** (`process.version` via `src/lib/supabase/middleware.ts`) — known, benign; accepted for launch.
- **S1 design refresh** (§4): art sections on white, non-art on the dark ink surface, premium white cards — do not "fix" back to mockup section washes.

---

## 5. Required output

Return exactly these sections:

1. **Blocking issues** — correctness, security/data-safety, broken approval gating, secret leak, App Router boundary mistake, open redirect, RLS/Supabase risk, CSP/header regression, build breakage. Any failure of the AGENTS.md gating checks belongs here. For each: `file:line`, what's wrong, why it's blocking, and a concrete fix.
2. **Non-blocking issues** — real but lower-impact. Same format.
3. **Missing checks** — anything you couldn't verify (e.g. needs a running app / prod DB) and how to verify it.
4. **Merge recommendation** — `approve` / `request changes` / `blocking`, one line of rationale.

Do **not** make changes, push, or merge. Cite exact `file:line` for every finding. If you find nothing blocking, say so plainly.

---

## 6. Reviewer reference

- Rules & gating checks: `AGENTS.md` (root). Project rules: `CLAUDE.md`. Security invariants: `docs/SECURITY-CHECKLIST.md` §5 (RLS/RPC) + §15 (gated routes / public writes).
- The full S7 QA log, fix detail, accepted/dismissed items, and the production smoke-test: `docs/code-reviews/s7-qa-findings.md`.
- Where we are: `docs/PROJECT-STATUS.md` §1–§2 (+ §4 locked decisions, §5 open decisions, §7 known issues). DB runbook: `supabase/sql/README.md`. MCP safety: `docs/SUPABASE-MCP-SAFETY.md`.
