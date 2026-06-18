-- 0018_verify_PROD_safe_readonly.sql
-- Read-only structural check for migration 0018 (account prefs). Safe on ANY
-- database, including production. Run on TEST and PROD after applying 0018.

-- 1) profiles.marketing_opt_in exists: boolean, NOT NULL, default false.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
  and column_name = 'marketing_opt_in';
-- EXPECT: boolean, NO, false

-- 2) set_my_account is a hardened SECURITY DEFINER write:
--    secdef true, search_path="", VOLATILE, anon/public EXECUTE revoked,
--    authenticated granted.
select
  p.proname,
  p.prosecdef                                            as security_definer, -- true
  p.proconfig                                            as config,           -- {search_path=""}
  p.provolatile                                          as volatility,       -- v
  has_function_privilege('anon', p.oid, 'execute')       as anon_execute,     -- false
  has_function_privilege('public', p.oid, 'execute')     as public_execute,   -- false
  has_function_privilege('authenticated', p.oid, 'execute') as auth_execute    -- true
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'set_my_account';
