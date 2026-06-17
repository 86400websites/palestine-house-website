-- 0010_verify_PROD_safe_readonly.sql
-- READ-ONLY post-apply check for migration 0010. Seeds NO data, switches NO
-- roles — safe on any database, including production. Run after applying
-- ../migrations/0010_admin_set_status_profile_guard.up.sql. Then re-run the
-- functional approve/decline sections of S4_verify_TEST_db_only.sql on the TEST
-- database to confirm a normal decision still works (no regression).

-- 1) The flip function is still SECURITY DEFINER with a pinned empty search_path
select proname, prosecdef, proconfig
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname = 'admin_set_application_status';
-- EXPECT: prosecdef = true and proconfig = {search_path=""}

-- 2) It was redefined with the profile-row guard
select pg_get_functiondef('public.admin_set_application_status(uuid,text)'::regprocedure)
       like '%profile not found for applicant%' as has_profile_guard;
-- EXPECT: has_profile_guard = true

-- 3) EXECUTE is still anon-revoked, authenticated-granted
select
  has_function_privilege('anon', 'public.admin_set_application_status(uuid,text)', 'execute')          as anon_set,
  has_function_privilege('authenticated', 'public.admin_set_application_status(uuid,text)', 'execute') as authed_set;
-- EXPECT: anon_set = false, authed_set = true
