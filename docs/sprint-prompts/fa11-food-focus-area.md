# FA11 — Food focus area: "Café & Culinary Experience" (K) + /food workspace section

> **Status: BUILD COMPLETE (pre-merge, 2026-07-17)** — owner-gated FA11-0…FA11-7,
> push-per-step, branch `claude/sprint-fa11-food-focus-area` in an isolated
> worktree off `main` `1c8191c` (the main checkout was occupied by the parallel
> `claude/public-copy-overhaul` session; zero public-page files in this diff).
> Remaining after merge: the owner's prod runbook below (0026 + prod ingest),
> then the deferred public refresh (PROJECT-STATUS §5 D-FA11-a/b).

## Goal

Add the owner's new Focus Area 11 — **Café & Culinary Experience** (code **K**,
elements **k1/k2/k3**) — to the gated member workspace, fed by the owner's
content package (3 topics × 5 docs + 10 templates each = 90 checklist items,
30 templates), stored in the existing Supabase content tables so
`/admin/content` can edit it later. New workspace section **Food** between
Operate and Program (sidebar + 6th dashboard card + `/food` page). Public site
untouched (see Owner decisions).

## Owner decisions (2026-07-17)

- **Public site deferred:** proof numbers (10 · 30 · 200+ · 267) and the public
  `/focus-areas` A–J map stay unchanged this sprint. A small follow-up sprint
  after both open branches merge updates them (11 · 33 · 297) — recorded in
  PROJECT-STATUS → Open decisions.
- **Nav placement:** Welcome · Plan · Build · Operate · **Food** · Program · Live.
- **Scope:** gated workspace + DB + ingest only; zero public-page/chrome files
  in the diff.

## Approved copy (FA11-1 gate, 2026-07-17 — verbatim, never paraphrase)

| # | Surface | Approved string |
|---|---------|-----------------|
| 1 | Focus area name (DB `focus_area_name`) | Café & Culinary Experience |
| 2 | K1 one-line | What the café serves and why it matters — every dish documented, costed, and told through a true story. |
| 3 | K2 one-line | Qahwa, tea, and coffee served as a daily ritual — calibrated, consistent, and culturally true. |
| 4 | K3 one-line | Taking the table beyond the café — catering, supper clubs, and workshops run with the same discipline. |
| 5 | Sidebar item (after Operate) | Food · icon `UtensilsCrossed` |
| 6 | Dashboard card (6th, after Operate) | title "Food" · line "Your menu, the qahwa ritual, and every plate that tells a story." · CTA "Open Food" |
| 7 | Dashboard lead sentence | Start in Plan, then move through Build, Operate, Food, and Program. |
| 8 | /food page | eyebrow "Food" · h1 "The café & culinary experience." · lead "What the House serves and how it serves it — the menu and its stories, the qahwa and coffee ritual, and the catering that takes the table beyond the counter." · group cadence "Daily calibration, quarterly menu review" · CTAs "Open the first topic" / "Go to Operate" |
| 9 | /academy caption | Videos follow the same eleven focus areas and thirty-three topics as the rest of the platform. |
| 10 | /admin/content/resources caption | The 297 templates and 2 booklets. Edit a resource's details — the file itself is managed through the content ingest, not here. |

K topic titles (from the package, verbatim): K1 **Menu & Palestinian Culinary
Identity** · K2 **Coffee, Tea & Beverage Program** · K3 **Catering, Private
Events & Culinary Programming**.

## Content pack (canonical, gitignored — owner keeps this)

`docs/source-assets/resources/2. Focus Areas/11. Café & Culinary Experience/`
— `_pack.md` (K metadata + the approved one-lines above) + the 3 topic folders,
46 files. Built FA11-1 from the owner's raw drop `docs/source-assets/Food/`
(left untouched; its `3. Templates` + `4. Videos` folders are hash-verified
byte-identical duplicates and were not carried over). **Gotcha fixed:** the raw
drop's names carried CP437 mojibake from a bad unzip (`Caf├⌐`, `T01 ΓÇö`) —
repaired to real UTF-8 (`Café`, `T01 —`) in the canonical copy so the ingest
template parser (`^T(\d+)\s*[—–-]`) matches.

