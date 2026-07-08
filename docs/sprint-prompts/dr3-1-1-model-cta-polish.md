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
- **All photos at their original ratios** — `object-fit: contain` on a cream (collage) / transparent-moss (footer) matte, **never cropped**. Uniform 4/5 frames keep the columns aligned; the **venue set was reordered** so its hero is a portrait shot (fills like café/community). The footer invite photo likewise shows whole (contain) and its letterbox blends into the moss footer; its column was widened.

## Prompt used

Executed live in the session from the plan at `~/.claude/plans/please-execute-sprint-prompt-we-snazzy-fern.md` (owner-approved via ExitPlanMode), owner-gated 1a…1f, push-per-step, with the owner sending marked-up screenshots + several mid-flight corrections (static collage, cream cards, original-ratio photos, footer photo original ratio). Headless-Chrome (CDP) screenshots at desktop + true 320px drove per-step verification.

## Checks & results

- **typecheck ✅ · lint ✅ · build ✅** after every sub-step (46 routes; `/model` static, **2.31 kB**).
- **Responsiveness:** verified the embassy + footer at desktop and true **320px** (cards stack, big readable photos, no horizontal overflow); footer verified on `/model` (the shared server component is identical on every page).
- **Path-guard:** clean — 8 files only: `src/app/model/page.tsx`, `src/components/sections/model/embassy-gallery.tsx`, `src/components/layout/site-footer.tsx`, `src/components/shared/tatreez-band.tsx` (new), `src/styles/globals.css`, `src/styles/pages.css`, `public/assets/photos/ph-photo-embassy-tatreez-band.jpg` (new), `scripts/make-tatreez-band.ts` (new). **Nothing** under workspace / admin / api / middleware / next.config / supabase / env / package. The footer chrome edit is the owner-authorized, in-scope exception (DR3.1 precedent).

## Deviations & learnings

- **The image-ratio brief evolved live.** First pass matched the owner's card mockup with `object-fit: cover` (uniform crop); the owner then insisted (emphatically) on **original ratios, never cropped**. Cover → contain. Learning: when a reference mockup shows cropped fills but the owner says "original ratios," honor the words — the mockup itself was a crop.
- **Mixed portrait/landscape sources are the crux.** The embassy photos are a mix of 800×1200 and 1200×800. `contain` in a uniform frame keeps columns aligned but letterboxes the off-orientation images; native ratios (no frame) avoid letterbox but stagger the rows (esp. the venue set, which has both orientations). Chose **contain + uniform 4/5 frames + a cream matte that blends the letterbox + a venue reorder so all three heroes are portrait**. **Known tradeoff:** some landscape *thumbnails* still carry a subtle cream matte — flagged to the owner with an offer to switch to edge-to-edge fills.
- **Seamless photo-tile band:** a flat green+gold graphic tiles cleanly with `repeat-x` if the crop edges land in the solid-green gaps between motifs — verified by rasterizing/compositing test bands before shipping.
- **`next/image fill` under grid-stretch** resolves fine (a stretched grid item has a definite block size); the footer photo fills without a fixed height.
- **Don't run `pnpm build` while `pnpm dev` is live** — the production build clobbers dev's `.next` chunks (`Cannot find module './###.js'`); build at the gate with dev stopped.
- **Rosette at 16–20px reads as a blob in a 1× screenshot** — verify small vector ornaments by rasterizing the SVG at high resolution, not by upscaling a 1× capture.

## Follow-ups

- **Independent Codex review** — optional; prompt provided at sprint end (frontend/design only, so low-risk).
- **Owner decision pending:** keep the subtle cream matte on landscape thumbnails/footer (cost of never cropping) or switch those to edge-to-edge fills.
- The `frieze` variant of `TatreezBand` is available (one prop) if the owner ever prefers the lighter vector divider over the ornate band.
- Carryover from DR3.1: update the canonical `docs/page-copy/01-public-pages/model.md` (OneDrive) — the shipped page is the source of truth.
