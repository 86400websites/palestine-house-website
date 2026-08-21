# Palestine House

The website for **Palestine House**, a global network of Palestinian cultural spaces.

It is **two shells behind one gate**. The **public shell** is a calm, editorial marketing site
(Home · The Model · Experience · Bring a House · Our Support · About · Contact · Focus Areas) whose
single conversion is the green **Apply** button. The **private shell** is an approval-gated partner
reference platform: applying creates a pending account, HQ approves it, and the partner unlocks four
toolkit sections (Setup · Operate · Program · Support) with their focus areas, guides and templates.
It is a **reference, not a course** — no quizzes, no certificate, no daily-ops tooling, and no saved
per-user state beyond the partner's own account details.

Production deploys from `main` to the Vercel production URL recorded in
[`docs/PROJECT-STATUS.md`](./docs/PROJECT-STATUS.md) §1 and §6. A custom domain exists, but the
relaunch/SEO re-verification is still parked in [`docs/ROADMAP.md`](./docs/ROADMAP.md) §A — read
`PROJECT-STATUS.md` for what is actually serving today.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript, strict |
| Package manager | pnpm (pinned via `packageManager` in `package.json`) |
| Styling | Tailwind CSS v4 (CSS-first tokens) + shadcn/ui |
| Animation | Framer Motion |
| Forms | react-hook-form + zod |
| Auth + database | Supabase via `@supabase/ssr` |
| Hosting | Vercel |
| Source control | GitHub |

Integrations follow one rule: each **no-ops cleanly when its env vars are absent**. **Mailchimp** and
**Resend** are wired that way — per-provider state in [`docs/PROJECT-STATUS.md`](./docs/PROJECT-STATUS.md)
§6. **Upstash rate limiting** and **Cloudflare Turnstile** are **not wired yet**: the public writes are
currently unthrottled (`PROJECT-STATUS.md` §7 #1) and hardening them is sprint **SYS1.5**
([`docs/ROADMAP.md`](./docs/ROADMAP.md) Stage 5, decision D-SYS-9). **Sentry** is not wired either —
error tracking arrives in **SYS3**.

Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
Permissions-Policy) ship from `next.config.ts`.

Full detail — locked layers, route map, data model, blocking invariants — is in
[`docs/TECH-ARCHITECTURE.md`](./docs/TECH-ARCHITECTURE.md). **If the code and the docs disagree,
trust the code and report the mismatch.**

## Local development

```bash
pnpm install --frozen-lockfile
pnpm run dev            # http://localhost:3000
```

Checks — all of these must pass before a change is reported ready:

```bash
pnpm run typecheck      # tsc --noEmit
pnpm run lint           # eslint .
pnpm run build          # next build
pnpm run start          # production smoke test, after a build
```

There is **no `test` script yet**. A Playwright end-to-end suite arrives in sprint SYS2; until then
verification is the checks above plus manual/Preview testing.

CI runs the same typecheck, lint and build. The workflow is `.github/workflows/ci.yml` (name **CI**,
job **verify**) on Node 22, and it additionally runs a **gitleaks** secret scan over the full PR
history.

## Environment variables

- Copy `.env.example` to `.env.local`. `.env.example` carries **names and safe placeholders only**.
- `.env.local` is gitignored. Never open, print, copy, commit, or paste real values into any tracked
  file.
- The frontend uses **only** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  (browser + server clients). The middleware session refresh **passes the request through untouched**
  when those two are absent, so the marketing pages work without Supabase configured; `/apply`, the
  auth routes and everything gated need them.
- `SUPABASE_SECRET_KEY` is a **reserved name only** — nothing in `src/` reads it, and nothing should
  without a recorded decision ([`docs/ENV-VARS-SAFETY.md`](./docs/ENV-VARS-SAFETY.md)).
- Deployed values live in Vercel's environment settings, scoped per environment. Changing one
  requires a redeploy.
- Never put a server-only secret behind a `NEXT_PUBLIC_*` name. Full rules:
  [`docs/ENV-VARS-SAFETY.md`](./docs/ENV-VARS-SAFETY.md).

## Project docs

