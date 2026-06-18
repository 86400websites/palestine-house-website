# Codex review brief — S6: Private platform pages

> Hand this whole file to Codex (or any independent reviewer). It is **self-contained**: it explains what S6 is, exactly what to review, the **blocking** checks, the high-risk areas with file pointers, the locked decisions you must **not** flag, and the required output format. Review the **branch diff only** (`claude/sprint-s6-private-platform-pages` vs `main`), not the whole repo.

---

## 0. Your job, in one line

Find anything in the S6 diff that is a **correctness bug, a security/data-safety hole, a broken approval gate, an App Router server/client boundary mistake, a secret leak, a Supabase/RLS risk, or build/deploy breakage** — and nothing else (no style nits, no opinions on approved copy or the locked design).

Read `AGENTS.md` in the repo root first — it defines the reviewer rules and the **Palestine House gating checks**. Any failure of those gating checks is **blocking**.

---

## 1. What S6 is

Palestine House is **two shells behind one gate**: a public marketing site and a **private, approval-gated partner reference platform** (`profiles.is_approved`). S6 builds the entire private platform on top of the S5 content schema — every page under the `(workspace)` route group — so the site is launch-ready.

- **Reference, not a course**: no quizzes, no certificate. The only per-user write is checklist progress (`/build`).
- **Proof numbers are fixed**: **10 focus areas · 30 topics · 200+ checklist items · 267 templates · 3 gates**. Flag any other count (e.g. `543`, `250+`).
- Copy is **verbatim** from `docs/page-copy/03-member-workspace/*.md` (+ `06-elements/`). Design is from `docs/page-designs/member-workspace/*.app.jsx` + `shared/workspace-chrome.jsx` + `workspace.css`.

### Routes added/extended (all under `src/app/(workspace)/`)
`/dashboard` (mid-journey snapshot) · `/plan` · `/operate` · `/build` (checklist tracker) · `/elements/[slug]` (×30) · `/resources` + `/resources/[category]` · `/academy` · `/tools` · `/account` · `/support`.

### Data layer & writes
- `src/lib/workspace/{types,content,markdown,progress}.ts` — typed wrappers over the 7 S5 read RPCs (+ markdown render/sanitize, progress derivation).
- Server Actions: `src/lib/build/actions.ts` (`set_checklist_progress`), `src/lib/resources/actions.ts` (signed-URL download), `src/lib/account/actions.ts` (`set_my_account`), `src/lib/support/actions.ts` (`submit_support_request`).
- Client shells (the only `"use client"`): `build-tracker.tsx`, `elements/[slug]/element-tabs.tsx`, `resources/resource-library.tsx`, `account/account-form.tsx`, `support/support-form.tsx`, `components/workspace/workspace-shell.tsx`.

### New DB migrations (TEST-applied + role-matrix verified this session; **prod pending**)
- `0017_resources_download` — a `storage.objects` SELECT policy on the **private `resources` bucket** gated on `public.is_approved()` (role `authenticated`), **and** `get_resource_download(p_id)` (`SECURITY DEFINER`, `search_path=''`, `is_approved()`-gated) returning one resource's `storage_bucket`/`storage_path`/`is_public`.
- `0018_account_prefs` — `profiles.marketing_opt_in` (boolean, default false) + `set_my_account(p_display_name, p_marketing_opt_in)` (`SECURITY DEFINER`, `search_path=''`, **`auth.uid()`-scoped, NOT `is_approved()`-gated**, can only ever set `full_name` + `marketing_opt_in`).
- `0019_support_requests` — `support_requests` (RLS default-deny, **no client policy**) + `submit_support_request(p_subject, p_message)` (**approved-only** insert, `user_id` from `auth.uid()`) + `admin_list_support_requests()` (`is_admin()`-gated read).

Each migration has a matching `.down.sql` and (PROD-safe) verification script under `supabase/sql/verification/`.

---

## 2. The gating model (verify it holds everywhere)

- `src/app/(workspace)/layout.tsx` gates **session** only (anon → `/login`). Approved **and** pending users get the shell.
- Each **data page** additionally gates **approval**: it returns `<PendingState/>` (or the pending dashboard) **before any content fetch** when `!is_approved`. This applies to `/dashboard`, `/plan`, `/operate`, `/build`, `/elements/[slug]`, `/resources`, `/resources/[category]`, `/academy`, `/support`, `/tools`.
- **`/account` is the one intentional exception**: session-gated only (reachable pre-approval, per the always-on sidebar item). Its write `set_my_account` is `auth.uid()`-scoped and can never touch `is_approved` — confirm there is no escalation.
- All workspace reads go through `is_approved()`-gated `SECURITY DEFINER` RPCs (publishable key + user session under RLS — **never** the secret/`service_role` key). The browser/server Supabase clients are in `src/lib/supabase/`.

---

## 3. Highest-risk areas — review these hard

