# Sprint S5 — Database phase 2: content schema + full ingestion

| | |
|---|---|
| **Date merged** | 2026-06-18 |
| **Branch / PR** | `claude/sprint-s5-content-schema` / #23 (merge `20ea7c6`) |
| **Goal** | Ship the content data layer as reviewable, reversible SQL (`0011`–`0015`) — five RLS-default-deny tables with hardened `SECURITY DEFINER` RPCs — plus a one-time idempotent script that ingests the full existing content into the DB + private Storage. Apply + verify on test, then prod. No UI (that's S6). |

## What shipped

**Migrations** (each with a matching `.down.sql`), applied + verified on **test** (`sdszcralogcrujtyghig`) then **prod** (`jwogtqizqujwhbvpoziu`):
- `0011_elements` — 30 topic rows (slug `a1..j3`, focus-area code/name, title, one_line, per-tab markdown bodies). RLS default-deny, **no client policy**; read only via `is_approved()`-gated `get_elements()` / `get_element(slug)`.
- `0012_checklist` — `checklist_items` catalog + owner-scoped `checklist_progress` (the only per-user write). Items via `get_checklist()`; writes via `set_checklist_progress()` (forces `auth.uid()`, locks `status`). Natural key `(element_id, item_text)` for re-ingest-safe upserts.
- `0013_programming_sessions` — owner-scoped partner writes + the anon-safe `public_programming_sessions()` projection (the **only** anon-callable function; no `created_by`/PII).
- `0014_resources` — metadata + the **private** `resources` and **public** `booklets` Storage buckets; read via `get_resources()` (no raw storage paths).
- `0015_academy_modules` — one module per topic (1:1), nullable `youtube_url` (→ empty state), read via `get_academy_modules()`.
- `0016_s5_review_hardening` — post-Codex: gates `checklist_progress` SELECT + `programming_sessions` DELETE on `is_approved()`; defensively re-asserts the bucket visibility flags.

**Ingestion** — `scripts/ingest-content.ts` (one-time idempotent admin op; script-only devDeps `mammoth` + `tsx`). Parses the `.docx` source under `docs/source-assets/resources/` + the page-copy `06-elements/_index.md` map (normalized title→code matching; HTML-table checklist parser; suffix-glob for inconsistent filenames; `one_line` from each topic's page-copy `.md`), upserts on content-stable natural keys, and uploads the 267 templates + 2 booklets to the buckets. Reads creds from `.env.local`; defaults to TEST and **refuses any other project without `--i-understand-not-test`**. Ran on **both** DBs: **30 elements · 728 checklist_items · 30 academy_modules · 267 templates + 2 booklets · 267+2 storage objects.**

**Verification artifacts** — `supabase/sql/verification/S5_verify_TEST_db_only.sql` (seeded, role-simulated matrix, self-cleaning) + `S5_verify_PROD_safe_readonly.sql` (read-only). Independent-review brief `docs/code-reviews/s5-content-schema.md`. README + PROJECT-STATUS updated.

## Prompt used

<details><summary>Exact implementation prompt (executed in gated sub-steps)</summary>

```text
You are my senior engineer for the Palestine House website, working in Claude Code.

Session start: read docs/PROJECT-STATUS.md §1–§2, then the S5 scope + exit gate in docs/ROADMAP.md (Stage 2). CLAUDE.md governs everything below. This is a database + content-ingestion sprint — docs/WORKFLOW.md §14 (database change protocol), docs/SECURITY-CHECKLIST.md §5 + §15, docs/TECH-ARCHITECTURE.md §0/§7, and supabase/sql/README.md are binding, not optional.

Sprint: S5 — Database phase 2: content schema + full ingestion (5a–5e)
Branch: claude/sprint-s5-content-schema (create from latest main)

Goal:
Ship the content data layer as reviewable, reversible SQL (continuing the by-hand migrations at 0011) — elements, checklist_items + per-user checklist_progress, programming_sessions, resources (+ private Storage bucket), academy_modules — each with RLS default-deny and hardened SECURITY DEFINER RPCs (approval checked INSIDE every gated read; owner-scoped writes; one anon-safe public projection for programming_sessions). PLUS a one-time, idempotent ingestion script that loads the FULL existing content into the DB and the private bucket so the owner never hand-uploads. No workspace/admin pages this sprint (that's S6); no signed-URL download route (S6e); no /live wiring (S7). Expand-only / backwards-compatible. Exit: every up has a matching .down.sql, RLS default-deny on every table, every definer fn hardened; applied + verified on the non-production DB first (anon vs pending vs approved), then prod.

OWNER SETUP (before the ingestion step, step 6): I will put SUPABASE_SECRET_KEY (the sb_secret_… key) for the TEST project in .env.local so the ingestion script can run as an admin op. It is server-only, gitignored, never committed, and the APP never uses it — only this one-time local script does (the sanctioned admin-op use per TECH-ARCHITECTURE §7). For PROD ingestion (step 7) I decide when, and may run it myself.

Execute in gated sub-steps (one owner gate after each):
1. (5a) elements: table with slug a1..j3, code (A1..J3), focus_area code+name, one_line, and per-tab markdown body columns (overview_md, simple_guide_md, watch_out_for_md nullable → empty state), sort_order, timestamps. RLS ENABLE + default-deny. Hardened approved-only read RPC(s) (get_element(slug) / get_elements()) that check public.is_approved() INSIDE — a pending/anon caller gets nothing. Ship 0011 up + .down.sql + grants. No ingestion yet.
2. (5b) checklist: checklist_items (element_id fk, focus_area code, group_label, gate int null [1|2|3], item_text, sort_order) + checklist_progress (user_id, checklist_item_id, status check (not_started|in_progress|complete|blocked) default not_started, blocked_note null, updated_at, unique(user_id,checklist_item_id)). RLS: items approved-read only; progress OWNER-SCOPED (the only per-user write in the whole app). RPCs: approved read of items, read-own progress, and an upsert that LOCKS status to the allowed set and the row to auth.uid() (S2 lesson — constrain the mutable column, not just ownership). Ship 0012 up + .down.sql + grants.
3. (5c) programming_sessions: title, summary, mode, status (scheduled|live|past), venue null, stream_url null, recording_url null, starts_at, cover_path null, created_by (= auth.uid()), timestamps. RLS: owner-scoped partner writes (approved + created_by = auth.uid()). Hardened ANON-SAFE public read RPC (public_programming_sessions()) returning ONLY title/summary/mode/status/venue/stream_url/recording_url/starts_at/cover — never created_by or any PII — granted to anon + authenticated (the ONLY anon-callable function; harden it with extra care). Ship 0013 up + .down.sql + grants. Seed handling deferred to ingestion.
4. (5d) resources + Storage: resources table (title, type [form|script|log|report|approval|guide|booklet], focus_area code null, element_id null, version default 'v1', storage_bucket, storage_path, is_public default false, sort_order, created_at). RLS ENABLE + default-deny; approved-only metadata read RPC. Define the PRIVATE Storage bucket (public=false) and RLS on storage.objects so anon/pending get NOTHING and only the server/approved path can read (signed-URL ISSUANCE is S6e — do not build the download route now). Booklets are is_public=true rows pointing at the existing public PDFs. Ship 0014 up + .down.sql + grants + bucket policy SQL.
5. (5e) academy_modules: element_id fk, title, one_line, length null, youtube_url null (null → "video's coming" empty state), body_md null (the video script / reuses Simple Guide), sort_order, created_at. RLS ENABLE + default-deny; hardened approved-only read RPC. Ship 0015 up + .down.sql + grants.
6. (ingestion, TEST) Build scripts/ingest-content.ts — a one-time, IDEMPOTENT script (NOT app code): reads the canonical A1..J3 mapping from docs/page-copy/06-elements/_index.md, parses the .docx source under "docs/source-assets/resources/2. Focus Areas/" (Overview / Simple Guide / Operational Checklist / Watch Out For / Video Script — tolerate the inconsistent filenames via per-folder globbing + suffix matching, the diacritic/double-space cases, and the missing Watch-Out-For files → leave null), upserts elements + checklist_items + academy_modules + resources metadata on stable natural keys, creates the private bucket, and uploads the 267 Templates/*.docx + 2 booklet PDFs. Use @supabase/supabase-js with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY from .env.local. Parse .docx with a SCRIPT-ONLY devDependency (e.g. mammoth). Run it against TEST, report row + file counts. STOP — do not touch prod.
7. (verify TEST → apply/ingest PROD) Give me the exact ordered apply steps + a role matrix I run on TEST: anon → only the public programming projection, nothing else; a PENDING authed user → zero gated content, and resolves only its own profile; an APPROVED user → reads elements/checklist/resources/academy and upserts only its OWN checklist_progress (cross-user write blocked); storage anon read blocked. After TEST passes, give me the prod apply order; I apply 0011–0015 to prod and run the prod ingestion (or authorize you to). Finish with the S5_verify_PROD_safe_readonly.sql read-only check.
8. (sprint exit gate) Full-diff self-review of every .sql file + the script against SECURITY-CHECKLIST §5 + §15, fix anything found. Update supabase/sql/README.md, docs/PROJECT-STATUS.md (§1, §2 board → S5 ✅, §4 the two owner decisions of 2026-06-18) and tick S5 in docs/ROADMAP.md.

Per-step protocol: read the locked inputs first; smallest safe change; every up has a matching down; RLS ENABLE + default-deny in the table's own file; verify typecheck/lint/build green + the script type-checks; self-review vs SECURITY-CHECKLIST §5/§15; commit AND push every sub-step; report in ≤6 lines then STOP and WAIT for "proceed".

Sprint-specific DB rules: RLS ENABLE + default-deny on all five tables from creation; every gated read RPC checks public.is_approved() INSIDE; programming_sessions is the ONLY anon-safe projection (narrow columns, no PII, no created_by); every SECURITY DEFINER fn hardened (set search_path = '', fully-qualified, authorize from auth.uid()/is_approved()/is_admin(), revoke from public+anon then grant authenticated; grant anon ONLY on the public projection); checklist_progress owner-scoped + status-locked; the bucket is PRIVATE; no app path uses SUPABASE_SECRET_KEY — only the one-time ingestion script does; migrations are immutable once applied to prod (a correction is a NEW numbered pair).
```

</details>

## Checks & results
typecheck ✅ · lint ✅ · build ✅ (after every sub-step) · no Preview (no UI this sprint). **DB:** `0011`–`0016` applied + verified on **test** (via the `supabase-test` MCP `execute_sql` — used over `apply_migration` to mirror the hand-paste SQL-Editor path) then **prod** (owner, SQL Editor) with the `supabase-prod-readonly` MCP confirming each. **Role matrix on test: 30/30** (anon → only `public_programming_sessions()`; pending → 0 gated rows + writes denied 42501 + resolves only own profile; approved → all content + only its own `checklist_progress`, forged status rejected 22023, cross-user read/update blocked; private bucket unreadable). **Ingestion counts match source** on both DBs (30 · 728 · 30 · 267+2 · 269 storage objects, 0 failed). **Independent Codex review:** 2 blocking gate gaps → fixed by `0016`, re-verified on test + prod.

## Deviations & learnings
- **First use of the Supabase MCP.** Built + proved DDL on TEST via `supabase-test` (read/write); owner shipped PROD by hand; verified PROD via `supabase-prod-readonly`. Used `execute_sql` rather than `apply_migration` so the exact raw SQL the human pastes on prod is what's proven on test (the repo uses no migration tooling).
- **The "4 Watch-Out-For gaps" (H2/H3/I3/J2) were wrong** — all 30 topics have a WTW source `.docx`; the page-copy `⚠️ placeholders` were *unedited copy*, not missing files (several named `…_WTWOF.docx` / `…_For_fixed.docx`). Switched the parser to normalized **contains**-matching → all 30 `watch_out_for_md` populated. PROJECT-STATUS §3 corrected.
- **728 checklist items**, not ~200 — the docx checklists hold 14–30 items each; the "200+" proof number is comfortably met. The checklists are Word **tables** (`# | Checklist Item | Pass | Fail | Required Document | …`), parsed from `mammoth.convertToHtml` (header-driven column detection), not raw text.
- **Near-miss caught by the script's own guard:** `.env.local` was pointed at **prod** when the first TEST ingestion was attempted — the TEST-default guard refused to write prod. Added dedicated `SUPABASE_INGEST_URL` / `SUPABASE_INGEST_SECRET_KEY` so the admin op can target a project without disturbing the app's vars; the guard was later hardened from `host.includes()` to an exact-hostname + `https` match (Codex).
- **Codex caught 2 real gate gaps** the build missed: `checklist_progress`'s owner SELECT and `programming_sessions`'s DELETE were ownership-only, not approval-gated. Lesson for future gated tables: **the approval gate must hold on every gated READ and every write CMD (including DELETE), not just insert/update.** Fixed in `0016`.
- **PowerShell quirk reconfirmed:** double quotes in a `git commit -m` here-string break the message — keep commit messages quote-free.
- Decisions **D-S5-a** (full ingestion now; `/admin/content` editing UI = V1/post-MVP) and **D-S5-b** (repo gated-content removal deferred from "no later than S5" to **pre-launch**) recorded in PROJECT-STATUS §4.

## Follow-ups
- **S6** renders this data (private platform pages); **signed-URL download issuance = S6e**; `/live` + partner-publishing wiring = **S7**.
- **Owner action:** delete the temporary `SUPABASE_INGEST_*` prod lines from `.env.local` (gets the prod service key off local disk).
- `programming_sessions` was seeded **empty** (partner publishing is S7).
- **gate→item mapping left null** — which checklist items belong to gate 1/2/3 is a design gap (the Gate 2 label is unapproved); `checklist_items.gate` is nullable and ready when the mapping is decided.
- Repo gated-content exposure stays tracked in `notes/cleanup-before-launch.md` (removal at pre-launch, per D-S5-b).
