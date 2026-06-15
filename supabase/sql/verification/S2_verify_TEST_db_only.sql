-- S2_verify_TEST_db_only.sql
-- S2 verification — intended for the NON-PRODUCTION (TEST) database
-- (palestine-house-test-database, https://sdszcralogcrujtyghig.supabase.co),
-- AFTER applying every migration in ../migrations/ (0001 -> 0007) in order.
--
-- This is a TEST HELPER, not a migration. EVERY mutating section runs inside
-- begin ... rollback, so the script makes NO permanent changes — it seeds the
-- rows it needs only inside a transaction it then rolls back. (For production
-- use the read-only ../verification/S2_verify_PROD_safe_readonly.sql.) Run it
-- section by section in the SQL Editor and compare each result to its "EXPECT".
--
-- PREREQUISITE: create two test users in the Dashboard
--   (Authentication -> Users -> Add user, auto-confirm). The handle_new_user
--   trigger creates their profiles automatically. Copy their UUIDs and replace
--   every A_UUID / B_UUID below (keep the surrounding single quotes):
--     A_UUID = a normal applicant
--     B_UUID = a second user, used as the admin in the helper checks

-- ---------------------------------------------------------------------------
-- 0) Objects exist + RLS on (read-only)
-- ---------------------------------------------------------------------------
select relname, relrowsecurity from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('profiles', 'applications', 'admins')
order by relname;
-- EXPECT: relrowsecurity = true for admins, applications, profiles

select proname from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('handle_new_user', 'is_admin', 'is_approved', 'get_my_profile')
order by proname;
-- EXPECT: get_my_profile, handle_new_user, is_admin, is_approved

-- ---------------------------------------------------------------------------
-- 1) anon sees nothing
-- ---------------------------------------------------------------------------
begin;
  set local role anon;
  select 'profiles' as tbl, count(*) from public.profiles
  union all select 'applications', count(*) from public.applications
  union all select 'admins', count(*) from public.admins;
rollback;
-- EXPECT: every count = 0 (or "permission denied" — both confirm default-deny)

-- ---------------------------------------------------------------------------
-- 2) authenticated User A sees ONLY its own data. Seeds an application for A
--    inside the transaction (rolled back). One row so the SQL Editor (which
--    shows only the LAST result of a block) displays every check at once.
-- ---------------------------------------------------------------------------
begin;
  insert into public.applications (user_id, name, email, city, why)
  values ('A_UUID', 'Verify A', 'a@example.test', 'Amman', 'isolation check');
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"A_UUID","role":"authenticated"}';
  select auth.uid()                                                    as who,
         (select count(*) from public.profiles)                       as my_profiles,
         (select count(*) from public.profiles where id <> auth.uid()) as other_profiles,
         (select count(*) from public.applications)                   as my_apps,
         (select count(*) from public.admins)                         as admins_visible;
rollback;
-- EXPECT one row: who = A_UUID, my_profiles = 1, other_profiles = 0,
--                 my_apps = 1, admins_visible = 0

-- ---------------------------------------------------------------------------
-- 3) applications RLS — the path Apply=signup uses in S3c. A user may insert
--    its OWN pending row and read it back, but may NOT (3b) insert for someone
--    else, nor (3c) pre-set status to anything but 'pending' (migration 0007).
-- ---------------------------------------------------------------------------
-- 3a) own + pending -> allowed; read-own works
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"A_UUID","role":"authenticated"}';
  insert into public.applications (user_id, name, email, city, why)
  values (auth.uid(), 'Self Insert A', 'a2@example.test', 'Amman', 'insert-own test');
  select count(*) as my_apps_after_insert from public.applications;
rollback;
-- EXPECT: my_apps_after_insert = 1 (insert-own allowed AND read-own works)

-- 3b) row owned by ANOTHER user -> blocked
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"A_UUID","role":"authenticated"}';
  insert into public.applications (user_id, name, email, city, why)
  values ('B_UUID', 'Cross Insert', 'x@example.test', 'Nablus', 'should fail');
rollback;
-- EXPECT: ERROR  new row violates row-level security policy for table "applications"

-- 3c) own row but status pre-set to 'approved' -> blocked by 0007
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"A_UUID","role":"authenticated"}';
  insert into public.applications (user_id, name, email, city, why, status)
  values (auth.uid(), 'Forge Status', 'a3@example.test', 'Amman', 'should fail', 'approved');
rollback;
-- EXPECT: ERROR  new row violates row-level security policy for table "applications"

-- ---------------------------------------------------------------------------
-- 4) get_my_profile returns the caller's own row only
-- ---------------------------------------------------------------------------
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"A_UUID","role":"authenticated"}';
  select * from public.get_my_profile();
rollback;
-- EXPECT: exactly one row, A's (is_approved = false)

-- ---------------------------------------------------------------------------
-- 5) helpers: A is neither approved nor admin; B is admin. Seeds B as an admin
--    inside the transaction (rolled back).
-- ---------------------------------------------------------------------------
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"A_UUID","role":"authenticated"}';
  select public.is_approved() as a_approved, public.is_admin() as a_admin;
rollback;
-- EXPECT: a_approved = false, a_admin = false

begin;
  insert into public.admins (user_id) values ('B_UUID') on conflict (user_id) do nothing;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"B_UUID","role":"authenticated"}';
  select public.is_approved() as b_approved, public.is_admin() as b_admin;
rollback;
-- EXPECT: b_approved = false, b_admin = true

-- ---------------------------------------------------------------------------
-- 6) EXECUTE privileges: signed-out (anon) cannot call any helper/RPC, and
--    authenticated cannot call the trigger function. has_function_privilege()
--    also catches grants via PUBLIC (which a pg_roles join would miss).
-- ---------------------------------------------------------------------------
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

-- Live confirmation that anon is actually refused at call time:
begin;
  set local role anon;
  select public.is_admin();
rollback;
-- EXPECT: ERROR  permission denied for function is_admin

-- ---------------------------------------------------------------------------
-- 7) privilege escalation blocked: a user cannot self-approve or self-admin
-- ---------------------------------------------------------------------------
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"A_UUID","role":"authenticated"}';
  with up as (
    update public.profiles set is_approved = true
    where id = 'A_UUID'
    returning 1
  )
  select count(*) as rows_updated from up;
rollback;
-- EXPECT: rows_updated = 0  (no update policy -> RLS blocks the self-approve)

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"A_UUID","role":"authenticated"}';
  insert into public.admins (user_id) values ('A_UUID');
rollback;
-- EXPECT: ERROR  new row violates row-level security policy (no insert policy)

-- ---------------------------------------------------------------------------
-- 8) approval flips correctly when set by a trusted path (postgres here),
--    inside a transaction that is rolled back (nothing persists).
-- ---------------------------------------------------------------------------
begin;
  update public.profiles set is_approved = true where id = 'A_UUID';
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"A_UUID","role":"authenticated"}';
  select public.is_approved() as a_approved_now;
rollback;
-- EXPECT: a_approved_now = true

-- ---------------------------------------------------------------------------
-- Nothing above persists (every write is rolled back). The only leftover test
-- objects are the two Dashboard-created users; delete them from the Dashboard
-- when you're done.
-- ---------------------------------------------------------------------------