## DB change (migration 0026 — TEST first, PROD by owner after merge)

`0026_focus_area_k.up.sql` widens the locked A–J shape to A–K: the three CHECK
constraints (`elements_slug_shape` → `^[a-k][1-3]$`, `elements_focus_area_shape`
→ `^[A-K]$`, `resources_focus_area_shape` → null-or-`^[A-K]$`) plus verbatim
redefinitions of `admin_upsert_element` + `admin_update_resource` (0023) with
only the regexes widened, revoke/grant hardening restated. `.down.sql` is
**destructive by design** (deletes K rows; partners' K checklist_progress is
lost; storage files orphaned — header documents this; forward-fix preferred).
Verification: `0026_verify_TEST_db_only.sql` (constraint/prosrc/privilege
checks + rollback-only role sims: admin k3 upsert OK, l1/L rejected, non-admin
42501, pending 0 rows, direct-insert CHECK) and
`0026_verify_PROD_safe_readonly.sql` (Section A post-migration: shapes +
30/728/30/269 · Section B post-ingest: 33/818/33/299 + 30 K storage objects).

## Prod rollout runbook (owner, after merge approval)

1. Apply `supabase/sql/migrations/0026_focus_area_k.up.sql` in the **prod** SQL
   Editor (backwards-compatible with live code).
2. Run `0026_verify_PROD_safe_readonly.sql` **Section A** — all EXPECTs pass.
3. From a machine holding the canonical pack folder: point `.env.local`
   `SUPABASE_INGEST_URL` / `SUPABASE_INGEST_SECRET_KEY` at prod, then
   `pnpm tsx scripts/ingest-content.ts --pack food --i-understand-not-test`.
4. Run **Section B** — all EXPECTs pass (33 / 818 / 33 / 299 + 30 objects).
5. Merge the PR → deploy. (DB-first is safe: if code deploys first, `/food`
   renders its header with zero rows — defensive filter — until the ingest.)
6. Revert `.env.local` to the TEST ingest vars (or remove them).

## Sub-step log

- **FA11-0** — worktree `claude+sprint-fa11-food-focus-area` on branch
  `claude/sprint-fa11-food-focus-area` from `main` `1c8191c`; pnpm install +
  typecheck green; `.claude/worktrees/` added to local `.git/info/exclude`
  (never committed) so the parallel session's `git status` stays clean.
- **FA11-1** — canonical pack folder built (main checkout + worktree, both
  gitignored, `git status` clean); mojibake repaired; `_pack.md` written; the
  full copy table approved by the owner.
- **FA11-2** — migration 0026 up/down + TEST/PROD verify scripts drafted; this
  record opened with the approved copy.
- **FA11-3** — 0026 applied on TEST via the `supabase-test` MCP
  (`apply_migration`, 2026-07-17). Full verify: constraint defs widened ×3 ·
  both RPC bodies carry the new regexes with the old forms gone · privileges
  anon=false/authenticated=true ×2 · all six role sims pass (admin k3 upsert
  OK, l1 + L rejected 22023, non-admin 42501, pending 0 rows, direct-insert
  check_violation) · zero K rows persisted after the sim (leave-no-trace
  confirmed by re-query) · counts unchanged 30/728/30/269.
- **FA11-4** — `--pack food` mode added to `scripts/ingest-content.ts`
  (default full-run behaviour untouched; hard guards 3/30-per-topic/30/0-WTW-
  missing). Dry-run exact (3 · 90 · 3 · 30 · 0; K1 bodies 4266/18100/28377
  chars). Live TEST ingest clean (30/30 storage uploads). Parser fix folded in:
  the section-strip regex now also handles the food docx `SECTION:` headers
  (no letter token) so K group labels read clean like A–J; re-ran the pack —
  **idempotency proven** (identical K element ids, counts stable 33/818/33/299,
  0 labels left with a SECTION prefix, K1 = 6 sections × 5 items). Full role
  matrix passes (9/9): approved 33 elements / 818 checklist / 30 K resources /
  k1 bodies / K signed-URL payload · pending 0 rows ×3 · anon permission
  denied. `.env.local` with TEST ingest vars placed by the owner in the
  worktree (gitignored, never staged).
