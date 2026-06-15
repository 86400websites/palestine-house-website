-- 0001_profiles.up.sql
-- S2 (2a, step 2): identity + approval flag.
--
-- profiles holds one row per auth user, carrying the approval gate
-- (is_approved). RLS is default-deny: a session may read ONLY its own row.
-- is_approved is never user-writable (there is no insert/update/delete policy
-- for clients) — approval is flipped by the S4 admin path. A profile row is
-- created automatically when an auth user is created (handle_new_user trigger).

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  is_approved boolean     not null default false,
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- RLS: enable + default-deny (no policy means no access) before any data lands.
alter table public.profiles enable row level security;

-- The only client access: a session reads its own row.
-- (select auth.uid()) is the Supabase-recommended form (caches per statement).
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

-- Create a profile row when an auth user is created.
-- SECURITY DEFINER so the insert runs under RLS on profiles; search_path is
-- pinned to '' with fully-qualified objects per the hardening rules. The
-- function is not client-callable (trigger fires regardless of EXECUTE), so
-- execute is revoked from public and granted to no one.
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

revoke execute on function public.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
