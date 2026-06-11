# Palestine House — Roadmap (Features & Sprints)

> **What we build, in what order.** This is the master plan: the full feature list, then the stage/sprint sequence with scope, dependencies, and exit gates. Run **one sprint at a time**; big sprints are split into lettered phases, each its own branch → PR → Preview → merge loop (`WORKFLOW.md`). Where we currently stand lives in [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) — update it in the same PR that completes a sprint or phase. Architecture detail: [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md) §0 and `/docs/page-designs/content/PH_Sitemap_Architecture_TECH.txt`.

---

## A. Full feature list (MVP scope)

### Public shell
- [ ] Locked site chrome — header (logo → Home + four nav labels with tooltip one-liners + Sign in + green **Apply** CTA), footer (link columns, lead-magnet block, legal, tagline), mobile Sheet menu
- [ ] `/` Home (full "Bring Palestine House to Your City" section)
- [ ] `/model` The Model
- [ ] `/experience` Experience — the decision page (hero artwork, day/night section, five programming threads, **live strip** from `programming_sessions`, closing CTA, lead magnet)
- [ ] `/bring-ph` Bring a House (absorbs How It Works: stage triptych + Day 30/60/108 gates timeline, "who brings what," three rules)
- [ ] `/our-support` Our Support
- [ ] `/live` Live Programming — public listing (Upcoming / Live now / Past; in-person, livestream, recorded) + watch view  **[public hero feature]**
- [ ] `/apply` — single merged form: apply **=** sign-up → pending account + application record (zod + rate limit + Turnstile)
- [ ] `/about`, `/contact` (contact form via Resend), `/focus-areas` (secondary route, linked from page bodies), `/privacy`, `/terms`
- [ ] Lead magnets: the two public booklets (*The House Promise*, *Operating Model & Governance*) — capture via Mailchimp tags `lead-booklet-a` / `lead-booklet-b`
- [ ] SEO: per-route metadata, `sitemap.ts`, `robots.ts`, OG image, JSON-LD (Organization, WebSite)

### Auth & access
- [ ] `/login`, `/forgot-password`, `/update-password` (no separate signup — retired, merged into Apply)
- [ ] Supabase `@supabase/ssr` browser + server clients, `middleware.ts` session refresh, same-origin validated redirects
- [ ] Approval gate: `profiles.is_approved`, pending-state dashboard, server-side enforcement in every workspace RPC
- [ ] `/admin/approvals` — HQ approval queue (server-checked `admins` table)  **[MVP-critical]**

### Partner platform (gated)
- [ ] Gated shell: persistent left sidebar + pending/locked state
- [ ] `/dashboard` Welcome as a Partner (orientation by stage; "current stage" snapshot — Design & Build % hidden until Build starts)
- [ ] `/plan` Plan & Prepare (reference) · `/operate` Operate & Program / Managing & Operating (one page, two entry points)
- [ ] `/build` Design & Build — launch checklist: 200+ items, 3 gates, **saved per-user progress** (the only per-user interactivity)
- [ ] `/elements/[slug]` — tabbed canonical element page component × 30 (A1–J3), MDX bodies
- [ ] `/resources` + `/resources/[category]` — guides, 267 templates, tools; private Storage bucket + server-issued signed URLs
- [ ] `/academy` + `/academy/[slug]` — optional video reference library (no progress, no quizzes, no certificate)
- [ ] `/live` partner tools — create/schedule sessions, attach stream, go live, host recordings → populate the public listing
- [ ] `/tools` House Applications — coming-soon placeholder
- [ ] `/account`, `/support`

### Platform plumbing
- [ ] Database: `profiles`, `applications`, `admins`, `elements`, `checklist_items`, `checklist_progress`, `programming_sessions`, `resources`, `academy_modules` — RLS default-deny, hardened `SECURITY DEFINER` RPCs, anon-safe public projections
- [ ] Email: Mailchimp (lead magnets, newsletter, apply tagging) + Resend (contact, transactional/approval notifications), verified sending domain
- [ ] Hardening: Upstash rate limiting, Turnstile, security headers + CSP (embed origin only), fail-closed production forms
- [ ] CI (typecheck, lint, build, gitleaks) + branch protection + Vercel Preview/Production

