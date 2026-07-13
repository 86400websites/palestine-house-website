# Sprint DR3.2 — Bring a House (`/bring-ph`) redesign to owner mockups

| | |
|---|---|
| **Date** | Built 2026-07-13 → 2026-07-14 · **merge pending** (owner merges the PR) |
| **Branch / PR** | `claude/bring-ph-redesign` / open PR from that branch (6 commits: `30b97cf`, `f155516`, `df408d9`, `d813f1b`, `828384c`, `859873b`) |
| **Goal** | Redesign the public `/bring-ph` sections 2/3/5/6/7 to match owner-approved editorial mockups (hero + "What it takes" unchanged), plus a small Experience-page typography fix. Design-only; no auth/DB/routing/CSP/env change. |

Part of the DR public-page-to-v3 stream (bring-ph is a public page body). Owner-initiated directly, not a numbered ROADMAP sprint; run interactively in plan mode + iterative review rounds rather than from a single gated prompt.

## What shipped
- **§2 Why bring one** — two-column: large green statement + a big gold-arch **illustration cropped from the mockup** (`public/assets/art/ph-art-why-bring-arch.png`) on a warm-cream band (`--bring-cream #FAEEE1`, matches the crop's own ground so the rectangle disappears). Olive-branch eyebrow.
- **§3 The partnership** — centered head + one bordered split card (You bring / We bring), star-logo + olive ornaments, sparkle bullets, centre-seam diamond (replaces the old Artwork strip + check bullets).
- **§5 The 120-day launch** — star-medallion timeline (single rounded SVG star framing the numeral) + connector diamonds + bordered note card.
- **§6 The commitments** — moved from `ph-section-dark` → **light cream**; three bordered medallion cards; olive-branch flanks on the eyebrow + olive closing divider.
- **§7 The next step** — two-column CTA + arch photo (`ph-photo-ready-apply.jpg`, SVG `#phArch` clip + floating copper outline); **PALESTINE HOUSE wordmark lockup**, olive-branch eyebrow, olive-branch flourish on the arch, a sparkle floating outside the arch; **terracotta Apply button** + forest-outlined secondary.
- **Divider removed** between §4 and §5 (the `<PageDivider/>` tatreez frieze).
- **Shared ornaments** — new `src/components/shared/ornament.tsx`: `StarLogo` (owner's star-logo photo keyed to a transparent copper PNG `ph-art-star-logo.png`, rendered via `next/image`), `StarMark` (single rounded SVG star, §5 medallions only), `SparkMark`, `OliveBranch` (reuses `/model` `ph-art-model-branch`).
- **Experience page** — `.exp-daynight-close` + `.exp-pillars-close` made the same **centered display type** (owner consistency request). No copy changed.
- **Tokens** — `--forest-800 #2E351A` (sampled heading green) added to `globals.css`; page-local `--bring-cream` / `--bring-cta` / `--bring-cta-hover` on `.bring-page`.

Files: `src/app/bring-ph/page.tsx`, `src/styles/pages.css`, `src/styles/globals.css`, `src/components/shared/ornament.tsx` (new), `src/components/shared/photo.tsx`, 3 new assets under `public/assets/`.

## Prompt / brief used
<details><summary>Interactive brief + iterative owner review comments (no single gated prompt)</summary>

```text
Initial brief (owner): "proceed to Bring a House page. Reference images in the
asset folder 'Bring a House'.
1. Keep the page hero as is.
2. Why bring one: design exactly like 'Why bring one example'.
3. The partnership: design exactly like 'The partnership'.
4. What it takes: keep as is.
5. The 120-day launch: design exactly like 'The 120-day launch'.
6. The commitments: design exactly like 'THE COMMITMENTS'.
7. The next step: design exactly like 'Ready to apply_' (use 'Ready to apply pic').
Review yourself in a loop vs the references before each section; ensure mobile
responsiveness across devices."

Locked decisions (owner, during plan): crop the §2 arch illustration from the
mockup; terracotta Apply button (mockup) not olive; forest-green headings
(mockup) not charcoal; §6 to light cream. All divergences scoped to /bring-ph.

Review round 2 (owner): §2 fit-to-viewport + real olive branch (use the /model
"What a House carries" branch); Experience — make "One room, doing the work of a
dozen places." match "Different every week. Familiar every time." (same display
type, both centered); §3/§5/§6 change the star + olive, warmer/cultural; §7 add
the PALESTINE HOUSE wordmark + star, 2 olives, a diamond outside the arch.
Reflect all on mobile.

Review round 3 (owner): use the actual 'Star logo' PNG across the page; make the
Why-bring statement bigger like the mockup.

Review round 4 (owner): make the §2 arch image bigger (mockup).

Review round 5 (owner): remove the tatreez divider between What it takes and The
120-day launch.

Codex review (owner-run): 1 Medium — .bring-cta-secondary lost the cascade to the
shared v3.css outline-button rule; forest border/text not applied. Fixed by
out-specifying (incl. hover). No security/gating/routing/asset/hydration/overflow
blockers; typecheck/lint/build pass.
```

</details>

## Checks & results
typecheck ✅ · lint ✅ · build ✅ (`/bring-ph` prerenders static) · responsive verified via Chrome DevTools Protocol at true 390 (bodyScrollWidth = 390, **zero horizontal overflow**) + 768 · per-section desktop review vs each mockup · copy **verbatim** (text-diff vs main) · Codex review = 1 Medium (secondary-CTA cascade), **fixed + computed-style-verified** (`border/color = rgb(46,53,26)`).

## Deviations & learnings
- **CSS cascade order is the recurring trap here:** `globals.css` `@import`s `pages.css` **before** `v3.css`, and globals' own rules load **after** both. New `.bring-*` rules that fight a `v3.css`/`globals.css` rule need a `.bring-page` prefix (or higher specificity). This bit: `.bring-arch-photo` vs `.v3-photo`; `.bring-why-section` padding vs `.ph-section-lg`; eyebrow colours vs `.ph-eyebrow`; and the Codex finding — `.bring-cta-secondary` (0,1,0) lost to `:is(.ph-page,…) [data-slot=button][data-variant=outline]` (0,3,0), fixed with `.bring-page .bring-cta-secondary[data-slot="button"][data-variant="outline"]` (0,4,0) incl. `:hover`.
- **Star logo:** the owner's "Star logo" is a **neon photo on a gray background** — unusable on cream. Keyed the gray→transparent and recolored to copper offline (System.Drawing/LockBits) → `ph-art-star-logo.png`. The §5 medallions keep a plain SVG star (the interlaced logo would clash with the numeral; the mockup uses a simple star there too).
- **Headless screenshot gotcha:** `Reveal` (Framer `whileInView`) + headless reduced-motion means below-fold sections render `opacity:0` in captures and emit a pre-existing SSR attribute-mismatch warning (all Reveal pages have it). Verified visuals via CDP with a forced `*{opacity:1}` inject; measured overflow at a true 390 device-metrics viewport. `--window-size` alone renders wider than requested (DPR) — don't trust it for width.
- **§2 sizing** went small→big across rounds; final = big statement + big arch (mockup), reduced section padding.
- Raw mockups + the raw star-logo photo were relocated out of `public/` into gitignored `docs/source-assets/design-refs/bring-a-house/` (owner keeps re-dropping them into `public/` — sort before commit).

## Follow-ups
- **§4 "What it takes" heading stays charcoal** (kept "as-is"; not in the mockups). Owner can green it to match the rest — one selector.
- **§5 medallions** use the SVG star, not the star-logo (legibility). Owner may want the logo there too.
- Owner confirms the **final Vercel Preview → merges the PR** (prod is unaffected until merge; no migration).
- Update `PROJECT-STATUS.md` / `ROADMAP.md` at close.
