-- 0025_member_live_hub.down.sql
-- Restore the anon-safe public projection from 0013 and remove the approved-only
-- member projection. Table, RLS policies, and publishing remain untouched.

drop function if exists public.member_programming_sessions();

-- The ONLY anon-callable function in the schema. Returns the anon-safe columns
-- only — never created_by or internal timestamps. Newest first; the UI buckets
-- into Live now / Upcoming / Past recordings by status + starts_at.
create or replace function public.public_programming_sessions()
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
  cover_path    text
)
language sql
security definer
set search_path = ''
stable
as $$
  select s.id, s.title, s.summary, s.mode, s.status, s.venue,
         s.stream_url, s.recording_url, s.starts_at, s.cover_path
  from public.programming_sessions s
  order by s.starts_at desc nulls last;
$$;

revoke execute on function public.public_programming_sessions() from public;
grant execute on function public.public_programming_sessions() to anon, authenticated;
