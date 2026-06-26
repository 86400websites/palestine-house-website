# S10 — Private-pages clarity & polish

| | |
|---|---|
| **Status** | 🔵 Build complete on branch — **pending owner Vercel-Preview + merge** (record saved 2026-06-26) |
| **Branch / PR** | `claude/sprint-s10-private-pages-clarity` / open PR (not yet merged) |
| **Decision** | D-S10-b (owner direction, 2026-06-26) — replanned Stage 3; UI / copy / curation only |
| **Goal** | Make the gated partner workspace simple, premium, and idiot-proof — without touching the DB, auth, RLS, the approval gate, the CSP, or any public page |

> Sprint record, saved pre-merge at the owner's request. **What shipped** (incl. three owner mid-sprint changes), the original gated prompt, checks, deviations, and follow-ups are below. Flip the table to *Date merged* + the PR number once it lands. Scope + exit gate: `ROADMAP.md` §B (S10); decision: `PROJECT-STATUS.md` §4 (D-S10-b).

## What shipped (10 gated sub-steps + a post-Preview chrome fix)

1. **(10-1)** Simplify the workspace menu — flatten the `Stages / Your House / Library / You` group headers to **Welcome · Plan · Build · Operate · Live Programming · Resources › (Videos, Tools & Templates) · Account**; drop the duplicate **Program** and the coming-soon **House Applications** (`/tools`); relabel (Plan & Prepare→Plan, Design & Build→Build, Operate & Program→Operate, Academy→Videos); hrefs unchanged; mobile drawer + locked-for-pending behaviour unchanged.
2. **(10-2)** Operate-vs-program content re-grouping — **proposal-first** (present a mapping table, wait for approval); recommended low-risk default = keep all 30 topics in Operate but make the "Programming & Aswātna" group a clearly-labelled **Programming** section; all 30 topics stay intact; no DB change.
3. **(10-3)** Crystal-clear beginner intro copy on every gated page (dashboard incl. the pending state, plan, build, operate, videos, resources, the element/topic framing) — drafted per brand-voice, owner-approved each, written to the `.tsx` + the `docs/page-copy/03-member-workspace/*` canon.
4. **(10-4)** Build-page CTAs → **Read the full guide · Watch video · Mark in progress · Add notes · Mark Complete**, with a new Watch-video action; existing checklist behaviour preserved.
5. **(10-5)** Code-level sample videos (no DB change) + premium **white** video/element cards within existing tokens.
6. **(10-6)** Mobile responsiveness — element/topic page first (tab-strip overflow, hero, action bar), then a 320–375px sweep of the other private pages.
7. **(10-7)** Exit gate — adversarial 4-lens review (workflow) = PASS; fixed the findings; updated `PROJECT-STATUS.md` + ticked S10 in `ROADMAP.md`.
8. **(10-8)** *(owner mid-sprint change 1)* Videos play **in-site** — the element Video tab embeds the youtube-nocookie player and the Videos cards (new `academy-card.tsx` client component) swap the thumbnail for an autoplay embed on click; the outbound "Watch" button removed. Reuses the existing CSP frame-src — no CSP change.
9. **(10-9)** *(owner mid-sprint change 3)* New **`/program`** page after Operate — Programming & Aswātna (D1/D2/D3) + Membership & Service (A1/A2/E1/E2/E3) moved out of Operate (Operate keeps the five operations groups; all 30 topics still appear once). Re-added **Program** to the sidebar. **Supersedes the 10-2 keep-all-in-Operate decision.**
10. **(10-10)** *(owner mid-sprint change 2)* Welcome **rebuilt as four premium nav cards** (Plan/Build/Operate/Program — icon + one-liner + link, with the live Design & Build % on the Build card); pending users keep the calm "under review" state.
- **Chrome fix (post-Preview):** `/program` + `/programming` added to `GATED_PREFIXES` (`site-chrome.tsx`) — both were rendering the public header over the workspace shell (double chrome); `/programming` was a latent gap since S9.

