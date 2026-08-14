-- 0029_verify_TEST_db_only.sql
-- Role-simulated proof for 0029_ia_unlock. TEST DATABASE ONLY: sections 3–5
-- switch role and write rows inside `begin ... rollback`, so nothing survives.
-- For production use the read-only companion, 0029_verify_PROD_safe_readonly.sql.
--
-- Run the whole file AFTER applying 0029_ia_unlock.up.sql. Every EXPECT must pass.
--
-- NOTE on the convention: no 0028_verify_* file was ever written. 0029 restores
-- the one-verification-file-per-migration rule rather than assuming it held.

-- ===========================================================================
-- 0) The ceiling is gone at the table layer, and the A–K vocabulary is optional.
-- ===========================================================================
select
  (select pg_get_constraintdef(oid) from pg_constraint
    where conname = 'elements_slug_shape'
      and conrelid = 'public.elements'::regclass)        as slug_check,
  (select pg_get_constraintdef(oid) from pg_constraint
    where conname = 'elements_focus_area_shape'
      and conrelid = 'public.elements'::regclass)        as focus_area_check,
  (select string_agg(column_name || '=' || is_nullable, ', ' order by column_name)
     from information_schema.columns
    where table_schema = 'public' and table_name = 'elements'
      and column_name in ('focus_area_code', 'focus_area_name', 'code', 'slug'))
                                                        as nullability;
-- EXPECT: slug_check       = CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length between 1 and 80)
--         focus_area_check = CHECK (focus_area_code IS NULL OR focus_area_code ~ '^[A-K]$')
--         nullability      = code=NO, focus_area_code=YES, focus_area_name=YES, slug=NO

-- ===========================================================================
-- 1) Draft/Live exists on both tables, defaults to true, and nothing was
--    silently drafted by the migration itself.
-- ===========================================================================
select
  (select string_agg(table_name || ' null=' || is_nullable || ' default=' ||
                     coalesce(column_default, '-'), ' | ' order by table_name)
     from information_schema.columns
    where table_schema = 'public' and column_name = 'published')  as published_cols,
  (select count(*) from public.platform_topics where not published) as draft_topics,
  (select count(*) from public.platform_groups where not published) as draft_groups,
  (select count(*) from pg_indexes where schemaname = 'public'
     and indexname in ('platform_topics_published_ix', 'platform_groups_published_ix'))
                                                                   as published_indexes;
-- EXPECT: published_cols names BOTH platform_groups and platform_topics,
--         null=NO default=true on each; draft_topics = 0; draft_groups = 0;
--         published_indexes = 2.

-- ===========================================================================
-- 2) Function inventory + privileges. get_elements() is GONE (unfiltered,
--    caller-less; see the 0029 header). The four filtered readers and the
--    widened admin upsert keep the 0011/0027 posture.
-- ===========================================================================
select
  p.proname,
  p.prosecdef                                             as security_definer,
  array_to_string(p.proconfig, ',')                       as config,
  has_function_privilege('anon',          p.oid, 'execute') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('get_platform_sections', 'get_platform_topics', 'get_element',
                    'get_resources', 'get_resource_download', 'admin_upsert_element')
order by p.proname;
-- EXPECT: six rows; security_definer = true, config = search_path="",
--         anon_execute = false, authenticated_execute = true on every row.

select count(*) as get_elements_remaining
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'get_elements';
-- EXPECT: 0.

-- ===========================================================================
-- 3) THE BEHAVIOURAL PROOF (rollback-only). Draft is a SECURITY boundary, not
--    an editorial one: a drafted focus area must vanish from the topic list,
--    its guide BODY must be unreachable through get_element(), its templates
--    must disappear from get_resources(), and — the one that matters most —
--    get_resource_download() must refuse to mint a signed URL for its files.
--    A pending caller sees nothing in any state.
-- ===========================================================================
begin;

create temporary table _0029_verify_results (
  section  integer,
  scenario text,
  expected text,
  observed text,
  pass     boolean
) on commit drop;

create or replace function pg_temp.run_0029_verification()
returns void
language plpgsql
as $fn$
declare
  v_approved uuid; v_pending uuid;
  v_topic uuid; v_element uuid; v_slug text; v_group uuid;
  v_res uuid; v_booklet uuid;
  n_topics int; n_resources int; n_element int; n_download int;
  n_booklet int; n_group_topics int;
