# Palestine House — Project Status

> **The living tracker and source of operation.** Any fresh session — Claude Code, Codex, claude.ai, or a human — reads this file first to know exactly where the build stands and what to do next. It is updated **in the same PR** that completes (or meaningfully advances) a sprint or phase. Plan and exit gates: [`ROADMAP.md`](./ROADMAP.md). Process: [`WORKFLOW.md`](./WORKFLOW.md).

---

## 1. Right now

| | |
|---|---|
| **Current stage** | Stage 0 — Foundational build (not started) |
| **Active sprint** | 0.1 Foundation |
| **Next action** | Scaffold the repo per `README.md` setup flow; port `_ds/` tokens; build the locked chrome |
| **Production URL** | — (none yet) |
| **Last updated** | 2026-06-11 — docs package created; no code yet |

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
| 0.1 Foundation (scaffold, tokens, chrome) | ⬜ | | | Needs `_ds/` folder in `/docs/mockups/` |
| 0.2 Home + The Model | ⬜ | | | |
| 0.3 Experience · Bring a House · Our Support | ⬜ | | | |
| 0.4 Live + Focus Areas + About + Contact | ⬜ | | | |
| 0.5 Apply UI + auth UI + legal + SEO | ⬜ | | | |
| **Stage 0 exit gate** | ⬜ | | | |
| 1.1 GitHub (protection + CI) | ⬜ | | | |
| 1.2 Vercel (envs + production deploy) | ⬜ | | | |
| 1.3 Supabase projects (prod + non-prod, auth URLs) | ⬜ | | | |
| **Stage 1 exit gate — barebones site LIVE** | ⬜ | | | |
| S1 Design consistency pass (1a–1d) | ⬜ | | | |
| S2 DB phase 1 — identity & approval (2a–2b) | ⬜ | | | |
| S3 Auth complete (3a–3c, Apply live) | ⬜ | | | |
| S4 Approval gate + /admin/approvals (4a–4c) | ⬜ | | | 🔴 §15 invariants verified here |
| S5 DB phase 2 — content schema (5a–5e) | ⬜ | | | |
| S6 Private platform pages (6a–6g) | ⬜ | | | Private-page mockups required per phase |
| S7 Live Programming (7a–7c) | ⬜ | | | Blocked on video-host decision (§5) |
| S8 Email automations & lead magnets (8a–8b) | ⬜ | | | |
| S9 Hardening (9a–9c) | ⬜ | | | |
| S10 Final review & launch (10a–10d) | ⬜ | | | |

## 3. What exists / what's pending

**Done so far**
- Locked sitemap & architecture (`/docs/PH_Sitemap_Architecture_TECH.docx`) and client-facing map & features doc.
- Complete development-ready copy set (`/docs/final-copy/` — global, 12 public pages, 3 auth pages, 12 workspace pages, 3 admin pages, 30 element pages). All review flags resolved (see copy `05-review/`).
- Design system v2 (`_ds/` tokens) + approved mockups for **public + auth pages** (`/docs/mockups/`): Home, The Model, Experience, Bring a House, Our Support, Live, Apply, Focus Areas, About, Contact, Privacy, Terms, Login, Forgot/Update Password + shared chrome.
- Content package (`/docs/resources-content/`): 2 public booklets, 10 focus areas, 30 topics, 267 templates.
- This docs/ops package (10 core MD files).

**Pending inputs (owner)**
- ⚠ Confirm the `_ds/` design-system folder is included with the mockups in the repo.
- Private platform page mockups (dashboard, plan, build, operate, elements, resources, academy, tools, account, support) — needed per S6 phase; drop into `/docs/mockups/` as they're ready.
- Final artwork assets (per `ART_ASSET_PLAN.md` IDs) — placeholders at correct ratios until then.
- Decisions in §5.

## 4. Locked decisions (do not reopen)

- Public nav: Home · The Model · Experience · Bring a House · Our Support + green **Apply** button; hover one-liners via the Tooltip component.
- Single CTA: "Apply to bring a House" · *Every application is reviewed by HQ.* Questions → Contact. Never "create a free account."
- **Apply = sign-up**, approval-gated: one form → pending account + application → HQ approval (`is_approved`) → unlock. No separate signup.
- **Reference, not a course:** no quizzes, **no certificate**; Academy = optional gated video library; only per-user state = `/build` checklist progress.
- Stages: Plan & Prepare · Design & Build · Operate & Program. "Managing & Operating" (sidebar) and "Operate & Program" (stage) both resolve to `/operate` — intentional, not a duplicate.
- Proof numbers: **10 focus areas · 30 topics · 200+ checklist items · 267 templates · 3 gates** (267 is the true count; "543"/"250+" retired).
- Live Programming: public listing + partner livestream tools, one `programming_sessions` feed; highlights strip on Experience reuses the same component.
- `/tools` ships as a coming-soon placeholder. No donations/payments/store, no political/advocacy features, no hype mechanics. English first.
- Booklet lead magnets: *The House Promise* (Booklet A) + *Operating Model & Governance* (Booklet B), public, tags `lead-booklet-a` / `lead-booklet-b`.
- Stack: locked per `TECH-ARCHITECTURE.md`; build process per `WORKFLOW.md`; one sprint at a time.
- Dashboard snapshot leads with "Current stage"; Design & Build % hidden until Build starts. Soft opening Day 108 within the 120-day window (deliberate buffer).

## 5. Open decisions (resolve here, then propagate)

| # | Decision | Needed by | Options / lean | Status |
|---|---|---|---|---|
| D1 | Live Programming video host | S7 (CSP + embed) | YouTube vs Vimeo — architecture doc leans embed-only, partner publishing behind approval | OPEN |
| D2 | In-person events: RSVP at MVP? | S7 | Recommendation: listing-only at MVP | OPEN |
| D3 | Production domain | Stage 1.2 (latest S10) | — | OPEN |
| D4 | Contact / legal email address | S8 + legal pages | — | OPEN |
| D5 | Apply form name field | S3c | Split first/last vs derive first name server-side (copy flag 5d) — pick at build | OPEN |
| D6 | Partner-publishing UI at MVP vs HQ-managed sessions | S7c | Architecture doc recommends partner publishing behind approval | OPEN |

## 6. Environment & infrastructure record (names/refs only — never keys)

| Item | Value |
|---|---|
| GitHub repo | TBD (Stage 1.1) |
| Vercel project / team slug | TBD (Stage 1.2) |
| Supabase production ref | TBD (Stage 1.3) |
| Supabase non-production ref | TBD (Stage 1.3) |
| Mailchimp audience | TBD (S8) |
| Resend sending domain | TBD (S8) — verify SPF/DKIM/DMARC |
| Upstash / Turnstile | TBD (S9) |

## 7. Known issues / bugs

_None — no code yet. Log every known bug here with severity; S10 cannot pass while this section is non-empty._

| # | Severity | Where | Issue | Status |
|---|---|---|---|---|

## 8. Change log

| Date | Entry |
|---|---|
| 2026-06-11 | Docs/ops package created: 8 core docs customized to Palestine House + `ROADMAP.md` + this tracker. Stage 0 ready to start. |
