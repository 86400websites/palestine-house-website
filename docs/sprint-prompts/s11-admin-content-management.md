# Sprint S11 — Admin content management

| | |
|---|---|
| **Date merged** | 2026-06-27 — migrations **0023 + 0024 applied + verified on TEST and PRODUCTION** (PROD applied by owner, engine re-verified read-only); post-merge `/close` = **GO** |
| **Branch / PR** | `claude/sprint-s11-admin-content-management` / **#39** (merge `040ad6b`) |
| **Goal** | Give HQ a CRUD admin panel at `/admin/content`, behind the existing `is_admin()` gate, so the client self-manages all private-page content (the 30 element bodies, academy videos, resource/template metadata) + add/remove admins — through new hardened RLS-safe write RPCs, no scripts. |

## What shipped

Built in 12 owner-gated sub-steps (push-per-step into the open PR):

- **11-1 — Route-aware admin nav.** Extracted the admin top-nav into a client `AdminNav` (`src/components/admin/admin-nav.tsx`) that derives the active item from `usePathname()`, and added **Content → /admin/content**. Dropped the hardcoded `active` prop from `AdminShell` + `admin/layout.tsx`. Approvals highlight unchanged.
- **11-2 — Gated hub.** `src/app/admin/content/page.tsx` — approved heading **"Content admin."** + four section cards: **Elements · Academy · Resources · Admins**. No extra `layout.tsx` (the `/admin` `is_admin()` gate covers the subtree). Added a token-based `.adm-hub` card style. **Canon-vs-scope reconciliation (D-S11-f):** the copy canon's "Live Programming sessions" section is **not** built here (programming is self-managed in the gated `/programming` tool, S9); recorded in §4 + the `admin-content.md` canon.
- **11-3 — Migration 0023 (content RPCs).** 12 `is_admin()`-gated `SECURITY DEFINER` RPCs: elements `list/get/upsert/delete` · academy `list/get/upsert/delete` · resources `list/get/update/delete`. All `search_path=''`, fully-qualified, in-function `is_admin()`, narrow returns (no storage paths), idempotent upserts on natural keys (`elements.slug`, `academy_modules.element_id`), YouTube host-guard on academy URLs, EXECUTE revoked public/anon → granted authenticated. + `0023.down.sql` (re-runnable).
- **11-4 — Migration 0024 (management RPCs).** `admin_list_admins()` (email-only, joined from `auth.users`) · `admin_add_admin_by_email(p_email)` (folds the email→id lookup into one gated call) · `admin_remove_admin(p_user_id)` (self + last-admin lockout guards). + `0024.down.sql`.
- **11-5 — Server Actions.** `src/lib/admin/content-actions.ts` — one action per write surface (`saveElement` / `saveAcademyModule` / `saveResource` / `addAdmin` / `removeAdmin`). Each zod-validates, re-checks session + `is_admin()` server-side (shared `adminGuard`, defence in depth), calls the matching RPC, `revalidatePath`s the affected admin + gated pages, returns neutral `{ ok, message }` (RPC errors mapped by SQLSTATE/message). Academy `youtube_url` validated via `parseYouTubeId`.
- **11-6/7/8/9 — Section UIs.** Elements (`?slug=`), Academy (`?element=`), Resources (`?id=` + a client filter over the 269 rows) are **edit-only** (table list + server-driven detail form + `useActionState`; lossless upsert via round-tripped hidden fields; storage path never in the browser; `is_public` read-only). Admins is add-by-email + per-row Remove (confirm + the self/last-admin guard messages). Server-side date formatting (no hydration drift). Added `.adm-form*` / `.adm-field-hint` / `.adm-add-form` styles.
- **11-10 — Hardening self-audit + local verify.** Catalog audit: all 15 `admin_*` RPCs secdef + pinned + anon-revoked; only the `/admin` layout gate exists (no bypass); every `/admin/content/*` renders `ƒ`. typecheck/lint/build green.
- **11-11 — TEST verification + archive.** Full role matrix on TEST via MCP; added `S11_verify_PROD_safe_readonly.sql`; archived `0023`/`0024` (up+down) + both verify scripts.
- **11-12 — Exit gate.** Adversarial **4-lens multi-agent review** (gating · RPC/RLS/data-safety · correctness · scope/secrets, each finding adversarially verified) = **PASS, zero findings**. Updated `PROJECT-STATUS.md` §1/§2/§4/§8 + `ROADMAP.md` S11 row.
- **Independent (Codex) review + fix.** One **blocking** TOCTOU race in `admin_remove_admin` fixed (see Deviations). Reviewer otherwise clean; recommendation flips to approve with the fix.

