-- =====================================================================
-- PP8_apply_prod.sql — the ONLY SQL PP8 asks you to run on PRODUCTION
-- =====================================================================
--
-- Project: jwogtqizqujwhbvpoziu (PRODUCTION)
-- Generated from: supabase/sql/migrations/0034_revoke_rls_auto_enable.up.sql
--
-- WHAT IT DOES
--   Revokes EXECUTE on public.rls_auto_enable() from public, anon and
--   authenticated. This closes PROJECT-STATUS §7 issue #2 — the last
--   anon-executable SECURITY DEFINER function in the schema, open since before
--   Stage 4 and flagged by the Supabase security advisor on TEST and PROD.
--
-- WHAT IT DOES NOT DO
--   It touches no table, no row, no policy, no RPC and no partner-visible
--   behaviour. It is one privilege change. Rolling it back is one statement
--   (bottom of this file).
--
-- ⚠️ TWO THINGS WORTH KNOWING BEFORE YOU RUN IT
--
--   1. `revoke ... from anon` ALONE DOES NOTHING HERE. The ACL carries a PUBLIC
--      grant (`=X/postgres`) alongside the explicit anon one, and anon inherits
--      it. Rehearsed on TEST: that shorter statement applied cleanly, reported
--      success, and left the privilege fully intact. Hence `from public, anon,
--      authenticated`.
--
--   2. THE RISK WAS NEVER THE GRANT. rls_auto_enable() returns `event_trigger`
--      and backs the `ensure_rls` trigger, which auto-enables RLS on every new
--      table in `public` — the safety net behind "RLS default-deny from day
--      one". Breaking it would be far worse than the finding it closes. Proven
--      on TEST: after this revoke, a freshly created table still came out with
--      relrowsecurity = true. Check 5 below re-proves it on production.
--
-- HOW TO RUN
--   Supabase SQL Editor → PRODUCTION project → paste this whole file → Run.
--   It prints a 6-row verification table at the end. EVERY `ok` MUST BE true.
--   Then tell Claude, who will re-verify independently through the read-only
--   MCP.
-- =====================================================================


-- ---------------------------------------------------------------- APPLY
begin;

revoke execute on function public.rls_auto_enable()
  from public, anon, authenticated;

commit;


-- --------------------------------------------------------------- VERIFY
-- Read-only. Every `ok` must be true.
select '1 anon cannot execute rls_auto_enable' as check,
       (not has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE')) as ok,
       coalesce(array_to_string(p.proacl, ' | '), '(default)') as detail
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'rls_auto_enable'

union all
select '2 authenticated cannot execute',
       (not has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE')),
       ''

union all
-- The half the one-line fix would have missed.
select '3 no PUBLIC grant remains',
       (coalesce(array_to_string(p.proacl, ' | '), '') not like '=X/%'),
       ''
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'rls_auto_enable'

union all
-- The sweep: NO SECURITY DEFINER function in `public` may be anon-executable.
select '4 no anon-executable SECURITY DEFINER left',
       (count(*) = 0),
       coalesce(string_agg(p.proname, ', ' order by p.proname), '(none)')
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.prosecdef
   and has_function_privilege('anon', p.oid, 'EXECUTE')

union all
-- ⚠️ THE ONE THAT MATTERS. 'O' = enabled, 'D' would mean disabled.
select '5 ensure_rls STILL ARMED  <-- the safety net',
       (et.evtenabled <> 'D'),
       et.evtname || ' / ' || et.evtevent || ' / enabled=' || et.evtenabled::text
  from pg_event_trigger et
  join pg_proc p on p.oid = et.evtfoid
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'rls_auto_enable'

union all
-- If the net had broken, this is where it would surface first.
select '6 every public table has RLS enabled',
       (count(*) filter (where not c.relrowsecurity) = 0),
       coalesce(string_agg(c.relname, ', ') filter (where not c.relrowsecurity), '(all enabled)')
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'

order by 1;

-- Expected `detail` on check 1 afterwards:
--   postgres=X/postgres | service_role=X/postgres


-- =====================================================================
-- ROLLBACK — only if something is wrong. DO NOT run as part of the apply.
-- Restores all THREE original ACL entries, not just PUBLIC: granting only to
-- PUBLIC makes has_function_privilege read true while the explicit rows stay
-- missing, which looks restored and is not.
-- =====================================================================
--
--   begin;
--   grant execute on function public.rls_auto_enable()
--     to public, anon, authenticated;
--   commit;
--
-- =====================================================================
