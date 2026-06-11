# Workflow Guide — Palestine House

> **Project: Palestine House** (`palestine-house`). This is the generic workflow with the Palestine House sprint discipline layered on top. Read it with [`ROADMAP.md`](./ROADMAP.md) (what we build, in order) and [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) (where we are right now).

## 0. Palestine House sprint discipline

This project is built in **stages and sprints — never all at once**:

1. **One sprint at a time.** Pick the next sprint from `ROADMAP.md`. Do not start a sprint while a previous one is unmerged.
2. **One sprint = one (or a few) focused branches/PRs.** Big sprints are split into the phases listed in `ROADMAP.md`; each phase is its own branch → PR → Preview → merge loop.
3. **Update `PROJECT-STATUS.md` in the same PR** that completes a sprint or phase (status, date, notes, any new decisions). The status file is how any fresh AI session (Claude Code, Codex, etc.) knows where to continue.
4. **Sprint exit gate:** typecheck + lint + build green, CI green, Vercel Preview tested desktop + mobile, the sprint's checklist in `ROADMAP.md` ticked, relevant `SECURITY-CHECKLIST.md` sections passed, copy verbatim from `/docs/final-copy`, and proof numbers correct (**10 · 30 · 200+ · 267 · 3**, never a certificate).
5. **Copy and design are locked inputs.** Page copy comes verbatim from `/docs/final-copy/`; layout/design comes from `/docs/mockups/` (+ the `_ds/` design-system tokens). Don't invent copy or redesign the locked header/footer — flag gaps in `PROJECT-STATUS.md` → Open decisions instead.
6. **Database changes follow §14 strictly** — versioned up + `.down.sql` + RLS in the PR, tested on the non-production Supabase project first, expand → migrate → contract.

---

A simple, repeatable workflow for any website built on this system:
**GitHub + VS Code + Claude Code + Codex (optional reviewer) + Vercel + Supabase.**

> **Golden rule:** `main` is always production. Never edit `main` directly. One change = one branch = one Pull Request.

This system runs on the locked Next.js 15 stack in [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md). Local dev uses **pnpm** and Next.js — not npm or Vite.

> **Migration guard.** If you see `npm`, `VITE_*`, `localhost:5000`, `dist/`, React Router, or Replit in older notes, that is historical context, not current practice. The current defaults are **pnpm**, **Next.js App Router** (routes under `src/app/`, APIs under `src/app/api/`), and **Vercel** (Preview + Production). Trust the repo (`package.json`, `next.config.ts`, `src/app/`) over any stale note.

---

## 1. Core mental model

- **VS Code / Claude Code** — where you edit code locally.
- **GitHub** — source of truth. Holds all code and history.
- **Branch** — your safe work area. Changes here do not affect the live site.
- **Pull Request (PR)** — the review checkpoint before code reaches `main`.
- **Vercel Preview** — a temporary, real test site for each branch / PR.
- **Vercel Production** — the live site. Updates automatically when `main` changes.
- **Supabase** — auth and database (only if the site needs accounts/data).
- **Environment variables** — private connection values, kept out of code.

---

## 2. GitHub & source-of-truth rules

- GitHub is the single source of truth. If it isn't pushed, it doesn't exist.
- All history flows through PRs into `main`. No out-of-band edits.
- Never store secrets in the repo. Secrets live in `.env.local` (local) and Vercel env vars (deployed) — never in committed files.
- Commit `pnpm-lock.yaml`. Never commit `package-lock.json` or `yarn.lock`.

---

## 3. `main` branch rules

`main` is the stable, protected, production-ready branch.

- Never commit directly to `main`. Never force-push or rewrite `main` history (except a coordinated emergency).
- Set **branch protection** once per repo: require a PR before merge, require CI green, require a successful Preview deployment, block direct pushes and force-pushes.
- A change only reaches `main` after: local checks pass → CI green → Preview tested → (optional) review done.

---

## 4. Branch naming

One focused branch per change. Use a short, descriptive, kebab-case name with a type prefix:

