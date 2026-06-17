-- 0009_admin_approval_rpcs.up.sql
-- S4 (4a): the HQ approval queue read + the approval flip, as hardened
-- admin-only RPCs. Nothing is made client-readable: the admins table keeps its
-- no-policy default-deny, applications keeps its owner-scoped RLS, and
-- profiles.is_approved stays non-client-writable. HQ reaches the queue and
-- flips approval ONLY through these is_admin()-gated SECURITY DEFINER
-- functions — never the secret/service_role key.
--
-- Hardened exactly like 0003/0004: language sql/plpgsql, security definer,
-- search_path = '' with fully-qualified objects, authorization decided from
-- public.is_admin() INSIDE the function (arguments are never trusted), narrow
-- returns, execute revoked from public + anon then granted to authenticated.
--
-- It also aligns the applications.status vocabulary with the approved admin
-- copy + design (docs/page-copy/04-admin/admin-approvals.md /
-- docs/page-designs/admin/AdminApprovals): the decline state is 'declined', not
-- the S2 placeholder 'rejected'. No existing row uses 'rejected' (every
-- application is inserted 'pending' under the 0007 insert policy), so swapping
-- the allowed set is backwards-compatible.

-- 1) Status vocabulary: pending | approved | declined.
--    The S2 inline check (0002) is auto-named applications_status_check.
--    Defensive: no row should ever be 'rejected' (inserts are forced 'pending'
--    by 0007 and the only status writer is admin_set_application_status, below,
--    restricted to approved/declined), but migrate any such row first so the new
--    CHECK can never fail on apply. A no-op wherever that invariant holds.
update public.applications set status = 'declined' where status = 'rejected';

alter table public.applications
  drop constraint if exists applications_status_check;

alter table public.applications
  add constraint applications_status_check
  check (status in ('pending', 'approved', 'declined'));

-- 2) admin_list_applications() — the whole queue, admins only.
--    A non-admin caller passes the is_admin() guard as false, so the WHERE
--    yields zero rows (no leak). Pending first, then newest, matching the
--    approvals design's sort order.
create or replace function public.admin_list_applications()
returns table (
  id           uuid,
  user_id      uuid,
  name         text,
  email        text,
  city         text,
  organisation text,
  why          text,
  status       text,
  created_at   timestamptz
)
language sql
security definer
set search_path = ''
stable
as $$
  select a.id, a.user_id, a.name, a.email, a.city, a.organisation,
         a.why, a.status, a.created_at
  from public.applications a
  where public.is_admin()
  order by
    case a.status when 'pending' then 0 when 'approved' then 1 else 2 end,
    a.created_at desc;
$$;

revoke execute on function public.admin_list_applications() from public, anon;
grant execute on function public.admin_list_applications() to authenticated;

-- 3) admin_set_application_status() — approve / decline, admins only.
--    Sets the application's status AND mirrors the gate
--    (profiles.is_approved) for that applicant in the same call:
--    approved -> true, declined -> false. Authorization is is_admin() inside
--    the function; the application id + status are validated, never trusted to
--    grant access. Returns the applicant's new approval state.
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
