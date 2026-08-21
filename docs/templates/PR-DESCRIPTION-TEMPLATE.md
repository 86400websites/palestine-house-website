# PR Description — [SPRINT_ID] · [SHORT_TITLE]

> **This is a skeleton. Every `[BRACKET]` is yours to replace.** Copy everything below the rule into
> the PR body. One PR = one focused change; base branch is `main`.
>
> This template records **evidence**. The rules for opening the PR are
> [`docs/WORKFLOW.md`](../WORKFLOW.md) §10 (PR checklist) — work through §9 (local) and §11 (Preview)
> too, and do not restate them here.
>
> **Keep this description current as the branch moves.** A standing owner authorization (2026-06-12)
> commits **and** pushes to the task branch after every gated sub-step, so the owner reviews live in
> the open PR — which means the head SHA in this description goes stale unless you update it. The
> tested head must be the current head at merge.
>
> Delete a section only if it is genuinely not applicable, and say so in one line rather than
> leaving it blank.

---

## What

[One paragraph, plain language: what this PR does. Smallest safe change — if one paragraph is not
enough, the PR is too big.]

## Why

- Sprint: **[SPRINT_ID] — [SPRINT_NAME]**
- ROADMAP row: [Stage [N] — the exact row title in [`docs/ROADMAP.md`](../ROADMAP.md)]
- Sprint record: `docs/sprint-prompts/[SPRINT_ID]-[SLUG].md`
- [One or two lines: the sprint goal, bug or decision this serves. Cite the decision id — D-PP-x /
  D-SYS-x from [`docs/PROJECT-STATUS.md`](../PROJECT-STATUS.md) §4 — if one drove it.]

## Changes

- [File or area — what changed]
- [File or area — what changed]
- [File or area — what changed]

## Out of scope / not changed

- [What this PR deliberately does **not** touch — e.g. the locked header/footer chrome, security
  headers, approved copy, schema, the approval gate]
- [Deferred item — where it lives: a named sprint, `PROJECT-STATUS.md` §7, or
  [`docs/POST-LAUNCH-BACKLOG.md`](../POST-LAUNCH-BACKLOG.md)]

Naming what you did not change stops reviewers filing false positives and stops scope creep.

## Database & migrations

*(No schema change in this PR → say "None — no `supabase/sql/` change" and delete the rest.)*

- Migration: `supabase/sql/migrations/[NNNN]_[name].up.sql` — **and** its matching
  `[NNNN]_[name].down.sql`, both in this PR, with the RLS policies ([`WORKFLOW.md`](../WORKFLOW.md) §14)
