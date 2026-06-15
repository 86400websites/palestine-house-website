# Database SQL — what it is and how to run it

This folder holds **all the SQL for the Palestine House database**. We do **not** use
automated migration tooling — every change is applied **by hand**, by pasting a file into
the **Supabase dashboard → SQL Editor** and running it. This README is the plain-English
runbook: read it first, and you'll know exactly what every file is, where it runs, and in
what order.

> **New to this in a fresh session?** Read this whole file once. It is written so you don't
> need any memory of earlier sessions to apply or roll back the database safely.

---

## 1. The most important rule: test and production use the SAME migrations

There is **no such thing** as a "test SQL file" and a separate "production SQL file" for the
schema. The **same** migration files are applied to **both** databases — the **test
(non-production) database first**, and then, only once it's verified, the **production
database**. Keeping them identical is the whole safety model: if the two databases ever ran
different SQL, they would drift apart and you'd hit surprise bugs later.

What **does** differ between environments is only the **verification** scripts (the checks you
run *after* applying), because one of them seeds throwaway test data and must never touch
production. Those are clearly labelled `TEST_db_only` vs `PROD_safe_readonly`.

The two databases (refs recorded in [`../../docs/PROJECT-STATUS.md`](../../docs/PROJECT-STATUS.md) §6):

| Role | Project name | Ref |
|---|---|---|
| **Test** (non-production) | `palestine-house-test-database` | `sdszcralogcrujtyghig` |
| **Production** (live) | `palestine-house-website` | `jwogtqizqujwhbvpoziu` |

---

## 2. Folder map

```
supabase/sql/
├── README.md          ← this runbook
├── migrations/        ← the actual schema changes. Apply to TEST first, then PROD,
│                         in number order. The SAME files run on both databases.
├── bundles/           ← optional one-paste "apply everything" scripts for a FRESH database
└── verification/      ← checks you run AFTER applying. Clearly labelled by environment.
```

### `migrations/` — the schema, in order

Each change is a **pair**: an `*.up.sql` (makes the change) and a matching `*.down.sql`
(undoes exactly that change). The four-digit prefix fixes the order.

| # | File (`migrations/…`) | In plain English, this file… |
|---|---|---|
| 0001 | `0001_profiles.up.sql` | Creates the **`profiles`** table — one row per signed-up user, holding the **`is_approved`** approval flag. Turns on Row Level Security so a user can read **only their own** profile, and adds a trigger that automatically creates a profile row whenever a new account is created. `is_approved` can never be set by the user themselves. |
| 0002 | `0002_applications.up.sql` | Creates the **`applications`** table — the partner application someone submits on `/apply` (name, email, city, organisation, why). Row Level Security lets a user **insert and read only their own** application — never anyone else's (and only in the `pending` state; tightened by 0007). |
| 0003 | `0003_admins_helpers.up.sql` | Creates the **`admins`** table (who at HQ is an admin) — locked down so **no app user can read it at all**. Adds two safe helper functions: **`is_admin()`** and **`is_approved()`**, which tell the app whether the current user is an admin / is approved, without exposing the underlying tables. |
| 0004 | `0004_profile_read_rpc.up.sql` | Adds **`get_my_profile()`** — a safe function that returns **only the current user's own** approval status + name. A not-yet-approved user can see their own status and nothing else. |
| 0005 | `0005_function_execute_hardening.up.sql` | Security fix found during testing: signed-out visitors (`anon`) could still *call* the helper functions. This **removes that access** so only signed-in users can call them. |
| 0006 | `0006_handle_new_user_execute_lockdown.up.sql` | Security fix found during the production check: the profile-creation trigger function was still callable by signed-in users (harmless, but unintended). This **locks it down** so no app role can call it directly. |
| 0007 | `0007_applications_insert_pending_only.up.sql` | Security fix found during the independent code review: a user could create their own application **pre-set to `approved`**. This restricts the insert policy so a user can only ever create their application in the **`pending`** state — only the HQ admin path changes status later. |

Every `*.down.sql` reverses **only** its own `*.up.sql`.

### `bundles/` — apply everything at once (fresh database)

| File | In plain English… |
|---|---|
| `S2_apply_all.sql` | Migrations **0001–0007 combined into one script**, already in their final, fixed form. Paste it once into a **fresh** database instead of running the files one by one. It produces exactly the same result as running the migrations in order. |

### `verification/` — checks (run AFTER applying)

