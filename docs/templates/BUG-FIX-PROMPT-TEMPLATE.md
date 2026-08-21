# Bug Fix Prompt — [SHORT_BUG_NAME]

> **This is a skeleton. Every `[BRACKET]` is yours to replace.**
> One reproduced bug, one narrow fix, one branch. For a whole sprint use
> [`CLAUDE-SPRINT-PROMPT-TEMPLATE.md`](./CLAUDE-SPRINT-PROMPT-TEMPLATE.md); for purely visual work use
> [`UI-SPRINT-PROMPT-TEMPLATE.md`](./UI-SPRINT-PROMPT-TEMPLATE.md).
>
> There is no bug-record folder: the bug's row in [`docs/PROJECT-STATUS.md`](../PROJECT-STATUS.md) §7
> and its PR description are the record (`docs/WORKFLOW.md` §10). Only a fix substantial enough to
> carry lessons earns a narrative record in `docs/sprint-prompts/`, as a few ad-hoc ones there do.

~~~text
You are my senior engineer for the Palestine House website, working in Claude Code.
CLAUDE.md governs this task.

## Problem
[Paste the bug, the error text, or the wrong behavior exactly as observed. Do not summarize it away.]

- Observed: [what actually happens]
- Expected: [what should happen]
- Where: [route / component / RPC / flow, e.g. /apply, the reader at /{section}/{topic}/guide]
- Who it affects: [anonymous · pending partner · approved partner · HQ admin — say which]
- Environment: [local dev · Vercel Preview · Production] · [desktop · 320px · both]

Reproduction:
1. [step]
2. [step]
3. [step]

Evidence:
- [redacted error text, CI output, screenshot path, or Preview URL]
- First seen: [DATE / PR / unknown]

Redact before pasting: credentials, tokens, session cookies, private URLs, Supabase project refs,
partner or applicant identities, any personal data, and any live env value. This repo is PUBLIC.

## Goal
Reproduce the defect, find its true root cause, and make the smallest verified fix.

## Read first
- CLAUDE.md
- docs/PROJECT-STATUS.md — §5 open decisions, §7 known issues (is this already logged?)
- docs/BROWSER-TOOLS.md — how to drive the site to reproduce a UI or flow bug
- [the relevant source, copy, architecture or security files]
- [docs/SECURITY-CHECKLIST.md §[N] — if the bug is anywhere near auth, the approval gate, RLS,
  public writes or headers. §5 RLS · §6 auth/session · §8 Route Handlers and abuse controls ·
  §13 production deployment · §15 blocking invariants]

## Branch and files
- Branch: claude/fix-[short-slug], created from the latest main.
- Confirm the branch and inspect git status before editing. Preserve existing user changes — never
  reset, stash or discard work.

Inspect:
- [exact file/path]

Allowed to change:
- [exact file/path]

If another file is needed, stop and explain why before editing it.

## Task
1. Reproduce the failure first, or state precisely why it cannot be reproduced and what you did
   instead. Do not fix a bug you have not seen fail.
2. Debug the check as hard as the product: before believing a failing probe, confirm the probe
   itself is right. A green check is a claim about the instrument as much as about the code.
3. Explain the root cause in plain English BEFORE editing — the actual mechanism, not the symptom
   and not a plausible-sounding guess.
4. Propose the smallest safe fix and the files it touches.
5. Mode: [DIAGNOSE ONLY / IMPLEMENT AFTER THE OWNER SAYS "proceed" / IMPLEMENT NOW]
6. Re-run the exact reproduction after the fix and confirm the failure is gone.

## Constraints
- No unrelated refactors, cleanup, renames, formatting or drive-by improvements.
- Preserve every behavior not named in Expected.
- Do not change routing, config, copy, env handling, schema, auth, the approval gate or security
  behavior unless the bug is genuinely in that area and the allowed file list covers it.
- If the real fix needs broader or destructive work, stop and report the required scope — do not
  quietly expand into it.
- A schema fix ships up-SQL + the matching .down.sql + RLS policies in the PR and is applied by hand
  to the NON-PRODUCTION Supabase project first (docs/WORKFLOW.md §14, docs/SUPABASE-MCP-SAFETY.md).
  Never write to production through any channel.

## Safety
- Never open, read, copy, print or modify .env.local or any other live-value env file. Env variable
  names only.
- Never hardcode or echo a secret. If you suspect a leak, report the file, line and secret TYPE only,
  and tell the owner to rotate it.
- Stage explicit paths; never `git add -A` in this repo.

## Verification
- Typecheck: pnpm run typecheck
- Lint: pnpm run lint
- Production build: pnpm run build
- [Local production smoke, if the bug is in rendering or a route: pnpm run start]
- Automated tests: the fixed bug earns a **permanent regression spec** in `tests/e2e/` (its line
  added to `docs/FEATURE-LIST.md` for owner approval), and the affected specs re-run against the
  deployed Preview: `pnpm run test:e2e` with `PLAYWRIGHT_BASE_URL` set. (No Prettier/format check
  exists here — D-SYS-3.)
- Reproduction: run the exact steps above before the fix (fails) and after the fix (passes)
- Surrounding flow: [the 2–4 things nearest the fix that must still work], at desktop and 320px
- git status — .env.local untracked, nothing secret staged

Regression test: a permanent automated test is added once the Playwright suite exists (sprint SYS2,
tests/e2e/). Until then, write the reproduction down in the report as the manual regression check,
precisely enough that someone else can re-run it, and add it to the SYS2 feature list if the bug is
worth a permanent test.

Do not guess a command or install a dependency to make a check run. CI is .github/workflows/ci.yml
(workflow "CI", job "verify"): gitleaks secret scan, install, typecheck, lint, build.

## Commit and push authorization — D-SYS-2 (this project does not use per-prompt YES/NO tokens)
A standing owner authorization (2026-06-12) commits AND pushes to the task branch, so the owner
reviews live in the open PR. Task branch only: never push to main, never merge, never force-push,
never `--no-verify`. In DIAGNOSE ONLY mode, change nothing.

## Report
1. Root cause — the mechanism, in plain English.
2. Fix summary — what changed and why that closes the root cause.
3. How it was reproduced BEFORE the fix, and how the same steps behaved AFTER.
4. Files changed.
5. Commands/checks run and exact results.
6. Surrounding-flow and Preview verification (desktop + 320px).
7. Risks, follow-ups, and the manual regression check to carry into SYS2.
8. Branch plus the actual commit/push status (SHAs pushed).
9. Bookkeeping: whether docs/PROJECT-STATUS.md §7 (known issues) or
   docs/POST-LAUNCH-BACKLOG.md needs updating.
~~~

## Before merge

- [ ] The fix is reproduced as fixed on the Vercel Preview from the PR, not only locally
      (`docs/WORKFLOW.md` §11).
- [ ] Root cause and fix summary are in the PR description.
- [ ] **Independent review (D-SYS-1) is mandatory if the fix touches auth, the approval gate, RLS or
      schema, env handling, security headers or the CSP** — immutable `merge-base..head` range,
      brief from [`CODEX-REVIEW-PROMPT-TEMPLATE.md`](./CODEX-REVIEW-PROMPT-TEMPLATE.md)
      (guidance: [`docs/CODEX-REVIEW-PROMPT.md`](../CODEX-REVIEW-PROMPT.md)), verdict saved at
      `docs/code-reviews/[SLUG]-review.md`, no merge while a Blocking finding stands. A genuinely
      trivial fix is exempt.
- [ ] Any substantive change after review → refresh the Preview and review again.
- [ ] If the bug was logged in `docs/PROJECT-STATUS.md` §7, close it there in the same PR.