1. **Signed-URL downloads** (`src/lib/resources/actions.ts` + `resource-library.tsx` + migration `0017`):
   - The **raw storage path must never reach the client.** `get_resources()` omits it; the path is resolved **server-side** via `get_resource_download` and only a URL is returned. Confirm no `storage_path`/`storage_bucket` is serialized into any client prop or HTML.
   - The signed URL is minted with the **user's own authenticated client** (no service key) and is short-lived (60s). It works only because the `0017` storage policy grants approved users SELECT on the `resources` bucket — confirm anon/pending are denied at **both** the RPC and the storage layer (fail closed).
   - Booklets use a **public** URL (public bucket) — acceptable (they are public lead magnets).
   - Confirm the action treats unapproved and unknown ids **identically** (no enumeration oracle) and UUID-validates input.
2. **The three new RPCs + the storage policy** (migrations `0017`–`0019`): each `SECURITY DEFINER` with `search_path=''`, authorization from `auth.uid()`/`is_approved()`/`is_admin()` (never from arguments), EXECUTE revoked from `public`+`anon` then granted to `authenticated`, narrow returns, RLS default-deny on every table. Confirm `set_my_account` cannot set `is_approved`; `submit_support_request` is approved-only and forces `user_id`; `admin_list_support_requests` returns zero rows to non-admins; each `.down.sql` exactly reverses its `.up.sql`.
3. **Server/client boundaries**: `"use client"` only on the interactive shells; no server-only module (actions, `content.ts`, supabase server) pulled into a client bundle; client reads only `NEXT_PUBLIC_*`. Confirm **public pages stayed static** and **no CSP/`connect-src` change** was needed (downloads are top-level navigations; YouTube is an outbound link, not an embed; no browser-side supabase data call was added). Check `src/components/layout/site-header.tsx` + `src/lib/auth/actions.ts` deltas for any static/CSP regression.
4. **Markdown rendering** (`src/lib/workspace/markdown.ts`, used by `element-tabs.tsx` via `dangerouslySetInnerHTML`): confirm DB markdown is sanitized **server-side** (`sanitize-html`) and there is no XSS vector from element bodies.
5. **App Router correctness**: gated pages render dynamically (`ƒ`), public pages static (`○`); `generateMetadata`/`metadata` per route; `notFound()` on unknown `/elements/[slug]` and `/resources/[category]` (A–J) for **approved** sessions only (pending sees PendingState, never a 404 that confirms existence).

---

## 4. Locked decisions — do NOT flag these

- **Gates suppressed** on `/build` + `/dashboard` (D-S6-b): `checklist_items.gate` is all-null and the Gate 2 label is unapproved, so the tracker shows focus-area grouping + overall % and **no gate banners** until HQ supplies the mapping. Intentional.
- **Launch without rate-limit/Turnstile** on public writes (D-S6-a): accepted; hardening is post-launch S10. The `/support` write is `is_approved()`-gated as the interim anti-abuse measure.
- **`/account` Delete account section hidden** (D-S6-c): deletion routes through `/support`; real self-service deletion is post-launch.
- **`/resources` "Browse by focus area" uses cards** (linking to `/resources/[category]`), deviating from the mockup's dropdown — owner-delegated decision so the category route has an entry point.
- **`/support`** is approval-gated, its write approved-only, email delivery deferred (requests **stored**, not emailed), and the mockup's "Quick answers" section omitted (those strings aren't in `support.md`).
- **`/academy`** youtube_url is null for all modules today → each card shows the graceful "video coming · read the guide" state and links to the topic guide; no CSP change.
- **`/account`** is session-gated (not approval-gated) and `set_my_account` is not `is_approved()`-gated — intentional (pre-approval account management).
- **S1 design refresh** (PROJECT-STATUS §4): art sections on white, non-art sections on the dark ink surface, premium white cards — do **not** "fix" pages back to the mockup section washes.
- `marketing_opt_in` defaults **false** (privacy-respecting), not the mockup demo's true.

---

## 5. Required output

Return exactly these sections:

1. **Blocking issues** — correctness, security/data-safety, broken approval gating, secret leak, App Router boundary mistake, RLS/Supabase risk, build breakage. Any failure of the AGENTS.md gating checks belongs here. For each: `file:line`, what's wrong, why it's blocking, and a concrete fix.
2. **Non-blocking issues** — real but lower-impact. Same format.
3. **Missing checks** — anything you couldn't verify (e.g. needs a running app / prod DB) and how to verify it.
4. **Merge recommendation** — `approve` / `request changes` / `blocking`, one line of rationale.

Do **not** make changes, push, or merge. Cite exact `file:line` for every finding. If you find nothing blocking, say so plainly.

---

## 6. Reviewer reference

- Rules & gating checks: `AGENTS.md` (root).
- Project rules: `CLAUDE.md`. Security invariants: `docs/SECURITY-CHECKLIST.md` §5 (RLS/RPC) + §15 (gated routes / public writes).
- DB runbook + migration history: `supabase/sql/README.md`. MCP safety: `docs/SUPABASE-MCP-SAFETY.md`.
- Where we are: `docs/PROJECT-STATUS.md` §1–§2 (+ §5 open decisions, §7 known issues).
- Copy (canonical): `docs/page-copy/03-member-workspace/*.md` + `06-elements/`. Design: `docs/page-designs/member-workspace/`.
