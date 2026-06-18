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
| 0008 | `0008_handle_new_user_full_name.up.sql` | S3 (3c): the profile-creation trigger now also copies the applicant's **name** from their sign-up metadata into `profiles.full_name` (trimmed; blank becomes NULL), so the dashboard can greet them by name. The function stays locked down exactly as before. Expand-only — older rows simply keep their NULL name. |
| 0009 | `0009_admin_approval_rpcs.up.sql` | S4 (4a): adds the two **admin-only** approval RPCs — **`admin_list_applications()`** (an admin reads the whole queue) and **`admin_set_application_status()`** (an admin approves or declines an application, flipping that applicant's **`profiles.is_approved`** to match — approved→true, declined→false). Both are hardened exactly like the S2 helpers (admin authorization is checked **inside** the function). Also renames the decline state from the S2 placeholder **`rejected`** to **`declined`** to match the approvals screen — safe because no existing row used `rejected` (both up + down also migrate any stray row between the two values first, so the constraint swap and its rollback can never fail). |
| 0010 | `0010_admin_set_status_profile_guard.up.sql` | S4 follow-up (independent review): hardens **`admin_set_application_status()`** so it **refuses** (and rolls back) if the applicant has no `profiles` row — preventing an application from reading `approved` while the real gate stays locked. A defensive guard for a state the `0001` trigger already prevents; the function stays SECURITY DEFINER + locked down. |
| 0011 | `0011_elements.up.sql` | S5 (5a): creates **`elements`** — one row per topic (A1..J3): focus area, title, one-line, and the per-tab markdown bodies (Overview, Simple Guide, Watch Out For). RLS default-deny with **no client policy** (like `admins`); approved partners read it only through the hardened `get_elements()` / `get_element(slug)` RPCs, each of which checks `is_approved()` **inside** (a pending/anon caller gets zero rows). |
| 0012 | `0012_checklist.up.sql` | S5 (5b): creates **`checklist_items`** (the gated launch-checklist catalog — element-linked, grouped, optional gate) and **`checklist_progress`** (the **only per-user write in the app** — owner-scoped saved progress). Items read via `get_checklist()`; progress is read-own (RLS SELECT) and written only through `set_checklist_progress()`, which forces ownership to `auth.uid()` and locks `status` to the allowed set (the S2 mutable-column lesson). Natural key `(element_id, item_text)` so re-ingestion is an upsert that never changes ids. |
| 0013 | `0013_programming_sessions.up.sql` | S5 (5c): creates **`programming_sessions`** — owner-scoped partner writes (insert/update require approval **and** ownership). The public listing comes ONLY from **`public_programming_sessions()`**, a hardened projection of the anon-safe columns (no `created_by`/PII) — the **only** function in the whole schema granted to `anon`. |
| 0014 | `0014_resources.up.sql` | S5 (5d): creates **`resources`** (metadata for the 267 templates + 2 booklets) read via `get_resources()` (narrow return — no raw storage paths), plus the two Storage buckets: **`resources`** (PRIVATE — the templates) and **`booklets`** (PUBLIC — the two lead-magnet PDFs). No `storage.objects` policy → default-deny; template downloads are server-issued signed URLs (S6e). |
| 0015 | `0015_academy_modules.up.sql` | S5 (5e): creates **`academy_modules`** — one optional video module per topic (1:1 with an element), with a nullable `youtube_url` (null → the "video's coming" empty state) and the script body. Read only via the `is_approved()`-gated `get_academy_modules()` RPC. |
| 0016 | `0016_s5_review_hardening.up.sql` | S5 post-review (independent Codex review of the branch): three hardening fixes — a **new** pair because 0012/0013/0014 are immutable. (1) **`checklist_progress`** owner SELECT policy now also requires `is_approved()` — a user whose approval is revoked can no longer read its saved progress directly (the gate must hold on every gated **read**, not just writes). (2) **`programming_sessions`** DELETE now requires `is_approved()` too (insert/update already did) — a non-approved owner can't delete sessions. (3) defensively re-asserts the Storage bucket flags (`resources` private, `booklets` public), since 0014's `on conflict do nothing` would not correct a pre-existing mis-flagged bucket. |

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
| `0008_verify_PROD_safe_readonly.sql` | **Any DB, incl. production** | **Read-only** check for migration 0008 — confirms the trigger function was redefined to map `full_name`, is still SECURITY DEFINER + locked down, and that the S2 tables/policies did **not** regress. Safe on the live database; run it on both after applying 0008. |
| `0008_verify_TEST_db_only.sql` | **Test DB only** | **Functional** proof for 0008: creates two throwaway users to confirm the trigger copies a trimmed name and turns a blank name into NULL, then **deletes them explicitly** (the Supabase SQL Editor does not reliably honour a hand-written `begin … rollback`, so cleanup is by `delete`, not rollback). Re-runnable and self-cleaning — ends with zero test rows. Test database only. |
| `S4_verify_TEST_db_only.sql` | **Test DB only** | Role-simulated proof for 0009: an admin sees the whole queue and a non-admin sees none; a non-admin cannot flip approval; an invalid status is refused; approve/decline set the status **and** mirror `is_approved`. The mutating checks run in `begin … rollback`; a final idempotent block resets the test applicant to `pending` for the UI test. Uses the GATE 0 seed accounts (admin + a non-admin applicant). Test database only. |
| `S4_verify_PROD_safe_readonly.sql` | **Any DB, incl. production** | **Read-only** check for 0009 — confirms both admin RPCs exist, are SECURITY DEFINER with a pinned `search_path`, that `anon` cannot execute them, the status check is `pending\|approved\|declined`, and `admins` is still RLS-on with no policy. Safe on the live database; run on both after applying 0009. |
| `0010_verify_PROD_safe_readonly.sql` | **Any DB, incl. production** | **Read-only** check for 0010 — confirms `admin_set_application_status()` is still SECURITY DEFINER + pinned `search_path`, was redefined **with** the profile-row guard, and keeps `anon`-revoked / `authenticated`-granted EXECUTE. Safe on the live database; run on both after applying 0010, then re-run the approve/decline sections of `S4_verify_TEST_db_only.sql` on TEST to confirm no regression. |
| `S5_verify_TEST_db_only.sql` | **Test DB only** | Role-simulated proof for the S5 content schema (0011–0015): seeds **one throwaway row per table**, then confirms anon can call **only** `public_programming_sessions()` (every gated RPC denied `42501`), a **pending** user gets zero gated rows and can't write progress, an **approved** user reads all content and writes/reads only its **own** `checklist_progress` (a forged `status` is rejected `22023`; a second approved user can't see or update it), and the private bucket is unreadable. Self-cleaning by explicit `delete` (not rollback — the SQL Editor ignores hand-written `begin…rollback`); ends with the seed removed. Fill in three test UUIDs first. Test database only. |
| `S5_verify_PROD_safe_readonly.sql` | **Any DB, incl. production** | **Read-only** check for 0011–0015: confirms all six tables exist + RLS on, the client-policy counts (0 except `checklist_progress`=1 / `programming_sessions`=4), all seven RPCs are SECURITY DEFINER + pinned `search_path`, `anon` can execute **only** `public_programming_sessions()`, the `resources` bucket is private + `booklets` public, `storage.objects` is RLS-on with no policy, and (after ingestion) the row + storage-object counts match the source (30 / 728 / 30 / 267+2). Safe on the live database; run on both after applying 0011–0015. |

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

