# Sprint Implementation Prompt — [SPRINT_ID] — [SPRINT_NAME]

> **This is a skeleton. Every `[BRACKET]` is yours to replace.** The filled copy becomes the permanent
> sprint record at `docs/sprint-prompts/[SPRINT_ID]-[SLUG].md` (lowercase) — keep notes as the sprint
> runs; `/sprint-prompt save` writes the record for the closing PR
> ([`docs/sprint-prompts/README.md`](../sprint-prompts/README.md)).
>
> How to fill it: [`docs/SPRINT-PROMPT-TEMPLATE.md`](../SPRINT-PROMPT-TEMPLATE.md).
> Faster route: run the **`/sprint-prompt`** skill ([`.claude/skills/sprint-prompt/SKILL.md`](../../.claude/skills/sprint-prompt/SKILL.md))
> — it reads `PROJECT-STATUS.md` + `ROADMAP.md` and generates a filled version of this prompt.
> Variants: bug fix → [`BUG-FIX-PROMPT-TEMPLATE.md`](./BUG-FIX-PROMPT-TEMPLATE.md) ·
> presentation-only UI → [`UI-SPRINT-PROMPT-TEMPLATE.md`](./UI-SPRINT-PROMPT-TEMPLATE.md).
>
> House shape to copy: [`docs/sprint-prompts/stage-0-master-prompt.md`](../sprint-prompts/stage-0-master-prompt.md)
> and [`docs/sprint-prompts/pp8-final-verification.md`](../sprint-prompts/pp8-final-verification.md).

~~~text
You are my senior engineer for the Palestine House website, working in Claude Code.

Session start: read docs/PROJECT-STATUS.md §1–§2, then the sprint's scope + exit gate row in
docs/ROADMAP.md. CLAUDE.md governs everything below.

## Context
[Current state, why this sprint exists now, and the prior work it builds on.]

## Read first
- CLAUDE.md
- docs/PROJECT-STATUS.md — §1 Right now, §2 Sprint board, §4 Locked decisions, §5 Open decisions,
  §7 Known issues [narrow to the ones that apply]
