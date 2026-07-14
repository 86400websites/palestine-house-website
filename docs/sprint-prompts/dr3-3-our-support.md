# Sprint DR3.3 — Our Support (`/our-support`) body to v3

| | |
|---|---|
| **Date** | 2026-07-14 · **BUILD COMPLETE (pre-merge)** — owner confirms the Preview, merges the PR, deletes the branch |
| **Branch / PR** | `claude/sprint-dr3-3-our-support-v3` / open PR from that branch |
| **Goal** | Rebuild the five owner-named `/our-support` sections to the owner's section mockups (copy adopted from them, per the DR3 decision), reusing the v3 system proven on `/model` + `/bring-ph`. The `.sup-artefacts` toolkit grid and the closing `.statement` CTA were kept from the prior layout (then the toolkit cards were restyled in the feedback round). Frontend/design + approved-copy only — no DB/auth/gate/CSP/routing/env change. |

Part of the DR public-page-to-v3 stream. Planned via `/sprint-prompt` (plan-mode), then executed owner-gated **DR3.3-1 … DR3.3-8**, push-per-step, followed by a **6-item owner feedback round**.

## What shipped (section by section)

- **§1 Hero → split band.** Replaced the full-bleed `PageHero` with a v3 split: a cream copy panel (copper "Our Support" eyebrow · `h1` "You're not doing this alone." · lead · a **10 / 30 / 267 / 120** proof row with book/grid/doc/calendar icons) beside the "You are not alone" flag photo. `/our-support` removed from the header `OVERLAY_ROUTES` so the solid warm header shows (the hero is no longer a photo overlay). **Feedback round:** set to the standard page-hero height `min(74svh, 38rem)` with the copy fitted left and the photo a **rounded, full-height panel** on the right (bleeds to the container edge, rounded corners; a rounded band on top when stacked ≤880px).
- **§2 The full playbook (kept, then restyled).** The six artefact cards were kept, then **restyled to the owner's card sample**: a white rounded `.ph-card` with a **sage icon-chip** on top (rounded square, olive tint), a **serif title**, and body — vertical layout (was icon-left horizontal). Icon bumped 20→22px.
- **§3 The Standard.** Cream band: uppercase head + a copper **diamond-line ornament** (`.support-orn`) + serif body on the left; three matted **arch** photos (arch radius reused from `.model-arch`) joined by copper **khatam stars** (`clip-path` 8-point) in the centre; the light **PALESTINE HOUSE lockup** (`ph-logo-lockup.png`) + "One name / One shared standard / Local character" on the right. **Feedback round:** the mockup's dark-green **top divider rule was removed**, the **arch photos enlarged** (max-width 13.5→15.5rem, wider arches column), and the lockup + tagline **centred** (was right-aligned).
- **§4 Aswātna.** Full **muted-red** band (`#9b361e`, sampled): "Aswātna" + "A cultural partner. Not just a brand." + body + the **gold** Aṣwātna Studio seal (`aswatna-mark-gold.png`) on the left; three photos with **Before opening / At launch / After launch** captions + hairline separators on the right (stack to 1-col ≤620px). Cream text clears AA on the red (≈ 6.6:1 head, ≈ 5.5:1 body).
- **§5 The Backing.** Cream band: head + copper diamond + body + a **copper-outline** "View the 120-day launch" button (`/bring-ph#checkpoints`, out-specifying the (0,3,0) v3 outline rule) on the left; a horizontal **01·02·03 numbered timeline** on the right — **moss / terracotta / gold** nodes (sampled) on a red connecting line, each with a stage name + description, plus the centred "You always know where you are…" caption. Goes **vertical with per-step connectors** under 620px (a single top/bottom line would overrun the last node). The old "…doesn't stop at opening" paragraph moved into §6.
- **§6 What you're responsible for.** A dark **forest-green** band (`#323621`, sampled) — "Opening day is not the finish line." + four ongoing-support topics with lucide line icons (calendar / triangle / infinity / bar-chart) + hairlines — over a split: the lantern-lit **doorway photo** bleeding to the left edge + **"You bring" / "We make sure"** checklists (copper `CircleCheck`) around a copper **khatam-star divider** (reused `StarMark`). Stacks ≤860px (photo on top) and ≤520px (single-column; the star divider goes horizontal). Cream on the green ≈ 11:1.
- **§7 Closing CTA (kept).** The `<ApplyCta>` statement closer + the site-wide footer CTA are unchanged.

## Owner feedback round (2026-07-14, applied before the exit gate)
1. **v3 page-hero copy left-aligned site-wide** — `.v3-page-hero-inner` was shrink-wrapping to its content + `margin-inline:auto`-centring the copy mid-page; adding `width:100%` makes it fill the container so the copy + CTAs sit at the **left** edge on `/model` `/experience` `/bring-ph` `/apply` (the Home `.v3-hero` is a separate class, unchanged). **This is the one shared-chrome edit** — verified on Model/Experience/Bring-ph (`/apply` errors locally without Supabase env, renders on Preview).
2. Our Support hero → standard height + rounded full-height image panel (above).
3. Removed the Standard top divider rule.
4. Toolkit cards → the owner's white/sage/serif card sample.
5. The Standard: larger arches + centred lockup/tagline.
6. Full **mobile designer pass** (320→1440) — premium + zero overflow; no further fixes required.

