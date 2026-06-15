-- 0003_admins_helpers.down.sql — reverses 0003_admins_helpers.up.sql.
-- Drop the functions first (is_admin reads the admins table), then the table.

drop function if exists public.is_approved();
drop function if exists public.is_admin();
drop table if exists public.admins;
