-- S4_verify_TEST_db_only.sql
-- S4 verification — intended for the NON-PRODUCTION (TEST) database
-- (palestine-house-test-database, https://sdszcralogcrujtyghig.supabase.co),
-- AFTER applying ../migrations/0009_admin_approval_rpcs.up.sql.
--
-- This is a TEST HELPER, not a migration. The role-simulation checks run inside
-- begin ... rollback so they make NO permanent changes. (For production use the
-- read-only ../verification/S4_verify_PROD_safe_readonly.sql.) Run it section by
-- section in the SQL Editor and compare each result to its "EXPECT".
--
-- PREREQUISITE — the GATE 0 seed data already created for S4:
--   ADMIN_UUID     = the admin account  (mohammad@86400.studio, in public.admins)
--   APPLICANT_UUID = a NON-admin pending applicant (testpartner@86400.studio)
--   APP_ID         = that applicant's row id in public.applications
-- Fetch them, then replace every ADMIN_UUID / APPLICANT_UUID / APP_ID below
-- (keep the surrounding single quotes):
--   select id, email from auth.users
--   where email in ('mohammad@86400.studio', 'testpartner@86400.studio');
--   select id, user_id, status from public.applications order by created_at;

-- ---------------------------------------------------------------------------
-- 0) The two new functions exist (read-only)
-- ---------------------------------------------------------------------------
select proname from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('admin_list_applications', 'admin_set_application_status')
order by proname;
-- EXPECT: admin_list_applications, admin_set_application_status

-- ---------------------------------------------------------------------------
-- 1) status vocabulary is now pending | approved | declined (read-only)
-- ---------------------------------------------------------------------------
select pg_get_constraintdef(oid) as status_check
from pg_constraint
where conrelid = 'public.applications'::regclass
  and conname = 'applications_status_check';
-- EXPECT: CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'declined'::text]))

-- ---------------------------------------------------------------------------
-- 2) EXECUTE privileges: anon cannot call either RPC; authenticated can
--    (the real authorization is is_admin() INSIDE each function).
-- ---------------------------------------------------------------------------
select
  has_function_privilege('anon', 'public.admin_list_applications()', 'execute')                 as anon_list,
  has_function_privilege('anon', 'public.admin_set_application_status(uuid,text)', 'execute')    as anon_set,
  has_function_privilege('authenticated', 'public.admin_list_applications()', 'execute')              as authed_list,
  has_function_privilege('authenticated', 'public.admin_set_application_status(uuid,text)', 'execute') as authed_set;
-- EXPECT: anon_list = false, anon_set = false, authed_list = true, authed_set = true

-- ---------------------------------------------------------------------------
-- 3) The admin sees the whole queue; a non-admin sees nothing.
-- ---------------------------------------------------------------------------
-- 3a) admin (ADMIN_UUID) -> all rows
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"ADMIN_UUID","role":"authenticated"}';
  select count(*) as rows_admin_sees from public.admin_list_applications();
rollback;
-- EXPECT: rows_admin_sees = the total number of applications (>= 2)

-- 3b) non-admin (APPLICANT_UUID) -> zero rows (no leak)
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"APPLICANT_UUID","role":"authenticated"}';
  select count(*) as rows_nonadmin_sees from public.admin_list_applications();
rollback;
-- EXPECT: rows_nonadmin_sees = 0

-- ---------------------------------------------------------------------------
-- 4) A non-admin cannot flip approval (authorization is inside the function).
-- ---------------------------------------------------------------------------
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"APPLICANT_UUID","role":"authenticated"}';
  select public.admin_set_application_status('APP_ID', 'approved');
rollback;
-- EXPECT: ERROR  not authorized   (errcode 42501)

-- ---------------------------------------------------------------------------
-- 5) An invalid status is rejected even for an admin (narrow validation).
-- ---------------------------------------------------------------------------
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"ADMIN_UUID","role":"authenticated"}';
  select public.admin_set_application_status('APP_ID', 'banned');
rollback;
-- EXPECT: ERROR  invalid status: banned   (errcode 22023)

-- ---------------------------------------------------------------------------
-- 6) Admin approve flips the application AND mirrors the gate; decline reverses
--    it. Both run inside begin ... rollback, so NOTHING persists — the real,
--    persistent flip is exercised through /admin/approvals in sub-step 3.
-- ---------------------------------------------------------------------------
-- 6a) approve -> status approved + is_approved true for the applicant
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"ADMIN_UUID","role":"authenticated"}';
  select public.admin_set_application_status('APP_ID', 'approved') as returns_true;
  select a.status as app_status, p.is_approved
  from public.applications a
  join public.profiles p on p.id = a.user_id
  where a.id = 'APP_ID';
rollback;
-- EXPECT: returns_true = true; then app_status = approved, is_approved = true

-- 6b) decline -> status declined + is_approved false for the applicant
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"ADMIN_UUID","role":"authenticated"}';
  select public.admin_set_application_status('APP_ID', 'declined') as returns_false;
  select a.status as app_status, p.is_approved
  from public.applications a
  join public.profiles p on p.id = a.user_id
  where a.id = 'APP_ID';
rollback;
-- EXPECT: returns_false = false; then app_status = declined, is_approved = false

-- ---------------------------------------------------------------------------
-- 7) Belt-and-suspenders: if the SQL Editor did NOT honour a rollback above,
--    this restores the applicant to a clean pending state so the /admin/approvals
--    UI test in sub-step 3 starts from "pending". Safe + idempotent to run.
-- ---------------------------------------------------------------------------
update public.applications set status = 'pending' where id = 'APP_ID';
update public.profiles set is_approved = false where id = 'APPLICANT_UUID';
select a.status as app_status, p.is_approved
from public.applications a
join public.profiles p on p.id = a.user_id
where a.id = 'APP_ID';
-- EXPECT: app_status = pending, is_approved = false
