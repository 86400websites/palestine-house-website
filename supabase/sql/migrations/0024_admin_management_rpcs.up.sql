-- 0024_admin_management_rpcs.up.sql
-- S11 (11-4): the HQ admin-management RPCs behind /admin/content/admins (the
-- old-S10 admin-management UI folds in here). Lets an admin see, add and remove
-- HQ admins through the UI instead of hand-editing the admins table.
--
-- The admins table (0003) and the is_admin() / is_approved() helpers are USED,
-- never modified — admins stays RLS default-deny with NO client policy. These
-- RPCs are hardened exactly like 0003/0009: SECURITY DEFINER, search_path = '',
-- fully-qualified objects, authorization decided from public.is_admin() INSIDE
-- the function, narrow returns (email is the only PII, joined from auth.users),
-- EXECUTE revoked from public + anon then granted to authenticated only.
--
-- Lockout prevention: admin_remove_admin refuses to remove yourself or the last
-- remaining admin, so HQ can never lock itself out.

-- The HQ admin roster — email only (no other PII), admins only. A non-admin
-- passes the is_admin() guard as false, so the WHERE yields zero rows.
create or replace function public.admin_list_admins()
returns table (
  user_id    uuid,
  email      text,
  created_at timestamptz
)
language sql
security definer
set search_path = ''
stable
as $$
  select a.user_id, u.email::text, a.created_at
  from public.admins a
  join auth.users u on u.id = a.user_id
  where public.is_admin()
  order by a.created_at;
$$;
revoke execute on function public.admin_list_admins() from public, anon;
grant execute on function public.admin_list_admins() to authenticated;

-- Add an admin by email. Folds the email -> user_id lookup into one
-- is_admin()-gated call (no raw email->id oracle is exposed as its own RPC).
-- Returns true if a NEW admin was added, false if they were already an admin
-- (neutral no-op); raises 'user not found' (P0002) for an unknown email.
create or replace function public.admin_add_admin_by_email(p_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_uid   uuid;
  v_ins   integer;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if v_email = '' then
    raise exception 'email is required' using errcode = '22023';
  end if;

  select u.id into v_uid
  from auth.users u
  where lower(u.email) = v_email
  limit 1;

  if v_uid is null then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  insert into public.admins (user_id)
  values (v_uid)
  on conflict (user_id) do nothing;
  get diagnostics v_ins = row_count;

  return v_ins > 0;  -- false = already an admin
end;
$$;
revoke execute on function public.admin_add_admin_by_email(text) from public, anon;
grant execute on function public.admin_add_admin_by_email(text) to authenticated;

-- Remove an admin, with lockout guards: refuses to remove yourself or the last
-- remaining admin (clear neutral message). Returns false when the target was not
-- an admin (neutral no-op). Concurrent removals are serialized with a table lock
-- so two admins removing each other at once can't race the last-admin guard into
-- an empty table.
create or replace function public.admin_remove_admin(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  -- Serialize membership removals BEFORE reading the count. Two admins removing
  -- each other concurrently would otherwise both read count = 2, both pass the
  -- last-admin guard, and both delete -> an empty admins table (lockout, a
  -- TOCTOU race). SHARE ROW EXCLUSIVE conflicts with itself, so a second
  -- concurrent admin_remove_admin waits for the first to commit and then
  -- re-reads an accurate count. Plain SELECTs (is_admin/is_approved) take
  -- ACCESS SHARE and are NOT blocked.
  lock table public.admins in share row exclusive mode;
  if p_user_id = (select auth.uid()) then
    raise exception 'cannot remove yourself' using errcode = '22023';
  end if;
  -- Never delete the last remaining admin (race-safe under the lock above).
  if exists (select 1 from public.admins a where a.user_id = p_user_id)
     and (select count(*) from public.admins) <= 1 then
    raise exception 'cannot remove the last admin' using errcode = '22023';
  end if;

  delete from public.admins where user_id = p_user_id;
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;
revoke execute on function public.admin_remove_admin(uuid) from public, anon;
grant execute on function public.admin_remove_admin(uuid) to authenticated;