**Invariants held:** the auth/approval gates (`is_approved`) + the public/approved read projections (`get_elements`/`get_element`/`get_academy_modules`/`get_resources`/`get_resource_download`/`public_programming_sessions`) are untouched; the content tables + `admins` stay RLS default-deny with **0 client policies**; no public-page / CSP / `next.config.ts` / middleware / env / rate-limit change; no new runtime dependency; no secrets (`.env.local` untracked).

## Prompt used

<details><summary>Exact implementation prompt</summary>

```text
You are my senior engineer for the Palestine House website, working in Claude Code.

Session start: read docs/PROJECT-STATUS.md §1–§2, then the S11 sprint scope + exit gate in docs/ROADMAP.md §B. CLAUDE.md governs everything below. This is a DATABASE sprint — before any database step, also read docs/WORKFLOW.md §14 (database change protocol) and docs/SUPABASE-MCP-SAFETY.md (the MCP rulebook), and skim supabase/sql/README.md so the migration numbering + verify-script discipline is exact.

Sprint: S11 — Admin content management
Branch: claude/sprint-s11-admin-content-management (create from latest main)

Goal:
Give HQ a CRUD admin panel at /admin/content, behind the existing is_admin() gate, so the client self-manages all private-page content without scripts:
- Add / update / delete the 30 element topic bodies (overview_md, simple_guide_md, watch_out_for_md + metadata), the academy modules (youtube_url + body_md script), and the resources/templates metadata.
- Add / remove / see admins (the old-S10 admin-management UI folds in here).
All writes go through NEW hardened SECURITY DEFINER RPCs gated on is_admin(); the content tables stay RLS default-deny; the public/approved read projections (get_elements / get_element / get_academy_modules / get_resources) are untouched and must keep returning correct data. No schema changes to the auth/approval gates; no new env vars; no rate-limit/Turnstile (that is S14).

Execute in gated sub-steps (one owner gate after each):
1. (11-1) Add a single "Content" nav item → /admin/content to the NAV array in src/components/admin/admin-shell.tsx. Leave logo/brand/topbar/logout untouched. AdminShell currently hardcodes active="approvals" (passed from src/app/admin/layout.tsx) — make the active nav key route-aware (or render the /admin/content subtree with active="content") so the Content item highlights correctly WITHOUT changing the Approvals highlight. Confirm anon → /login and authenticated non-admin → 404 notFound() on the new route (file location is not access control).
2. (11-2) Create the gated route shell: src/app/admin/content/page.tsx (+ a layout.tsx only if /admin/layout.tsx's is_admin() gate does not already cover the subtree, OR if the content subtree needs active="content" — verify first). Copy the server-side is_admin() gate pattern from src/app/admin/layout.tsx. Render the hub using the APPROVED heading "Content admin." from docs/page-copy/04-admin/admin-content.md (never invent a heading), linking the sections: Elements · Academy · Resources · Admins. CANON-VS-SCOPE: admin-content.md lists a "Live Programming sessions" section, but S11 scope EXCLUDES programming (already managed via the S9 /programming tool). Do NOT silently diverge — record a copy-vs-architecture conflict in PROJECT-STATUS.md §4 as a D-S11 decision (and update admin-content.md only if I approve dropping/relabelling that section). Same for the section grouping; show me the grouping and WAIT for approval before shipping.
3. (11-3) Migration 0023_admin_content_rpcs: the admin content read/write RPCs. Inspect the live schema on supabase-test FIRST. Every RPC: SECURITY DEFINER, search_path='', fully-qualified objects, is_admin() checked INSIDE the function, narrow returns, EXECUTE revoked from public/anon then granted to authenticated only; upserts idempotent on natural keys; the list/get RPCs must NOT return raw storage paths. CAUTION: admin_delete_element cascades to the 1:1 academy_modules row — flag at the gate. Write 0023…down.sql + S11_verify_TEST_db_only.sql. Apply 0023 to TEST via supabase-test MCP, read back, iterate to zero errors.
4. (11-4) Migration 0024_admin_management_rpcs: admin_list_admins() (email only), admin_add_admin(p_user_id) (validate exists; refuse duplicate), admin_remove_admin(p_user_id) (REFUSE removing yourself or the last admin). Same hardening. Write 0024…down.sql + extend the verify. Apply to TEST; role-verify. Do NOT modify is_admin() or the admins table (0003).
5. (11-5) Create src/lib/admin/content-actions.ts (mirror src/lib/admin/actions.ts). One Server Action per write: zod-validate → re-check session + is_admin() server-side → call the matching admin_* RPC → revalidatePath → return { ok, message }. Neutral errors only.
6. (11-6) Elements CRUD UI reusing approvals-queue.tsx architecture. USE the APPROVED action/confirmation labels VERBATIM. Only DRAFT a NEW string the canon does not cover, owner-approved, then write it back.
7. (11-7) Academy CRUD UI. youtube_url + body_md only — NO cover-image or file upload (D-S11-d). Validate youtube_url like the publish tool.
8. (11-8) Resources CRUD UI. METADATA only — raw storage_bucket/storage_path must never render. File replacement stays out of the UI for MVP (re-ingest path) unless I approve (D-S11-c).
9. (11-9) Admin-management UI. List via admin_list_admins(); add-by-email; remove with the self/last-admin guard message. The old-S10 admin-management UI folds in.
10. (11-10) Hardening self-audit + local verification. typecheck/lint/build; spot-check /admin/content/* gating.
11. (11-11) TEST verification + archive. Run S11_verify_TEST_db_only.sql (full role matrix). Save 0023/0024 up/down + S11_verify_TEST_db_only.sql + S11_verify_PROD_safe_readonly.sql. I hand-apply 0023 then 0024 to PRODUCTION; you verify PROD read-only.
12. (11-12) Sprint exit gate — full-diff review. Update docs/PROJECT-STATUS.md + tick S11 in docs/ROADMAP.md.

Per-step protocol (every sub-step): read inputs (inspect live schema first for DB steps) → smallest safe change → verify (typecheck/lint/build; apply to TEST + read back for DB) → self-review the diff → commit + push → report ≤6 lines, then STOP and WAIT for "proceed". For ANY new user-facing string AND ANY schema/scope decision (D-S11-a…i), show the draft/choice and WAIT.

Locked inputs: the admin copy canon is docs/page-copy/04-admin/admin-content.md (heading "Content admin." + the action labels Add/Edit/Save + confirmations Saved.); the content is the real locked 30 topics / academy / 267 templates + 2 booklets; DB pattern to copy = 0009_admin_approval_rpcs.up.sql + 0020_programming_publish.up.sql; UI pattern = admin/layout.tsx + admin-shell.tsx + approvals-queue.tsx + lib/admin/actions.ts. Proof numbers fixed: 10 · 30 · 200+ · 267 · 120-day launch. Migration numbering: latest applied is 0022 → S11 adds 0023 then 0024.

While editing (non-negotiable): every /admin route stays behind the server-side is_admin() gate; all content writes go through the new hardened SECURITY DEFINER RPCs; content tables + admins stay RLS default-deny; upserts idempotent; admin_remove_admin must refuse self/last-admin; no new secrets/env; no rate-limit/Turnstile; no public-facing change. Apply to TEST first (supabase-test read/write), I apply PROD; supabase-prod-readonly is READ-ONLY.

Push policy: commit + push after every gated sub-step (standing authorization, 2026-06-12); never merge; never push beyond the task branch; never write production.
```

