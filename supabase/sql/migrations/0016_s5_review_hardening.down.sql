-- 0016_s5_review_hardening.down.sql — reverses 0016, restoring the original 0012/0013
-- policies (ownership-only). The bucket-flag re-assert (fix 3) sets the same values
-- 0014 intended, so it has no meaningful reverse — nothing is undone there.

drop policy if exists checklist_progress_select_own on public.checklist_progress;
create policy checklist_progress_select_own
  on public.checklist_progress
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists programming_sessions_delete_own on public.programming_sessions;
create policy programming_sessions_delete_own
  on public.programming_sessions
  for delete
  to authenticated
  using (created_by = (select auth.uid()));
