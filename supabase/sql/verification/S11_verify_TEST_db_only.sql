-- S11_verify_TEST_db_only.sql
-- S11 verification — intended for the NON-PRODUCTION (TEST) database
-- (palestine-house-test-database, https://sdszcralogcrujtyghig.supabase.co),
-- AFTER applying ../migrations/0023_admin_content_rpcs.up.sql
-- (and, for sections 8+, ../migrations/0024_admin_management_rpcs.up.sql).
--
-- A TEST HELPER, not a migration. Every role-simulated mutation runs inside
-- begin ... rollback, so it makes NO permanent change. For production use the
-- read-only ../verification/S11_verify_PROD_safe_readonly.sql. Run section by
-- section in the SQL Editor and compare each result to its EXPECT.
--
-- PREREQUISITE — seed accounts (reuse the GATE 0 / S4 seeds):
--   ADMIN_UUID    = the admin account  (mohammad@86400.studio, in public.admins)
--   NONADMIN_UUID = a NON-admin account (testpartner@86400.studio)
-- Fetch them, then replace every ADMIN_UUID / NONADMIN_UUID below:
--   select u.id, u.email, (a.user_id is not null) as is_admin
--   from auth.users u left join public.admins a on a.user_id = u.id
--   where u.email in ('mohammad@86400.studio','testpartner@86400.studio');

-- ===========================================================================
-- 0) all twelve content RPCs exist (read-only)
-- ===========================================================================
select proname, count(*)
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'admin_list_elements','admin_get_element','admin_upsert_element','admin_delete_element',
    'admin_list_academy_modules','admin_get_academy_module','admin_upsert_academy_module','admin_delete_academy_module',
    'admin_list_resources','admin_get_resource','admin_update_resource','admin_delete_resource')
group by proname order by proname;
-- EXPECT: 12 rows, one each.

-- ===========================================================================
-- 1) EXECUTE privileges: anon revoked on every admin_* content RPC;
--    authenticated granted (the real gate is is_admin() INSIDE each function).
-- ===========================================================================
select
  has_function_privilege('anon','public.admin_list_elements()','execute')                                                    as anon_list_el,
  has_function_privilege('anon','public.admin_upsert_element(text,text,text,text,text,text,text,text,text,integer)','execute') as anon_upsert_el,
  has_function_privilege('anon','public.admin_delete_element(text)','execute')                                                as anon_del_el,
  has_function_privilege('anon','public.admin_upsert_academy_module(uuid,text,text,text,text,text,integer)','execute')        as anon_upsert_ac,
  has_function_privilege('anon','public.admin_update_resource(uuid,text,text,text,uuid,text,integer)','execute')             as anon_upd_res,
  has_function_privilege('anon','public.admin_delete_resource(uuid)','execute')                                              as anon_del_res,
  has_function_privilege('authenticated','public.admin_list_elements()','execute')                                                    as auth_list_el,
  has_function_privilege('authenticated','public.admin_upsert_element(text,text,text,text,text,text,text,text,text,integer)','execute') as auth_upsert_el,
  has_function_privilege('authenticated','public.admin_list_academy_modules()','execute')                                            as auth_list_ac,
  has_function_privilege('authenticated','public.admin_list_resources()','execute')                                                  as auth_list_res,
  has_function_privilege('authenticated','public.admin_update_resource(uuid,text,text,text,uuid,text,integer)','execute')           as auth_upd_res;
-- EXPECT: every anon_* = false, every auth_* = true.

-- ===========================================================================
-- 2) an ADMIN sees everything through the list/get RPCs.
-- ===========================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"ADMIN_UUID","role":"authenticated"}';
  select
    (select count(*) from public.admin_list_elements())        as elements,
    (select count(*) from public.admin_list_academy_modules()) as academy,
    (select count(*) from public.admin_list_resources())       as resources,
    (select count(*) from public.admin_get_element('a1'))      as get_a1;
rollback;
-- EXPECT: elements = 30, academy = 30, resources = 269, get_a1 = 1.

-- ===========================================================================
-- 3) a NON-ADMIN sees zero rows from every content list/get RPC (no leak).
-- ===========================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"NONADMIN_UUID","role":"authenticated"}';
  select
    (select count(*) from public.admin_list_elements())        as elements,
    (select count(*) from public.admin_list_academy_modules()) as academy,
    (select count(*) from public.admin_list_resources())       as resources,
    (select count(*) from public.admin_get_element('a1'))      as get_a1;
rollback;
-- EXPECT: elements = 0, academy = 0, resources = 0, get_a1 = 0.

-- ===========================================================================
-- 4) a NON-ADMIN cannot write — every write/delete raises 42501 (run each).
-- ===========================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"NONADMIN_UUID","role":"authenticated"}';
  select public.admin_upsert_element('a1','A1','A','Focus','Title');
rollback;
-- EXPECT: ERROR  not authorized   (42501)

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"NONADMIN_UUID","role":"authenticated"}';
  select public.admin_update_resource('00000000-0000-0000-0000-000000000000','x','form');
rollback;
-- EXPECT: ERROR  not authorized   (42501)

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"NONADMIN_UUID","role":"authenticated"}';
  select public.admin_delete_element('a1');
