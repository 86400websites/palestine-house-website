-- 0029_verify_PROD_safe_readonly.sql
-- PRODUCTION-SAFE companion to 0029_verify_TEST_db_only.sql.
-- READ-ONLY: no writes, no role switching, no temporary objects, no transaction.
-- Every statement is a SELECT. Safe to paste into the production SQL Editor
-- after the owner has applied 0029_ia_unlock.up.sql by hand.
--
-- It proves the SHAPE of the change. The BEHAVIOURAL proof (a drafted focus
-- area becoming unreachable through all four read RPCs, and a 34th focus area
-- being creatable) requires role simulation and writes, so it lives in the
-- TEST-only file and is run there first, as WORKFLOW.md §14 requires.

-- ===========================================================================
-- 1) The ceiling is gone; the A–K vocabulary is optional.
-- ===========================================================================
select
  (select pg_get_constraintdef(oid) from pg_constraint
    where conname = 'elements_slug_shape'
      and conrelid = 'public.elements'::regclass)     as slug_check,
  (select pg_get_constraintdef(oid) from pg_constraint
    where conname = 'elements_focus_area_shape'
      and conrelid = 'public.elements'::regclass)     as focus_area_check,
  (select string_agg(column_name || '=' || is_nullable, ', ' order by column_name)
     from information_schema.columns
    where table_schema = 'public' and table_name = 'elements'
      and column_name in ('focus_area_code', 'focus_area_name', 'code', 'slug'))
                                                     as nullability;
-- EXPECT: slug_check allows a general kebab slug (NOT '^[a-k][1-3]$');
--         focus_area_check allows NULL;
--         nullability = code=NO, focus_area_code=YES, focus_area_name=YES, slug=NO.

-- ===========================================================================
-- 2) Draft/Live present, defaulting to Live, with NOTHING accidentally drafted.
--    This is the one that proves 0029 was a no-op on screen.
-- ===========================================================================
select
  (select string_agg(table_name || ' null=' || is_nullable || ' default=' ||
                     coalesce(column_default, '-'), ' | ' order by table_name)
     from information_schema.columns
    where table_schema = 'public' and column_name = 'published')   as published_cols,
  (select count(*) from public.platform_topics where not published) as draft_topics,
  (select count(*) from public.platform_groups where not published) as draft_groups;
-- EXPECT: both tables listed, null=NO default=true; draft_topics = 0; draft_groups = 0.

-- ===========================================================================
-- 3) The content is untouched. 0029 moves no rows.
-- ===========================================================================
select
  (select count(*) from public.platform_sections)  as sections,
  (select count(*) from public.platform_groups)    as groups,
  (select count(*) from public.platform_topics)    as topics,
  (select count(*) from public.elements)           as elements,
  (select count(*) from public.resources)          as resources,
  (select count(*) from public.resources
     where is_public = false and doc_key is null and code is not null) as grid,
  (select count(*) from public.resources
     where is_public = false and doc_key is null and code is not null
       and storage_bucket <> 'resources')          as wrong_bucket_in_grid,
  (select count(*) from public.resources
     where is_public = true and storage_bucket = 'booklets'
       and element_id is null)                     as booklets,
  (select count(*) from public.resources where doc_key = 'guide') as guide_rows;
-- EXPECT: 5 / 10 / 33 / 33 / 299 / 297 / 0 / 2 / 0 — identical to the pre-0029
--         baseline. guide_rows = 0 until PP6b uploads the first one.

-- ===========================================================================
-- 4) Every topic still resolves its templates. If the new published predicate
--    were wrong, this is where it would show as an empty grid.
-- ===========================================================================
with per_topic as (
  select t.element_id, count(r.id) as files
  from public.platform_topics t
  left join public.resources r
    on r.element_id = t.element_id
   and r.doc_key is null
   and r.code is not null
  where t.published
  group by t.element_id
)
select count(*)                          as published_topics,
       count(*) filter (where files = 0) as topics_with_no_templates,
       sum(files)                        as template_files
from per_topic;
-- EXPECT: published_topics = 33, topics_with_no_templates = 0, template_files = 297.

