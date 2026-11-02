# Palestine House Website — Agent Instructions

> Governs **non-primary agents** in the `palestine-house` repo — code-review agents (e.g. Codex), automation, and any tool other than the main Claude Code engine. The primary engine's rules live in [`CLAUDE.md`](./CLAUDE.md). Stack + project architecture: [`TECH-ARCHITECTURE.md`](./docs/TECH-ARCHITECTURE.md). Process: [`WORKFLOW.md`](./docs/WORKFLOW.md). Sprint plan: [`ROADMAP.md`](./docs/ROADMAP.md). Current state: [`PROJECT-STATUS.md`](./docs/PROJECT-STATUS.md).

## The gated side, as it actually is (Stage 4, current since PP5 on 2026-08-14; content and labels per the CR1 release)

- **Where the code lives:** every gated page is in **`src/app/(platform)`**, which carries its own server-side session gate; each page also checks approval itself. `/admin/*` is separate and additionally checks the `admins` table. The legacy `src/app/(workspace)` group **no longer exists** — PP5 deleted it, and its paths (`/plan` `/build` `/food` `/programming` `/live` `/elements/[slug]` `/resources` `/academy` `/tools`) 307 to `/dashboard`.
- **The surface:** `/dashboard` (Overview landing) · four toolkit sections `/setup` `/operate` `/program` `/support` · the Simple Guide reader at `/{section}/{topic}/guide` · `/account` · a global Ctrl/⌘+K search overlay. The UI calls it the Community Platform.
- **Per-topic model (D-PP-f, extended at CR1):** summary and Watch Video on the card; Explore opens a panel with the **Overview download** (one row, badge `OV`, not a card) → **one Simple Guide card** (Read Now + Download Word File) → a **many-template grid** → on 10 focus areas **shared resources from other focus areas** (`SHARED_RESOURCES`: cross-links to the home card's rows, never a copy). No per-topic checklist card, no "More guides" extras.
- **No saved per-user state** beyond the partner's own account row (D-PP-b dropped checklist progress). **Community Contacts** on `/support` replaced Ask HQ at CR1: guidance and a link to `/contact`, with no form, nothing written and no email sent from the block.
- **`resources.doc_key` is `('guide')`**, so the row's `code` carries every other distinction (`src/lib/workspace-v2/shared-resources.ts`): the reserved **`OV`** marks the Overview, an ordinary private row, and `fileKindOf` reads **`LOGO`** as the PNG logo, **`SVG-n`** as an editable SVG layout and anything else as a Word file, which picks the download label. A topic's templates are the `resources` rows with its `element_id`, `doc_key IS NULL`, `code IS NOT NULL`, **`code <> 'OV'`** (so an Overview is neither listed nor counted among the 83), **`is_public = false`** and bucket `resources`. The bucket half of that predicate **is enforced in SQL** — `0029`'s `resources_private_bucket_shape` CHECK (`is_public OR storage_bucket = 'resources'`), so **D-PP-i is discharged**.
- **Retired surfaces, and what became of their tables.** `academy_modules`, `checklist_items` and `checklist_progress` were **dropped from production** by `0033` (2026-08-17), after `0030` emptied them. **`programming_sessions` still exists**: RLS on, **zero policies, zero rows** — default-deny to everyone. Unreachable is not the same as unprotected: nothing should add a caller to it, and a diff that gives it a policy needs a very good reason. **`support_requests`** also survives, since CR1 deleted the Ask HQ form and `src/lib/support/`: RLS on, no client policy, and rows may exist, because Ask HQ stored every request from S6 on. Its two RPCs survive with no caller and their gates intact: `submit_support_request` (approved-only) and `admin_list_support_requests()` (`is_admin()`-gated). The same rule holds, and a cleanup looks at the rows before it treats the table as droppable.
- Migrations **0027–0034 are applied to production and are IMMUTABLE** — any schema fix is a new migration `0035`+. Production is on **`0034`**. CR1 ships no migration.

## Project assumptions

- This repository is the **Palestine House** website on the locked Next.js 15 stack in `TECH-ARCHITECTURE.md`.
- **Two shells, one gate:** a public marketing shell (single CTA: Apply to Join; helper line *Apply for community access, not permission to operate a House.*) and a private, approval-gated partner reference platform. Apply = sign-up (one form → pending account → approval by an HQ admin via `profiles.is_approved` → unlock). Admin approval queue at `/admin/approvals` is server-checked via an `admins` table. "HQ" is an internal word for that admin role: no public page or private-shell string says it. `/terms` was removed at CR1 and 404s; `/privacy` is the one legal page.
- It is a **reference, not a course** — no quizzes, no certificate, and no saved per-user state beyond the partner's own account details (see the section above).
- Copy is **verbatim**: this release's from the owner's supplied documents under the gitignored `docs/source-assets/content-refresh-cr1/`, with `/docs/page-copy/` as the older canon for anything those did not cover; design follows `/docs/page-designs/` + the design tokens in `/docs/page-designs/design-system/`; the header/footer are locked and identical on every page. Proof numbers: **4 sections · 22 focus areas · 83 templates and practical tools** (127 learner files in all, which are not all templates), the same on the public site and in the platform. PP7 reconciled them (D-PP-s, owner-signed live 2026-08-20, at 88), CR1 moved the template figure to 83 with the owner's delivery, and a copy checker (`scripts/verify-public-copy.ts`) enforces them. The old band (11 · 33 · 200+ · 297 · 120-day, plus 88 templates, the previous release's number) describes content that no longer exists — treat any surviving instance outside a dated record as a defect. Numbers move only when real content is added, never invented.
- GitHub is the source of truth; `main` is protected and production-ready. Vercel hosts Production and Preview.
- The project is built **one sprint at a time** per `ROADMAP.md`. Agents make **focused, reviewable** contributions inside the active sprint. Default mode is **review**, not large edits.
- Only code that ships in a production build is in scope. Verify claims against the repo before acting.

