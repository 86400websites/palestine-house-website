# PROOF-0721 — Independent review brief (Codex)

> **One branch, review the diff against `origin/main` (`d968438`, the PR #68
> merge).** `git fetch origin` first — a stale local `main` will fold
> unrelated history into the diff.
>
> **`origin/main...claude/proof-band-move-apply-cta`** — two owner-requested
> Home tweaks (2026-07-21), frontend + docs only: **no DB, no auth/gate, no
> CSP, no routing, no dependency, no chrome change**. Verdict appended below
> after review.

## What it does

1. **The olive proof band moved Home §4 → /bring-ph §5** (directly below
   "One clear path. Three stages."):
   - `src/app/page.tsx`: the `HOME_PROOF` const + the whole
     `.home-proof` section deleted; the following platform-band comment
     renumbers 5→4; the now-unused `ART_SOURCES` import trimmed
     (`Photo`/`PHOTO_SOURCES`/`Image` are still used by §2/§4).
   - `src/app/bring-ph/page.tsx`: `BRING_PROOF` const added (same five
     stats, provenance comment carried over) and the band inserted verbatim
     as a **new sibling section** between §4 `#what-it-takes` and the
     120-day timeline; classes/ids renamed `home-proof*` → `bring-proof*`
     (`aria-labelledby`/`id` → `bring-proof-title`); the later section
     comments renumber 5–7 → 6–8. No new imports needed (`Image`, `Reveal`,
     `ART_SOURCES` already there).
   - `src/styles/pages.css`: the entire `.home-proof*` block relocated from
     the Home region into the /bring-ph region (between
     `.bring-stages-close` and the timeline block), every selector renamed
     `.bring-proof*`; rule bodies, ornament transforms, and the three
     `@container page` queries are **byte-identical apart from the class
     names** and two comment freshens. The /bring-ph §-numbered CSS
     comments renumber to match (timeline §5→§6, commitments §6→§7, apply
     §7→§8, plus the two cross-reference comments); the Home region header
     comment notes the move.
   - Context: DEDUPE-0720 explicitly KEPT the band on Home (it was
     Home-only, not a duplicate). This owner request **supersedes** that
     decision — do not flag the reversal.
2. **Home platform-card Apply CTA removed** (`src/app/page.tsx`, the
   "The full system opens to approved partners." card): the inner CTA
   `<div>` — the primary "Apply to bring a House" button **and** its
   "Every application is reviewed by HQ." support line (owner confirmed
   both go) — is deleted; the outline "Explore the model" button stays as
   the flex row's only child. Knock-ons: the now-unused `ArrowRight` import
   and the orphaned `.home-cta-support` rule (pages.css) are deleted.
   Home's hero Apply button and the site-wide footer Apply CTA still carry
   the conversion path — do not flag Home as CTA-less.
3. **Tracker housekeeping** (`docs/PROJECT-STATUS.md` §1): the 2026-07-20
   cells flip to merged (dedupe = PR #67, admin-labels = PR #68, verified
   `ce37638` ∈ main, branches deleted) and PROOF-0721 becomes the active
   sprint. This brief is committed on the branch.

## Review focus

- **Move fidelity:** the band's JSX and CSS on /bring-ph must be
  content-identical to what main has on Home apart from the
  `home-`→`bring-` rename — same five stats + labels, caption copy
  verbatim ("Everything you need, in one connected system." + the lead),
  same four ornament `Image`s (branch-4 left · branch-1 right · branch-3
  ×2 mobile bookends) with `aria-hidden` + empty alt, same
  `ph-section-lg ph-section-dark ph-section-olive` surface classes.
- **Dead-reference sweep:** zero remaining `home-proof` / `HOME_PROOF` /
  `home-cta-support` hits anywhere; no orphaned `aria-labelledby`; no
  unused imports left on Home (`ArrowRight`, `ART_SOURCES` gone; `Image`,
  `Photo`, `PHOTO_SOURCES`, `Button`, `Link`, `Reveal` all still used).
