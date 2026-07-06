# DR2 — Home v3 sections + chrome: stages · proof band · footer

> **Status: BUILD COMPLETE (pre-merge), 2026-07-06.** Branch `claude/sprint-dr2-stages-proof-footer`, owner-gated DR2-0…DR2-7, push-per-step. Final stamp (PR number, merge hash, post-merge `/close`) added at close.

## What this sprint was

Bring the three owner-mocked surfaces to final v3 from the new DR2 mockups (masters: `docs/source-assets/design-refs/v3/` — `photos/` 3 stage photos · `art/` Al-Aqsa line-art + 4 olive branches · `refs/` stages-section / proof-band / footer mockups + palette poster · `logo/logo-master.png`):

- **Home "One path, three stages"** → three moss photo cards with arch-notch "01/02/03" plates + the line-art beside the grid.
- **Proof band** → dark olive `.ph-section-olive` surface, branch ornaments, warm-sand numerals, stats over the flowing caption. Numbers verbatim: 10 · 30 · 200+ · 267 · 120.
- **Footer** (global chrome) → `--moss-950` inset rounded card, Arabic line, mockup labels, centered tagline + sprig. Apply band + single-conversion rule survived.

**Owner decisions (2026-07-06):** scope = these mockups only (remaining public page bodies → **DR3**) · palette **additive only** (three moss tokens sampled from the mockups; the palette poster recorded in `DESIGN.md` §3 as reference, NOT a retune — `#B4552D` terracotta etc. deliberately unadopted) · a dedicated mobile sub-step inserted (DR2-6), exit gate became DR2-7.

## Sub-steps & commits

| Step | Commit | Shipped |
|---|---|---|
| DR2-0 | `7d21e2f` | Sprint open (docs-only): DR2 row in ROADMAP, PROJECT-STATUS flip |
| DR2-1 | `6070dd8` | Masters sorted out of `public/` into the v3 source tree; `optimize-photos.ts` extended (3 stage photos → jpg ≤300 KB; adaptive corner-sampled background keying → transparent palette PNGs for line-art + branches; skip-if-absent for fresh clones); ids registered (`ph-photo-stage-*`, `ART_SOURCES`); + the DR2-6/7 renumber |
| DR2-2 | `6fefa35` | Additive tokens `--moss-700 #393C29` / `--moss-900 #20230E` / `--moss-950 #1B1E14` + `.ph-section-olive` modifier (composes with `.ph-section-dark`); mockup numerals resolve to existing `--copper-300` — no sand token needed |
| DR2-3 | `130abc5` | Stages rebuild: centered head + approved sub-line, photo cards, arch-notch plates, line-art (drops ≤1100px container; cards stack ≤860px). Copy table approved pre-build |
| DR2-4 | `b112622` | Proof band: olive surface, approved labels, copper stat hairlines, caption (h2 kept, displayed inline) below stats, two branch ornaments clipped at band edges. Copy table approved pre-build |
| DR2-5 | `37afbe3` | Footer: moss inset card, Arabic line `بيت فلسطين في كل مدينة` (`lang="ar" dir="rtl"`, system-font fallback), columns per mockup (Our Support · Why bring one. · Sign In · Terms of Use · Privacy Policy), white caps titles, centered tagline between hairlines + crossed-olive sprig, copyright kept. Copy table approved pre-build |
| DR2-6 | `0bdd26a` | Mobile pass 320→768px: fifth stat centers on its own row ≤860px; ornaments drop early; footer inset slims + sprig drops ≤560px; plate numeral → `--text-xl` |
| owner fixes | `cd5a749` | White stage-card titles (global heading color was winning over the panel cream) · desktop nav hover tooltips switched to the mobile `tipShort` set · supplied logo re-run through the pipeline → **byte-identical mark** (already live; master now at `logo/logo-master.png` for fresh clones) |
| DR2-7 | `59ec86e` | Exit gate: 3-lens adversarial full-diff review + fixes, path-guard CLEAN, `DESIGN.md` §3/§5/§6/§12 updated, trackers + this record |
| post-gate owner fix | *(follow-up commit)* | Owner: keep the olive ornaments on mobile — the exit gate had hidden the band branches ≤1000px and the footer sprig ≤560px; instead they now **rescale into text-free zones** (left branch tip stays inside the gutter per the graze math; right branch tucks into the bottom padding below the caption; sprig 56px in the corner, clear of the centered copyright at 320px) |

