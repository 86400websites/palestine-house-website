-- 0007_applications_insert_pending_only.up.sql
-- S2 follow-up from the independent code review (blocking finding).
--
-- The 0002 insert policy only checked user_id = auth.uid(), leaving `status`
-- client-settable: an applicant could insert their OWN row with
-- status = 'approved'/'rejected' instead of 'pending'. That does not flip
-- profiles.is_approved (the real gate stays locked), but it breaks the
-- invariant that an application starts pending and only the admin path (S4)
-- changes its status, and could hide a row from the HQ approval queue.
--
-- Tighten the insert policy so a client may only create its own row in the
-- 'pending' state (which is also the column default). status is moved off
-- 'pending' later only by the trusted S4 admin path.

drop policy if exists applications_insert_own on public.applications;

create policy applications_insert_own
  on public.applications
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
  );
