-- 0001_profiles.down.sql — reverses 0001_profiles.up.sql.
-- Drop in dependency order: trigger, then its function, then the policy, then
-- the table. (Dropping the table would also remove its policy, but explicit is
-- clearer.)

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop policy if exists profiles_select_own on public.profiles;
drop table if exists public.profiles;
