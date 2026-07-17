-- 0026_verify_TEST_db_only.sql
-- Role-simulated proof for migration 0026 (Focus Area K shape widening).
-- TEST DATABASE ONLY: it switches role and upserts a rollback-only sentinel
-- element inside begin ... rollback. It leaves NO permanent data. For
-- production use the read-only companion file.
-- Run the whole file after applying 0026; every EXPECT below must pass.
-- (Safe to re-run after the Food ingest too — the sentinel upsert then updates
-- the real k3 row inside the same rollback.)

-- ===========================================================================
-- 0) Constraint shapes widened to a1..k3 / A-K on both tables.
-- ===========================================================================
select
  c.conname,
  pg_get_constraintdef(c.oid) as definition,
  pg_get_constraintdef(c.oid) ~ '\[a-k\]\[1-3\]|\[A-K\]' as widened
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and c.conname in
    ('elements_slug_shape', 'elements_focus_area_shape', 'resources_focus_area_shape')
order by c.conname;
-- EXPECT: three rows, widened = true for every row.

-- ===========================================================================
-- 1) Function bodies carry the widened regexes (and not the old A-J forms).
-- ===========================================================================
select
  p.proname,
  p.prosrc like '%^[a-k][1-3]$%' or p.proname = 'admin_update_resource'
    as new_slug_regex,
  p.prosrc like '%^[A-K]$%'      as new_area_regex,
  p.prosrc not like '%^[a-j][1-3]$%' and p.prosrc not like '%^[A-J]$%'
    as old_regexes_gone
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('admin_upsert_element', 'admin_update_resource')
order by p.proname;
-- EXPECT: two rows; new_slug_regex, new_area_regex, old_regexes_gone all true.

-- ===========================================================================
-- 2) EXECUTE privileges preserved by the redefinition: anon denied;
--    authenticated granted (same posture 0023 shipped).
-- ===========================================================================
select
  has_function_privilege('anon',
    'public.admin_upsert_element(text, text, text, text, text, text, text, text, text, integer)',
    'execute') as upsert_anon,
  has_function_privilege('authenticated',
    'public.admin_upsert_element(text, text, text, text, text, text, text, text, text, integer)',
    'execute') as upsert_authenticated,
  has_function_privilege('anon',
    'public.admin_update_resource(uuid, text, text, text, uuid, text, integer)',
    'execute') as update_res_anon,
  has_function_privilege('authenticated',
    'public.admin_update_resource(uuid, text, text, text, uuid, text, integer)',
    'execute') as update_res_authenticated;
-- EXPECT: upsert_anon = false, upsert_authenticated = true,
--         update_res_anon = false, update_res_authenticated = true.

-- ===========================================================================
-- 3) Role simulations (rollback-only):
--    admin can upsert a K element; l1 / L are still rejected; a non-admin
--    gets "not authorized"; a pending member still reads zero elements.
-- 4) Table CHECKs fire on direct inserts outside a1..k3 / A-K.
-- ===========================================================================
begin;

create temporary table _0026_verify_results (
  section  integer,
  scenario text,
  expected text,
  observed text,
  pass     boolean
) on commit drop;

create or replace function pg_temp.run_0026_verification()
returns void
language plpgsql
as $fn$
declare
  v_admin_uid    uuid;
  v_approved_uid uuid;
  v_pending_uid  uuid;
  v_id           uuid;
  v_rows         integer;
  v_error        text;
