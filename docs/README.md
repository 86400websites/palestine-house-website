# Palestine House — Website Build System

The operating manual for building **palestinehouse** — the public face of Palestine House and the private, approval-gated reference platform for its partners — with a disciplined, safe, AI-assisted workflow, in **stages and sprints, never all at once**.

**What we're building (one paragraph):** a thin, premium public shell (Home · The Model · Experience · Bring a House · Our Support · Live Programming, single CTA: **Apply**) in front of a private partner reference platform unlocked by HQ approval (`/apply` = sign-up → pending account → `/admin/approvals` → unlock). The platform is a trusted reference organised by stage (Plan & Prepare · Design & Build · Operate & Program) — **not a course** (no quizzes, no certificate) and not an ops tool. Proof numbers: **11 focus areas · 33 topics · 200+ checklist items · 297 templates · a 120-day launch** (updated from 10 · 30 · 267 with Focus Area 11, FA11 2026-07-18).

---

## Who this is for

- **The owner** — running the build.
- **Claude Code** — the primary engine for focused code changes (rules: `CLAUDE.md`).
- **Other coding/review agents** (e.g. Codex) — optional second-pass reviewers (rules: `AGENTS.md`).
- **Any human collaborator** who needs the rules of the road fast.

Any fresh AI session starts by reading **`PROJECT-STATUS.md`** (where we are) and **`ROADMAP.md`** (what's next), then the relevant docs below.

## The eleven core files

| # | File | What it answers |
|---|---|---|
| 1 | **`README.md`** (this file) | What the project is, how to start, what never to do. |
| 2 | **`PROJECT-STATUS.md`** | *Where we are right now.* The living tracker — current stage, sprint board, decisions, open questions. **Updated in every sprint-completing PR.** |
| 3 | **`ROADMAP.md`** | *What we build, in what order.* Full feature list + the stage/sprint plan with exit gates. |
| 4 | **`WORKFLOW.md`** | *How we work.* Sprint discipline + the branch → PR → Preview → merge loop, rollback, env safety. |
| 5 | **`TECH-ARCHITECTURE.md`** | *What we build on.* The locked stack + the Palestine House route map, data model, and blocking invariants. Source of truth when docs disagree. |
| 6 | **`SUPABASE-VERCEL-SETUP.md`** | *How to connect data + hosting safely.* Env-var matrix, Supabase clients, auth redirects, project values. |
| 7 | **`SECURITY-CHECKLIST.md`** | *What to verify before merge and launch* — including the Palestine House blocking invariants (§15). |
| 8 | **`CLAUDE.md`** | *Rules for Claude Code* in this repo. |
| 9 | **`AGENTS.md`** | *Rules for other agents* — review priorities, gating checks, what they may and may not change. |
| 10 | **`DESIGN.md`** | *How it looks and moves.* The Palestine House visual system (heritage green, warm paper, Spectral + Inter, restrained editorial motion). |
| 11 | **`SUPABASE-MCP-SAFETY.md`** | *Rules for using the Supabase MCP* — `supabase-test` is read/write, `supabase-prod-readonly` is read-only; Claude proves on test, the human ships to production. |

Plus the **`/docs` content layer** (locked inputs, never invented by agents):

```
docs/
├── page-copy/                   # approved page copy, verbatim (00-global / 01-public / 02-auth / 03-workspace / 04-admin / 06-elements; 05-review = reconciliation record)
├── page-designs/                # approved high-fidelity mockups (.html previews + .app.jsx) for all 30 pages
│   ├── public/  auth/  member-workspace/  admin/   # the pages (open index.html / WorkspaceIndex.html to browse)
│   ├── shared/                  # locked chrome + page primitives (site-chrome, workspace-chrome, admin-chrome, pages.css)
│   ├── design-system/           # the bound design system — tokens/ (colors, fonts, typography, spacing), base.css, styles.css, fonts/
│   ├── assets/art/              # final artwork the mockups reference (PH-*.png)
│   └── content/                 # flat copy snapshot the mockups read + PH_Sitemap_Architecture_TECH.txt (locked sitemap, routes, access model, data)
├── source-assets/               # masters: images/ (artwork, textures, empty-state marks) + resources/ (booklets, focus areas, 267 templates, videos → Supabase Storage in S5d/6e)
├── sprint-prompts/              # one record per completed sprint (the session memory — see its README; generated via the /sprint-prompt skill)
└── notes/                       # decisions.md (build decisions) + cleanup-before-launch.md
```

> `/docs/page-copy/` is the canonical copy source; the flat `/docs/page-designs/content/` folder is the snapshot the mockup HTML reads. If they ever disagree, `page-copy/` wins — fix the snapshot.

## Locked stack (override consciously — `TECH-ARCHITECTURE.md` is canonical)

Next.js 15 (App Router) · TypeScript strict · pnpm 10 · Tailwind CSS v4 · shadcn/ui · Framer Motion · react-hook-form + zod · Supabase (`@supabase/ssr`) · Vercel · GitHub · VS Code · Claude Code (primary engine) · Codex (optional reviewer).

In-scope integrations (each no-ops when env vars are absent; fail closed in Production): **Mailchimp** (lead magnets `lead-booklet-a` / `lead-booklet-b`, newsletter, apply tagging), **Resend** (contact + transactional), **Upstash Redis** (rate limiting), **Cloudflare Turnstile** (public forms), PostHog + Sentry (optional).

## The safe build philosophy

1. **GitHub is the source of truth.**
2. **`main` is always production.** It must stay deployable at all times.
3. **One change = one branch = one Pull Request.** One sprint at a time, per `ROADMAP.md`.
4. **Pull Requests are the review checkpoint.** Nothing reaches `main` without one.
5. **Vercel Preview is tested before merge.** Local green is necessary but not sufficient.
6. **Secrets never touch the repo.** No `.env.local`, no keys in code, no secret behind `NEXT_PUBLIC_*`. Supabase secret keys stay server-only.
7. **The approval gate is sacred.** Reference content is never public; every gated path checks `is_approved` server-side (blocking invariants: `SECURITY-CHECKLIST.md` §15).
8. **Copy and design are locked inputs.** Verbatim from `/docs/page-copy/`; designs from `/docs/page-designs/` + its `design-system/` tokens. Gaps become Open decisions in `PROJECT-STATUS.md`, never improvisation.

## Correct order to use the docs

1. `PROJECT-STATUS.md` — where are we?
2. `ROADMAP.md` — what's the active sprint and its exit gate?
3. `TECH-ARCHITECTURE.md` — stack + project architecture.
4. `DESIGN.md` — before building any screen.
5. `WORKFLOW.md` — the loop for every change.
6. `CLAUDE.md` / `AGENTS.md` — already in the repo root, configuring the agents automatically.

## New repo setup flow (Stage 0 → Stage 1, short version)

The full version with exit gates is `ROADMAP.md`. *(Steps 1–4 and the CI/Vercel parts of 7–9 are already done — pre-sprints 0a–0d; see `PROJECT-STATUS.md` §2 for exactly what remains.)*

1. Create the private GitHub repo `palestine-house`.
2. Scaffold locally on the locked stack (Next.js 15 App Router, TS strict, Tailwind v4, src dir) + shadcn/ui + Framer Motion. Supabase is added in Sprint 2/3, not at scaffold time.
3. Commit `pnpm-lock.yaml`. Never `package-lock.json` / `yarn.lock`.
4. Copy the **ten core files** + `/docs` content layer into the repo.
5. Port the `/docs/page-designs/design-system/tokens/` into `src/styles/globals.css`; build the locked chrome; then the public pages, sprint by sprint (Stage 0).
6. Confirm `.env.local` is gitignored; create it with `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
7. Push to `main`, import into **Vercel** (`nextjs` preset), add env vars per environment (`SUPABASE-VERCEL-SETUP.md`).
8. Add CI (install + typecheck + lint + build + gitleaks) as a **required** check; turn on branch protection for `main`.
9. Deploy, verify the live public site (Stage 1), then run every later sprint through branch + PR + Preview.

## What not to do

- ❌ Don't commit `.env.local` or any secret. Don't put a secret behind `NEXT_PUBLIC_*` or use a Supabase secret key in browser code.
- ❌ Don't commit directly to `main`, force-push, or merge without green CI **and** a tested Preview.
- ❌ Don't bundle sprints or unrelated changes into one branch.
- ❌ Don't expose gated content publicly, add a second signup path beside `/apply`, or add quizzes/certificates — the model is locked.
- ❌ Don't rewrite approved copy, redesign the locked header/footer, or invent proof numbers (**11 · 33 · 200+ · 297 · 120-day launch** — updated from 10 · 30 · 267 with Focus Area 11, FA11 2026-07-18).
- ❌ Don't add dependencies you don't need, or make unrelated refactors.
- ❌ Don't skip Git hooks or CI (`--no-verify`) without an explicit, recorded reason.

## Project values

| Placeholder | Value |
|---|---|
| `[PROJECT_NAME]` | `palestine-house` |
| `[BRAND_NAME]` | Palestine House |
| `[PRODUCTION_DOMAIN]` | **TBD** before Stage 1 (Vercel default domain until then) |
| `[VERCEL_TEAM_SLUG]` / `[SUPABASE_PROJECT_REF]`s | **TBD** — recorded in `SUPABASE-VERCEL-SETUP.md` + `PROJECT-STATUS.md` when created |

Open decisions live in `PROJECT-STATUS.md` §5 — resolve them there, once, and they propagate. (Video host → YouTube, domain → Vercel for launch, and contact/legal email → added later were resolved 2026-06-11; only RSVP-at-MVP remains open.)
