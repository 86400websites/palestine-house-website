-- 0023_admin_content_rpcs.down.sql
-- Reverses 0023: drops the HQ content-management read/write RPCs. Re-runnable
-- (drop ... if exists). The content TABLES (elements / academy_modules /
-- resources) and the public/approved read projections (get_elements /
-- get_element / get_academy_modules / get_resources / get_resource_download) are
-- untouched — 0023 only ADDED functions, so undoing it only drops them.

drop function if exists public.admin_list_elements();
drop function if exists public.admin_get_element(text);
drop function if exists public.admin_upsert_element(text, text, text, text, text, text, text, text, text, integer);
drop function if exists public.admin_delete_element(text);

drop function if exists public.admin_list_academy_modules();
drop function if exists public.admin_get_academy_module(uuid);
drop function if exists public.admin_upsert_academy_module(uuid, text, text, text, text, text, integer);
drop function if exists public.admin_delete_academy_module(uuid);

drop function if exists public.admin_list_resources();
drop function if exists public.admin_get_resource(uuid);
drop function if exists public.admin_update_resource(uuid, text, text, text, uuid, text, integer);
drop function if exists public.admin_delete_resource(uuid);
