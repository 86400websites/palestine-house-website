-- 0010_admin_set_status_profile_guard.down.sql — reverses 0010.
-- Restore the 0009 body of admin_set_application_status() (without the
-- profile-row existence check). Grants are preserved by create or replace and
-- re-asserted for safety.

create or replace function public.admin_set_application_status(
  p_application_id uuid,
  p_status         text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if p_status not in ('approved', 'declined') then
    raise exception 'invalid status: %', p_status using errcode = '22023';
  end if;

  update public.applications
  set status = p_status
  where id = p_application_id
  returning user_id into v_user_id;

  if v_user_id is null then
    raise exception 'application not found' using errcode = 'P0002';
  end if;

  update public.profiles
  set is_approved = (p_status = 'approved'),
      updated_at  = now()
  where id = v_user_id;

  return (p_status = 'approved');
end;
$$;

revoke execute on function public.admin_set_application_status(uuid, text) from public, anon;
grant execute on function public.admin_set_application_status(uuid, text) to authenticated;
