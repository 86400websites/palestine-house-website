-- 0010_admin_set_status_profile_guard.up.sql
-- S4 follow-up from the independent code review (non-blocking, Medium).
--
-- 0009's admin_set_application_status() updated the application's status and
-- then profiles.is_approved, but did NOT verify a profile row actually existed.
-- In normal operation every applicant has a profile (the 0001 handle_new_user
-- trigger creates one for every auth user), so this cannot currently happen —
-- but if an application ever referenced a user with no profile row, the
-- application would flip to 'approved' while the real gate (is_approved) stayed
-- locked. Make the function reject that case so the whole call rolls back
-- atomically (a single statement = one transaction).
--
-- Same hardening as 0009: SECURITY DEFINER, search_path = '', fully-qualified
-- objects, is_admin() authorization inside, narrow return. create or replace
-- keeps the existing EXECUTE grants; they are re-asserted for safety.

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
  v_user_id    uuid;
  v_profile_id uuid;
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
  where id = v_user_id
  returning id into v_profile_id;

  if v_profile_id is null then
    -- No profile to mirror the gate onto: refuse rather than half-apply.
    raise exception 'profile not found for applicant' using errcode = 'P0002';
  end if;

  return (p_status = 'approved');
end;
$$;

revoke execute on function public.admin_set_application_status(uuid, text) from public, anon;
grant execute on function public.admin_set_application_status(uuid, text) to authenticated;
