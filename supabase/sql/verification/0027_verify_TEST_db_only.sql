-- 0027_verify_TEST_db_only.sql
-- Role-simulated proof for migrations 0027_platform_ia + 0028_platform_seed as
-- corrected by PP1.1 (extras dropped) and PP2 (D-PP-f: Overview card removed,
-- one 'guide' doc slot, templates back to a many-per-topic grid reached by
-- element_id). TEST DATABASE ONLY:
-- section 4 switches role inside begin ... rollback. It leaves NO permanent
-- data. For production use the read-only companion file.
-- Run the whole file after applying 0027 THEN 0028; every EXPECT must pass.

-- ===========================================================================
-- 0) The three platform tables exist, RLS is enabled, and there are ZERO client
--    policies (default-deny; RPC-only reads — the 0011 posture). The
--    pre-correction extras table/RPC must NOT exist.
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
    ('platform_sections', 'platform_groups', 'platform_topics')
group by t.relname, t.relrowsecurity
order by t.relname;
-- EXPECT: three rows, rls_enabled = true, client_policies = 0 on every row.

select
  to_regclass('public.platform_extras') as extras_table,
  (select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'get_platform_extras')  as extras_rpc;
-- EXPECT: extras_table = null, extras_rpc = 0 (the PP1.1 correction re-applied).

-- ===========================================================================
-- 1) Seed shape: 5 sections (about + 4) / 10 groups / 33 topics (5/15/9/4);
--    every element surfaces exactly once.
-- ===========================================================================
select
  (select count(*) from public.platform_sections)                    as sections,
  (select count(*) from public.platform_groups)                      as groups,
  (select count(*) from public.platform_topics)                      as topics,
  (select count(distinct element_id) from public.platform_topics)    as distinct_elements,
  (select count(*) from public.platform_topics t
     join public.elements e on e.id = t.element_id)                  as topics_joined;
-- EXPECT: sections = 5, groups = 10, topics = 33,
--         distinct_elements = 33, topics_joined = 33.

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
--    get a code; the 2 public booklets (bare filenames) stay NULL. Under
--    D-PP-f those 297 rows ARE the live per-topic templates grid (matched by
--    element_id), so they must all keep doc_key NULL — doc_key marks only the
--    one Simple-guide file per topic, and none is uploaded yet.
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

-- The CHECK proves the D-PP-f correction is what actually applied.
select pg_get_constraintdef(oid) as doc_key_check
from pg_constraint
where conname = 'resources_doc_key_shape'
  and conrelid = 'public.resources'::regclass;
-- EXPECT: one row naming ONLY 'guide' — not 'overview' / 'template' /
--         'checklist' / 'watch'.

-- D-PP-f: the templates grid reaches its files through element_id alone (no
-- doc_key flag), so every one of the 33 topics must resolve a non-empty set.
with per_topic as (
  select t.element_id, count(r.id) as files
  from public.platform_topics t
  left join public.resources r
    on r.element_id = t.element_id
   and r.doc_key is null
   and r.code is not null
  group by t.element_id
)
select
  count(*)                                as topics,
  count(*) filter (where files = 0)       as topics_with_no_templates,
  sum(files)                              as template_files,
  min(files)                              as fewest_per_topic,
  max(files)                              as most_per_topic
from per_topic;
-- EXPECT: topics = 33, topics_with_no_templates = 0, template_files = 297,
--         fewest_per_topic = 4, most_per_topic = 10.

-- ===========================================================================
-- 3) EXECUTE privileges: anon denied, authenticated granted, on the two new
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
                    'get_resources')
order by p.proname;
-- EXPECT: three rows; anon_execute = false, authenticated_execute = true on all.

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
  v_resources    integer;
  v_coded        integer;
  v_templates    integer;
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
  select count(*) into v_resources from public.get_resources();
  select count(*) into v_coded     from public.get_resources() where code is not null;
  -- D-PP-f: the templates grid is reached through the same member RPC, so an
  -- approved partner must resolve all 297 template rows (element_id set, no
  -- doc_key flag). This is the check that would fail if the grid were ever
  -- gated behind a per-row marker again.
  select count(*) into v_templates from public.get_resources()
    where element_id is not null and doc_key is null and code is not null;

  perform set_config('role', 'postgres', true);
  insert into _0027_verify_results values
    (4, 'approved get_platform_sections', '5',
     v_sections::text,  v_sections  = 5),
    (4, 'approved get_platform_topics',   '33',
     v_topics::text,    v_topics    = 33),
    (4, 'approved get_resources',         '299',
     v_resources::text, v_resources = 299),
    (4, 'approved get_resources coded',   '297',
     v_coded::text,     v_coded     = 297),
    (4, 'approved templates visible',     '297',
     v_templates::text, v_templates = 297);

  -- Pending member: the gate yields zero rows, never an error.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_pending_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into v_sections  from public.get_platform_sections();
  select count(*) into v_topics    from public.get_platform_topics();
  select count(*) into v_resources from public.get_resources();

  perform set_config('role', 'postgres', true);
  insert into _0027_verify_results values
    (4, 'pending get_platform_sections', '0',
     v_sections::text,  v_sections  = 0),
    (4, 'pending get_platform_topics',   '0',
     v_topics::text,    v_topics    = 0),
    (4, 'pending get_resources',         '0',
     v_resources::text, v_resources = 0);
end;
$fn$;

select pg_temp.run_0027_verification();

select * from _0027_verify_results order by section, scenario;
-- EXPECT: pass = true on every row.

rollback;
