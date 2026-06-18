-- 0019_verify_PROD_safe_readonly.sql
-- Read-only structural check for migration 0019 (support requests). Safe on ANY
-- database, including production. Run on TEST and PROD after applying 0019.

-- 1) support_requests exists, RLS on, with NO client policy (default-deny).
select
  (select relrowsecurity from pg_class where oid = 'public.support_requests'::regclass) as rls_enabled, -- true
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'support_requests') as client_policies; -- 0

-- 2) Both RPCs are hardened SECURITY DEFINER (search_path="", anon/public
--    EXECUTE revoked, authenticated granted).
select
  p.proname,                                                        -- submit_support_request | admin_list_support_requests
  p.prosecdef                                       as security_definer, -- true
  p.proconfig                                       as config,           -- {search_path=""}
  has_function_privilege('anon', p.oid, 'execute')  as anon_execute,     -- false
  has_function_privilege('public', p.oid, 'execute') as public_execute,  -- false
  has_function_privilege('authenticated', p.oid, 'execute') as auth_execute -- true
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('submit_support_request', 'admin_list_support_requests')
order by p.proname;
