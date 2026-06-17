# Sprint S4 — Approval gate + `/admin/approvals`

| | |
|---|---|
| **Date merged** | 2026-06-17 |
| **Branch / PR** | `claude/sprint-s4-approval-gate` / **#21** (record on `docs/s4-sprint-record`) |
| **Goal** | Turn pending accounts into approved partners and prove the §15 blocking invariants: a server-side session gate on the gated route group + `/dashboard` pending/approved states; `/admin/approvals` behind an `admins`-checked gate with Approve/Decline that flips `profiles.is_approved`; post-login → `/dashboard`. |

## What shipped

Executed in this Claude Code session in owner-gated sub-steps (push-per-step into the open PR), not pasted into a fresh session. Approval is enforced **server-side in the layouts**; the flip is a hardened `is_admin()`-gated RPC — **no `service_role`/secret-key path**. Public marketing pages stayed `○ Static`; CSP untouched.

- **1 (4a-i, DB):** migration **`0009`** — two hardened `SECURITY DEFINER` RPCs: `admin_list_applications()` (whole queue, pending-first, zero rows for non-admins) and `admin_set_application_status(id, status)` (sets `applications.status` **and** mirrors `profiles.is_approved`: approved→true, declined→false, atomically). Renamed the decline state `rejected`→**`declined`** to match the approvals copy/design. Applied + verified on **test + prod** (role matrix).
- **2 (4a-ii):** gated `(workspace)` route group with a **server-side session-gate layout** (`src/app/(workspace)/layout.tsx`: anon → `/login`; approval via React-cached `get_my_profile()`). `WorkspaceShell` ported from the locked chrome (`workspace-chrome.jsx` + `workspace.css`); pre-approval = locked sidebar + "under review" note. `/dashboard` renders the **pending** and **newly-approved** states (verbatim copy). New `src/components/layout/site-chrome.tsx` routes chrome by path so gated routes get their own shell.
- **3 (4b):** `admin` route group with an **`is_admin()` gate** (`src/app/admin/layout.tsx`: anon → `/login`; authenticated non-admin → **404** `notFound()`). `/admin/approvals` reads `admin_list_applications()` and renders the queue + detail per the mockup (`AdminShell` + `ApprovalsQueue`); **Approve/Decline** via a Server Action (`src/lib/admin/actions.ts`) → the flip RPC, then `revalidatePath`. Copy + toasts verbatim. `/admin` → redirects to `/admin/approvals`.
- **4 (4c):** post-login default repointed `/`→**`/dashboard`** (`safeNextPath` gained a `fallback` param; a safe `?next=` is still honored). Gate reads approval **live** each request (no cached claim) → unlock without re-login.
- **Helpers/CSS:** `src/lib/auth/profile.ts` (`getMyProfile`/`isAdmin`/`firstNameOf`, React-cached); workspace + admin chrome styles ported into `src/styles/globals.css`.
- **Post-review hardening:** migration **`0010`** makes `admin_set_application_status` refuse + roll back if the applicant has no `profiles` row; `0009` up/down gained no-op `rejected`↔`declined` guards. Applied + verified on test + prod.

## Prompt used

This sprint was planned by `/sprint-prompt` (plan file) and executed inline. The gated master prompt (section E of the plan):

<details><summary>Exact implementation prompt (GATE 0 + 5 gated sub-steps)</summary>

