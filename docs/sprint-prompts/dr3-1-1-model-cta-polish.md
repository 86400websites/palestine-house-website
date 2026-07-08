# Sprint DR3.1.1 — `/model` embassy + footer-CTA polish

| | |
|---|---|
| **Date** | 2026-07-08 built — BUILD COMPLETE (pre-merge); owner Preview → merge → `/close` pending |
| **Branch / PR** | `claude/sprint-dr3-1-1-model-cta-polish` (from `main` @ `f775673`, post-DR3.1-merge) · PR pending |
| **Goal** | A follow-up polish pass on the merged DR3.1 `/model` page + the site-wide footer CTA, driven by the owner's marked-up screenshots — premium, editorial, flawless 320px→desktop. Frontend/design + footer chrome only. |

## What shipped

Owner-gated sub-steps **1a…1f** plus several mid-flight owner refinements, push-per-step (commits `42af76e…63e087e`).

- **1a — Horizontal tatreez band asset + generator.** `scripts/make-tatreez-band.ts` derives one **seamless** horizontal tile from the *already-committed* vertical strip `ph-photo-embassy-tatreez.jpg` (autocorrelation finds the motif period; the crop lands on a motif-free gap row so `repeat-x` seams fall in flat green; rotate 90° → a horizontal row of the ornate green/gold motif). Output committed: `public/assets/photos/ph-photo-embassy-tatreez-band.jpg` (237×500, 9 KB). Reads the committed output (not the gitignored master) → reproduces on any clone.
- **1b — Removed the vertical green side-strip** from the "cultural embassy" section (the `.model-embassy-strip` div + its CSS incl. the 880px `display:none`); the copy column regained its left breathing room.
- **1c — `TatreezBand` component** (`src/components/shared/tatreez-band.tsx`, server-safe; `ornate` default reuses the tile as a `repeat-x` background, `frieze` fallback composes the existing `TatreezDivider`) — first placed as a divider after the embassy section, and the **~12rem section gap before "Three layers, one team." was collapsed** to a balanced join via double-class `.model-embassy.ph-section-lg` / `.model-network.ph-section-lg` padding overrides (out-specify the globals `.ph-section-lg` cascade).
- **1d — Enlarged the collage** (rebalanced the embassy grid to give the gallery more width with a `15rem` floor on the copy column so it's never cut off, trimmed the gaps).
- **1e — Footer CTA (site-wide):** the photo fills the full CTA row (min-height + grid stretch — no dark strip beneath), the **white hairline** (`.phx-footer-apply` `border-bottom`) that read as a line under the photo was removed, and the **`TatreezBand` was added at the base of the CTA** as the divider.
- **1f — Exit gate + owner refinements:** full 320px→desktop pass, self-review, path-guard, `DESIGN.md`/`PROJECT-STATUS`/`ROADMAP` + this record.

### Owner mid-flight refinements (2026-07-08, folded into 1f)

- **Removed the collage auto-rotation** → the embassy collage is now **static** (`embassy-gallery.tsx` no longer a client component; no framer-motion, no interval). **D-DR3.1 auto-motion exception RETIRED** (`DESIGN.md` §8). Side benefit: `/model` client JS dropped from **3.81 kB → 2.31 kB**.
- **Removed the tatreez band from the embassy section** — the owner wanted the ornament **only at the footer** (kept there). The gap-collapse padding stayed, so the join is still tight.
- **Subtle "card" per set** — each column (café / venue / community) is a subtle card so they read grouped; recolored to a warm **cream** (`--cream-100`) "matching the background," not stark white.
- **Rosette ornament** — the 8-point star column ornament was swapped for a copper **tatreez rosette** (eight teardrop petals + center), matching the owner's reference.
- **Photos fill their frames edge-to-edge** (`object-fit: cover`) in uniform 4/5 frames inside the cream cards; the **venue set was reordered** so its hero is a portrait shot (crops least). The footer invite photo fills its (taller, wider) panel edge-to-edge too. *(An original-ratio `contain` pass — cream/moss matte, no crop — was built first at the owner's request, but the letterbox on the mixed portrait/landscape sources looked wrong ("absurd"), so the owner reverted to edge-to-edge fills — the final state.)*

## Prompt used

Executed live in the session from the plan at `~/.claude/plans/please-execute-sprint-prompt-we-snazzy-fern.md` (owner-approved via ExitPlanMode), owner-gated 1a…1f, push-per-step, with the owner sending marked-up screenshots + several mid-flight corrections (static collage, cream cards, original-ratio photos, footer photo original ratio). Headless-Chrome (CDP) screenshots at desktop + true 320px drove per-step verification.

## Checks & results

- **typecheck ✅ · lint ✅ · build ✅** after every sub-step (46 routes; `/model` static, **2.31 kB**).
- **Responsiveness:** verified the embassy + footer at desktop and true **320px** (cards stack, big readable photos, no horizontal overflow); footer verified on `/model` (the shared server component is identical on every page).
- **Path-guard:** clean — 8 files only: `src/app/model/page.tsx`, `src/components/sections/model/embassy-gallery.tsx`, `src/components/layout/site-footer.tsx`, `src/components/shared/tatreez-band.tsx` (new), `src/styles/globals.css`, `src/styles/pages.css`, `public/assets/photos/ph-photo-embassy-tatreez-band.jpg` (new), `scripts/make-tatreez-band.ts` (new). **Nothing** under workspace / admin / api / middleware / next.config / supabase / env / package. The footer chrome edit is the owner-authorized, in-scope exception (DR3.1 precedent).

## Deviations & learnings

- **The image-ratio brief round-tripped.** cover (matched the card mockup) → the owner asked emphatically for **original ratios, never cropped** → `contain` on a cream/moss matte → the owner saw it and said it "looks absurd" → **back to `object-fit: cover` (edge-to-edge fills), the final state.** Learning: with mixed portrait/landscape sources there's no clean uniform "no-crop" layout — `contain` letterboxes, native ratios stagger the rows — so edge-to-edge `cover` (crop-to-fill) is what reads clean; show the owner the `contain` result quickly rather than assuming it's what "original ratios" will look like.
- **Mixed portrait/landscape sources are the crux.** The embassy photos are a mix of 800×1200 and 1200×800. Uniform 4/5 frames + `cover` keep the collage aligned and filled; reordering the venue set to a portrait hero minimizes its crop (a landscape hero in a 4/5 frame crops heavily).
- **Seamless photo-tile band:** a flat green+gold graphic tiles cleanly with `repeat-x` if the crop edges land in the solid-green gaps between motifs — verified by rasterizing/compositing test bands before shipping.
- **`next/image fill` under grid-stretch** resolves fine (a stretched grid item has a definite block size); the footer photo fills without a fixed height.
- **Don't run `pnpm build` while `pnpm dev` is live** — the production build clobbers dev's `.next` chunks (`Cannot find module './###.js'`); build at the gate with dev stopped.
- **Rosette at 16–20px reads as a blob in a 1× screenshot** — verify small vector ornaments by rasterizing the SVG at high resolution, not by upscaling a 1× capture.

## Follow-ups

- **Independent Codex review** — optional; prompt provided at sprint end (frontend/design only, so low-risk).
- **Image fit — RESOLVED:** edge-to-edge `cover` fills (owner, 2026-07-08), after trying and rejecting the original-ratio `contain` matte.
- The `frieze` variant of `TatreezBand` is available (one prop) if the owner ever prefers the lighter vector divider over the ornate band.
- Carryover from DR3.1: update the canonical `docs/page-copy/01-public-pages/model.md` (OneDrive) — the shipped page is the source of truth.
