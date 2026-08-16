-- 0030_content_v2_cutover.up.sql
-- PP6c · D-PP-k · 2026-08-16
--
-- Removes the legacy private platform now that the owner's real content has
-- replaced it: 297 template rows, 33 focus areas, 10 groups and the 33 elements
-- carrying the old guide bodies.
--
-- THIS IS THE FIRST DESTRUCTIVE MIGRATION IN THIS PROJECT. Read the four notes
-- below before running it anywhere.
--
-- ---------------------------------------------------------------------------
-- 1. IT DOES NOT DELETE STORAGE OBJECTS, AND MUST NOT
-- ---------------------------------------------------------------------------
-- Supabase's own guidance is explicit: "Deleting objects should always be done
-- via the Storage API and NOT via a SQL query. Deleting objects via a SQL query
-- will not remove the object from the bucket and will result in the object being
-- orphaned." A `delete from storage.objects` here would drop the metadata, leave
-- 5.3 MB of bytes stranded in the bucket, and report success.
--
-- So the 297 files are removed by a separate step, AFTER this migration:
--
--     pnpm exec tsx scripts/verify-archive.ts        # the cold backup is intact
--     -- apply THIS FILE                             # rows go first
--     pnpm exec tsx scripts/delete-297-objects.ts    # then the bytes
--
-- ⚠️ ROWS FIRST, OBJECTS SECOND — REVERSED AT PP7 (2026-08-16), AND THE OLD
--    ORDER'S STATED REASON WAS FALSE ON ITS OWN TERMS.
--
-- This file used to run LAST, on the argument that "this file deletes the rows
-- that carry the storage paths, so running it first would leave the deletion
-- script with nothing to work from." Grepped at PP7's kickoff, that is simply
-- not how the script works: `delete-297-objects.ts` never reads
-- `public.resources` at all. It derives the delete set from the Storage listing
-- and the 22 new focus-area slugs in `docs/content-v2-spec.json` — every object
-- whose top-level folder is not one of the 22. Emptying the table takes nothing
-- away from it.
--
-- With that reason gone, the independent review's argument decides the order,
-- and it is about which half-finished state you would rather be in:
--
--   objects first, then a failed migration  ->  297 LIVE rows pointing at files
--                                               that no longer exist. Every
--                                               affected partner gets a broken
--                                               download, and no retry fixes it.
--
--   rows first, then a failed deletion      ->  297 orphaned files nobody can
--                                               reach, costing 5.3 MB. Inert,
--                                               invisible, and the deletion is
--                                               simply re-run.
--
-- One is a user-visible failure that cannot be undone; the other is untidy.
-- Hence rows first. The deletion script now also refuses to start until it has
-- confirmed through the database that this migration has actually committed.
--
-- ---------------------------------------------------------------------------
-- 2. THE BACKUP IS THE ONLY WAY BACK FOR THE FILES
-- ---------------------------------------------------------------------------
-- `0030_content_v2_cutover.down.sql` restores every ROW deleted here, including
-- 1,577,163 characters of the owner's prose as literal inserts. It cannot
-- restore Storage objects. Those come from the cold backup verified at PP6c
-- step 6c-b: 297 objects · 5,320,962 bytes · fingerprint
-- 6fde792718130d12071b69459f9d70ab, in docs/source-assets/_archive-297-templates/.
--
-- ---------------------------------------------------------------------------
-- 3. WHAT IT DELETES THAT THE SPRINT'S TITLE DOES NOT MENTION (owner: A, 2026-08-16)
-- ---------------------------------------------------------------------------
-- `academy_modules`, `checklist_items` and `checklist_progress` all reference
-- `elements(id)` ON DELETE CASCADE, so removing the 33 elements would take them
-- with it silently. They are deleted EXPLICITLY below instead, so the loss is
-- visible in the migration rather than implied by a foreign key.
--
--   checklist_items     818 rows        academy_modules   33 rows
--   checklist_progress   15 rows
--
-- ⚠️ THE DOWN-MIGRATION DOES NOT RESTORE THESE 866 ROWS. Accepted deliberately:
-- `0029` already dropped `get_checklist` and `get_academy_modules`, so nothing in
-- the product can read any of them; PP7's `0033` drops all three tables outright
-- (this note said `0031`, which shipped instead as the `programming_sessions`
-- approval fix — corrected at PP7's kickoff, because a wrong migration number is
-- the map somebody reads during an incident); and the ROADMAP has recorded them
-- as retired since PP5. A rollback therefore restores a fully working platform
-- minus data that no surface reaches.
--
-- ---------------------------------------------------------------------------
-- 4. DELETION ORDER IS FORCED BY THE FOREIGN KEYS, NOT BY TASTE
-- ---------------------------------------------------------------------------
--   resources.element_id      -> elements   ON DELETE SET NULL   (!)
--   platform_topics.element_id-> elements   ON DELETE CASCADE
--   platform_topics.group_id  -> groups     ON DELETE RESTRICT   (!)
--   checklist_items.element_id-> elements   ON DELETE CASCADE
--   academy_modules.element_id-> elements   ON DELETE CASCADE
--
-- SET NULL is the trap: deleting elements first would not delete the 297
-- resource rows, it would orphan them with a null element_id — leaving rows that
-- point at files this sprint is about to remove. RESTRICT is the other: groups
-- cannot go before the topics filed under them. Hence
-- resources -> topics -> groups -> elements.
--
-- Legacy rows are identified by `elements.code` NOT starting with a digit: the
-- retired vocabulary is A1…K3, the new focus areas are 1.1…4.5. Verified
-- 2026-08-16 as a clean partition — 33 legacy, 22 new, no overlap possible.

