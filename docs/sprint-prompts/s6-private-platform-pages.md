# Sprint S6 — Private platform pages

| | |
|---|---|
| **Date merged** | _Pending owner merge_ — build complete + independently reviewed (Codex: **approve**, zero blocking/non-blocking) 2026-06-19 |
| **Branch / PR** | `claude/sprint-s6-private-platform-pages` (from `main` after S5/PR #23) / PR open |
| **Goal** | Render the entire approval-gated partner reference platform on the S5 content schema — every page under `(workspace)/` — so the site is launch-ready right after S6. |

## What shipped

**Routes (all under `src/app/(workspace)/`):**
- **Step 0** — docs-only roadmap reshuffle (launch-first: new **S7 = Final review & launch**; Live → S8, Email → S9, Hardening → S10, all post-launch).
- **Step 1** `/elements/[slug]` ×30 (6d) — the canonical 6-tab element page (Overview · Simple Guide · Checklist · Watch Out For · Video · Templates) over `get_element(p_slug)`/`get_elements()`; DB markdown rendered + **sanitized server-side** (`marked` + `sanitize-html`). Carried the shared foundation: the `src/lib/workspace/{types,content,markdown,progress}.ts` data layer + `pending-state.tsx`.
- **Step 2** `/build` (6c) — checklist tracker: focus-area accordions, StatusPill, per-item note, saved progress via `set_checklist_progress`. Gate banners **suppressed** (D-S6-b).
- **Step 3** `/dashboard` (6a) — mid-journey snapshot (stage + Design & Build %), reusing the progress helper; pending + newly-approved states preserved.
- **Step 3.5 (owner-added)** — nav + session-aware auth UX: sidebar wiring, public header Apply → **My Dashboard** when signed in, apply → `/dashboard` redirect (public pages stayed static, CSP unchanged).
- **Step 4** `/plan` (6b) — read-only foundation orientation (locked group→code curation from the mockup; titles/one-lines from the DB).
- **Step 5** `/operate` (6b) — read-only operating view (7 groups + per-group routine cadences); both "Operate & Program" and "Managing & Operating" sidebar entries resolve here (`alias` flag).
- **Step 6** `/resources` + `/resources/[category]` (6e) — featured booklets + focus-area **cards** (→ category slices; owner-delegated choice vs the mockup dropdown) + client type filter. **Server-issued signed-URL downloads**: a 60s signed URL minted with the user's own authenticated client for templates, public URL for booklets; the raw storage path never reaches the client (`get_resources()` omits it, `get_resource_download` resolves it server-side).
- **Step 7** `/academy` (6f) — video library, one card per topic; every `youtube_url` is null today → graceful "video coming · read the guide" linking to the topic guide (YouTube = outbound link, no embed, no CSP change).
- **Step 8** `/tools` (6g) — dignified coming-soon placeholder per the mockup.
- **Step 9** `/account` (6g) — display-name + email opt-in via `set_my_account`; **session-gated** (reachable pre-approval); Delete account section **hidden** (D-S6-c).
- **Step 10** `/support` (6g) — zod form → `submit_support_request`; **approval-gated**; email delivery **deferred** (requests stored, not sent); confirmation state.
- **Step 11** — exit gate (cross-cutting review + docs + this record).

**DB migrations (each up + `.down` + verification; TEST-applied + role-matrix verified, then owner-applied to PROD + verified read-only via MCP 2026-06-19):**
- `0017_resources_download` — `storage.objects` SELECT policy on the private `resources` bucket gated on `is_approved()` + `get_resource_download(p_id)` path-lookup RPC.
- `0018_account_prefs` — `profiles.marketing_opt_in` (default false) + owner-scoped `set_my_account` (can never set `is_approved`).
- `0019_support_requests` — `support_requests` (RLS default-deny, no client policy) + approved-only `submit_support_request` + `is_admin()`-gated `admin_list_support_requests`.

**Chrome / shared:** `workspace-shell.tsx` sidebar fully wired (every destination resolves; `alias` flag for the dual `/operate` entry); `globals.css` gained the workspace primitives (`topic-row`, `ws-tag`/`ws-tagrail`, `res-*`, `vid-*`, `acct-*`, `sup-*`).

## Prompt used

<details><summary>Exact gated master prompt (from <code>~/.claude/plans/adaptive-doodling-kernighan.md</code> §E)</summary>

```text
You are my senior engineer for the Palestine House website, working in Claude Code.

Session start: read docs/PROJECT-STATUS.md §1–§2, then the S6 scope + exit gate in docs/ROADMAP.md. CLAUDE.md governs everything below. For the DB sub-steps also read WORKFLOW.md §14, docs/SUPABASE-MCP-SAFETY.md, the SECURITY-CHECKLIST §5/§15, and supabase/sql/README.md.

Sprint: S6 — Private platform pages
Branch: claude/sprint-s6-private-platform-pages (create from latest main)

Goal:
Render the entire approval-gated partner reference platform on top of the S5 content schema — every workspace page behind (workspace)/layout.tsx — so the site is launch-ready immediately after this sprint. Reuse the existing gate (layout.tsx + getMyProfile), the existing WorkspaceShell sidebar, and the seven S5 RPCs (S6 is their first TypeScript consumer). Copy is verbatim from docs/page-copy/03-member-workspace/ and docs/page-copy/06-elements/; design is from docs/page-designs/member-workspace/ + shared/workspace-chrome.jsx + workspace.css.

Execute in gated sub-steps (one owner gate after each):
0. (Step 0 — docs only) Roadmap reshuffle. New S7 = Final review & launch (was S10); old S7→S8 (Live), S8→S9 (Email), S9→S10 (Hardening), all post-launch. Record §5 D-S6-a (launch without rate-limit/Turnstile), D-S6-b (/build gate mapping + Gate 2 label unset content), D-S6-c (/account Delete hidden). One focused docs commit. STOP.
1. (6d) /elements/[slug] ×30 — canonical 6-tab page over get_elements()/get_element(p_slug); render markdown; graceful "still writing this" for missing Watch Out For. Also ports workspace.css primitives + adds the typed server RPC wrappers in src/lib/workspace/. STOP.
2. (6c) /build — checklist tracker (status pill, per-item note, saved progress via set_checklist_progress()); shared progress helper; gate banners from checklist_items.gate WHERE PRESENT, degrade gracefully when null. STOP.
3. (6a) /dashboard — full mid-journey snapshot reusing Step 2's helper; pending + newly-approved states untouched. STOP.
4. (6b) /plan — read-only orientation. STOP.
5. (6b) /operate — read-only operating view. STOP.
6. (6e) /resources + /resources/[category] — get_resources() hub + category filter; migration 0017 (storage SELECT policy gated on is_approved(); TEST via MCP + role matrix); template download via a Server Action minting a short-lived signed URL with the user's own client; booklets via the public bucket; raw paths never reach the client. STOP.
7. (6f) /academy — get_academy_modules() grid + graceful empty video states; no CSP change. STOP.
8. (6g) /tools — coming-soon placeholder exactly per mockup; no fake features. STOP.
9. (6g) /account — display-name save + email opt-in + "Change password" link to /update-password; migration 0018 (profiles.marketing_opt_in + owner-scoped set_my_account; TEST via MCP); HIDE the Delete Account section. STOP.
10. (6g) /support — form (subject + message, zod, user id server-side); migration 0019 (support_requests table + submit_support_request approved-only + admin read RPC; TEST via MCP); confirmation per copy; email delivery deferred. STOP.
11. (exit gate) Full-diff review; SECURITY-CHECKLIST §5/§15 sweep; copy-verbatim audit; proof numbers 10·30·200+·267·3; 320px→desktop vs each mockup; confirm 0017–0019 applied + verified on TEST (owner applies prod). Update PROJECT-STATUS + tick ROADMAP. STOP.

Per-step protocol: read locked inputs → smallest safe change → typecheck/lint/build + spot-check + approval-gate check → self-review + fix → commit AND push → report ≤6 lines → STOP for "proceed".
DB: each migration ships up + .down.sql + RLS; apply to TEST via Supabase MCP only; NEVER write prod (owner pastes prod SQL). Follow docs/SUPABASE-MCP-SAFETY.md.
Push policy: commit + push after every gated sub-step (standing authorization, 2026-06-12); never merge, never push beyond the task branch.
```

</details>

> Steps 0–3.5 ran one owner-gated step at a time. Steps 4–11 ran in a **single owner-authorised autonomous session** (2026-06-19) — "complete everything end-to-end without asking, just this session" — with a `s6-step6-safe` git tag created as a restore point first, and per-step commits kept as the granular rollback path.

## Checks & results

typecheck ✅ · lint ✅ · build ✅ (34 routes; gated `ƒ`, public pages `○`, CSP untouched) · per-step adversarial review workflows (copy · security/RLS · correctness · design) ✅ · cross-cutting exit-gate review (gate-completeness + boundaries/secrets lenses clean) ✅ · **independent Codex review: approve, zero blocking, zero non-blocking** ✅ · migrations `0017`–`0019` role-matrix verified on **TEST** then **PROD** (read-only MCP + security advisors — only the expected hardened-RPC WARNs + default-deny INFOs) ✅ · Preview role-flow test ⏳ owner.

Brief at `docs/code-reviews/s6-private-platform-pages.md`. Security invariants: gate holds on every data page (PendingState before any fetch) except the intentional session-only `/account`; every new RPC + the storage policy is `is_approved()`/`auth.uid()`/`is_admin()` gated; no secret or raw storage path reaches a client; no browser-side Supabase data call (CSP/`connect-src` unchanged).

## Deviations & learnings

- **`/resources` focus-area browse = cards (not the mockup's dropdown).** Copy/mockup conflict ("Cards A–J" vs dropdown); owner delegated the call. Cards win — they satisfy the copy and give `/resources/[category]` a real entry point.
- **`/account` is session-gated, not approval-gated** (sidebar Account is always-on). `set_my_account` is `auth.uid()`-scoped but deliberately not `is_approved()`-gated — pre-approval account management with no escalation (can only set `full_name` + `marketing_opt_in`).
- **`/support` is approval-gated + its write approved-only** (the launch anti-abuse posture, §7/D-S6-a). **Email deferred** — requests are stored, owner reads the table until the post-launch email sprint. Mockup "Quick answers" links omitted (those strings aren't in `support.md`).
- **Gates suppressed** on `/build` + `/dashboard` (D-S6-b) — `checklist_items.gate` is all-null + Gate 2 label unapproved; locked content HQ must still supply.
- **`marketing_opt_in` defaults false** (privacy-respecting), not the mockup demo's true.
- Exit-gate review caught two copy-verbatim drifts in `element-tabs.tsx` (Video + Templates empty states) + a missing dashboard primary CTA — all fixed.
- Per-step review gotcha worth keeping: the adversarial-verify pass correctly **dismissed** non-defects (e.g. a cosmetic resilience edge, the intended pending→PendingState Support link) — the verify lens earns its keep.

## Follow-ups

- **Owner, before the new-S7 launch:** Preview role-flow test (anon→login · pending→under-review · approved→content + own progress + working signed-URL download); delete the temp `SUPABASE_INGEST_URL`/`SUPABASE_INGEST_SECRET_KEY` lines from `.env.local`; merge the PR.
- **D-S6-b (OPEN, content):** the `/build` gate→item mapping + Gate 2 label — HQ-supplied content needed before gates can render.
- **Post-launch (tracked):** rate-limit + Turnstile on public writes (S10, §7/D-S6-a); `/account` self-service deletion (D-S6-c); `/academy` videos (null today); Resend email delivery for `/support` (S9).
- **Optional prod hardening (non-blocking, surfaced by advisors):** enable Supabase Auth "leaked password protection"; `revoke execute` on the inert `rls_auto_enable()` from `anon` (pre-existing, not S6).
