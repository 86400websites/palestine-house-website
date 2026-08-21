---
name: close
description: End-of-sprint close-out for Palestine House — verify a branch is safe to merge and the session is safe to end. Runs build/lint checks, confirms the tree is clean + pushed with no secrets, the trackers (PROJECT-STATUS + ROADMAP) are updated, the sprint record is saved, the security invariants the diff touches still hold, and (for DB sprints) migrations are applied + verified — then gives a single GO / NO-GO verdict. Triggers - "close the sprint", "are we safe to merge", "run close", "/close", "end the session safely", "final review before merge".
---

# Close — end-of-sprint verification & handoff (Palestine House)

You are the **close-out gate**. The owner runs this once, at the end of a sprint, before merging the PR and closing the session (often from mobile, in a fresh window). Your job: **verify** everything is consistent and safe, **report** a clear GO / NO-GO, and **surface** any gap with the exact fix — never auto-merge, never push beyond the task branch, never silently change code.

This is the bookend to `/sprint-prompt`: that skill *opens and records* a sprint; this one *verifies and hands off*. It does not replace the per-step gating during the sprint — it is the single final sweep.

Read, don't restate from memory — these define the gates you are checking (cite the file/section in your findings):
- `CLAUDE.md` (auto-loaded) — project rules.
- `docs/WORKFLOW.md` §9 (local checks), §10 (PR), §11 (Preview), §12 (merge), §17 (definition of done), §14 (database protocol).
- `docs/ROADMAP.md` — the active sprint's exit gate.
- `docs/SECURITY-CHECKLIST.md` — the quick gate + §15 blocking invariants.
- `docs/PROJECT-STATUS.md` §1–§2 — what the trackers should now say; **§4 for the D-SYS decisions** that govern the review gate, the push policy and the waived checks.
- `docs/QA-CHECKLIST.md` — the two-part per-PR gate · `docs/TECHNICAL-INTEGRITY.md` — what CI does and does not cover · `docs/CODEX-REVIEW-PROMPT.md` — how a review is commissioned and recorded.

## Step 0 — work out what this sprint shipped

Before checking anything, scope the run to the actual change:
- `git branch --show-current`, `git log main..HEAD --oneline`, `git diff --stat main...HEAD`.
- From the diff, decide which sections below apply (e.g. run the **Database** section only if `supabase/sql/**` changed; the **Copy & design** section only if UI/strings changed; the **Forms** invariant only if a public write changed). Mark non-applicable sections **N/A** with one line of why.

## The checklist

