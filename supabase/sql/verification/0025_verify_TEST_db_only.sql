-- 0025_verify_TEST_db_only.sql
-- Role-simulated proof for migration 0025 (member Live hub). TEST DATABASE ONLY:
-- it switches role and seeds two sentinel sessions inside begin ... rollback.
-- It leaves NO permanent data. For production use the read-only companion file.
-- Run the whole file after applying 0025; every EXPECT below must pass.

-- ===========================================================================
-- 0) member_programming_sessions exists; public_programming_sessions does not.
-- ===========================================================================
select
  to_regprocedure('public.member_programming_sessions()') is not null as member_exists,
  to_regprocedure('public.public_programming_sessions()') is null     as public_removed;
-- EXPECT: member_exists = true, public_removed = true.

-- ===========================================================================
-- 1) EXECUTE privileges: anon denied; authenticated granted.
-- ===========================================================================
select
  has_function_privilege(
    'anon', 'public.member_programming_sessions()', 'execute'
  ) as anon_execute,
  has_function_privilege(
    'authenticated', 'public.member_programming_sessions()', 'execute'
  ) as authenticated_execute;
-- EXPECT: anon_execute = false, authenticated_execute = true.

-- ===========================================================================
-- 2) Role simulations: approved sees every row with exact is_mine flags;
--    pending sees zero rows.
-- 3) Regression: pending still gets "not authorized" from the publish RPC.
-- ===========================================================================
begin;

create temporary table _0025_verify_results (
  section  integer,
  scenario text,
  expected text,
  observed text,
  pass     boolean
) on commit drop;

create or replace function pg_temp.run_0025_verification()
returns void
language plpgsql
as $fn$
declare
  v_approved_uid uuid;
  v_pending_uid  uuid;
  v_expected_all uuid[];
  v_expected_mine uuid[];
  v_actual_all   uuid[];
  v_actual_mine  uuid[];
  v_rows         integer;
  v_error        text;
begin
  select id into v_approved_uid
  from public.profiles
  where is_approved = true
  order by id
  limit 1;

  select id into v_pending_uid
  from public.profiles
  where is_approved = false
  order by id
  limit 1;

  if v_approved_uid is null or v_pending_uid is null then
    raise exception '0025 verification needs one approved and one pending TEST profile';
  end if;

  -- Guarantee one owned and one other row so the derived flag is exercised even
  -- when the TEST database has no pre-existing sessions. The outer rollback
  -- removes both sentinels.
  insert into public.programming_sessions
    (created_by, title, summary, mode, status, starts_at)
  values
    (v_approved_uid, '__0025_verify_owned__', 'rollback-only sentinel',
     'Music', 'live', now()),
    (v_pending_uid, '__0025_verify_other__', 'rollback-only sentinel',
     'Talks', 'scheduled', now() + interval '1 hour');

  select
    coalesce(array_agg(id order by id), '{}'::uuid[]),
    coalesce(
      array_agg(id order by id) filter (where created_by = v_approved_uid),
      '{}'::uuid[]
    )
  into v_expected_all, v_expected_mine
  from public.programming_sessions;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_approved_uid, 'role', 'authenticated')::text,
    true
  );
  perform set_config('role', 'authenticated', true);

  select
    coalesce(array_agg(id order by id), '{}'::uuid[]),
    coalesce(
      array_agg(id order by id) filter (where is_mine),
      '{}'::uuid[]
    )
  into v_actual_all, v_actual_mine
  from public.member_programming_sessions();

  perform set_config('role', 'none', true);

  insert into _0025_verify_results
    (section, scenario, expected, observed, pass)
  values (
    2,
    'approved member feed',
    'all session ids returned; is_mine ids exactly match ownership',
    format(
      'all_rows=%s mine_rows=%s all_ids_match=%s mine_ids_match=%s',
      cardinality(v_actual_all),
      cardinality(v_actual_mine),
      v_actual_all = v_expected_all,
      v_actual_mine = v_expected_mine
    ),
    v_actual_all = v_expected_all and v_actual_mine = v_expected_mine
  );

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_pending_uid, 'role', 'authenticated')::text,
    true
  );
  perform set_config('role', 'authenticated', true);
  select count(*) into v_rows from public.member_programming_sessions();
  perform set_config('role', 'none', true);

  insert into _0025_verify_results
    (section, scenario, expected, observed, pass)
  values (
    2,
    'pending member feed',
    '0 rows',
    format('rows=%s', v_rows),
    v_rows = 0
  );

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_pending_uid, 'role', 'authenticated')::text,
    true
  );
  perform set_config('role', 'authenticated', true);
  begin
    perform public.publish_programming_session('__0025_verify__', 'scheduled');
    v_error := '<no error>';
  exception when others then
    v_error := sqlerrm;
  end;
  perform set_config('role', 'none', true);

  insert into _0025_verify_results
    (section, scenario, expected, observed, pass)
  values (
    3,
    'pending publish regression',
    'not authorized',
    v_error,
    v_error = 'not authorized'
  );
exception when others then
  perform set_config('role', 'none', true);
  raise;
end;
$fn$;

select pg_temp.run_0025_verification();

select section, scenario, expected, observed, pass
from _0025_verify_results
order by section, scenario;
-- EXPECT: three rows; pass = true for every row.

rollback;