## Assets / pipeline (DR3.3-1)
- 8 masters (hero · standard-1/2/3 · aswatna-1/2/3 · responsibility) + the gold Aṣwātna seal + 5 mockup PNGs relocated from `public/assets/Our Support/` (owner drop) into gitignored `docs/source-assets/design-refs/v3/{photos,logo,mockups}/`; the loose `public/assets/Our Support/` folder deleted (never committed).
- `scripts/optimize-photos.ts` extended: 8 `PHOTOS[]` entries + a new `encodeAswatnaMarkGold()` (keys the white ground out, **keeps** the gold — vs the cream `encodeAswatnaMark` for the `/model` terracotta arch) → `public/assets/partners/aswatna-mark-gold.png`. Ran `pnpm tsx scripts/optimize-photos.ts`; all photos < 500 KB.
- 8 ids registered in `PHOTO_SOURCES` (`photo.tsx`).

## Files
`src/app/our-support/page.tsx`, `src/styles/pages.css` (new `.support-*` blocks; dead `.sup-stages`/`.sup-gates-link`/`.sup-after` pruned), `src/styles/v3.css` (the page-hero-inner fill), `src/components/shared/photo.tsx` (8 ids), `scripts/optimize-photos.ts` (8 photos + gold seal), `src/components/layout/site-header.tsx` (one line: `/our-support` out of `OVERLAY_ROUTES`), + 9 assets under `public/assets/`.

## Verification
- typecheck / lint / build green (46 routes; `/our-support` ○ static, 2.31 kB) after every gated step.
- Colours **sampled** from the mockup PNGs with `sharp` (never eyeballed): Aswātna red `#9b361e`; timeline nodes `#2e3320` / `#8e3f18` / `#9e6a1e` + line `#b3543a`; duties green `#323621`.
- **Reliable visual verification harness** (scratchpad, outside the repo): a `chrome-remote-interface` CDP driver (`cdp-shot.cjs`) — forces `*{opacity:1}` past the `Reveal` `whileInView` (framer-motion captures the SSR value, so reduced-motion emulation alone does NOT un-hide it), waits for lazy `next/image` to load after expanding to full height, and reports the document `scrollWidth` + any element wider than the viewport. `scrollWidth == viewport` with **zero offenders** at 320 / 390 / 480 / 520 / 620 / 768 / 860 / 880 / 980 / 1024 / 1280 / 1440 (the only ≥1280 "offender" is the pre-existing `phx-footer-cta-branch` footer ornament, which doesn't extend the scroll width).
- Path-guard clean; AA verified on the red + green bands.

## Deviations / learnings
- **DR3 copy decision applies:** the mockups carry slightly different wording than the archived `docs/page-copy/01-public-pages/our-support.md`; per the DR3 owner decision the **mockup copy is authoritative** and the shipped page is the source of truth. Updating the gitignored canonical copy file is an owner follow-up (as for DR3.1/DR3.2).
- **`Reveal` + headless capture:** below-fold framer-motion `whileInView` reveals render at `opacity:0` in screenshots and even a *transient* mid-animation capture can look like horizontal clipping — which sent an early "overflow" false alarm on The Standard. The real check is the computed `scrollWidth`/offender probe (added to the CDP tool); the actual overflow bug there (stacked grid `justify-items:center` shrink-wrapping items past a `1fr` track) was fixed with `minmax(0,1fr)` + `width:100%` items.
- **Food & Hospitality icon:** the mockup uses a **warning triangle** (`AlertTriangle`) for a positive feature; matched to the mockup + `aria-hidden`, but flagged to the owner as a possible swap (utensils/chef-hat) — reads a little like an alert.
- **`.v3-page-hero-inner` fill** is the one change that touches pages beyond `/our-support` (owner-requested, item 1). Recorded in `DESIGN.md` §12.

## Follow-ups (non-blocking)
- Owner to reconcile the canonical `our-support.md` copy to the shipped mockup copy.
- Optional: swap the Food & Hospitality warning-triangle icon; force the hero proof row to 2×2 at ≤360px (currently wraps 3+1) if the owner prefers.

## Prompt / brief used
Planned with `/sprint-prompt` and executed from the plan file (gated DR3.3-1…-8), then the owner's 6-item feedback message. The full gated implementation prompt is in the plan; the per-step protocol was: read the exact mockup + photos → build the smallest section change → `typecheck && lint && build` + headless CDP screenshot vs the mockup + overflow probe → self-review → commit + push → report ≤6 lines → **stop for "proceed"**.