## Prompt used

<details><summary>The gated implementation prompt (drove 10-1…10-7; the three owner mid-sprint changes 10-8/10-9/10-10 + the chrome fix were added as they arose)</summary>

```text
You are my senior engineer for the Palestine House website, working in Claude Code.

Session start: read docs/PROJECT-STATUS.md §1–§2, then the active sprint scope in docs/ROADMAP.md. CLAUDE.md governs everything below. This sprint INTENTIONALLY revises some previously-locked gated-workspace menu/curation/copy with my authorization (D-S10-b) — record each revision in PROJECT-STATUS so the docs stay the source of truth. It touches NO database, auth, RLS, or the approval gate, and NO public-facing pages.

Sprint: S10 — Private-pages clarity & polish
Branch: claude/sprint-s10-private-pages-clarity (create from latest main)

Goal:
Make the gated partner workspace simple, premium, and idiot-proof:
- Simplify the sidebar menu, give every private page a crystal-clear beginner summary at the top, reorder the Build-page CTAs and add a Watch-video action, populate the video cards with code-level sample videos and restyle them white/premium, and fix mobile (the element/topic page is messy on phones).
- Carefully review the focus-area content so operations-related areas sit in Operate and the program-related area (D — Programming & Cultural Quality) is surfaced cleanly — PROPOSAL-FIRST, with my approval before any topic moves.

Execute in gated sub-steps (one owner gate after each):
1. (10-1) Simplify the workspace menu in src/components/workspace/workspace-shell.tsx: remove the "Stages / Your House / Library / You" group headers and flatten to — Welcome · Plan · Build · Operate · Live Programming · Resources (with Videos and Tools & Templates as its two sub-items) · Account. Drop the duplicate "Program" item and the coming-soon "House Applications" (/tools) item. Relabel: Plan & Prepare→Plan, Design & Build→Build, Operate & Program→Operate, Academy→Videos. Hrefs unchanged (Operate→/operate, Live Programming→/programming, Videos→/academy, Tools & Templates→/resources). Keep the mobile drawer + the locked / always-available behaviour for pending users exactly as today.
2. (10-2) Content re-grouping — PROPOSAL FIRST: present a concrete operate-vs-program focus-area mapping table and WAIT for my approval before changing any curation array. My recommended default: keep all 30 topics in Operate but make the existing "Programming & Aswātna" group a clearly-labelled "Programming" section at the top of Operate (minimal change). Offer the alternative of relocating the D topics (D1/D2/D3) onto the Live Programming page. Implement only what I approve. All 30 topics must remain intact. No DB change (curation is hardcoded code-arrays in the page components).
3. (10-3) Crystal-clear intro copy: for each gated page — Welcome/dashboard (incl. the "under review" pending state), Plan, Build, Operate, Videos, Resources, and the element/topic page framing — draft a SHORT, beginner-friendly summary at the top that sets context and says how to proceed (warm, plain, concrete; no jargon, no hype, no exclamation marks). Show me each draft and WAIT for approval before shipping it. Then write the approved copy to BOTH the page .tsx strings AND the matching docs/page-copy/03-member-workspace/*.md canon. Do not rewrite the 30 topics' body content — page-level framing only.
4. (10-4) Build-page CTAs in src/app/(workspace)/build/build-tracker.tsx: reorder the per-item actions to exactly — Read the full guide · Watch video · Mark in progress · Add notes · Mark Complete. Add the new "Watch video" action linking to the topic's video (the sample video / the element Video tab). Preserve all existing checklist behaviour (progress save, notes, blocked, reopen) — reorder/relabel only, no logic regressions.
5. (10-5) Sample videos + premium cards: add a small code-level SAMPLE_VIDEOS set (neutral YouTube links, clearly marked placeholder) so the Videos page (academy) and the element Video tabs render populated with a real thumbnail + working "Watch" — NO database/migration. Restyle the video cards (.vid-card) and the element-page surfaces to a white, premium look using the existing design tokens and the S8 premium kit (DESIGN §14) — no new design language, no new dependencies.
6. (10-6) Mobile responsiveness: fix the element/topic page at 320–375px first — the 6-tab strip must not crowd (use a horizontal-scroll strip or reduced padding/font), the hero must balance, the action bar must not break — then sweep the other private pages (dashboard, plan, build, operate, videos, resources) at 320px so nothing overflows or crowds. Use the existing .ws-* classes + tokens.
7. (10-7) Sprint exit gate — full-diff review of the whole sprint, fix everything found, confirm every private page reads clear + premium + visually balanced at 320px AND desktop AND with reduced-motion, the approval gate + locked-for-pending behaviour is unchanged, then update docs/PROJECT-STATUS.md (§1, §2, change log) and tick S10 in docs/ROADMAP.md.

Per-step protocol (every sub-step, no exceptions):
1. Read the exact input(s) for this sub-step BEFORE coding.
2. Build it: smallest safe change, one focused concern.
3. Verify: pnpm run typecheck && pnpm run lint && pnpm run build; spot-check the affected pages and confirm nothing else broke.
4. Self-review the diff for bugs and fix them before committing (full review at the exit gate).
5. Commit AND push to the task branch — every sub-step, so I can review live in the open PR.
6. Report in ≤6 lines: what shipped, checks run, anything flagged — then STOP and WAIT for "proceed". Never start the next sub-step without it. For any NEW or REVISED user-facing string AND for the content re-grouping mapping table, show me the draft and wait for my approval before shipping it.

Owner remote commands: "proceed" = next step · "pause" = hold · "status" = where are we ·
"fix <thing>" = fix before continuing · "skip to <n>" = jump (record the skip in PROJECT-STATUS.md).

Locked inputs (read before coding; don't invent):
- Brand voice for ALL new/revised strings: docs/page-copy/00-global/brand-voice.md (warm, short, concrete; never charity tone, hype, slogans, or filler; no exclamation marks).
- Current workspace copy being revised: docs/page-copy/03-member-workspace/ (dashboard, plan, build, operate, academy, resources, resources-category, elements-canonical-page).
- The 10 focus areas / 30 topics are real content: docs/page-copy/06-elements/_index.md + 01-public-pages/focus-areas.md. Only RE-GROUP existing topic codes (with my approval) — never invent or drop a topic.
- Design: reuse the design-system tokens (DESIGN §3) + the S8 premium kit (DESIGN §14) + the existing .ws-* / .vid-* classes in src/styles/globals.css. The white card = the existing white token. No new design language, no new mockups, no new dependencies.
- Proof numbers are fixed: 10 · 30 · 200+ · 267 · 120-day launch. Header/footer chrome is locked.

Before editing:
1. Inspect the repo (workspace-shell.tsx, the plan/build/operate/academy/resources/elements page components, build-tracker.tsx, element-tabs.tsx, and the relevant CSS in src/styles/globals.css) and read every input above.
2. Propose a short plan and confirm scope before changing files — especially the menu shape (10-1) and the content mapping (10-2).

While editing:
- Smallest safe change; one focused concern per commit; no unrelated refactors.
- Server Components by default; keep "use client" only where it already is (build tracker, element tabs). No new client/server boundary mistakes; no secrets (none are needed here).
- NO database, migration, RLS, auth, or approval-gate changes. Locked-for-pending nav + the pending dashboard state must behave exactly as today (only their copy gets clearer).
- Do not touch any public-facing page, route, or copy.
- When you revise a previously-locked menu/curation/copy decision, record the new decision in PROJECT-STATUS so the docs remain the source of truth.

Verification (must pass before reporting done):
- pnpm run typecheck && pnpm run lint && pnpm run build
- git status — clean, no .env changes, no secrets.
- Manual, at 320px AND desktop AND with reduced-motion:
  - Sidebar reads simple: no group-header clutter; Welcome · Plan · Build · Operate · Live Programming · Resources(Videos, Tools & Templates) · Account; no duplicate Program / House Applications.
  - Every private page opens with a clear, plain top summary that tells a brand-new user what this is and what to do next.
  - Build page actions are in the new order and "Watch video" opens the topic's video.
  - Videos page + element Video tabs render populated sample videos; cards look white + premium.
  - Element/topic page is tidy and balanced on a phone (tabs don't crowd); other private pages don't overflow at 320px.
  - A pending (unapproved) user still sees the locked nav + the pending state (with clearer copy); the approval gate is unchanged.

When the sprint is complete, in the same branch: update docs/PROJECT-STATUS.md (§1, §2, change log) and tick S10 in docs/ROADMAP.md.

Report at the end: summary · files changed · commands + results · risks/follow-ups · suggested commit message · sprint status. Push policy: commit + push after every gated sub-step (standing authorization, 2026-06-12) so I review in the open PR; never merge, never push beyond the task branch.
```