</details>

## Checks & results

typecheck ✅ · lint ✅ · build ✅ (44 routes; every `/admin/content/*` gated `ƒ`) · secret-scan clean · `.env.local` untracked.

**TEST role matrix (supabase-test MCP):** anon revoked / authenticated granted; admin sees 30/30/269/1, non-admin sees 0; non-admin writes → `42501`; admin upsert idempotent (no id churn, count stays 30); slug + YouTube-host guards fire; add-by-email idempotent (true→false); unknown email → `user not found`; self-removal blocked; positive add+remove works; no storage-path/PII leak; content tables + `admins` RLS-on / 0 client policies; public projections untouched.

**PROD verification (supabase-prod-readonly MCP, 2026-06-27, after owner hand-applied 0023 then 0024):** 15 RPCs present · all SECURITY DEFINER + pinned · anon/public EXECUTE revoked + authenticated granted · **no storage/secret leak** · `admin_remove_admin` carries the serialization lock · `elements`/`academy_modules`/`resources`/`admins` RLS-on with 0 client policies · the six public projections untouched · content intact (30 elements · 30 academy · 269 resources [2 public] · 1 admin).

**Exit-gate adversarial 4-lens review (workflow):** PASS, zero findings. **Independent Codex review:** one blocking finding fixed (below), otherwise clean. _(Owner Vercel-Preview click-through of the panel still pending — Preview uses the TEST DB, already has 0023/0024.)_

## Deviations & learnings

