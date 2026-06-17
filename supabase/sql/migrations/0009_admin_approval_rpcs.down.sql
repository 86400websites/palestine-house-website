-- 0009_admin_approval_rpcs.down.sql — reverses 0009_admin_approval_rpcs.up.sql.
-- Drop the admin RPCs, then restore the S2 (0002) status vocabulary.
-- NOTE: if any application has already been set to 'declined', restore the old
-- constraint only after migrating those rows (e.g. to 'rejected'), or the ADD
-- CONSTRAINT will fail — expected, since down is for rolling back before the
-- new value is in use.

drop function if exists public.admin_set_application_status(uuid, text);
drop function if exists public.admin_list_applications();

-- 'declined' rows exist once HQ has declined any application; map them back to
-- the S2 'rejected' value first so restoring the old CHECK cannot fail.
update public.applications set status = 'rejected' where status = 'declined';

alter table public.applications
  drop constraint if exists applications_status_check;

alter table public.applications
  add constraint applications_status_check
  check (status in ('pending', 'approved', 'rejected'));
