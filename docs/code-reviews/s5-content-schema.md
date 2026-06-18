# S5 — content schema + full ingestion: independent (Codex) review brief

Paste the prompt below into Codex (or another independent reviewer) **after** the S5
branch (`claude/sprint-s5-content-schema`) is pushed. It reviews the branch **diff vs
`main`** only. S5 is a §15-critical sprint — RLS on five new tables, hardened
`SECURITY DEFINER` RPCs, one anon-callable projection, a private Storage bucket, and a
**secret-key ingestion path** — so the review is scoped to data-safety, not style.

## What S5 shipped (context for the reviewer)
- Migrations `0011`–`0015` (each with a matching `.down.sql`): `elements`,
  `checklist_items` + owner-scoped `checklist_progress`, `programming_sessions`,
  `resources` + the private `resources` / public `booklets` Storage buckets,
  `academy_modules`. Applied + verified on test (`sdszcralogcrujtyghig`) and prod
  (`jwogtqizqujwhbvpoziu`).
- `scripts/ingest-content.ts` — a one-time, idempotent **admin op** (NOT app code) that
  parses the `.docx` source + page-copy index and upserts rows + uploads files using the
  Supabase **secret** key from `.env.local`. devDeps `mammoth` + `tsx` (script-only).
- `supabase/sql/verification/S5_verify_TEST_db_only.sql` (role matrix) +
  `S5_verify_PROD_safe_readonly.sql` (read-only).

## Codex prompt

```text
You are my independent code reviewer for the Palestine House website.
Read AGENTS.md in the repo root — it defines your rules, priorities, and the blocking
gating checks. Review the branch DIFF only (claude/sprint-s5-content-schema vs main),
not the whole repo. This is a database + content-ingestion sprint (no UI).

Report SERIOUS issues only: correctness, security, data-safety. Specifically check, with
exact file:line and a suggested fix for each:

DATABASE (migrations 0011–0015, up + .down):
- RLS is ENABLED with default-deny on every one of the five new tables from creation;
  no table is left wide-open even briefly. checklist_items / elements / resources /
  academy_modules have NO client policy (read only via RPC); checklist_progress has a
  single owner SELECT policy; programming_sessions has only owner-scoped policies.
- Every SECURITY DEFINER function is hardened: language sql/plpgsql, security definer,
  `set search_path = ''`, fully-qualified object names, authorization derived from
  auth.uid()/public.is_approved() INSIDE the function (never from arguments), narrow
  return columns, and EXECUTE revoked from public + anon then granted to authenticated
  (anon granted ONLY on public_programming_sessions()).
- The approval gate: every gated read RPC (get_elements, get_element, get_checklist,
  get_resources, get_academy_modules) returns ZERO rows to a pending/anon caller.
- The ONLY anon-callable function is public_programming_sessions(), and it leaks no PII —
  no created_by, no internal timestamps; confirm the projection columns.
- checklist_progress is owner-scoped AND status-locked: set_checklist_progress() forces
  user_id = auth.uid() and validates status against the allowed set before writing; a
  caller cannot write another user's row or forge an out-of-set status. There is no
  client INSERT/UPDATE/DELETE policy on checklist_progress.
- programming_sessions writes require created_by = auth.uid() AND is_approved().
- Storage: the `resources` bucket is private (public=false); there is no storage.objects
  policy granting anon/pending/authenticated read of it (downloads are server-issued
  signed URLs, out of scope here). `booklets` is the only public bucket.
- Every up-migration has a matching .down.sql that reverses exactly itself; changes are
  expand-only / backwards-compatible (the deployed site works before and after).

INGESTION SCRIPT (scripts/ingest-content.ts):
- No app/runtime code path uses the Supabase secret / service_role key — only this
  one-time local script does. Confirm nothing under src/ imports it or reads
  SUPABASE_SECRET_KEY / SUPABASE_INGEST_SECRET_KEY.
- The script never hardcodes a secret; it reads creds from .env.local (gitignored) and
  fails closed if they are missing. No secret appears in the script, its output, or the diff.
- The TEST-default guard actually prevents accidental prod writes: it refuses any host
  that is not the test ref unless --i-understand-not-test is passed; verify the check
  can't be bypassed by a mis-set env.
- Idempotency is real: re-running upserts on the stated natural keys and does not
  duplicate rows or change element ids (which would orphan checklist_progress).

GENERAL:
- No secret/token/service_role key is committed anywhere in the diff (incl. the verify
  SQL + any sample output). .env.local is not tracked.
- Build safety: the new devDeps (mammoth, tsx) are devDependencies only and not pulled
  into the app bundle.

Any failure of the AGENTS.md "Palestine House gating checks" is BLOCKING. No style nits;
do not critique approved copy or the locked design.

Return: Blocking issues · Non-blocking issues · Missing checks · exact file:line · a
suggested fix for each · merge recommendation (approve / request changes / blocking).
Do not make changes, push, or merge.
```
