# Production cutover runbook — PP7

> **Every step here is run by the owner.** This engine writes to production
> through no channel: every mutating script refuses `--target prod` without a
> typed confirmation at a real terminal, migrations are applied by hand in the
> SQL Editor, and the Supabase MCP that Claude can reach is read-only on
> production.
>
> Undoing any of it: [`ROLLBACK-RUNBOOK.md`](./ROLLBACK-RUNBOOK.md).
>
> ✅ **THIS ENTIRE SEQUENCE WAS REHEARSED END TO END ON TEST (2026-08-16, review
> round 4).** TEST was rolled all the way back to the legacy platform — `0033`'s
> down-migration, then the full 1.68 MB `0030` rollback executed as ONE
> transaction, then all 297 objects restored at their exact keys, ending at
> `broken_downloads = 0` with both platforms live — and then brought forward
> again through the hardened `0030` (whose guard first refused a three-way decoy:
> a tampered guide body, a retitled template, a repointed storage path), the
> object deletion (whose new preflight refused while a surviving row pointed at a
> legacy key), and `0033`. TEST finished byte-identical to where it started.
> Every step below has been executed at least once, in this order.

---

## What production looks like right now

Measured read-only, 2026-08-16:

| | |
|---|---|
| migration | **`0029`** |
| elements · topics · groups | 33 · 33 · 10 — **all legacy** (0 numeric-coded) |
| resources | 299 (297 templates + 2 public booklets) |
| Storage objects in `resources` | 297 |
| the new content | **none of it has ever been loaded** |

So production is still the whole A–K platform, exactly as partners use it today.
Everything below puts the owner's real content beside it, switches over in one
statement, and only then removes the old.

---

## Order, and why it is this order

```
 1  verify the archive            read-only, 5 seconds
 2  apply 0032                    additive: one RPC, no table touched
 3  load  --target prod           creates 22 DRAFT focus areas + 110 files
 4  verify the load               nothing is visible to partners yet
 5  cutover --to live             ONE statement, all 22 at once
 6  eyeball the platform          this is the moment to stop if it looks wrong
 7  apply 0030                    deletes the legacy ROWS
 8  delete-297-objects            deletes the legacy BYTES
 9  verify the end state
--  ...live for a while...
10  apply 0033                    ⚠️ after this, step 7 cannot be rolled back
```

Steps 3–5 are additive and reversible: until step 5 nothing is visible, and step
5 reverses with one command. **Step 7 is the first destructive one**, and step 8
is the only one no `.down.sql` can undo — which is why step 1 comes first and why
steps 7 and 8 are in that order (rows before bytes: orphaned bytes are inert and
retryable, live rows pointing at deleted files are not).

---

## 1. Verify the cold backup

```bash
pnpm exec tsx scripts/verify-archive.ts
```

Expect `ARCHIVE VALID — 297 objects`. Strictly read-only — no network call, no
credential read, nothing opened for writing. **If it fails, stop.**

## 2. Apply `0032` (the transactional cutover RPC)

SQL Editor, production, paste `supabase/sql/migrations/0032_transactional_cutover.up.sql`.

Purely additive — one function, no table, column, policy or row touched. Verify:

```sql
select proname, prosecdef, proconfig from pg_proc where proname = 'admin_cutover_focus_areas';
-- prosecdef = true, proconfig = {"search_path="}
```

## 3. Load production

Needs `PROD_SUPABASE_URL`, `PROD_SUPABASE_PUBLISHABLE_KEY`, `PROD_ADMIN_EMAIL`
and `PROD_ADMIN_PASSWORD` in `.env.local`. The script reads **only** those names
for this target and never falls back to another client.

```bash
pnpm exec tsx scripts/load-content.ts --all --target prod --dry-run   # plan only
pnpm exec tsx scripts/load-content.ts --all --target prod             # for real
```

It will print the plan and ask you to type the production project ref
(`jwogtqizqujwhbvpoziu`) before the first write. **It refuses outright if stdin
is not a terminal** — so run it in a real shell, not through a pipe or a CI job.

Everything it creates is a **Draft**. It never publishes and never un-publishes.

Expect: 22 focus areas created, 110 files uploaded (88 templates + 22 guides), 4
groups created, 22 photographs reported as already present.

> It refuses if any targeted focus area is already Live (`--allow-live` is the
> deliberate override), if a template code's registered title disagrees with the
> spec (`--allow-retitle`), or if a focus area's slug has been renamed.

## 4. Verify the load — before anyone can see it

