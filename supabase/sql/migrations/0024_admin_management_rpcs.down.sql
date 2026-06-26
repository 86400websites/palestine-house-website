-- 0024_admin_management_rpcs.down.sql
-- Reverses 0024: drops the HQ admin-management RPCs. Re-runnable
-- (drop ... if exists). The admins table (0003) and the is_admin() /
-- is_approved() helpers are untouched — 0024 only ADDED functions.

drop function if exists public.admin_list_admins();
drop function if exists public.admin_add_admin_by_email(text);
drop function if exists public.admin_remove_admin(uuid);
