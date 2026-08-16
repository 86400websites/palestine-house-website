# Rollback runbook — undoing migration `0030`

> **Read this before you need it.** `0030` is the first destructive migration in
> this project: it deletes 33 focus areas, 10 groups, 33 elements carrying
> 1,577,163 characters of the owner's prose, and 297 template rows — and a
> companion script deletes the 297 files those rows named. This page is how it
> all comes back.
>
> Written at PP7 step 7-f, because the independent review of 2026-08-16 found the
> recovery plan was **a sentence telling the operator to re-upload 297 files by
> hand**. That is a hope, not a rollback.

---

## The one thing to understand first

**A rollback has two halves, and SQL is only one of them.**

| half | what restores it | reversible? |
|---|---|---|
| **Rows** — elements, groups, topics, resources | `0030_content_v2_cutover.down.sql` | ✅ 373 inserts, idempotent |
| **Bytes** — the 297 files in Storage | `scripts/restore-297-objects.ts`, from the cold archive | ✅ *only if the archive exists* |

Restoring the rows without the bytes gives you a platform that looks perfectly
healthy and hands every partner a broken download. **Both halves, always.**

---

## 0. After `0033`, the rollback has three steps, not two

`0030_content_v2_cutover.down.sql` names **`overview_md`** and
**`watch_out_for_md`** in every element insert, so it cannot run while `0033`
has those columns dropped. **`0033`'s own down-migration restores them** —
columns, tables, policies and all seven retired RPCs — after which `0030`'s
rollback runs normally.

> An earlier version of this section called `0033` "the point of no return".
> Review round 5 correctly called that wrong — and it mattered, because an
> emergency operator reading it could have abandoned a viable rollback. The
> three-step order below was **executed end to end in the PP7 rehearsal**
> (2026-08-16) and the legacy prose came back byte-perfect.

**Rolling back BEFORE `0033` is applied:** steps 1–4 below.
**Rolling back AFTER `0033` is applied:** paste
`supabase/sql/migrations/0033_contraction.down.sql` in the SQL Editor first,
then steps 1–4 below, unchanged.

`0033` refuses to run while the legacy platform is present, and refuses again if
any element holds content in either column or any retired table holds a row — so
it cannot destroy data by being run early or out of order.

---

## 1. The archive is the single point of failure

`docs/source-assets/_archive-297-templates/` is the **only copy** of 297 files.
No Supabase backup, flag or statement brings them back.

**297 objects · 5,320,962 bytes · fingerprint `6fde792718130d12071b69459f9d70ab`**

Check it at any time. This command is **strictly read-only** — no network call, no
credential read, nothing opened for writing:

```bash
pnpm exec tsx scripts/verify-archive.ts
```

> ⚠️ **Do not use `backup-297-objects.ts` to check the archive.** It downloads.
> Until PP7 it wrote straight into the archive, so the documented way to verify
> your only backup could destroy it — that was a blocking review finding. It now
> stages and promotes, but the read-only verifier above is still the right tool.

### Required copies

| # | where | how to verify |
|---|---|---|
| 1 | `docs/source-assets/_archive-297-templates/` (working tree, gitignored) | `pnpm exec tsx scripts/verify-archive.ts` |
| 2 | `…_archive-297-templates.superseded/` — kept automatically by a successful re-export | `… --dir docs/source-assets/_archive-297-templates.superseded` |
| 3 | **Off-machine. Owner action.** | `… --dir <wherever you put it>` |

Copy 3 is the one that matters and is the **owner's to place** — the repository
tree does sit inside a OneDrive-synced folder, which gives a replica *provided
sync is healthy*, but "probably synced" is not a backup policy for something with
no other copy. Put a copy somewhere deliberate and verify it with `--dir`.

Any directory can be checked without touching the live one:

```bash
pnpm exec tsx scripts/verify-archive.ts --dir <path>
```

---

## 2. Rolling back

Do it in this order. It is the exact mirror of the forward order — and the
forward order was **reversed at PP7** to rows-first, so the rollback is
bytes-first.

### Step 1 — verify the archive (read-only, ~5 seconds)

```bash
pnpm exec tsx scripts/verify-archive.ts
```

Expect `ARCHIVE VALID — 297 objects`. **If this fails, stop.** Restoring rows
that point at files you cannot produce makes the situation worse, not better.

### Step 2 — put the bytes back, at their exact keys

```bash
pnpm exec tsx scripts/restore-297-objects.ts --target prod --dry-run
pnpm exec tsx scripts/restore-297-objects.ts --target prod
```

(For a TEST rehearsal, `--target test`.) Since review round 5 the script
**refuses to run without an explicit target** — a bare command in a runbook once
pointed a production operator at TEST, and documentation drift cannot select a
database when the script declines to guess.

```
```

The keys are the whole point: a restored `resources` row carries its
`storage_path`, and a re-upload through the CMS would mint a *new* timestamped
key, leaving the row pointing at nothing. This uploads the archive's directory
structure verbatim. It never overwrites (`upsert: false`), so it is safe to
re-run after a partial run, and it refuses outright if a key already exists with
different bytes.

Expect: `VERIFIED — all 297 archived objects are in the bucket at their exact keys`.

### Step 3 — put the rows back

**This one is run by hand in the Supabase SQL Editor.** The file is 1.68 MB;
there is no channel from the build environment that can push that much SQL —
checked at 7-f: no `psql` on the machine and no Postgres connection string
anywhere in `.env.local`, only Supabase API credentials.