Run top to bottom. For each item give **PASS / FAIL / N/A** + the evidence (command output, file:line, or the owner's confirmation). Where a check depends on something you cannot see (Supabase dashboard, Vercel env, the Preview result), **ask the owner — never assume**.

### 1. Build & local checks
- `pnpm run typecheck && pnpm run lint && pnpm run build` all green. Paste any failure verbatim; do not hand-wave or skip the build.

### 2. Git hygiene
- On a **task branch**, not `main`.
- Working tree clean (`git status` shows only intended changes).
- Branch pushed and up to date with its upstream (`git log @{u}..HEAD` is empty); no unpushed commits.
- `.env.local` untracked; no stray untracked files that should be committed or deleted (e.g. ad-hoc review/output files).
- **Secret scan of the diff** (`git diff main...HEAD`): no keys, tokens, connection strings; no secret behind a `NEXT_PUBLIC_*` name.

### 3. Trackers updated in this PR
- `docs/PROJECT-STATUS.md` §1 (Right now), the §2 board row for this sprint, and the change log all reflect what shipped and what's next.
- `docs/ROADMAP.md` — the sprint's row/checkbox is ticked.
- If either is stale, quote the exact edit needed and **offer to make it on the task branch**.

### 4. Copy & design — only if UI / strings changed
- Any new or changed user-facing string is verbatim from `docs/page-copy/` or follows `docs/page-copy/00-global/brand-voice.md`.
- Proof numbers intact (**4 sections · 22 focus areas · 88 templates** — reconciled public-and-private at PP7, owner-signed live 2026-08-20, D-PP-s; a copy checker enforces them). The retired band (11 · 33 · 200+ · 297 · 120-day) names deleted content — finding it in a diff is a defect. Never a certificate. Locked header/footer chrome unchanged.

### 5. Security invariants — only those the diff touches (SECURITY-CHECKLIST §15)
For each invariant the change could affect, confirm it holds and cite the file:
- Approval enforced server-side; reference content never public; **Apply = the only sign-up door**; templates/booklets only via server-issued signed URLs; admin via server-checked `admins` table; CSP allow-list tight.
- **Public writes: zod — yes; rate limit + Turnstile — NOT SHIPPED YET.** `/apply`, contact and `/support` are live and unthrottled (`PROJECT-STATUS.md` §7 #1); the Upstash + Turnstile + fail-closed half of this invariant arrives in **SYS1.5** (D-SYS-9). Until then, check zod validation only and do **not** record the full §15 public-writes invariant as passing — a gate that reports a control the site does not have is worse than no gate.
- **CSP note:** the allow-list is YouTube-embed-only *today*. **SYS3** adds the Sentry ingest origin to `connect-src` (D-SYS-10) — when that lands, a widened `connect-src` is expected, not a finding.

### 6. Database — only if `supabase/sql/**` changed (WORKFLOW §14)
- Every `*.up.sql` has a matching `*.down.sql`; RLS **default-deny** on every new table; every `SECURITY DEFINER` function hardened (`search_path = ''`, fully-qualified, `auth.uid()` authz, narrow returns, `revoke execute from public, anon` then `grant` to the intended role; trigger fns granted to no client role).
- **Ask the owner to confirm** the migrations were applied to the **non-prod (test) DB and verified**, then to **prod and smoke-checked**. You cannot reach the Supabase dashboard — do not assume; if unconfirmed, this is a NO-GO.

### 7. Sprint record
- `docs/sprint-prompts/<id>-<slug>.md` exists for this sprint. If not: prompt **"run `/sprint-prompt save`"** (or offer to draft it).

### 8. Preview (owner-confirmed)
- Remind the owner to confirm the **Vercel Preview** was tested per WORKFLOW §11 (desktop + 320px; auth flows + email-origin if auth changed; forms behave or no-op). For SQL-only sprints, note Preview shows the unchanged site and the real artifact is the SQL + verification results.
- The exploratory browser pass is `/browser-qa` (`docs/BROWSER-TOOLS.md`); the per-PR form is `docs/templates/VERCEL-PREVIEW-TEST-TEMPLATE.md`. **Record the head SHA that was tested** — an approval does not carry to a new head.

### 9. Independent review — MANDATORY if the diff is risky (D-SYS-1)
- **Risky = the diff touches any of:** auth · the approval gate · RLS/schema (`supabase/sql/**`) · env handling · security headers · CSP. Decide from the diff, not from the sprint's title.
- If risky, all four must hold or this is a **NO-GO**: the review ran over an **immutable `<merge-base>..<head>` range** (a branch name is not a range — both ends move); its record is saved at `docs/code-reviews/<id>-<slug>-review.md`; **no Blocking finding is left standing**; and if anything substantive changed after the verdict, it was **re-reviewed at the new head**.
- If not risky, mark N/A and say why in one clause.
- Guide: `docs/CODEX-REVIEW-PROMPT.md` · skeleton: `docs/templates/CODEX-REVIEW-PROMPT-TEMPLATE.md` · prompt: `/sprint-prompt` section F.
- *Why this is a gate here and not a suggestion:* PP6b, PP6c, PP7 and PP8 each drew a BLOCKING verdict, and each was right — two of PP7's Criticals were in the one function that edits the owner's prose.

### 10. Technical integrity (`docs/TECHNICAL-INTEGRITY.md`)
- CI is green on the head being merged: typecheck · lint · build · gitleaks (workflow **CI**, job **`verify`**). There is deliberately **no format check** (D-SYS-3) and **no test run yet** (the suite arrives in SYS2) — do not report either as a failure.
- No new `any`, `@ts-ignore`, or unexplained `eslint-disable` in the diff; a suppression needs its reason on the line above.

## Output — a single verdict

End with one of:
- **✅ GO — safe to merge & close.** One line per applicable check that passed, plus the post-merge reminders (merge the PR, then `/sprint-prompt save` if not yet done; the next sprint per ROADMAP).
- **⛔ NO-GO.** List each blocking gap with the exact fix; offer to do the ones you safely can (trackers, sprint record, doc accuracy) on the task branch now. The owner still performs the merge.

## Never
- Never merge, never push beyond the task branch, never skip hooks/CI.
- Never auto-fix code or security findings silently — report them and fix only what the owner approves.
- Never assume dashboard-only state (Supabase apply/verify, Vercel env, Preview result) — ask the owner.
- Never restate the gate docs from memory — read them and cite the file/section.
