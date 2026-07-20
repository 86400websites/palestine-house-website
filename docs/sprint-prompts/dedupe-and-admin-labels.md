# DEDUPE-0720 + ADMIN-LABELS — Public-shell dedupe · admin section labels

> **Status: BUILD COMPLETE + REVIEWED — READY TO MERGE (2026-07-20).** Two
> independent owner-requested branches, both **Codex APPROVE, zero blocking**
> (verdicts: `docs/code-reviews/dedupe-and-admin-labels.md`):
> 1. `claude/home-model-section-dedupe` — 4 commits (`4dfc6b8` dedupe ·
>    `d688eef` model-photo centering · `27733da` review brief · `36f6d5b`
>    Codex verdict), 12 code files +52/−163 plus docs.
> 2. `claude/admin-content-labels` — 1 commit (`ce37638`), 5 files +19/−18.
>
> Owner: open/merge the two PRs in any order (disjoint files) → delete both
> branches. **No DB, no deploy step, no env change.**

| | |
|---|---|
| **Date built** | 2026-07-20 (merge pending) |
| **Branches** | `claude/home-model-section-dedupe` · `claude/admin-content-labels` |
| **Goal** | Remove content repeated across the public shell; rename the /admin/content section labels to the member-facing vocabulary. |

## Goal

Not a ROADMAP sprint — an ad-hoc owner polish session (same register as
`copy-overhaul-text-edits.md`). The owner flagged three public repetitions and
one admin-consistency gap, interactively from Preview screenshots.

## Owner decisions (AskUserQuestion + chat, 2026-07-20)

- **Home stages section** ("One path. Three clear stages.") — REMOVE; it
  duplicated /bring-ph §4. The Al-Aqsa line-art beside it **moves to
  /bring-ph §4**.
- **Home dark proof band** — investigation showed it is **Home-only** (the
  owner believed it was duplicated on /bring-ph; it never was — /bring-ph has
  the 120-day timeline instead). Owner decision: **KEEP on Home untouched**
  (numbers also live on /focus-areas + /our-support).
- **/model §6 "Culture leads."** — remove **text only** (lockup + aside
  paragraph + You-bring/We-bring reciprocity list); the coffee still-life
  photo and the is/is-not lists stay. Preview follow-up: the photo-only aside
  gets `align-self: center` so it sits level with the lists.
- **/admin/content labels** — Elements → **"Focus Areas"** · Academy →
  **"Videos"** · Resources → **"Templates"** (display labels only; routes,
  RPCs, identifiers, member-workspace names unchanged). Known wrinkle, owner's
  explicit choice: the "Focus Areas" section edits the 33 topics, not the 11
  groupings. Folded in: the stale user-visible "The 30 topic guides" → **33**
  (hub card + elements intro).

## What shipped

**Branch 1 — `claude/home-model-section-dedupe`** (public shell)
- `src/app/page.tsx` — stages section + `StageCards` import removed; section
  comments renumbered. Home flow: Hero → split → InsideStrip → proof band →
  platform.
- `src/components/sections/home/inside-strip.tsx` + `src/styles/v3.css` — the
  **paired** `.v3-inside` / `.v3-stages-section` padding join (DR1-10) deleted
  together; standard `ph-section-lg` rhythm restored before the dark band.
- `src/app/bring-ph/page.tsx` — §4 wrapper → `.v3-stages-layout` with the
  `v3-stages-art` Al-Aqsa image (`aria-hidden`, empty alt, hides ≤1100px
  container); cards `sizes` bumped to Home's 3-tier string.
- `src/app/model/page.tsx` — §6 aside reduced to the Photo;
  `src/styles/pages.css` — `.model-leads*` / `.model-plainly-aside-text` /
  `.model-reciprocity*` / `.bring-stages-cards` deleted;
  `.model-plainly-aside` gains `align-self: center`.
- `src/components/sections/stage-cards.tsx` — default Home `STAGES` copy
  deleted; `stages` prop now **required** (dead locked copy must not linger).
- Comment freshens: `photo.tsx`, `artwork.tsx`, `optimize-photos.ts`, v3.css.
- `docs/PROJECT-STATUS.md` §1 updated on this branch only (see Learnings).

**Branch 2 — `claude/admin-content-labels`** (admin, display strings only)
- `src/app/admin/content/page.tsx` — hub card titles + 30→33 desc.
- `elements|academy|resources/page.tsx` — h1 + `metadata.title`
  ("Focus Areas." / "Videos." / "Templates.") + elements intro 30→33.
- `resources-admin.tsx` — visible "resource" strings → "template" (filter
  aria, empty state, select prompt, form aria).

## Prompt used

No gated master prompt — interactive session: plan mode (2 Explore agents +
1 Plan agent validation) → owner decisions via AskUserQuestion → build →
owner Preview feedback (photo centering) → Codex review via the brief at
`docs/code-reviews/dedupe-and-admin-labels.md` (which doubles as the exact
review prompt).

## Checks & results

Both branches: `pnpm install --frozen-lockfile` · typecheck ✅ · lint ✅ ·
build ✅ (46/46 pages) · dead-reference grep sweeps clean · `git status`
clean, no secrets. Codex independent review: **APPROVE ×2, zero blocking**
(selector/cascade, copy, imports, a11y, scope, path-guard all passed).
Owner Preview-checked /admin/content (caught the wrong-Preview confusion,
below) and /model (requested the photo centering, shipped as `d688eef`).

## Deviations & learnings

- **Preview-per-PR gotcha:** the owner opened the dedupe PR's Vercel Preview
  and saw the OLD admin labels — each PR builds its own Preview URL; changes
  on branch B never show on branch A's Preview. Check the deployment's branch
  before concluding a change is missing.
- **Paired CSS joins:** `.v3-inside` existed only to pair with
  `.v3-stages-section` (~6rem same-background join). Deleting one half of a
  documented padding pair leaves a broken rhythm — the pair's comment names
  both halves; always remove them together.
- **Premise check pays:** the "duplicated proof band" premise was false;
  surfacing it before building (AskUserQuestion) changed the scope (band
  kept) instead of silently deleting a Home-only conversion section.
- **Two same-day tasks → two branches:** kept independent off `main` so the
  PRs merge in any order; consequence: `docs/PROJECT-STATUS.md` §1 could only
  be updated on ONE branch (same-cell edits on both would merge-conflict).
  The labels branch is tracker-silent by design.
- **Push policy:** the session's permission classifier blocked `git push`
  until the owner explicitly asked in chat — commits stayed local until then.

## Follow-ups

- **OneDrive-canonical page-copy docs** (home / model / bring-a-house) are now
  stale on the removed sections — owner annotates (outside the repo).
- After both PRs merge: next session flips PROJECT-STATUS §1 from
  "BUILD COMPLETE" to merged as part of its normal session-start reconcile.
- `stage-cards.tsx` is now single-consumer (/bring-ph); if a future page
  needs the cards, pass its own `StageCopy[]` — there is no default copy.
