# PP7 step 7-a — the review-round-3 ledger, re-verified against the code

**Date:** 2026-08-16 · **Branch:** `claude/sprint-pp7-hardening-reconciliation`, off `main` = `d723475`
(PR #85, the PP6c merge).

The independent review of the whole PP1→PP6c body of work returned **BLOCKING — 11
blocking + 4 medium**. Six were fixed inside PP6c; the rest are PP7's scope. This
file is the kickoff verification the PP series now runs as standard, because
**PP6a's written plan was wrong in six load-bearing ways and PP6b's in twelve**.
Every claim below was re-derived from the source, and two were measured against the
live databases rather than reasoned about.

**Result: 11 of 11 stand as written. Two are refined, and one carried-forward claim
in the PP6c record is wrong.**

---

## The blockers

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| **B1** | The backup verifier can destroy the only good archive copy before failing. | ✅ **CONFIRMED** | `scripts/backup-297-objects.ts:287` writes each downloaded object straight over its archive path. Assertions 2–4 (count, bytes, fingerprint) do not run until `:316–333`. The overwrite is therefore *committed before the run is known to be valid*. Sharper still: `docs/archive-297-manifest.json` publishes `howToVerify: pnpm exec tsx scripts/backup-297-objects.ts` — **the documented way to verify the archive is the command that can destroy it.** |
| **B2** | Deletion order must flip to rows-first. | ✅ **CONFIRMED** | `0030…up.sql:20–29` mandates objects-first in prose; `delete-297-objects.ts` never queries `public.resources` at all — it has no database preflight of any kind. Orphaned bytes are inert and retryable; live rows pointing at deleted files are neither. |
| **B3** | `0030`'s guard passes on any 22 live numeric-coded rows, so a decoy passes. | ✅ **CONFIRMED** | `0030…up.sql:87–97` is a bare `count(*) … where e.code ~ '^[0-9]' and t.published and g.published` compared to `22`. Nothing pins slug, code, group, body, guide file or per-area template count. |
| **B4** | The down-generator snapshots a different set than the up-migration deletes. | ⚠️ **CONFIRMED AS LOGIC · NOT CURRENTLY TRIGGERED** | `generate-0030-down.ts:195` and `:204` walk `topics` and collect elements/resources *per topic*. `0030` deletes by `elements.code !~ '^[0-9]'` — every legacy element, topic or no. So an unlinked legacy element (and any resource hanging off it) is deleted and never snapshotted. **Measured on production today: `legacy_elements_without_topic` = 0 and `resources_deleted_but_not_snapshotted` = 0**, so the current file is complete. The defect is a live trap for the *next* generation, not a hole in the file on disk — and the fix is still right, because the generator must snapshot the up-migration's own predicate rather than a proxy for it. |
| **B5** | The rollback is not operationally recoverable. | ✅ **CONFIRMED** | The archive is a single gitignored directory on one machine (`docs/source-assets/_archive-297-templates/`, verified present: 297 files + manifest). No tool restores objects at their exact keys — `0030…down.sql:261` tells the operator to re-upload by hand. And the 1.75 MB `.down.sql` has never been executed. |
| **B6** | `cutover.ts` neither validates identity beyond slug nor runs atomically. | ✅ **CONFIRMED** | `cutover.ts:138` resolves targets by slug alone — no code, no group. `:167–173` is a per-row `for` loop of separate RPC calls: a failure at row 12 leaves 11 focus areas live and 11 draft, with no rollback. |
| **B7** | `--target prod` does not exist. | ✅ **CONFIRMED** | `load-content.ts:96–102` accepts `--target` **only in order to refuse it**. Strict parsing itself already landed in PP6c (`scripts/lib/argv.ts`) — the remaining half is the production target itself (D-PP-r). |

## The mediums

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| **M1** | The swap detector is still evadable. | ✅ **CONFIRMED** | `assertCodesHaveNotShifted` (`load-content.ts:410`) only raises when the displaced title reappears **inside the same focus area's** `fa.templates` under a different code. A title that moves *between* focus areas, or a cycle whose other end is not in this area's spec, walks through. `existing.find` also takes only the first clash. |
| **M2** | Slug-as-identity bypasses the Live guard. | ✅ **CONFIRMED** | `load-content.ts:639` matches live rows by `t.slug === fa.slug`. A focus area whose slug was edited in the CMS is invisible to the guard, so `--allow-live` is not required to overwrite it. The same slug-only assumption is what B6 flags in `cutover.ts`. |
| **M3** | A "read-only" script mutates Auth state via global `signOut()`. | 🔴 **CONFIRMED — AND THE PP6c RECORD OVERSTATES THE FIX** | PP6c logs this as fixed. It was fixed in **one file of eight**: `generate-0030-down.ts:181` is `{ scope: "local" }` in a `finally`. Bare global-scope `signOut()` still stands at `backup-297-objects.ts:255,390` · `cutover.ts:163,188` · `delete-297-objects.ts:192,207` · `load-content.ts:689` · `verify-guide-cover-live.mts:145` · `verify-partner-path.ts:311` — **seven files, none in a `finally`.** Any of them logs the owner out of his own browser, and none closes the session when the run throws. |
| **M4** | Restored `resources` rows omit `focus_area_code` and timestamps. | ✅ **CONFIRMED — AND IT BITES TODAY** | `generate-0030-down.ts:314` inserts eleven columns and omits `focus_area_code` and `created_at`; the elements insert at `:280` omits `created_at`/`updated_at`. **Measured on production: all 297 template rows carry a non-null `focus_area_code`**, and the `resources_focus_area_shape` CHECK permits NULL — so a rollback restores 297 rows with the column silently emptied and no error raised. |

## Found here, not in the review

| Claim | Evidence |
|---|---|
| `0030`'s header credits the contraction to **`0031`** (`up.sql:53`), but `0031` shipped as `programming_sessions_approval`. The contraction is `0033`. `src/lib/workspace/content.ts:18` carries the same stale number. | Comment-only, but it is the map an operator reads during an incident. |
| `delete-297-objects.ts:111–132` computes a `fingerprint` over `name\|md5\|0` — size hardcoded to zero — then discards it with `void fingerprint`. The real check (`fp`, `:124–127`) is correct and does stat each file, so nothing is unsafe; the dead variable simply invites the next reader to trust the wrong one. | Dead code beside a load-bearing check. |

---

## Measured state at kickoff

| | PRODUCTION (`jwogtqizqujwhbvpoziu`) | TEST (`sdszcralogcrujtyghig`) |
|---|---|---|
| elements | 33 (all legacy) | 22 (all new) |
| topics / published | 33 | 22 / 22 |
| groups | 10 | 4 |
| templates · public booklets | 297 · 2 | 88 · 2 |
| Storage objects in `resources` | 297 | 110 |
| checklist_items · checklist_progress · academy_modules | — | 0 · 0 · 0 |
| programming_sessions | — | 3 |
| `0030` guard count | — | 22 |

**Production has never been touched by Stage 4's content work** — it is still the
whole legacy platform, on migration `0029`. TEST is fully cut over and `0030` is
already applied there.

**Which sets the shape of this sprint.** `0030` is *not* immutable — it has never
run on production — so B3 can strengthen it in place. But TEST is already past it,
so proving the strengthened guard needs a TEST that is back on the near side of it.
That is exactly what B5's rehearsal produces: run the real `.down.sql`, restore the
297 objects from the cold archive at their exact keys, and TEST is back to 55
elements / 297 templates. The rehearsal PP6c owed and the fixture B3 needs are the
same piece of work, so **7-f runs before 7-d is re-proved**, and the rollback gets
executed rather than described.

## Cold archive

`docs/source-assets/_archive-297-templates/` — **297 objects + `_manifest-full.json`
present on this machine.** Every destructive step in this sprint continues to gate
on it, and 7-b stops it from being the kind of thing a verification run can damage.
