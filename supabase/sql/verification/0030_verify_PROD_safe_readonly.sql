-- 0030_verify_PROD_safe_readonly.sql — PP6c
--
-- READ-ONLY. Nothing here writes. Run it on PRODUCTION **BEFORE** anything
-- destructive, to confirm production is in the state 0030 expects, and again
-- afterwards to confirm the result.
--
-- ⚠️ THE ORDER ON PRODUCTION IS NOT NEGOTIABLE — AND STEPS 4 AND 5 WERE SWAPPED
--    AT PP7 (2026-08-16):
--   1. this file            (preflight — every ok must be true)
--   2. the rollout          (the 22 focus areas + 110 files must EXIST and be LIVE)
--   3. verify-archive       (the cold backup, re-verified READ-ONLY from disk)
--   4. 0030_..._up.sql      (drops the ROWS; refuses if step 2 has not happened)
--   5. delete-297-objects   (Storage API — then the BYTES; refuses unless step 4
--                            has committed, which it now checks for itself)
--   6. this file again      (postflight)
--
-- Step 3 before everything is the interlock: nothing destructive runs until the
-- 297 files are provably archived.
--
-- Steps 4 and 5 used to be the other way round, on the reasoning that `0030`
-- deletes the rows carrying the storage paths, so the deletion script had to run
-- first or it would have nothing to work from. That reasoning was simply wrong:
-- `delete-297-objects.ts` has never read `public.resources`. It derives the
-- delete set from the Storage listing and the 22 new slugs in the spec.
--
-- With the false constraint gone, the order follows from which half-finished
-- state is survivable. Objects-first leaves 297 LIVE rows pointing at files that
-- no longer exist — every affected partner gets a broken download and no retry
-- repairs it. Rows-first leaves 297 unreachable files costing 5.3 MB, which is
-- inert, invisible and fixed by running step 5 again.
--
-- ⚠️ Step 3 uses `scripts/verify-archive.ts`, NOT `backup-297-objects.ts`. The
-- exporter downloads; before PP7 it wrote straight into the archive, so the
-- documented way to check the only copy of these files could destroy it.

-- PREFLIGHT 1 — is the legacy platform still what 0030 was written against?
-- Written from production on 2026-08-16: 10 groups · 33 topics · 33 elements ·
-- 297 private templates · 2 public booklets · 297 Storage objects.
select 'preflight: legacy shape' as check,
       (select count(*) from public.platform_groups where slug not like '%-focus-areas') as legacy_groups,
       (select count(*) from public.elements where code !~ '^[0-9]')                      as legacy_elements,
       (select count(*) from public.resources where is_public = false and code is not null
          and element_id in (select id from public.elements where code !~ '^[0-9]'))      as legacy_templates,
       (select count(*) from public.resources where is_public)                            as public_booklets,
       (select count(*) from storage.objects where bucket_id = 'resources')               as objects;

-- PREFLIGHT 2 — the interlock. 0030 REFUSES unless all 22 replacements are live
-- and their groups are published. If this is not 22, the migration will raise
-- and roll back rather than empty the platform.
select 'preflight: replacement is live' as check,
       count(*) as new_live,
       (count(*) = 22) as ok
from public.platform_topics t
join public.platform_groups g on g.id = t.group_id
join public.elements e on e.id = t.element_id
where e.code ~ '^[0-9]' and t.published and g.published;

-- PREFLIGHT 3 — what the cascade will take. These are deleted EXPLICITLY by 0030
-- (owner decision A, 2026-08-16) and are NOT restored by the down-migration.
-- Look at these numbers before running anything.
select 'preflight: cascade losses (NOT restored by .down.sql)' as check,
       (select count(*) from public.checklist_items)    as checklist_items,
       (select count(*) from public.checklist_progress) as checklist_progress,
       (select count(*) from public.academy_modules)    as academy_modules;

-- PREFLIGHT 4 — the cold backup must match THIS database's objects before any
-- deletion. Compare this fingerprint against the one the backup script reports.
-- Recorded 2026-08-16: 297 objects · 5,320,962 bytes ·
--   6fde792718130d12071b69459f9d70ab
-- ⚠️ replace(...,'"','') is required: Storage stores eTags QUOTED, and hashing
-- the quoted form gives a different digest that no downloaded file can reproduce.
select 'preflight: storage fingerprint' as check,
       count(*) as objects,
       sum((metadata->>'size')::bigint) as total_bytes,
       md5(string_agg(name || '|' || replace(metadata->>'eTag','"','') || '|' || (metadata->>'size'),
                      E'\n' order by name)) as fingerprint
from storage.objects
where bucket_id = 'resources'
  and split_part(name,'/',1) not in (
    select t.slug from public.platform_topics t
    join public.platform_groups g on g.id = t.group_id
    where g.slug like '%-focus-areas');

-- ---------------------------------------------------------------------------
-- POSTFLIGHT — run the same file again after 0030. These should all be true.
-- ---------------------------------------------------------------------------
select 'postflight: content shape' as check,
       ((select count(*) from public.elements) = 22
        and (select count(*) from public.platform_topics) = 22
        and (select count(*) from public.platform_groups) = 4
        and (select count(*) from public.resources) = 112) as ok;

select 'postflight: no legacy codes' as check,
       (count(*) filter (where code !~ '^[0-9]') = 0) as ok
from public.elements;

select 'postflight: public booklets kept' as check,
       (count(*) = 2) as ok
from public.resources where is_public;

select 'postflight: no orphaned private rows (the SET NULL trap)' as check,
       (count(*) = 0) as ok
from public.resources where element_id is null and is_public = false;

-- The one a SQL-only object delete would fail: 297 files with no row pointing at
-- them, silently consuming space. Must be 0, and objects must be 110.
select 'postflight: storage has no orphans' as check,
       (select count(*) from storage.objects where bucket_id = 'resources') as objects,
       ((select count(*) from storage.objects o
          where o.bucket_id = 'resources'
            and not exists (select 1 from public.resources r
                            where r.storage_bucket = 'resources' and r.storage_path = o.name)) = 0
        and (select count(*) from storage.objects where bucket_id = 'resources') = 110) as ok;