## Stack assumptions (verify against the repo first)

- **Framework:** Next.js 15 (App Router), TypeScript strict
- **Package manager:** pnpm (pinned via `packageManager`) — do not use `npm` or `yarn`
- **Styling:** Tailwind CSS v4 + shadcn/ui; **Animation:** Framer Motion (restrained editorial register); **Forms:** react-hook-form + zod
- **Auth + DB:** Supabase via `@supabase/ssr` with `middleware.ts` session refresh (from Sprint 2 onward)
- **Integrations:** server-only Route Handlers under `src/app/api/*` for Mailchimp, Resend, plus Upstash rate limiting and Turnstile — each no-ops when its env vars are absent (but fails closed in Production)
- **Hosting:** Vercel (preset `nextjs`, install `pnpm install --frozen-lockfile`, build `pnpm run build`)

> **Migration guard.** Treat `npm` / `VITE_*` / `localhost:5000` / `dist/` / React Router / Replit references as historical, not current. Trust the repo (`package.json`, `next.config.ts`, `src/app/`) over any stale note.

## Review style: serious issues only

- Report **serious issues only** — correctness bugs, security/data-safety problems, broken auth or approval gating, leaked secrets, App Router boundary mistakes, build/deploy breakage.
- Do **not** raise style nits, formatting, or subjective preferences (lint/Prettier own those). Do **not** critique the approved copy or the locked design.
- Prefer a few high-confidence findings over a long list of maybes. Mark uncertain findings low-confidence.
- Review the **PR / branch diff**, not the whole repo, unless explicitly asked for a full audit.

## Review priorities (in order)

1. **Correctness** — does the change do what the sprint claims without breaking existing behavior?
2. **Security & data safety** — secrets, auth, **approval-gate enforcement**, input validation, RLS, injection, open redirects.
3. **Server/client boundary** — secrets or heavy logic leaking into client components.
4. **App Router correctness** — routing, metadata, server-side auth + approval checks.
5. **Build & deploy health** — typecheck/lint/build pass; Vercel/env implications handled.
6. **Content fidelity** — copy matches the owner's CR1 documents, or `/docs/page-copy/` where those did not cover it (both gitignored; a reviewer without them says so); proof numbers correct; no invented strings on approved pages.
7. **Maintainability** — only when it rises to a real problem.

## Security checks

- [ ] No secret committed; `.env.local` not in the diff; no secret behind a `NEXT_PUBLIC_*` name
- [ ] Server-only secrets used **only** in Server Components, Route Handlers, Server Actions, or `instrumentation.ts`
- [ ] Route Handlers zod-validate request bodies; params/headers/cookies treated as untrusted
- [ ] No `dangerouslySetInnerHTML` / `innerHTML` fed by user-controlled or query data (element MDX bodies render through the sanctioned MDX pipeline only)
- [ ] Auth redirect targets validated same-origin (no open redirect via `?next=`)
- [ ] Public write endpoints (`/api/apply`, contact, lead-magnet, newsletter) rate-limited + Turnstile-verified; fail closed in Production
- [ ] Error responses don't leak stack traces, credentials, internal URLs, or upstream error bodies
- [ ] Security headers / CSP not weakened; CSP extended only for the chosen Live Programming embed origin; any leaked key flagged for rotation

## Palestine House gating checks (blocking)

