# Sprint Prompt Guide — Palestine House

This guide explains how to prepare **one implementation prompt per sprint**. It is the guide, not the
prompt: the copy-paste skeleton is
[`docs/templates/CLAUDE-SPRINT-PROMPT-TEMPLATE.md`](./templates/CLAUDE-SPRINT-PROMPT-TEMPLATE.md), and
it is the only standard implementation-prompt template in this repo.

> **Preferred route:** run the **`/sprint-prompt`** skill
> ([`.claude/skills/sprint-prompt/SKILL.md`](../.claude/skills/sprint-prompt/SKILL.md)) instead of
> filling the skeleton by hand. It reads `PROJECT-STATUS.md` and `ROADMAP.md`, produces the sprint
> plan and the filled prompt, and after merge logs the record in `docs/sprint-prompts/`. This guide
> is what to check when you fill one manually — or when you want to know whether the generated prompt
> is complete.

`CLAUDE.md` is the canonical builder policy. A sprint prompt may **narrow** it; it may never weaken
its security, scope, Git or owner-control rules.

## Before implementation

- [ ] Keep the filled prompt — it becomes the permanent sprint record at
      `docs/sprint-prompts/[SPRINT_ID]-[SLUG].md` (lowercase, dots → dashes). The convention is
      [`docs/sprint-prompts/README.md`](./sprint-prompts/README.md): `/sprint-prompt save` writes the
      record for the merging PR, in the closing PR when possible — so keep notes as the sprint runs
      rather than reconstructing them. House shape:
      [`pp8-final-verification.md`](./sprint-prompts/pp8-final-verification.md) or
      [`stage-0-master-prompt.md`](./sprint-prompts/stage-0-master-prompt.md).
- [ ] Plan the sprint first with
      [`docs/templates/SPRINT-PLAN-TEMPLATE.md`](./templates/SPRINT-PLAN-TEMPLATE.md), and make the
      `ROADMAP.md` row match.
- [ ] Fill every bracketed field. Delete optional sections that do not apply (e.g. Gate 0).
- [ ] Name the branch, the exact files to inspect, and the exact files allowed to change.
- [ ] Point at the approved copy, design, schema and architecture sources by exact path. Never paste
      a live env value, and never paste anything from `.env.local`.
- [ ] Break the work into **numbered gated sub-steps** — small, verifiable, one concern each. This is
      not optional here; it is the protocol the project runs on (see below).
- [ ] Keep one goal, one sprint, one branch, and acceptance criteria that describe observable results.

## Required prompt sections

| Section | Required content |
|---|---|
| Context | Current state and why this sprint exists now. |
| Read first | `CLAUDE.md`, `PROJECT-STATUS.md` §1–§2, the `ROADMAP.md` sprint row, plus the architecture/security/design docs the sprint actually touches. |
| Sprint / Branch | Sprint ID + name, and one focused branch from the latest `main`. |
| Goal | One testable outcome and its exit condition. |
| Not this sprint | Named exclusions, each with a forwarding address (future sprint or `POST-LAUNCH-BACKLOG.md`). |
| Files | Exact inspect list and exact allowed-to-change list. Any other file needs owner approval. |
| Gate 0 | Owner prerequisite — asset, approval, account, or env var **name**. Delete if none. |
| Gated sub-steps | Numbered, each small and verifiable; the final step is the sprint exit gate. |
| Per-step protocol | The six steps below, unaltered. |
| Locked inputs | Approved copy/design/schema by path, the proof numbers, and what to do on a conflict. |
| Sprint-specific rules | Only what is specific to this sprint. Do not restate `CLAUDE.md`. |
| Safety | Env-value ban, secret ban, server/client boundary, preserved behavior, public-repo rule. |
| Verification | The exact commands below, plus the manual, responsive and data checks that apply. |
| Report | Outcome, files, checks and results, Preview verification, risks, push status, bookkeeping. |

## The gated sub-step protocol (do not alter it)

Every sprint prompt in this project is a **gated master prompt**. After each numbered sub-step the
engine must:

1. Read the exact locked input(s) for that sub-step **before** coding.
2. Build it — smallest safe change, one focused concern, inside the allowed file list.
3. Verify — `pnpm run typecheck && pnpm run lint && pnpm run build`, then spot-check the affected
   routes at desktop **and** 320px.
4. Self-review the diff and fix what it finds, before committing.
5. **Commit AND push to the task branch.**
6. Report in **≤6 lines**, then **STOP and WAIT for the owner's "proceed"**.

Owner remote commands: `proceed` · `pause` · `status` · `fix <thing>` · `skip to <n>`. A skip needs an
owner-approved deferral to a named future sprint or backlog item, recorded in `PROJECT-STATUS.md`.
Never mark a sprint complete while an exit criterion is unmet.

### Commit and push authorization — **D-SYS-2** (this project does **not** use "Commit: YES / Push: YES" tokens)

A standing owner authorization dated **2026-06-12** commits **and** pushes to the task branch after
every gated sub-step, so the owner can review live in the open PR. Do not put per-prompt YES/NO Git
tokens in a Palestine House sprint prompt — say this instead. The authorization covers the task
branch only: never push to `main` or any other branch, never merge, never force-push, never skip
hooks (`--no-verify`). Stage explicit paths; never `git add -A` in this repo.

