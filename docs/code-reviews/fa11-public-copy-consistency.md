# FA11-COPY — Independent review brief (Codex)

> Review target: the branch DIFF **`origin/main...claude/sprint-fa11-public-copy-consistency`**
> (10 files, 1 commit `d2891fc`). **IMPORTANT: diff against `origin/main`
> (`aba8b1b`), NOT a stale local `main` ref** — a local `main` left at the #64
> merge will spuriously fold the whole FA11 + Dependabot history into the diff.
> `git fetch origin` then compare to `origin/main`. Sprint record:
> `docs/sprint-prompts/fa11-public-copy-consistency.md`. Verdict appended after.

## What this sprint does

A pure **public copy + docs consistency** pass, the D-FA11-a follow-up to the
already-merged FA11 (Focus Area 11 "Café & Culinary Experience", now live for
members + on prod). It updates the public marketing site's proof numbers and
the public `/focus-areas` map to match the new reality. **No code logic, no DB,
no auth/gate, no CSP, no routing, no dependency, no component/chrome change** —
the diff is 4 frontend files (3 pages + 1 CSS comment) and 6 docs.

## The intended change (verify it is correct + complete + nothing else)

1. **Proof numbers 10 · 30 · 267 → 11 · 33 · 297** (200+ and 120-day UNCHANGED —
   200+ is still true at 818 checklist items). Surfaces:
   - `src/app/page.tsx` — `HOME_PROOF` (11 / 33 / 297).
   - `src/app/focus-areas/page.tsx` — `FA_STATS` (11 / 33 / 297) + metadata
     description ("eleven…thirty-three…297") + the dark-index eyebrow
     ("Eleven focus areas · Thirty-three topics") + the "How to read this map"
     prose "(A–J)" → "(A–K)".
   - `src/app/our-support/page.tsx` — metadata "(11, 33, 297)" + `SUP_PROOF`
     (11 / 33 / 297) + prose "eleven focus areas and thirty-three practical
     topics" + "297 templates".
   - `src/styles/pages.css` — the `/* … templates line */` hook comment 267→297.
2. **New Focus Area K entry** appended to `FA_AREAS` in
   `src/app/focus-areas/page.tsx` — "Café & Culinary Experience" with 3 topics.
   Owner-approved titles (verbatim, must match the DB / FA11 names):
   K1 "Menu & Palestinian Culinary Identity", K2 "Coffee, Tea & Beverage
   Program", K3 "Catering, Private Events & Culinary Programming". Blurb +
   terse sub-lines mirror the existing A–J entry shape.
3. **Authoritative governance docs** aligned to 11 · 33 · 297: `CLAUDE.md`,
   `docs/PROJECT-STATUS.md` §4, `docs/README.md`, `docs/ROADMAP.md` exit gate,
   `docs/DESIGN.md`. (Historical sprint/review logs intentionally left as
   point-in-time records — do NOT flag those.)

## Focus of the review (what "0 bugs" means here)

- **Completeness:** is there ANY remaining user-visible public surface still
  showing 10 / 30 / 267 (grep the public pages + metadata + OG + JSON-LD)?
  A missed surface = an inconsistent public number.
- **Accuracy:** are the new numbers exactly 11 / 33 / 297, and are 200+ / 120
  correctly left alone? Do the metadata/OG descriptions still read naturally?
- **K map entry:** is the `FA_AREAS` array still well-formed (renders, no TS
  break), the K titles verbatim-correct, `k: "K"` unique, `topics` a 3-tuple
  array in the same shape as A–J? The page render is data-driven off `FA_AREAS`
  + `FA_STATS`, so confirm no per-letter hardcoding was missed.
- **Scope / path-guard:** the diff must contain NO change to chrome
  (`site-header`/`site-footer`/`site-chrome`), auth/gate, `middleware`,
  `next.config`, `supabase/**`, `package.json`/lockfile, `.env`, or any
  component/route logic. Frontend copy strings + docs only.
- **Docs consistency:** no authoritative governance doc still asserts the old
  "10 · 30 · 267" invariant (which would contradict the site + confuse future
  sessions). Point-in-time historical logs are exempt.
- **Build:** `pnpm install --frozen-lockfile` · `pnpm run typecheck` ·
  `pnpm run lint` · `pnpm run build` green.

## Review verdict

_(to be appended)_
