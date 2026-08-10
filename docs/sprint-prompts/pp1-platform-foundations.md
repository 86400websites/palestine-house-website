# Sprint PP1 — Private Platform Revamp: foundations (spec · schema · seed · assets)

| | |
|---|---|
| **Date merged** | 2026-08-10 |
| **Branch / PR** | `claude/sprint-pp1-platform-foundations` / **#73** (off `main` `d6ec65b`; merge `2548dff`) |
| **Goal** | Land the data + asset foundations for the new private workspace IA extracted from the owner's final mockup — additive DB layer, committed spec, optimized assets — with **zero UI/behaviour change**. |
| **Review** | Codex = REQUEST CHANGES (2 Medium, both fixed on-branch) → `docs/code-reviews/pp1-platform-foundations.md` |
| **Stage** | Stage 4 — Private Platform Revamp, sprint 1 of 7 (PP1–PP7 planned in `ROADMAP.md` Stage 4) |

## Why this sprint exists

The owner delivered a final HTML prototype (`PH - Palestine House Final Mockup.html`, now gitignored at `docs/page-designs/`) replacing the **entire gated member workspace**: new IA (About + Setup/Operate/Program/Support; 4 sections → 10 groups → 33 topics, the 33 now called "Focus Areas"), new design language (cream/char/olive/copper, Inter+Spectral), new content presentation (per topic: 4 standard read/download resources + extras + templates + video). Public pages stay untouched. The full 7-sprint plan (PP1–PP7: foundations → shell/About → toolkit pages → reader/search/Ask-HQ → teardown → CMS v2 → QA/contraction) is recorded in `ROADMAP.md` **Stage 4** — deliberately detailed enough that each later sprint can be scoped from the roadmap alone (owner request: don't lose the context between sprints).

**Owner decisions this session (PROJECT-STATUS §5 D-PP-b):** drop `/live` entirely · drop saved checklist progress (checklist = read/download content) · videos = YouTube links via the CMS · Ask HQ = Resend email only. **Ordering decision:** build first, tear down after cutover — the owner's instinct was "clean first", corrected because production is live and a tear-down-first order would leave approved partners with a broken workspace mid-project.

## The one fact everything rests on

**The 33 new topics map 1:1 onto the 33 existing `elements`.** Verified 2026-08-10 by reading the live DB (prod read-only MCP, sanctioned): every new topic title matches an element title modulo punctuation; every element is claimed exactly once. The new IA is a pure regrouping — all Read-Now bodies (`overview_md`/`simple_guide_md`/`watch_out_for_md`), 818 checklist items, and 297 uploaded templates carry over with **zero re-upload**. The map ships as `ELEMENT_MAP` in `scripts/extract-mockup-spec.ts` and is enforced by `platform_topics.element_id UNIQUE NOT NULL FK` + seed subselects that fail loudly on a wrong slug.

New-model mapping for later sprints: Overview/Simple-guide/Watch-out Read Now ← the three markdown columns (existing sanitized renderer reused) · Practical-checklist Read Now ← `checklist_items` read-only · template downloads ← existing signed-URL flow · the 132 standard docx files + 15 extras files are NOT uploaded yet → honest "coming soon" states until CMS v2 (PP6), mirroring the mockup's own "Video coming soon" toast.

## What shipped (6 commits, no `src/` change)

1. **`f7dd77b`** — trackers: `ROADMAP.md` Stage 4 (PP1–PP7 with per-sprint scope/exit gates + DB expand→contract timing) · `PROJECT-STATUS.md` §1 (PP1 active) + §5 (D-PP-a public-terminology drift parked; D-PP-b the four owner decisions).
2. **`e83689c`** — the foundations (55 files):
   - **`scripts/extract-mockup-spec.ts`** — parses the mockup's `#appData` + `__ASSETS__`; hard-asserts the IA shape (4/10/33 · 5/15/9/4 · 132/15/297), the 33:33 map, and per-kind copy constancy; emits everything below. Re-run only when the mockup changes.
   - **`docs/workspace-spec.json`** — the committed canonical IA spec (pages, journey, sections→groups→topics with `elementSlug`, per-topic filename manifests, constant card copy, misc asset paths).
   - **`supabase/sql/migrations/0027_platform_ia.up/.down.sql`** — additive presentation layer: `platform_sections` (5 incl. About) / `platform_groups` (10) / `platform_topics` (33, element spine) / `platform_extras` (15) — all RLS default-deny, zero policies; `resources` + `code` (T01-style backfill from the `<slug>/tNN-` path) + `doc_key` (partial unique per element); RPCs `get_platform_sections/topics/extras` (0011 pattern); `get_resources()` widened in-transaction (columns appended — old code unaffected).
   - **`0028_platform_seed.up/.down.sql`** — GENERATED idempotent seed (natural-key upserts).
   - **`supabase/sql/verification/0027_verify_TEST_db_only.sql`** (role-simulated: approved 5/33/15/299+297-coded; pending zero everywhere; rollback-only) + **`0027_verify_PROD_safe_readonly.sql`** (for the owner's prod apply at the **PP2 merge gate**).
   - **47 assets** under `public/assets/workspace/` (11MB): 33 topic + 4 section photos (from the owner's 92MB PNG masters, moved to gitignored `docs/source-assets/design-refs/workspace/topic-masters/`), 5 page heroes + 5 misc ornaments (base64-only in the mockup), all sharp-optimized ≤600KB each.
3. **`1723e5a`** — the Codex review brief + this record.
4. **`c2dbe9e`** — the TEST apply/verification results + tracker flip to review-ready.
5. **`0e3f903`** — the two Codex fixes (generator asserts + stale roadmap/brief facts).
6. **`e37eb5e`** — the Codex verdict + response recorded; trackers flipped to ready-to-merge.

## Prompt used

PP1 was **not** run from a pasted prompt: the owner opened the work as a conversation ("shall we do one sprint or multiple?"), so it ran through plan mode — exploration → a written plan → `ExitPlanMode` approval → direct execution in the same session, with the owner gating at the TEST-restore point. The approved plan's execution block is the effective prompt and is reproduced verbatim below.

<details><summary>Approved execution plan (the effective prompt)</summary>

```text
# EXECUTE NOW — Sprint PP1 (owner approved starting immediately)

Branch: `claude/sprint-pp1-platform-foundations` off fresh `origin/main` (d6ec65b). No UI change. TEST DB only. Steps:

1. **Trackers first** (context anchor, per owner request):
   - `docs/ROADMAP.md`: new stage block "Private Platform Revamp (PP1–PP7)" — per-sprint scope/exit checklists from the master plan above, plus the verified facts + owner decisions so each sprint is self-contained.
   - `docs/PROJECT-STATUS.md`: §1 Right now → PP1 active; record the 4 owner decisions (drop Live, drop checklist progress, YouTube links, email-only Ask HQ) in §4/§5 as superseding entries; note the terminology drift (public "11 focus areas · 33 topics" vs new "4 sections · 33 focus areas") as an open decision for a later public sprint.
2. **File housekeeping** (repo conventions: design inputs stay gitignored/OneDrive):
   - Move `docs/PH - Palestine House Final Mockup.html` → `docs/page-designs/` (gitignored; stays on disk/OneDrive). The committed, reviewable artifact is the extracted spec, not the 7.7MB mockup.
   - Copy the 37 PNGs from `public/assets/photos/PH Images/` → `public/assets/workspace/topics/<topic-slug>.png` + `public/assets/workspace/sections/<section>.png` (kebab names; current names have spaces/`&`); move the original `PH Images` folder out of `public/` into gitignored `docs/source-assets/`. Check image weights; optimize if oversized.
3. **`scripts/extract-mockup-spec.ts`**: parses `#appData` + `__ASSETS__` from the mockup → emits:
   - `docs/workspace-spec.json` (committed; base64 heroes replaced by asset paths),
   - `supabase/sql/migrations/0028_platform_seed.up.sql` (idempotent upserts keyed `ON CONFLICT (element_id)` / `(section_slug,name)`) + `.down.sql`,
   - extracted base64-only assets (page heroes, footer photo, sprig, tatreez) → `public/assets/workspace/`.
   - Embeds the explicit 33-row `element_slug → topic_slug` map; hard-asserts 33/33 mapped, 4 sections, 10 groups, 15 extras, 297 template codes.
4. **Verify the map against the TEST DB** (Supabase MCP `supabase-test`, per `docs/SUPABASE-MCP-SAFETY.md`): element titles/slugs vs mockup topic titles — every mapping confirmed or flagged before the seed is generated.
5. **Migration `0027_platform_ia.up.sql` + `.down.sql`** (single transaction, additive only): `platform_sections`/`platform_groups`/`platform_topics`/`platform_extras` per the schema in the master plan; `resources` + `code` (backfilled from `storage_path`) + `doc_key` (partial unique per element); RLS default-deny; RPCs `get_platform_sections/topics/extras` (0011 pattern: SECURITY DEFINER, `search_path=''`, `is_approved()` gate, revoke-then-grant); `get_resources()` drop+create widened in-transaction.
6. **Apply 0027 + 0028 to TEST** (supabase-test MCP is sanctioned read/write; never prod) + run verification probes: anon → zero rows/EXECUTE denied; pending → zero rows; approved → 4/10/33/15 rows; seed spot-checks (3 topics across sections, template code backfill count = 297).
7. **Checks + close**: `pnpm run typecheck` / `lint` / `build`; `git status` (no secrets, no gitignored leaks — verify `PH Images` gone from `public/`, mockup not staged); commit(s) in owner's push-per-step style; Codex review brief at `docs/code-reviews/` per convention.
- PROD apply is explicitly NOT in PP1 — it happens at the PP2 merge gate (owner, by hand).
```

</details>

## Checks & results

typecheck ✅ · lint ✅ · build ✅ (46/46 routes, unchanged route set) · Preview ✅ (visually identical everywhere by design — PP1 touches no `src/`) · `git status` clean of gitignored inputs (mockup + PNG masters ignored; `.env.local` untouched) · Codex independent review ✅ (2 Medium fixed, re-verified).

### TEST apply + verification (2026-08-10, after the owner restored the paused project)

Applied via the sanctioned `supabase-test` MCP as tracked migrations `0027_platform_ia` + `0028_platform_seed` (file content minus the explicit `begin;`/`commit;` wrappers — the MCP apply is atomic on its own; the committed files keep the wrappers for the owner's prod SQL-editor run, which is also a single-batch transaction). **Every check passed:**

- **Structure (verify §0):** all 4 platform tables exist, `rls_enabled = true`, `client_policies = 0` on each.
- **Seed shape (§1):** sections **5** · groups **10** · topics **33** · extras **15** (across **6** topics) · distinct/joined elements **33/33** · unmapped elements **0** · per-section topics **operate 15 / program 9 / setup 5 / support 4**.
- **resources (§2):** `code` backfilled on **297** (booklets = the 2 NULLs), **0 malformed**, `doc_key` **0** as expected; `resources_element_doc_key_ux` present.
- **Privileges (§3):** `anon = false` / `authenticated = true` on all four RPCs (`get_platform_sections/topics/extras`, widened `get_resources`).
- **Role sims (§4, rollback-only): 9/9 pass** — approved member reads 5 / 33 / 15 / 299 (297 coded); pending member reads **0 rows from every RPC**, no errors.
- **Mapping spot-checks on real rows:** `launching-a-new-house → i2`, `menu-and-palestinian-culinary-identity → k1`, `crisis-management → i3`, `guest-journey-and-member-journey → a2` — all correct titles.
- **Reversibility proven:** `0028.down` → `0027.down` left zero platform tables/RPCs/columns, restored the exact 0014 `get_resources` signature, and content untouched (**299 resources / 33 elements / 818 checklist items**); re-applied up cleanly to the final state.
- **Idempotency proven:** re-running a seed upsert over existing rows changes nothing (topic id stable).
- **Security advisors:** no new findings — only the pre-existing by-design patterns (default-deny "RLS enabled no policy" INFO rows, which now correctly include the 4 new tables, and the generic SECURITY-DEFINER-callable warnings that apply to every self-authorizing RPC in this system; the anon-callable `rls_auto_enable()` notice predates PP1).

## Deviations & learnings

- **Plan-mode sprint, not a pasted prompt.** The owner opened with a scoping question, so the sprint was planned and executed in one session. The roadmap Stage 4 block was written *first*, deliberately, so PP2–PP7 can be scoped from the repo alone.
- **Sprint count corrected, and the order flipped.** The owner proposed "clean everything, then rebuild"; delivered as **7 sprints, build-first-teardown-last** because production is live. Recorded in ROADMAP Stage 4.
- **About became a 5th `platform_sections` row** (`num` 0, no journey fields) — a small deliberate extension of the planned 4-row design so *all* page-hero copy has one CMS-editable home. Codex flagged the roadmap still saying 4; corrected in `0e3f903`.
- **Assets ship as `.jpg`, not `.png`** — the plan said rename the PNGs; the 92MB of masters actually needed re-encoding (mozjpeg ≤600KB each, 11MB total). Masters moved to gitignored `docs/source-assets/design-refs/workspace/topic-masters/`.
- **PNG masters had URL-fragile names** (spaces, `&`, unicode) — assets ship slug-named; the extraction asserts number↔title correspondence with a prefix-tolerant comparison ("Org" master vs "Organizational" topic).
- **Codex earned its keep on tooling honesty, not on the schema.** Both findings were: (1) the generator *claimed* asserts it didn't enforce (copy-constancy; the `<600 KB` check was JPEG-only) — fixed with `assertConstantCopy()` + a shared `reportSize()`, and **negative-tested** with a mutated mockup that correctly aborts before writing anything; (2) stale source-of-truth facts in ROADMAP/brief. No auth, approval-gate, RLS, data-safety, migration, or element-map defect was found. **Lesson: if a brief claims an invariant is asserted, the assert must exist — reviewers check.**
- **Regeneration is deterministic** — after the fixes, re-running the script produced byte-identical spec/seed/assets, which is what let the TEST-verified migrations stand unchanged. Keep that property.
- **Template badge codes:** deterministic backfill = all 297 get `T`-codes; the mockup shows ~10 blank + a few `R`-codes. Mockup codes preserved per-topic in the spec JSON; reconcile at PP3 in the display layer. Not a SQL problem.
- **`journey_desc` = section `lead`** in the mockup's data — kept as separate columns so the CMS can diverge them later.
- **Per-kind card copy is constant** across topics (verified: 4 standard kinds × 1 variant, 1 template variant, 1 extra variant) → ships as app constants in PP3, never DB rows. Now machine-enforced.
- The extraction script's title normalizer strips diacritics with a literal combining-char range — works, cosmetically odd; leave alone.

## Follow-ups

1. **PROD DB apply — NOT done in PP1, by design.** 0027 + 0028 go to production **by hand at the PP2 merge gate**: apply `0027_platform_ia.up.sql` → `0028_platform_seed.up.sql` → run `supabase/sql/verification/0027_verify_PROD_safe_readonly.sql` (EXPECT 5/10/33/15 · 297 coded · anon denied). Both are additive; deployed code is provably unaffected until PP2 ships. Tracked in `ROADMAP.md` Stage 4 + `PROJECT-STATUS.md` §1.
2. **Next sprint: PP2 — workspace shell v2 + About landing** (scope from `ROADMAP.md` Stage 4 with `/sprint-prompt`). Watch: `/dashboard` must survive as a path (public header, login/apply redirects, outbound email all hardcode it) and keep its pending/declined states; `GATED_PREFIXES` needs `/setup`; new CSS must be `.pw-`-namespaced so legacy workspace styles coexist until PP5.
3. **Contraction is PP7, not before** — `academy_modules`, `checklist_progress` + `set_checklist_progress`, `get_academy_modules`, and the live-hub objects stay until migration 0030, after the old workspace is deleted (PP5) and QA passes.
4. **D-PP-a (parked, public-side):** the new private model says "4 sections · 33 focus areas" while the public proof band still says "11 focus areas · 33 topics · 200+ · 297 · 120". Public stays untouched during PP per owner instruction; reconcile in a later public sprint. The OneDrive workspace page-copy docs are also stale against the mockup — owner follow-up.
5. **Dependabot PR** for grouped npm minor/patch updates is open on `origin` (`dependabot/npm_and_yarn/minor-and-patch-ea64e2e9e4`) — merge at will, then `pnpm install`.
