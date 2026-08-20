-- 0034_verify_PROD_safe_readonly.sql — PP8
--
-- READ-ONLY. Safe on production, before or after `0034`. Every `ok` must be
-- true AFTER the migration.

-- 1. THE FINDING. `anon` must no longer hold EXECUTE on the event-trigger
--    function. Note this reads has_function_privilege rather than the ACL rows:
--    the ACL carried BOTH an explicit `anon` grant and a PUBLIC grant, and
--    checking only for the absence of the explicit row would pass while `anon`
--    still inherited the privilege through PUBLIC.
select 'anon cannot execute rls_auto_enable' as check,
       has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE') as anon_execute,
       (not has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE')) as ok;

-- 2. Same for `authenticated`, revoked in the same statement.
select 'authenticated cannot execute rls_auto_enable' as check,
       has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE') as auth_execute,
       (not has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE')) as ok;

-- 3. PUBLIC is gone from the ACL. This is the half the one-line fix missed.
select 'no PUBLIC grant remains' as check,
       coalesce(array_to_string(p.proacl, ' | '), '(default)') as acl,
       (coalesce(array_to_string(p.proacl, ' | '), '') not like '=X/%') as ok
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'rls_auto_enable';

-- 4. THE SWEEP, which is the point of this file rather than a bonus: NO
--    SECURITY DEFINER function in `public` is executable by anon. `0034` closes
--    the last one, so the correct answer is now zero and stays zero.
select 'no anon-executable SECURITY DEFINER functions' as check,
       count(*) as remaining,
       coalesce(string_agg(p.proname, ', ' order by p.proname), '(none)') as which,
       (count(*) = 0) as ok
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
  and has_function_privilege('anon', p.oid, 'EXECUTE');

-- 5. ⚠️ THE CHECK THAT ACTUALLY MATTERS. The grant is cosmetic; the safety net
--    is not. `ensure_rls` must still be attached and enabled, or every table
--    created from here on ships without RLS — which would make this migration
--    far worse than the finding it closes.
--
--    ('O' = origin, i.e. enabled. 'D' would mean disabled.)
select 'ensure_rls event trigger still armed' as check,
       et.evtname, et.evtevent, et.evtenabled::text as enabled,
       (et.evtenabled <> 'D') as ok
from pg_event_trigger et
join pg_proc p on p.oid = et.evtfoid
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'rls_auto_enable';

-- 6. And the net still catches: every table in `public` has RLS on. If the
--    trigger had been broken by the revoke, this is where it would show up
--    first — as a new table with RLS off.
select 'every public table has RLS enabled' as check,
       count(*) filter (where not c.relrowsecurity) as tables_without_rls,
       coalesce(string_agg(c.relname, ', ') filter (where not c.relrowsecurity), '(all enabled)') as which,
       (count(*) filter (where not c.relrowsecurity) = 0) as ok
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r';
