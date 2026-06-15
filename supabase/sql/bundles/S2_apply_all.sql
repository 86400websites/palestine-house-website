-- S2_apply_all.sql — S2 (Database phase 1: identity & approval) CONSOLIDATED.
--
-- A single-pass apply of all of S2 to a FRESH database (e.g. production), so it
-- need not be run as separate fragments. This is the FINAL STATE of migrations
-- 0001–0007: the functions carry their final hardened grants (EXECUTE revoked
-- from public + anon, and handle_new_user also from authenticated — fixes 0005
-- and 0006), and the applications insert policy is restricted to status =
-- 'pending' (fix 0007). Running this top-to-bottom produces exactly the state
-- verified on the non-production project.
--
-- The numbered files in ../migrations/ (0001 … 0007) remain the canonical,
-- individually-reversible record (see ../README.md) and define the rollback
-- story (run the .down.sql files in reverse). To roll this bundle back, use those.
--
-- Apply ONLY after the non-production verification has passed. Run in the
-- Supabase SQL Editor, top to bottom, then run
-- ../verification/S2_verify_PROD_safe_readonly.sql.

-- ===========================================================================
-- profiles (0001) — identity + approval gate
-- ===========================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  is_approved boolean     not null default false,
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ===========================================================================
-- applications (0002) — partner application record (mirrors the Apply form)
-- ===========================================================================
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

create index if not exists applications_user_id_idx
  on public.applications (user_id);

alter table public.applications enable row level security;

create policy applications_insert_own
  on public.applications
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'      -- 0007: applicants may only create a pending row
  );

create policy applications_select_own
  on public.applications
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ===========================================================================
-- admins + helpers (0003, with the final grants from 0005)
-- ===========================================================================
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
-- No policy on admins: never client-readable; only the definer functions read it.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

create or replace function public.is_approved()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_approved
  );
$$;

revoke execute on function public.is_approved() from public, anon;
grant  execute on function public.is_approved() to authenticated;

-- ===========================================================================
-- get_my_profile (0004, with the final grants from 0005)
-- ===========================================================================
create or replace function public.get_my_profile()
returns table (
  id          uuid,
  is_approved boolean,
  full_name   text
)
language sql
security definer
set search_path = ''
stable
as $$
  select p.id, p.is_approved, p.full_name
  from public.profiles p
  where p.id = auth.uid();
$$;

revoke execute on function public.get_my_profile() from public, anon;
grant  execute on function public.get_my_profile() to authenticated;
