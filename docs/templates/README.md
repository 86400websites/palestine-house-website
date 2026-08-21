# Fill-in templates

Skeletons, not documents. Nothing in this folder describes what Palestine House **is** — each file is a
form someone fills in when a particular moment arrives. The `[BRACKETS]` are the point: they stay brackets
here, forever. **Copy the file out, fill the copy, leave the original alone.**

Installed at **SYS1** from the `Website-Development-System` SOP pack (kept untracked under `docs/`, so it
is not in the published repo — **D-SYS-5**), adapted so every
command, path, doc link and section number matches this repo. The docs map for everything else is
[`docs/README.md`](../README.md).

## What is here

| File | What it is | Who fills it, and when | The filled copy goes to |
|---|---|---|---|
| [`CLAUDE-SPRINT-PROMPT-TEMPLATE.md`](./CLAUDE-SPRINT-PROMPT-TEMPLATE.md) | The standard sprint implementation prompt — scope, allowed files, exit checks | The planner (usually the `/sprint-prompt` skill), **before** the sprint starts | `docs/sprint-prompts/[SPRINT_ID]-[SLUG].md` — see that folder's [README](../sprint-prompts/README.md) |
| [`UI-SPRINT-PROMPT-TEMPLATE.md`](./UI-SPRINT-PROMPT-TEMPLATE.md) | The same, narrowed to **presentation-only** work. No new route, no data, no auth, no config | The planner, before a purely visual sprint | `docs/sprint-prompts/[SPRINT_ID]-[SLUG].md` |
| [`BUG-FIX-PROMPT-TEMPLATE.md`](./BUG-FIX-PROMPT-TEMPLATE.md) | One reproduced bug → one narrow fix → one branch | Whoever briefs the fix, once the bug is reproduced and logged in [`PROJECT-STATUS.md`](../PROJECT-STATUS.md) §7 | The Claude Code session. There is no bug-record folder — the bug's row in §7 and its PR are the record |
| [`CODEX-REVIEW-PROMPT-TEMPLATE.md`](./CODEX-REVIEW-PROMPT-TEMPLATE.md) | The independent-review brief, pinned to an immutable `merge-base..head` SHA range | The engine or owner before review; the reviewer appends the returned findings to the same file | `docs/code-reviews/[SPRINT_ID]-[SLUG]-review.md`. Guidance: [`CODEX-REVIEW-PROMPT.md`](../CODEX-REVIEW-PROMPT.md) |
| [`SPRINT-PLAN-TEMPLATE.md`](./SPRINT-PLAN-TEMPLATE.md) | The sprint itself — goal, scope fence, exit gate | The planner, when a backlog item's turn comes | A sprint row + exit checklist in [`ROADMAP.md`](../ROADMAP.md) §B |
| [`PR-DESCRIPTION-TEMPLATE.md`](./PR-DESCRIPTION-TEMPLATE.md) | The PR body — what changed, why, what was verified | Whoever opens the PR ([`WORKFLOW.md`](../WORKFLOW.md) §10) | The pull request on GitHub. Nothing is stored in the repo |
| [`VERCEL-PREVIEW-TEST-TEMPLATE.md`](./VERCEL-PREVIEW-TEST-TEMPLATE.md) | The deployed-Preview test record, including the **tested head SHA** | The tester, after CI is green and before review/merge ([`WORKFLOW.md`](../WORKFLOW.md) §11) | Linked or pasted in the PR. A new commit means a new head and a fresh record |
| [`SUPABASE-CHANGE-TEMPLATE.md`](./SUPABASE-CHANGE-TEMPLATE.md) | One record per database change — up-SQL, `.down.sql`, RLS, apply order | The engineer shipping the schema change ([`WORKFLOW.md`](../WORKFLOW.md) §14: non-production project first, by hand in the SQL Editor) | `docs/[SPRINT_ID]-[SLUG]-db-change.md` or the PR description — in the same PR as the SQL |
| [`POST-LAUNCH-BACKLOG-TEMPLATE.md`](./POST-LAUNCH-BACKLOG-TEMPLATE.md) | The holding pen for everything that is not the current sprint | **Already instantiated here** (SYS1) | [`../POST-LAUNCH-BACKLOG.md`](../POST-LAUNCH-BACKLOG.md) — which points at [`ROADMAP.md`](../ROADMAP.md) §A, the backlog of record |
| [`NEW-WEBSITE-SETUP-CHECKLIST.md`](./NEW-WEBSITE-SETUP-CHECKLIST.md) | The one-time Setup Gate for a **brand-new** website | **Not applicable to this repo** — Palestine House passed it long before Stage 5. Kept so the docs pack is reusable, with a PH clause per box recording how each was in fact answered | The next project's repo |
| `README.md` | This index | — | — |