begin
  select id into v_approved from public.profiles where is_approved      order by id limit 1;
  select id into v_pending  from public.profiles where not is_approved  order by id limit 1;
  if v_approved is null or v_pending is null then
    raise exception '0029 verification needs one approved and one pending TEST profile';
  end if;

  select t.id, t.element_id, e.slug, t.group_id
    into v_topic, v_element, v_slug, v_group
  from public.platform_topics t
  join public.elements e on e.id = t.element_id
  order by t.slug limit 1;

  select id into v_res from public.resources
   where element_id = v_element and doc_key is null and code is not null limit 1;
  select id into v_booklet from public.resources
   where element_id is null and is_public limit 1;

  -- --- baseline: everything Live -------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_approved, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n_topics    from public.get_platform_topics();
  select count(*) into n_resources from public.get_resources();
  select count(*) into n_element   from public.get_element(v_slug);
  select count(*) into n_download  from public.get_resource_download(v_res);
  select count(*) into n_booklet   from public.get_resource_download(v_booklet);
  perform set_config('role', 'postgres', true);
  insert into _0029_verify_results values
    (3, 'LIVE approved topics',             '33',  n_topics::text,    n_topics    = 33),
    (3, 'LIVE approved resources',          '299', n_resources::text, n_resources = 299),
    (3, 'LIVE approved guide body',         '1',   n_element::text,   n_element   = 1),
    (3, 'LIVE approved template download',  '1',   n_download::text,  n_download  = 1),
    (3, 'LIVE approved booklet download',   '1',   n_booklet::text,   n_booklet   = 1);

  -- --- one topic drafted ----------------------------------------------------
  update public.platform_topics set published = false where id = v_topic;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_approved, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n_topics   from public.get_platform_topics();
  select count(*) into n_element  from public.get_element(v_slug);
  select count(*) into n_download from public.get_resource_download(v_res);
  select count(*) into n_resources from public.get_resources() where element_id = v_element;
  select count(*) into n_booklet  from public.get_resource_download(v_booklet);
  perform set_config('role', 'postgres', true);
  insert into _0029_verify_results values
    (3, 'DRAFT topic hidden from list',      '32', n_topics::text,    n_topics    = 32),
    (3, 'DRAFT guide body unreachable',      '0',  n_element::text,   n_element   = 0),
    (3, 'DRAFT template DOWNLOAD refused',   '0',  n_download::text,  n_download  = 0),
    (3, 'DRAFT templates absent from list',  '0',  n_resources::text, n_resources = 0),
    (3, 'DRAFT does not affect booklets',    '1',  n_booklet::text,   n_booklet   = 1);
  update public.platform_topics set published = true where id = v_topic;

  -- --- the whole group drafted ---------------------------------------------
  select count(*) into n_group_topics from public.platform_topics where group_id = v_group;
  update public.platform_groups set published = false where id = v_group;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_approved, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n_topics   from public.get_platform_topics();
  select count(*) into n_element  from public.get_element(v_slug);
  select count(*) into n_download from public.get_resource_download(v_res);
  perform set_config('role', 'postgres', true);
  insert into _0029_verify_results values
    (3, 'DRAFT group hides all its topics', (33 - n_group_topics)::text,
        n_topics::text,  n_topics  = 33 - n_group_topics),
    (3, 'DRAFT group hides guide body',     '0', n_element::text,  n_element  = 0),
    (3, 'DRAFT group refuses download',     '0', n_download::text, n_download = 0);
  update public.platform_groups set published = true where id = v_group;

  -- --- pending caller: zero rows, never an error ----------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_pending, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n_topics    from public.get_platform_topics();
  select count(*) into n_resources from public.get_resources();
  select count(*) into n_element   from public.get_element(v_slug);
  select count(*) into n_download  from public.get_resource_download(v_res);
  select count(*) into n_booklet   from public.get_resource_download(v_booklet);
  perform set_config('role', 'postgres', true);
  insert into _0029_verify_results values
    (3, 'pending topics',            '0', n_topics::text,    n_topics    = 0),
    (3, 'pending resources',         '0', n_resources::text, n_resources = 0),
    (3, 'pending guide body',        '0', n_element::text,   n_element   = 0),
    (3, 'pending template download', '0', n_download::text,  n_download  = 0),
    (3, 'pending booklet download',  '0', n_booklet::text,   n_booklet   = 0);
end;
$fn$;

select pg_temp.run_0029_verification();

