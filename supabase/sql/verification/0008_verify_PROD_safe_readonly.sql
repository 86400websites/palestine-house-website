-- 0008_verify_PROD_safe_readonly.sql
-- READ-ONLY post-apply check for migration 0008. Seeds NO data and creates NO
-- users, so it is SAFE on the production (live) database — or any database.
-- Run it right after applying ../migrations/0008_handle_new_user_full_name.up.sql
-- to confirm the trigger function was redefined correctly AND that nothing else
-- (hardening, lockdown, the S2 tables/policies) regressed. Compare each result
-- to its EXPECT comment.

-- 1) handle_new_user is still SECURITY DEFINER with search_path pinned to ''
select proname, prosecdef, proconfig
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname = 'handle_new_user';
-- EXPECT: prosecdef = true ; proconfig = {"search_path="}

-- 2) The body now maps full_name from the signup metadata
select
  position('full_name' in pg_get_functiondef('public.handle_new_user()'::regprocedure)) > 0
    as maps_full_name,
  position('raw_user_meta_data' in pg_get_functiondef('public.handle_new_user()'::regprocedure)) > 0
    as reads_metadata;
-- EXPECT: maps_full_name = true ; reads_metadata = true

-- 3) profiles.full_name column still present (0008 reuses it, does not add it)
select data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name';
-- EXPECT: text

-- 4) The new-user trigger is still attached to auth.users
select tgname
from pg_trigger
where tgrelid = 'auth.users'::regclass
  and not tgisinternal
  and tgname = 'on_auth_user_created';
-- EXPECT: on_auth_user_created

-- 5) EXECUTE lockdown intact — no app role can call the trigger function
select
  has_function_privilege('anon', 'public.handle_new_user()', 'execute')          as anon_exec,
  has_function_privilege('authenticated', 'public.handle_new_user()', 'execute') as authed_exec;
-- EXPECT: anon_exec = false ; authed_exec = false

-- 6) Regression: the S2 tables still have RLS on (0008 touched no tables)
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('profiles', 'applications', 'admins')
order by relname;
-- EXPECT: relrowsecurity = true for admins, applications, profiles

-- 7) Regression: the S2 policies are unchanged (admins has NO row)
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
-- EXPECT:
--   applications | applications_insert_own | INSERT | {authenticated} | qual = (null) |
--       with_check = ((user_id = ( SELECT auth.uid())) AND (status = 'pending'::text))
--   applications | applications_select_own | SELECT | {authenticated} |
--       qual = (user_id = ( SELECT auth.uid())) | with_check = (null)
--   profiles     | profiles_select_own     | SELECT | {authenticated} |
--       qual = (id = ( SELECT auth.uid())) | with_check = (null)
