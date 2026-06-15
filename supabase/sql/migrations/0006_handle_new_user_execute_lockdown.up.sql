-- 0006_handle_new_user_execute_lockdown.up.sql
-- S2 (2a) follow-up found during the production smoke check.
--
-- Supabase's default privileges also grant EXECUTE on new functions to the
-- `authenticated` role. 0005 revoked handle_new_user from public + anon but not
-- from authenticated, so authenticated kept EXECUTE on it. handle_new_user is a
-- trigger function (returns trigger): PostgREST does not expose it as an RPC and
-- calling it outside a trigger errors, so this is not exploitable - but it
-- contradicts the "callable by no role" intent and least privilege. Revoke it
-- from authenticated too. (The owner/postgres and service_role retain it; the
-- trigger fires regardless of EXECUTE grants.)

revoke execute on function public.handle_new_user() from authenticated;