- **D-S11-f — hub structure + Live-Programming reconciliation (owner delegated "safest"):** the hub uses a **four-way split** (Elements / Academy / Resources / Admins) instead of the canon's bundled "Topics & Academy videos" / "Resources & templates", and **drops the canon's "Live Programming sessions" section** (programming is self-managed in `/programming`). `admin-content.md` canon updated to record this.
- **CRUD depth — edit-only content (owner delegated "safest"):** Elements / Academy / Resources are **edit-only in the UI** (the 30 topics + 269 files are locked content; an element delete would FK-cascade away its 1:1 academy module). Admins gets add + remove. The full-CRUD delete RPCs (`admin_delete_element/_academy_module/_resource`) ship at the DB layer for completeness + re-ingest parity but are **not wired to UI buttons**.
- **RPC-name deviations (recorded at the gate):** `admin_upsert_resource` shipped as **`admin_update_resource(p_id, …)`** — resources are file-backed and there's no UI upload (D-S11-c/g), so editing is metadata-update-by-id (never storage path or `is_public`); `admin_add_admin(p_user_id)` shipped as **`admin_add_admin_by_email(p_email)`** — folds the email→id lookup into one gated call so no raw email→id oracle is exposed.
- **Codex blocking finding — `admin_remove_admin` lockout race (fixed).** The count-based last-admin guard read `count(*) <= 1` **without locking** `public.admins`, so two admins removing **each other** concurrently could both pass the guard and both delete → an empty table (lockout, a TOCTOU race). My original "the last-admin guard is unreachable except as self-removal" reasoning was only true for **serial** execution and missed the concurrent case. **Fix:** `lock table public.admins in share row exclusive mode` before the count read (the lock conflicts with itself, so a second concurrent removal waits then re-reads an accurate count; plain `is_admin`/`is_approved` reads take `ACCESS SHARE` and are not blocked). 0024 was **TEST-only** when the fix landed, so it was a `create or replace` in the same `0024_admin_management_rpcs.up.sql` (no 0025); the owner applied the **fixed** version to PROD (verified: lock present). **Learning: a count-based guard inside a `SECURITY DEFINER` RPC is not concurrency-safe without serialization — lock the table (or take an advisory lock) before the read-then-write.**
- **Markdown editing UX (D-S11-b):** plain raw-markdown textareas (no live preview) for the bodies/script — owner choice.
- New admin-panel microcopy (section intros, field labels, admin-management messages) drafted to brand voice; **flagged for owner sign-off** (not yet ratified).

## Follow-ups

- **Owner:** open + Vercel-Preview the PR, then **merge**; re-run `/sprint-prompt save` is not needed (this record is the final one) but flip "Date merged" / PR number on merge.
- **Owner sign-off** on the new admin microcopy (adjust wording if desired before merge).
- **Post-MVP / re-ingest path (D-S11-c):** resource/booklet file replacement, academy cover-image upload, and content versioning stay out of the admin UI; files change via `scripts/ingest-content.ts`. A future admin sprint could surface the content-delete RPCs (with confirms) + a "replace file" flow if the owner wants them.
- Independent Codex review prompt for this sprint is preserved below for re-use.

<details><summary>Independent (Codex) review prompt — used pre-merge</summary>

```text
You are my independent code reviewer for the Palestine House website.
Read AGENTS.md in the repo root — it defines your rules, priorities, and the
blocking gating checks. Review the branch DIFF only (vs main), not the whole repo.

This sprint (S11 — Admin content management) adds an /admin/content CRUD panel and
NEW hardened write RPCs (migrations 0023 admin_*_element/_academy_module/_resource,
0024 admin_list_admins / admin_add_admin / admin_remove_admin). Focus your review on:

- Admin gating: every /admin route + every admin Server Action re-checks is_admin()
  server-side (file location is not access control); anon → /login, non-admin → 404.
- RPC hardening: each admin_* RPC is SECURITY DEFINER, search_path='', fully-qualified
  objects, authorization decided INSIDE the function from is_admin()/auth.uid() (never
  from arguments), narrow returns, EXECUTE revoked from public/anon then granted to
  authenticated only; upserts idempotent on natural keys; .down.sql drop-if-exists +
  re-runnable. Could an approved-but-non-admin user call any admin_* RPC directly via
  PostgREST and write or read content / the admin list?
- RLS: content tables (elements/academy_modules/resources) + admins stay default-deny
  with NO client policy; no policy was loosened; the approval gate is_approved() and the
  public/approved read RPCs (get_elements/get_element/get_academy_modules/get_resources/
  public_programming_sessions) are untouched and still correct.
- Data safety: no raw Storage path or PII beyond email leaks to the browser; admin_remove_admin
  cannot remove yourself or the last admin (no lockout); no content loss / id churn on upsert;
  admin_delete_element's cascade to the 1:1 academy_modules row (0015) is intended, not accidental.
- Secrets / boundary / build: no secret committed or behind NEXT_PUBLIC_*; no service_role/
  sb_secret_* in app code; no secret into a Client Component; Server Components default;
  typecheck/lint/build pass.

Report serious issues only. Any failure of the AGENTS.md "Palestine House gating checks" is blocking.
Return: Blocking issues · Non-blocking issues · Missing checks · exact file:line locations ·
suggested fix for each · merge recommendation. Do not make changes, push, or merge.
```

</details>
