# Sprint DR3.4 — /focus-areas + /apply hero redesign

| | |
|---|---|
| **Date built** | 2026-07-15 (merge pending — owner opens the PR + merges) |
| **Branch / PR** | `claude/focus-apply-hero-redesign` (commit `ed69929`) / PR to be opened |
| **Goal** | Rebuild the `/apply` and `/focus-areas` page heroes to two owner mockups — cream split heroes with the owner's new photos — while every other section stays as is. |

## What shipped
- **`/apply` hero** — replaced the dark full-bleed `PageHero` with a cream split hero (`.apply-hero`, modeled on `.support-hero`): eyebrow `APPLY`, Spectral heading + a short copper rule, intro copy on the left; the **riad House-entrance photo full-bleed** to the right edge (no rounding). Copy verbatim-unchanged (kept "…to HQ.", not the mockup's "us"). Form + context sections untouched.
- **`/focus-areas` hero** — rebuilt as a cream split (`.fa-hero`): `THE FULL MAP` eyebrow + copper hairline, 2-line heading, the owner-approved **shorter intro** ("A practical playbook to help you start, operate, and grow with confidence — built from real experience."), the **dark stats card folded into the hero** (10 · 30 · 200+ · 267 · 120 with hairline dividers), and the **green-door courtyard photo** in a rounded panel. The former standalone `.fa-stats` band was absorbed into the hero.
- **Chrome:** `/apply` removed from `OVERLAY_ROUTES` (`site-header.tsx`) so the solid cream header sits above the cream hero (same move as `/our-support`). `/`, `/model`, `/experience`, `/bring-ph` overlays unchanged; `PageHero` retains three callers.
- **Photos:** two new keyed, optimized assets (`ph-photo-apply-hero.jpg` 306 KB · `ph-photo-focus-hero.jpg` 402 KB) via `scripts/optimize-photos.ts`; masters relocated to gitignored `docs/source-assets/design-refs/v3/photos/`; the temp `public/assets/Focus area and apply/` drop folder (raw PNGs + mockup screenshots) removed so it never ships.
- **CSS:** new `.apply-hero*` + `.fa-hero*` families in `pages.css`; pruned the now-dead `.fa-stats` rules and the old `.fa-hero-photo` rule. Shared `.art-hero` (used by `/about`) left byte-unchanged.

Files (8): `src/app/apply/page.tsx`, `src/app/focus-areas/page.tsx`, `src/styles/pages.css`, `src/components/layout/site-header.tsx`, `src/components/shared/photo.tsx`, `scripts/optimize-photos.ts`, + the two new jpgs.

## Prompt used
Ad-hoc owner-directed hero tweak (not a gated master-prompt sprint) — run through the plan-mode workflow (Explore → Plan → approved plan → build → verify).

<details><summary>Owner's verbatim request</summary>

```text
Ok now please help me update the focus areas and apply page, I have already added the
"Focus area and apply" folder inside public asset.

1. for apply page hero - please refer to "Apply example" and develop the page hero exactly
as shown in the example and use the image "Apply pic". Rest everything stays as is (other sections)

2. for focus area page hero - please refer to "Focus area example" and develop the page hero
exactly as shown in the example and use the image "focus-areas pic". Rest everything stays as is
(other sections)

Please loop and ensure you match the examples. Ensure mobile responsiveness so it looks premium
and professional across devices.
```

Two decisions confirmed mid-plan (owner): (1) adopt the mockup's shorter `/focus-areas` intro (it isn't in `docs/page-copy` — treated as new owner-approved copy); (2) fold the stats band into the hero and drop the standalone band.

</details>

## Checks & results
typecheck ✅ · lint ✅ · build ✅ (45/45 pages) · `git diff --check` ✅ · device-emulated visual verify ✅ (headless Chrome at 1440 / 720 / 390 / 340px, both heroes vs the mockups, `/about` regression clean, stats card 5→3→2 wrap, photo-first stack at 880px, no overflow at 360px). Independent **Codex review = APPROVE**, no blocking correctness/security/a11y/deploy findings.

## Deviations & learnings
- **Copy conflict:** the `/focus-areas` mockup intro is not in `docs/page-copy` (verified — the folder is gitignored + absent in a fresh clone). Per the copy-lock rule this was surfaced, not picked silently; owner chose to adopt it. `/apply` copy kept verbatim ("to HQ", not the mockup's "us").
- **New photos:** followed the DR3.3 pipeline — masters in gitignored source-assets, additive keyed assets, optimizer run locally; the owner's drop folder was a temporary `public/` location and was removed (it also held the two mockup screenshots, which must never ship publicly).
- **Verification gotcha:** framer-motion `Reveal` wrappers keep inline `opacity:0` until `whileInView` fires, which doesn't happen reliably in headless capture (and `--force-prefers-reduced-motion` / puppeteer media-emulation didn't flip it either). Forced final-state rendering with an injected `*[style*="opacity"]{opacity:1!important}` stylesheet (CSS `!important` beats inline styles). Reusable for future screenshot verification.
- **Local `/apply` env:** a fresh clone has no `.env.local`, so `/apply` (a server component that builds the Supabase client) throws its error boundary until env is present — pre-existing, unrelated to the hero. Used a throwaway gitignored `.env.local` with fast-failing placeholders only to render for screenshots, then deleted it.

## Follow-ups
- **Housekeeping (Codex, non-blocking, Low):** `ph-photo-apply` is now orphaned but still registered in `PHOTO_SOURCES` (`photo.tsx:23`), in the optimizer list (`optimize-photos.ts:77`), and present as a ~196 KB committed jpg. Deferred to a later housekeeping pass (kept off this branch so the Codex-approved commit `ed69929` is the merged state).
- Owner opens the PR from `claude/focus-apply-hero-redesign` and merges after CI + Vercel Preview pass.
