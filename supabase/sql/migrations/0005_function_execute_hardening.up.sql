-- 0005_function_execute_hardening.up.sql
-- S2 (2a) hardening fix found during non-prod verification (step 6).
--
-- Supabase grants EXECUTE on newly created functions in the public schema
-- directly to the API roles (including anon) via ALTER DEFAULT PRIVILEGES.
-- So "revoke execute ... from public" in 0003/0004 did NOT remove anon's
-- access: anon kept a direct grant and could call is_admin() / is_approved()
-- / get_my_profile() (returning false/empty, but violating the
-- authenticated-only contract). Verification section 6 caught this: anon
-- running is_admin() returned `false` instead of permission denied.
--
-- This migration revokes EXECUTE from public AND anon on every S2 function,
-- leaving execute granted to authenticated only. handle_new_user is a trigger
-- function callable by no role (the trigger fires regardless), so it gets no
-- grant.

revoke execute on function public.handle_new_user() from public, anon;

revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

revoke execute on function public.is_approved() from public, anon;
grant  execute on function public.is_approved() to authenticated;

revoke execute on function public.get_my_profile() from public, anon;
grant  execute on function public.get_my_profile() to authenticated;
