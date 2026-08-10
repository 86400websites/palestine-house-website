-- 0027_verify_PROD_safe_readonly.sql
-- Production-safe verification for migrations 0027_platform_ia + 0028_platform_seed
-- (PP1 — the new workspace IA presentation layer). READ-ONLY: plain selects, no
-- role switching, no writes. Run after applying 0027 THEN 0028 by hand in the
-- production SQL editor (the PP2 merge gate — see ROADMAP.md Stage 4).

-- A1) The four platform tables exist with RLS enabled and ZERO client policies.
select
  t.relname,
  t.relrowsecurity as rls_enabled,
  count(p.polname)  as client_policies
from pg_class t
join pg_namespace n on n.oid = t.relnamespace
left join pg_policy p on p.polrelid = t.oid
where n.nspname = 'public'
  and t.relname in
    ('platform_sections', 'platform_groups', 'platform_topics', 'platform_extras')
group by t.relname, t.relrowsecurity
order by t.relname;
-- EXPECT: four rows, rls_enabled = true, client_policies = 0 on every row.

-- A2) Seed shape.
select
  (select count(*) from public.platform_sections)                 as sections,
  (select count(*) from public.platform_groups)                   as groups,
  (select count(*) from public.platform_topics)                   as topics,
  (select count(*) from public.platform_extras)                   as extras,
  (select count(distinct element_id) from public.platform_topics) as distinct_elements,
  (select count(*) from public.elements e
     left join public.platform_topics t on t.element_id = e.id
     where t.id is null)                                          as unmapped_elements;
-- EXPECT: sections = 5, groups = 10, topics = 33, extras = 15,
--         distinct_elements = 33, unmapped_elements = 0.

select g.section_slug, count(t.id) as topic_count
from public.platform_groups g
left join public.platform_topics t on t.group_id = g.id
group by g.section_slug
order by g.section_slug;
-- EXPECT: operate = 15, program = 9, setup = 5, support = 4.

-- A3) resources columns + deterministic code backfill.
select
  count(*) filter (where code is not null)    as coded,
  count(*) filter (where code is null)        as uncoded,
  count(*) filter (where doc_key is not null) as doc_keys
from public.resources;
-- EXPECT: coded = 297, uncoded = 2 (the booklets), doc_keys = 0.

select indexname from pg_indexes
where schemaname = 'public' and indexname = 'resources_element_doc_key_ux';
-- EXPECT: one row.

-- A4) EXECUTE privileges: anon denied, authenticated granted.
select
  p.proname,
  has_function_privilege('anon',          p.oid, 'execute') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('get_platform_sections', 'get_platform_topics',
                    'get_platform_extras', 'get_resources')
order by p.proname;
-- EXPECT: four rows; anon_execute = false, authenticated_execute = true on all.

-- A5) get_resources() carries the two appended columns (old callers unaffected).
select pg_get_function_result(p.oid) like '%code text, doc_key text%' as widened
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'get_resources';
-- EXPECT: widened = true.

-- A6) Spot-check three topics across sections (mapping sanity — bodies attach
--     through element_id, so the joined element title must be the same topic).
select t.slug as topic_slug, t.title as topic_title, e.slug as element_slug, e.title as element_title
from public.platform_topics t
join public.elements e on e.id = t.element_id
where t.slug in ('launching-a-new-house', 'menu-and-palestinian-culinary-identity', 'crisis-management')
order by t.slug;
-- EXPECT: launching-a-new-house -> i2 'Launching a New House';
--         menu-and-palestinian-culinary-identity -> k1 'Menu & Palestinian Culinary Identity';
--         crisis-management -> i3 'Crisis Management'.
