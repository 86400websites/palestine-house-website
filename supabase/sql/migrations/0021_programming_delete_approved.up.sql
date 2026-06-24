-- 0021_programming_delete_approved.up.sql
-- S9 (9f hardening): make the three programming_sessions write verbs symmetric.
--
-- 0013 gated INSERT and UPDATE on is_approved() but left DELETE ownership-only
-- (created_by = auth.uid(), no approval predicate). Today that is safe — a
-- non-approved user can never own a row, so an ownership-only delete is always a
-- no-op for them. But it is asymmetric: if approval were ever revoked from a
-- partner who had already published, that partner could still DELETE their
-- already-public rows even though publish/edit (RPC + insert/update RLS) would
-- refuse. Align delete with insert/update: approved AND owner. Idempotent
-- (drop-then-create). No data change; the table/RPC/projection are untouched.

drop policy if exists programming_sessions_delete_own on public.programming_sessions;
create policy programming_sessions_delete_own
  on public.programming_sessions
  for delete
  to authenticated
  using (created_by = (select auth.uid()) and public.is_approved());