</details>

## Checks & results
typecheck ✅ · lint ✅ · build ✅ (39 routes; `/program` added) · adversarial **4-lens exit-gate review (workflow) = PASS**, no blocking/high · UI / copy / curation only — no DB/auth/RLS/approval-gate/CSP/public-page change · approval gate + locked-for-pending behaviour unchanged · Owner Vercel-Preview eyeball at 320px + desktop = **pending** (the merge gate). A full Codex security review was **not required** (no security surface).

## Deviations & learnings
- **Three owner mid-sprint changes** (added after 10-6, as 10-8/10-9/10-10): videos play in-site (embed, not an outbound link); the Welcome page became four premium nav cards; a new `/program` page split two groups out of Operate. The **10-2 "keep all 30 in Operate" decision was superseded by 10-9** once the owner wanted a dedicated Program page (all 30 topics still appear exactly once, now across /program + /operate).
- **In-site video reused the S9 `youTubeEmbedUrl` helper + the youtube-nocookie CSP origin**, so no CSP change was needed — S10 stayed free of any security surface.
- **Double-chrome caught on Preview:** `GATED_PREFIXES` (`site-chrome.tsx`) was missing `/program` (new) **and** `/programming` (a latent gap since S9) → the public header rendered over the workspace shell. Fixed by adding both; the exact-or-`prefix/` match means `/program` does **not** cover `/programming`, so both are listed. **Learning: every new `(workspace)` route must be added to `GATED_PREFIXES`** until the planned (public) route-group refactor lands.
- The exit-gate review also caught + we fixed: a malformed real-`youtube_url` dead card (now falls back to the Sample), a `prefers-reduced-motion` guard on the tab scroll, dead snapshot CSS, equal-height dashboard cards, the mobile tab focus-ring clip, and AA contrast on the Build %.
- Page-copy canon (`03-member-workspace/*`, gitignored) kept in sync throughout, incl. the new `program.md`.

## Follow-ups
- **Owner (before merge):** Vercel-Preview eyeball (320px + desktop + reduced-motion) of the 4-card Welcome, the in-site players, the element-page mobile tabs, and `/program`; **verify or swap the placeholder Sample YouTube IDs** in `src/lib/workspace/sample-videos.ts`. Then merge → flip this record's table to *Date merged* + PR #.
- `/tools` is now an **unlinked** coming-soon placeholder (dropped from the nav, route kept) — delete `src/app/(workspace)/tools/page.tsx` later if it's to be fully retired.
- Per-topic real videos: set `academy_modules.youtube_url` (it wins over the Sample) or manage it in **S11** (admin content management); drop the placeholder Sample list then.
- The dashboard card art slot + the element-page hero panel are ready for per-topic images (owner to supply).
