# Palestine House Website — Claude Code Instructions

> This file configures how Claude Code works in the **Palestine House** repo (`palestine-house`). Companion docs, all under `docs/` except `AGENTS.md`: [`TECH-ARCHITECTURE.md`](./docs/TECH-ARCHITECTURE.md) (the locked stack + project architecture), [`WORKFLOW.md`](./docs/WORKFLOW.md) (branch → PR → Preview → merge + sprint discipline), [`DESIGN.md`](./docs/DESIGN.md) (the Palestine House visual system), [`ROADMAP.md`](./docs/ROADMAP.md) (stages & sprints), [`PROJECT-STATUS.md`](./docs/PROJECT-STATUS.md) (where we are right now), [`AGENTS.md`](./AGENTS.md) (rules for other agents).

## Project context

**Palestine House** is a global network of Palestinian cultural spaces. This site is **two shells behind one gate**:

- A **public shell** — calm, premium, editorial marketing pages whose single conversion is the green **Apply** button ("Apply to bring a House" · *Every application is reviewed by HQ.*). Public routes: `/`, `/model`, `/experience`, `/bring-ph`, `/our-support`, `/apply`, `/about`, `/contact`, `/focus-areas`, legal, auth.
- A **private partner reference platform** — approval-gated (`profiles.is_approved`). Apply = sign-up: one form creates a pending account + application; HQ approval via `/admin/approvals` unlocks the platform. Gated routes: **`/dashboard`** (the About landing), the four toolkit sections **`/setup` · `/operate` · `/program` · `/support`**, the Simple guide reader at **`/{section}/{topic}/guide`** (×22), **`/account`**, and **`/admin/*`** for HQ.

**The private model (D-PP-f), which is what the four toolkit pages render.** Four sections → four groups → **22 focus areas** (5 · 6 · 6 · 5). Each focus area shows: its **summary** (`platform_topics.description` + `intro`) → **one Simple guide card** (Read Now → the reader · Download Now → the signed-URL file) → **Watch Video** → a **templates grid** of every `resources` row carrying that topic's `element_id`. There is no Overview card, no per-topic checklist card and no watch-out card. A global **Ctrl/⌘+K search** spans focus areas, guides and templates.

**It is a reference, not a course** — no quizzes, no certificate, no daily-ops tooling. There is **no saved per-user state** beyond the partner's own account details: checklist progress was dropped at D-PP-b, and Ask HQ emails HQ rather than opening a ticket. **Proof numbers: 4 sections · 22 focus areas · 88 templates** — the same numbers on the public site and in the private platform, because PP7 reconciled them (D-PP-a → **D-PP-s**, owner-signed on the LIVE site 2026-08-20) and a copy checker now enforces them. The retired A–K vocabulary and the old band (11 focus areas · 33 topics · 200+ checklist items · 297 templates · a 120-day launch) describe content that **no longer exists** — the "200+ checklist items" claim was removed outright rather than re-homed, since checklists were dropped at D-PP-b. Numbers move only when real content is added, never invented; verify against production before quoting them.

