-- 0007_applications_insert_pending_only.down.sql — reverses 0007.
-- Restores the 0002 insert policy (owner-scoped, without the status guard).

drop policy if exists applications_insert_own on public.applications;

create policy applications_insert_own
  on public.applications
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));