-- ===========================================================================
-- 5) The gate, restated as the BLANKET rule (PP5's lesson: an enumeration in a
--    security check silently becomes an allowlist). Every SECURITY DEFINER
--    function reachable by a signed-in caller is listed here, with whether its
--    body mentions an authorization predicate — reads AND writes.
-- ===========================================================================
select
  p.proname,
  p.prosecdef                                                as security_definer,
  array_to_string(p.proconfig, ',')                          as config,
  has_function_privilege('anon',          p.oid, 'execute')   as anon_execute,
  has_function_privilege('authenticated', p.oid, 'execute')   as authenticated_execute,
  (pg_get_functiondef(p.oid) ~ 'is_approved\(\)')            as mentions_is_approved,
  (pg_get_functiondef(p.oid) ~ 'is_admin\(\)')               as mentions_is_admin,
  (pg_get_functiondef(p.oid) ~ 'auth\.uid\(\)')              as mentions_auth_uid
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
  and has_function_privilege('authenticated', p.oid, 'execute')
order by p.proname;
-- EXPECT: anon_execute = false on EVERY row.
--         Every get_platform_* / get_element / get_resources /
--         get_resource_download row has mentions_is_approved = true.
--         Every admin_* row has mentions_is_admin = true.
--         The only rows with neither are the owner-scoped account/profile
--         functions, which authorize on auth.uid() instead — that is the ONE
--         documented exception (SECURITY-CHECKLIST §15).

-- ===========================================================================
-- 6) The four filtered readers actually carry the published predicate, and the
--    unfiltered caller-less list is gone.
-- ===========================================================================
select
  p.proname,
  (pg_get_functiondef(p.oid) ~ 'published') as filters_published
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('get_platform_topics', 'get_element',
                    'get_resources', 'get_resource_download')
order by p.proname;
-- EXPECT: four rows, filters_published = true on ALL FOUR.
--         get_resource_download is the one that matters most — it is the only
--         surface that hands out bytes.

select count(*) as get_elements_remaining
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'get_elements';
-- EXPECT: 0 (dropped by 0029 — unfiltered and caller-less; see its header).

-- ===========================================================================
-- 7) admin_upsert_element carries the WIDENED guards. Layer 2 of the ceiling.
-- ===========================================================================
select
  (pg_get_functiondef(p.oid) ~ '\^\[a-k\]\[1-3\]\$') as still_has_narrow_slug_guard,
  (pg_get_functiondef(p.oid) ~ 'a-z0-9')             as has_general_slug_guard,
  (pg_get_functiondef(p.oid) ~ 'v_fac is not null')  as focus_area_now_optional
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'admin_upsert_element';
-- EXPECT: still_has_narrow_slug_guard = false, has_general_slug_guard = true,
--         focus_area_now_optional = true.
--         If the first is TRUE, 0029 did not actually lift the ceiling — the
--         table CHECK alone is not enough, which is exactly the error the
--         pre-amendment sprint scope would have shipped.

-- ===========================================================================
-- 8) D-PP-i — the SECURITY-CHECKLIST §15 debt, owed since PP3. `0029` pays it
--    with TABLE CONSTRAINTS rather than RPC checks, so the guard holds against
--    every future writer, not only callers who use the right function.
-- ===========================================================================
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.resources'::regclass
  and conname in ('resources_private_needs_element', 'resources_private_bucket_shape',
                  'resources_guide_needs_element',  'resources_private_needs_code')
order by conname;
-- EXPECT: four rows.
--   resources_private_bucket_shape  CHECK (is_public OR storage_bucket = 'resources')
--   resources_private_needs_code    CHECK (is_public OR code IS NOT NULL OR doc_key IS NOT NULL)
--   resources_private_needs_element CHECK (is_public OR element_id IS NOT NULL)
--   resources_guide_needs_element   CHECK (doc_key IS NULL OR element_id IS NOT NULL)
-- NOTE the bucket guard is CONDITIONAL by design: a blanket
-- storage_bucket = 'resources' would abort, because the two public booklet PDFs
-- legitimately live in the `booklets` bucket.

-- The invariants the constraints now enforce, re-counted on live data.
select
  count(*) filter (where not is_public and storage_bucket <> 'resources') as private_wrong_bucket,
  count(*) filter (where not is_public and element_id is null)            as private_without_focus_area,
  count(*) filter (where doc_key is not null and element_id is null)      as orphan_guides,
  count(*) filter (where not is_public and code is null and doc_key is null) as unbadged_private,
  count(*) filter (where is_public)                                       as public_files
