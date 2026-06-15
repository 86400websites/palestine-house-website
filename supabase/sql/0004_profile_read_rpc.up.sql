-- 0004_profile_read_rpc.up.sql
-- S2 (2a, step 5): caller-only profile / approval-status read.
--
-- get_my_profile() returns ONLY the calling user's own row (id = auth.uid()):
-- the approval gate plus minimal identity. A pending session resolves its own
-- status and nothing else - the access boundary is set here for everything
-- gated later (element bodies, checklists, templates, resources, academy: none
-- exist yet). Hardened: SECURITY DEFINER, pinned search_path, fully-qualified
-- objects, auth.uid() authorization, narrow return, execute revoked from public
-- then granted to authenticated only.

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

revoke execute on function public.get_my_profile() from public;
grant execute on function public.get_my_profile() to authenticated;
