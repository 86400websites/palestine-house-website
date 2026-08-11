# Sprint PP1.1 — Card-model correction: 3 cards, extras dropped

| | |
|---|---|
| **Date merged** | **Not yet merged.** Built + pushed 2026-08-12 (5 commits `3e2d57e`→`66fb54d`). ⚠️ **One step open: the TEST re-apply — run the SQL, test and verify via the `supabase-test` MCP, FIRST thing next session** (see Follow-ups). Owner then merges the `docs/pp1-close` PR, then this branch's PR. |
| **Branch / PR** | `claude/pp1-1-card-model` (off `docs/pp1-close`, which is 1 docs commit ahead of `main`) / PR to be opened by the owner |
| **Goal** | Adopt the owner's **3-card topic model** (decision **D-PP-c**, 2026-08-11) across everything PP1 shipped, **pre-PROD**: each of the 33 focus areas shows exactly **Overview / Simple guide / Template** — the Practical-checklist and What-to-watch-out-for cards removed, ONE owner-chosen template per focus area (via CMS v2, coming-soon until upload), the 15 "More guides" extras dropped entirely, Watch Video kept. |

Stage 4 — Private Platform Revamp, corrective sprint between PP1 and PP2. Zero UI change; zero `src/` change.

## What shipped

- `3e2d57e` — **Planning + trackers**: ROADMAP Stage 4 rewritten for the 3-card model (decisions ⑤⑥ added; model paragraph; new PP1.1 row; PP2–PP7 scopes/exit gates amended — PP3 loses the extras block/templates grid/preview modal, PP4 reader = overview/guide with search chips all/topics/guides, PP6 = 3 doc slots with template promote-or-upload, PP7 contraction grows). PROJECT-STATUS: **D-PP-c** in §5; §1 flipped; §2 board backfilled (Stage 4 rows added; LH1 #58 / DR3.2 #59 / DR3.3 #60 / DR3.4 #61 / FA11 #65 flipped to merged). `.gitignore` += `docs/PH - Palestine House Final.html` (the owner's mockup copy — **kept on disk until the PP series closes, never commit, never remove**). PP1 record addendum.
- `d0062fa` — **Generator + regeneration**: `scripts/extract-mockup-spec.ts` gains a dated post-extraction transform (raw mockup asserts stay as source-drift guards — the mockup still shows 4 cards; the owner's instruction supersedes it): filter to overview/guide (66/2-per-topic asserts), synthesize the constant Template card (`title: "Template"`, `action: "Download template"` — the only two invented strings, owner-signed 2026-08-12; desc/icon/use verbatim from the mockup's constancy-asserted template copy), one owner-approved intro trim (`launching-a-new-house`: "checklist and templates" → "template"), extras dropped from all emissions. Regenerated `docs/workspace-spec.json` (3-entry `resourceKinds`, computed stats `standard_resources: 66`, per-topic `templates` kept as the PP6 picker candidate list) + 0028 seed pair. Regeneration proven **byte-stable**; all 47 assets re-encoded identically (zero asset diffs).
- `26fcf77` — **Migration + verification**: `0027_platform_ia.up.sql` edited in place (PROD never ran it): `platform_extras` table + `get_platform_extras` RPC removed; `resources.doc_key` CHECK → `('overview','guide','template')` (the existing partial-unique index enforces "one template per topic" for free; the template slot is fillable in PP6 by uploading a new file or promoting one of the 297 dormant coded rows). Down-script extras drops kept, annotated defensive (pre-correction TEST only). Both verification scripts updated: 3-table/3-RPC expectations, extras negatives (`to_regclass` null, proc count 0), a `pg_get_constraintdef` probe proving the corrected CHECK applied, role sims approved 5/33/299/297 · pending 0s.
- `6e438a6` — TEST re-apply runbook committed into the PP1 record's PP1.1 addendum.
- `66fb54d` — Close-out tracker state.

## Prompt used

<details><summary>Effective prompt (plan-mode sprint — the approved plan's execution structure)</summary>

```text
PP1.1 — adopt the 3-card focus-area model (D-PP-c), fix PP1 pre-PROD, then plan PP2.
Branch claude/pp1-1-card-model off docs/pp1-close. Gated sub-steps, commit+push per step:
1. Trackers + planning fix: .gitignore += the owner's mockup copy; ROADMAP Stage 4 rewrite
   (decisions ⑤⑥, model paragraph, PP1.1 row, PP2–PP7 amendments); PROJECT-STATUS D-PP-c +
   §1 + board backfill; PP1 record addendum.
2. Generator transform (mockup still shows 4 cards — transform, don't loosen the raw asserts):
   filter overview/guide, synthesize Template card (owner signs off "Template" +
   "Download template" + 1 intro trim), drop extras; regenerate spec + 0028; byte-stable.
3. 0027 in place: drop platform_extras + get_platform_extras; doc_key CHECK →
   ('overview','guide','template'); update both verification scripts (extras negatives +
   constraintdef probe).
4. TEST re-apply: 0028 down → 0027 down → corrected 0027 up → corrected 0028 up →
   0027_verify_TEST_db_only.sql (every EXPECT passes).
5. Exit gate: full-diff review, typecheck/lint/build, hygiene grep, trackers, then plan PP2.
Owner decisions locked via AskUserQuestion: instruction supersedes the byte-identical mockup;
template card = owner picks/uploads via CMS (coming soon); extras dropped, video kept.
```

</details>

## Checks & results

- `pnpm run typecheck` ✅ · `pnpm run lint` ✅ · `pnpm run build` ✅ (route set unchanged — zero UI/behaviour change, as required).
- Generator run green: raw asserts (132/15/297/4-per-topic) AND transform asserts (66 / 2-per-topic / OVERVIEW|GUIDE) pass; re-run **byte-identical** (sha256 verified).
- Full branch diff reviewed (12 files, +206/−684). Hygiene grep: the only `platform_extras`/`get_platform_extras`/`additional_resources` references left are the two annotated defensive down-drops + the intentional verification negatives; `src/` has zero.
- 0028 diff vs the merged PP1 version = header trim + extras block gone + down-delete gone + the one signed-off intro trim. Nothing else.
- `git check-ignore` confirms the mockup copy can no longer be committed accidentally.
- ⚠️ **NOT yet done: the TEST re-apply** (see Follow-ups) — the `supabase-test` MCP was re-added by the owner mid-session via terminal, but a running session cannot hot-attach an MCP server; it connects in NEW sessions only.

## Deviations & learnings

- **The "new" mockup was byte-identical to the Aug 6 export** (same MD5) and still shows the 4-card model — the 3-card change existed only in the owner's instruction. Resolved by owner decision (D-PP-c): the instruction supersedes the mockup on this point only; the generator **transforms** rather than loosening its raw asserts, so mockup drift still fails loudly. Lesson: when a "final" input contradicts the request, hash-compare before planning — the discrepancy changed the whole approach.
- **Edit-in-place was safe only because PROD never ran 0027/0028** — the expand-early/contract-last posture (PROD apply deferred to the PP2 merge gate) is what made this a cheap correction instead of a new migration pair. Same reasoning: PP1 shipping zero `src/` code meant zero UI to unbuild.
- `doc_key='template'` reuses the existing partial-unique index to enforce "one template per focus area" — no new DDL, and the PP6 CMS gets promote-or-upload for free.
- Invented copy kept to the absolute minimum (2 card strings + 1 intro trim), each explicitly owner-signed; everything else stays mockup-verbatim.
- MCP operational lesson: **servers added/authorized via terminal only attach to sessions started afterwards** — plan DB steps accordingly (runbook committed to the repo so any session or the owner can run it).

## Follow-ups

1. ⚠️ **NEXT SESSION, FIRST: run the SQL + test + verify on TEST via the `supabase-test` MCP** (it is authorized and will connect in a fresh session). Runbook (also in `pp1-platform-foundations.md` → PP1.1 addendum) — run each file whole, in order:
   ① `supabase/sql/migrations/0028_platform_seed.down.sql` ② `supabase/sql/migrations/0027_platform_ia.down.sql` ③ `supabase/sql/migrations/0027_platform_ia.up.sql` ④ `supabase/sql/migrations/0028_platform_seed.up.sql` ⑤ `supabase/sql/verification/0027_verify_TEST_db_only.sql` — **every EXPECT must pass**: three platform tables (RLS on, 0 policies) · `extras_table = null`, `extras_rpc = 0` · 5/10/33 · coded 297, doc_keys 0 · `doc_key_check` lists overview/guide/template · role sims approved 5/33/299/297, pending 0s. TEST only; PROD never had 0027/0028. Then flip PP1.1 to ✅ in ROADMAP + PROJECT-STATUS (+ this record's header) and run `get_advisors`.
2. **Owner merges** the `docs/pp1-close` PR first, then this branch's PR.
3. **Then PP2 — workspace shell v2 + About landing** (ready-to-run gated prompt in the 2026-08-12 session close; re-derivable with `/sprint-prompt`). **At the PP2 merge gate the owner applies the corrected 0027 + 0028 to PROD by hand** + runs `0027_verify_PROD_safe_readonly.sql` (EXPECT 5/10/33 · 297 coded · doc_keys 0 · no `platform_extras` · anon denied).
4. Optional: Codex review of this branch's diff vs `main` (schema class) before merge.
5. Parked: D-PP-a (public terminology + the "200+ checklist items" proof number now has no private surface) — a later PUBLIC sprint, after PP7.
