# Sprint DR3.1 — The Model (`/model`) body to v3

| | |
|---|---|
| **Date** | 2026-07-07 built · 2026-07-08 Codex-reviewed (2 Mediums fixed) — BUILD COMPLETE (pre-merge); owner Preview → merge → `/close` pending |
| **Branch / PR** | `claude/sprint-dr3-1-model-v3` (from `main` @ `5397f8b`) · PR pending |
| **Goal** | Rebuild the `/model` body (the five sections under the v3 photo hero) to the owner's own section mockups — premium, editorial, flawless 320px→desktop — with copy adopted from those mockups (owner decision) and the owner's real photography via the existing asset pipeline. First page of the DR3 series. |

## What shipped

The first page of the **DR3 series** ("remaining public page bodies to v3"). Built `/model` section-by-section to the owner's mockups (`docs/source-assets/design-refs/v3/`); the hero was left unchanged.

- **DR3.1-0 — Asset pipeline.** Extended `scripts/optimize-photos.ts`: 12 embassy photos (4 each café/venue/community), the green tatreez side-strip (jpeg), an **Aswātna partner seal** recolored to cream (`public/assets/partners/aswatna-mark.png`), and the owner's **gold olive branch** — whose light checkerboard background was baked in, so it is keyed adaptively like the DR2 branches (not a passthrough). Owner masters live only in the gitignored source tree; the loose `public/assets/Section*` folders were never committed.
- **DR3.1-1 — Hero + §1.** A first pass built §1 as a photo-stack and (per an earlier owner answer) swapped the hero — both **wrong**: the owner wanted the hero untouched and §1 to match his example. Reverted the hero to the original tatreez image, and **rebuilt §1 as the 3-column "cultural embassy" collage**: left copy (copper flourish + italic headline + olive sprig) beside three columns (café / venue / community), each a big image over three thumbnails whose four photos **slowly rotate through the slots via cross-fade** (`embassy-gallery.tsx`), with a green tatreez side-strip. New auto-motion → **D-DR3.1** (recorded `DESIGN.md` §8), `prefers-reduced-motion` → static collage.
- **DR3.1-2 — §2 "Three layers, one team."** Replaced the `PH-MODEL-02` diagram + role columns with the three **arches** (Global HQ / The Local Partner / Aswātna; key / house / cream Aswātna seal). Arch fills **sampled** from the mockup (`#424528` / `#e5dac9` / `#ac5f3b`). Down-arrows on mobile.
- **DR3.1-3 — §3 "The shared promise."** Full-bleed **dark moss band** (`#2f321b` sampled) — gold olive branch + three gold circle-icons (handshake / shield / people) with captions and hairline dividers.
- **DR3.1-4 — §4.** Three numbered **cream cards** ("Neutral cultural space / Brand protection / Shared accountability") + the **"What this is"** olive-check / terracotta-✗ two-column block around a round bonsai still-life, closing with "**Culture leads.**"
- **DR3.1-5 → footer.** Built the §5 "Could your city hold the next Palestine House?" invite band, then — **owner decision** — **promoted it into the footer** (`site-footer.tsx` `.phx-footer-cta*`) so it is identical on every public page and replaces the plain "Ready to open a House" strip. The standalone §5 was removed from `/model`. Result: one premium closing CTA site-wide, no back-to-back apply bands.
- **DR3.1-6 — Exit gate.** Full-page 320px→desktop responsiveness pass (+ Home footer to confirm chrome consistency); §2 arch-title contrast fix (titles inherit the arch foreground); two owner photo swaps (bonsai + prayer beads for §4; the lantern-lit Palestine House doorway for the CTA); `DESIGN.md` §8 (D-DR3.1) + §12 recorded; trackers updated; this record saved.

**Icons** are from the existing `lucide-react` (no new dependency). **Copy** was adopted from the owner's mockups per his decision (the old `model.md` wording is superseded; the on-disk canonical `docs/page-copy/01-public-pages/model.md` is gitignored/OneDrive and should be updated by the owner — the shipped page is the source of truth).

## Prompt used

