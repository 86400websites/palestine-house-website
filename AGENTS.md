# Palestine House Website — Agent Instructions

> Governs **non-primary agents** in the `palestine-house` repo — code-review agents (e.g. Codex), automation, and any tool other than the main Claude Code engine. The primary engine's rules live in [`CLAUDE.md`](./CLAUDE.md). Stack + project architecture: [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md). Process: [`WORKFLOW.md`](./WORKFLOW.md). Sprint plan: [`ROADMAP.md`](./ROADMAP.md). Current state: [`PROJECT-STATUS.md`](./PROJECT-STATUS.md).

## Project assumptions

- This repository is the **Palestine House** website on the locked Next.js 15 stack in `TECH-ARCHITECTURE.md`.
- **Two shells, one gate:** a public marketing shell (single CTA: Apply) and a private, approval-gated partner reference platform. Apply = sign-up (one form → pending account → HQ approval via `profiles.is_approved` → unlock). Admin approval queue at `/admin/approvals` is server-checked via an `admins` table.
- It is a **reference, not a course** — no quizzes, no certificate. The only per-user interactivity is saved checklist progress in `/build`.
- Copy is **verbatim** from `/docs/page-copy/`; design follows `/docs/page-designs/` + the design tokens in `/docs/page-designs/design-system/`; the header/footer are locked and identical on every page. Proof numbers are fixed: **10 · 30 · 200+ · 267 · 3**.
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
6. **Content fidelity** — copy matches `/docs/page-copy/`; proof numbers correct; no invented strings on approved pages.
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

- [ ] 🔴 Every gated route has an explicit **server-side session + `is_approved`** check; `/admin/*` additionally checks the `admins` table server-side
- [ ] 🔴 Workspace RPCs enforce `is_approved` server-side; pending sessions can resolve only profile/approval status
- [ ] 🔴 Public projections expose titles/overviews/session metadata only — never gated bodies, checklist data, templates, or Academy content
- [ ] 🔴 Template/resource downloads go through server-issued **signed URLs** from a private bucket, to approved users only
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
- [ ] `programming_sessions`: public read anon-safe; writes owner-scoped to approved partners
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
2. Read relevant files (and the relevant `/docs/page-copy/` page if copy is involved); explain the planned change briefly; keep scope narrow.
3. Make the smallest safe change; follow existing style.
4. Run `pnpm run typecheck`, `pnpm run lint`, `pnpm run build`. Fix failures you caused; flag pre-existing ones.
5. `git status`; confirm `.env.local` is not staged and no secrets are in the diff.
6. Use a focused branch (e.g. `codex/fix-mobile-header`, `codex/harden-apply-route`). One agent per branch at a time.
7. Do not push, merge, or commit to `main` unless explicitly instructed.

## How to report findings

For each finding: **Severity** (Critical/High/Medium/Low) · **Location** (`path/file.ts:line` + route) · **Issue** · **Why it matters** · **Suggested fix** · **Confidence**.

End an edit task with: summary, files changed, checks run + results, risks/follow-ups, suggested PR title + description. End a review task with the prioritized findings list and a clear merge recommendation (approve / request changes / blocking issues — any §"gating checks" failure is blocking).
