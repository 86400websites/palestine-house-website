-- 0013_programming_sessions.down.sql — reverses 0013_programming_sessions.up.sql.
-- Drop the public RPC, then the owner-scoped policies, then the table.

drop function if exists public.public_programming_sessions();
drop policy if exists programming_sessions_delete_own on public.programming_sessions;
drop policy if exists programming_sessions_update_own on public.programming_sessions;
drop policy if exists programming_sessions_insert_own on public.programming_sessions;
drop policy if exists programming_sessions_select_own on public.programming_sessions;
drop table if exists public.programming_sessions;