from public.resources;
-- EXPECT: 0, 0, 0, 0, and public_files = 2 (the two booklets).

-- storage.objects: the admin write path + an admin read path, WITHOUT widening
-- what a partner can see. Policies are OR-ed, so the 0017 partner policy is
-- left exactly as it was and a second SELECT policy is added for admins.
select polname,
       polcmd::text as command,
       pg_get_expr(polqual,      polrelid) as using_expr,
       pg_get_expr(polwithcheck, polrelid) as with_check_expr
from pg_policy
where polrelid = 'storage.objects'::regclass
order by polname;
-- EXPECT: five rows.
--   resources_bucket_select_approved [r]  bucket_id = 'resources' AND is_approved()
--                                         AND is_published_object(name)  <- NARROWED by 0029
--   resources_bucket_select_admin    [r]  bucket_id = 'resources' AND is_admin()
--   resources_bucket_insert_admin    [a]                                              with check ... is_admin()
--   resources_bucket_update_admin    [w]  bucket_id = 'resources' AND is_admin()      with check ... is_admin()
--   resources_bucket_delete_admin    [d]  bucket_id = 'resources' AND is_admin()
-- resources_bucket_select_approved IS deliberately changed by 0029, and this is
-- the check that it changed CORRECTLY. 0017 granted approved partners SELECT on
-- every object in the private bucket with no link to `published`, so a Draft
-- focus area's FILES were reachable straight from the Storage API, bypassing all
-- four filtered RPCs. If this policy still reads is_approved() alone, the hole is
-- open: Draft is a boundary for rows and an illusion for bytes.
--
-- The test goes through public.is_published_object(), which MUST be SECURITY
-- DEFINER: a policy expression runs as the INVOKING role and public.resources is
-- RLS default-deny, so an inline join would match nothing and deny every
-- download instead. Checked below.

select p.proname,
       p.prosecdef                                      as security_definer,
       array_to_string(p.proconfig, ',')                as config,
       has_function_privilege('anon', p.oid, 'execute') as anon_execute
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'is_published_object';
-- EXPECT: one row; security_definer = true, config = search_path="",
--         anon_execute = false.

-- The file lifecycle, and the fact that it cannot leak a storage path to a
-- browser: admin_list_resource_files deliberately does NOT return storage_path.
select p.proname,
       pg_get_function_result(p.oid) ~ 'storage_path' as returns_storage_path,
       has_function_privilege('anon', p.oid, 'execute') as anon_execute
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('admin_list_resource_files', 'admin_register_resource_file',
                    'admin_replace_resource_file', 'admin_update_resource_meta',
                    'admin_delete_resource_file', 'admin_reorder_resource_files')
order by p.proname;
-- EXPECT: six rows, anon_execute = false on all.
--         returns_storage_path = false for admin_list_resource_files (the one a
--         screen renders) and true only for admin_delete_resource_file, which
--         hands the key to the SERVER ACTION so it can delete the object.

-- Unreferenced Storage objects (the documented residue of a delete whose second
-- half failed). Inert — signed URLs are minted only from resources rows — but
-- worth watching. This is a report, not a failure.
select count(*) as unreferenced_objects
from storage.objects o
where o.bucket_id = 'resources'
  and not exists (select 1 from public.resources r
                   where r.storage_bucket = o.bucket_id and r.storage_path = o.name);
-- EXPECT: 0 immediately after a clean run. A non-zero count is cleanup work,
-- not a breach.

-- ===========================================================================
-- 9) RLS posture unchanged: default-deny, zero client policies, RPC-only reads.
-- ===========================================================================
select t.relname, t.relrowsecurity as rls_enabled, count(p.polname) as client_policies
from pg_class t
join pg_namespace n on n.oid = t.relnamespace
left join pg_policy p on p.polrelid = t.oid
where n.nspname = 'public'
  and t.relname in ('platform_sections', 'platform_groups', 'platform_topics',
                    'elements', 'resources')
group by t.relname, t.relrowsecurity
order by t.relname;
-- EXPECT: five rows, rls_enabled = true, client_policies = 0 on every one.