> **History, so the archaeology is not repeated.** Before Stage 4 the gated side was a sidebar workspace at `/plan` `/build` `/food` `/programming` `/live` `/elements/[slug]` `/resources` `/academy` `/tools`, with saved checklist progress, an Academy of video modules and a members-only Live hub. All of it was deleted at **PP5 (2026-08-14)**; those paths now 307 to `/dashboard`. `/live` had moved in from the public site at LH1 and went with the rest. The tables behind the retired features were dropped afterwards: `checklist_items`, `checklist_progress` and `academy_modules` are **gone from production** (PP7's `0030`, applied 2026-08-17). **`programming_sessions` survives** — still there, RLS on, **zero policies, zero rows**, so it is default-deny to everyone. *(Verified against production 2026-08-21 at SYS1 1c; the whole legacy IA — 33 topics, 297 templates and their Storage objects — went with them.)*

GitHub is the source of truth. Vercel hosts Production and Preview. Claude Code is the primary build engine, working **one sprint at a time** from `ROADMAP.md`.

## Session start ritual (every fresh session)

1. Read `PROJECT-STATUS.md` — current stage, active sprint, open decisions.
2. Read the active sprint's scope + exit checklist in `ROADMAP.md`.
3. Inspect the repo (`package.json`, `next.config.ts`, `src/app/`) before assuming anything.
4. Work only inside the active sprint's scope. If asked for something outside it, say so and propose where it belongs in the roadmap.
5. When a sprint/phase completes, update `PROJECT-STATUS.md` **in the same branch/PR**.

## Current stack (verify before assuming)

- **Framework:** Next.js 15 (App Router) · **Language:** TypeScript strict
- **Package manager:** pnpm (pinned via `packageManager`) — use `pnpm`, never `npm` or `yarn`
- **Styling:** Tailwind CSS v4 (CSS-first tokens in `src/styles/globals.css`) + shadcn/ui
- **Animation:** Framer Motion — restrained editorial register only (see `DESIGN.md`)
- **Forms:** react-hook-form + zod
- **Auth + DB:** Supabase via `@supabase/ssr` (browser + server clients + `middleware.ts` session refresh) — this site **does** use auth/DB from Sprint 2 onward
- **Integrations (in scope, each no-ops when env vars absent):** Mailchimp (lead magnets/newsletter), Resend (contact/transactional), Upstash (rate limiting), Turnstile (public forms), PostHog/Sentry optional
- **Hosting:** Vercel · **Source control:** GitHub

If the on-disk reality disagrees with this list, **trust the code** (especially `package.json`, `next.config.ts`, and `TECH-ARCHITECTURE.md`).

## Locked content & design inputs (never invent these)

- **Copy is verbatim** from `/docs/page-copy/` (global → public → auth → workspace → admin → elements). Never rewrite, "improve," or paraphrase approved copy. Brand voice rules live in `/docs/page-copy/00-global/brand-voice.md` — they apply to any *new* string (error states, aria labels, empty states): warm, short, concrete; never charity tone, franchise hype, political slogans, or startup filler.
- **Design is from the mockups** in `/docs/page-designs/` (`public/`, `auth/`, `member-workspace/`, `admin/`, locked chrome in `shared/`) plus the bound design system in `/docs/page-designs/design-system/` (tokens: colors, fonts, typography, spacing — values recorded in `DESIGN.md`). The header and footer are **identical on every page — never redesign them per page**. Heritage green `#1A6B4A` leads; warm paper washes (`#F6F1E8` hero, `#FAF8F3` card) on a white page; muted red `#A8322D` sparingly; Spectral (display) + Inter (body).
- **Sitemap/architecture** is locked in `/docs/page-designs/content/PH_Sitemap_Architecture_TECH.txt` (summarized in `TECH-ARCHITECTURE.md` §0).
- If copy, mockup, and sitemap disagree, stop and record the conflict in `PROJECT-STATUS.md` → Open decisions; don't pick silently.

## How to behave in this project

- Make the **smallest safe change** that completes the current sprint task.
- **Preserve current behavior** unless the task explicitly changes it.
- Keep scope narrow — one focused change at a time; never bundle sprints.
- Follow the existing coding style and file organization.
- When in doubt, choose the smallest safe option and say what you chose.

## Before making changes (inspect)

1. Inspect the repository structure.
2. Confirm framework, package manager, scripts, and entry points from the repo itself.
3. Read the relevant files — and the relevant copy file(s) under `/docs/page-copy/` — before editing.

## Plan before changing

4. Summarize the intended change briefly **before editing**.
5. For anything non-trivial (auth, approval gate, RLS/schema, env handling, security headers, routing, CSP), propose a short plan first and keep it focused.

## When making changes

1. Work only on the current branch.
2. No unrelated refactors; no changes to unrelated UI, copy, routing, env vars, or structure.
3. Preserve existing routes, components, copy, layout, styling, and assets unless the task says otherwise.
4. Avoid new dependencies unless clearly necessary (see Dependency rules).
5. Never hardcode secrets, API keys, tokens, credentials, or private URLs — use env vars.

### Respect Next.js App Router conventions

- Routes live under `src/app/`. API endpoints are **Route Handlers** at `src/app/api/<name>/route.ts` — never `pages/api`.
- Use `loading.tsx` / `error.tsx` / `not-found.tsx` where they fit; per-route `metadata` or `generateMetadata`.
- **File location is not access control** — every gated route needs an explicit server-side session **and approval** check; every `/admin/*` route additionally checks the `admins` table server-side.

### Palestine House access rules (non-negotiable)

- **Approval gate everywhere:** every platform data RPC checks `is_approved` server-side — `get_platform_sections/topics`, `get_element`, `get_resources`. A pending account resolves only its profile/approval status, never a guide body, a template row or a topic summary. Each page ALSO checks approval itself before rendering, and `/dashboard` renders the pending state. Two gates, because file location is never access control.
- **The search index is the same gated reads** (D-PP-j): a pending or anonymous caller gets an empty index, and it carries no resource ids, storage paths or bucket names.
- **`/account` is session-gated only, by design** — a pending partner must be able to set their name and password while they wait. It is the one gated page with no approval check, and it exposes nothing but the caller's own `profiles` row.
- **Templates** are served from a private Storage bucket via server-issued signed URLs to approved users only. The two booklet PDFs are the only public files. The templates-grid predicate is app-level (`is_public = false` + `doc_key IS NULL` + `code IS NOT NULL`), and **the `storage_bucket` half of `SECURITY-CHECKLIST` §15 is now enforced in the database** — `0029` shipped the `resources_private_bucket_shape` CHECK (`is_public OR storage_bucket = 'resources'`), so **D-PP-i is discharged**: a private row cannot name another bucket. *(Constraint verified on production 2026-08-21 at SYS1 1c.)*
- **Public writes** (`/apply`, contact, lead magnet, newsletter): zod + rate limit + Turnstile, fail closed in Production.
- **Retired surfaces, live tables.** PP5 deleted the Academy, the Live hub and the checklist UI, but `academy_modules`, `checklist_items`, `checklist_progress` and `programming_sessions` are still in the database until PP7's `0030`. Their RLS and gating still apply — do not treat an unreachable table as an unprotected one, and do not add a new caller to any of them.

### Handle server / client boundaries correctly

- **Server Components are the default.** `"use client"` only for state, effects, browser APIs, or event handlers.
- Read server-only env vars and call provider SDKs / the server Supabase client only in Server Components, Route Handlers, Server Actions, or `instrumentation.ts`.
- Client Components may read **only** `NEXT_PUBLIC_*` env vars. Never pass a secret into a Client Component as a prop.

### Protect env vars and Supabase secrets

- Frontend uses **only** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Never put a server-only secret behind a `NEXT_PUBLIC_*` name. Never use `service_role` / `sb_secret_*` / JWT secret / DB password in frontend code.
- Server-only secrets (Supabase secret key, `MAILCHIMP_API_KEY`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `UPSTASH_REDIS_REST_TOKEN`, `SENTRY_AUTH_TOKEN`) are read server-side only.
- Never commit `.env.local`. New env var → note it (name only) for the owner to add in Vercel; don't invent values.
- Route Handlers: zod-validate inputs; don't leak stack traces or upstream error bodies.
- **Supabase MCP:** if you use the Supabase MCP to inspect or change the database, follow [`SUPABASE-MCP-SAFETY.md`](./docs/SUPABASE-MCP-SAFETY.md) (the MCP rulebook) — `supabase-test` is read/write, `supabase-prod-readonly` is read-only; never write to production through any channel.

### Database rules

- Schema changes ship versioned up-SQL **and** `.down.sql` **and** RLS policies in the PR; applied by hand via the Supabase SQL Editor, **non-production project first** (see `WORKFLOW.md` §14).
- RLS default-deny on every user-reachable table from day one. Prefer hardened `SECURITY DEFINER` RPCs (pinned `search_path`, `auth.uid()` authorization, narrow returns, revoke-then-grant) for controlled reads/writes.

### Dependency rules

- Prefer the existing stack and standard library. Add a dependency only when it clearly earns its place; explain why.
- Never switch the locked layers (framework, package manager, styling, hosting) without an explicit request.

## After making changes (commands to run)

1. `pnpm run typecheck`, `pnpm run lint`, `pnpm run build` (run `test` only if the repo defines one).
2. Fix failures you caused before reporting done; call out pre-existing failures clearly.
3. `git status` — confirm `.env.local` is not staged and no secrets are in the diff.
4. If the sprint/phase is complete: update `PROJECT-STATUS.md` and tick the sprint checklist in `ROADMAP.md` in the same branch.

## Git rules

GitHub `main` is the stable, protected, production-ready branch.

1. Start from the latest `main` → focused task branch → one focused change → local checks → clear commit → prepare for review (push only if asked) → merge only after CI + Vercel Preview pass.

**Do not push directly to `main`. Do not push at all unless the owner explicitly asks. Do not merge PRs unless explicitly asked. Do not skip Git hooks (`--no-verify`).**

Branch names: `claude/sprint-0-2-home-model`, `claude/fix-mobile-header`, `claude/sprint-4-admin-approvals`, `docs/update-status`.
Commit messages (short, imperative): `Build Experience page live strip`, `Add approval check to elements RPC`.

## Hosting note

If a change affects build output, scripts, security headers, routing, or env handling, keep `vercel.json` (once added) and `next.config.ts` consistent — and call it out. `next.config.ts` must ship security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) — added in Sprint 0.1; the CSP allow-list is extended only for the YouTube embed origin (resolved decision D1, S9 Live Programming — post-launch; roadmap reshuffled 2026-06-23).

## Local development

- Install: `pnpm install --frozen-lockfile` · Dev: `pnpm run dev` → `http://localhost:3000`
- Checks: `pnpm run typecheck`, `pnpm run lint`, `pnpm run build` · Smoke: `pnpm run start`
- Copy `.env.example` to `.env.local` for local secrets. `.env.local` is gitignored.

## Output format after each task

1. Summary of what changed. 2. Files changed. 3. Commands/checks run. 4. Results (typecheck, lint, build). 5. Risks or follow-ups. 6. Suggested commit message. 7. Sprint status (`ROADMAP.md` item + whether `PROJECT-STATUS.md` was updated).

## Clarification behavior

If the task is clear, proceed. Ask a clarification question only if the missing information would significantly change the implementation (e.g. an unresolved item in `PROJECT-STATUS.md` → Open decisions). When in doubt, choose the smallest safe change.