## Exit-gate review (DR2-7)

Three parallel adversarial lenses over the full diff vs `main` (CSS/cascade+layout · accessibility with computed ratios · invariants/copy/security). **Zero blocking, zero high except one contrast item — all findings fixed or consciously accepted:**

**Fixed on-branch (6):** footer copyright rgba .45→.55 (4.42:1 → 5.95:1 AA) · left branch graze on the first stat label: `translate(-40%)` + ornaments hidden ≤1000px (both lenses flagged the -28%/860px combo) · proof section `aria-labelledby` (h2 sits after the stats in DOM per mockup) · dead `.phx-footer-arabic` line-height (specificity) · arch-plate 1px overlap (sub-pixel photo hairline at fractional zoom) · *(from the a11y lens's clean-categories: nothing else moved).*

**Accepted, documented (4):** `ph-art-branch-3.png` (100 KB) + its registry entry ship unused — **reserved for DR3 ornament use** · `sizes` media queries approximate the container-query breakpoints (±20px fetch band; hidden images never load) · `optimize-photos.ts` skip-if-absent exits 0 on a typo'd master name (fits the fresh-clone-per-sprint flow; logs `skip …`) · caption h2 after the stats is a usability wart, not a WCAG failure (mitigated by `aria-labelledby`).

**Verified clean:** path-guard — zero files under workspace/admin/ui/middleware/next.config/supabase (18 files, all public shell + docs + assets + script) · proof numbers verbatim · Apply band + all 14 pre-existing Apply strings untouched, no CTA added/removed · footer/header still single shared components; footer renders only via `SiteChrome` on `.ph-page` (sticky-footer math + cream surround + `:has()`-less fallback all hold) · container `page` declared on `.ph-page`, ancestor of all new `@container` rules · no new deps/routes/`"use client"`/env · all five footer link targets exist · AA computed on every new pair (numerals 6.33:1 · labels 10.67:1 · card body 9.93:1 · titles 16.9:1 · links 11.14:1 · Arabic 8.86:1 at the correct 4.5 bar) · reduced-motion untouched (no new animation).

## Deviations & learnings

- **Footer BrandLogo kept** (arch + wordmark) instead of the mockup's stacked text-only "PALESTINE HOUSE" — locked shared brand component; owner can request the stacked variant ("fix footer logo").
- The owner's "new" logo file regenerates a **byte-identical** `ph-logo-mark.png` — the live mark already matched. Deterministic pipeline made this provable in seconds.
- The proof-band mockup's dark green is **much darker** than it reads in thumbnails (`#20230E`) — sample, never eyeball.
- Owner dropped all 13 masters into `public/assets/photos/` — sorting them into the gitignored tree is now part of the asset step; the pipeline's skip-if-absent means fresh clones run green with only the current sprint's masters.
- globals.css imports pages.css/v3.css **before its own rules** — any pages.css override of a globals rule needs a specificity bump, not source order (bit us twice: caption colors, Arabic line-height).

## Follow-ups (non-blocking)

- DR3: remaining public page bodies to v3 (`/model` `/experience` `/bring-ph` `/our-support` bodies + `/live` `/about` `/focus-areas` `/contact` + auth + legal); `ph-art-branch-3` reserved for it.
- Owner Preview eyeball at phone width (code-level mobile audit ran; real-device check pending).
- Optional: stacked footer wordmark if the owner wants the mockup's exact brand block.

## Prompt used

The gated master prompt from the DR2 plan (`~/.claude/plans/ok-please-build-the-serialized-mccarthy.md`, approved 2026-07-06) — sub-steps DR2-0…7 with per-step copy-table gates, additive-only palette rule, and the standard per-step protocol (read locked inputs → smallest change → typecheck/lint/build → self-review → commit+push → report ≤6 lines → STOP for "proceed").
