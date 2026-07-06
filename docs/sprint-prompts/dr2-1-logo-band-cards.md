# Sprint DR2.1 — Brand lockup rollout + Home band polish + bring-ph stage cards

| | |
|---|---|
| **Date built** | 2026-07-06 (pre-merge; **independent Codex review = APPROVE, zero blocking / zero non-blocking**; owner Preview → merge → `/close` pending) |
| **Branch / PR** | `claude/sprint-dr2-1-logo-band-cards` / PR # TBD |
| **Goal** | Owner-requested ad-hoc polish on the DR1/DR2 public surfaces: use the owner's new logo site-wide in the public chrome, refine the Home proof band (2-line caption + fuller corner olive branch), reuse the Home "One path, three stages" photo cards on `/bring-ph`, and verify responsiveness 320→1440. Frontend/design only — **does not consume DR3** (public page bodies), which stays next. |

## What shipped

- **New-logo rollout in the public chrome (DR2.1-1/-2 + owner fix).** The owner's full "Our Culture Embassy" lockup master → gitignored `docs/source-assets/design-refs/v3/logo/`; `scripts/optimize-photos.ts` extended to key the baked-in checkerboard to alpha and ship two PNGs: `public/assets/logo/ph-logo-lockup.png` (color, charcoal text, 900×422, 44 KB) and `ph-logo-lockup-dark.png` (white text, copper arch kept, 35 KB, derived from the color master — the owner's white master is white-on-light and can't be keyed directly). `BrandLogo` (`src/components/layout/brand-logo.tsx`) renders both lockups + the existing arch mark, all `aria-hidden`, and CSS in `src/styles/v3.css` shows exactly one per surface: **color lockup on the solid header · white lockup on the moss footer + the `[data-overlay]` photo header · copper arch mark alone ≤420px**. Header link keeps `aria-label`; the linkless footer instance adds an sr-only "Palestine House — Our Culture Embassy". No `priority` on any brand image (see learnings). The prior DR1 real-text wordmark/tagline approach is fully removed.
- **Proof-band polish (DR2.1-3).** The caption between the two olive sprigs drops to `--text-lg` + `max-width:48rem` + `text-wrap:balance`, scoped `@container page (min-width:1001px)`, so it reads as **two balanced lines on desktop** while ≤1000px keeps the DR2-approved rendering pixel-identical. The bottom-right corner olive branch enlarged from `clamp(110px,14vw,230px)`/`translate(24%,30%)` to `clamp(150px,17vw,270px)`/`translate(8%,10%)` (sizes attr 270px) so it reads as a full corner ornament instead of a corner-cropped sliver. Proof numbers untouched (10 · 30 · 200+ · 267 · 120-day launch).
- **bring-ph stage cards (DR2.1-4).** Home's stage-card grid extracted to a shared `src/components/sections/stage-cards.tsx` (`StageCards`, cards only). Home renders it unchanged inside `.v3-stages-layout` (Al-Aqsa art column intact); `/bring-ph` §4 "One path, three stages" swaps its PH-HIW artwork triptych for the same cards, full-width in a `.bring-stages-cards` wrapper (no side art, owner's "cards only" call). Removed: `BRING_STAGES` const, `.bring-triptych`/`.bring-stage*` CSS, the `PH-HIW-01..03` registry entries + the three `public/assets/art/PH-HIW-0*.jpg` files. The section's own head + the "You won't face it all at once…" close line stay verbatim; the cards reuse Home's owner-approved DR2 copy (owner copy gate).
- **Responsive sweep (DR2.1-5).** DevTools-protocol device-emulated screenshots at true 320/430/1024/1280/1440 (plain headless clamps windows to ~496px). Verified both header states, footer lockup, proof band 2-line caption + corner branch, and both stages sections; caught + fixed a chrome cascade bug (below).

## Prompt used

Executed directly in this Claude Code session (not a pasted prompt) as a gated master prompt per the `/sprint-prompt` DR2.1 plan — sub-steps DR2.1-0…DR2.1-6, one owner "proceed" gate after each, commit + push per sub-step. Plan file: `~/.claude/plans/please-execute-sprint-prompt-with-generic-yao.md`. Two owner mid-/post-sprint changes were folded in on request (white-lockup-PNG on dark chrome at DR2.1-2; the proof-band olive-branch desktop/mobile refinement after the gate — see below).

