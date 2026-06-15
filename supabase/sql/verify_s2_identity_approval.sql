-- verify_s2_identity_approval.sql
-- S2 step 6 verification — run on the NON-PRODUCTION project FIRST
-- (palestine-house-test-database, https://sdszcralogcrujtyghig.supabase.co),
-- AFTER applying 0001 -> 0005 in order.
--
-- This is a TEST HELPER, not a migration. Never run it as part of the apply
-- sequence and never on production. It seeds throwaway rows and proves the RLS
-- + approval boundary. Run it section by section in the SQL Editor and compare
-- each result to its "EXPECT" comment.
--
-- PREREQUISITE: create two test users in the Dashboard
--   (Authentication -> Users -> Add user, auto-confirm). The handle_new_user
--   trigger creates their profiles automatically. Copy their UUIDs and replace
--   every A_UUID / B_UUID below (keep the surrounding single quotes):
--     A_UUID = a normal applicant
--     B_UUID = will be made an admin

-- ---------------------------------------------------------------------------
-- 0) Objects exist + RLS on (run as the default SQL Editor role / postgres)
-- ---------------------------------------------------------------------------
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'applications', 'admins')
order by table_name;
-- EXPECT: admins, applications, profiles

select proname from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('handle_new_user', 'is_admin', 'is_approved', 'get_my_profile')
order by proname;
-- EXPECT: get_my_profile, handle_new_user, is_admin, is_approved

select relname, relrowsecurity from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('profiles', 'applications', 'admins')
order by relname;
-- EXPECT: relrowsecurity = true for all three

select count(*) as profiles_from_trigger from public.profiles;
-- EXPECT: 2 (the trigger created one profile per test user)

-- ---------------------------------------------------------------------------
-- 1) Seed throwaway test data (runs as postgres -> bypasses RLS). Re-run safe.
-- ---------------------------------------------------------------------------
insert into public.applications (user_id, name, email, city, why)
values ('A_UUID', 'Test Applicant A', 'a@example.test', 'Amman',
        'Verifying owner-scoped RLS.');

insert into public.admins (user_id) values ('B_UUID')
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- 2) anon sees nothing
-- ---------------------------------------------------------------------------
begin;
  set local role anon;
  select 'profiles' as tbl, count(*) from public.profiles
  union all select 'applications', count(*) from public.applications
  union all select 'admins', count(*) from public.admins;
rollback;
-- EXPECT: every count = 0 (or "permission denied" — both confirm default-deny)

-- ---------------------------------------------------------------------------
-- 3) authenticated User A sees ONLY its own profile + application
--    (If anything returns "permission denied" instead of a count, the
--    authenticated role lacks table grants -> tell me, we add explicit GRANTs.)
--    One row so the SQL Editor (which shows only the LAST result of a block)
--    displays every check at once.
-- ---------------------------------------------------------------------------
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"A_UUID","role":"authenticated"}';
  select auth.uid()                                                   as who,
         (select count(*) from public.profiles)                      as my_profiles,
         (select count(*) from public.profiles where id <> auth.uid()) as other_profiles,
         (select count(*) from public.applications)                  as my_apps,
         (select count(*) from public.admins)                        as admins_visible;
rollback;
-- EXPECT one row: who = A_UUID, my_profiles = 1, other_profiles = 0,
--                 my_apps = 1, admins_visible = 0
-- (my_apps = 1 only if section 1 was seeded for THIS A_UUID. The authoritative
--  applications test is 3b below, which inserts as the user under RLS.)

-- ---------------------------------------------------------------------------
-- 3b) applications RLS: owner can insert + read its own row; a user cannot
--     insert a row owned by someone else. This is the path Apply=signup uses
--     in S3c, so it must hold.
-- ---------------------------------------------------------------------------
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"A_UUID","role":"authenticated"}';
  -- insert OWN application (user_id = caller) -> allowed by with check
  insert into public.applications (user_id, name, email, city, why)
  values (auth.uid(), 'Self Insert A', 'a2@example.test', 'Amman', 'insert-own test');
  -- read own -> sees the row just inserted
  select count(*) as my_apps_after_insert from public.applications;
rollback;
-- EXPECT: my_apps_after_insert >= 1 (insert-own allowed AND read-own works)

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"A_UUID","role":"authenticated"}';
  -- insert a row owned by ANOTHER user -> blocked by with check
  insert into public.applications (user_id, name, email, city, why)
  values ('B_UUID', 'Cross Insert', 'x@example.test', 'Nablus', 'should fail');
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
-- EXPECT: exactly one row, A's (is_approved = false for now)

-- ---------------------------------------------------------------------------
-- 5) helpers: A is neither approved nor admin; B is admin
-- ---------------------------------------------------------------------------
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"A_UUID","role":"authenticated"}';
  select public.is_approved() as a_approved, public.is_admin() as a_admin;
rollback;
-- EXPECT: a_approved = false, a_admin = false

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"B_UUID","role":"authenticated"}';
  select public.is_approved() as b_approved, public.is_admin() as b_admin;
rollback;
-- EXPECT: b_admin = true (b_approved = false unless you approved B)

-- ---------------------------------------------------------------------------
-- 6) anon cannot EXECUTE the helpers (revoke from public + anon proven)
-- ---------------------------------------------------------------------------
begin;
  set local role anon;
  select public.is_admin();
rollback;
-- EXPECT: ERROR  permission denied for function is_admin
-- NOTE: before 0005, anon returned `false` (the verification finding). After
-- applying 0005_function_execute_hardening this MUST be a permission-denied error.

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
-- 8) approval flips correctly when set via a trusted path (postgres here)
-- ---------------------------------------------------------------------------
update public.profiles set is_approved = true where id = 'A_UUID';   -- as postgres
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"A_UUID","role":"authenticated"}';
  select public.is_approved() as a_approved_now;
rollback;
-- EXPECT: a_approved_now = true

-- ---------------------------------------------------------------------------
-- 9) CLEANUP (optional)
-- ---------------------------------------------------------------------------
-- delete from public.applications where user_id in ('A_UUID', 'B_UUID');
-- delete from public.admins where user_id = 'B_UUID';
-- update public.profiles set is_approved = false where id = 'A_UUID';
-- (remove the two test users from the Dashboard to drop their profiles)
