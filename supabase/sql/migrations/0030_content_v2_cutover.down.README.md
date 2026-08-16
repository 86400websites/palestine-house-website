# `0030_content_v2_cutover.down.sql` — how it is produced and what it restores

The rollback for migration `0030` **is committed** alongside this file.

## It was nearly not

D-PP-k requires the down-migration to carry the 33 legacy guide bodies as literal
inserts, because a `.down.sql` is the only thing that can bring that prose back.
That makes the file **1.75 MB of `simple_guide_md`, `overview_md` and
`watch_out_for_md`**, and this repository is public — so PP6c withheld it, on the
grounds that S7 Step 7 had verified no gated content was ever committed here.

The independent review of 2026-08-16 then found that **`docs/content-v2-spec.json`
had been carrying all 22 gated guide bodies in public history since PP6b anyway**,
which made the withholding both futile and inconsistent. The owner's call on
2026-08-16 was to **declassify this content**: it is not sensitive.

So the file is committed, and that is not merely tidier — it is what makes the
rollback *operationally recoverable*. A rollback artefact that exists only as a
mutable, gitignored local file is one lost checkout away from being unrecoverable,
which the review raised as a blocking finding in its own right.

## How to get it

It is generated **read-only from production**. It is committed, so you do not need to
regenerate it — but it can be regenerated, with one caveat below:

```bash
pnpm exec tsx scripts/generate-0030-down.ts --dry-run   # counts and sizes
pnpm exec tsx scripts/generate-0030-down.ts             # write the file
```

The generator is committed, reviewable, and calls exactly six read RPCs —
`is_admin`, `admin_list_platform_groups`, `admin_list_platform_topics`,
`admin_get_element`, `admin_list_resource_files`, `get_resource_download`. No
write method appears in it, and it asserts the production project ref before
signing in.

⚠️ **Regeneration only works BEFORE the rollout.** The generator asserts production
still looks like 10 groups / 33 topics / 297 templates, so after the rollout (14 /
55 / 409) and certainly after `0030` it will refuse or find nothing. This is the
reason the committed file matters: *"regenerate it whenever you like"* is false,
and PP7 fixes the generator to snapshot the exact predicate the up-migration
deletes.

⚠️ **It must be generated from PRODUCTION, never from TEST.** Measured 2026-08-16,
the two projects hold *different generations* of the legacy content — only element
A1 is identical, and `simple_guide_md` totals 630,020 characters on production
against 872,068 on TEST. A TEST-sourced rollback would restore the wrong
generation of the owner's words, and would only reveal that during a real
emergency.

## What it restores, and what it cannot

| | restored by the `.down.sql`? |
|---|---|
| 33 `elements` + all three body columns (1,577,163 chars) | ✅ |
| 10 `platform_groups` | ✅ |
| 33 `platform_topics` | ✅ |
| 297 `resources` rows (with their storage paths **and `focus_area_code`**) | ✅ *(the column was added at PP7 — see below)* |
| **297 Storage objects (the actual files)** | ❌ **SQL cannot** |
| `created_at` / `updated_at` on any restored row | ❌ stamped `now()` — see below |
| `checklist_items` (818) · `academy_modules` (33) · `checklist_progress` (15) | ❌ deliberately — owner decision A, 2026-08-16 |

**The 297 files** come from the cold backup at
`docs/source-assets/_archive-297-templates/` (also gitignored, also the only
copy). Re-upload them under the **same object keys**, which the archive preserves
exactly, so the restored `resources.storage_path` values resolve. Verify the
archive first — with the **read-only** verifier, not the exporter:

```bash
pnpm exec tsx scripts/verify-archive.ts
# 297 objects · 5,320,962 bytes · fingerprint 6fde792718130d12071b69459f9d70ab
```

and put them back at their exact keys with:

```bash
pnpm exec tsx scripts/restore-297-objects.ts --dry-run
```

**`resources.focus_area_code` was missing until PP7 (finding M4).** No admin RPC
returns the column, so the generator simply omitted it — and because the
`resources_focus_area_shape` CHECK permits NULL, a rollback would have restored
all 297 rows with it silently emptied and raised no error. It is now DERIVED from
each row's owning element, which was verified exact rather than assumed:
production reports `md5(id || ':' || focus_area_code)` over all 297 non-public
rows as `c5472e4fc37b85f4666504be87017765`, and the generated file reproduces that
digest per row, id by id. Worth knowing for scale: the column is **legacy-only** —
all 112 rows of the new content carry NULL — and nothing in `src/` reads it.

**Timestamps are not restored.** `elements.created_at` / `.updated_at` and
`resources.created_at` are returned by no admin RPC, so restored rows are stamped
`now()`. Recorded rather than hidden, with the measurement that sizes it: nothing
in `src/` reads any of the three — the product's only `created_at` readers are
`profiles`, `applications` and `admins`. Row *content* is restored exactly; the
bookkeeping timestamps are not. To keep them, capture them from production
**before** `0030` runs:

```sql
select id, created_at, updated_at from public.elements  where code !~ '^[0-9]';
select id, created_at             from public.resources where is_public = false;
```

**The 866 cascade rows** are not restored, and that was decided deliberately:
`0029` already dropped `get_checklist` and `get_academy_modules`, so nothing in
the product can read any of them, and PP7's `0033` drops all three tables
outright. A rollback restores a fully working platform minus data no surface
reaches.

## How the snapshot is selected (rewritten at PP7 — finding B4)

The generator used to collect elements and resources by walking
`platform_topics`: one `admin_get_element` per topic, one
`admin_list_resource_files` per topic. `0030` deletes by a different rule —
*every* element whose `code` does not start with a digit, and every non-public
resource belonging to one.

The two agree only while every legacy element has a topic. An **unlinked** legacy
element, and any file hanging off it, was deleted by the up-migration and never
appeared in the rollback — and the generator's own `elements.length === 33` check
passed, because it had counted one element per topic and there were 33 topics.

Measured on production 2026-08-16: **0 unlinked legacy elements, 0 unsnapshotted
resources**, so the previous file was in fact complete. The defect was a trap for
the next generation rather than a hole in the artefact. It is closed by
construction anyway: elements now come from `admin_list_elements()` (the table,
not the topics), topics are selected *by element*, groups by `slug not like
'%-focus-areas'`, and resources are walked over every legacy element.

## Verification status

`scripts/generate-0030-down.ts` produced the file; all **373 inserts** were
validated offline (table known, column count correct, dollar-quotes balanced and
terminated, `on conflict (id) do nothing` present on every one), and a real slice
— the 10 group inserts — was executed against the live TEST schema, round-tripped
including non-ASCII values (`Café`, `Aswātna`), and re-run to prove the
on-conflict guard makes it idempotent.

**PP7 regeneration (2026-08-16):** same shape — 10 groups · 33 topics · 33
elements · 297 resources, 1,577,163 chars of prose — with `focus_area_code` added
to every resource insert and verified per row against production by digest.

⚠️ **STILL NOT EXECUTED END TO END as of step 7-e.** The file is 1.68 MB and must
be run in the Supabase SQL Editor by hand — the documented process for every
migration in this project (`WORKFLOW.md` §14). PP7 step **7-f** rehearses it on
TEST; until that step reports a result here, this remains a rollback nobody has
run, which is what the independent review called blocking.