| File | Where to run it | In plain English… |
|---|---|---|
| `S2_verify_TEST_db_only.sql` | **Test DB** (intended) | Full security proof, checked from every angle (signed-out sees nothing, a user sees only their own data, no one can self-approve, status can't be forged, etc.). Every check runs inside `begin … rollback`, so it makes **no permanent changes** — but it's still meant for the test database. |
| `S2_verify_PROD_safe_readonly.sql` | **Any DB, incl. production** | **Read-only** check — looks but never writes. Confirms the tables, security, functions, trigger and policies all landed, and that signed-out users can't call the functions. Safe to run on the live database. |

---

## 3. How to apply a change to a database

> **Golden rule: always the test database first, production second** — and never run anything
> on production until the test verification has fully passed.

**Option A — apply the migrations one by one (the normal way):**

1. Open the **test** project in Supabase → **SQL Editor**.
2. Open `migrations/0001_…up.sql`, paste the whole file, **Run**. Confirm no errors.
3. Repeat for each file **in ascending number order** (0001 → 0002 → … → 0007).
4. Run the test verification (`verification/S2_verify_TEST_db_only.sql`) and confirm every
   `EXPECT` matches.
5. Only then repeat steps 1–3 on the **production** project, and finish with the read-only
   `verification/S2_verify_PROD_safe_readonly.sql`.

**Option B — apply the bundle (fresh database, fewer pastes):**

1. On a **fresh** database, paste `bundles/S2_apply_all.sql` once and **Run**.
2. Run the read-only `verification/S2_verify_PROD_safe_readonly.sql` to confirm.

Record what you applied, to which database, and when, in the PR and in
[`../../docs/PROJECT-STATUS.md`](../../docs/PROJECT-STATUS.md).

---

## 4. How to roll a change back

Run the matching `*.down.sql` files **in reverse number order** (newest first):

```
0007_applications_insert_pending_only.down.sql
0006_handle_new_user_execute_lockdown.down.sql
0005_function_execute_hardening.down.sql
0004_profile_read_rpc.down.sql
0003_admins_helpers.down.sql
0002_applications.down.sql
0001_profiles.down.sql
```

**A Vercel (code) rollback does NOT roll back the database.** If a bad deploy shipped a schema
change, decide on purpose: keep it (only if it's backwards-compatible) or run the matching
`*.down.sql`. Prefer fixing forward.

---

## 5. The rules every change follows (don't skip)

1. **Test database first, production second.** Production is touched only after the test
   verification passes.
2. **Row Level Security on, default-deny, from creation.** Every table turns on RLS in the
   same file that creates it, before any data exists. No table is ever wide-open, even briefly.
3. **Safe functions only.** Every `SECURITY DEFINER` function pins `search_path = ''`, uses
   fully-qualified names, decides access from `auth.uid()` (never from arguments it's handed),
   returns only the columns needed, and has `EXECUTE` revoked from `public` + `anon` then
   granted to `authenticated` only (lessons baked in by 0005 and 0006).
4. **Never the secret key for user data.** No part of the app uses the Supabase secret /
   `service_role` key for normal user reads/writes — those go through the user's own session
   under RLS, or one of these granted functions.
5. **Changes are additive / backwards-compatible.** The currently deployed site must work both
   before and after a change (expand → migrate → contract).

These mirror the binding docs — follow them, don't restate them:
[`../../docs/WORKFLOW.md`](../../docs/WORKFLOW.md) §14 (database change protocol),
[`../../docs/TECH-ARCHITECTURE.md`](../../docs/TECH-ARCHITECTURE.md) §7 (Supabase architecture),
[`../../docs/SECURITY-CHECKLIST.md`](../../docs/SECURITY-CHECKLIST.md) §5 + §15 (blocking invariants).

---

## 6. Naming & how future sprints add to this folder

- **Migrations** keep a single, ever-increasing number across all sprints. S2 used `0001`–`0007`;
  the next database sprint (S5, content schema) continues at `0008`, `0009`, … Never reuse or
  renumber. Once a migration has been applied to production it is **immutable** — a correction
  is a **new** numbered pair, never an edit to the old file (that's exactly why 0005, 0006 and
  0007 exist as their own files rather than edits to 0003/0004/0002).
- **Bundles** and **verification** scripts are prefixed with the sprint (`S2_…`). Each sprint
  adds its own; they don't replace earlier ones.
- So in a fresh session: open this folder, read this README, look at `migrations/` for the full
  schema history in order, and use the `S<n>_…` scripts for the sprint you're verifying.

---

## 7. Current state (S2)

Migrations `0001`–`0006` have been applied to **both** the test database (`sdszcralogcrujtyghig`)
and production (`jwogtqizqujwhbvpoziu`), and verified (test: full role matrix; production:
read-only smoke check). **`0007` (from the independent code review) is in the repo and must be
applied to both databases — test first, then production — and re-verified.** Tables: `profiles`,
`applications`, `admins`. No application code reads these yet — the Supabase clients, login, and
the Apply write path arrive in S3; the approval queue (`/admin/approvals`) and the approval flip
arrive in S4.