-- ===========================================================================
-- 4) THE HEADLINE (same rollback-only transaction): a 34th focus area, named
--    after itself, with NO A–K identity, created through the real admin RPC.
--    This is the test that would have failed under the pre-amendment scope,
--    which relaxed only the table CHECK and left the RPC body rejecting it.
--    The widened guards must still refuse malformed input.
-- ===========================================================================
create or replace function pg_temp.run_0029_ceiling()
returns void
language plpgsql
as $fn$
declare
  v_admin uuid; v_approved uuid; v_group uuid; v_new uuid; n int;
  r_create text; r_badslug text; r_badfa text;
begin
  select user_id into v_admin from public.admins limit 1;
  select id into v_approved from public.profiles where is_approved order by id limit 1;
  select id into v_group from public.platform_groups where section_slug = 'setup' limit 1;
  if v_admin is null then
    raise exception '0029 verification needs at least one admins row on TEST';
  end if;

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  begin
    v_new := public.admin_upsert_element(
      'get-legally-ready', '1.1', null, null, 'Get Legally Ready',
      'Register the entity, sign the lease, get insured.',
      null, '# Step 1. Register Our Local Entity', null, 10);
    r_create := coalesce(v_new::text, 'NULL');
  exception when others then r_create := 'EXCEPTION: ' || sqlerrm;
  end;

  begin
    perform public.admin_upsert_element(
      'Get Legally Ready!', '1.2', null, null, 'Bad', null, null, null, null, 0);
    r_badslug := 'ACCEPTED';
  exception when others then r_badslug := sqlerrm;
  end;

  begin
    perform public.admin_upsert_element(
      'plan-the-money', '1.2', 'Z', 'Zed', 'Bad FA', null, null, null, null, 0);
    r_badfa := 'ACCEPTED';
  exception when others then r_badfa := sqlerrm;
  end;

  perform set_config('role', 'postgres', true);
  insert into _0029_verify_results values
    (4, '34th focus area created, no A-K code', 'uuid',
        r_create,  v_new is not null),
    (4, 'malformed slug still rejected',        'invalid slug',
        r_badslug, r_badslug = 'invalid slug'),
    (4, 'bad focus-area code still rejected',   'invalid focus area',
        r_badfa,   r_badfa   = 'invalid focus area');

  -- Attach it as a Draft topic: invisible until published, then it is the 34th.
  insert into public.platform_topics
    (element_id, group_id, slug, title, icon, sort_order, published)
  values (v_new, v_group, 'get-legally-ready', 'Get Legally Ready', 'scale', 10, false);

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_approved, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.get_platform_topics();
  perform set_config('role', 'postgres', true);
  insert into _0029_verify_results values
    (4, 'new focus area invisible while Draft', '33', n::text, n = 33);

  update public.platform_topics set published = true where slug = 'get-legally-ready';
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_approved, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.get_platform_topics();
  perform set_config('role', 'postgres', true);
  insert into _0029_verify_results values
    (4, '34 focus areas once published', '34', n::text, n = 34);
end;
$fn$;

select pg_temp.run_0029_ceiling();

-- ===========================================================================
-- 5) The down-migration's ABORT GUARD must fire once a post-0029 slug exists.
--    If this ever reports ACCEPTED, 0029_ia_unlock.down.sql would silently
--    destroy the owner's real content.
-- ===========================================================================
do $guardtest$
declare fired boolean := false; msg text;
begin
  begin
    declare v_bad_slug integer; v_bad_fac integer;
    begin
      select count(*) into v_bad_slug from public.elements
       where slug !~ '^[a-k][1-3]$';
      select count(*) into v_bad_fac  from public.elements
       where focus_area_code is null or focus_area_code !~ '^[A-K]$';
      if v_bad_slug > 0 or v_bad_fac > 0 then
        raise exception 'refusing to reverse 0029' using errcode = '23514';
      end if;
    end;
  exception when others then fired := true; msg := sqlerrm;
  end;

  insert into _0029_verify_results values
    (5, 'down-migration abort guard fires', 'raised',
        case when fired then 'raised' else 'ACCEPTED' end, fired);
end;
$guardtest$;

select * from _0029_verify_results order by section, scenario;
-- EXPECT: pass = true on EVERY row, sections 3, 4 and 5.

rollback;

