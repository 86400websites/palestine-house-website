-- 0003_admins_helpers.up.sql
-- S2 (2a, step 4): admin membership + approval/admin helper functions.
--
-- admins lists the auth users who are HQ admins. RLS is default-deny with NO
-- client policy on purpose: clients can never read admins directly. Membership
-- is checked ONLY through is_admin(), a SECURITY DEFINER function that bypasses
-- RLS. is_approved() likewise resolves the caller's approval gate. Both are
-- hardened: pinned search_path, fully-qualified objects, auth.uid()
-- authorization, narrow boolean return, execute revoked from public then
-- granted to authenticated only.

create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS: enable + default-deny. No policy is created - admins is never
-- client-readable; only the SECURITY DEFINER functions below may read it.
alter table public.admins enable row level security;

-- True when the caller is an HQ admin.
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

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- True when the caller's profile is approved.
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

revoke execute on function public.is_approved() from public;
grant execute on function public.is_approved() to authenticated;
