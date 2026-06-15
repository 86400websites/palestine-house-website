# Supabase SQL — apply by hand, in order

This folder holds the **versioned SQL** for the Palestine House database. There are no
CLI migrations on this stack — every change is applied **by hand via the Supabase
dashboard → SQL Editor**, in order, one file at a time. This README is the authoritative
apply/rollback runbook.

Read alongside the binding docs (don't restate them — follow them):

- [`../../docs/WORKFLOW.md`](../../docs/WORKFLOW.md) §14 — the database change protocol.
- [`../../docs/TECH-ARCHITECTURE.md`](../../docs/TECH-ARCHITECTURE.md) §7 — Supabase architecture (RLS default-deny, hardened `SECURITY DEFINER` rules).
- [`../../docs/SECURITY-CHECKLIST.md`](../../docs/SECURITY-CHECKLIST.md) §5 (RLS) + §15 (Palestine House blocking invariants).

---

## File naming convention

```
NNNN_<name>.up.sql      forward change (create/alter)
NNNN_<name>.down.sql    exact rollback of the matching up-file
```

- `NNNN` is a zero-padded sequence (`0001`, `0002`, …) that fixes apply order.
- **Every `*.up.sql` has a matching `*.down.sql`.** The down-file reverses only its own up-file.
- Files are **immutable once applied to production.** A correction is a *new* numbered pair, never an edit to an applied file.
- Changes are **expand-only / backwards-compatible**: the currently deployed app code must work both before and after the SQL is applied (expand → migrate → contract).

## Migration index

| Seq | File | Purpose | Sprint / step |
|---|---|---|---|
| 0001 | `0001_profiles` | `profiles` (incl. `is_approved`) + RLS default-deny + own-row read policy + `handle_new_user` trigger | S2 · 2a (step 2) |
| 0002 | `0002_applications` | `applications` (mirrors the Apply form) + RLS default-deny + owner-scoped insert/read-own | S2 · 2a (step 3) |
| 0003 | `0003_admins_helpers` | `admins` + RLS default-deny (no client read) + hardened `is_admin()` / `is_approved()` | S2 · 2a (step 4) |
| 0004 | `0004_profile_read_rpc` | hardened `get_my_profile()` — caller-only approval status / minimal profile | S2 · 2a (step 5) |
| 0005 | `0005_function_execute_hardening` | revoke `EXECUTE` from public **and anon** on all S2 functions (verification fix) | S2 · 2a (step 6) |
| 0006 | `0006_handle_new_user_execute_lockdown` | revoke `EXECUTE` on `handle_new_user` from **authenticated** too (smoke-check fix) | S2 · 2a (step 7) |

> The 0001–0006 set is the S2 schema; this index is updated as each pair lands.

## Apply order (forward)

Run the `*.up.sql` files in **ascending** sequence:

```
0001_profiles.up.sql
0002_applications.up.sql
0003_admins_helpers.up.sql
0004_profile_read_rpc.up.sql
0005_function_execute_hardening.up.sql
0006_handle_new_user_execute_lockdown.up.sql
```

## Rollback order (reverse)

Run the `*.down.sql` files in **descending** sequence (mirror image of apply):

```
0006_handle_new_user_execute_lockdown.down.sql
0005_function_execute_hardening.down.sql
0004_profile_read_rpc.down.sql
0003_admins_helpers.down.sql
0002_applications.down.sql
0001_profiles.down.sql
```

## Consolidated apply (fresh database)

For a clean one-pass apply to a fresh database (e.g. production), run
[`apply_all_s2.sql`](./apply_all_s2.sql) instead of the separate fragments. It is the
**final state** of 0001–0006 (the `0005`/`0006` execute-revokes folded into the function
definitions), so it produces exactly the state verified on non-prod. The numbered
files remain canonical and define the rollback story; the bundle is a convenience
for applying, not a replacement. After it, run
[`verify_s2_prod_smoke.sql`](./verify_s2_prod_smoke.sql) (read-only, seeds nothing).

---

## Golden rules (do not skip)

1. **Non-production first, always.** Apply and verify on the non-production project before
   the production project. Production is applied only after the non-prod verification passes.
2. **RLS default-deny from creation.** Every table enables Row Level Security in the same
   file that creates it, before any data lands. No table is ever default-allow, even briefly.
3. **Hardened `SECURITY DEFINER` only.** Pinned `search_path = ''`, fully-qualified objects,
   authorization via `auth.uid()` (never trust arguments), narrow returns, and
   `revoke execute … from public` then `grant execute … to authenticated` (or the intended role).
4. **No secret-key path.** No application path uses the secret / `service_role` key for normal
   user reads/writes — those go through the user session + RLS, or a granted definer RPC.
5. **A Vercel rollback does NOT roll back the database.** If a bad deploy shipped schema,
   decide explicitly: keep it (only if backwards-compatible) or run the matching `*.down.sql`.
   Prefer forward-fix.

## Apply procedure (Supabase SQL Editor)

For each environment (non-production, then production):

1. Open the Supabase project → **SQL Editor**.
2. Open the next `*.up.sql` file in ascending order, paste its full contents, and run it.
3. Confirm success (no errors) before moving to the next file.
4. After the last file, run the verification below.
5. Record what was applied, when, and to which project in the PR (and in
   [`../../docs/PROJECT-STATUS.md`](../../docs/PROJECT-STATUS.md) at the sprint exit gate).

## Verification (run on non-production before production)

After applying, confirm the access boundary holds (full role-by-role matrix is recorded in
the PR for S2 step 6):

- **anon** (signed-out): reads **zero rows** from every table; default-deny holds.
- **authenticated, non-admin**: reads **only its own** `profiles` / `applications` row;
  cannot read another user's rows and cannot read `admins`.
- **helpers**: `is_approved()` and `is_admin()` return the correct boolean for the caller.
- **denied read**: an attempt to read a table with no matching policy returns no rows / is
  rejected — confirming default-deny rather than an accidental allow.
- **privilege escalation blocked**: a user cannot self-set `is_approved` or insert into `admins`.

A ready-to-run script for the S2 set lives at [`verify_s2_identity_approval.sql`](./verify_s2_identity_approval.sql)
— run it section by section on the non-production project and compare each result to its
inline `EXPECT` comment. It is a **test helper, not a migration**: never part of the apply
sequence, never run on production (it seeds throwaway users + rows).

For **production**, run the read-only [`verify_s2_prod_smoke.sql`](./verify_s2_prod_smoke.sql)
instead — it confirms tables/RLS/functions/policies landed and that `anon` has no `EXECUTE`
on the S2 functions, **without seeding any data or users** into the live database.

## Environments

| Role | Project | Ref |
|---|---|---|
| Production | `palestine-house-website` | `jwogtqizqujwhbvpoziu` |
| Non-production (test) | `palestine-house-test-database` | `sdszcralogcrujtyghig` |

Production, Preview, and Development point at **different** Supabase projects — non-prod
testing never touches the production database.
