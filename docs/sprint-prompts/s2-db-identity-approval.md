# Sprint S2 — Database phase 1: identity & approval

| | |
|---|---|
| **Date merged** | 2026-06-15 — build complete + applied + verified; **PR open, merge pending** (owner merges) |
| **Branch / PR** | `claude/sprint-s2-db-identity-approval` / open PR (no `gh` on the owner's machine — PR opened from the push link) |
| **Goal** | Ship the identity + approval data layer as reviewable, reversible SQL: `profiles` (incl. `is_approved`), `applications`, `admins` + RLS default-deny + hardened `SECURITY DEFINER` helpers/RPCs + a new-user trigger. No app code. Apply to non-prod first, verify, then prod. |

## What shipped

First database sprint. SQL only — no application/TypeScript code (Supabase clients/middleware/login = S3; Apply write path = S3c; approval flip + `/admin/approvals` = S4).

- **`supabase/sql/migrations/` — 7 reversible migration pairs (each `*.up.sql` + `*.down.sql`):**
  - `0001_profiles` — `profiles(id→auth.users, is_approved bool default false, full_name, timestamps)`; RLS default-deny; `profiles_select_own` (own row only); `is_approved` not user-writable (no write policy); `handle_new_user()` trigger (SECURITY DEFINER) auto-creates a profile on `auth.users` insert.
  - `0002_applications` — mirrors the live Apply form (`name, email, city, organisation?, why`) + `user_id`, `status` (check `pending|approved|rejected`), `created_at`; RLS default-deny; owner-scoped insert + read-own; `user_id` index.
  - `0003_admins_helpers` — `admins(user_id)` RLS default-deny **with no client policy** (never client-readable); hardened `is_admin()` + `is_approved()`.
  - `0004_profile_read_rpc` — hardened `get_my_profile()` returning the caller's own `(id, is_approved, full_name)` only.
  - `0005_function_execute_hardening` — revoke `EXECUTE` from `public` **and `anon`** on all functions (verification finding).
  - `0006_handle_new_user_execute_lockdown` — revoke `EXECUTE` from `authenticated` on the trigger fn (prod smoke finding).
  - `0007_applications_insert_pending_only` — insert policy `with check (user_id = auth.uid() AND status = 'pending')` so an applicant can't pre-set `status='approved'` (independent-review finding).
- **`supabase/sql/bundles/S2_apply_all.sql`** — consolidated final-state apply for a fresh database (used for production); equals running 0001–0007 in order.
- **`supabase/sql/verification/`** — `S2_verify_TEST_db_only.sql` (full role-simulated matrix; every section in `begin…rollback`, no persistent writes) and `S2_verify_PROD_safe_readonly.sql` (read-only; `has_function_privilege()` + full policy definitions).
- **`supabase/sql/README.md`** — plain-English runbook (the same migrations apply to both DBs, test first; only verification differs by environment; per-file table; apply/rollback steps; how future sprints extend the folder).
- **Applied + verified on both databases:** non-prod `sdszcralogcrujtyghig` (full role matrix) and prod `jwogtqizqujwhbvpoziu` (read-only smoke). Hardening fixes 0005/0006/0007 all applied to both and re-verified.

## Prompt used

<details><summary>Exact implementation prompt (gated master prompt, GATE 0 + 7 sub-steps)</summary>

```text
You are my senior engineer for the Palestine House website, working in Claude Code.

Session start: read docs/PROJECT-STATUS.md §1–§2, then the S2 scope + exit gate in docs/ROADMAP.md (Stage 2). CLAUDE.md governs everything below. This is the first sprint that touches the database — docs/WORKFLOW.md §14 (database change protocol) and docs/SECURITY-CHECKLIST.md §5 + §15 are binding, not optional.

Sprint: S2 — Database phase 1: identity & approval (2a–2b)
Branch: claude/sprint-s2-db-identity-approval (create from latest main)

Goal:
Ship the identity + approval data layer as reviewable SQL in the repo: profiles (incl. is_approved), applications, and admins tables, each with RLS default-deny and minimal owner-scoped policies; hardened SECURITY DEFINER helpers/RPCs (is_approved(), is_admin(), own-profile/approval-status read); and a trigger that creates a profile row when an auth user is created. Plus the supabase/sql/ scaffold + README documenting the by-hand SQL Editor apply/rollback order. NO application/auth code this sprint (Supabase clients, middleware, login = S3; the Apply write path + approval-flip RPC = S3c/S4). Expand-only / backwards-compatible so current live code keeps working before and after. Exit: versioned up + matching .down.sql + RLS policies in the PR, applied and verified on the non-production project first (anon vs authed vs admin), then prod.

GATE 0 — OWNER ACTION FIRST (do not start step 1 until I confirm):
I will create the non-production Supabase project in a separate free org and give you its ref + URL (names only, never keys). Schema work begins only after I confirm it exists. If I say "proceed" before that, ask me for the non-prod ref.

Execute in gated sub-steps (one owner gate after each):
1. (2a) Scaffold supabase/sql/ with a README.md: numbered up-file + matching .down.sql convention, the exact by-hand SQL Editor apply order and reverse rollback order, the non-prod-first rule, and the anon/authed/admin verification step. No SQL applied yet — this step only sets up the structure and the process doc.
2. (2a) profiles table: id (= auth.users uid), is_approved boolean not null default false, minimal identity columns, timestamps. RLS ENABLE + default-deny; one owner-scoped policy so a session reads only its own row. Add the handle_new_user trigger/function that inserts a profile row on auth.users insert (SECURITY DEFINER, pinned search_path). Ship up + .down.sql + policies.
3. (2a) applications table: columns mirror the live form in src/components/sections/apply-form.tsx (name, email, city, organisation [optional], why), plus owner link (user id), status/created_at. RLS ENABLE + default-deny; owner-scoped insert + read-own only (no cross-user read). Ship up + .down.sql + policies. Do NOT build the submit path or an apply RPC — that's S3c.
4. (2a) admins table + helpers: admins keyed by user id, RLS ENABLE + default-deny (no public/self read). Add hardened SECURITY DEFINER helpers is_approved() and is_admin(): set search_path = '', fully-qualified objects, authorize via auth.uid() (never trust arguments), narrow boolean return, revoke execute from public then grant execute to authenticated only. Ship up + .down.sql.
5. (2a) Own-profile/approval-status read RPC (hardened SECURITY DEFINER, same hardening rules): returns ONLY the caller's own approval status / minimal profile fields — a pending session resolves its own status and nothing else. Ship up + .down.sql + grants.
6. (2b) Non-prod apply + verification: give me the precise, ordered SQL-Editor apply steps for the non-prod project, and a role-based test matrix I run there — anon sees zero rows; an authed non-admin sees only its own profile/application and cannot read others or admins; is_approved()/is_admin() return correctly; default-deny confirmed by attempting a denied read. I apply it (you cannot reach the Supabase dashboard); you record the results in the PR and supabase/sql/README.md.
7. (2b → sprint exit gate) After non-prod passes, give me the prod apply order; I apply to prod. Then full-diff self-review of every .sql file against SECURITY-CHECKLIST §5 + §15, fix anything found, and update docs/PROJECT-STATUS.md (§1, §2 board → S2 ✅, §6 non-prod ref, change log) + tick S2 in docs/ROADMAP.md.

Per-step protocol (every sub-step): read the locked input first; smallest safe change; every up-file has a matching .down.sql; RLS enabled + default-deny in the same file the table is created; verify pnpm run typecheck && lint && build still pass; self-review vs SECURITY-CHECKLIST §5/§15; commit AND push every sub-step; report in ≤6 lines then STOP and WAIT for "proceed".

Locked inputs: TECH-ARCHITECTURE §0/§7; WORKFLOW §14; SECURITY-CHECKLIST §3/§4/§5/§15; applications columns from src/components/sections/apply-form.tsx. No copy, no design, no proof numbers.

Sprint-specific DB rules: RLS ENABLE + default-deny on all three tables from creation; every SECURITY DEFINER fn hardened (search_path='', fully-qualified, auth.uid() authz, narrow returns, revoke from public then grant authenticated); no secret/service_role path; a pending session resolves only its own status; expand-only.

Verification before reporting done: pnpm run typecheck && lint && build; git status (.env.local untracked, no secrets); every up has a matching down; RLS default-deny on every table; every definer fn hardened; non-prod matrix passed before any prod apply.

Push policy: commit + push after every gated sub-step (standing authorization) so the owner reviews in the open PR; never merge, never push beyond the task branch.
```

</details>

## Checks & results

typecheck ✅ · lint ✅ · build ✅ (21/21 routes) — after every sub-step. Non-prod role matrix ✅ (anon→0/denied; authed sees only own; admins unreadable; helpers correct; self-approve/self-admin blocked; approval flips). Prod read-only smoke ✅ (tables/RLS/functions/trigger/policies; `anon` has no EXECUTE). Independent Codex review ✅ — 1 blocking + 3 non-blocking findings, all fixed and re-verified. No secrets in the diff.

## Deviations & learnings

- **Supabase default privileges grant `EXECUTE` on new public functions to `anon` AND `authenticated`** (and broad table privileges) — so the documented "`revoke … from public`" alone is **insufficient**. Verification caught `anon` still able to call `is_admin()` (→ `0005`); the prod smoke caught `authenticated` still able to call the trigger fn (→ `0006`). Always `revoke … from public, anon` on RPCs, and from `authenticated` too on trigger functions.
- **RLS ownership is not enough for mutable status columns.** The independent review found applicants could insert their own `applications` row pre-set to `status='approved'` (didn't breach `profiles.is_approved`, but corrupts the pending→admin workflow). Fix: constrain the column in the insert `with check` (`status = 'pending'`), not just `user_id` ownership (→ `0007`). Lesson for S5: lock mutable columns in policies, not only ownership.
- **Verification scripts must not persist data.** First test script did persistent seeds/flips; rewritten so every section runs in `begin…rollback`. And **`has_function_privilege()` is the correct ACL check** — a `pg_proc.proacl → pg_roles` join silently drops PUBLIC (grantee OID 0) and can miss a PUBLIC grant.
- **Mid-sprint reorganization (owner request):** SQL moved into `migrations/` · `bundles/` · `verification/` with a plain-English README; the same migrations apply to BOTH databases (test first) — only verification differs by environment. A consolidated `bundles/S2_apply_all.sql` was added for a clean one-paste prod apply.
- **Owner applies all SQL by hand** via the Supabase SQL Editor (this stack has no CLI migrations; the engine can't reach the dashboard). Two test users are created via the Dashboard for the role-simulation checks. `gh` CLI absent — PR opened from the push link.
- **PowerShell 5.1:** double quotes inside `git commit -m` here-strings break native arg passing (one commit failed mid-sprint and was redone without quotes).
- Non-prod project created in a **separate free Supabase org** (`palestine-house-test-database`, ref `sdszcralogcrujtyghig`); free orgs cap at 2 active projects (pause to stay under). Preview/Dev Vercel env vars point here; Preview `NEXT_PUBLIC_SITE_URL` left unset; production trailing-slash advice given.

## Follow-ups

- **Owner: merge the open PR** after Preview review (Preview shows only the unchanged site — S2 is SQL only). Then `0001`–`0007` are on `main`.
- Test DB: the two Dashboard test users can be deleted; the verification script otherwise persists nothing.
- **Next: S3 — Auth complete** (`@supabase/ssr` browser+server clients, `middleware.ts`, login; Apply live = sign-up in 3c). Env vars for Preview/Dev already point at the test project.
- Idea raised at close: a `/close` skill (end-of-sprint verification + handoff routine) — pending owner decision.
