-- 0025_verify_PROD_safe_readonly.sql
-- Read-only structural check for migration 0025 (member Live hub). Safe on ANY
-- database, including production. Run only after the human applies 0025 there.

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
