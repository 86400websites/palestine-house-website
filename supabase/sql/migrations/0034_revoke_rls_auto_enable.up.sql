-- 0034_revoke_rls_auto_enable.up.sql
-- PP8 (Final verification) · 2026-08-20 · closes PROJECT-STATUS.md §7 issue #2
--
-- `public.rls_auto_enable()` is EXECUTE-able by `anon`. It has been since before
-- Stage 4, was surfaced by the Supabase security advisor during PP6a step 6a-c
-- on TEST *and* PROD, and was deferred twice — PP6a would not do a drive-by on
-- an unrelated function's grants, and PP7's security pass did not reach it. It
-- is the LAST anon-executable SECURITY DEFINER function in `public`; every one
-- of the other 44 is already revoked from `anon`.
--
-- WHAT THE FUNCTION IS (this matters for both halves of the change)
-- -----------------------------------------------------------------
-- It returns `event_trigger` and is wired to the `ensure_rls` event trigger on
-- `ddl_command_end`. On every `CREATE TABLE` in `public` it runs
-- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. It is the safety net behind
-- CLAUDE.md's "RLS default-deny on every user-reachable table from day one" —
-- so the risk in this migration was never the grant, it was breaking the net.
--
-- EXPLOITABILITY: low, and it is a privilege-hygiene defect rather than a data
-- path. The function takes no arguments, returns a pseudo-type that has no
-- output function (nothing can be returned to a caller), reads no application
-- table, and its only action is driven by `pg_event_trigger_ddl_commands()`,
-- which raises `39P03` outside an event-trigger context. An anon caller
-- therefore names no tables and alters nothing. Least privilege still says a
-- role that can never need a function should not hold EXECUTE on it.
--
-- ⚠️ THE ONE-LINE FIX DOES NOT WORK, AND THIS WAS PROVEN, NOT ASSUMED
-- --------------------------------------------------------------------
-- The obvious `revoke execute ... from anon` leaves the privilege in place.
-- Rehearsed on TEST inside an aborting transaction: after that revoke,
-- `has_function_privilege('anon', ...)` was still TRUE and `anon` could still
-- invoke it. The ACL carries TWO grants:
--
--     =X/postgres              <- PUBLIC
--     postgres=X/postgres
--     anon=X/postgres          <- and an explicit one
--     authenticated=X/postgres
--     service_role=X/postgres
--
-- Revoking the explicit `anon` grant leaves the PUBLIC grant, which `anon`
-- inherits. Compare a correctly-locked RPC — `get_platform_topics` is exactly
-- `postgres`, `authenticated`, `service_role`, with no PUBLIC and no anon.
--
-- Had this shipped as the one-liner, the migration would have applied cleanly,
-- reported success, and changed nothing — and the advisor would have kept
-- flagging it.
--
-- `authenticated` is revoked too. The recorded finding names `anon`, but an
-- authenticated partner has no more business calling an event-trigger function
-- than an anonymous one, and it is the same statement.
--
-- `service_role` is KEPT deliberately: it is Supabase's own privileged role,
-- used by platform tooling, and it bypasses RLS regardless — it is not a
-- boundary this migration should move while closing an unrelated finding.

begin;

revoke execute on function public.rls_auto_enable()
  from public, anon, authenticated;

commit;

-- Verify with supabase/sql/verification/0034_verify_PROD_safe_readonly.sql.
-- The check that matters is not the grant — it is that `ensure_rls` still
-- fires. Proven on TEST: after this revoke, a freshly created table still came
-- out with `relrowsecurity = true`.