```sql
select
  (select count(*) from public.elements where code ~ '^[0-9]')                as new_elements,   -- 22
  (select count(*) from public.platform_topics t join public.elements e on e.id=t.element_id
    where e.code ~ '^[0-9]' and t.published)                                  as new_live,       -- 0
  (select count(*) from public.elements where code !~ '^[0-9]')               as legacy_elements,-- 33
  (select count(*) from public.platform_topics where published)               as topics_live,    -- 33
  (select count(*) from storage.objects where bucket_id='resources')          as objects;        -- 407
```

`new_live` **must be 0**: the new content is loaded and invisible. `topics_live`
is still 33 — partners see exactly what they saw yesterday.

## 5. The cutover

```bash
pnpm exec tsx scripts/cutover.ts --to live --target prod --dry-run
pnpm exec tsx scripts/cutover.ts --to live --target prod
```

One RPC call. All 22 flip together or none do — a failure cannot leave half the
platform live. It resolves each focus area on **code + slug + section together**
and refuses unless all 22 resolve.

Reverse at any time, same shape: `pnpm exec tsx scripts/cutover.ts --to draft --target prod`.

Break-glass, if the script or the app is unavailable:

```sql
update public.platform_topics t set published = false
from public.platform_groups g
where g.id = t.group_id and g.slug like '%-focus-areas';
```

## 6. Look at it

Sign in as an approved partner and open `/setup`, `/operate`, `/program`,
`/support`. Check a focus area's **See more**, its **Read Now** guide, and one
**template download**. Both platforms are live at this moment — 55 focus areas —
which is ugly but safe, and it is the last point at which stopping costs nothing.

## 7. Apply `0030` — the legacy rows

SQL Editor, production, paste `supabase/sql/migrations/0030_content_v2_cutover.up.sql`.

Its guard is an exact manifest of the 22: every one must be present, published,
in a published section, with a non-empty guide body, exactly one guide file and
its own template count — and no numeric-coded element it does not name. It
re-checks publication again immediately before `COMMIT`. Anything unexpected
rolls the whole migration back.

Expect: `0030 OK — 22 elements · 22 topics · 4 groups · 88 templates · 2 public
booklets kept · 0 orphans`.

## 8. Delete the legacy bytes

```bash
pnpm exec tsx scripts/delete-297-objects.ts --target prod --dry-run
pnpm exec tsx scripts/delete-297-objects.ts --target prod
```

⚠️ **This is the one action no `.down.sql` can undo.** It re-verifies the cold
archive from disk first, then confirms through the database that `0030` has
actually committed, and refuses to delete a single object otherwise.

Expect the bucket to go 407 → 110.

## 9. Verify the end state

Run `supabase/sql/verification/0030_verify_PROD_safe_readonly.sql` (read-only),
then:

```sql
select
  (select count(*) from public.elements)                                     as elements,     -- 22
  (select count(*) from public.platform_topics where published)              as topics_live,  -- 22
  (select count(*) from public.platform_groups)                              as groups,       -- 4
  (select count(*) from public.resources where is_public = false
     and doc_key is null and code is not null)                               as templates,    -- 88
  (select count(*) from public.resources where is_public)                    as booklets,     -- 2
  (select count(*) from storage.objects where bucket_id='resources')         as objects,      -- 110
  (select count(*) from public.resources r where r.is_public = false
     and not exists (select 1 from storage.objects o
                     where o.bucket_id = r.storage_bucket and o.name = r.storage_path))
                                                                              as broken;      -- 0
```

`broken` must be **0**. Then sign in and open the platform once more.

## 10. Later — `0033`, the contraction

⚠️ **Not on the same day.** `0033` drops `elements.overview_md` and
`watch_out_for_md`, and `0030`'s rollback file names both columns — so applying
`0033` ends the ability to roll step 7 back. Production currently holds **947,140
characters** in those two columns; after step 7 it holds none, which is why
`0033` becomes safe at all.

Leave it until the new platform has been live long enough that rolling back is
not a plan you would consider. Then paste
`supabase/sql/migrations/0033_contraction.up.sql`. It refuses if the legacy
platform is still present, and refuses again if any element still holds content
in either column.

---

## If something goes wrong

| when | what to do |
|---|---|
| before step 5 | Nothing is visible. Fix and re-run — the loader is idempotent. |
| after step 5, before step 7 | `pnpm exec tsx scripts/cutover.ts --to draft --target prod`. The legacy platform is untouched and partners are back where they were. |
| after step 7 | [`ROLLBACK-RUNBOOK.md`](./ROLLBACK-RUNBOOK.md) — bytes first, then the 1.68 MB `.down.sql`. |
| after step 8 | Same, and the 297 files come from the cold archive at their exact keys. |
| after step 10 | `0030`'s rollback no longer runs. This is the documented point of no return. |
