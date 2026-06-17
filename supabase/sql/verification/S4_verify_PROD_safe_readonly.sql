-- S4_verify_PROD_safe_readonly.sql
-- READ-ONLY post-apply check for migration 0009. Seeds NO data, creates NO
-- users, and switches NO roles, so it is SAFE to run on the production (live)
-- database — or on any database. Run it right after applying
-- ../migrations/0009_admin_approval_rpcs.up.sql. Compare each result to EXPECT.

-- 1) Both admin RPCs exist
select proname
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('admin_list_applications', 'admin_set_application_status')
order by proname;
-- EXPECT: admin_list_applications, admin_set_application_status

-- 2) status vocabulary is pending | approved | declined
select pg_get_constraintdef(oid) as status_check
from pg_constraint
where conrelid = 'public.applications'::regclass
  and conname = 'applications_status_check';
-- EXPECT: CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'declined'::text]))

-- 3) Both functions are SECURITY DEFINER with a pinned empty search_path
select proname, prosecdef, proconfig
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('admin_list_applications', 'admin_set_application_status')
order by proname;
-- EXPECT: prosecdef = true and proconfig = {search_path=""} for both

-- 4) EXECUTE privileges — anon cannot call either RPC; authenticated can.
--    has_function_privilege() also catches grants via PUBLIC (which a
--    pg_roles join would silently drop).
select
  has_function_privilege('anon', 'public.admin_list_applications()', 'execute')                 as anon_list,
  has_function_privilege('anon', 'public.admin_set_application_status(uuid,text)', 'execute')    as anon_set,
  has_function_privilege('authenticated', 'public.admin_list_applications()', 'execute')              as authed_list,
  has_function_privilege('authenticated', 'public.admin_set_application_status(uuid,text)', 'execute') as authed_set;
-- EXPECT: anon_list = false, anon_set = false, authed_list = true, authed_set = true

-- 5) The admins table is still RLS-enabled with NO policy (never client-readable)
select
  (select relrowsecurity from pg_class
   where relnamespace = 'public'::regnamespace and relname = 'admins') as admins_rls_enabled,
  (select count(*) from pg_policies
   where schemaname = 'public' and tablename = 'admins')               as admins_policy_count;
-- EXPECT: admins_rls_enabled = true, admins_policy_count = 0