| File | What it answers |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | How the primary AI build engine behaves in this repo. |
| [`AGENTS.md`](./AGENTS.md) | How a second-pass reviewer agent behaves in this repo. |
| [`docs/README.md`](./docs/README.md) | The internal docs-pack operating manual — start here for the full map. |
| [`docs/PROJECT-STATUS.md`](./docs/PROJECT-STATUS.md) | Where the build is right now. Read first in any fresh session. |
| [`docs/ROADMAP.md`](./docs/ROADMAP.md) | What we build, in what order, with what exit gates. |
| [`docs/WORKFLOW.md`](./docs/WORKFLOW.md) | How a change gets from a branch to production safely. |
| [`docs/TECH-ARCHITECTURE.md`](./docs/TECH-ARCHITECTURE.md) | The locked stack and its invariants. |
| [`docs/DESIGN.md`](./docs/DESIGN.md) | Design tokens and locked visual rules. |
| [`docs/SECURITY-CHECKLIST.md`](./docs/SECURITY-CHECKLIST.md) | The security checks that gate every merge (§15 = blocking invariants). |
| [`docs/TECHNICAL-INTEGRITY.md`](./docs/TECHNICAL-INTEGRITY.md) | The integrity rules the build is held to. |
| [`docs/QA-CHECKLIST.md`](./docs/QA-CHECKLIST.md) | What gets tested before a release. |
| [`docs/ENV-VARS-SAFETY.md`](./docs/ENV-VARS-SAFETY.md) | Public vs server-only env vars; redeploy-after-change. |
| [`docs/ROLLBACK.md`](./docs/ROLLBACK.md) · [`docs/ROLLBACK-RUNBOOK.md`](./docs/ROLLBACK-RUNBOOK.md) | Production broke — what now. |
| [`docs/BROWSER-TOOLS.md`](./docs/BROWSER-TOOLS.md) | Driving the site in a real browser for verification. |
| [`docs/SUPABASE-MCP-SAFETY.md`](./docs/SUPABASE-MCP-SAFETY.md) | Rules for the Supabase MCP: test is read/write, production is read-only. |
| [`docs/sprint-prompts/`](./docs/sprint-prompts/) · [`docs/code-reviews/`](./docs/code-reviews/) | Per-sprint records and independent review verdicts. |
| [`docs/LAUNCH-CHECKLIST.md`](./docs/LAUNCH-CHECKLIST.md) | The launch gate — retro-filled, since this site launched 2026-06-19. Now the standing gate for the parked domain relaunch. |
| [`docs/HANDOFF.md`](./docs/HANDOFF.md) | Every account the site depends on, and who must own it at handover. |
| `docs/templates/` | Per-PR and per-sprint skeletons. *Arriving later in the current sprint (SYS1).* |
| `docs/FEATURE-LIST.md` · `tests/e2e/` | *Arriving in SYS2 (testing launch gate).* |
| `docs/INCIDENT-LOG.md` · `docs/error-tracking/` | *Arriving in SYS3 (error tracking).* |

The approved copy and design inputs (`docs/page-copy/`, `docs/page-designs/`, `docs/source-assets/`)
are deliberately **kept out of this repository** — see `.gitignore`. They are supplied locally by the
owner and implemented verbatim; agents never invent them.

## Delivery rules

`main` is protected, stable, and always production-ready. Every change follows:

**branch → implementation → local checks → PR → deployed Vercel Preview → review → owner merges →
production smoke test**

- One focused change per branch, cut from the latest `main`. One sprint at a time.
- Never push to `main`, never force-push, never skip Git hooks.
- **The owner merges.** Claude Code and other agents do not merge PRs.
- Local green is necessary but not sufficient — the Preview must be tested before merging.
- **Independent review is mandatory** for risky changes — auth, the approval gate, RLS or schema, env
  handling, security headers, CSP (decision D-SYS-1). The review runs over an immutable
  `merge-base..head` SHA range, its record is saved in `docs/code-reviews/`, and **nothing merges
  over a Blocking finding.** Trivial PRs are exempt.
- Database changes ship versioned up-SQL **and** a `.down.sql` **and** RLS policies in the same PR,
  and are applied **by hand in the Supabase SQL Editor, non-production project first**
  ([`docs/WORKFLOW.md`](./docs/WORKFLOW.md) §14).

Full process with per-stage checklists: [`docs/WORKFLOW.md`](./docs/WORKFLOW.md).

## Deploy and rollback

Vercel builds every PR into an isolated Preview and deploys Production only from `main`.

Emergency rollback: **Vercel → Deployments → previous good deployment → Promote to Production**, then
still correct `main` through the normal workflow. A host rollback reverts code only — it does not
restore database data; that needs the migration's `.down.sql`. See
[`docs/ROLLBACK.md`](./docs/ROLLBACK.md).
