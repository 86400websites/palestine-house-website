-- 0008_handle_new_user_full_name.down.sql
-- Reverts 0008 only: restore the id-only profile-creation body (0001/0006
-- state). Profiles created while 0008 was live keep whatever full_name they
-- got — reverting the function does not (and should not) rewrite data. The
-- EXECUTE lockdown is re-asserted so the rolled-back function stays hardened.

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
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
