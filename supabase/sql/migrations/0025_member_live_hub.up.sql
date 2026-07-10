-- 0025_member_live_hub.up.sql
-- Live/recorded sessions move entirely into the member workspace (owner
-- decision, 2026-07-10, sprint LH1): approved partners publish AND watch.
-- The anon read path dies; the member read path is a new approved-only
-- projection with a derived is_mine flag (never raw created_by). Table,
-- RLS policies, and publish_programming_session (0022) are untouched.

drop function if exists public.public_programming_sessions();

create or replace function public.member_programming_sessions()
returns table (
  id            uuid,
  title         text,
  summary       text,
  mode          text,
  status        text,
  venue         text,
  stream_url    text,
  recording_url text,
  starts_at     timestamptz,
  cover_path    text,
  is_mine       boolean
)
language sql
security definer
set search_path = ''
stable
as $$
  select s.id, s.title, s.summary, s.mode, s.status, s.venue,
         s.stream_url, s.recording_url, s.starts_at, s.cover_path,
         (s.created_by = (select auth.uid())) as is_mine
  from public.programming_sessions s
  where public.is_approved()          -- pending/revoked callers: zero rows
  order by s.starts_at desc nulls last;
$$;

revoke execute on function public.member_programming_sessions() from public, anon;
grant  execute on function public.member_programming_sessions() to authenticated;
