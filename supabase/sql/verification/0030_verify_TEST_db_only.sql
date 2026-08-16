-- 0030_verify_TEST_db_only.sql — PP6c
-- Run AFTER `0030_content_v2_cutover.up.sql` and then `scripts/delete-297-objects.ts`
-- (that order, reversed at PP7 2026-08-16 — rows first, bytes second; see the
-- migration header for why the old rationale was false).
-- Safe to run repeatedly; reads only.
--
-- Every row below should report ok = true. Anything false is a defect, not a
-- rounding difference — 0030 asserts its own post-conditions inside the
-- transaction, so a false here means something changed AFTER the migration.

-- 1. The end state: the new platform, and nothing of the old one.
select 'content shape' as check,
       (select count(*) from public.elements)            as elements,
       (select count(*) from public.platform_topics)     as topics,
       (select count(*) from public.platform_groups)     as groups,
       (select count(*) from public.resources)           as resources,
       ((select count(*) from public.elements) = 22
        and (select count(*) from public.platform_topics) = 22
        and (select count(*) from public.platform_groups) = 4
        and (select count(*) from public.resources) = 112) as ok;

-- 2. The legacy vocabulary is gone. Codes A1..K3 retired; 1.1..4.5 remain.
select 'no legacy codes' as check,
       count(*) filter (where code !~ '^[0-9]') as legacy_left,
       count(*) filter (where code ~ '^[0-9]') as new_present,
       (count(*) filter (where code !~ '^[0-9]') = 0
        and count(*) filter (where code ~ '^[0-9]') = 22) as ok
from public.elements;

-- 3. The two PUBLIC booklets survived. They are not focus-area content and 0030
--    must never touch them.
select 'public booklets kept' as check,
       count(*) as booklets,
       (count(*) = 2) as ok
from public.resources where is_public;

-- 4. The SET NULL trap did not fire. resources.element_id is ON DELETE SET NULL,
--    so deleting elements before resources would leave orphan rows rather than
--    remove them. Zero is the only acceptable answer.
select 'no orphaned private rows' as check,
       count(*) as orphans,
       (count(*) = 0) as ok
from public.resources where element_id is null and is_public = false;

-- 5. Storage and the database agree, in BOTH directions. The left side catches a
--    row pointing at a file that no longer exists; the right side catches the
--    orphaned objects a SQL-only delete would have left behind.
select 'storage <-> rows' as check,
       (select count(*) from public.resources r
         where r.storage_path is not null
           and not exists (select 1 from storage.objects o
                           where o.bucket_id = r.storage_bucket and o.name = r.storage_path)) as rows_without_object,
       (select count(*) from storage.objects o
         where o.bucket_id = 'resources'
           and not exists (select 1 from public.resources r
                           where r.storage_bucket = 'resources' and r.storage_path = o.name)) as orphaned_objects,
       (select count(*) from storage.objects where bucket_id = 'resources') as objects,
       ((select count(*) from public.resources r
          where r.storage_path is not null
            and not exists (select 1 from storage.objects o
                            where o.bucket_id = r.storage_bucket and o.name = r.storage_path)) = 0
        and (select count(*) from storage.objects o
              where o.bucket_id = 'resources'
                and not exists (select 1 from public.resources r
                                where r.storage_bucket = 'resources' and r.storage_path = o.name)) = 0
        and (select count(*) from storage.objects where bucket_id = 'resources') = 110) as ok;

-- 6. The cascade tables are empty (owner decision A, 2026-08-16). Deleted
--    explicitly by 0030 rather than silently by the elements cascade.
--    ⚠️ The down-migration does NOT restore these.
select 'cascade tables cleared' as check,
       (select count(*) from public.checklist_items)    as checklist_items,
       (select count(*) from public.checklist_progress) as checklist_progress,
       (select count(*) from public.academy_modules)    as academy_modules,
       ((select count(*) from public.checklist_items) = 0
        and (select count(*) from public.academy_modules) = 0) as ok;

-- 7. Every focus area is complete: one guide file and at least one template each,
--    and 88 templates in total across the 22.
select 'per-focus-area files' as check,
       count(*) as focus_areas,
       sum(templates) as total_templates,
       sum(guides) as total_guides,
       (count(*) = 22 and sum(templates) = 88 and sum(guides) = 22) as ok
from (
  select t.slug,
         count(*) filter (where r.doc_key is null and r.code is not null) as templates,
         count(*) filter (where r.doc_key = 'guide') as guides
  from public.platform_topics t
  left join public.resources r on r.element_id = t.element_id
  group by t.slug
) per_area;

-- 8. Nothing is left unpublished by accident: the cutover put all 22 live.
select 'all 22 live' as check,
       count(*) filter (where published) as live,
       count(*) filter (where not published) as draft,
       (count(*) filter (where published) = 22) as ok
from public.platform_topics;
