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
| 297 `resources` rows (with their storage paths) | ✅ |
| **297 Storage objects (the actual files)** | ❌ **SQL cannot** |
| `checklist_items` (818) · `academy_modules` (33) · `checklist_progress` (15) | ❌ deliberately — owner decision A, 2026-08-16 |

**The 297 files** come from the cold backup at
`docs/source-assets/_archive-297-templates/` (also gitignored, also the only
copy). Re-upload them under the **same object keys**, which the archive preserves
exactly, so the restored `resources.storage_path` values resolve. Verify the
archive first:

```bash
pnpm exec tsx scripts/backup-297-objects.ts
# 297 objects · 5,320,962 bytes · fingerprint 6fde792718130d12071b69459f9d70ab
```

**The 866 cascade rows** are not restored, and that was decided deliberately:
`0029` already dropped `get_checklist` and `get_academy_modules`, so nothing in
the product can read any of them, and PP7's `0031` drops all three tables
outright. A rollback restores a fully working platform minus data no surface
reaches.

## Verification status

`scripts/generate-0030-down.ts` produced the file; all **373 inserts** were
validated offline (table known, column count correct, dollar-quotes balanced and
terminated, `on conflict (id) do nothing` present on every one), and a real slice
— the 10 group inserts — was executed against the live TEST schema, round-tripped
including non-ASCII values (`Café`, `Aswātna`), and re-run to prove the
on-conflict guard makes it idempotent.

⚠️ **The full 1.75 MB file has not been executed end to end.** There is no channel
from the build environment that can push that much SQL. It must be run in the
Supabase SQL Editor by hand — which is the documented process for every migration
in this project (`WORKFLOW.md` §14) — and should be rehearsed on TEST before it is
ever needed on production.
