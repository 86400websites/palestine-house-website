# Palestine House — Roadmap (Features & Sprints)

> **What we build, in what order.** This is the master plan: the full feature list, then the stage/sprint sequence with scope, dependencies, and exit gates. Run **one sprint at a time**; big sprints are split into lettered phases, each its own branch → PR → Preview → merge loop (`WORKFLOW.md`). Where we currently stand lives in [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) — update it in the same PR that completes a sprint or phase. Architecture detail: [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md) §0 and `/docs/page-designs/content/PH_Sitemap_Architecture_TECH.txt`.

---

## A. Full feature list (MVP scope)

### Public shell
- [x] Locked site chrome — header (logo → Home + four nav labels with tooltip one-liners, mega-menus on The Model + Experience per mockup, + Sign in + green **Apply** CTA), footer (link columns, lead-magnet block, legal, tagline), mobile Sheet menu
- [x] `/` Home (full "Bring Palestine House to Your City" section)
- [x] `/model` The Model
- [x] `/experience` Experience — the decision page (hero artwork, day/night section, five programming threads, closing CTA, lead magnet) — *live strip in designed empty state until S9 wires `programming_sessions`*
- [x] `/bring-ph` Bring a House (absorbs How It Works: stage triptych + Day 30/60/108 milestone timeline, "who brings what," three rules)
- [x] `/our-support` Our Support
- [ ] `/live` Live Programming — *listing built with approved empty states (Stage 0); real session data, watch view, and live filters in S9*  **[public hero feature]**
- [x] `/apply` — *live (S3c): sign-up → pending account + application record (zod-validated); single "Your name" field per D5 + an owner-approved Password field (§4). Rate-limit + Turnstile come in **S12** (post-launch hardening) — see `PROJECT-STATUS.md` §7*
- [x] `/about`, `/contact` (form UI built; sends via Resend in S10b), `/focus-areas` (secondary route, linked from page bodies), `/privacy`, `/terms` (placeholder legal copy, counsel before launch)
- [ ] Lead magnets: the two public booklets (*The House Promise*, *Operating Model & Governance*) — *capture forms built (Stage 0, honest no-op); Mailchimp tags `lead-booklet-a` / `lead-booklet-b` in S10a*
- [x] SEO: per-route metadata, `sitemap.ts`, `robots.ts`, OG image, JSON-LD (Organization, WebSite)

### Auth & access
- [x] `/login`, `/forgot-password`, `/update-password` (no separate signup — retired, merged into Apply) — *live S3a/3b; `/auth/confirm` exchanges the reset code→session*
- [x] Supabase `@supabase/ssr` browser + server clients, `src/middleware.ts` session refresh, same-origin validated redirects (`safe-redirect.ts`) — *S3a; route protection enforcement is S4*
- [x] Approval gate: `profiles.is_approved`, pending-state dashboard, server-side session gate on the gated route group (content RPCs inherit the pattern in S5/S6) — *S4*
- [x] `/admin/approvals` — HQ approval queue (server-checked `admins` table) — *S4*  **[MVP-critical]**
- [x] **Session-aware Apply CTA** — the public header's green Apply button becomes **My Dashboard** (→ `/dashboard`) once signed in (any state); logged-out keeps Apply. Same-origin session probe, public pages stay static, CSP unchanged — *S6 Step 3.5 (owner-requested UX)*
- [x] **Apply → dashboard redirect** — a successful application signs the partner in (instant session, email confirmation OFF) and lands them on the `/dashboard` pending "under review" state, with no separate sign-in — *S6 Step 3.5 (owner-requested UX)*