### Post-MVP backlog (do not build during MVP)
`/search` (V1) · `/admin/content` (V1 — MVP content admin via Supabase dashboard) · `/admin/partner-interest` (later) · functional House Applications tools · additional languages · RSVP for in-person events (MVP is listing-only, pending confirmation).

---

## B. Stages & sprints

### Stage 0 — Foundational build (local · public shell only · no Supabase)

Goal: a complete, polished, working public website running locally. All forms render but **no-op cleanly** (no env vars yet). Live Programming renders its designed empty/fallback states.

| Sprint | Scope | Notes |
|---|---|---|
| **0.1 Foundation** | Scaffold (Next.js 15, TS strict, pnpm, Tailwind v4, shadcn/ui, Framer Motion); copy the 10 core docs + `/docs` content layer in; port `/docs/page-designs/design-system/tokens/` + `shared/pages.css` primitives into `globals.css`; `next/font` Spectral + Inter; motion primitives; security headers in `next.config.ts`; locked chrome (header + Tooltip nav + footer + mobile Sheet); 404/error pages | Scaffold + repo + CI + Vercel Preview pre-completed (pre-sprints 0a–0d, PRs #1–#2); design system is in-repo |
| **0.2 Home + Model** | `/` and `/model` from `/docs/page-designs/` + `/docs/page-copy/`, with final artwork from `/docs/page-designs/assets/art/` | |
| **0.3 New marketing pages** | `/experience` (live strip in empty/fallback state), `/bring-ph` (triptych + gates timeline), `/our-support` | Densest pages — pace per `DESIGN.md` §12 |
| **0.4 Live + supporting pages** | `/live` public listing + watch view (static empty states), `/focus-areas`, `/about`, `/contact` (form UI, no-op) | |
| **0.5 Apply + auth UI + legal + SEO** | `/apply` form UI (no-op submit with honest "not yet live" handling), `/login` `/forgot-password` `/update-password` UI shells, `/privacy` `/terms`, metadata + sitemap + robots + OG | |

**Stage 0 exit gate:** typecheck/lint/build green · every public page matches its mockup at 320px → desktop · copy verbatim · proof numbers correct (10 · 30 · 200+ · 267 · 3) · reduced-motion respected · no console errors · headers/footer identical everywhere.

### Stage 1 — Connect & launch the barebones site

| Step | Scope |
|---|---|
| **1.1 GitHub** | Push repo; branch protection on `main`; CI (install, typecheck, lint, build, gitleaks) as required check; secret scanning + Dependabot on — *repo + base CI already live since pre-sprint 0c; remaining: gitleaks step, branch protection, secret scanning, Dependabot* |
| **1.2 Vercel** | Import (`nextjs` preset); env vars per environment (`SUPABASE-VERCEL-SETUP.md`); Production deploy of the public site (Vercel domain per resolved decision D3; custom domain later) — *project already connected with Preview verified (PR #2); remaining: env vars + first Production deploy* |
| **1.3 Supabase projects** | Create **production + non-production** projects (no schema yet); Auth → URL Configuration (Site URL, local + Preview wildcard + Production redirects); record refs in `SUPABASE-VERCEL-SETUP.md` + `PROJECT-STATUS.md` |

**Stage 1 exit gate:** live public site verified desktop + mobile · CI required + branch protection active · Preview deployments working · env matrix recorded.

> From here on: **every sprint = branch → PR → CI → Preview → merge**, status updated in the same PR.

### Stage 2 — Sprints (run in order)

| Sprint | Phases | Scope & exit gate | Depends on |
|---|---|---|---|
| **S1 — Design consistency pass** | 1a tokens/type audit · 1b motion + reduced-motion · 1c responsive 320px+ audit · 1d accessibility AA (contrast, focus, skip link, keyboard tooltip) | Whole public shell consistent with `DESIGN.md`; AA verified; zero visual drift between pages | Stage 1 |
| **S2 — Database phase 1: identity & approval** | 2a `profiles` (+`is_approved`), `applications`, `admins` + RLS + RPCs · 2b apply to non-prod, test anon/authed, then prod | Versioned up + `.down.sql` + policies in PR; default-deny verified | Stage 1 |
| **S3 — Auth complete** | 3a Supabase clients + `middleware.ts` + login/logout · 3b forgot/update password (same-origin redirects; Preview emails → Preview) · 3c **Apply live** = sign-up + pending account + application record (zod; first-name handling per resolved flag 5d) | All auth flows pass on local + Preview; `SUPABASE-VERCEL-SETUP.md` checklists green | S2 |
| **S4 — Approval gate + admin** | 4a gated shell + sidebar + `/dashboard` pending state · 4b `/admin/approvals` queue (server-checked `admins`) · 4c server-side `is_approved` enforcement on every gated route/RPC + approval notification email (Resend) | 🔴 `SECURITY-CHECKLIST.md` §15 fully verified; pending user sees only pending state; approval unlocks without re-login | S3 |
| **S5 — Database phase 2: content schema** | 5a `elements` + content ingestion (30 topics from `/docs/page-copy/06-elements`) · 5b `checklist_items` + `checklist_progress` (200+ items, 3 gates) · 5c `programming_sessions` (anon-safe public read) · 5d `resources` metadata + private Storage bucket + 267 templates upload · 5e `academy_modules` | Each phase: non-prod first, RLS verified anon vs pending vs approved | S4 |
| **S6 — Private platform pages** | 6a `/dashboard` full (current-stage snapshot rule) · 6b `/plan` + `/operate` · 6c `/build` checklist tracker (saved progress, 3 gates) · 6d element page component + 30 instances · 6e `/resources` hub + signed-URL downloads · 6f `/academy` · 6g `/tools` placeholder + `/account` + `/support` | Private-page mockups already in `/docs/page-designs/member-workspace/` (admin in `/docs/page-designs/admin/`) | S5 |
| **S7 — Live Programming** | 7a `/live` on real data + watch view (YouTube embed; CSP extended for the YouTube origin only — resolved decision D1) · 7b Experience live-strip wired to the same feed/component · 7c partner publishing tools (owner-scoped writes) | 7c needs the partner-publishing UI design + copy (flagged gap, `PROJECT-STATUS.md` §3); D2 (RSVP) is the only open decision; empty states still graceful | S5 (S6a for partner UI) |
| **S8 — Email automations & lead magnets** | 8a Mailchimp: booklet capture (`lead-booklet-a/b`) + newsletter + apply tagging · 8b Resend: contact form + transactional; verify sending domain (SPF/DKIM/DMARC) | Real deliveries verified on Preview + Production; keys server-only | S3 |
| **S9 — Hardening** | 9a Upstash rate limiting on all public writes · 9b Turnstile on public forms · 9c fail-closed verification in Production; CSP/headers verified live; threat-model pass on any secret-key path | Full `SECURITY-CHECKLIST.md` §1–§15 pass | S7, S8 |
| **S10 — Final review & launch** | 10a full-site QA: cross-browser/device, 0 known bugs, consistency sweep · 10b content verification (copy verbatim, numbers, booklet filename mapping) · 10c SEO/structured data + performance (CWV) · 10d custom domain go-live + post-deploy checks | Every checklist in every doc green; `PROJECT-STATUS.md` marked **Launched** | S9 |

### Sprint exit gate (applies to every sprint)

- [ ] Typecheck + lint + build green locally; CI green
- [ ] Vercel Preview tested, desktop + mobile
- [ ] Relevant `SECURITY-CHECKLIST.md` sections pass (always §15 once auth exists)
- [ ] Copy verbatim; design matches mockups/tokens; numbers correct
- [ ] No new console errors or hydration warnings
- [ ] `PROJECT-STATUS.md` updated in the same PR

## C. Ordering rationale (read once)

Public shell first because it has zero data dependencies and gets a real site live fast. Identity schema (S2) before auth (S3) because Apply writes `profiles` + `applications` on day one. The approval gate (S4) immediately after auth because **no gated content may ship before the gate is proven** — that's why content schema (S5) and private pages (S6) come after. Live Programming (S7) needs `programming_sessions` and benefits from the partner shell. Email (S8) can run parallel-ish after S3 but is sequenced to keep one sprint active at a time. Hardening (S9) before final review (S10) so QA tests the production-real configuration.
