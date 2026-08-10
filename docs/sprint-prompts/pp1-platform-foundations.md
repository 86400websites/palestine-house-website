# PP1 — Private Platform Revamp foundations (sprint record)

**Branch:** `claude/sprint-pp1-platform-foundations` (off `main` `d6ec65b`, the PR #69 merge) · **Built:** 2026-08-10 · **Status at save:** BUILD COMPLETE, **TEST apply pending** (TEST project paused) · **Review brief:** `docs/code-reviews/pp1-platform-foundations.md`

## Why this sprint exists

The owner delivered a final HTML prototype (`PH - Palestine House Final Mockup.html`, now gitignored at `docs/page-designs/`) replacing the **entire gated member workspace**: new IA (About + Setup/Operate/Program/Support; 4 sections → 10 groups → 33 topics, the 33 now called "Focus Areas"), new design language (cream/char/olive/copper, Inter+Spectral), new content presentation (per topic: 4 standard read/download resources + extras + templates + video). Public pages stay untouched. The full 7-sprint plan (PP1–PP7: foundations → shell/About → toolkit pages → reader/search/Ask-HQ → teardown → CMS v2 → QA/contraction) is recorded in `ROADMAP.md` **Stage 4** — deliberately detailed enough that each later sprint can be scoped from the roadmap alone.

**Owner decisions this session (PROJECT-STATUS §5 D-PP-b):** drop `/live` entirely · drop saved checklist progress (checklist = read/download content) · videos = YouTube links via the CMS · Ask HQ = Resend email only. **Ordering decision:** build first, tear down after cutover (production is live).

## The one fact everything rests on

**The 33 new topics map 1:1 onto the 33 existing `elements`.** Verified 2026-08-10 by reading the live DB (prod read-only MCP, sanctioned): every new topic title matches an element title modulo punctuation; every element is claimed exactly once. The new IA is a pure regrouping — all Read-Now bodies (`overview_md`/`simple_guide_md`/`watch_out_for_md`), 818 checklist items, and 297 uploaded templates carry over with **zero re-upload**. The map ships as `ELEMENT_MAP` in `scripts/extract-mockup-spec.ts` and is enforced by `platform_topics.element_id UNIQUE NOT NULL FK` + seed subselects that fail loudly on a wrong slug.

New-model mapping for later sprints: Overview/Simple-guide/Watch-out Read Now ← the three markdown columns (existing sanitized renderer reused) · Practical-checklist Read Now ← `checklist_items` read-only · template downloads ← existing signed-URL flow · the 132 standard docx files + 15 extras files are NOT uploaded yet → honest "coming soon" states until CMS v2 (PP6), mirroring the mockup's own "Video coming soon" toast.

## What shipped (2 commits)

1. **`f7dd77b`** — trackers: `ROADMAP.md` Stage 4 (PP1–PP7 with per-sprint scope/exit gates + DB expand→contract timing) · `PROJECT-STATUS.md` §1 (PP1 active) + §5 (D-PP-a public-terminology drift parked; D-PP-b the four owner decisions).
2. **`e83689c`** — the foundations (55 files, no `src/` change):
   - **`scripts/extract-mockup-spec.ts`** — parses the mockup's `#appData` + `__ASSETS__`; hard-asserts the IA shape (4/10/33 · 5/15/9/4 · 132/15/297) and the 33:33 map; emits everything below. Re-run only when the mockup changes.
   - **`docs/workspace-spec.json`** — the committed canonical IA spec (pages, journey, sections→groups→topics with `elementSlug`, per-topic filename manifests, constant card copy, misc asset paths).
   - **`supabase/sql/migrations/0027_platform_ia.up/.down.sql`** — additive presentation layer: `platform_sections` (5 incl. About) / `platform_groups` (10) / `platform_topics` (33, element spine) / `platform_extras` (15) — all RLS default-deny, zero policies; `resources` + `code` (T01-style backfill from the `<slug>/tNN-` path) + `doc_key` (partial unique per element); RPCs `get_platform_sections/topics/extras` (0011 pattern); `get_resources()` widened in-transaction (columns appended — old code unaffected).
   - **`0028_platform_seed.up/.down.sql`** — GENERATED idempotent seed (natural-key upserts).
   - **`supabase/sql/verification/0027_verify_TEST_db_only.sql`** (role-simulated: approved 5/33/15/299+297-coded; pending zero everywhere; rollback-only) + **`0027_verify_PROD_safe_readonly.sql`** (for the owner's prod apply at the **PP2 merge gate**).
   - **47 assets** under `public/assets/workspace/` (11MB): 33 topic + 4 section photos (from the owner's 92MB PNG masters, moved to gitignored `docs/source-assets/design-refs/workspace/topic-masters/`), 5 page heroes + 5 misc ornaments (base64-only in the mockup), all sharp-optimized ≤600KB each.

## Gotchas / decisions captured for later sprints

- **Template badge codes:** deterministic backfill = all 297 get `T`-codes; the mockup shows ~10 blank + a few `R`-codes. Mockup codes preserved per-topic in the spec JSON; reconcile at PP3 in the display layer. Not a SQL problem.
- **`journey_desc` = section `lead`** in the mockup's data — kept as separate columns so the CMS can diverge them.
- **About is a 5th `platform_sections` row** (num 0, no journey fields) — one CMS-editable home for all page-hero copy (small, deliberate extension of the planned 4-row design).
- **Per-kind card copy is constant** across topics (verified 4/4/1 variants) → app constants in PP3, never DB.
- **`academy_modules`, `checklist_progress`, live-hub objects untouched** — contraction happens only at PP7 (0030), after the old workspace is gone (PP5) and QA passed.
- **PNG masters had URL-fragile names** (spaces, `&`, unicode) — assets ship slug-named; the extraction asserts number↔title correspondence (prefix-tolerant: "Org"/"Organizational").
- The extraction script's title normalizer strips diacritics with a literal combining-char range — works, cosmetically odd; leave alone.

## Checks

`pnpm run typecheck` / `lint` / `build` — all green (46 routes, unchanged set; PP1 touches no `src/`). `git status` clean of gitignored inputs (mockup + masters ignored; `.env.local` untouched).

## Remaining before the PR merges (in order)

1. **Owner: restore the paused TEST Supabase project** (`sdszcralogcrujtyghig` — MCP timeouts on 2026-08-10).
2. Claude: apply `0027` → `0028` on TEST (supabase-test MCP, sanctioned read/write) → run `0027_verify_TEST_db_only.sql` → every EXPECT passes → prove reversibility (down → re-up) → append results here.
3. Independent Codex review (brief: `docs/code-reviews/pp1-platform-foundations.md`; verdict slot empty).
4. Owner: open the PR → Vercel Preview (site must be **visually identical everywhere** — PP1 is spec/DB/assets only) → merge → delete the branch.
5. **NO prod DB step in PP1.** 0027+0028 go to PROD by hand at the **PP2 merge gate** (runbook: apply 0027 → 0028 → run `0027_verify_PROD_safe_readonly.sql`).

**Next sprint: PP2 — workspace shell v2 + About landing** (scope from `ROADMAP.md` Stage 4 with `/sprint-prompt`).
