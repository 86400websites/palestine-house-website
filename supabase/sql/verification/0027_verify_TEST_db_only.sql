-- 0027_verify_TEST_db_only.sql
-- Role-simulated proof for migrations 0027_platform_ia + 0028_platform_seed
-- (PP1 — the new workspace IA presentation layer). TEST DATABASE ONLY: section 4
-- switches role inside begin ... rollback. It leaves NO permanent data. For
-- production use the read-only companion file.
-- Run the whole file after applying 0027 THEN 0028; every EXPECT must pass.

-- ===========================================================================
-- 0) The four platform tables exist, RLS is enabled, and there are ZERO client
--    policies (default-deny; RPC-only reads — the 0011 posture).
-- ===========================================================================
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

-- ===========================================================================
-- 1) Seed shape: 5 sections (about + 4) / 10 groups / 33 topics (5/15/9/4)
--    / 15 extras across 6 topics; every element surfaces exactly once.
-- ===========================================================================
select
  (select count(*) from public.platform_sections)                    as sections,
  (select count(*) from public.platform_groups)                      as groups,
  (select count(*) from public.platform_topics)                      as topics,
  (select count(*) from public.platform_extras)                      as extras,
  (select count(distinct topic_id) from public.platform_extras)      as extra_topics,
  (select count(distinct element_id) from public.platform_topics)    as distinct_elements,
  (select count(*) from public.platform_topics t
     join public.elements e on e.id = t.element_id)                  as topics_joined;
-- EXPECT: sections = 5, groups = 10, topics = 33, extras = 15,
--         extra_topics = 6, distinct_elements = 33, topics_joined = 33.

select g.section_slug, count(t.id) as topic_count
from public.platform_groups g
left join public.platform_topics t on t.group_id = g.id
group by g.section_slug
order by g.section_slug;
-- EXPECT: operate = 15, program = 9, setup = 5, support = 4 (about has no groups).

-- Element coverage: no element left unmapped.
select count(*) as unmapped_elements
from public.elements e
left join public.platform_topics t on t.element_id = e.id
where t.id is null;
-- EXPECT: unmapped_elements = 0.

-- ===========================================================================
-- 2) resources: additive columns + deterministic code backfill.
--    All 297 private templates follow the <slug>/tNN- path convention, so all
--    get a code; the 2 public booklets (bare filenames) stay NULL. doc_key is
--    NULL everywhere until the owner uploads standard docs via CMS v2 (PP6).
-- ===========================================================================
select
  count(*) filter (where code is not null)                    as coded,
  count(*) filter (where code is null)                        as uncoded,
  count(*) filter (where code !~ '^[A-Z][0-9]{2,}$'
                   and code is not null)                      as malformed,
  count(*) filter (where doc_key is not null)                 as doc_keys
from public.resources;
-- EXPECT: coded = 297, uncoded = 2 (the booklets), malformed = 0, doc_keys = 0.

select indexname from pg_indexes
where schemaname = 'public' and indexname = 'resources_element_doc_key_ux';
-- EXPECT: one row.

-- ===========================================================================
-- 3) EXECUTE privileges: anon denied, authenticated granted, on the three new
--    RPCs and the widened get_resources().
-- ===========================================================================
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

-- ===========================================================================
-- 4) Role simulations (rollback-only): an approved member reads the full IA
--    through the RPCs; a pending member reads zero rows from every one.
-- ===========================================================================
begin;

create temporary table _0027_verify_results (
  section  integer,
  scenario text,
  expected text,
  observed text,
  pass     boolean
) on commit drop;

create or replace function pg_temp.run_0027_verification()
returns void
language plpgsql
as $fn$
declare
  v_approved_uid uuid;
  v_pending_uid  uuid;
  v_sections     integer;
  v_topics       integer;
  v_extras       integer;
  v_resources    integer;
  v_coded        integer;
begin
  select id into v_approved_uid
  from public.profiles where is_approved = true  order by id limit 1;

  select id into v_pending_uid
  from public.profiles where is_approved = false order by id limit 1;

  if v_approved_uid is null or v_pending_uid is null then
    raise exception '0027 verification needs one approved and one pending TEST profile';
  end if;

  -- Approved member.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_approved_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into v_sections  from public.get_platform_sections();
  select count(*) into v_topics    from public.get_platform_topics();
  select count(*) into v_extras    from public.get_platform_extras();
  select count(*) into v_resources from public.get_resources();
  select count(*) into v_coded     from public.get_resources() where code is not null;

  perform set_config('role', 'postgres', true);
  insert into _0027_verify_results values
    (4, 'approved get_platform_sections', '5',
     v_sections::text,  v_sections  = 5),
    (4, 'approved get_platform_topics',   '33',
     v_topics::text,    v_topics    = 33),
    (4, 'approved get_platform_extras',   '15',
     v_extras::text,    v_extras    = 15),
    (4, 'approved get_resources',         '299',
     v_resources::text, v_resources = 299),
    (4, 'approved get_resources coded',   '297',
     v_coded::text,     v_coded     = 297);

  -- Pending member: the gate yields zero rows, never an error.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_pending_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into v_sections  from public.get_platform_sections();
  select count(*) into v_topics    from public.get_platform_topics();
  select count(*) into v_extras    from public.get_platform_extras();
  select count(*) into v_resources from public.get_resources();

  perform set_config('role', 'postgres', true);
  insert into _0027_verify_results values
    (4, 'pending get_platform_sections', '0',
     v_sections::text,  v_sections  = 0),
    (4, 'pending get_platform_topics',   '0',
     v_topics::text,    v_topics    = 0),
    (4, 'pending get_platform_extras',   '0',
     v_extras::text,    v_extras    = 0),
    (4, 'pending get_resources',         '0',
     v_resources::text, v_resources = 0);
end;
$fn$;

select pg_temp.run_0027_verification();

select * from _0027_verify_results order by section, scenario;
-- EXPECT: pass = true on every row.

rollback;