begin;

-- ---------------------------------------------------------------------------
-- GUARD. Refuse to run unless the replacement is actually in place and visible.
-- Without this, applying 0030 to a database where the rollout has not run — or
-- has run but is still Draft — empties the platform for every approved partner.
-- ---------------------------------------------------------------------------
do $guard$
declare
  new_live integer;
begin
  select count(*) into new_live
  from public.platform_topics t
  join public.platform_groups g on g.id = t.group_id
  join public.elements e on e.id = t.element_id
  where e.code ~ '^[0-9]' and t.published and g.published;

  if new_live <> 22 then
    raise exception
      'REFUSING TO RUN: % of the 22 new focus areas are live and visible. 0030 removes the legacy platform, so the replacement must be in place and published FIRST or every approved partner is left with an empty platform. Run the rollout and the cutover, then re-apply this migration.',
      new_live;
  end if;
end
$guard$;

-- ---------------------------------------------------------------------------
-- 1. checklist_progress — before checklist_items (see note 3)
-- ---------------------------------------------------------------------------
delete from public.checklist_progress
where checklist_item_id in (
  select ci.id from public.checklist_items ci
  join public.elements e on e.id = ci.element_id
  where e.code !~ '^[0-9]'
);

-- ---------------------------------------------------------------------------
-- 2. checklist_items (818) and academy_modules (33) — explicitly, not by cascade
-- ---------------------------------------------------------------------------
delete from public.checklist_items
where element_id in (select id from public.elements where code !~ '^[0-9]');

delete from public.academy_modules
where element_id in (select id from public.elements where code !~ '^[0-9]');

-- ---------------------------------------------------------------------------
-- 3. resources — the 297 legacy templates. BEFORE elements: the FK is SET NULL,
--    so doing this later would orphan them rather than delete them.
--    The two PUBLIC booklets are kept: they carry element_id IS NULL and
--    is_public = true, and are not part of the legacy focus-area content.
-- ---------------------------------------------------------------------------
delete from public.resources
where is_public = false
  and element_id in (select id from public.elements where code !~ '^[0-9]');

-- ---------------------------------------------------------------------------
-- 4. platform_topics (33) — before groups, whose FK is RESTRICT
-- ---------------------------------------------------------------------------
delete from public.platform_topics
where element_id in (select id from public.elements where code !~ '^[0-9]');

-- ---------------------------------------------------------------------------
-- 5. platform_groups (10) — the superseded groups, now empty
-- ---------------------------------------------------------------------------
delete from public.platform_groups
where slug not like '%-focus-areas';

-- ---------------------------------------------------------------------------
-- 6. elements (33) — the old guide bodies
-- ---------------------------------------------------------------------------
delete from public.elements where code !~ '^[0-9]';

-- ---------------------------------------------------------------------------
-- POST-CONDITIONS. Assert the end state inside the transaction, so anything
-- unexpected rolls the whole thing back rather than leaving a half-migrated
-- platform behind.
-- ---------------------------------------------------------------------------
do $check$
declare
  n_elements integer; n_topics integer; n_groups integer;
  n_templates integer; n_public integer; n_orphan integer;
  n_checklist integer; n_academy integer;
begin
  select count(*) into n_elements  from public.elements;
  select count(*) into n_topics    from public.platform_topics;
  select count(*) into n_groups    from public.platform_groups;
  select count(*) into n_templates from public.resources where is_public = false and doc_key is null and code is not null;
  select count(*) into n_public    from public.resources where is_public;
  select count(*) into n_orphan    from public.resources where element_id is null and is_public = false;
  select count(*) into n_checklist from public.checklist_items;
  select count(*) into n_academy   from public.academy_modules;

  if n_elements <> 22 then raise exception '0030: expected 22 elements, found %', n_elements; end if;
  if n_topics   <> 22 then raise exception '0030: expected 22 topics, found %', n_topics; end if;
  if n_groups   <> 4  then raise exception '0030: expected 4 groups, found %', n_groups; end if;
  if n_templates<> 88 then raise exception '0030: expected 88 template rows, found %', n_templates; end if;
  if n_public   <> 2  then raise exception '0030: the 2 public booklets must survive, found %', n_public; end if;
  if n_orphan   <> 0  then raise exception '0030: % private resource row(s) left with a null element — the SET NULL trap fired', n_orphan; end if;
  if n_checklist<> 0  then raise exception '0030: expected 0 checklist_items, found %', n_checklist; end if;
  if n_academy  <> 0  then raise exception '0030: expected 0 academy_modules, found %', n_academy; end if;

  raise notice '0030 OK — 22 elements · 22 topics · 4 groups · 88 templates · 2 public booklets kept · 0 orphans';
end
$check$;

commit;

-- AFTER COMMITTING, THE BYTES ARE STILL THERE. That is the design (note 1), and
-- it is the safe half of the split: 297 files nobody can reach, because the rows
-- that named them are gone. Finish the job:
--
--   pnpm exec tsx scripts/delete-297-objects.ts --dry-run
--   pnpm exec tsx scripts/delete-297-objects.ts
--
-- It re-verifies the cold archive from disk, then confirms through the database
-- that THIS MIGRATION has committed, and refuses to delete a single object
-- otherwise. Then check the bucket is down to the 110 new objects:
--
--   select count(*) from storage.objects where bucket_id = 'resources';   -- 110
--
-- If it still reports 407, the deletion has not been run and 297 orphaned files
-- are consuming space with no row pointing at them. Untidy, not urgent, and
-- retryable — which is exactly why the rows go first.
