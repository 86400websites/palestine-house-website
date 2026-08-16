-- 0032_transactional_cutover.down.sql
-- Reverses 0032 by dropping the RPC it added.
--
-- SAFE. 0032 is purely additive: it creates one function and changes no table,
-- column, policy or row. Dropping it removes the atomic cutover path and returns
-- `scripts/cutover.ts` to needing the per-row `admin_set_platform_topic_published`
-- loop — which is the behaviour PP7 replaced, so do not run this without knowing
-- that the 22-separate-calls failure mode comes back with it:
-- a failure partway through leaves half the platform Live and half Draft.
--
-- No content is affected either way. Publication state is untouched by this file.

begin;

drop function if exists public.admin_cutover_focus_areas(jsonb, boolean);

commit;

-- Verify:
--   select count(*) from pg_proc where proname = 'admin_cutover_focus_areas';  -- 0