- docs/ROADMAP.md — the [SPRINT_ID] row (scope · exit gate · depends on)
- docs/WORKFLOW.md — §9 local checklist, §10 PR checklist, §11 Preview checklist
- [docs/TECH-ARCHITECTURE.md / docs/SECURITY-CHECKLIST.md §[N] / docs/DESIGN.md §[N] /
  the previous sprint's record in docs/sprint-prompts/ — only what this sprint actually touches]

## Sprint / Branch
- Sprint: [SPRINT_ID] — [SPRINT_NAME]
- Branch: claude/sprint-[SPRINT_ID]-[short-slug], created from the latest main.
- Confirm the branch and inspect git status before editing. Preserve existing user changes — never
  reset, stash or discard work to get a clean tree.

## Goal
[2–5 lines: exactly what this sprint delivers, and the one condition that proves it is done.]

## Not this sprint
- [Excluded item] — belongs to [Sprint ID / docs/POST-LAUNCH-BACKLOG.md].
- [Excluded item] — belongs to [Sprint ID / docs/POST-LAUNCH-BACKLOG.md].

## Files
Inspect:
- [exact path]
- [exact path]

Allowed to change:
- [exact path or narrow directory]
- docs/PROJECT-STATUS.md and docs/ROADMAP.md — only at the exit-gate step, when this sprint closes

If another file is needed, stop and explain why before editing it.

## Gate 0 — owner prerequisite (delete this section if there is none)
[Owner-supplied asset, approval, account, or env variable NAME needed before step 1.] Do not start
until the owner confirms. Env variables by name only — never request, read, paste or echo a value,
and never open .env.local.

## Execute in gated sub-steps (one owner gate after each)
1. ([SPRINT_ID]-a) [first sub-step — small, verifiable, one concern]
2. ([SPRINT_ID]-b) [next sub-step]
3. […]
N. ([SPRINT_ID]-[x]) Sprint exit gate — full-diff review of the whole sprint, fix everything found,
   re-check every SECURITY-CHECKLIST section the diff touches, update docs/PROJECT-STATUS.md
   (§1, §2, §8 change log) and tick the sprint row in docs/ROADMAP.md.

## Per-step protocol (every sub-step, no exceptions)
1. Read the exact locked input(s) for this sub-step BEFORE coding.
2. Build it: smallest safe change, one focused concern, inside the allowed file list.
3. Verify: pnpm run typecheck && pnpm run lint && pnpm run build. Spot-check the affected routes at
   desktop and 320px, and confirm nothing else broke.
4. Self-review the diff for bugs, scope creep and anything secret-shaped, and fix it before
   committing. (The full review happens at the exit-gate step.)
5. Commit AND push to the task branch — every sub-step. Stage explicit paths; never `git add -A` in
   this repo (untracked and gitignored trees sit inside docs/). Never push to main, never merge,
   never force-push, never skip hooks.
6. Report in ≤6 lines: what shipped, checks run, anything flagged — then STOP and WAIT for
   "proceed". Never start the next sub-step without it.

Owner remote commands: "proceed" = next step · "pause" = hold · "status" = where are we ·
"fix <thing>" = fix that before continuing · "skip to <n>" = jump. A skip needs an owner-approved
deferral to a named future sprint or to docs/POST-LAUNCH-BACKLOG.md, recorded in
docs/PROJECT-STATUS.md. Never mark the sprint complete while an exit criterion is unmet.

## Commit and push authorization — D-SYS-2 (this project does not use per-prompt YES/NO tokens)
A standing owner authorization (2026-06-12) commits AND pushes to the task branch after every gated
sub-step, so the owner reviews live in the open PR. That authorization covers the task branch only:
never push to main or any other branch, never merge, never force-push, never `--no-verify`.

## Locked inputs (never invent, never paraphrase)
- Copy, verbatim: docs/page-copy/[exact file(s)] — the approved copy set is owner-held and NOT
  tracked in git, so name the exact files and confirm they are on disk before coding; if they are
  missing, stop and ask the owner rather than writing the string yourself. Brand voice governs any
  NEW string (errors, aria labels, empty states): warm, short, concrete — never charity tone,
  franchise hype, political slogans or startup filler.
- Design: docs/page-designs/[exact mockup file(s)] (same: owner-held, untracked) + the tokens
  recorded in docs/DESIGN.md §3 (color), §4 (typography), §8 (motion), §10 (responsive),
  §11 (accessibility) — DESIGN.md is in the repo and is authoritative for token values.
- [Schema / architecture / spec: exact path(s).]
- Proof numbers: 4 sections · 22 focus areas · 88 templates. The retired band — 11 · 33 · 297 ·
  "200+ checklist items" · "120-day launch" — names content that no longer exists; never carry it
  into new copy. Header and footer chrome is locked and identical on every page.

If two locked inputs conflict, stop and record an open decision in docs/PROJECT-STATUS.md §5 — only
when that file is in the allowed list. Do not choose silently.

## Sprint-specific rules
- [Rule — only what is specific to this sprint. Do not restate CLAUDE.md.]
- [Rule.]
[Include the ones the sprint actually touches:]
- Approval gate: every platform data RPC checks is_approved server-side, AND the page gates itself.
  A gate is a throw/redirect BEFORE any JSX is constructed — awaiting is not a gate, and a parent
  layout is not a gate for its child (SECURITY-CHECKLIST §15).
- /admin/*: additionally verify the admins table server-side, in the page itself.
- Public writes (/apply, contact, lead magnet, newsletter): zod + fail-closed in Production
  (SECURITY-CHECKLIST §8, §13, §15). Rate limiting + Turnstile are not shipped yet — sprint SYS1.5.
- Schema change: ship up-SQL + the matching .down.sql + RLS policies in the PR; apply by hand in the
  Supabase SQL Editor, NON-PRODUCTION project first (WORKFLOW.md §14; MCP rules in
  docs/SUPABASE-MCP-SAFETY.md — supabase-test is read/write, production is read-only).
- Templates stay in the private Storage bucket behind server-issued signed URLs for approved users.

## Safety
- Never open, read, copy, print or modify .env.local or any other live-value env file. Env variable
  names and placeholder examples only.
- Never hardcode or echo a secret. Client code reads only NEXT_PUBLIC_* values; server-only secrets
  are read only in Server Components, Route Handlers, Server Actions or instrumentation.ts.
- Server Components by default; "use client" only for state, effects, browser APIs or handlers.
- Preserve auth, approval-gating, routing, data, security-header and hosting behavior unless this
  sprint explicitly changes it.
- No new dependencies and no unlisted file changes without owner approval.
- This GitHub repo is PUBLIC: no personal names, emails, account ids, project refs, partner or
  applicant identities, gated content or Storage paths in anything committed.

## Verification (must pass before reporting a sub-step done)
- Typecheck: pnpm run typecheck
- Lint: pnpm run lint
- Production build: pnpm run build
- [Local production smoke, when the sprint changes rendering: pnpm run start]
- Automated tests: [when the sprint touches tested behavior — re-run the affected specs against the
  deployed Preview: `pnpm run test:e2e` with `PLAYWRIGHT_BASE_URL` set. The suite exists since SYS2;
  it never runs without a Preview target.] (There is no Prettier/format check here — D-SYS-3.)
- git status — .env.local untracked, nothing secret staged
- Manual: [the 2–5 specific things to click or check for this sprint, at desktop AND 320px]
- [Browser evidence, if the sprint is visible: docs/BROWSER-TOOLS.md, or run the /browser-qa skill.]

Do not guess a command or install a dependency to make a check run. Report any check that cannot run.
CI is .github/workflows/ci.yml (workflow "CI", job "verify"): gitleaks secret scan, install,
typecheck, lint, build. Local green is necessary but not sufficient — the Vercel Preview from the PR
must be tested too.

## Report (at the exit-gate step)
1. Summary of what changed and the scope completed.
2. Files changed.
3. Commands/checks run and exact results.
4. Preview verification — URL, what was tested, desktop and 320px.
5. Risks, open decisions and follow-ups.
6. Branch plus the actual commit/push status (SHAs pushed).
7. Sprint status: the docs/ROADMAP.md row and whether docs/PROJECT-STATUS.md was updated.
~~~

## Before merge

- [ ] The sprint record at `docs/sprint-prompts/[SPRINT_ID]-[SLUG].md` is complete — shipped scope,
      checks and results, deviations and learnings, follow-ups.
- [ ] `docs/PROJECT-STATUS.md` updated and the `docs/ROADMAP.md` row ticked, in the same PR.
- [ ] The PR is open, CI is green, and the Vercel Preview has been tested at desktop and 320px
      (`docs/WORKFLOW.md` §10–§11).
- [ ] **Independent review (D-SYS-1) — mandatory when the sprint touches auth, the approval gate,
      RLS or schema, env handling, security headers or the CSP.** Review the immutable
      `merge-base..head` SHA range; brief from
      [`CODEX-REVIEW-PROMPT-TEMPLATE.md`](./CODEX-REVIEW-PROMPT-TEMPLATE.md), guidance in
      [`docs/CODEX-REVIEW-PROMPT.md`](../CODEX-REVIEW-PROMPT.md);
      save the verdict at `docs/code-reviews/[SPRINT_ID]-[SLUG]-review.md`. **No merge while a
      Blocking finding stands.** Trivial PRs are exempt.
- [ ] Any substantive change made after review → refresh the Preview and review again.
- [ ] Merge is the owner's, not the engine's (`docs/WORKFLOW.md` §12; rollback §13).
