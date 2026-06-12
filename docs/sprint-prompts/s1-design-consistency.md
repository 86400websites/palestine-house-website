# Sprint S1 — Design consistency pass + owner design refresh

| | |
|---|---|
| **Date merged** | 2026-06-12 |
| **Branch / PR** | `claude/sprint-s1-design-consistency` / #15 |
| **Goal** | Ship the S1 audits (tokens, motion, responsive, AA) plus the owner's design refresh: white-background artwork on white sections, dark statement bands, premium white cards, hero balance, mega-menu art swap, two approved copy changes, consistent booklet closer. |

## What shipped

- **Artwork:** owner's 24 white-background PNG finals compressed in place (palette, max quality, dims unchanged): **54.8 MB → 22.4 MB**. Originals backed up to `%TEMP%\ph-art-originals-2026-06-12` until sign-off.
- **Background scheme (owner decision, PROJECT-STATUS §4):** art sections render on white (`art-hero` wash removed; model/bring-ph art sections dropped `bg-muted`); non-art paper sections flipped to the dark ink surface via new **`.ph-section-dark`** (footer's language: white text, white-80 secondary, white-12 hairlines, `--green-100` accents); closing CTA/lead-magnet sections + conversion surfaces (apply/contact heroes, auth) stay light.
- **Cards:** new **`.ph-card`** premium recipe (white, hairline border, `--shadow-sm`, optional `--lift` hover) applied to feel cards, platform card, bring panels, support artefacts, contact + apply form cards; dormant `feature-card`/`live-card` synced for S7.
- **Home hero:** centers in the landing viewport on desktop (`100svh − 72px`), slight breathing room on mobile (art still stacks first).
- **Mega-menus (nav only):** The Model → PH-HIW-01/02/03 · Experience → PH-APPLY-01, PH-LIVE-02, PH-EXP-01.
- **Copy (owner-approved, propagated to `docs/page-copy/`):** mobile nav one-liners → *How it works. / Step inside a House. / What it takes. / Behind every House.* (desktop tooltips unchanged, via new `tipShort` field); Home café card → **"A café where the recipes are here to stay."**
- **/our-support:** closing CTA and booklet lead-magnet swapped so the page ends on the booklet block like every other page.
- **Audits:** 1a tokens — no drift (zero raw hex/px-type/arbitrary values). 1b motion — pass (primitives + LazyMotion strict + global reduced-motion kill). 1c responsive — all ~25 grids collapse to 320px. 1d AA — 17 contrast pairs computed 4.83–17.4:1; **fix:** focus rings on dark surfaces (incl. pre-existing footer gap) → `--green-100` (was ~2.7:1, now 14.7:1).
- **Cleanup:** closing Apply CTA extracted to `src/components/sections/apply-cta.tsx` (6 call-sites, byte-identical markup).
- Also riding along: the sprint-prompt skill update codifying the gated sub-step protocol (commit + push per step).

## Prompt used

<details><summary>Exact implementation prompt (gated master prompt, 14 sub-steps)</summary>

```text
You are my senior engineer for the Palestine House website, working in Claude Code.

Session start: read docs/PROJECT-STATUS.md §1–§2, then the sprint scope + exit gate in docs/ROADMAP.md. CLAUDE.md governs everything below.

Sprint: S1 — Design consistency pass (1a–1d) + owner-directed design refresh
Branch: claude/sprint-s1-design-consistency — create from latest main IN THIS WORKING COPY:
the 22 replaced artwork PNGs in /public/assets/art/ and the updated .claude/skills/sprint-prompt/SKILL.md
are uncommitted here and must ride onto this branch. Do not start from a fresh clone.

Goal:
Ship the S1 design consistency pass (tokens/type, motion + reduced-motion, responsive 320px+,
accessibility AA) AND the owner's design refresh (2026-06-12): new white-background artwork
integrated with white image-section backgrounds, dark non-image sections with white text
(light kept for closing CTA sections), rebalanced Home hero, swapped mega-menu artwork, two
owner-approved copy adjustments, and a consistent booklet section on /our-support.
Exit: whole public shell consistent with docs/DESIGN.md (as amended by the owner decisions
recorded this sprint); AA verified; zero visual drift between pages.

Execute in gated sub-steps (one owner gate after each):
1.  Art intake — compress the 22 replaced PNGs in place FIRST (lossless/near-lossless, visual
    parity, record before/after KB), THEN commit them (the originals must never enter git
    history); commit the SKILL.md update separately; push; open a draft PR titled
    "S1 — Design consistency pass" with gh so the owner can review every step. Verify the site
    builds and renders with the new art.
2.  Background scheme on Home only (reference page): sections containing artwork → white
    background so the white-background art blends in; non-image content sections → dark surface
    using an existing dark token from docs/DESIGN.md §3 (e.g. the footer's dark surface) with
    text flipped to white/on-dark tokens; the closing CTA/apply section keeps its current light
    treatment. No new hex values — propose token choices in the report. Owner reviews on the PR.
3.  Roll the approved scheme out to all remaining public pages + auth shells + 404/error with
    identical rules; record the scheme as an owner decision in docs/PROJECT-STATUS.md §4.
4.  Home hero balance: shift the hero content down from the nav so the landing viewport shows
    the hero composed and well balanced (hero fills the first screen, nothing cramped under the
    header). Desktop + mobile; keep the owner's earlier mobile rule (hero art stacks first).
5.  Mega-menu artwork swap (header nav ONLY, nothing else): The Model panel → PH-HIW-01,
    PH-HIW-02, PH-HIW-03 · Experience panel → PH-APPLY-01, PH-LIVE-02, PH-EXP-01.
6.  Copy proposals (NO code changes this step): (a) mobile nav menu one-liners shortened to
    3–4 words each — simple, clear, to the point; (b) 2–3 replacement options for the Home
    card line "A café where the za'atar is someone's grandmother's recipe." — simple yet
    profound, food-related, not sentimental/dramatic. All options follow
    docs/page-copy/00-global/brand-voice.md (warm, short, concrete). Report the options and
    WAIT for the owner's picks.
7.  Apply the owner-chosen strings; update the canonical files in docs/page-copy/ to match
    (docs stay source of truth) and record both copy deviations as owner decisions in
    docs/PROJECT-STATUS.md §4.
8.  /our-support booklet section: align it to the shared booklet/lead-magnet pattern used on
    the other pages — same component, layout, and behavior; no bespoke variant.
9.  (1a) Tokens/type audit across the whole shell (post-recolor): grep src/ for hardcoded hex,
    raw px type sizes, ad-hoc spacing; every value traces to a token; fix drift.
10. (1b) Motion audit: all animation through the shared primitives, restrained register per
    DESIGN.md §8; prefers-reduced-motion disables/replaces every animation (Framer + CSS).
11. (1c) Responsive audit: every public + auth route at 320/768/1024/1440; fix overflow,
    wrapping, tap targets, chrome behavior — including the new dark sections and hero balance.
12. (1d) Accessibility AA: contrast on every token pairing — especially white text on the new
    dark sections; visible focus everywhere; skip link; tooltips + mega-menus fully keyboard
    operable (open/close/Escape); landmarks + alt text.
13. Optional, only if zero-drift is certain: extract the repeated Apply-CTA block (~11
    call-sites) into one shared component with identical rendering; skip if any visual risk.
14. Sprint exit gate — full-diff review of the whole sprint, copy audit (verbatim everywhere
    except the two owner-approved changes from step 7), fix everything found, update
    docs/PROJECT-STATUS.md (§1, §2, §4, change log) + tick S1 in docs/ROADMAP.md.

Per-step protocol (every sub-step, no exceptions):
1. Read the exact locked input(s) for this sub-step BEFORE coding.
2. Build it: smallest safe change, one focused concern.
3. Verify: pnpm run typecheck && pnpm run lint && pnpm run build; spot-check the affected
   routes and confirm nothing else broke.
4. Self-review the diff for bugs and fix them before committing (full review at step 14).
5. Commit AND push to the task branch — every sub-step, so the owner can review live in the
   open PR.
6. Report in ≤6 lines: what shipped, checks run, anything flagged — then STOP and WAIT for
   "proceed". Never start the next sub-step without it.

Owner remote commands: "proceed" = next step · "pause" = hold · "status" = where are we ·
"fix <thing>" = fix before continuing · "skip to <n>" = jump (record the skip in PROJECT-STATUS.md).

Locked inputs (never invent, never paraphrase):
- Copy: verbatim from docs/page-copy/ — the ONLY permitted changes are the two owner-directed
  ones in steps 6–7, applied only after the owner picks, and propagated back into the canonical
  copy files. Any new string (aria-labels, alt text) follows
  docs/page-copy/00-global/brand-voice.md.
- Design: approved mockups in docs/page-designs/public/ + auth/ + shared/ chrome and the
  design-system tokens (values in docs/DESIGN.md §3–§11), as amended ONLY by the owner
  decisions in this prompt (background scheme, hero balance, mega-menu art, booklet
  consistency). Where this prompt is silent, the mockups win.
- Artwork: the replaced PH-* files in /public/assets/art/ are final owner art — compress in
  place only; never re-export, crop, or recolor.
- Proof numbers are fixed: 10 · 30 · 200+ · 267 · 3. Header/footer chrome structure is locked —
  the mega-menu image swap in step 5 is the only chrome change permitted.

Before editing:
1. Inspect the repo (package.json, next.config.ts, src/app/) and read every locked input above.
2. Propose a short plan from your inspection and confirm scope before changing files.

While editing:
- Smallest safe change; one focused concern per commit; no unrelated refactors; no new
  dependencies.
- Server Components by default; "use client" only when interactivity requires it.
- Client code reads only NEXT_PUBLIC_* env vars; never hardcode or commit secrets; never
  commit .env.local.

Verification (must pass before reporting done):
- pnpm run typecheck && pnpm run lint && pnpm run build
- git status — .env.local untracked, no secrets staged
- Manual: every public + auth route at 320px and desktop — art blends into white sections,
  dark sections read cleanly with white text, no drift between pages; Home landing viewport
  shows the rebalanced hero; mega-menus show the six swapped artworks; mobile nav one-liners
  are the approved short strings; /our-support booklet block matches the shared pattern;
  keyboard-only pass (skip link, tooltips, mega-menus incl. Escape); OS reduced-motion on →
  no movement; AA contrast spot-checks on the new dark sections.

When the sprint is complete, in the same branch: update docs/PROJECT-STATUS.md (§1, §2, §4,
change log) and tick the sprint in docs/ROADMAP.md.

Report at the end: summary · files changed · commands + results · risks/follow-ups · suggested
commit message · sprint status. Push policy: commit + push after every gated sub-step
(standing authorization, 2026-06-12) so the owner reviews in the open PR; never merge, never
push beyond the task branch.
```

</details>

## Checks & results

typecheck ✅ · lint ✅ (zero warnings) · build ✅ (21/21 routes) — after every sub-step · copy audit verbatim (two approved deviations only) ✅ · encoding scan ✅ · owner Preview review per pushed step + merge (#15) ✅

## Deviations & learnings

- **Owner added scope mid-sprint** (after step 1): all art-bearing cards white + premium card polish site-wide — folded into steps 2–3; recorded with the scheme decision in PROJECT-STATUS §4.
- **`gh` CLI is not installed** on the owner's machine — the owner opens PRs from the push link. Don't script `gh` in future prompts.
- **`docs/page-copy/` is gitignored** (public-repo mitigation): the copy canon lives only in the OneDrive-synced working folder, never on GitHub. Canon edits are real but invisible to PRs — and a bare fresh clone has no copy docs.
- **PowerShell 5.1 hazards (two incidents):** (1) embedded double quotes in `git commit -m` here-strings break argument passing — avoid `"` inside commit messages; (2) piping file content through `Get-Content`/`Set-Content` mojibakes UTF-8 (read as ANSI) — **never bulk-edit source files via PowerShell**; use the Edit tool. The corruption was caught in self-review and reverted before any push.
- Two card patterns (`feature-card`, `live-card`) were dormant (no call-sites) and were nearly missed by the markup-driven rollout — audit CSS patterns too, not just rendered pages.
- Focus-ring contrast on dark surfaces was a **pre-existing** AA gap (footer) surfaced by the new dark sections — computed contrast checks beat eyeballing.

## Follow-ups

- Owner: `@dependabot ignore this major version` on #9–#12 (tracked in PROJECT-STATUS §1).
- Optional: tatreez divider between /our-support's two adjacent white statement sections — offered, not requested; revisit if the page feels flat on the live site.
- Artwork originals backup (`%TEMP%\ph-art-originals-2026-06-12`) can be deleted once the owner is happy with the live art.
- S7 will reuse `.live-card` (already synced to the white recipe) — keep the premium card language when the session cards go live.
- Next: **S2 — DB phase 1**; create the non-production Supabase project (separate free org) before any schema work (§4 decision).
