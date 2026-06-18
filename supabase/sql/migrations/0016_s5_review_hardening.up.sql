-- 0016_s5_review_hardening.up.sql
-- S5 post-review hardening (independent Codex review of the S5 branch). Three fixes,
-- all corrections to 0012 / 0013 / 0014 — which are immutable once applied to prod, so
-- this is a NEW numbered migration, never an edit to the originals.
--
--   1) checklist_progress is a GATED table, so its owner SELECT policy must also require
--      public.is_approved() — otherwise a user whose approval is later revoked could
--      still read their saved progress directly via the client (the approval gate must
--      hold on every gated READ, not just writes). The write path already gates inside
--      set_checklist_progress(); this brings the read path in line.
--   2) programming_sessions DELETE is a write and must require approval too — insert and
--      update already do (created_by = auth.uid() AND is_approved()); delete was
--      ownership-only, letting a non-approved owner delete sessions. Now gated.
--   3) Defensively re-assert the Storage bucket visibility flags. 0014 created the
--      buckets with `on conflict (id) do nothing`, which would NOT correct a pre-existing
--      mis-flagged bucket. Re-assert: resources stays PRIVATE, booklets stays PUBLIC.
--      Idempotent (no-op when already correct).

-- 1) checklist_progress: gate the owner SELECT on approval
drop policy if exists checklist_progress_select_own on public.checklist_progress;
create policy checklist_progress_select_own
  on public.checklist_progress
  for select
  to authenticated
  using (user_id = (select auth.uid()) and public.is_approved());

-- 2) programming_sessions: DELETE requires approval AND ownership
drop policy if exists programming_sessions_delete_own on public.programming_sessions;
create policy programming_sessions_delete_own
  on public.programming_sessions
  for delete
  to authenticated
  using (created_by = (select auth.uid()) and public.is_approved());

-- 3) re-assert bucket visibility (defensive; idempotent)
update storage.buckets set public = false where id = 'resources' and public is distinct from false;
update storage.buckets set public = true  where id = 'booklets'  and public is distinct from true;
