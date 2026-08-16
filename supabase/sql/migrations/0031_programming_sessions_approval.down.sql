-- 0031_programming_sessions_approval.down.sql
--
-- Restores the policies exactly as `0013_programming_sessions.up.sql` created
-- them — i.e. it REOPENS the approval hole this migration closed.
--
-- ⚠️ Only run this to unwind a bad deploy. Rolling it back returns
-- `programming_sessions` to a state where an un-approved user can read their own
-- row directly through PostgREST, which is a SECURITY-CHECKLIST §15 failure. If
-- the problem is something else, fix forward instead.

begin;

drop policy if exists programming_sessions_select_own on public.programming_sessions;
create policy programming_sessions_select_own
  on public.programming_sessions
  for select
  to authenticated
  using (created_by = (select auth.uid()));

drop policy if exists programming_sessions_update_own on public.programming_sessions;
create policy programming_sessions_update_own
  on public.programming_sessions
  for update
  to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()) and public.is_approved());

commit;