```text
You are my senior engineer for the Palestine House website, working in Claude Code.

Session start: read docs/PROJECT-STATUS.md §1–§2, then the S4 scope + exit gate in
docs/ROADMAP.md (Stage 2). CLAUDE.md governs everything below. This sprint builds the approval
gate — docs/SECURITY-CHECKLIST.md §5/§6/§15 and docs/WORKFLOW.md §14 (database protocol) are
binding, not optional.

Sprint: S4 — Approval gate + /admin/approvals (4a gated shell + pending dashboard · 4b admin
queue · 4c server-side is_approved enforcement + repoint post-login)
Branch: claude/sprint-s4-approval-gate (create from latest main)

Goal:
Turn pending accounts into approved partners and prove the §15 blocking invariants. Add the
gated workspace shell with a server-side session gate; /dashboard renders the pending state for
unapproved sessions and the newly-approved empty state for approved ones. Add /admin/approvals
(server-checked admins table) with Approve/Decline that flips profiles.is_approved via a
hardened SECURITY DEFINER RPC. Repoint post-login to /dashboard. Approval must unlock on the
partner's next navigation WITHOUT re-login.

Confirmed decisions (do not reopen):
- Approval-notification email (Resend) is DEFERRED to S8 — flip approval only this sprint.
- "Add note" on the queue is DEFERRED — the only DB change is the approval-flip + queue-read RPC.
- The full /dashboard snapshot (stage %, gates, next steps) is S6 — S4 ships only the pending +
  newly-approved states. No other gated page (/plan, /build, /elements, /resources, /academy,
  /account, /support) and no other admin page is built this sprint.
- No secret/service_role key path: the approval flip is a hardened is_admin()-gated RPC, never
  the secret key. Gated pages read cookies and render dynamic — do NOT loosen the CSP.

GATE 0 — OWNER ACTIONS FIRST (do not start sub-step 1 until I confirm):
1) S3 (#19) and the docs/s3-sprint-record PR are merged to main.
2) I will insert my own auth user_id into the admins table on the TEST database (and prod later)
   so the queue is testable — there is no client path to create the first admin.

Execute in gated sub-steps (one owner gate after each):
1. (4a-i DB) Read migrations 0001–0004 first. Write migration 0009 (up + .down.sql):
   admin_list_applications() and admin_set_application_status(application_id, status), both
   hardened SECURITY DEFINER (search_path='', fully-qualified, authorize via is_admin() INSIDE
   the function — never trust arguments, narrow returns, revoke execute from public+anon then
   grant authenticated). The flip sets applications.status AND mirrors profiles.is_approved
   (approved→true, declined/pending→false) atomically, validating status against an allow-list.
   Ship S4 verification scripts (TEST role matrix: admin sees all + flips; non-admin sees none +
   flip denied; approve/decline mirror is_approved; self-cleaning via explicit deletes) +
   PROD read-only. Update supabase/sql/README.md. Give me the exact test-first apply order; I
   apply by hand, you record results. No app code yet.
2. (4a-ii) Gated workspace shell + /dashboard. Route group with a Server-Component layout that
   redirects anon → /login?next=…, then reads approval via get_my_profile(). Port the sidebar +
   topbar from docs/page-designs/shared/workspace-chrome.jsx + workspace.css (locked pre-approval;
   Welcome/Live/Account/Support always visible; S6 destinations rendered inert — no dead 404
   links). /dashboard: pending "under review" state for unapproved; the verbatim "You're approved
   — welcome" empty state for approved. Copy from docs/page-copy/03-member-workspace/dashboard.md.
3. (4b) /admin/approvals. Admin route group with a Server-Component layout that checks is_admin()
   and returns notFound() (404) for non-admins (never leak the route). The page reads
   admin_list_applications() and renders the queue + detail per
   docs/page-designs/admin/AdminApprovals.app.jsx + shared/admin-chrome.jsx + admin.css; copy
   verbatim from docs/page-copy/04-admin/admin-approvals.md (pending-first; status = colour +
   icon + label; drop "Add note"). Approve/Decline are Server Actions that re-check the session,
   call admin_set_application_status, then revalidate. Admin nav shows Approvals only.
4. (4c) Enforcement + repoint. Default post-login landing → /dashboard (signInAction). Confirm
   the gate reads approval live each request so approval unlocks without re-login (no cached
   claim). Optional: a defence-in-depth anon→/login redirect in middleware.ts for /dashboard +
   /admin prefixes (the layout gates stay authoritative).
5. (sprint exit gate) Full-diff self-review vs SECURITY-CHECKLIST §15 (all 7 invariants — focus:
   approval enforced server-side, /admin verified on every request, pending resolves only its own
   status, no secret-key path, redirects validated). Verify: anon → /login; pending sees only the
   pending dashboard with a locked sidebar; approving in /admin/approvals unlocks the partner's
   /dashboard on next load WITHOUT re-login; a non-admin gets 404 on /admin and cannot call the
   flip RPC. Update docs/PROJECT-STATUS.md (§1/§2 → S4 ✅, §8 change log; note the S8 email +
   notes deferrals) and tick S4 in docs/ROADMAP.md.

Per-step protocol: read the locked input(s) first; smallest safe change; Server Components by
default; verify pnpm run typecheck && lint && build; self-review the diff; commit AND push every
sub-step; report in ≤6 lines then STOP and WAIT for "proceed". Push policy: standing
authorization — never merge, never push beyond the task branch.
```

