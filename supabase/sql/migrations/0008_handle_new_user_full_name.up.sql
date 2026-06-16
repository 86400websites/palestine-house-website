-- 0008_handle_new_user_full_name.up.sql
-- S3 (3c): carry the applicant's name onto their profile.
--
-- 0001's handle_new_user created the profile row with id ONLY, leaving
-- profiles.full_name NULL. Apply = sign-up passes the name as auth user
-- metadata (signUp options.data.full_name -> auth.users.raw_user_meta_data).
-- Copy it onto the profile at creation time so get_my_profile() (0004) returns
-- it and the dashboard greeting (flag 5d) has a name; trim and treat blank as
-- NULL so a stray space never becomes a "name".
--
-- Expand-only / backwards-compatible: the column already exists (0001); rows
-- created before this still have NULL (the greeting falls back, as designed).
-- Still SECURITY DEFINER, search_path pinned to '', fully-qualified, and the
-- EXECUTE lockdown from 0005/0006 is re-asserted (CREATE OR REPLACE keeps
-- existing grants, but we restate the revokes so the hardened state is
-- guaranteed regardless).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Re-assert the lockdown (no role may call this trigger function directly).
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