rollback;
-- EXPECT: ERROR  not authorized   (42501)

-- ===========================================================================
-- 5) admin upsert of a1 with its OWN values is idempotent — no id churn, no
--    new row (run inside begin..rollback so nothing persists).
-- ===========================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"ADMIN_UUID","role":"authenticated"}';
  with b as (select * from public.admin_get_element('a1'))
  select
    (select id from b) as before_id,
    public.admin_upsert_element('a1',(select code from b),(select focus_area_code from b),
      (select focus_area_name from b),(select title from b),(select one_line from b),
      (select overview_md from b),(select simple_guide_md from b),(select watch_out_for_md from b),
      (select sort_order from b)) as returned_id,
    (select count(*) from public.admin_list_elements()) as total_after;
rollback;
-- EXPECT: before_id = returned_id, total_after = 30.

-- ===========================================================================
-- 6) write validation guards fire even for an admin.
-- ===========================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"ADMIN_UUID","role":"authenticated"}';
  select public.admin_upsert_element('z9','Z9','Z','Focus','Title');
rollback;
-- EXPECT: ERROR  invalid slug   (22023)

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"ADMIN_UUID","role":"authenticated"}';
  -- substitute a1's element_id; a non-YouTube link is rejected by the host guard.
  select public.admin_upsert_academy_module(
    (select id from public.elements where slug='a1'),'Test',null,null,'https://evil.com/x');
rollback;
-- EXPECT: ERROR  invalid video link   (22023)

-- ===========================================================================
-- 7) the public/approved read projections are UNTOUCHED by 0023 (no regression).
-- ===========================================================================
select proname, prosecdef as security_definer,
       (proconfig::text like '%search_path=%') as pinned_search_path
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('get_elements','get_element','get_academy_modules','get_resources','get_resource_download')
order by proname;
-- EXPECT: 5 rows, all security_definer = true, pinned_search_path = true.

-- ===========================================================================
-- 8) admin-management RPCs (0024). EXECUTE privileges.
-- ===========================================================================
select
  has_function_privilege('anon','public.admin_list_admins()','execute')           as anon_list,
  has_function_privilege('anon','public.admin_add_admin_by_email(text)','execute') as anon_add,
  has_function_privilege('anon','public.admin_remove_admin(uuid)','execute')       as anon_remove,
  has_function_privilege('authenticated','public.admin_list_admins()','execute')           as auth_list,
  has_function_privilege('authenticated','public.admin_add_admin_by_email(text)','execute') as auth_add,
  has_function_privilege('authenticated','public.admin_remove_admin(uuid)','execute')       as auth_remove;
-- EXPECT: every anon_* = false, every auth_* = true.

-- ===========================================================================
-- 9) an ADMIN sees the roster; a NON-ADMIN sees zero rows.
-- ===========================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"ADMIN_UUID","role":"authenticated"}';
  select count(*) as admin_sees from public.admin_list_admins();
rollback;
-- EXPECT: admin_sees = the number of admins (>= 1).

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"NONADMIN_UUID","role":"authenticated"}';
  select count(*) as nonadmin_sees from public.admin_list_admins();
rollback;
-- EXPECT: nonadmin_sees = 0.

-- ===========================================================================
-- 10) a NON-ADMIN cannot add or remove admins (42501).
-- ===========================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"NONADMIN_UUID","role":"authenticated"}';
  select public.admin_add_admin_by_email('testpartner@86400.studio');
rollback;
-- EXPECT: ERROR  not authorized   (42501)

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"NONADMIN_UUID","role":"authenticated"}';
  select public.admin_remove_admin('ADMIN_UUID');
rollback;
-- EXPECT: ERROR  not authorized   (42501)

-- ===========================================================================
-- 11) add-by-email is idempotent and validates the email (admin, rolled back).
-- ===========================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"ADMIN_UUID","role":"authenticated"}';
  select
    public.admin_add_admin_by_email('testpartner@86400.studio') as first_add,
    public.admin_add_admin_by_email('testpartner@86400.studio') as second_add;
rollback;
-- EXPECT: first_add = true (added), second_add = false (already an admin).

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"ADMIN_UUID","role":"authenticated"}';
  select public.admin_add_admin_by_email('nobody@nowhere.invalid');
rollback;
-- EXPECT: ERROR  user not found   (P0002)

-- ===========================================================================
-- 12) lockout guards: an admin cannot remove themselves. (The last-admin guard
--     is defensive: given the self-guard, the sole admin is always the caller,
--     so it is unreachable except as self-removal, already blocked here.)
-- ===========================================================================
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"ADMIN_UUID","role":"authenticated"}';
  select public.admin_remove_admin('ADMIN_UUID');
rollback;
-- EXPECT: ERROR  cannot remove yourself   (22023)

-- A positive remove works for a non-self admin (add testpartner, then remove it).
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"ADMIN_UUID","role":"authenticated"}';
  select public.admin_add_admin_by_email('testpartner@86400.studio');
  select public.admin_remove_admin('NONADMIN_UUID') as removed_true;
rollback;
-- EXPECT: removed_true = true.