## Three system templates that are **not** in this folder

They are Claude Code **skills**, so they live where Claude Code loads them:

| System template | Installed as | Status |
|---|---|---|
| `sprint-prompt.md` | [`.claude/skills/sprint-prompt/SKILL.md`](../../.claude/skills/sprint-prompt/SKILL.md) | Installed — plans a sprint, generates the prompt, and saves the record after merge |
| `close.md` | [`.claude/skills/close/SKILL.md`](../../.claude/skills/close/SKILL.md) | Installed — the end-of-sprint GO / NO-GO check |
| `browser-qa.md` | `.claude/skills/browser-qa/SKILL.md` | **Arrives later in SYS1.** Depends only on the global browser tools already on this machine ([`BROWSER-TOOLS.md`](../BROWSER-TOOLS.md)) |

## Templates that arrive with their modules

Not missing — not yet due. Each lands in the sprint that installs the module behind it:

- **SYS2 (testing launch gate):** `docs/testing-setup/` with its feature-list, test-report and
  morning-check templates → `docs/FEATURE-LIST.md`, `docs/test-reports/`, `tests/e2e/`.
- **SYS3 (error tracking):** `docs/error-tracking/` with its incident and user-update templates →
  `docs/INCIDENT-LOG.md`.

## House rules for this folder

- **Brackets stay.** Never edit a template to record one project's answer — that is what the filled copy
  is for. The one exception is the `NEW-WEBSITE-SETUP-CHECKLIST`, whose PH clauses are deliberately a
  historical record.
- **The verification commands are three:** `pnpm run typecheck` · `pnpm run lint` · `pnpm run build`
  (plus `pnpm run start` for a local production smoke). Always `pnpm` — never `npm` or `yarn`.
- **There is no `test` script.** `package.json` defines exactly `dev`, `build`, `start`, `lint`,
  `typecheck`. A template must never ask anyone to run a suite that does not exist — the Playwright suite
  arrives in **SYS2**.
- **There is no formatting check.** Prettier is waived on this repo (**D-SYS-3**); do not add a
  `format:check` box to anything here.
- **CI is `ci.yml`, workflow `CI`, job `verify`** (**D-SYS-4**) — never `code-check.yml` / "Code Check".
  Branch protection matches the check by name, so the name is load-bearing.
- **No `Commit: YES` / `Push: YES` tokens** (**D-SYS-2**). This project runs on a standing 2026-06-12
  authorization to commit *and* push after every gated sub-step, so the owner reviews live in the open PR.
  Never push to `main`; never merge — the owner merges.
- **Independent review is mandatory for risky sprints** — auth · approval gate · RLS/schema · env ·
  security headers · CSP — over an immutable `merge-base..head` range, with the record saved in
  [`code-reviews/`](../code-reviews/) and no merge while a Blocking finding stands (**D-SYS-1**; trivial
  PRs exempt). [`WORKFLOW.md`](../WORKFLOW.md) §8 still calls review "optional" — D-SYS-1 supersedes that
  for risky sprints. *(The 15 existing records predate the convention and are named
  `[SPRINT_ID]-[SLUG].md`; new ones take the `-review.md` suffix.)*
- **Two viewports, every time:** desktop and **320px** ([`QA-CHECKLIST.md`](../QA-CHECKLIST.md);
  [`WORKFLOW.md`](../WORKFLOW.md) §11).
- **This repo is public.** No emails, personal names, account ids, project refs, credentials,
  partner or applicant identities, gated content or Storage paths in a filled template. Env vars by
  **name** only ([`ENV-VARS-SAFETY.md`](../ENV-VARS-SAFETY.md)).

---

Next step → planning a sprint? Run `/sprint-prompt`. Closing one? Run `/close`. The delivery chain itself
is [`WORKFLOW.md`](../WORKFLOW.md); the security gate is
[`SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) (§15 is blocking).
