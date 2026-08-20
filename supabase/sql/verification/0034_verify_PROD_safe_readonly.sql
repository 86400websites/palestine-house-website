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
-- ⚠️ HARDENED AT 8-k. The first version of this check was
--        (et.evtenabled <> 'D')
--    over a bare row select, and an independent review was right that it was
--    weaker than its own headline claimed, in three separate ways:
--
--      ① `<> 'D'` ACCEPTS 'R'. PostgreSQL's evtenabled is O/D/R/A: 'R' fires
--         only in replica mode, so a trigger set to 'R' does NOT fire for
--         ordinary origin DDL — the exact scenario this check exists to catch —
--         and the old predicate passed it.
--      ② A MISSING TRIGGER RETURNED NO ROW AT ALL, not `ok = false`. Drop
--         `ensure_rls` entirely and the check simply printed nothing; an
--         operator scanning for a red `ok` sees none and moves on. It is now an
--         aggregate, so absence yields `count(*) = 0` and fails loudly.
--      ③ It never asserted WHICH trigger. Name, event and command tags are now
--         pinned, so a differently-wired trigger on the same function cannot
--         satisfy it.
select 'ensure_rls event trigger still armed' as check,
       count(*) as matching_triggers,
       coalesce(
         string_agg(et.evtname || ' / ' || et.evtevent || ' / enabled=' || et.evtenabled::text ||
                    ' / tags=' || coalesce(array_to_string(et.evttags, '+'), '(all)'), ', '),
         '*** NO ARMED ensure_rls TRIGGER FOUND ***') as detail,
       (count(*) = 1) as ok
from pg_event_trigger et
join pg_proc p on p.oid = et.evtfoid
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'rls_auto_enable'
  and et.evtname = 'ensure_rls'
  and et.evtevent = 'ddl_command_end'
  and et.evtenabled in ('O', 'A');   -- fires on origin DDL; 'R'/'D' do not

-- 6. And the net still catches: every table in `public` has RLS on. If the
--    trigger had been broken by the revoke, this is where it would show up
--    first — as a new table with RLS off.
--
-- ⚠️ HARDENED AT 8-k: `relkind = 'r'` covers ordinary tables only. A PARTITIONED
--    table is relkind 'p', so an RLS-disabled partitioned table was invisible to
--    this sweep while it still reported "every public table has RLS enabled".
--    `rls_auto_enable()` itself already handles both ('table' and 'partitioned
--    table'), so the verifier was narrower than the thing it verifies.
select 'every public table (incl. partitioned) has RLS enabled' as check,
       count(*) filter (where not c.relrowsecurity) as tables_without_rls,
       coalesce(string_agg(c.relname || ' (' || c.relkind::text || ')', ', ')
                  filter (where not c.relrowsecurity), '(all enabled)') as which,
       (count(*) filter (where not c.relrowsecurity) = 0) as ok
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p');
