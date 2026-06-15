-- 0002_applications.up.sql
-- S2 (2a, step 3): the partner application record.
--
-- One row per submitted application, owned by the auth user who applied
-- (apply = sign-up). Columns mirror the live Apply form
-- (src/components/sections/apply-form.tsx): name, email, city,
-- organisation (optional), why. RLS is default-deny: the owner may insert and
-- read ONLY their own rows (no cross-user read). HQ's read of the queue is an
-- S4 admin RPC; the submit path is wired in S3c.

create table if not exists public.applications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  name         text        not null,
  email        text        not null,
  city         text        not null,
  organisation text,
  why          text        not null,
  status       text        not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now()
);

-- Every owner-scoped query filters by user_id (the RLS predicate).
create index if not exists applications_user_id_idx
  on public.applications (user_id);

-- RLS: enable + default-deny (no policy means no access) before any data lands.
alter table public.applications enable row level security;

-- Owner-scoped: a session inserts rows it owns ...
create policy applications_insert_own
  on public.applications
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- ... and reads only its own rows (no cross-user read).
create policy applications_select_own
  on public.applications
  for select
  to authenticated
  using (user_id = (select auth.uid()));