## Verification commands (the repo's real ones)

```
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run start        # optional local production smoke
```

Those are four of the six scripts `package.json` defines (the others are `dev` and `test:e2e`). There is:

- **a Playwright suite since SYS2** — `pnpm run test:e2e`, which needs a deployed Preview URL
  (`PLAYWRIGHT_BASE_URL`); write it into a prompt only for steps that have one, and re-run the
  affected specs when a sprint touches tested behavior;
- **no Prettier / format check** — deliberately waived (**D-SYS-3**); do not add one.

CI is [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — workflow **CI**, job **verify**:
gitleaks secret scan → install → typecheck → lint → build. Local green is necessary but never
sufficient: the Vercel Preview from the PR must be tested too, at desktop and 320px.

## Finish before merge

- [ ] Complete the sprint record: shipped scope, checks and results, deviations and learnings,
      follow-ups — `/sprint-prompt save`, in the closing PR when possible
      ([`docs/sprint-prompts/README.md`](./sprint-prompts/README.md)).
- [ ] Update [`docs/PROJECT-STATUS.md`](./PROJECT-STATUS.md) (§1, §2, §8 change log) and tick the
      [`docs/ROADMAP.md`](./ROADMAP.md) row, in the same PR — when the sprint's file list allows it.
- [ ] Open the PR — body from
      [`templates/PR-DESCRIPTION-TEMPLATE.md`](./templates/PR-DESCRIPTION-TEMPLATE.md)
      ([`WORKFLOW.md`](./WORKFLOW.md) §10) — and test the Vercel Preview at desktop and 320px,
      recording it with
      [`templates/VERCEL-PREVIEW-TEST-TEMPLATE.md`](./templates/VERCEL-PREVIEW-TEST-TEMPLATE.md)
      ([`WORKFLOW.md`](./WORKFLOW.md) §11).
- [ ] **Independent review — mandatory for risky sprints (D-SYS-1):** anything touching auth, the
      approval gate, RLS or schema, env handling, security headers or the CSP. Review the immutable
      `merge-base..head` SHA range; brief from
      [`templates/CODEX-REVIEW-PROMPT-TEMPLATE.md`](./templates/CODEX-REVIEW-PROMPT-TEMPLATE.md),
      guidance in [`docs/CODEX-REVIEW-PROMPT.md`](./CODEX-REVIEW-PROMPT.md); save the verdict at
      `docs/code-reviews/[SPRINT_ID]-[SLUG]-review.md`. **No merge while a Blocking finding
      stands.** Trivial PRs are exempt.
- [ ] After any substantive fix, refresh the Preview evidence and repeat the review.
- [ ] The owner merges (`WORKFLOW.md` §12); rollback is §13. Then run `/close`
      ([`.claude/skills/close/SKILL.md`](../.claude/skills/close/SKILL.md)) for the final GO/NO-GO.

## Variants

- **Bug fix** → [`docs/templates/BUG-FIX-PROMPT-TEMPLATE.md`](./templates/BUG-FIX-PROMPT-TEMPLATE.md)
  — keeps a Problem block and requires root cause, fix summary, and the reproduction run before and
  after the fix.
- **Presentation-only UI work** →
  [`docs/templates/UI-SPRINT-PROMPT-TEMPLATE.md`](./templates/UI-SPRINT-PROMPT-TEMPLATE.md) — locked
  header/footer chrome, verbatim copy, `DESIGN.md` tokens, no new dependencies, desktop **and** 320px,
  accessibility and reduced motion. A new route or any data/auth change means it is not a UI-only
  sprint.
- **Database change** → the standard template **plus**
  [`docs/templates/SUPABASE-CHANGE-TEMPLATE.md`](./templates/SUPABASE-CHANGE-TEMPLATE.md) for the
  change record: up-SQL, matching `.down.sql`, and RLS policies in the PR; applied by hand in the
  Supabase SQL Editor,
  **non-production project first** ([`WORKFLOW.md`](./WORKFLOW.md) §14), production applied by the
  owner. MCP rules: [`docs/SUPABASE-MCP-SAFETY.md`](./SUPABASE-MCP-SAFETY.md) — the test project is
  read/write, production is read-only, and production is never written through any channel.

## Checklists — do not restate them, point at them

`WORKFLOW.md` §9 local · §10 PR · §11 Preview · §12 production merge · §13 rollback · §14 Supabase and
env safety · §15 never do this. Security sections that matter most in prompts:
`SECURITY-CHECKLIST.md` §5 RLS · §6 auth/session · §8 Route Handlers and abuse controls ·
§13 production deployment · §15 the Palestine House blocking invariants.

Next step → fill
[`docs/templates/CLAUDE-SPRINT-PROMPT-TEMPLATE.md`](./templates/CLAUDE-SPRINT-PROMPT-TEMPLATE.md),
run it, test the Preview, then review with
[`docs/CODEX-REVIEW-PROMPT.md`](./CODEX-REVIEW-PROMPT.md).
