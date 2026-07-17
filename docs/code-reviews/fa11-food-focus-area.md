# FA11 — Independent review brief (Codex)

> Review target: the branch DIFF `main...claude/sprint-fa11-food-focus-area`
> (14 files, 7 commits `2e7353f…b8cbbbc`). Sprint record + owner-approved copy
> table + prod runbook: `docs/sprint-prompts/fa11-food-focus-area.md`.
> Verdict: _(appended after the review)_

## What this sprint does

Adds Focus Area K "Café & Culinary Experience" (elements k1–k3) to the gated
content system and a new workspace section **Food** (sidebar Operate → Food →
Program · 6th dashboard card · `/food` page). DB: migration
`0026_focus_area_k` widens the locked A–J shapes to A–K (3 CHECK constraints +
the regex guards inside `admin_upsert_element` / `admin_update_resource`).
Content loads via a new **additive `--pack food` mode** in
`scripts/ingest-content.ts` (already run + verified on TEST; PROD is applied by
the owner AFTER merge — the prod DB is intentionally untouched at review time).

## Context the reviewer must NOT flag as defects (intentional)

1. **Public proof numbers stay 10 · 30 · 200+ · 267** on Home, `/focus-areas`,
   `/our-support`, and the public `/focus-areas` map stays A–J — owner decision
   D-FA11-a (PROJECT-STATUS §5): the public refresh rides a follow-up after the
   parallel `claude/public-copy-overhaul` branch merges. The workspace-side
   captions (academy "eleven … thirty-three", admin resources "297") ARE
   updated — the split is deliberate (members see reality; marketing waits).
2. **K rows exist only on TEST.** `/food` renders a graceful empty state
   against a database without K rows (defensive filter) — by design.
3. **K academy videos are null** → the marked "Sample clip" fallback (S10
   behavior, unchanged).
4. The `0026.down.sql` is **destructive by design** (deletes K rows; documented
   loudly in its header; forward-fix preferred per WORKFLOW §14).
5. `site-chrome.tsx` is touched ONLY to add `"/food"` to `GATED_PREFIXES`
   (same precedent as LH1's `/live`); the header/footer design files are not in
   the diff.

## FA11 gating checks (any failure = blocking)

A. **0026 fidelity:** the two redefined functions must be byte-identical to
   `0023_admin_content_rpcs.up.sql` except the widened regexes
   (`^[a-k][1-3]$` / `^[A-K]$`) and the header-comment count; revoke-then-grant
   restated for the exact signatures; constraint names unchanged
   (`elements_slug_shape`, `elements_focus_area_shape`,
   `resources_focus_area_shape`); the down file restores the 0023 originals
   verbatim and deletes K resources **before** K elements
   (resources.element_id is ON DELETE SET NULL — order matters).
B. **No gate weakening:** no change to any `is_approved()` / `is_admin()`
   check, no new anon EXECUTE, RLS untouched, the approved-member read RPCs
   untouched. The widening must not create any anon-reachable path to K
   content.
C. **Ingest safety:** the `--pack food` model can never contain A–J rows (so
   upserts cannot touch existing content or `checklist_progress`); the
   exact-host TEST guard (`sdszcralogcrujtyghig.supabase.co` +
   `--i-understand-not-test`) is intact; no secret value is logged or
   committed; the default `--pack full` behavior is unchanged; the food guards
   throw (not warn) on 3/30-per-topic/30/0-WTW mismatches.
D. **App-layer symmetry:** the four zod regexes in
   `src/lib/admin/content-actions.ts` match the DB guards exactly;
   `/resources/[category]` accepts A–K only; `revalidatePath("/food")` added.
E. **/food correctness (the "0 bugs" ask):** server component (no
   `"use client"`); `getMyProfile()` → `PendingState` BEFORE any content
   fetch; no K data reachable pre-approval; `"/food"` in `GATED_PREFIXES`
   (double-chrome); sidebar + dashboard entries consistent (`/food`, label
   "Food", `UtensilsCrossed`); null-safe when K rows are absent (empty groups
   filtered, `firstTopic` guarded); hrefs `/elements/k1..k3` via slugs from the
   DB rows; copy matches the approved table in the sprint record VERBATIM.
F. **Path-guard:** the diff must contain NO files under public pages
   (`src/app/page.tsx`, focus-areas, our-support, model, experience, bring-ph,
   apply, about, contact, legal, auth), no `site-header*`/`site-footer*`, no
   `src/middleware.ts`, `next.config.ts`, `package.json`/`pnpm-lock.yaml`,
   `src/lib/supabase/**`, `globals.css`/`pages.css`, no `.env*`, no
   `docs/source-assets/**`.
G. **Checks:** `pnpm run typecheck` · `pnpm run lint` · `pnpm run build` green
   (47 routes; `/food` ƒ dynamic).

## Review verdict

_(to be appended)_