Executed live in the session from the plan at `~/.claude/plans/ok-please-execute-sprint-prompt-jazzy-wand.md` (owner-approved), owner-gated DR3.1-0…DR3.1-6, push-per-step. Screenshots at desktop + true 320px (headless-Chrome CDP with device emulation + scroll-to-element) drove per-section verification against the mockups.

## Checks & results

- **typecheck ✅ · lint ✅ · build ✅** after every sub-step (`/model` static, ~3.8 kB; 46 routes).
- **Responsiveness:** verified each section + the footer at desktop and true **320px**; full-page desktop pass; footer re-checked on Home for chrome consistency.
- **Path-guard:** clean of `workspace/ · admin/ · ui/ · middleware · next.config · supabase/ · api/ · env · package*`. The **footer chrome edit (`site-footer.tsx`, `globals.css .phx-footer-cta*`) is the one owner-authorized, in-scope exception** (the closing-CTA decision).
- **Assets:** every shipped jpg < 500 KB; the branch PNG keyed to true transparency; loose `Section*` masters deleted, never committed; masters only under gitignored `docs/source-assets/`.

### Codex review (2026-07-08, pre-merge)

Independent Codex review of the branch diff = **request changes** on two Mediums, both **fixed on-branch** (commit `9613b3d`), zero blocking / zero AGENTS.md gating-check failures:

1. **Footer "See our support" outline CTA cascade** — the v3 public-shell outline-button restyle (`v3.css` `:is(.ph-page,…)[data-slot="button"][data-variant="outline"]`, specificity 0,3,0) out-ranked `.phx-footer-cta-support` (0,1,0), so the shared footer button rendered as the cream secondary instead of the gold outline on **every public page**. Fixed by re-scoping to `.ph-page .phx-footer-cta-support[data-slot="button"][data-variant="outline"]` (0,4,0). Verified in-browser: gold outline restored.
2. **§2 terracotta arch AA** — `#ac5f3b` + cream-100 body (`--text-ui` = 14px normal → AA 4.5:1) computed to **4.13:1**. Deepened the sampled fill to `#9c5230` → ~5.0:1. Verified.

Codex confirmed: footer stays a Server Component; `EmbassyGallery` is the only new client component (interval cleanup + reduced-motion static fallback + no hydration mismatch); assets optimized/<500 KB; no tracked `docs/source-assets`, no loose `Section*`.

## Deviations & learnings

- **Two false starts, both owner-corrected:** the hero was swapped (owner had picked "swap" when asked, then said keep it — reverted); §1 was first built as a photo-stack because the owner's §1 example PNG had an accented "café" filename my tools couldn't open, and it was then deleted with the Section folders — so §1 was designed blind and missed. The owner re-shared the folders; §1 was rebuilt to match exactly. **Lesson:** never delete the owner's example refs before every dependent section is built; copy accented-name refs to an ASCII path up front.
- **Sample the mockup, never eyeball** (reused from DR2): arch/band colors were median-sampled from the mockups (grain-rejecting).
- **`next/image` `fill` needs a definite-height parent:** in a stretched grid cell `height:100%` resolved to 0 and the photo vanished — fixed with an explicit `height: clamp(...)`.
- **Baked backgrounds:** the owner's "transparent" olive branch actually had a light checkerboard baked in (invisible on cream, a grey box on dark) — route such art through the adaptive keyer, not a passthrough.
- **Arch title contrast:** an `h3` inherits a base color rule, not its parent's `color`, unless you set `color: inherit` — the dark-arch titles were invisible until fixed.
- **Footer promotion (owner decision):** resolving the §5-vs-footer redundancy by promoting the rich band into the footer gives one premium CTA on every public page while keeping the footer identical everywhere (the locked-chrome principle is about sameness across pages, which this preserves).

## Follow-ups

- **Independent Codex review = DONE** (2026-07-08) — 2 Mediums fixed on-branch (see above); ready for owner Preview → merge → `/close`.
- Update the canonical `docs/page-copy/01-public-pages/model.md` (OneDrive) to the new mockup-matched copy.
- The green "decoration" master and the dabke photo were not needed (owner chose calm-light §4); they remain in the owner's drop only.
- Continue the DR3 series page-by-page (`/experience`, `/bring-ph`, …), each built to the owner's mockups like `/model`.