- **Migrations** keep a single, ever-increasing number across all sprints. S2 used `0001`–`0007`,
  S3 added `0008`, S4 added `0009`–`0010`, S5 (content schema) added `0011`–`0015` plus `0016`
  (post-review hardening); the next database sprint continues at `0017`. Never reuse or renumber. Once a migration has been applied to production it is **immutable** — a correction
  is a **new** numbered pair, never an edit to the old file (that's exactly why 0005, 0006 and
  0007 exist as their own files rather than edits to 0003/0004/0002).
- **Bundles** and **verification** scripts are prefixed with the sprint (`S2_…`). Each sprint
  adds its own; they don't replace earlier ones.
- So in a fresh session: open this folder, read this README, look at `migrations/` for the full
  schema history in order, and use the `S<n>_…` scripts for the sprint you're verifying.

---

## 7. Current state (S5)

**S5 adds `0011`–`0015`** — the content data layer: `elements` (5a) · `checklist_items` + owner-scoped
`checklist_progress` (5b) · `programming_sessions` with the anon-safe `public_programming_sessions()`
projection (5c) · `resources` metadata + the private `resources` / public `booklets` Storage buckets
(5d) · `academy_modules` (5e). Every table is RLS default-deny and is read only through an
`is_approved()`-gated `SECURITY DEFINER` RPC; the **only** anon-callable function is
`public_programming_sessions()`. Apply `0011`→`0015` in order on the **test** database first, run
`verification/S5_verify_TEST_db_only.sql` (the role matrix — fill in three test UUIDs), then apply on
**production** and run the read-only `verification/S5_verify_PROD_safe_readonly.sql` on both. Applied +
verified on test (`sdszcralogcrujtyghig`) and production (`jwogtqizqujwhbvpoziu`) on 2026-06-18.
**`0016` (post-review hardening, independent Codex review)** gates the `checklist_progress` owner SELECT
and the `programming_sessions` DELETE on `is_approved()` and re-asserts the bucket flags — applied +
verified on **test**; **apply it to production after `0015`** and re-run `S5_verify_PROD_safe_readonly.sql`
(its section 2b shows the policy predicates now include `is_approved()`).

