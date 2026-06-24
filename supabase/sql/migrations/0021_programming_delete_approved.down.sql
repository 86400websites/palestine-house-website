-- 0021_programming_delete_approved.down.sql — restores 0013's ownership-only delete.

drop policy if exists programming_sessions_delete_own on public.programming_sessions;
create policy programming_sessions_delete_own
  on public.programming_sessions
  for delete
  to authenticated
  using (created_by = (select auth.uid()));