- Verification script: `supabase/sql/verification/[NAME].sql` — [result]
- Applied to **TEST**: [date, or "not yet"] · Applied to **PRODUCTION**: [date, or "not yet —
  deliberate, because …"]
- Production was on migration `[NNNN]` before this PR; it will be on `[NNNN]` after
- Applied by hand in the Supabase SQL Editor, **non-production project first**. Applied migrations
  are **immutable** — a fix is a new migration, never an edit
- ⚠️ A Vercel rollback restores code, **not** the database, and a `.down.sql` does not restore lost
  data ([`WORKFLOW.md`](../WORKFLOW.md) §13)

## Env vars

*(None → say so.)* [Names only, never values. Which environments they were added to in Vercel
(Production / Preview / Development), and that a **redeploy** was needed for them to take effect.]

## How tested

- [ ] Local: `pnpm run typecheck` · `pnpm run lint` · `pnpm run build` — all green
      [· `pnpm run build && pnpm run start` smoke, if rendering changed]
- [ ] Tests: **N/A — no test script in this repo yet; the Playwright suite arrives in sprint SYS2**
- [ ] CI green at `[HEAD_SHA]` — workflow **CI**, job **`verify`** (gitleaks secret scan, install,
      typecheck, lint, build)
- [ ] Vercel **Preview** tested at `[HEAD_SHA]`: [PREVIEW_URL] — desktop **and 320px**
- [ ] Routes/flows exercised: [list what you actually clicked, including anything the change could
      have affected — do not assume isolation]

## Screenshots

*(UI changes only — delete otherwise.)*

| View | Before | After |
|---|---|---|
| Desktop | [img] | [img] |
| 320px | [img] | [img] |

## Security invariants touched

Tick each invariant this diff touches and say in one line **how it still holds**. Untouched → write
"not touched". Source: [`docs/SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) §15 (all 🔴 blocking).

- [ ] **Approval enforcement** — every platform RPC, read and write, checks `is_approved`
      server-side; every gated page checks again before it renders: [how / not touched]
- [ ] **A gate is a throw, not an await** — the page's own check short-circuits **before any JSX is
      constructed**; a parent layout is not a gate for its child: [how / not touched]
- [ ] **`/account`** — the one deliberate session-only exception, caller's own row: [how / not touched]
- [ ] **Admin routes** — `/admin/*` verify the `admins` table server-side: [how / not touched]
- [ ] **Apply = sign-up** — `/apply` is still the only account-creation door: [how / not touched]
- [ ] **Reference content never public** — public projections expose titles/overviews only:
      [how / not touched]
- [ ] **Templates** — private Storage bucket, server-issued signed URLs to approved users, no
      storage path or bucket name reaching the client: [how / not touched]
- [ ] **Public writes** — zod-validated and fail closed in Production (rate limiting + Turnstile are
      sprint SYS1.5, `PROJECT-STATUS.md` §7 #1): [how / not touched]
- [ ] **Dormant tables** — `programming_sessions` stays default-deny; no new caller, policy or row:
      [how / not touched]
- [ ] **Security headers / CSP** (headers checklist: §10 — the allow-list clause is the one inside
      §15) — not weakened; the allow-list gained nothing beyond the YouTube embed origin, the single
      planned exception being the Sentry ingest origin in sprint SYS3 (D-SYS-10): [how / not touched]

## Independent review (D-SYS-1)

- Risky sprint? [YES — it touches [auth / the approval gate / RLS or schema / env handling /
  security headers or CSP] · NO — trivial PR, exempt because [reason]]
- Reviewed range: `[MERGE_BASE_SHA]..[HEAD_SHA]` — a branch name or `main..branch` is not a range
- Record: `docs/code-reviews/[SPRINT_ID]-[SLUG]-review.md`
- Verdict: [APPROVE / REQUEST CHANGES] · rounds: [N] · Blocking findings outstanding: [none / list]
- [ ] Any substantive change after the reviewed head → new Preview test **and** re-review of the new
      head; the reviewed head is still the PR head at merge

Brief template: [`CODEX-REVIEW-PROMPT-TEMPLATE.md`](./CODEX-REVIEW-PROMPT-TEMPLATE.md) ·
guide: [`docs/CODEX-REVIEW-PROMPT.md`](../CODEX-REVIEW-PROMPT.md).

## Tracker bookkeeping

- [ ] [`docs/PROJECT-STATUS.md`](../PROJECT-STATUS.md) updated in **this** branch — §1 Right now,
      §2 Sprint board, §8 change log [+ §4/§5/§7 if a decision or known issue moved]
- [ ] The `[SPRINT_ID]` row in [`docs/ROADMAP.md`](../ROADMAP.md) ticked, in this same PR
- [ ] Sprint record written at `docs/sprint-prompts/[SPRINT_ID]-[SLUG].md` — shipped scope, checks
      and results, deviations and learnings, follow-ups

## Rollback

[Revert this PR on GitHub (or `git revert [MERGE_COMMIT_SHA]`) and let Vercel redeploy. For an
immediate live restore: Vercel → Deployments → last good deployment → **Promote to Production**, then
still fix `main`. See [`WORKFLOW.md`](../WORKFLOW.md) §13 and
[`docs/ROLLBACK-RUNBOOK.md`](../ROLLBACK-RUNBOOK.md).]
[If this PR ships a migration: a Vercel rollback does **not** roll back the database, and
`[NNNN]_[name].down.sql` does not restore data the up-migration removed. State the deliberate
decision — keep the (backwards-compatible) schema, or apply the down migration.]

## Final checks

- [ ] Base is `main`; the branch is one focused change; branch name follows `claude/…`
- [ ] No secret, key, token, connection string or `.env.local` anywhere in
      `[MERGE_BASE_SHA]..[HEAD_SHA]`; any `.env.example` change is names and placeholders only
- [ ] Nothing in this PR body carries partner or applicant identities, account email addresses,
      gated content, Storage paths or project refs — **this repository is public**
- [ ] Copy is verbatim from the approved source; any new string follows the brand-voice rules; the
      proof numbers are **4 sections · 22 focus areas · 88 templates**
- [ ] [`docs/WORKFLOW.md`](../WORKFLOW.md) §10 worked through in full
- [ ] Merge is the owner's — not the engine's, and not while a Blocking finding stands
