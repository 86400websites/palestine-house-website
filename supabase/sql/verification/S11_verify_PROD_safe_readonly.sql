-- S11_verify_PROD_safe_readonly.sql
-- Read-only verification for S11 (migrations 0023 admin content RPCs + 0024
-- admin management RPCs). Safe to run on ANY database, including PRODUCTION:
-- it only LOOKS — it never writes. Run it on both TEST and PRODUCTION after the
-- migrations are applied, and compare each result to its EXPECT.
--
-- (For the role-simulated write/lockout proofs, use the TEST-only
-- S11_verify_TEST_db_only.sql.)

with admin_fns as (
  select p.oid, p.proname, p.prosecdef, p.proconfig
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'admin_list_elements','admin_get_element','admin_upsert_element','admin_delete_element',
      'admin_list_academy_modules','admin_get_academy_module','admin_upsert_academy_module','admin_delete_academy_module',
      'admin_list_resources','admin_get_resource','admin_update_resource','admin_delete_resource',
      'admin_list_admins','admin_add_admin_by_email','admin_remove_admin')
)
-- 1) all fifteen S11 admin RPCs are present.
select count(*) as admin_rpcs_present from admin_fns;
-- EXPECT: 15

-- 2) every one is SECURITY DEFINER with a pinned search_path.
with admin_fns as (
  select p.oid, p.prosecdef, p.proconfig
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname='public' and p.proname in (
    'admin_list_elements','admin_get_element','admin_upsert_element','admin_delete_element',
    'admin_list_academy_modules','admin_get_academy_module','admin_upsert_academy_module','admin_delete_academy_module',
    'admin_list_resources','admin_get_resource','admin_update_resource','admin_delete_resource',
    'admin_list_admins','admin_add_admin_by_email','admin_remove_admin')
)
select
  bool_and(prosecdef) as all_security_definer,
  bool_and(coalesce(array_to_string(proconfig, ','), '') like '%search_path=%') as all_pinned_search_path
from admin_fns;
-- EXPECT: all_security_definer = true, all_pinned_search_path = true

-- 3) EXECUTE is revoked from anon + public and granted to authenticated only
--    (the real gate is is_admin() inside each function).
with admin_fns as (
  select p.oid
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname='public' and p.proname in (
    'admin_list_elements','admin_get_element','admin_upsert_element','admin_delete_element',
    'admin_list_academy_modules','admin_get_academy_module','admin_upsert_academy_module','admin_delete_academy_module',
    'admin_list_resources','admin_get_resource','admin_update_resource','admin_delete_resource',
    'admin_list_admins','admin_add_admin_by_email','admin_remove_admin')
)
select
  bool_or(has_function_privilege('anon', oid, 'execute'))            as any_anon_exec,
  bool_or(has_function_privilege('public', oid, 'execute'))          as any_public_exec,
  bool_and(has_function_privilege('authenticated', oid, 'execute'))  as all_authenticated_exec
from admin_fns;
-- EXPECT: any_anon_exec = false, any_public_exec = false, all_authenticated_exec = true

-- 4) no admin READ RPC leaks a storage path or any secret column.
select
  bool_or(pg_get_function_result(p.oid) ilike '%storage%') as any_storage_leak,
  bool_or(pg_get_function_result(p.oid) ilike '%password%'
       or pg_get_function_result(p.oid) ilike '%token%')   as any_secret_leak
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public' and p.proname in (
  'admin_list_resources','admin_get_resource','admin_list_elements','admin_get_element',
  'admin_list_academy_modules','admin_get_academy_module','admin_list_admins');
-- EXPECT: any_storage_leak = false, any_secret_leak = false

-- 5) the content tables + admins stay RLS-on with NO client policy (no loosening).
select c.relname, c.relrowsecurity as rls_on,
  (select count(*) from pg_policy p where p.polrelid = c.oid) as client_policies
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname='public' and c.relname in ('admins','elements','academy_modules','resources')
order by c.relname;
-- EXPECT: every rls_on = true; client_policies = 0 for all four.

-- 6) the public/approved read projections are untouched (still hardened).
select
  bool_and(prosecdef) as projections_security_definer,
  bool_and(coalesce(array_to_string(proconfig, ','), '') like '%search_path=%') as projections_pinned
from pg_proc
where pronamespace='public'::regnamespace
  and proname in ('get_elements','get_element','get_academy_modules','get_resources','get_resource_download');
-- EXPECT: both true (5 functions, all SECURITY DEFINER + pinned).

-- 7) admin_remove_admin serializes concurrent removals (lockout race fix) — the
--    last-admin guard reads the count under a SHARE ROW EXCLUSIVE table lock so
--    two admins removing each other at once can't empty the admins table.
select pg_get_functiondef('public.admin_remove_admin(uuid)'::regprocedure)
       ilike '%share row exclusive%' as remove_admin_has_serialization_lock;
-- EXPECT: true
