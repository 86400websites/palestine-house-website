-- 0031_programming_sessions_approval.up.sql
-- PP6c review round 3 · 2026-08-16 · SECURITY-CHECKLIST §15 blocking failure
--
-- Closes a hole in the blanket approval gate that has been open since `0013`.
--
-- `programming_sessions_select_own` required OWNERSHIP but not APPROVAL:
--
--     using (created_by = (select auth.uid()))
--
-- Its INSERT and DELETE siblings both carry `is_approved()`, and `0020`/`0021`
-- later gated the published projection and the writes — but nobody went back to
-- the SELECT policy. So a partner who created a session and was subsequently
-- un-approved by HQ could still read that row straight off
-- `/rest/v1/programming_sessions?select=*`, with no RPC in the way.
--
-- CLAUDE.md is unambiguous: the approval gate is blanket, on every
-- user-reachable surface. "The table is retired and empty" is not a defence —
-- PP5 deleted the Live hub UI but the table is still user-reachable through
-- PostgREST, and an unreachable table is not an unprotected one.
--
-- `programming_sessions_update_own` had the same shape in its USING clause. Its
-- WITH CHECK carried `is_approved()`, so an un-approved user could not actually
-- complete an update — but USING decides which rows they may TARGET, and
-- leaving it open is the same class of mistake. Tightened here too.
--
-- ⚠️ NUMBERING. PP7's contraction was scheduled as `0031` and is renumbered to
-- `0032`. This fix jumps the queue because it is a live gating failure and PP7
-- is a later sprint; the contraction drops `programming_sessions`' policies
-- anyway, so this migration is superseded rather than contradicted.
--
-- Swept before writing: every other policy in `public` was checked for the same
-- gap. Three carry neither `is_approved()` nor `is_admin()` and all three are
-- deliberate and documented — `applications_insert_own` and
-- `applications_select_own` (apply IS sign-up: an unapproved user must be able
-- to create and read their own application) and `profiles_select_own`
-- (`/account` is session-gated only, by design). This was the only real one.

begin;

drop policy if exists programming_sessions_select_own on public.programming_sessions;
create policy programming_sessions_select_own
  on public.programming_sessions
  for select
  to authenticated
  using (created_by = (select auth.uid()) and public.is_approved());

drop policy if exists programming_sessions_update_own on public.programming_sessions;
create policy programming_sessions_update_own
  on public.programming_sessions
  for update
  to authenticated
  using (created_by = (select auth.uid()) and public.is_approved())
  with check (created_by = (select auth.uid()) and public.is_approved());

do $check$
declare
  ungated integer;
begin
  select count(*) into ungated
  from pg_policies
  where schemaname = 'public'
    and tablename = 'programming_sessions'
    and (coalesce(qual,'') || coalesce(with_check,'')) not ilike '%is_approved%';

  if ungated <> 0 then
    raise exception '0031: % policy/policies on programming_sessions still lack is_approved()', ungated;
  end if;
  raise notice '0031 OK — all programming_sessions policies require approval';
end
$check$;

commit;