- `feature/<short-name>` — new functionality
- `fix/<short-name>` — bug fix
- `claude/<short-name>` — change driven by Claude Code
- `codex/<short-name>` — change driven by another agent
- `docs/<short-name>` — documentation only

Examples: `feature/contact-form`, `fix/mobile-header`, `claude/update-hero-copy`, `docs/align-workflow`.

Never let two agents (or people) work on the same branch at the same time.

---

## 5. Local setup commands

First-time repo setup lives in [`README.md`](./README.md) (new website setup flow). Day-to-day:

```bash
pnpm install --frozen-lockfile   # install exact locked deps
pnpm run dev                      # local dev server → http://localhost:3000
pnpm run typecheck                # tsc --noEmit
pnpm run lint                     # eslint
pnpm run build                    # production build into .next/
pnpm run start                    # serve the production build locally (smoke test)
```

Copy `.env.example` to `.env.local` and fill in only the values you need. `.env.local` is gitignored and must never be committed.

```bash
cp .env.example .env.local
```

---

## 6. Normal feature / fix workflow

One focused change at a time, top to bottom:

- [ ] Switch to `main` — `git checkout main`
- [ ] Get the latest — `git pull origin main`
- [ ] Create a branch — `git checkout -b feature/short-name`
- [ ] Make **one focused change** (use the Claude Code workflow in §7)
- [ ] Install deps if they changed — `pnpm install --frozen-lockfile`
- [ ] Test locally — `pnpm run dev`, open `http://localhost:3000`, click through what changed
- [ ] Run the local test checklist (§9)
- [ ] Confirm `.env.local` is **not** staged — `git status` should show it untracked/ignored
- [ ] Stage specific files (avoid blanket `git add -A` if there's any risk of catching secrets) and commit — `git commit -m "Short clear message"`
- [ ] Push the branch — `git push -u origin feature/short-name`
- [ ] Open a PR on GitHub (base = `main`) and complete the PR checklist (§10)
- [ ] Wait for CI to pass
- [ ] Open the Vercel **Preview** URL from the PR and run the Preview checklist (§11)
- [ ] (Optional) Ask Codex / a review agent to review the PR (§8)
- [ ] Merge the PR and run the production merge checklist (§12)

---

## 7. Claude Code implementation workflow

Reuse this prompt for every feature. Paste it, then add your task at the bottom. (Project-specific rules also live in [`CLAUDE.md`](./CLAUDE.md), which Claude Code reads automatically.)

```
You are my senior engineer for this project.

Stack reminder:
- Next.js 15 App Router, TypeScript strict, pnpm, Tailwind v4, shadcn/ui, Framer Motion.
- Supabase via @supabase/ssr (browser + server clients + middleware session refresh) — if this site uses auth/DB.
- Optional integrations expose server-only Route Handlers (e.g. /api/newsletter, /api/contact).
- Hosting: Vercel. Source of truth: GitHub main.

Before editing:
- Inspect the repository structure first.
- Confirm the framework, scripts, and entry points from the repo (package.json, next.config.ts, src/app/).
- Read the relevant files.
- Propose a short plan before making any changes.

While editing:
- Make the smallest safe change that solves the task.
- Preserve existing routes, copy, layout, styling, and assets unless I ask.
- Do not add new dependencies unless necessary.
- Do not hardcode secrets, API keys, tokens, or connection strings.
- Never commit .env.local.
- In frontend code use only public env vars (NEXT_PUBLIC_*), e.g. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
- Never use Supabase service_role / sb_secret / JWT secret / database password in frontend code.
- Server-only secrets must only be read in Server Components, Route Handlers, Server Actions, or instrumentation.ts.

After editing:
- Run pnpm run typecheck, pnpm run lint, pnpm run build.
- Run git status and confirm no secrets are staged.

At the end, report:
1. Files changed
2. Commands run
3. Check results (typecheck, lint, build)
4. Risks or follow-ups
5. Suggested commit message

Do not push unless I explicitly ask.

Task:
<describe the one focused change here>
```

---

## 8. Optional Codex / agent review workflow

A second pass from a review agent (Codex or similar) is optional but valuable on risky changes (auth, payments, data, security headers, env handling).

- Run it **on the PR / branch diff**, not the whole repo.
- Ask for **serious issues only** — correctness, security, data safety, App Router boundary mistakes, leaked secrets — not style nits.
- The agent reports findings; it does **not** merge, push, or make broad refactors. See [`AGENTS.md`](./AGENTS.md) for the full agent rules.
- You decide which findings to act on, then loop back through §7 if fixes are needed.

---

## 9. Local test checklist

Before pushing:

- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run lint` passes
- [ ] `pnpm run build` passes
- [ ] Dev server tested for the change at `http://localhost:3000` (desktop + mobile widths)
- [ ] No new console errors or hydration warnings introduced
- [ ] `git status` shows `.env.local` untracked and no secrets staged

---

## 10. PR checklist

When opening the Pull Request:

- [ ] Base branch is `main`; the branch is one focused change
- [ ] Title and description explain *what* changed and *why*
- [ ] If env vars were added/changed, they're listed in the PR (names only, never values) and added in Vercel
- [ ] If the DB schema changed, the SQL **and** RLS policies are in the PR description (not yet applied to production)
- [ ] CI is green (install, typecheck, lint, build, secret scan)
- [ ] No secrets, keys, tokens, or `.env.local` in the diff

---

## 11. Vercel Preview checklist

Every PR gets a Preview deployment. Local green is necessary but **not sufficient** — always test Preview.

- [ ] Open the Preview URL from the PR
- [ ] Verify the actual change on desktop **and** mobile
- [ ] Check pages/routes the change could have affected (don't assume isolation)
- [ ] If auth is involved: sign in / sign out / signup / password reset all work, and email links resolve to the **Preview** origin (not Production)
- [ ] If a form/integration is involved: submit it and confirm the server route behaves (or no-ops cleanly when its env vars are absent)
- [ ] No obvious layout shift, broken images, or runtime errors

> Adding or changing an env var requires a **redeploy** to take effect. `NEXT_PUBLIC_*` values are inlined at build time; server-only values are read at runtime per deployment.

---

## 12. Production merge checklist

After Preview passes and review (if any) is done:

- [ ] Merge the PR on GitHub
- [ ] Watch the Vercel **Production** deployment finish
- [ ] Test the live site for the merged change (desktop + mobile)
- [ ] Delete the merged branch
- [ ] If something looks wrong on production, go to §13 immediately

---

## 13. Rollback process

If production is broken, pick the right tool:

- **Safest GitHub rollback** — revert the merged PR.
  - On GitHub: open the merged PR → **Revert** → merge the revert PR.
  - Or locally: `git revert <commit-sha>` → push → merge.
- **Emergency live rollback** — on Vercel: **Deployments → previous good deployment → Promote to Production**. This restores the live site immediately.
- **After a Vercel rollback**, still fix `main` on GitHub. Otherwise the next deploy reintroduces the bad code.
- **A Vercel rollback restores code, not the database.** If the bad deploy shipped a schema/RLS change, decide explicitly whether to keep it (only if backwards-compatible) or apply its `.down.sql` — see the database change protocol in §14.
- **Never** force-push or rewrite `main` history unless absolutely necessary and coordinated.

---

## 14. Supabase & environment-variable safety

Use this whenever a change touches auth, the database, or any env var. For the full env-var matrix, Supabase client setup, and auth redirect URLs, see [`SUPABASE-VERCEL-SETUP.md`](./SUPABASE-VERCEL-SETUP.md); for the pre-merge/launch security gate, see [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md).

**Env-var rules**

- `NEXT_PUBLIC_*` values are bundled into client JavaScript and are **public**. Anything sensitive must **not** have this prefix.
- Server-only secrets (e.g. Supabase secret key, `MAILCHIMP_API_KEY`, `RESEND_API_KEY`, `SENTRY_AUTH_TOKEN`, `TURNSTILE_SECRET_KEY`, `UPSTASH_REDIS_REST_TOKEN`) may only be read in Server Components, Route Handlers, Server Actions, or `instrumentation.ts`.
- Commit `.env.example` only. `.env.local` stays gitignored.
- New env var → add it in **Vercel → Settings → Environment Variables** for Production, Preview, and Development with **the same names but environment-specific values** (never copy the Production `NEXT_PUBLIC_SITE_URL` or production Supabase credentials into Preview), then **redeploy**.

**Supabase rules**

- In the frontend, use only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — never `service_role` / `sb_secret_*` / JWT secret / database password.
- The secret key bypasses Row Level Security; use it only in trusted server contexts (admin ops, cron, webhooks), and refresh the threat model before shipping such a path.
- Use a **separate Supabase project (or isolated branch/schema) for non-production** — Production, Preview, and Development must not share one database, or Preview testing will mutate production data.
- Enable **Row Level Security on every table from day one**, default-deny, then add policies. Prefer `SECURITY DEFINER` RPCs for controlled reads/writes over broad table policies, and **harden** each one (pinned `search_path`, `auth.uid()` authorization, narrow returns, `revoke execute from public` then grant to the intended role).
- **Database change protocol** — schema/RLS is applied by hand via the Supabase **SQL Editor**, in order (no CLI migrations):
  - [ ] Write versioned up-SQL **and** a matching `.down.sql`, plus RLS policies, in the PR.
  - [ ] Apply to a **non-production** Supabase project and test there before the Preview test.
  - [ ] Keep changes **backwards-compatible / additive** so the current code works before and after (expand → migrate → contract); deploy schema before the code that depends on it.
  - [ ] Apply to Production at the right time relative to the merge; verify RLS with anon + signed-in checks.
  - [ ] Remember a **Vercel rollback does not roll back the database** — keep the (backwards-compatible) schema or apply the `.down.sql` deliberately. Prefer forward-fix.
- Keep **Auth → URL Configuration** correct: Site URL = Production, plus Redirect URLs covering local, the Preview wildcard, and Production. Do **not** point Preview auth redirects at Production — signup/reset emails created on a Preview should return to the Preview origin.
- Test auth flows (sign in, sign up, forgot/update password, protected route) on **local, Preview, and Production**.

---

## 15. Never do this

- [ ] Never commit `.env.local`, secret keys, tokens, or connection strings
- [ ] Never expose Supabase `service_role` / `sb_secret` / JWT secret / database password in frontend code
- [ ] Never put a server-only secret behind a `NEXT_PUBLIC_*` name
- [ ] Never edit production directly (no commits straight to `main`)
- [ ] Never merge a PR without a green CI run **and** a tested Vercel Preview
- [ ] Never bundle unrelated changes into one branch
- [ ] Never rely only on local testing — Preview must pass too
- [ ] Never add dependencies you don't need, or make unrelated refactors
- [ ] Never skip Git hooks or CI checks (`--no-verify`) without an explicit, recorded reason

---

## 16. Commands cheat sheet

```bash
# Sync with main
git checkout main
git pull origin main

# Start a new change
git checkout -b feature/short-name

# Check what changed
git status

# Install / dev / checks
pnpm install --frozen-lockfile
pnpm run dev          # http://localhost:3000
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run start        # serve the production build locally

# Commit and push
git commit -m "Short clear message"
git push -u origin feature/short-name

# Roll back a bad commit
git revert <commit-sha>
```

---

## 17. Definition of done

A change is "done" only when **all** boxes are ticked:

- [ ] Local `pnpm run typecheck` passes
- [ ] Local `pnpm run lint` passes
- [ ] Local `pnpm run build` passes
- [ ] Dev server tested for the change at `http://localhost:3000`
- [ ] PR created on GitHub (one focused change)
- [ ] CI green (typecheck, lint, build, secret scan)
- [ ] Vercel Preview deployment tested (desktop + mobile)
- [ ] No secrets committed (`.env.local` untracked, no keys in code)
- [ ] (Optional) Review agent pass complete
- [ ] PR merged into `main`
- [ ] Live production site tested after deploy
