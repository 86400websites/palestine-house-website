-- 0002_applications.down.sql — reverses 0002_applications.up.sql.
-- Drop policies and index, then the table. (Dropping the table would also
-- remove its policies and index, but explicit is clearer.)

drop policy if exists applications_select_own on public.applications;
drop policy if exists applications_insert_own on public.applications;
drop index if exists public.applications_user_id_idx;
drop table if exists public.applications;