- **Rename-collision sweep (the inverse):** `bring-proof` must be new —
  confirm it collides with no pre-existing `.bring-*` selector or JSX
  class, and appears only in `bring-ph/page.tsx` + `pages.css`.
- **Cascade gotcha (repo-known):** `globals.css` imports `pages.css`
  BEFORE `v3.css`, and globals' own rule bodies land after both. The
  band's white caption relies on the `.bring-proof`-prefixed selectors
  (specificity 0,2,1) beating globals' `.ph-section-dark :is(h1,h2,h3)` —
  the rename preserves specificity, but confirm no /bring-ph-scoped rule
  (e.g. the `.bring-page :is(...)` green-heading recipe at the top of the
  bring region) now also matches the band's `h2` with higher specificity
  and repaints it forest-green on the dark band.
- **Container queries:** /bring-ph sits inside the named `.ph-page`
  container (SiteChrome), so the band's three `@container page` queries
  fire exactly as on Home — confirm nothing wraps the new section in a
  different container.
- **Home platform card after the cut:** valid JSX; `.home-platform-ctas`
  keeps one flex child (no empty wrapper, no stray gap artifact); the
  card's three paragraphs untouched byte-for-byte.
- **Section rhythm:** Home now flows hero → split → InsideStrip → platform
  band; /bring-ph flows stages → dark proof band → 120-day timeline. No
  joined-padding pair existed around the band on Home (checked — only the
  band-internal `.bring-proof-item + .bring-proof-item` hairlines use
  adjacency), but confirm nothing else assumed the dark band between
  InsideStrip and the platform photo band.
- **Copy discipline:** this change MOVES and REMOVES; it must not rewrite
  any surviving approved string. The proof numbers stay 11 · 33 · 200+ ·
  297 · 120 verbatim.
- **Scope / path-guard:** only `src/app/page.tsx`,
  `src/app/bring-ph/page.tsx`, `src/styles/pages.css`,
  `docs/PROJECT-STATUS.md`, and this brief change; nothing under
  supabase/api/middleware/admin/workspace/ui/`next.config.ts`/env/package
  files; no secrets, no `.env*`, no lockfile churn.

## Checks

- `pnpm install --frozen-lockfile` · `pnpm run typecheck` · `pnpm run lint`
  · `pnpm run build` — all green pre-push (verified by Claude; re-verify).
- Known follow-up (not a finding): the OneDrive-canonical page-copy docs
  (home / bring-a-house) are now staler on these sections — owner will
  annotate; they live outside the repo.

## Review verdict (Codex)

**APPROVE — 2026-07-21.** Merge recommendation: **approve**.

- **Blocking findings:** none.
- **Non-blocking findings:** none.
- Reviewed the single branch diff against freshly fetched `origin/main`
  (`d968438`). Scope/path guard is clean: exactly the five briefed files,
  with no protected-path, dependency, lockfile, env, or secret-bearing change.
- Move fidelity passes: the five-entry proof array and complete JSX section are
  byte-identical after only `HOME_PROOF` → `BRING_PROOF` and
  `home-proof` → `bring-proof`; the CSS rule bodies are likewise identical
  after the selector rename (the documented comment freshens excluded).
- Dead-reference and collision sweeps pass. The removed Home names have zero
  implementation hits; `bring-proof` is confined to `/bring-ph` and
  `pages.css`; the `aria-labelledby` target is present and unique.
- Cascade/container review passes. The `.bring-page` green-heading recipe does
  not match the proof caption, the renamed white-caption selector still
  out-specifies the later global dark-heading rule, and the section remains a
  direct child inside SiteChrome's named `.ph-page` container, so all three
  `@container page` queries remain active.
- Home's platform-card paragraphs and surviving approved copy are unchanged;
  the remaining CTA row has one valid outline-button child, while Home retains
  its hero Apply CTA and the site-wide footer Apply CTA.
- Re-run checks: `pnpm install --frozen-lockfile`, `pnpm run typecheck`,
  `pnpm run lint`, and `pnpm run build` all pass (Next.js production build:
  46/46 static pages generated where applicable).
