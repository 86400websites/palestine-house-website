-- 0013_programming_sessions.up.sql
-- S5 (5c): the Live Programming feed — the one place gated and public meet.
--
-- One row per session. status drives the public badges (scheduled = "Upcoming",
-- live = "Live now", past = "Recording"). mode is a free-text category left
-- unconstrained until the partner-publishing UI is designed (S7 — flagged design
-- gap). Writes are owner-scoped under RLS: an APPROVED partner inserts/updates
-- only its own rows (created_by = auth.uid()); reads of its own rows are
-- owner-scoped too.
--
-- The public listing does NOT come from a table SELECT policy. It comes ONLY
-- from public_programming_sessions() — a hardened SECURITY DEFINER projection
-- that returns the anon-safe columns (no created_by, no internal timestamps) and
-- is the ONE function in the whole schema granted to anon. Everything else stays
-- approved-only. (S7 wires /live + the Experience strip to this RPC; partner
-- publishing tools use the owner-scoped policies below.)

create table if not exists public.programming_sessions (
  id            uuid primary key default gen_random_uuid(),
  created_by    uuid        not null references auth.users (id) on delete cascade,
  title         text        not null,
  summary       text,
  mode          text,
  status        text        not null default 'scheduled'
                  check (status in ('scheduled', 'live', 'past')),
  venue         text,
  stream_url    text,
  recording_url text,
  starts_at     timestamptz,
  cover_path    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists programming_sessions_created_by_idx
  on public.programming_sessions (created_by);

-- RLS: enable + default-deny. Owner-scoped partner management below; the public
-- read path is the SECURITY DEFINER RPC, not a policy.
alter table public.programming_sessions enable row level security;

-- A partner reads its own sessions (the publishing dashboard, S7).
create policy programming_sessions_select_own
  on public.programming_sessions
  for select
  to authenticated
  using (created_by = (select auth.uid()));

-- Publishing requires approval AND ownership; the owner is forced to auth.uid().
create policy programming_sessions_insert_own
  on public.programming_sessions
  for insert
  to authenticated
  with check (created_by = (select auth.uid()) and public.is_approved());

create policy programming_sessions_update_own
  on public.programming_sessions
  for update
  to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()) and public.is_approved());

-- A partner may remove its own session (ownership only).
create policy programming_sessions_delete_own
  on public.programming_sessions
  for delete
  to authenticated
  using (created_by = (select auth.uid()));

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