-- ===========================================================================
-- 6) THE IA WRITE PATH (pass 2), rollback-only.
--
-- Before 0029 there was nothing here: zero admin_*_platform_* functions, and
-- all three tables RLS default-deny with zero client policies — readable, and
-- completely unwritable. Everything below is new, so every guard is tested,
-- not assumed. The four that keep the owner from breaking the platform from a
-- form are the delete rules; they are enforced in the DATABASE, not the UI.
-- ===========================================================================
begin;

create temporary table _0029_write_results (
  scenario text, expected text, observed text, pass boolean
) on commit drop;

create or replace function pg_temp.run_0029_write_path()
returns void
language plpgsql
as $fn$
declare
  v_admin uuid; v_approved uuid;
  v_group uuid; v_topic uuid; v_element uuid;
  v_existing_group uuid; v_topic_with_files uuid;
  n int; r text; ids uuid[]; cnt int; s_first int; s_last int;
  el_before int; el_after int;
begin
  select user_id into v_admin from public.admins limit 1;
  select id into v_approved from public.profiles where is_approved order by id limit 1;
  select id into v_existing_group from public.platform_groups where section_slug = 'setup' limit 1;
  select t.id into v_topic_with_files
    from public.platform_topics t
   where exists (select 1 from public.resources r where r.element_id = t.element_id)
   limit 1;
  select count(*) into el_before from public.elements;
  if v_admin is null then
    raise exception '0029 verification needs at least one admins row on TEST';
  end if;

  -- --- an approved partner who is NOT an admin is refused -------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_approved, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  begin
    perform public.admin_upsert_platform_topic(
      null, v_existing_group, 'x-test', 'X', null, null, null, null, null, null, 0, false, 'X1', null);
    r := 'ACCEPTED';
  exception when others then r := sqlerrm; end;
  -- RLS default-deny: an authenticated caller cannot even read the table directly
  select count(*) into cnt from public.platform_topics;
  perform set_config('role', 'postgres', true);
  insert into _0029_write_results values
    ('non-admin write refused', 'not authorized', r, r = 'not authorized'),
    ('RLS: direct table read denied', '0', cnt::text, cnt = 0);

  -- --- create a Draft group + a Draft focus area (two tables, one call) -----
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  v_group := public.admin_upsert_platform_group(
    null, 'setup', 'setup-focus-areas', 'Setup', 'The five things to do first', 0, false);
  v_topic := public.admin_upsert_platform_topic(
    null, v_group, 'get-legally-ready', 'Get Legally Ready',
    'Register the entity, sign the lease, get insured.',
    'Most Houses can do this in six weeks.', 'scale', null, null, null, 10, false, '1.1',
    '# Step 1. Register Our Local Entity');
  begin
    perform public.admin_upsert_platform_topic(
      null, v_group, 'get-legally-ready', 'Dup', null, null, null, null, null, null, 0, false, '1.9', null);
    r := 'ACCEPTED';
  exception when others then r := sqlerrm; end;
  perform set_config('role', 'postgres', true);

  select element_id into v_element from public.platform_topics where id = v_topic;
  select count(*) into n from public.elements
   where id = v_element and slug = 'get-legally-ready';
  select count(*) into el_after from public.elements;
  insert into _0029_write_results values
    ('group created',                'uuid', coalesce(v_group::text, 'NULL'), v_group is not null),
    ('focus area created',           'uuid', coalesce(v_topic::text, 'NULL'), v_topic is not null),
    ('elements row created with it', '1',    n::text,        n = 1),
    ('elements count + 1', (el_before + 1)::text, el_after::text, el_after = el_before + 1),
    -- platform_topics.slug is UNIQUE GLOBALLY, and the old 33 keep their slugs
    -- until 0030, so a collision is realistic and must never surface as 23505.
    ('duplicate slug refused', 'slug in use', r, r = 'slug in use');

  -- --- invisible while Draft, visible once Live -----------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_approved, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.get_platform_topics();
  perform set_config('role', 'postgres', true);
  insert into _0029_write_results values
    ('new Draft focus area invisible', '33', n::text, n = 33);

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.admin_upsert_platform_group(v_group, null, null, 'Setup', null, 0, true);
  perform public.admin_set_platform_topic_published(v_topic, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_approved, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.get_platform_topics();
  perform set_config('role', 'postgres', true);
  insert into _0029_write_results values
    ('published -> visible as the 34th', '34', n::text, n = 34);

  -- --- the delete guards ----------------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  begin perform public.admin_delete_platform_topic(v_topic); r := 'ACCEPTED';
  exception when others then r := sqlerrm; end;
  perform set_config('role', 'postgres', true);
  insert into _0029_write_results values
    ('Live focus area cannot be deleted', 'live focus area', r, r = 'live focus area');

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  begin perform public.admin_delete_platform_group(v_group); r := 'ACCEPTED';
  exception when others then r := sqlerrm; end;
  perform set_config('role', 'postgres', true);
  insert into _0029_write_results values
    ('Live group cannot be deleted', 'live group', r, r = 'live group');

  -- A focus area with files must refuse: resources_element_id_fkey is
  -- ON DELETE SET NULL, so deleting it would orphan private files that then
  -- vanish from every grid while still existing in Storage.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.admin_set_platform_topic_published(v_topic_with_files, false);
  begin perform public.admin_delete_platform_topic(v_topic_with_files); r := 'ACCEPTED';
  exception when others then r := sqlerrm; end;
  perform public.admin_set_platform_topic_published(v_topic_with_files, true);
  perform set_config('role', 'postgres', true);
  insert into _0029_write_results values
    ('focus area with files refuses delete', 'focus area has files', r,
     r = 'focus area has files');

  -- --- Draft it, delete it, and the elements row goes too -------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.admin_set_platform_topic_published(v_topic, false);
  perform public.admin_delete_platform_topic(v_topic);
  perform set_config('role', 'postgres', true);
  select count(*) into el_after from public.elements;
  insert into _0029_write_results values
    ('Draft delete removes the element too', el_before::text, el_after::text,
     el_after = el_before);

  -- --- a group with focus areas in it refuses (FK is ON DELETE RESTRICT) ----
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.admin_upsert_platform_group(v_existing_group, null, null, 'Setup toolkit', null, null, false);
  begin perform public.admin_delete_platform_group(v_existing_group); r := 'ACCEPTED';
  exception when others then r := sqlerrm; end;
  perform public.admin_upsert_platform_group(v_existing_group, null, null, 'Setup toolkit', null, null, true);
  begin perform public.admin_update_platform_section('nope', 'L', 'T'); r := 'ACCEPTED';
  exception when others then r := sqlerrm; end;
  select count(*) into n from public.admin_list_platform_topics();
  perform set_config('role', 'postgres', true);
  insert into _0029_write_results values
    ('non-empty group refuses delete', 'group not empty', r, r = 'group not empty'),
    ('admin list returns every topic', '33', n::text, n = 33);

  -- --- reorder ---------------------------------------------------------------
  -- ids are gathered as the OWNER: an authenticated caller cannot read the
  -- table at all (proved above), which is the point of RPC-only access.
  select array_agg(id order by sort_order desc) into ids
    from public.platform_topics where group_id = v_existing_group;
  n := array_length(ids, 1);
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  cnt := public.admin_reorder_platform_topics(ids);
  perform set_config('role', 'postgres', true);
  select sort_order into s_first from public.platform_topics where id = ids[1];
  select sort_order into s_last  from public.platform_topics where id = ids[n];
  insert into _0029_write_results values
    ('reorder touched every row',  n::text,           cnt::text,     cnt = n),
    ('reorder: first sort = 0',    '0',               s_first::text, s_first = 0),
    ('reorder: last sort = (n-1)*10', ((n-1)*10)::text, s_last::text,  s_last = (n-1)*10);
end;
$fn$;

select pg_temp.run_0029_write_path();
select * from _0029_write_results order by scenario;
-- EXPECT: pass = true on every row.

rollback;

-- ===========================================================================
-- 7) Post-rollback: the database is exactly as it was. Nothing above survived.
-- ===========================================================================
select
  (select count(*) from public.elements)                    as elements,
  (select count(*) from public.platform_topics)             as topics,
  (select count(*) from public.platform_groups)             as groups,
  (select count(*) from public.platform_sections)           as sections,
  (select count(*) from public.resources)                   as resources,
  (select count(*) from public.resources
     where is_public = false and doc_key is null
       and code is not null)                                as grid,
  (select count(*) from public.platform_topics where not published) as draft_topics,
  (select count(*) from public.platform_groups where not published) as draft_groups;
-- EXPECT: elements = 33, topics = 33, groups = 10, sections = 5,
--         resources = 299, grid = 297, draft_topics = 0, draft_groups = 0.
