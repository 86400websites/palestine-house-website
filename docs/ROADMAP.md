# Palestine House — Roadmap (Features & Sprints)

> **What we build, in what order.** This is the master plan: the full feature list, then the stage/sprint sequence with scope, dependencies, and exit gates. Run **one sprint at a time**; big sprints are split into lettered phases, each its own branch → PR → Preview → merge loop (`WORKFLOW.md`). Where we currently stand lives in [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) — update it in the same PR that completes a sprint or phase. Architecture detail: [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md) §0 and `/docs/page-designs/content/PH_Sitemap_Architecture_TECH.txt`.

---

## A. Full feature list (MVP scope)

### Public shell
- [x] Locked site chrome — header (logo → Home + four nav labels with tooltip one-liners, mega-menus on The Model + Experience per mockup, + Sign in + green **Apply** CTA), footer (link columns, lead-magnet block, legal, tagline), mobile Sheet menu
- [x] `/` Home (full "Bring Palestine House to Your City" section)
- [x] `/model` The Model
- [x] `/experience` Experience — the decision page (hero artwork, day/night section, five programming threads, closing CTA, lead magnet) — *live strip in designed empty state until S8 wires `programming_sessions`*
- [x] `/bring-ph` Bring a House (absorbs How It Works: stage triptych + Day 30/60/108 gates timeline, "who brings what," three rules)
- [x] `/our-support` Our Support
- [ ] `/live` Live Programming — *listing built with approved empty states (Stage 0); real session data, watch view, and live filters in S8*  **[public hero feature]**
- [x] `/apply` — *live (S3c): sign-up → pending account + application record (zod-validated); single "Your name" field per D5 + an owner-approved Password field (§4). Rate-limit + Turnstile come in **S10** (post-launch) — see `PROJECT-STATUS.md` §7*
- [x] `/about`, `/contact` (form UI built; sends via Resend in S9b), `/focus-areas` (secondary route, linked from page bodies), `/privacy`, `/terms` (placeholder legal copy, counsel before launch)
- [ ] Lead magnets: the two public booklets (*The House Promise*, *Operating Model & Governance*) — *capture forms built (Stage 0, honest no-op); Mailchimp tags `lead-booklet-a` / `lead-booklet-b` in S9a*
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
- [x] `/build` Design & Build — launch checklist: 200+ items, 3 gates, **saved per-user progress** (the only per-user interactivity) — *S6 6c (gate banners suppressed until HQ supplies the mapping + Gate 2 label, D-S6-b)*
- [x] `/elements/[slug]` — tabbed canonical element page component × 30 (A1–J3), MDX bodies — *S6 6d (DB markdown, sanitized server-side)*
- [x] `/resources` + `/resources/[category]` — guides, 267 templates, tools; private Storage bucket + server-issued signed URLs — *S6 6e (migration 0017)*
- [x] `/academy` + `/academy/[slug]` — optional video reference library (no progress, no quizzes, no certificate) — *S6 6f: `/academy` library shipped; `/academy/[slug]` not built at MVP (each topic's Video tab + card link covers it, §3)*
- [ ] `/live` partner tools — create/schedule sessions, attach stream, go live, host recordings → populate the public listing — *S8 (post-launch)*
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
| ✅ **S2 — Database phase 1: identity & approval** *(done 2026-06-15, merge pending)* | 2a `profiles` (+`is_approved`), `applications`, `admins` + RLS + RPCs · 2b apply to non-prod, test anon/authed, then prod | Versioned up + `.down.sql` + policies in PR; default-deny verified | Stage 1 |
| ✅ **S3 — Auth complete** *(merged 2026-06-16, PR #19)* | 3a Supabase clients + `src/middleware.ts` + login/logout · 3b forgot/update password + `/auth/confirm` (same-origin redirects; Preview emails → Preview) · 3c **Apply live** = sign-up + pending account + application record (zod; `full_name` via the `0008` trigger; + owner-approved Password field, §4) | All auth flows pass on local + Preview; `SUPABASE-VERCEL-SETUP.md` checklists green | S2 |
| ✅ **S4 — Approval gate + admin** *(built 2026-06-17, PR open; Preview + merge pending)* | 4a gated shell + sidebar + `/dashboard` pending state · 4b `/admin/approvals` queue (server-checked `admins`) · 4c server-side session gate on the gated route group + post-login → `/dashboard` (**approval-notification email deferred to S9** — Resend domain unverified until then; **"Add note" → backlog**) | 🔴 `SECURITY-CHECKLIST.md` §15 self-reviewed; pending user sees only pending state; approval unlocks without re-login; non-admin → 404 on `/admin/*` | S3 |
| ✅ **S5 — Database phase 2: content schema** *(merged 2026-06-18, PR #23)* | 5a `elements` + content ingestion (30 topics from `/docs/page-copy/06-elements`) · 5b `checklist_items` + `checklist_progress` (200+ items, 3 gates) · 5c `programming_sessions` (anon-safe public read) · 5d `resources` metadata + private Storage bucket + 267 templates upload · 5e `academy_modules` | Each phase: non-prod first, RLS verified anon vs pending vs approved | S4 |
| **S6 — Private platform pages** | 6a `/dashboard` full (current-stage snapshot rule) · 6b `/plan` + `/operate` · 6c `/build` checklist tracker (saved progress, 3 gates) · 6d element page component + 30 instances · 6e `/resources` hub + signed-URL downloads · 6f `/academy` · 6g `/tools` placeholder + `/account` + `/support` | Private-page mockups already in `/docs/page-designs/member-workspace/` (admin in `/docs/page-designs/admin/`) | S5 |
| **S7 — Final review & launch** 🚀 *(launch)* | 7a full-site QA: cross-browser/device, 0 known bugs, consistency sweep · 7b content verification (copy verbatim, numbers, booklet filename mapping) · 7c SEO/structured data + performance (CWV) · 7d custom domain go-live + post-deploy checks | Every **launch-blocking** checklist green; `PROJECT-STATUS.md` marked **Launched**. ⚠️ Launches **before** the post-launch sprints — public writes go live without Upstash rate-limit/Turnstile (accepted owner decision, §5/§7); the HQ approval gate keeps abuse out of gated content | **S6** |
| **S8 — Live Programming** *(post-launch)* | 8a `/live` on real data + watch view (YouTube embed; CSP extended for the YouTube origin only — resolved decision D1) · 8b Experience live-strip wired to the same feed/component · 8c partner publishing tools (owner-scoped writes) | 8c needs the partner-publishing UI design + copy (flagged gap, `PROJECT-STATUS.md` §3); D2 (RSVP) is the only open decision; empty states still graceful | S5 (S6a for partner UI) |
| **S9 — Email automations & lead magnets** *(post-launch)* | 9a Mailchimp: booklet capture (`lead-booklet-a/b`) + newsletter + apply tagging · 9b Resend: contact form + transactional (incl. the **approval-notification email deferred from S4**); verify sending domain (SPF/DKIM/DMARC) | Real deliveries verified on Preview + Production; keys server-only | S3 |
| **S10 — Hardening** *(post-launch)* | 10a Upstash rate limiting on all public writes · 10b Turnstile on public forms · 10c fail-closed verification in Production; CSP/headers verified live; threat-model pass on any secret-key path | Full `SECURITY-CHECKLIST.md` §1–§15 pass | S8, S9 |

### Sprint exit gate (applies to every sprint)

- [ ] Typecheck + lint + build green locally; CI green
- [ ] Vercel Preview tested, desktop + mobile
- [ ] Relevant `SECURITY-CHECKLIST.md` sections pass (always §15 once auth exists)
- [ ] Copy verbatim; design matches mockups/tokens; numbers correct
- [ ] No new console errors or hydration warnings
- [ ] `PROJECT-STATUS.md` updated in the same PR

## C. Ordering rationale (read once)

Public shell first because it has zero data dependencies and gets a real site live fast. Identity schema (S2) before auth (S3) because Apply writes `profiles` + `applications` on day one. The approval gate (S4) immediately after auth because **no gated content may ship before the gate is proven** — that's why content schema (S5) and private pages (S6) come after. Private pages (S6) complete the MVP product, so **launch (S7) comes next** — the owner ships on the Vercel domain immediately after S6. Live Programming (S8), Email automations (S9), and Hardening (S10) are **post-launch enhancements**, sequenced after go-live (reshuffled 2026-06-18 per owner direction; the original order ran Live/Email/Hardening *before* launch). Deliberate tradeoff: launching before Hardening means public writes (Apply, contact, support) go live without Upstash rate-limiting/Turnstile — accepted knowingly, since the HQ approval gate keeps any abuse out of gated content (`PROJECT-STATUS.md` §5/§7).