The content itself is loaded by a one-time, idempotent **ingestion script** — `scripts/ingest-content.ts`
(NOT app code) — which parses the `.docx` source under `docs/source-assets/resources/` + the
`docs/page-copy/06-elements/_index.md` map, upserts the rows on content-stable natural keys (so re-runs
never change ids or disturb `checklist_progress`), and uploads the 267 templates + 2 booklets to the
buckets. It is a sanctioned **admin op**: it reads `SUPABASE_INGEST_URL` / `SUPABASE_INGEST_SECRET_KEY`
(or `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SECRET_KEY`) from `.env.local`, **defaults to TEST and refuses
any other project unless `--i-understand-not-test` is passed deliberately** — the app never uses the
secret key. Preview with `pnpm tsx scripts/ingest-content.ts --dry-run`, then run it against TEST; the
human runs it against PROD deliberately. Counts on both DBs: **30 elements · 728 checklist_items · 30
academy_modules · 267 templates + 2 booklets · 267+2 storage objects.**

### Earlier state (S4)

**S4 adds `0009`** — the two admin-only approval RPCs (`admin_list_applications()` +
`admin_set_application_status()`) and the `rejected` → `declined` status rename. Apply it to the
**test** database first; **before applying, confirm the status constraint name** with
`select conname from pg_constraint where conrelid = 'public.applications'::regclass and contype = 'c';`
(expected `applications_status_check`). Then run `verification/S4_verify_TEST_db_only.sql`
(role-simulated; fill in the seed UUIDs), and finally apply to **production** and run
`verification/S4_verify_PROD_safe_readonly.sql`. S4 also wires the app code that uses these RPCs
(the gated workspace shell + pending `/dashboard`, and `/admin/approvals`).

**S4 also adds `0010`** (post-review hardening of `admin_set_application_status` — it now refuses
to half-apply if the applicant has no profile row). Apply it to the **test** database first, run
`verification/0010_verify_PROD_safe_readonly.sql` and re-run the approve/decline sections of
`S4_verify_TEST_db_only.sql` (regression), then apply to **production** and run the read-only check
there. `0009` itself needs **no re-apply** — its up/down only gained no-op `rejected`↔`declined`
guards so the constraint swap and its rollback can never fail; the live DBs already match.

### Earlier state (S3)

Migrations `0001`–`0007` were applied to **both** the test database (`sdszcralogcrujtyghig`)
and production (`jwogtqizqujwhbvpoziu`) in S2, and verified (test: full role matrix; production:
read-only smoke check). Tables: `profiles`, `applications`, `admins`.

**S3 adds `0008`** — the profile-creation trigger now copies the applicant's name from sign-up
metadata into `profiles.full_name`. Apply it to the **test** database first, run
`verification/0008_verify_TEST_db_only.sql` (functional) and
`verification/0008_verify_PROD_safe_readonly.sql` (read-only), then apply to **production** and
run the read-only check there. S3 also wires the application code that uses this schema (Supabase
clients, login/logout, password reset, and the Apply write path); the approval queue
(`/admin/approvals`) and the approval flip arrive in S4.
