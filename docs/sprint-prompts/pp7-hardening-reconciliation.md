# Sprint PP7 — Review-round-3 hardening + public reconciliation

**Branch:** `claude/sprint-pp7-hardening-reconciliation`, off `main` = `d723475` (the PP6c merge, PR #85)
**Built:** 2026-08-16 · 13 gated steps (7-a … 7-m) · 12 commits · ~83 files
**Migrations:** `0032` (transactional cutover RPC) · `0033` (the contraction) — both applied + verified on **TEST**
**Production:** untouched throughout. Still on `0029`, still the legacy 33 focus areas and 297 templates.

---

## Why this sprint existed

The independent review of the whole PP1→PP6c body of work returned **BLOCKING —
11 blocking + 4 medium findings**. PP6c fixed six inside itself; the other eight
needed real design and became PP7. It was inserted *before* final QA on purpose:
the old PP7's exit gate was *"0 known bugs; visual acceptance passes"*, and QA
that runs before the public pages are reconciled and the destructive tooling is
hardened is QA of a site about to change.

**Every blocker and every medium is now closed.**

---

## 7-a — the kickoff verification, which corrected the record three times

The PP series rule since PP6a (*"the written plan is a hypothesis — grep every
claim"*) earned its place again. All 15 findings re-derived from source:

- **11 of 11 blockers stand.**
- **M4 is worse than recorded.** The generated rollback omits
  `resources.focus_area_code`, **all 297 production rows carry one**, and the
  CHECK permits NULL — so a restore would succeed and silently empty the column.
- **B4 is narrower.** Production measures **0 unlinked legacy elements**, so the
  file on disk was complete. A trap for the next generation, not a hole in this one.
- **M3 was declared fixed and was not.** PP6c fixed the global `signOut()` in
  **one file of eight**.

Two more found here: `0030`'s header credited the contraction to `0031` (it is
`0033`), and `delete-297-objects.ts` computed a decoy fingerprint with size
hardcoded to `0` beside the real check.

Ledger: `docs/code-reviews/pp7-round-3-ledger.md`.

## The eight blockers

| | what was wrong | what it is now |
|---|---|---|
| **B1** | The exporter wrote downloads **straight into the only archive**, then checked count/bytes/fingerprint. The manifest published *that command* as `howToVerify` — so the documented way to check your only backup could destroy it. | Stage → verify → promote. A file already archived with the right MD5 is *copied* forward. `scripts/verify-archive.ts` is a strictly read-only verifier: no Supabase client, no credentials, nothing opened for writing. |
| **B2** | Objects were deleted **before** `0030`, on the stated reasoning that the migration deletes the rows carrying the storage paths. **One grep showed that reason was false** — the deleter has never read `public.resources`. | Rows first, bytes second. Orphaned bytes are inert and retryable; live rows pointing at deleted files are neither. |
| **B2b** | The deleter made **no database call at all**, so nothing stopped it removing 297 files out from under 297 live rows. | It refuses until `0030` has demonstrably committed: 0 legacy focus areas, exactly the 22 the spec names, carrying exactly 110 rows. |
| **B3** | `0030`'s guard counted *any* 22 live numeric-coded rows. A decoy passed. | An exact 22-area manifest (code · slug · section · non-empty body · one guide file · template count), generated from the spec, plus a publication re-check immediately before `COMMIT`. |
| **B4** | The rollback generator walked `platform_topics`; `0030` deletes by `elements.code`. An unlinked legacy element was deleted and never snapshotted — and the generator's own `=== 33` check passed anyway. | Elements come from `admin_list_elements()`, topics are selected *by element*, groups by the migration's own predicate. |
| **B5** | `0030.down.sql` restores rows and cannot restore one byte. The documented recovery was a sentence telling the operator to re-upload 297 files by hand. | `scripts/restore-297-objects.ts` — exact keys, never overwrites, reads every upload back. Plus `verify-down-migration.ts` and `docs/ROLLBACK-RUNBOOK.md`. |
| **B6** | The cutover was 22 separate RPC calls. A failure at row 12 left **11 Live and 11 Draft**, no rollback, no record. | `0032`'s `admin_cutover_focus_areas` — one manifest, one `UPDATE`, all or none. |
| **B7** | `--target prod` was documented, the owner was told to use it, and it silently ran against TEST. | Built. `PROD_*` read by name with **no fallback**, exact host assertion, and a typed confirmation naming the project ref — refused outright when stdin is not a terminal. |

## The four mediums

**M1** the swap detector only caught a two-way swap; a **deletion** removes the
displaced title from the spec entirely, so a shift was waved through as "a pure
rename". Now refuses unless `--allow-retitle` — which does **not** excuse a
provable swap. · **M2** identity was keyed on the slug, the one field the schema
deliberately lets drift; a renamed focus area slipped past the Live guard and
would have been **duplicated**. Now the code. · **M3** local-scope sign-out in a
`finally`, across all eight scripts. · **M4** `focus_area_code` restored by
derivation, verified per row against production by digest.

## What was proven by running it, not by reading it

- **The archive round trip, for real on TEST:** 110 objects → restore → **407**,
  every one byte-identical on read-back, and the **server-side aggregate
  reproduced production's own fingerprint `6fde792718130d12071b69459f9d70ab`** at
  297 objects / 5,320,962 bytes → delete → back to 110, archive still valid.
- **A failing export leaves the archive byte-identical** — run live, fingerprint
  unchanged before and after.
- **The old `0030` guard vs the new one**, measured on TEST inside a block that
  always raises (nothing written; state re-confirmed after):

  | mutation | old guard | new guard |
  |---|---|---|
  | renamed slug | counts 22 → **proceeds** | refuses |
  | missing template | counts 22 → **proceeds** | refuses |
  | emptied guide body | counts 22 → **proceeds** | refuses |

- **The cutover is atomic** — after the flip all 22 rows shared a **single
  distinct `updated_at`**. The old loop would have produced 22.
- **`--target prod` refuses**: `--target production` rejected; `--target prod <
  /dev/null` connected, ran the preflight, printed the plan, then refused for
  want of a terminal. **Production afterwards: 33 elements, 0 numeric-coded,
  latest write still 2026-07-20.**
- **`0033` applied to TEST** and verified independently; the guide reader then
  exercised end to end through the reshaped `get_element` — 22 live bodies, A/B clean.

**Nine verifier scripts, and every one was tested against the shapes it must
REFUSE, not only the ones it should accept** — the lesson PP6b named and PP6c did
not escape. The `verify-down-migration` validator was itself run against five
deliberately corrupted copies and caught all five for the right reason.

## Three self-inflicted breaks, caught before they shipped

1. **A build crash.** A second mid-file `@media (prefers-reduced-motion: reduce)`
   block crashed the Next build worker with an access violation (exit
   `3221225477`) **after typecheck and lint both passed clean**. Isolated by
   bisecting the stylesheet. It was also redundant — the house motion rule
   already covers every `.pw-root` descendant.
2. **A transposed call.** `promoteStaging(archive, staging, superseded)` takes
   three same-typed paths; the wrong order type-checks perfectly and moves the
   only copy of 297 irreplaceable files somewhere nobody is looking. It now takes
   named paths and refuses if any two are equal.
3. **A broken loader.** 7-k deleted the 33 source photographs; `ensurePhoto()`
   read the source *before* checking the target, so the loader crashed on focus
   area 1.1 reading a file it did not need. **Found while writing the production
   runbook** — i.e. by checking a claim the runbook was about to make — rather
   than during the production load.

## ⚠️ `0033` is the point of no return

`0030.down.sql` names `overview_md` and `watch_out_for_md` in every one of its 33
element inserts. `0033` drops both columns, so **once it is applied that rollback
no longer runs.** Production holds **947,140 characters** across those two
columns; TEST, post-`0030`, holds none — which is why the contraction is safe
there and only there. Two independent guards, both exercised. The ordering is
written into the migration header, `ROLLBACK-RUNBOOK.md` §0, and the production
runbook.

## D-PP-a, in full

`/focus-areas` was **a public map of the retired IA by name** — 11 focus areas
and 33 topics that `0030` deletes. Rebuilt to four sections and 22 focus areas;
`/our-support` and `/bring-ph` carry the real numbers; **"200+ checklist items"
is removed rather than restated**; `/our-support`'s six per-area artefacts become
four (the checklist copy promised *"progress saved as you work"*, which died at
D-PP-b).

D-PP-s let this engine draft the copy on one condition — each one-liner is the
owner's own Overview opening sentence. `scripts/verify-public-copy.ts` enforces
it: **30 checks, 22/22 matching**, and the checker was itself tested by
paraphrasing one sentence.

## Deviations from the written plan

- The plan said `CREATE OR REPLACE` the element RPCs before the `DROP COLUMN`.
  **That would have failed** — PostgreSQL refuses to change a function's OUT
  parameters, and `admin_upsert_element` also changes arity. Each is dropped and
  recreated inside the transaction.
- The plan said "33 superseded + 11 unused" photographs. The real figure is **33
  unused of 55**, because the new 22 are copies under new filenames.
- The **timestamp half of M4 is not fixed and cannot be** through the RPC
  surface. Documented instead, with the measurement that sizes it: nothing in
  `src/` reads `elements.created_at`, `elements.updated_at` or
  `resources.created_at`.
- `0029_ia_unlock.up.sql:288` still says the contraction is `0031`. **Left
  deliberately** — `0029` is applied to production and therefore immutable.

## ⚠️ Owed before this sprint is done

| # | |
|---|---|
| 1 | **An independent review.** Three rounds in this series have returned BLOCKING and been right three times. The prompt is in this sprint's report. |
| 2 | **The owner's Preview sign-off on the new public copy** (D-PP-s). Includes one judgement call: focus area 4.4's own sentence reads as an internal note about the website. Reproduced verbatim; the fix, if he wants one, belongs in the Overview document so public and private move together. |
| 3 | **The 1.68 MB `.down.sql` rehearsal on TEST.** Still never executed end to end, and it cannot be from here — verified at 7-f that there is no `psql` on the machine and no Postgres connection string in `.env.local`. Owner action, four steps in `ROLLBACK-RUNBOOK.md`. It doubles as the only way to prove the hardened `0030` guard against a database that genuinely holds the legacy platform. |
| 4 | **The signed-in visual.** The See More card and the four toolkit pages have not been looked at in a browser. Data and rendered HTML are verified; pixels are not. |
| 5 | **The production run** — `docs/PRODUCTION-CUTOVER-RUNBOOK.md`, ten steps, all the owner's. |

## Checks

`pnpm run typecheck` · `pnpm run lint` · `pnpm run build` — green at every one of
the 13 steps. Nine verifier scripts green. Path guard clean: **no change to
middleware, `next.config.ts`, any API route, env handling or CI.** `.env.local`
never staged; no secret in the diff.

---

## Round 4 (same day) — BLOCKING again, fixed again, and the rehearsal ran

The independent review of the PP7 branch returned **BLOCKING: 5 blocking + 3
medium**. The worst was fully deserved: **the production runbook pointed at
TEST-only tools** — `cutover.ts`, `delete-297-objects.ts` and
`restore-297-objects.ts` all hard-refused production while the runbook told the
owner to run them at steps 5 and 8. The sprint that existed to make the
destructive tooling honest had documented a procedure that could not run.

| # | fix |
|---|---|
| H1 | The whole target mechanism (PROD_* by name, exact host, typed ref confirmation, non-TTY refusal) lives **once** in `scripts/lib/connect.ts`; all four mutating scripts share it; the loader's private copy is deleted. |
| H2 | `0032` gains `admin_referenced_paths_among(text[])`; the deleter refuses if ANY candidate is referenced by a surviving row. **Proven live**: a row repointed at `a1/…` was named in the refusal. |
| H3 | The `0030` manifest pins per-area **guide-body md5** and **template-set md5** (generated from the spec, verified against the corpus first), and asserts every surviving object exists in `storage.objects`. The guard refused a three-way decoy naming all three defects. |
| H4 | `0030` takes EXCLUSIVE locks on all four tables as its first statements, held to COMMIT. |
| H5 | Replace-compensation deletes the fresh upload only on a definitive PG errcode; ambiguous transport failures keep both objects with recovery instructions. |
| M1 | The deleter accepts any verified subset of the archived corpus; zero remaining = success; more than archived still refuses. |
| M2 | `0033.down` recreates the seven retired RPCs verbatim (one had been silently dropped by a two-space `grant  execute` defeating the extraction — caught by grepping for all seven names, not trusting the count). |
| M3 | `0033` asserts the three tables are empty before dropping them. |

Also found while editing: **RAISE format strings cannot express adjacent
placeholders** (`%%` is always a literal), so the guard's own refusal message
would have errored with "too many parameters" instead of the diagnosis — on
every version since 7-d, and never reached by any test because the tests
exercised the logic standalone, not the DO block.

### The dress rehearsal — run by the engine, on TEST, in the production order

1. `0033`'s **down**-migration — first ever execution. Columns, tables, policies
   and all seven RPCs back.
2. **The full 1.68 MB `0030` rollback as ONE server-side transaction** — staged
   into a scratch table through the admin session (1,759,410 chars), assembled
   and `EXECUTE`d. Legacy prose restored **byte-perfect**: 1,577,160 code
   points, exactly the documented 3-emoji UTF-16 delta.
3. `restore-297-objects.ts` — 297 objects at exact keys, 110 → 407,
   **`broken_downloads = 0`**, both platforms live. The perfect rollback state.
4. The hardened `0030` **refused a three-way decoy** (tampered body, retitled
   template, repointed path — all three named), then **passed and executed**
   against the authentic legacy fixture.
5. The deleter **refused** with a surviving row pointing at a legacy key (H2
   live), then ran clean: 407 → 110.
6. `0033` re-applied with its new guards. **TEST finished byte-identical to its
   pre-rehearsal state** — guide-corpus digest `8c7d4f37…` unchanged.

The one caveat, recorded in `ROLLBACK-RUNBOOK.md`: through the MCP channel the
1.68 MB file ran without its outer `begin;`/`commit;` (the DO block supplied the
transaction). In the SQL Editor it runs as written. The wrapper line is the only
thing not exercised.

**What this changes about the owner's run:** every step of
`PRODUCTION-CUTOVER-RUNBOOK.md`, including the rollback path, has now been
executed at least once. The TEST rehearsal that was previously owed by the owner
is done.