- [ ] 🔴 Every gated route has an explicit **server-side session + `is_approved`** check; `/admin/*` additionally checks the `admins` table server-side. **The check must be the page's OWN and must throw before it constructs any JSX** — a parent layout's `redirect()` does not stop the child segment rendering into the streamed response, and *awaiting* a round-trip does not either (PP8 8-k; five `/admin` pages awaited gated RPCs and still leaked their headings to anonymous callers). The one deliberate exception is **`/account`**, which is session-gated only so a pending partner can manage their own row — flag any *other* route missing its approval check
- [ ] 🔴 **Every** platform RPC — read *and* write — enforces `is_approved` server-side. The only exception is an **owner-scoped account/profile RPC** (`set_my_account`, `get_my_profile`), which is scoped to `auth.uid()` and can touch nothing but the caller's own row. Pending sessions can resolve only profile/approval status. This is deliberately a blanket rule, not a list: the reads (`get_platform_sections/topics`, `get_element`, `get_resources`), the writes (`submit_support_request`, unreached since CR1 and still gated) and the signed-URL issuer (`get_resource_download`) are **examples**, and a new RPC is covered the day it is written. The search index inherits the rule by being built from the same gated reads
- [ ] 🔴 Public projections expose titles and one-line summaries only — never gated bodies, Overview documents, templates or other files, or anything in the dormant `programming_sessions` and `support_requests` tables
- [ ] 🔴 Template/resource downloads go through server-issued **signed URLs** from a private bucket, to approved users only; no storage path or bucket name reaches the client
- [ ] 🔴 No quiz/certificate/ops features introduced; no second signup path beside `/apply`

## App Router checks

- [ ] Routes under `src/app/`; API endpoints are Route Handlers at `src/app/api/<name>/route.ts`
- [ ] `"use client"` only where interactivity requires it; Server Components remain the default
- [ ] No secret passed from a Server Component into a Client Component as a prop
- [ ] Protected routes have explicit server-side checks (file location is not access control)
- [ ] Per-route `metadata` (title, description, canonical, OG) intact for SEO

## Supabase checks

- [ ] Frontend uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] `service_role` / `sb_secret_*` / JWT secret / DB password never reach client code
- [ ] RLS enabled default-deny on every user-reachable table; new tables ship with policies
- [ ] Reads/writes run under the user's session + RLS or a hardened `SECURITY DEFINER` RPC — no normal path relies on the secret key
- [ ] `programming_sessions` stays **default-deny**: the table survives `0033` with RLS on and **no policies at all** (the `/live` feature it served was deleted at PP5). A diff that adds a policy, a caller, or a row to it is a finding unless the sprint explicitly revives the feature
- [ ] Schema changes include the SQL, the `.down.sql`, **and** RLS policies in the PR (applied by hand, non-production project first)

## Vercel deployment checks

- [ ] New/changed env vars listed in the PR (names only), scoped per environment; redeploy noted
- [ ] `NEXT_PUBLIC_*` (build-time, public) vs server-only (runtime) usage correct
- [ ] `vercel.json` and `next.config.ts` consistent if build output, scripts, headers, or routing changed
- [ ] Auth email links resolve to the request/Preview origin — Preview must not redirect users to Production
- [ ] Change is testable on a Vercel Preview before merge

## What agents may and may not change

**May:** review and comment on the diff; make the **specific, requested** change on a focused branch when explicitly asked; add/adjust tests or docs directly tied to that change.

**May not (without an explicit request):** broad refactors, reformatting, renaming across files; changing approved copy, the locked header/footer, layout, routing, configs, or dependencies; adding production dependencies or swapping locked stack layers; changing env vars, security headers, or CSP; editing `ROADMAP.md` sprint scopes or `PROJECT-STATUS.md` history; committing to `main`, pushing, merging PRs, or skipping Git hooks (`--no-verify`).

## Secrets & `.env.local` rules

- Never read, echo, copy, or commit `.env.local` or any secret value.
- Never hardcode secrets, credentials, API keys, tokens, or private URLs. Reference env vars by **name** only.
- Never place a server-only secret behind a `NEXT_PUBLIC_*` name.

## No broad refactors unless requested

- Keep scope to the task and the active sprint. Make the smallest safe change.
- Follow existing code style and file organization.
- If you spot a larger issue outside scope, **report it as a finding** — don't fix it unprompted.

## If an agent edits code (working agreements)

1. Read `PROJECT-STATUS.md` and the active sprint in `ROADMAP.md`; inspect the repo.
2. Read relevant files (and the relevant copy document if copy is involved: the owner's CR1 documents, then `/docs/page-copy/`); explain the planned change briefly; keep scope narrow.
3. Make the smallest safe change; follow existing style.
4. Run `pnpm run typecheck`, `pnpm run lint`, `pnpm run build`. Fix failures you caused; flag pre-existing ones.
5. `git status`; confirm `.env.local` is not staged and no secrets are in the diff.
6. Use a focused branch (e.g. `codex/fix-mobile-header`, `codex/harden-apply-route`). One agent per branch at a time.
7. Do not push, merge, or commit to `main` unless explicitly instructed.

## How to report findings

For each finding: **Severity** (Critical/High/Medium/Low) · **Location** (`path/file.ts:line` + route) · **Issue** · **Why it matters** · **Suggested fix** · **Confidence**.

End an edit task with: summary, files changed, checks run + results, risks/follow-ups, suggested PR title + description. End a review task with the prioritized findings list and a clear merge recommendation (approve / request changes / blocking issues — any §"gating checks" failure is blocking).
