# DEDUPE-0720 + ADMIN-LABELS — Independent review brief (Codex)

> **Two independent branches, review each as its own diff against `origin/main`
> (`17cd8f9`, the PR #66 merge).** `git fetch origin` first — a stale local
> `main` will fold unrelated history into the diff.
>
> 1. **`origin/main...claude/home-model-section-dedupe`** — public-shell content
>    dedupe (2 commits: `4dfc6b8` + `d688eef`; 12 files, +52/−163).
> 2. **`origin/main...claude/admin-content-labels`** — admin display-label
>    rename (1 commit `ce37638`; 5 files, +19/−18).
>
> Both are owner-requested (2026-07-20), frontend-only, and carry **no DB, no
> auth/gate, no CSP, no routing, no dependency, no chrome change**. Verdict
> appended below after review.

## Branch 1 — `claude/home-model-section-dedupe`

### What it does

The owner asked for repeated public content to be removed:

1. **Home stages section removed** (`src/app/page.tsx`): the whole
   "One path. Three clear stages." section (it duplicated /bring-ph §4 —
   both rendered the shared `StageCards`). The `StageCards` import goes with
   it; the following section comments renumber 5→4, 6→5.
2. **Al-Aqsa line-art moved to /bring-ph §4** (`src/app/bring-ph/page.tsx`):
   the old `.bring-stages-cards` wrapper is replaced with Home's
   `.v3-stages-layout` grid — `StageCards` (now with Home's 3-tier `sizes`
   string) + the `v3-stages-art` `next/image`
   (`ART_SOURCES["ph-art-line-alaqsa"]`, `aria-hidden`, empty alt,
   `sizes="(max-width: 1100px) 0px, 30vw"`).
3. **Home's dark proof band KEPT untouched** — during planning it turned out
   to be Home-only (not duplicated on /bring-ph as assumed); explicit owner
   decision. Do not flag the band's presence.
4. **/model §6 aside text removed** (`src/app/model/page.tsx`): the
   "Culture leads. / The structure helps it last." lockup, the aside
   paragraph, and the You-bring/We-bring reciprocity list. The
   `ph-photo-model-culture` still-life Photo and the whole left
   is/is-not column STAY (owner chose text-only removal).
5. **Knock-ons (each intentional):**
   - `.v3-inside` + `.v3-stages-section` in `v3.css` were a PAIRED padding
     join (InsideStrip bottom ↔ stages top, DR1-10 "~6rem same-background
     join"). With the stages section gone the pair is deleted **together**
     and `v3-inside` is dropped from `inside-strip.tsx`, restoring the
     standard `ph-section-lg` rhythm before the dark proof band.
   - `StageCards` (`stage-cards.tsx`): the default Home `STAGES` copy is
     deleted and `stages` becomes a **required** prop (dead locked copy must
     not linger); /bring-ph already passed `BRING_STAGES`.
   - Orphaned CSS deleted: `.bring-stages-cards` (pages.css),
     `.model-leads` / `.model-leads-a` / `.model-leads-b` /
     `.model-plainly-aside-text` / `.model-reciprocity` (+ li/strong).
   - Second commit `d688eef`: `.model-plainly-aside` gains
     `align-self: center` so the now-photo-only aside sits level with the
     is/is-not lists instead of hanging at the section top (owner Preview
     feedback).
   - Comment freshens only: `photo.tsx`, `artwork.tsx`, `optimize-photos.ts`,
     v3.css block headers.
   - `docs/PROJECT-STATUS.md` §1 (Active sprint / Next action / Last
     updated) updated **on this branch only** — the admin-labels branch
     deliberately does not touch it (same-cell merge conflict). Do not flag
     the labels branch for "missing" tracker updates.

### Review focus

- **Dead-reference sweep:** no remaining consumer of `v3-stages-section`,
  `v3-inside`, `bring-stages-cards`, `model-leads*`,
  `model-plainly-aside-text`, `model-reciprocity`, or the default `STAGES`
  export; `StageCards` must have exactly one consumer (/bring-ph) and its
  required-prop change must typecheck.
- **Kept-rules sweep (the inverse):** `.v3-stages-layout`, `.v3-stages-art`,
  all `.v3-stage*` rules and the `@container page (max-width: 1100px/860px)`
  stage queries in `v3.css` are STILL used (now by /bring-ph) — confirm none
  were over-deleted, and that /bring-ph sits inside the `.ph-page` named
  container so those queries fire (it does — `SiteChrome`).
- **Cascade gotcha (repo-known):** `globals.css` imports `pages.css` BEFORE
  `v3.css`. /bring-ph §4 now relies on `v3.css` rules; check nothing in
  `pages.css` (e.g. the old `.bring-stages-*` region) still targets the
  section with equal-or-higher specificity that would now win or dangle.
- **/model §6 after the cut:** valid JSX (`<aside>` wraps only the Photo);
  `CircleCheck`/`CircleX` still imported+used; the ≤880px container collapse
  still stacks lists → photo sanely with `align-self: center` in play
  (single-column grid ⇒ align-self is inert there — confirm).
- **Home after the cut:** no unused imports (`Image`/`ART_SOURCES`/`Photo`
  are still used by the proof band + platform band); hero → split →
  InsideStrip → proof band → platform flow; no stray `sec-head` / Reveal
  wrappers left behind.
- **A11y:** the moved art keeps `aria-hidden="true"` + empty alt; nothing
  that was labelled/landmarked on Home is now referenced by an orphaned
  `aria-labelledby`.
- **Copy discipline:** the surviving copy must be byte-identical to main —
  this branch REMOVES; it must not rewrite any remaining approved string.

## Branch 2 — `claude/admin-content-labels`

### What it does

Owner renamed the `/admin/content` **display labels** for consistency with
the member-facing vocabulary: **Elements → "Focus Areas" · Academy →
"Videos" · Resources → "Templates"**.

- `src/app/admin/content/page.tsx` — the three hub card titles (+ the hub
  comment); the Elements card desc "The 30 topic guides" → **33** (stale
  since FA11 — a user-visible string, distinct from the gated-code comments
  the owner scoped out of FA11-COPY; do not flag the remaining code-comment
  "30"s).
- Sub-pages: `h1` + `metadata.title` — "Focus Areas." / "Videos." /
  "Templates." (+ elements intro "The 30" → "The 33").
- `resources-admin.tsx` — visible generic "resource" strings follow the new
  section name: aria "Filter templates", "No templates match.", "Select a
  template to edit its details.", aria "Edit template".
- **Unchanged by design — do not flag:** the routes
  (`/admin/content/elements|academy|resources`), RPC names
  (`admin_list_elements` etc.), type/identifier names (`ElementRow`,
  `AcademyAdmin`, `saveResourceAction`, …), the member workspace names, and
  the DB. Display strings only. (Known semantic wrinkle, owner's explicit
  choice: the "Focus Areas" section edits the 33 topics, not the 11
  groupings.)

### Review focus

- **Completeness:** no user-visible admin surface still shows the old section
  names ("Elements." h1, "Academy — Content admin" tab title, aria labels,
  empty states). The `AdminNav` says "Approvals"/"Content" — untouched,
  correct.
- **Scope / path-guard:** exactly 5 files under `src/app/admin/content/`;
  no logic, form-field `name=`s, RPC calls, or gating touched (the
  `is_admin()` layout gate and in-RPC gates must be byte-identical).
- **The 33 fix:** appears in exactly the two user-visible strings (hub card
  desc + elements intro), nowhere else invented.

## Both branches

- `pnpm install --frozen-lockfile` · `pnpm run typecheck` · `pnpm run lint`
  · `pnpm run build` — all green on each branch (verified by Claude pre-push;
  re-verify).
- No secrets, no `.env*`, no `package.json`/lockfile churn in either diff.
- Merge order is irrelevant (disjoint files); both PRs are expected to merge
  cleanly and independently.
- Known follow-up (not a finding): the OneDrive-canonical page-copy docs
  (home / model / bring-a-house) are now stale on the removed sections —
  owner will annotate; they live outside the repo.

## Review verdict (Codex)

_(appended after review)_
