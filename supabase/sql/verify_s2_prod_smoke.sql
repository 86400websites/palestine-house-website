-- verify_s2_prod_smoke.sql
-- Read-only post-apply smoke check for PRODUCTION. Seeds NO data and creates
-- NO users — safe to run on the live database. Run it right after
-- apply_all_s2.sql to confirm production matches the verified non-prod state.
-- Compare each result to its EXPECT comment.

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

-- 4) Policies present (and admins deliberately has none)
select tablename, policyname
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
-- EXPECT:
--   applications -> applications_insert_own, applications_select_own
--   profiles     -> profiles_select_own
--   admins       -> (no rows)

-- 5) anon has NO EXECUTE on any S2 function (the 0005 hardening)
select p.proname, r.rolname as execute_granted_to
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral aclexplode(p.proacl) acl
join pg_roles r on r.oid = acl.grantee
where n.nspname = 'public'
  and p.proname in ('is_admin', 'is_approved', 'get_my_profile', 'handle_new_user')
  and acl.privilege_type = 'EXECUTE'
order by p.proname, r.rolname;
-- EXPECT: 'anon' NEVER appears. 'authenticated' appears for get_my_profile,
--         is_admin, is_approved. (The table owner / postgres may appear; that
--         is fine. The critical assertion: no row names anon.)
