-- S2_verify_PROD_safe_readonly.sql
-- READ-ONLY post-apply check. Seeds NO data and creates NO users, so it is SAFE
-- to run on the production (live) database — or on any database. Run it right
-- after applying ../bundles/S2_apply_all.sql (or the ../migrations/ set) to
-- confirm the database matches the verified non-prod state. Compare each result
-- to its EXPECT comment.

-- 1) Tables exist + RLS enabled
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('profiles', 'applications', 'admins')
order by relname;
-- EXPECT: relrowsecurity = true for admins, applications, profiles

-- 2) Functions exist
select proname
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('handle_new_user', 'is_admin', 'is_approved', 'get_my_profile')
order by proname;
-- EXPECT: get_my_profile, handle_new_user, is_admin, is_approved

-- 3) The new-user trigger is attached to auth.users
select tgname
from pg_trigger
where tgrelid = 'auth.users'::regclass
  and not tgisinternal
  and tgname = 'on_auth_user_created';
-- EXPECT: on_auth_user_created

-- 4) Policy definitions (names AND rules, so policy drift is visible)
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
-- EXPECT (admins has NO row):
--   applications | applications_insert_own | INSERT | {authenticated} | qual = (null) |
--       with_check = ((user_id = ( SELECT auth.uid())) AND (status = 'pending'::text))
--   applications | applications_select_own | SELECT | {authenticated} |
--       qual = (user_id = ( SELECT auth.uid())) | with_check = (null)
--   profiles     | profiles_select_own     | SELECT | {authenticated} |
--       qual = (id = ( SELECT auth.uid())) | with_check = (null)

-- 5) Function EXECUTE privileges, the definitive way. has_function_privilege()
--    counts grants via PUBLIC too — a plain pg_proc.proacl join to pg_roles
--    silently drops PUBLIC (grantee OID 0) and could miss a PUBLIC execute grant.
select
  has_function_privilege('anon', 'public.is_admin()', 'execute')        as anon_is_admin,
  has_function_privilege('anon', 'public.is_approved()', 'execute')     as anon_is_approved,
  has_function_privilege('anon', 'public.get_my_profile()', 'execute')  as anon_get_my_profile,
  has_function_privilege('anon', 'public.handle_new_user()', 'execute') as anon_handle_new_user,
  has_function_privilege('authenticated', 'public.handle_new_user()', 'execute') as authed_handle_new_user,
  has_function_privilege('authenticated', 'public.is_admin()', 'execute')        as authed_is_admin,
  has_function_privilege('authenticated', 'public.is_approved()', 'execute')     as authed_is_approved,
  has_function_privilege('authenticated', 'public.get_my_profile()', 'execute')  as authed_get_my_profile;
-- EXPECT: every anon_* = false AND authed_handle_new_user = false;
--         authed_is_admin = authed_is_approved = authed_get_my_profile = true.
