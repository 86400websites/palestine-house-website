-- 0031_verify_PROD_safe_readonly.sql — PP6c review round 3
--
-- READ-ONLY. Safe on production, before or after `0031`. Every `ok` must be true
-- AFTER the migration.
--
-- `0031` closes a blanket-approval-gate hole open since `0013`:
-- `programming_sessions_select_own` required ownership but not `is_approved()`,
-- so a partner un-approved by HQ could still read their own row straight off
-- PostgREST. SECURITY-CHECKLIST §15 treats that as blocking.

-- 1. THE FIX. Every policy on the table must require approval.
--
-- ⚠️ AMENDED BY PP8 (2026-08-20). As originally written this check required
-- `count(*) > 0` — policies must EXIST and all must be gated. `0033` then
-- dropped all four `programming_sessions` policies, leaving the table
-- RLS-enabled with NO policies at all, which is default-deny and strictly
-- STRONGER than any set of gated policies. The check therefore returned
-- `ok = false` for the safest state the table has ever been in.
--
-- That is not a harmless stale check. Run as-is after `0033` it puts a red line
-- in front of an operator who is mid-migration, and the lesson they take from
-- it is that a red line in this file is normal — which is exactly how a real
-- one gets waved through later.
--
-- Both end states are now accepted, and only those two:
--   (a) policies exist and EVERY one requires approval   — pre-`0033`
--   (b) zero policies, with RLS enabled (check 3 proves the RLS half)
-- A table with SOME ungated policy still fails, which is the point.
select 'all programming_sessions policies require approval (or none, post-0033)' as check,
       count(*)                                                          as policies,
       count(*) filter (where predicate ilike '%is_approved%')           as gated,
       (count(*) = count(*) filter (where predicate ilike '%is_approved%')) as ok
from (
  select coalesce(qual,'') || ' ' || coalesce(with_check,'') as predicate
  from pg_policies
  where schemaname = 'public' and tablename = 'programming_sessions'
) p;

-- 2. Ownership is still required too — approval alone would let ANY approved
--    partner read EVERY session. Both halves, or the fix has made it worse.
select 'ownership still required' as check,
       count(*) as policies_missing_ownership,
       (count(*) = 0) as ok
from pg_policies
where schemaname = 'public' and tablename = 'programming_sessions'
  and (coalesce(qual,'') || ' ' || coalesce(with_check,'')) not ilike '%auth.uid()%';

-- 3. RLS is actually enabled. A perfect set of policies on a table with RLS off
--    is decoration.
select 'RLS enabled' as check,
       relrowsecurity as rls_enabled,
       relforcerowsecurity as rls_forced,
       (relrowsecurity) as ok
from pg_class where oid = 'public.programming_sessions'::regclass;

-- 4. THE WIDER SWEEP, which is the point of this file rather than a bonus.
--    Any policy in `public` carrying neither `is_approved()` nor `is_admin()`.
--    Exactly three are expected, and all three are deliberate:
--      applications_insert_own  — apply IS sign-up; an unapproved user must insert
--      applications_select_own  — a pending user must see their own status
--      profiles_select_own      — /account is session-gated only, by design
--    A FOURTH ROW HERE IS A REGRESSION. Note the coalesce: `false OR NULL` is
--    NULL in SQL, so the naive version of this query silently returns nothing —
--    which is exactly how this class of hole stays hidden.
select 'ungated policies are only the 3 documented ones' as check,
       count(*) as ungated,
       string_agg(tablename || '.' || policyname, ', ' order by tablename, policyname) as which,
       (count(*) = 3
        and bool_and((tablename, policyname) in (
              ('applications','applications_insert_own'),
              ('applications','applications_select_own'),
              ('profiles','profiles_select_own')))) as ok
from pg_policies
where schemaname = 'public'
  and (coalesce(qual,'') || coalesce(with_check,'')) not ilike '%is_approved%'
  and (coalesce(qual,'') || coalesce(with_check,'')) not ilike '%is_admin%';

-- 5. Every user-reachable table in `public` has RLS on. Default-deny from day
--    one is the standing rule (CLAUDE.md); this catches a new table shipped
--    without it.
select 'every public table has RLS enabled' as check,
       count(*) filter (where not c.relrowsecurity) as tables_without_rls,
       string_agg(c.relname, ', ') filter (where not c.relrowsecurity) as which,
       (count(*) filter (where not c.relrowsecurity) = 0) as ok
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r';