</details>

## Checks & results

typecheck ✅ · lint ✅ · build ✅ (26/26 routes; `/dashboard` + `/admin*` `ƒ` dynamic, every public page stayed `○ Static`; CSP unchanged) — after every sub-step. DB `0009` + `0010` applied + verified on **test + prod** (role matrix: admin sees all + flips, non-admin denied/0 rows, anon can't execute, approve→`is_approved` true, decline→false; `0010` profile-guard present + no regression). Owner Preview test ✅ (anon→`/login`; pending sees only the pending dashboard; admin approves → partner `/dashboard` unlocks without re-login; non-admin → 404). **Independent Codex review: no blocking; 2 non-blocking SQL findings, both fixed.** No secrets in the diff.

## Deviations & learnings

- **Root layout wraps ALL routes in the public chrome** — to give gated routes their own shell without moving ~20 public route files (and without breaking the 404/error chrome), the root layout now delegates to a small `SiteChrome` client component that renders the public header/footer for marketing/auth routes and **bare children** for `/dashboard` + `/admin` prefixes. `usePathname` here does **not** opt pages out of static rendering, so public pages stayed `○ Static` and the CSP stayed tight (same trick the header's session probe uses). Header/footer are passed as **props** so the client component never imports a server component.
- **`declined` vs `rejected`:** the S2 `applications.status` check allowed `rejected`, but the approved copy/design say "Declined". Reconciled by renaming to `declined` in `0009` (safe — no row ever uses `rejected`: inserts are forced `pending` by `0007` and the only status writer is the new RPC).
- **Two interaction bugs caught in owner Preview (both fixed before review):** (1) the workspace account menu's window-click close-listener unmounted the sign-out form on the very click that should submit it → clicks inside the menu now `stopPropagation`. (2) Approve/Decline carried the decision on the submit button's `name`/`value`, which `useActionState` didn't capture as the form's submitter → each decision is now its own form with the decision in a **hidden input**. Lesson: don't rely on the submit-button submitter under `useActionState`; put action params in hidden inputs.
- **Forward-looking nav:** only `/dashboard` (and public `/live`) exist in S4, so the sidebar's S6 destinations render **inert** (muted, not clickable) rather than dead 404 links, and the topbar **search is omitted** (targets the V1 `/search`). These return in S6.
- **Internal copy:** the approved detail line dropped its raw `(is_approved = true)` column ref → just "Platform unlocked." (owner-flagged).
- **Owner decisions (2026-06-17):** approval-notification email **deferred to S8** (Resend domain unverified until then); **"Add note" → backlog**. Recorded in PROJECT-STATUS §1/§8 + ROADMAP S4/S8.
- **Codex review fixes (non-blocking, SQL):** (High) the `rejected`↔`declined` constraint swap + its rollback weren't safe if a stray row used the other value → `0009` up/down gained no-op guards (no re-apply needed). (Medium) `admin_set_application_status` didn't verify a `profiles` row was updated → new migration **`0010`** refuses + rolls back when the applicant has no profile (a state the `0001` trigger already prevents). Lesson: a migration that swaps a constraint value should migrate stray rows first (both directions); a definer fn that writes two tables should assert each write affected a row.
- **Migration immutability:** `0009` was already applied to prod, so the function correction shipped as a **new** numbered migration (`0010`), per the project's "correction = new file" rule (the `0009` no-op guards are the one exception — provably no-op, so no drift / no re-apply).

## Follow-ups

- **Approval-notification email (Resend) → S8** (8b now includes it; Resend sending domain verified there).
- **"Add note" on the queue → backlog** (needs a column on `applications`).
- **Full `/dashboard` snapshot, the inert sidebar destinations, and the topbar workspace search → S6** (need the content schema from S5).
- **Apply still unthrottled until S9** (existing §7 item) — now **mitigated by the live approval gate** (unapproved sessions reach no gated content).
- **Minor edge:** an authenticated non-admin hitting `/admin/*` gets a chrome-less 404 (SiteChrome strips public chrome on the `/admin` prefix). Acceptable; revisit if it bothers anyone.
- **Next: S5 — Database phase 2 (content schema)** — continues the SQL at `0011`.
