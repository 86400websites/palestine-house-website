# Palestine House — Project Status

> **The living tracker and source of operation.** Any fresh session — Claude Code, Codex, claude.ai, or a human — reads this file first to know exactly where the build stands and what to do next. It is updated **in the same PR** that completes (or meaningfully advances) a sprint or phase. Plan and exit gates: [`ROADMAP.md`](./ROADMAP.md). Process: [`WORKFLOW.md`](./WORKFLOW.md).

---

## 1. Right now

| | |
|---|---|
| **Current stage** | Stage 1 — Connect & launch the barebones site |
| **Active sprint** | 1.2 Vercel envs + 1.3 Supabase auth URLs (owner dashboard steps) |
| **Next action** | Owner: correct the three Supabase env values in Vercel to the **palestine-house** project (`jwogtqizqujwhbvpoziu` — the values first added belong to the Singapore Way project) + redeploy; rotate the Singapore Way project's secret key; merge PR #13; branch protection rule on `main`; secret scanning ON; Supabase Auth URL config (Site URL + 3 redirects). Then Stage 1 exit gate ✅ |
| **Production URL** | Vercel domain — Production deploys automatically from `main` (Stage 0 merge = first full-site deploy); record the URL here once `NEXT_PUBLIC_SITE_URL` is set |
| **Last updated** | 2026-06-12 — Stage 0 merged (PR #4) · 1.1 merged (PR #5) · Supabase production ref recorded |

### How to resume in a fresh AI session
1. Read this file, then the active sprint's scope + exit gate in `ROADMAP.md`.
2. Read `CLAUDE.md` (or `AGENTS.md` if you're a review agent) and the docs it points to for the task at hand.
3. Verify the repo state yourself (`package.json`, `src/app/`, `git log`) — trust the code over this file if they disagree, then fix this file.
4. Work only inside the active sprint. Anything else → propose it under §5 or the backlog.
5. Before ending: update §1–§3 here, tick `ROADMAP.md` checkboxes, and include this file in the PR.

## 2. Sprint board

Status legend: ⬜ not started · 🔵 in progress · ✅ done · ⏸ blocked (say why in Notes)

| Stage / Sprint | Status | Merged PR(s) | Date | Notes |
|---|---|---|---|---|
| 0.0 Setup pre-sprints (0a–0d: repo, scaffold, CI, Vercel preview) | ✅ | #1, #2 | 2026-06 | Scaffold (`80c7fcc`), CI workflow, Vercel Preview verified — pre-completes parts of 1.1/1.2 |
| 0.1 Foundation (tokens, fonts, chrome, headers, 404) | ✅ | #4 | 2026-06-12 | Real tokens, Spectral+Inter, motion primitives, security headers + CSP, locked chrome (mega-menus per mockup), 404/error |
| 0.2 Home + The Model | ✅ | #4 | 2026-06-12 | Built on the Stage 0 branch per the gated sub-step protocol (`docs/sprint-prompts/stage-0-master-prompt.md`) |
| 0.3 Experience · Bring a House · Our Support | ✅ | #4 | 2026-06-12 | All three pages built; Experience live strip in designed empty state until S7 |
| 0.4 Live + Focus Areas + About + Contact | ✅ | #4 | 2026-06-12 | `/live` ships the approved empty states (watch view + filters activate with real data, S7); contact form no-ops honestly until Resend (S8) |
| 0.5 Apply UI + auth UI + legal + SEO | ✅ | #4 | 2026-06-12 | Apply + auth forms no-op honestly until S3; legal pages carry the approved counsel-review note; sitemap/robots/OG/JSON-LD live |
| **Stage 0 exit gate** | ✅ | #4 | 2026-06-12 | Build-side gate + owner Preview sign-off passed; merged to `main` |
| 1.1 GitHub (protection + CI) | ✅ | #5 | 2026-06-12 | gitleaks + Dependabot merged; owner Settings items (visibility→private, protection rule, secret scanning) tracked in §1 |
| 1.2 Vercel (envs + production deploy) | ⬜ | | | Vercel connected, Preview verified (PR #2); still to do: env vars per environment + first Production deploy |
| 1.3 Supabase projects (prod + non-prod, auth URLs) | 🔵 | | 2026-06-12 | Production project created (ref `jwogtqizqujwhbvpoziu`); **non-production project deferred to the start of S2** (owner decision — see §4); auth URLs to configure |
| **Stage 1 exit gate — barebones site LIVE** | ⬜ | | | |
| S1 Design consistency pass (1a–1d) | ⬜ | | | |
| S2 DB phase 1 — identity & approval (2a–2b) | ⬜ | | | |
| S3 Auth complete (3a–3c, Apply live) | ⬜ | | | |
| S4 Approval gate + /admin/approvals (4a–4c) | ⬜ | | | 🔴 §15 invariants verified here |
| S5 DB phase 2 — content schema (5a–5e) | ⬜ | | | |
| S6 Private platform pages (6a–6g) | ⬜ | | | Mockups already in `/docs/page-designs/member-workspace/` + `admin/` |
| S7 Live Programming (7a–7c) | ⬜ | | | Video host resolved: **YouTube** (§4); partner-publishing UI not yet designed (§3 gaps); only D2 (RSVP) open |
| S8 Email automations & lead magnets (8a–8b) | ⬜ | | | Mailchimp audience + Resend domain values added by owner at build time (§5) |
| S9 Hardening (9a–9c) | ⬜ | | | |
| S10 Final review & launch (10a–10d) | ⬜ | | | |

## 3. What exists / what's pending

**Done so far**
- Locked sitemap & architecture: `/docs/page-designs/content/PH_Sitemap_Architecture_TECH.txt` (summarized in `TECH-ARCHITECTURE.md` §0).
- Complete development-ready copy set (`/docs/page-copy/` — `00-global`, 12 public pages, 3 auth pages, 12 workspace pages, 3 admin pages, 30 element pages in `06-elements/`). All review flags resolved; the 30-topic reconciliation record is `/docs/page-copy/05-review/structure-reconciliation.md`. (The flat copy under `/docs/page-designs/content/` is the snapshot the mockups read — `/docs/page-copy/` is canonical.)
- **Approved high-fidelity mockups for all 30 pages** (`/docs/page-designs/`): `public/` (12) · `auth/` (3) · `member-workspace/` (12, incl. Search) · `admin/` (3), plus the locked shared chrome (`shared/site-chrome.*`, `workspace-chrome.*`, `admin-chrome.*`, `pages.css`) and browsable hubs (`index.html`, `WorkspaceIndex.html`). See `/docs/page-designs/README.md` for the route map and design rules.
- **Bound design system v2 in-repo**: `/docs/page-designs/design-system/` — `tokens/` (colors, fonts, typography, spacing), `base.css`, `styles.css`, self-hosted Spectral + Inter, component bundle.
- **Final artwork in-repo**: `/docs/page-designs/assets/art/` (mockup-referenced `PH-*.png`) + masters incl. textures and empty-state marks in `/docs/source-assets/images/`.
- Content package (`/docs/source-assets/resources/`): booklets, 10 focus areas, 30 topics, 267 templates, videos (uploaded to Supabase Storage in Sprint 5d/6e).
- Repo scaffolded on the locked stack (Next.js 15, TS strict, pnpm, Tailwind v4, shadcn/ui, Framer Motion) with CI and a verified Vercel Preview pipeline (PRs #1–#2).
- This docs/ops package (10 core MD files), aligned with the repo on 2026-06-11.

**Known design gaps (flagged in `/docs/page-designs/README.md` — never invent these)**
- `/live` **partner publishing tools** UI is not designed and has no approved copy — design + copy needed before S7c.
- `/academy/[slug]` dedicated module view not designed — each topic's Video tab covers MVP behavior; design only if embeds need their own page.
- 4 topics missing the "Watch Out For" file (**H2, H3, I3, J2**) — keep the approved empty-state line until source content is added.
- Gate 2's label ("Build-out") is unapproved; Gate 1 = "Day 30: Foundation" and Gate 3 ≈ "ready to host" are approved.

**Pending inputs (owner)**
- Mailchimp audience + Resend sending domain + contact/legal email — owner adds as env vars before S8 (see §4 D4).
- Decision D2 in §5.

## 4. Locked decisions (do not reopen)

- Public nav: logo → Home + four labels (The Model · Experience · Bring a House · Our Support) + **Sign in** + green **Apply** button; hover one-liners via the Tooltip component. **The Model and Experience additionally open mega-menu panels** (two link columns + three artwork thumbnails) — built per the approved mockup chrome; the mega-menu link strings (Who's who / How it works / The rooms / More to find columns) are approved-via-mockup (owner decision, 2026-06-12). Live Programming is not a top-nav label — it surfaces via the Experience mega-menu, Home, the footer "Explore" column, and the Experience live strip.
- Footer (locked, identical everywhere): Explore (The Model · Experience · Live Programming) · Bring a House (Why bring one · Our support) · Account (Sign in) · Legal (Privacy · Terms · Contact) + Apply block + booklet lead-magnet block + tagline. `/focus-areas` and `/about` are secondary routes linked from page bodies, not chrome.
- Single CTA: "Apply to bring a House" · *Every application is reviewed by HQ.* Questions → Contact. Never "create a free account."
- **Apply = sign-up**, approval-gated: one form → pending account + application → HQ approval (`is_approved`) → unlock. No separate signup. Apply form uses a **single "Your name" field** (per mockup; resolves copy flag 5d — derive first name server-side if needed).
- **Reference, not a course:** no quizzes, **no certificate**; Academy = optional gated video library; only per-user state = `/build` checklist progress.
- Stages: Plan & Prepare · Design & Build · Operate & Program. "Managing & Operating" (sidebar) and "Operate & Program" (stage) both resolve to `/operate` — intentional, not a duplicate. **Resources sits in the workspace sidebar as a primary destination** (accepted deviation, flagged in the design handoff).
- Proof numbers: **10 focus areas · 30 topics · 200+ checklist items · 267 templates · 3 gates** (267 is the true count; "543"/"250+" retired).
- Live Programming: public listing + partner livestream tools, one `programming_sessions` feed; highlights strip on Experience reuses the same component. **Video host = YouTube** (resolved 2026-06-11, `notes/decisions.md`); CSP extended for the YouTube embed origin only (S7). Partner publishing behind approval, as specified in the architecture doc.
- Launch on the **Vercel domain**; custom domain connected later (resolved 2026-06-11). Contact/legal email: none yet — owner adds later as env vars before S8/legal go-live (resolved 2026-06-11).
- `/tools` ships as a coming-soon placeholder. No donations/payments/store, no political/advocacy features, no hype mechanics. English first.
- Booklet lead magnets: *The House Promise* (Booklet A) + *Operating Model & Governance* (Booklet B), public, tags `lead-booklet-a` / `lead-booklet-b`.
- **Supabase environments (owner decision, 2026-06-12):** one project for now = **production** (`jwogtqizqujwhbvpoziu`, project `palestine-house-website`). The separate **non-production** project is created at the start of S2 — in a separate free Supabase org so it costs nothing — before any schema work; Production/Preview/Development must never share one database once schema or users exist (WORKFLOW §14). Until then, Supabase env vars are set in Vercel **Production only**; Preview/Development get the non-prod project's values at S2.
- **Repo visibility (owner decision, 2026-06-12): the GitHub repo stays public** — owner accepts the trade-off knowingly. Consequence: the gated source content currently in the repo (`docs/page-copy/06-elements/`, `docs/source-assets/resources/`) is world-readable until removed. Mitigation locked in: that content moves out of the repo (or the repo flips private) **no later than S5 content ingestion / pre-launch cleanup** — tracked in `notes/cleanup-before-launch.md`. Upside: Free-plan branch protection stays enforceable.
- Stack: locked per `TECH-ARCHITECTURE.md`; build process per `WORKFLOW.md`; one sprint at a time.
- Dashboard snapshot leads with "Current stage"; Design & Build % hidden until Build starts. Soft opening Day 108 within the 120-day window (deliberate buffer).

## 5. Open decisions (resolve here, then propagate)

| # | Decision | Needed by | Options / lean | Status |
|---|---|---|---|---|
| D2 | In-person events: RSVP at MVP? | S7 | Recommendation: listing-only at MVP | OPEN |

> D1 (video host → YouTube), D3 (domain → Vercel for launch), D4 (contact/legal email → added later as env vars), D5 (Apply name field → single field per mockup), D6 (partner publishing → behind approval as specified) were resolved on 2026-06-11 in `notes/decisions.md` and moved to §4.

## 6. Environment & infrastructure record (names/refs only — never keys)

| Item | Value |
|---|---|
| GitHub repo | `86400websites/palestine-house-website` |
| Vercel project / team slug | Connected (Preview verified); record slug here at Stage 1.2 |
| Supabase production ref | `jwogtqizqujwhbvpoziu` |
| Supabase non-production ref | To create at the start of S2 (owner decision, 2026-06-12 — see §4) |
| Mailchimp audience | TBD (S8 — owner adds env vars) |
| Resend sending domain | TBD (S8 — owner adds env vars; verify SPF/DKIM/DMARC) |
| Upstash / Turnstile | TBD (S9) |

## 7. Known issues / bugs

_Log every known bug here with severity; S10 cannot pass while this section is non-empty._

| # | Severity | Where | Issue | Status |
|---|---|---|---|---|

## 8. Change log

| Date | Entry |
|---|---|
| 2026-06-11 | Docs/ops package created: 8 core docs customized to Palestine House + `ROADMAP.md` + this tracker. Stage 0 ready to start. |
| 2026-06 | Pre-sprints 0a–0d: repo created (`86400websites/palestine-house-website`), Next.js 15 scaffold merged, CI workflow added (PR #1), Vercel Preview verified (PR #2). |
| 2026-06-11 | Full docs↔repo alignment pass: corrected all content-layer paths (`page-copy/`, `page-designs/`, `design-system/`, `source-assets/`), recorded the complete mockup + design-system + artwork inventory, propagated resolved decisions D1/D3/D4/D5/D6 from `notes/decisions.md`, recorded real token values in `DESIGN.md`, fixed nav/footer descriptions to match the locked chrome, and updated the sprint board with the true code state. Sprint structure unchanged. |
| 2026-06-12 | Sprint 0.1 built on `claude/sprint-0-1-foundation`: real tokens → `globals.css`, Spectral + Inter via `next/font`, motion primitives (LazyMotion + Reveal/FadeIn/Stagger), security headers + CSP in `next.config.ts`, locked chrome (header with tooltip nav + mega-menus + mobile Sheet, footer with no-op lead form), branded 404/error pages, 6 mega-menu artworks in `/public/assets/art/`. Mega-menu header locked per mockup (owner decision). Self-review (7-angle /code-review) found and fixed: circular Tailwind font vars, Stagger single-child crash, skip-link focus, a11y describedby/aria-hidden, copy-preserving footer status line. typecheck/lint/build green; headers + chrome verified on the production build. |
| 2026-06-12 | **Stage 0 complete** (sprints 0.2–0.5, 13 gated sub-steps on the same branch, owner-gated per `docs/sprint-prompts/stage-0-master-prompt.md`): all 12 public pages + 3 auth shells built from the approved mockups with copy verified verbatim (200+ strings grep-audited against `page-copy/`); 18 final artworks shipped; honest no-op handling on every form until its real sprint (Apply→S3c, contact→S8b, booklets→S8a, auth→S3); `/live` ships the approved empty states (feed + watch view in S7); SEO layer (per-route canonicals, sitemap, robots, OG image, JSON-LD, auth noindexed). Exit-gate review (second multi-angle pass) fixed: sitemap lastModified churn, error-red styling on no-op statuses, contact live-region initial announcement, Apply confirmation focus drop, framer-motion features now lazy-loaded, shared PageDivider. Owner mobile change: Home hero art stacks first. Owner Preview sign-off + merge pending. |