begin
  select a.user_id into v_admin_uid
  from public.admins a
  order by a.user_id
  limit 1;

  select p.id into v_approved_uid
  from public.profiles p
  where p.is_approved = true
    and not exists (select 1 from public.admins a where a.user_id = p.id)
  order by p.id
  limit 1;

  select p.id into v_pending_uid
  from public.profiles p
  where p.is_approved = false
  order by p.id
  limit 1;

  if v_admin_uid is null or v_approved_uid is null or v_pending_uid is null then
    raise exception
      '0026 verification needs one admin, one approved non-admin and one pending TEST profile';
  end if;

  -- 3a) Admin upserts a K-shaped element (sentinel; outer rollback removes it).
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin_uid, 'role', 'authenticated')::text,
    true
  );
  perform set_config('role', 'authenticated', true);
  begin
    select public.admin_upsert_element(
      'k3', 'K3', 'K', 'Café & Culinary Experience',
      '__0026_verify_sentinel__'
    ) into v_id;
    v_error := '<no error>';
  exception when others then
    v_error := sqlerrm;
  end;
  perform set_config('role', 'none', true);

  insert into _0026_verify_results values (
    3, 'admin upsert k3 (K shape now allowed)',
    'returns an id, no error',
    format('id_returned=%s error=%s', v_id is not null, v_error),
    v_id is not null and v_error = '<no error>'
  );

  -- 3b) Slug beyond K is still rejected.
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin_uid, 'role', 'authenticated')::text,
    true
  );
  perform set_config('role', 'authenticated', true);
  begin
    perform public.admin_upsert_element('l1', 'L1', 'K', 'X', 'X');
    v_error := '<no error>';
  exception when others then
    v_error := sqlerrm;
  end;
  perform set_config('role', 'none', true);

  insert into _0026_verify_results values (
    3, 'admin upsert slug l1 (beyond K)',
    'invalid slug', v_error, v_error = 'invalid slug'
  );

  -- 3c) Focus area beyond K is still rejected.
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin_uid, 'role', 'authenticated')::text,
    true
  );
  perform set_config('role', 'authenticated', true);
  begin
    perform public.admin_upsert_element('k1', 'K1', 'L', 'X', 'X');
    v_error := '<no error>';
  exception when others then
    v_error := sqlerrm;
  end;
  perform set_config('role', 'none', true);

  insert into _0026_verify_results values (
    3, 'admin upsert focus area L (beyond K)',
    'invalid focus area', v_error, v_error = 'invalid focus area'
  );

  -- 3d) Approved non-admin is still refused (regression).
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_approved_uid, 'role', 'authenticated')::text,
    true
  );
  perform set_config('role', 'authenticated', true);
  begin
    perform public.admin_upsert_element('k1', 'K1', 'K', 'X', 'X');
    v_error := '<no error>';
  exception when others then
    v_error := sqlerrm;
  end;
  perform set_config('role', 'none', true);

  insert into _0026_verify_results values (
    3, 'approved non-admin upsert regression',
    'not authorized', v_error, v_error = 'not authorized'
  );

  -- 3e) Pending member still reads zero elements (regression).
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_pending_uid, 'role', 'authenticated')::text,
    true
  );
  perform set_config('role', 'authenticated', true);
  select count(*) into v_rows from public.get_elements();
  perform set_config('role', 'none', true);

  insert into _0026_verify_results values (
    3, 'pending get_elements regression',
    '0 rows', format('rows=%s', v_rows), v_rows = 0
  );

  -- 4) Direct inserts outside the widened shapes hit the table CHECKs.
  begin
    insert into public.elements (slug, code, focus_area_code, focus_area_name, title)
    values ('l1', 'L1', 'L', 'X', 'X');
    v_error := '<no error>';
  exception when check_violation then
    v_error := 'check_violation';
  when others then
    v_error := sqlerrm;
  end;

  insert into _0026_verify_results values (
    4, 'direct insert l1/L hits table CHECK',
    'check_violation', v_error, v_error = 'check_violation'
  );
exception when others then
  perform set_config('role', 'none', true);
  raise;
end;
$fn$;

select pg_temp.run_0026_verification();

select section, scenario, expected, observed, pass
from _0026_verify_results
order by section, scenario;
-- EXPECT: six rows; pass = true for every row.

rollback;

-- ===========================================================================
-- 5) Informational (no hard pass): content counts. Before the Food ingest:
--    30 / 728 / 30 / 269. After it: 33 / 818 / 33 / 299.
-- ===========================================================================
select
  (select count(*) from public.elements)        as elements,
  (select count(*) from public.checklist_items) as checklist_items,
  (select count(*) from public.academy_modules) as academy_modules,
  (select count(*) from public.resources)       as resources;
