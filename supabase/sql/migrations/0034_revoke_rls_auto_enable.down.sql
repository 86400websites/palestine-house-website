-- 0034_revoke_rls_auto_enable.down.sql
--
-- Restores the ACL exactly as it stood before `0034` — i.e. it REOPENS the
-- advisor finding this migration closed (PROJECT-STATUS.md §7 issue #2).
--
-- All three entries are restored, not just PUBLIC: the original ACL carried
--
--     =X/postgres              (PUBLIC)
--     anon=X/postgres
--     authenticated=X/postgres
--
-- and granting only to PUBLIC would leave `has_function_privilege` reporting
-- true while the explicit rows stayed missing — a state that reads as restored
-- and is not.
--
-- ⚠️ Only run this to unwind a bad deploy. There is no known behaviour that
-- depends on `anon` or `authenticated` holding EXECUTE here: the function can
-- only do its work from the `ensure_rls` event trigger, which runs as its
-- owner and was proven on TEST to keep firing after the revoke. If something
-- else broke, fix forward instead of restoring a grant nothing needs.

begin;

grant execute on function public.rls_auto_enable()
  to public, anon, authenticated;

commit;
