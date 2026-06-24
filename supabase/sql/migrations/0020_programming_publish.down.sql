-- 0020_programming_publish.down.sql — reverses 0020.
-- Drops the publish RPC and the mode CHECK. The programming_sessions table,
-- its owner-scoped RLS, and the public_programming_sessions() projection are
-- from 0013 and stay; existing rows keep whatever mode values they hold.

drop function if exists public.publish_programming_session(
  text, text, uuid, text, text, text, text, timestamptz
);

alter table public.programming_sessions
  drop constraint if exists programming_sessions_mode_check;