### Partner platform (gated)
- [x] Gated shell: persistent left sidebar + pending/locked state — *S4 (S6 destinations inert until built)*
- [x] `/dashboard` Welcome as a Partner (orientation by stage; "current stage" snapshot — Design & Build % hidden until Build starts) — *S6 6a*
- [x] `/plan` Plan & Prepare (reference) · `/operate` Operate & Program / Managing & Operating (one page, two entry points) — *S6 6b*
- [x] `/build` Design & Build — launch checklist: 200+ items, **saved per-user progress** (the only per-user interactivity) — *S6 6c (grouped by the 10 focus areas; milestone gates retired site-wide, D-S8-c)*
- [x] `/elements/[slug]` — tabbed canonical element page component × 30 (A1–J3), MDX bodies — *S6 6d (DB markdown, sanitized server-side)*
- [x] `/resources` + `/resources/[category]` — guides, 267 templates, tools; private Storage bucket + server-issued signed URLs — *S6 6e (migration 0017)*
- [x] `/academy` + `/academy/[slug]` — optional video reference library (no progress, no quizzes, no certificate) — *S6 6f: `/academy` library shipped; `/academy/[slug]` not built at MVP (each topic's Video tab + card link covers it, §3)*
- [ ] `/live` partner tools — publish a YouTube link + event metadata from the dashboard → populate the public listing — *S9 (post-launch)*
- [x] `/tools` House Applications — coming-soon placeholder — *S6 6g*
- [x] `/account`, `/support` — *S6 6g (migrations 0018/0019; `/account` Delete hidden D-S6-c; `/support` email deferred — requests stored)*

### Platform plumbing
- [x] Database: `profiles`, `applications`, `admins`, `elements`, `checklist_items`, `checklist_progress`, `programming_sessions`, `resources`, `academy_modules` — RLS default-deny, hardened `SECURITY DEFINER` RPCs, anon-safe public projections — *S2/S5; S6 adds the download/account/support writes (migrations 0017–0019). Test ✓; prod apply of 0016–0019 pending owner*
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
| **0.3 New marketing pages** | `/experience` (live strip in empty/fallback state), `/bring-ph` (triptych + milestone timeline), `/our-support` | Densest pages — pace per `DESIGN.md` §12 |
| **0.4 Live + supporting pages** | `/live` public listing + watch view (static empty states), `/focus-areas`, `/about`, `/contact` (form UI, no-op) | |
| **0.5 Apply + auth UI + legal + SEO** | `/apply` form UI (no-op submit with honest "not yet live" handling), `/login` `/forgot-password` `/update-password` UI shells, `/privacy` `/terms`, metadata + sitemap + robots + OG | |

**Stage 0 exit gate:** typecheck/lint/build green · every public page matches its mockup at 320px → desktop · copy verbatim · proof numbers correct (10 · 30 · 200+ · 267 · 120-day launch) · reduced-motion respected · no console errors · headers/footer identical everywhere.

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
| ✅ **S2 — Database phase 1: identity & approval** *(done 2026-06-15, merge pending)* | 2a `profiles` (+`is_approved`), `applications`, `admins` + RLS + RPCs · 2b apply to non-prod, test anon/authed, then prod | Versioned up + `.down.sql` + policies in PR; default-deny verified | Stage 1 |
| ✅ **S3 — Auth complete** *(merged 2026-06-16, PR #19)* | 3a Supabase clients + `src/middleware.ts` + login/logout · 3b forgot/update password + `/auth/confirm` (same-origin redirects; Preview emails → Preview) · 3c **Apply live** = sign-up + pending account + application record (zod; `full_name` via the `0008` trigger; + owner-approved Password field, §4) | All auth flows pass on local + Preview; `SUPABASE-VERCEL-SETUP.md` checklists green | S2 |
| ✅ **S4 — Approval gate + admin** *(built 2026-06-17, PR open; Preview + merge pending)* | 4a gated shell + sidebar + `/dashboard` pending state · 4b `/admin/approvals` queue (server-checked `admins`) · 4c server-side session gate on the gated route group + post-login → `/dashboard` (**approval-notification email deferred to S10** — Resend domain unverified until then; **"Add note" → backlog**) | 🔴 `SECURITY-CHECKLIST.md` §15 self-reviewed; pending user sees only pending state; approval unlocks without re-login; non-admin → 404 on `/admin/*` | S3 |
| ✅ **S5 — Database phase 2: content schema** *(merged 2026-06-18, PR #23)* | 5a `elements` + content ingestion (30 topics from `/docs/page-copy/06-elements`) · 5b `checklist_items` + `checklist_progress` (200+ items) · 5c `programming_sessions` (anon-safe public read) · 5d `resources` metadata + private Storage bucket + 267 templates upload · 5e `academy_modules` | Each phase: non-prod first, RLS verified anon vs pending vs approved | S4 |
| **S6 — Private platform pages** | 6a `/dashboard` full (current-stage snapshot rule) · 6b `/plan` + `/operate` · 6c `/build` checklist tracker (saved progress) · 6d element page component + 30 instances · 6e `/resources` hub + signed-URL downloads · 6f `/academy` · 6g `/tools` placeholder + `/account` + `/support` | Private-page mockups already in `/docs/page-designs/member-workspace/` (admin in `/docs/page-designs/admin/`) | S5 |
| ✅ 🚀 **S7 — Final review & launch** *(LAUNCHED 2026-06-19, PR #29 — production live + public-layer verified; Codex review = approve, zero blocking)* | 7a full-site QA: cross-browser/device, 0 known bugs, consistency sweep · 7b content verification (copy verbatim, numbers, booklet filename mapping) · 7c SEO/structured data + performance (CWV) · 7d go-live on the **Vercel domain** + post-deploy checks (custom domain post-launch, §4) | Every **launch-blocking** checklist green; `PROJECT-STATUS.md` marked **Launched**. ⚠️ Launches **before** the post-launch sprints — public writes go live without Upstash rate-limit/Turnstile (accepted owner decision, §5/§7); the HQ approval gate keeps abuse out of gated content | **S6** |
### Stage 3 — Post-launch (run in order)

> Sequenced after go-live (reshuffled 2026-06-23 per owner direction): polish the partner platform first (the first post-launch feedback), then Live, then Email & approval ops, then a full journey simulation, then fix-all + final hardening + the final launch. One sprint at a time, same branch → PR → Preview → merge loop.

| Sprint | Phases | Scope & exit gate | Depends on |
|---|---|---|---|
| **S8 — Workspace Visual Polish** *(post-launch · active)* | 8a shared shell + premium kit (reveals · tatreez dividers · paper washes · card-lift · empty/loading states; confirm `LazyMotion` wraps workspace) · 8b dashboard (3 states) · 8c plan + operate · 8d build tracker (gates stay off, D-S6-b) · 8e element page · 8f resources + resources/[category] + academy · 8g account + support + tools · 8h exit gate | Lift all ~12 gated pages to the **public-shell premium bar** using already-approved patterns + design-system tokens (no new design language, no new mockups). **Behavior 100% untouched**; `/live` (public) is the benchmark, not edited. Exit: every workspace route reads premium + digestible at 320px + desktop + reduced-motion; typecheck/lint/build green; zero copy/proof-number/behavior changes. Brief: `docs/sprint-prompts/s8-workspace-visual-polish.md` + `DESIGN.md` (Workspace premium layer). | S6 |
| **S9 — Live Programming** *(post-launch)* | 9a `/live` on real data + watch view (YouTube embed; CSP extended for the YouTube origin only — D1) · 9b Experience live-strip wired to the same feed/component · 9c partner publishing = **publish a YouTube link + event metadata from the dashboard** (owner-scoped writes under RLS) | Simplest powerful path — no streaming infra. Needs the small partner-publish UI/copy (the one prior design gap, §3). Exit: `/live` + Experience on real data; publish flow owner-scoped; empty states still graceful. D2 (in-person RSVP → listing-only) confirmed here. | S6, S8 |
| **S10 — Email & approval operations** *(post-launch)* | 10a Mailchimp: booklet capture (`lead-booklet-a/b`) + newsletter + apply tagging · 10b Resend: contact + transactional incl. the **approval/decline email** (deferred from S4) + verify sending domain (SPF/DKIM/DMARC) · 10c approval-ops: **admin-management UI** (add/remove/see admins) + clearer "under review" copy + declined→contact path | Each integration no-ops cleanly without env vars. Exit: real deliveries verified on Preview + Production; admin self-serves admins (no DB editing); keys server-only. | S3, S9 |
| **S11 — Full journey simulation & QA** *(post-launch)* | 11a public + auth journeys · 11b gated workspace + admin journeys · 11c content/copy/CTA/nav/a11y/security sweep | Walk the whole platform end-to-end wearing multiple hats (design thinking, UX, content, a11y, security) — every feature, copy, CTA, link. **Find, don't fix.** Exit: a complete severity-ranked findings log at `docs/code-reviews/s11-journey-findings.md`; zero fixes made. | S8, S9, S10 |
| **S12 — Fix-all + final hardening + final launch** *(post-launch)* | 12a fix every S11 finding (0 bugs / 0 errors, nothing broken) · 12b Upstash rate-limiting + Turnstile on public writes · 12c fail-closed verification in Production; CSP/headers verified live; secret-path threat-model pass · 12d final launch | Absorbs the original Hardening sprint. Exit: full `SECURITY-CHECKLIST.md` §1–§15 pass; all S11 findings resolved + re-verified; production re-smoke-tested; final version launched. | S11 |

### Sprint exit gate (applies to every sprint)

- [ ] Typecheck + lint + build green locally; CI green
- [ ] Vercel Preview tested, desktop + mobile
- [ ] Relevant `SECURITY-CHECKLIST.md` sections pass (always §15 once auth exists)
- [ ] Copy verbatim; design matches mockups/tokens; numbers correct
- [ ] No new console errors or hydration warnings
- [ ] `PROJECT-STATUS.md` updated in the same PR

## C. Ordering rationale (read once)

Public shell first because it has zero data dependencies and gets a real site live fast. Identity schema (S2) before auth (S3) because Apply writes `profiles` + `applications` on day one. The approval gate (S4) immediately after auth because **no gated content may ship before the gate is proven** — that's why content schema (S5) and private pages (S6) come after. Private pages (S6) complete the MVP product, so **launch (S7) comes next** — the owner ships on the Vercel domain immediately after S6. **Stage 3 is post-launch**, sequenced after go-live: Workspace Visual Polish (S8) lifts the partner platform to the public-shell premium bar **first** (it was the first post-launch feedback), then Live Programming (S9), Email & approval operations (S10), a full journey simulation (S11), and finally fix-all + final hardening + the **final launch** (S12). (Reshuffled 2026-06-23 per owner direction; an earlier post-launch order ran Live/Email/Hardening as S8–S10.) Deliberate tradeoff carried since the MVP launch: public writes (Apply, contact, support) went live without Upstash rate-limiting/Turnstile — accepted knowingly, since the HQ approval gate keeps any abuse out of gated content; the full fix lands in **S12** (`PROJECT-STATUS.md` §5/§7).