- **FA11-5** — admin zod schemas widened to a-k/A-K (element slug + focus area,
  academy slug, resource focus area) + `revalidatePath("/food")` in
  `saveElementAction`; the `/resources/[category]` route guard widened to A–K
  (was 404ing `/resources/k`). `src/` grep: zero A–J shape patterns remain.
- **FA11-6** — the Food section shipped: NEW `src/app/(workspace)/food/page.tsx`
  (clone of the /program pattern; `FOOD_GROUPS` = K1–K3; PendingState gate
  before any fetch; zero new CSS) · sidebar item Food after Operate
  (`workspace-shell.tsx`) · 6th dashboard card after Operate + the approved
  lead sentence (`dashboard/page.tsx`) · academy caption → eleven/thirty-three ·
  admin resources caption → 297. **Trap caught: `/food` added to
  `GATED_PREFIXES` in `site-chrome.tsx`** (the LH1 double-chrome trap — without
  it the public header/footer would wrap the workspace shell; this is the one
  `src/components/layout` file in the diff, same precedent as LH1's `/live`).
  typecheck/lint/build green (47 routes, `/food` ƒ gated). Anon smoke test on
  the prod build: `/food` response is byte-shape identical to `/plan`
  (streamed NEXT_REDIRECT → login), `/resources/k` same posture.
- **FA11-7 (exit gate)** — full-diff self-review of all 14 files (every string
  matches the approved copy table; order + gating verified; one stale-count
  comment fixed in `workspace-shell.tsx` while in-diff). **Path-guard CLEAN:**
  no public pages, no `site-header`/`site-footer`, no `middleware`/
  `next.config`/`package.json`/lockfile/`src/lib/supabase`/`globals.css`/
  `pages.css`, no `docs/source-assets/**` or `.env*` in the diff; secret-scan
  of the full range clean. typecheck/lint/build green (47 routes). Trackers
  updated in-branch: PROJECT-STATUS §1 (active sprint / next action / last
  updated) + §2 board row + §5 **D-FA11-a** (deferred public refresh
  11 · 33 · 297 + map) and **D-FA11-b** (OneDrive canon `_index.md` + full-run
  ingest guard bumps) · ROADMAP §B FA11 row. This record stamped final.

## Files changed (14)

`supabase/sql/migrations/0026_focus_area_k.{up,down}.sql` ·
`supabase/sql/verification/0026_verify_{TEST_db_only,PROD_safe_readonly}.sql` ·
`scripts/ingest-content.ts` · `src/lib/admin/content-actions.ts` ·
`src/app/(workspace)/food/page.tsx` (new) ·
`src/app/(workspace)/{academy,dashboard}/page.tsx` ·
`src/app/(workspace)/resources/[category]/page.tsx` ·
`src/app/admin/content/resources/page.tsx` ·
`src/components/workspace/workspace-shell.tsx` ·
`src/components/layout/site-chrome.tsx` (GATED_PREFIXES only) ·
`docs/sprint-prompts/fa11-food-focus-area.md` (+ tracker edits in
`docs/PROJECT-STATUS.md`, `docs/ROADMAP.md`).

## Follow-ups / open decisions created by this sprint

1. **Public refresh (deferred):** Home proof band, `/focus-areas` map + stats,
   `/our-support` numbers → 11 · 33 · 297 in a follow-up sprint after
   `claude/public-copy-overhaul` and this branch both merge.
2. **OneDrive canon:** owner adds K1–K3 rows to the master
   `docs/page-copy/06-elements/_index.md` + per-slug one-line files + the
   focus-areas page copy; then the full-run ingest guards can be bumped
   (30→33 topics, 267→297 templates, folder prefixes 1–10 → 1–11). Until then a
   full `--pack full` re-ingest on a machine with folder `11.` present throws
   loudly at the 1–10 prefix guard — fails safe.
3. **Build % denominator** grows 728 → 818 when the Food ingest lands on prod:
   every partner's displayed Build % drops ~11% relative (correct math, no data
   loss) and an unstarted "Café & Culinary Experience" group appears in /build.