1. Validate the file first (offline, instant):

   ```bash
   pnpm exec tsx scripts/verify-down-migration.ts
   ```

   Expect **17 checks · DOWN-MIGRATION STRUCTURALLY VALID**. This is what stops
   a rollback failing at insert 200 of 373 and leaving you half-restored: it
   checks the transaction wrapper, that all 373 statements parse, that every
   dollar-quoted body is terminated, that column and value counts agree, that
   every insert carries `on conflict (id) do nothing`, and that the **foreign-key
   order** holds — elements and groups before topics, elements before resources.

2. Open `supabase/sql/migrations/0030_content_v2_cutover.down.sql`, paste the
   whole file into the SQL Editor, and run it. It is wrapped in one
   `begin; … commit;` — it either all lands or none of it does.

3. Every insert is `on conflict (id) do nothing`, so if it is interrupted, **run
   it again**. It will not duplicate anything.

### Step 4 — verify

```sql
select
  (select count(*) from public.elements where code !~ '^[0-9]')          as legacy_elements,   -- 33
  (select count(*) from public.platform_groups where slug not like '%-focus-areas') as legacy_groups, -- 10
  (select count(*) from public.platform_topics)                          as topics,            -- 33 legacy + however many new ones are loaded (55 if all 22 are)
  (select count(*) from public.resources where is_public = false)        as private_resources,
  (select count(*) from storage.objects where bucket_id = 'resources')   as objects,
  (select count(*) from public.resources r where r.is_public = false
     and not exists (select 1 from storage.objects o
                     where o.bucket_id = r.storage_bucket and o.name = r.storage_path))
                                                                          as broken_downloads;  -- MUST be 0
```

`broken_downloads` is the one that matters: it is exactly the failure mode of
restoring rows without bytes, and it must be **0**.

---

## 3. What a rollback does NOT restore

| | |
|---|---|
| `checklist_items` (818) · `academy_modules` (33) · `checklist_progress` (15) | Deliberate — owner decision A, 2026-08-16. `0029` already dropped their read RPCs, so nothing in the product reaches them, and `0033` drops the tables outright. |
| `created_at` / `updated_at` on restored rows | Stamped `now()`. No admin RPC returns them. **Nothing in `src/` reads `elements.created_at`, `elements.updated_at` or `resources.created_at`** — the product's only `created_at` readers are `profiles`, `applications` and `admins`. Content is exact; bookkeeping timestamps are not. |

To keep the timestamps, capture them from production **before** `0030` runs:

```sql
select id, created_at, updated_at from public.elements  where code !~ '^[0-9]';
select id, created_at             from public.resources where is_public = false;
```

---

## 4. What has actually been rehearsed, and what has not

Stated precisely, because "rehearsed" was the word the review would not accept on
trust.

### ✅ Proven by running it — PP7 step 7-f, on TEST

| | |
|---|---|
| The archive verifies, and the verifier **catches corruption** | A byte swap that leaves both the count and the total size correct is caught by the fingerprint; so are truncation and a missing file. 3/3, exit 1 each. |
| **All 297 objects restored to Storage at their exact keys** | 110 → 407 objects. Every one byte-identical to the archive on read-back, and the server-side aggregate reproduced production's own fingerprint `6fde792718130d12071b69459f9d70ab` at 297 objects / 5,320,962 bytes. |
| **The full round trip** | 110 → restore → 407 → `delete-297-objects.ts` → 110, with the archive still valid afterwards. |
| The deletion refuses without the migration | Its new database preflight confirms `0030` has committed before it removes a single object. |
| The down-migration is structurally sound | 17/17 checks, and the validator was itself tested against five deliberately corrupted copies — missing `on conflict`, an unterminated dollar-quote, an arity mismatch, broken FK order, a removed `commit` — and caught all five for the right reason. |

### ✅ EXECUTED END TO END — review round 4, 2026-08-16, on TEST

The gap this section used to record is closed. The full cycle was run, in the
production order, with these results:

| step | result |
|---|---|
| `0033`'s down-migration | executed (first ever run) — columns, tables, policies and all seven retired RPCs restored |
| **the full 1.68 MB `0030` rollback** | **executed as ONE server-side transaction** (staged into a scratch table, assembled and `EXECUTE`d — 1,759,410 chars). 33 elements · 10 groups · 33 topics · 297 resources restored; legacy prose measured at **1,577,160 code points, exactly the documented 3-emoji delta** from the generator's UTF-16 count, i.e. byte-perfect |
| `restore-297-objects.ts` | 297 objects at their exact keys (110 → 407), every one read back byte-identical; **`broken_downloads = 0`**, both platforms live |
| the hardened `0030` guard, refused | a three-way decoy — tampered guide body (`2.1`), retitled template (`3.2`), repointed storage path (`1.2`) — refused with **all three named**, rolled back |
| the hardened `0030`, applied | passed against the authentic legacy fixture: locks → guard (identity + md5s + storage existence) → deletes → post-conditions → pre-commit re-check |
| `delete-297-objects.ts`, refused | with a surviving row repointed at `a1/…` — the new `admin_referenced_paths_among` preflight named the key and refused |
| `delete-297-objects.ts`, run | 407 → 110, 0 legacy remaining, archive still valid |
| `0033` re-applied | with its new emptiness guard; TEST finished **byte-identical** to its pre-rehearsal state (guide-corpus digest `8c7d4f37…`) |

One caveat, stated precisely: through the MCP channel the 1.68 MB file ran as a
single `EXECUTE` of its statements *without* its outer `begin;`/`commit;` (the
DO block provided the transaction). In the SQL Editor the file runs as written.
Both are one transaction; the wrapper itself is the only line not exercised.
