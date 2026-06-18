-- S5_verify_PROD_safe_readonly.sql
-- READ-ONLY post-apply check for the S5 content schema (migrations 0011–0015).
-- Seeds NO data, creates NO users, switches NO roles — SAFE to run on the
-- production (live) database, or any database. Run it right after applying
-- 0011–0015, and again after the content ingestion to confirm the counts.
-- Compare each result to its EXPECT.

-- 1) All five S5 tables exist and have RLS enabled
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('elements','checklist_items','checklist_progress',
                  'programming_sessions','resources','academy_modules')
order by relname;
-- EXPECT: all six rows present, relrowsecurity = true for every one
-- (checklist is two tables: checklist_items + checklist_progress)

-- 2) Client policy counts — default-deny everywhere except the two owner-scoped tables
select tablename, count(*) as policies
from pg_policies
where schemaname = 'public'
  and tablename in ('elements','checklist_items','checklist_progress',
                    'programming_sessions','resources','academy_modules')
group by tablename
order by tablename;
-- EXPECT: checklist_progress = 1 (owner SELECT), programming_sessions = 4
-- (own select/insert/update/delete); elements, checklist_items, resources and
-- academy_modules do NOT appear at all (0 policies — read only via their RPCs).

-- 3) All seven S5 RPCs exist, SECURITY DEFINER with a pinned empty search_path
select proname, prosecdef, proconfig
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('get_elements','get_element','get_checklist','set_checklist_progress',
                  'public_programming_sessions','get_resources','get_academy_modules')
order by proname;
-- EXPECT: all seven present; prosecdef = true and proconfig = {search_path=""} for each

-- 4) EXECUTE grants — anon may call ONLY the public projection; authenticated may call all
select
  has_function_privilege('anon','public.get_elements()','execute')                        as anon_elements,
  has_function_privilege('anon','public.get_checklist()','execute')                       as anon_checklist,
  has_function_privilege('anon','public.get_resources()','execute')                       as anon_resources,
  has_function_privilege('anon','public.get_academy_modules()','execute')                 as anon_academy,
  has_function_privilege('anon','public.set_checklist_progress(uuid,text,text)','execute') as anon_setprogress,
  has_function_privilege('anon','public.public_programming_sessions()','execute')          as anon_public,
  has_function_privilege('authenticated','public.get_elements()','execute')               as authed_elements,
  has_function_privilege('authenticated','public.public_programming_sessions()','execute') as authed_public;
-- EXPECT: anon_public = true; every other anon_* = false; authed_* = true.
-- (has_function_privilege also catches grants via PUBLIC, which a pg_roles join would drop.)

-- 5) Storage: resources bucket PRIVATE, booklets bucket PUBLIC, objects default-deny
select id, public from storage.buckets where id in ('resources','booklets') order by id;
-- EXPECT: booklets public = true, resources public = false

select relrowsecurity as objects_rls,
       (select count(*) from pg_policies where schemaname='storage' and tablename='objects') as objects_policies
from pg_class where oid = 'storage.objects'::regclass;
-- EXPECT: objects_rls = true, objects_policies = 0
-- (no anon/pending read of the private bucket; downloads are server-issued signed URLs, S6e)

-- 6) AFTER INGESTION — row + storage-object counts match the source
select
  (select count(*) from public.elements)                                                              as elements,            -- EXPECT 30
  (select count(*) from public.elements
     where overview_md is null or simple_guide_md is null or watch_out_for_md is null or one_line is null) as elements_null_fields, -- EXPECT 0
  (select count(*) from public.checklist_items)                                                       as checklist_items,     -- EXPECT 728 (>= 200)
  (select count(*) from public.checklist_items ci
     left join public.elements e on e.id = ci.element_id where e.id is null)                          as checklist_orphans,   -- EXPECT 0
  (select count(*) from public.academy_modules)                                                       as academy,             -- EXPECT 30
  (select count(*) from public.academy_modules where youtube_url is not null)                         as academy_with_video,  -- EXPECT 0 (filmed later)
  (select count(*) from public.resources where storage_bucket='resources')                            as templates,           -- EXPECT 267
  (select count(*) from public.resources where storage_bucket='booklets')                             as booklets,            -- EXPECT 2
  (select count(*) from public.resources where is_public)                                             as public_resources,    -- EXPECT 2 (booklets only)
  (select count(*) from storage.objects where bucket_id='resources')                                  as storage_templates,   -- EXPECT 267
  (select count(*) from storage.objects where bucket_id='booklets')                                   as storage_booklets;    -- EXPECT 2