## Checks & results

typecheck ✅ · lint ✅ · build ✅ (46 routes) · responsive matrix 320→1440 ✅ (visual, CDP device-emulation) · path-guard ✅ (zero workspace/admin/middleware/next.config/supabase/api/env/package files in the diff) · repo hygiene ✅ (masters gitignored, never tracked) · exit-gate adversarial review ✅ (3 lenses → per-finding verification; 2 confirmed findings fixed, 2 refuted) · **independent Codex review ✅ = APPROVE, zero blocking / zero non-blocking** (path-guard, proof numbers verbatim, logo confined to public chrome/assets/CSS, shared StageCards used only on Home + /bring-ph all confirmed; Codex noted it could not source-compare copy because `docs/page-copy/` is gitignored — expected, OneDrive is canon).

## Deviations & learnings

- **Owner fix mid-sprint:** after DR2.1-2 shipped the mark + real-text lockup on dark chrome, the owner dropped a **white logo PNG** and asked to "use the actual logo instead of texts." The white master is white text on a light checkerboard (unkeyable), so the dark lockup is derived from the **color** master (charcoal→white, copper kept) in the pipeline — pixel-registered to the color one, reproducing the owner's white file exactly (verified composited on the moss color).
- **Cascade bug (found DR2.1-5, fixed same step):** `.phx-brand img { display:block }` outranked the class-only show/hide rules, so the header rendered the mark **alongside** the lockup. Fixed by img-qualifying every brand show/hide rule (`img.phx-brand-lockup` etc.) so they match the base rule's specificity and win by order.
- **Exit-gate review (DR2.1-6), 2 confirmed findings fixed:** (1) `BrandLogo` forwarded `priority` to all three header `<Image>`s → the two hidden variants were high-priority preloaded on every page, racing the hero LCP. Dropped `priority` entirely — the variants are now lazy, and a `display:none` lazy `<img>` isn't fetched until shown, so hidden variants don't download on load at all. (2) The ≤420px hide comment claimed the `:is()` selector "outranked" the overlay show rule by specificity when it only tied (0,3,1) and won by source order; hardened the hide with a double-class selector `img.phx-brand-lockup.phx-brand-lockup--dark` = (0,4,1) so the mark-only fallback holds by specificity, not order. **2 findings refuted on verification.**
- **DESIGN.md** §5 (chrome) + §9 (brand lockup) rewritten from the DR1 "mark PNG + real-text wordmark, tagline not in chrome" scheme to the DR2.1 two-lockup-PNG system.
- The gated workspace/admin shells keep their inline-SVG `Logo` (S8 decision); favicon/apple-icon/OG unchanged (the arch mark is unchanged; OG already carries the tagline lockup) — the lockup is public-chrome only.

## Post-gate owner change (2026-07-06, commit `a2086f1`)

- **Proof-band olive branches, owner refinement.** Desktop: removed the two small sprigs that flanked the caption sentence (`home-proof-caption-branch` + `.is-left`) — the two corner branches (`--left` branch-4, `--right` branch-1) stay. Mobile (≤1000px): dropped **all** the desktop branches and replaced them with a single small `ph-art-branch-3` sprig bookending the band — one centered at the top (`--m-top`), one mirrored (`scaleY(-1)`) at the very bottom (`--m-bottom`). Retired the old mobile `--top` garland and the `--left/--right` mobile rescale rules. typecheck/lint/build green; verified on rendered desktop 1280 + mobile 375/320 (CDP emulation).

## Follow-ups

- Owner Preview eyeball: the PNG↔white-lockup swap on Home scroll (instant swap, colors fade); the 2-line proof caption at ~1280–1536px; bring-ph cards vs Home's.
- On first scroll on an overlay route (e.g. Home), the newly-shown color lockup fetches lazily (sub-100ms, one-time) — acceptable trade for not racing the LCP; revisit only if a flash is reported.
- DR3 (remaining public page bodies to v3) stays the next sprint — scope with `/sprint-prompt DR3`.
