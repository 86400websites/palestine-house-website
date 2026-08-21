# New Website Setup Gate — [PROJECT_NAME]

> ## ⛔ Not applicable to this repo — kept on purpose
>
> This is the Setup Gate for a **brand-new** website: the one-time run that creates a safe delivery
> foundation before Stage 0 builds anything. **Palestine House is years of sprints past it.** The site has
> been live since **2026-06-19** and is in **Stage 5** (system adoption & operations). Nothing in this file
> is an open action item here — do not "work through" it.
>
> It is installed anyway because the `Website-Development-System` copy map expects every template in
> `docs/templates/`, and a docs pack that is missing a file is not reusable. When this repo is cloned as the
> starting point for the next site, this gate runs first.
>
> **Every `[BRACKET]` below stays a bracket.** The person setting up the *next* site fills them. What the
> **PH:** clauses do is different: they record how Palestine House already answered each box, so this file
> doubles as the evidence that the gate was in effect satisfied here. One box is **not** verifiable from
> this machine and says so.

Run once after the signed predevelopment GO gate. This gate creates the safe delivery foundation; Stage 0
builds the actual barebones website afterward.

---

## 1. Confirm the handoff

- [ ] The predevelopment pack's final wireframes/mockup file carries a signed **GO** verdict.
- [ ] The handoff table links the approved client answers, research, features/flows/build plan, design
      system, sitemap, page plans/copy, and wireframes.
- [ ] No missing decision, content dependency, account, integration, or policy blocks stack selection or
      Stage 0.

**PH:** satisfied outside this repo. The approved inputs are the owner's copy set (`docs/page-copy/`,
untracked here — the OneDrive master is canon), the high-fidelity mockups and bound design system
(`docs/page-designs/`, untracked for the same reason), and the locked sitemap inside it at
`docs/page-designs/content/PH_Sitemap_Architecture_TECH.txt`. None of those three paths exist in a fresh
clone; the OneDrive working copy is where they live. The rule that survived is the one in
[`CLAUDE.md`](../../CLAUDE.md): copy and design are **locked inputs**, and a conflict between copy, mockup
and sitemap becomes an Open decision in [`PROJECT-STATUS.md`](../PROJECT-STATUS.md) §5 — never a silent pick.

## 2. Initialize and protect GitHub

- [ ] Create `[REPO_NAME]` on GitHub, initialized with a minimal README so `main` exists.
- [ ] Protect `main` immediately: Pull Request required, required CI checks, no direct or force pushes.
- [ ] Clone the repo and create `[SETUP_BRANCH]` from the latest `main`.
- [ ] Record the branch owner; one worker per branch.

There is no direct-push exception for the scaffold or docs pack.

**PH:** the repo exists and `main` is the protected, production-ready branch by rule
([`WORKFLOW.md`](../WORKFLOW.md) §3, §15). One sprint = one branch = one PR (§0). **The one box that cannot
be confirmed from here:** branch protection is a **GitHub repository setting**, not a file on disk, and this
machine has no `gh` CLI — so no agent can verify it. [`TECHNICAL-INTEGRITY.md`](../TECHNICAL-INTEGRITY.md)
carries it as an outstanding **owner action** in SYS1, on the principle that an unverified gate is the same
as no gate. Whoever ticks this box for the next project must tick it from the GitHub settings screen.

## 3. Copy a self-contained docs pack

- [ ] The system's `README-TEMPLATE.md` → repo root as `README.md`.
- [ ] `CLAUDE.md` and `AGENTS.md` → repo root.
- [ ] Core development Markdown, including the two prompt guides (`SPRINT-PROMPT-TEMPLATE.md` and
      `CODEX-REVIEW-PROMPT.md`) → `docs/`.
- [ ] The system's `templates/` folder, **except the three Claude skills below** → `docs/templates/`.
- [ ] `templates/sprint-prompt.md`, `templates/close.md` and `templates/browser-qa.md` →
      `.claude/skills/sprint-prompt/SKILL.md`, `.claude/skills/close/SKILL.md` and
      `.claude/skills/browser-qa/SKILL.md` (rename each to `SKILL.md`) so Claude Code loads them.
- [ ] `testing-setup/` → `docs/testing-setup/`; its skill → `.claude/skills/activate-testing/SKILL.md`. Run
      its own `SETUP-CHECKLIST.md` when development completes, before launch.
- [ ] `error-tracking/` → `docs/error-tracking/`; its skill → `.claude/skills/handle-error/SKILL.md`. Run
      its own `SETUP-CHECKLIST.md` before launch.
- [ ] Confirm the **global browser tools** are present on this machine (Playwright MCP at user scope;
      `agent-browser` responds in a terminal) — nothing to install per project; see
      [`BROWSER-TOOLS.md`](../BROWSER-TOOLS.md). Do **not** add Playwright to the project `.mcp.json`.
- [ ] Put the approved copy and the locked-facts table where this project's agents will read them, and say
      in `CLAUDE.md` exactly where that is. It is the build engine's canonical content source, implemented
      verbatim.
- [ ] Create `docs/sprint-prompts/` and `docs/code-reviews/` with their first real record; do not rely on
      empty folders surviving Git.

**PH:** done, in pieces, over the life of the project — the root `README.md` and this `docs/templates/`
folder landed at **SYS1**. [`CLAUDE.md`](../../CLAUDE.md) and [`AGENTS.md`](../../AGENTS.md) sit at the root;
the eleven core guides are mapped in [`docs/README.md`](../README.md); both record folders hold real
records ([`sprint-prompts/`](../sprint-prompts/), [`code-reviews/`](../code-reviews/)). Skills:
`sprint-prompt` and `close` are installed, `browser-qa` arrives later in SYS1. **`docs/testing-setup/`
arrives with SYS2** and **`docs/error-tracking/` with SYS3** — do not expect either today. The copy box is
this project's one deliberate deviation (**D-SYS-8**): the copy canon lives on OneDrive and
`docs/page-copy/` is untracked here, so new user-facing strings follow the brand-voice rules inline rather
than the system's in-repo copy-file routing. A **new** project should take the system's route, not this one.

## 4. Lock decisions before scaffolding

- [ ] Fill `docs/TECH-ARCHITECTURE.md` from the approved predevelopment files: actual stack, versions,
      package manager, commands, routes/shells, host/Preview, data/auth decision, env **names**, and
      rollback action.
- [ ] Fill `docs/DESIGN.md` from the approved design system and wireframes.
- [ ] Fill `docs/ROADMAP.md`; the Setup Gate precedes Stage 0.
- [ ] Fill `docs/PROJECT-STATUS.md` with current stage, branch, next action, blockers, and record paths.
- [ ] Customize `README.md`, `CLAUDE.md` and `AGENTS.md`.
- [ ] Search the governing files for unresolved `[BRACKETED_PLACEHOLDERS]`; resolve each, or mark it
      explicitly `N/A — reason`.

**PH:** all four are filled and living — [`TECH-ARCHITECTURE.md`](../TECH-ARCHITECTURE.md) is the source of
truth when docs disagree, [`DESIGN.md`](../DESIGN.md) holds the token values,
[`ROADMAP.md`](../ROADMAP.md) holds the stage/sprint plan with exit gates, and
[`PROJECT-STATUS.md`](../PROJECT-STATUS.md) is updated **in the same PR** that completes a sprint.

## 5. Scaffold on the setup branch

- [ ] Scaffold only the locked `[TECH_STACK]` with `[PACKAGE_MANAGER]`; do not add optional product
      features.
- [ ] Create `.env.example` with names and unmistakably fake placeholders only.
- [ ] The owner may create the local live env file outside the AI workflow. Agents never open, print, copy
      or edit it.
- [ ] Verify the live env filename is ignored **without opening it** (`git check-ignore .env.local`) and is
      neither tracked nor staged.
- [ ] Run the verification commands. In this repo they are `pnpm run typecheck`, `pnpm run lint` and
      `pnpm run build` (plus `pnpm run start` for a local production smoke). There is **no test command** —
      **SYS2 — no suite yet**.

**PH:** the locked stack is Next.js 15 (App Router) · TypeScript strict · **pnpm** (version pinned by
`packageManager` in `package.json`) · Tailwind v4 · shadcn/ui · Framer Motion · react-hook-form + zod ·
Supabase via `@supabase/ssr` · Vercel. `.env.example` is committed with **names only**; `.env.local` is
gitignored and no agent opens it ([`ENV-VARS-SAFETY.md`](../ENV-VARS-SAFETY.md)). **There is no `test`
script — "SYS2 — no suite yet."** `package.json` defines exactly
`dev`, `build`, `start`, `lint`, `typecheck`; never write a prompt or checklist that assumes another.

## 6. Configure CI and the deployed Preview

- [ ] Stand up the automated code check per [`TECHNICAL-INTEGRITY.md`](../TECHNICAL-INTEGRITY.md) — locked package
      manager and version, the checks that file names, plus secret scanning. Pick the workflow name once
      and keep it.
- [ ] The owner enables branch protection on `main` requiring that check **by its exact displayed name**.
      GitHub matches required checks by name string: rename the workflow or job without re-pointing the
      rule in the same sitting and either the merge button locks forever or the gate silently disappears.
- [ ] Connect `[HOSTING_PROVIDER]` to GitHub. The supplied profile is Vercel; another host must provide
      equivalent isolated PR Previews.
- [ ] Confirm PR branches create Previews and only `main` deploys Production.
- [ ] Record env **names** and scopes; the owner sets values in the provider dashboard. Never copy
      Production credentials into Preview.
- [ ] Prove the Preview pipeline on `[SETUP_BRANCH]` before merge.

**PH:** CI is [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — workflow **`CI`**, job
**`verify`**, displayed as `Install · Typecheck · Lint · Build`. It runs on every PR to `main`: gitleaks
secret scan over full history → Corepack → Node 22 → `pnpm install --frozen-lockfile` → `pnpm run
typecheck` → `pnpm run lint` → `pnpm run build`. It is deliberately **not** renamed to `code-check.yml` /
"Code Check" (**D-SYS-4**), for exactly the name-matching reason in the box above. There is **no formatting
check** — Prettier is waived here (**D-SYS-3**), so do not add one to this or any other template. Vercel is
connected: every PR gets a Preview, only `main` deploys Production, and env names live in `.env.example`
and [`SUPABASE-VERCEL-SETUP.md`](../SUPABASE-VERCEL-SETUP.md) with values set by the owner in the Vercel
dashboard.

## 7. Optional data/auth profile

- [ ] Record `None` if the approved architecture has no database or auth.
- [ ] If Supabase is selected, follow [`SUPABASE-VERCEL-SETUP.md`](../SUPABASE-VERCEL-SETUP.md): isolated
      non-production and Production projects, public/publishable values only in browser code, RLS before
      user data.
- [ ] If a coding agent will use **Supabase MCP**, follow
      [`SUPABASE-MCP-SAFETY.md`](../SUPABASE-MCP-SAFETY.md): connect non-production first; production MCP
      stays disconnected unless a read-only exception is explicitly approved and recorded.
- [ ] If another provider is selected, document its equivalent isolation, access controls, migrations and
      recovery plan in `TECH-ARCHITECTURE.md`.

**PH:** Supabase, with a non-production **TEST** project and a **PRODUCTION** project. Migrations are
applied **by hand in the Supabase SQL Editor, non-production first**
([`WORKFLOW.md`](../WORKFLOW.md) §14), and every schema change ships **up-SQL + `.down.sql` + RLS policies
in the PR** — record it with [`SUPABASE-CHANGE-TEMPLATE.md`](./SUPABASE-CHANGE-TEMPLATE.md). RLS is
default-deny on every user-reachable table; controlled reads go through hardened `SECURITY DEFINER` RPCs
([`SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) §5). The MCP exception **is** taken and **is**
recorded: `supabase-test` is read/write, `supabase-prod-readonly` is read-only, and nothing writes to
production through any channel.

## 8. Pass the setup PR through the full chain

- [ ] Review the changed-file list; only setup, scaffold and governing-doc files changed.
- [ ] Local checks pass and no live env file or secret-like value is in the diff
      ([`WORKFLOW.md`](../WORKFLOW.md) §9).
- [ ] Commit and push under this project's recorded authorization — see the PH clause below.
- [ ] Open the setup PR; CI passes ([`WORKFLOW.md`](../WORKFLOW.md) §10).
- [ ] Test the deployed Preview and record its tested head SHA
      ([`VERCEL-PREVIEW-TEST-TEMPLATE.md`](./VERCEL-PREVIEW-TEST-TEMPLATE.md),
      [`WORKFLOW.md`](../WORKFLOW.md) §11). Desktop **and** 320px.
- [ ] Independent review runs over the **immutable merge-base..head SHA range** and returns Approve; the
      record is saved at `docs/code-reviews/[SPRINT_ID]-[SLUG]-review.md`.
- [ ] The owner confirms the head has not changed, merges, and runs the Production smoke test
      ([`WORKFLOW.md`](../WORKFLOW.md) §12; rollback is §13).

**PH — read this box before you copy the system's wording anywhere.** The system gates every commit and
push behind `Commit: YES` / `Push: YES` tokens in the filled task prompt. **This project does not use those
tokens (D-SYS-2).** A **standing authorization dated 2026-06-12** commits *and* pushes after every gated
sub-step, so the owner reviews the work live in the open PR rather than at the end. Never push to `main`,
never merge — the owner merges. Independent review is **mandatory for risky sprints** (auth · approval
gate · RLS/schema · env · security headers · CSP) with no merge while a Blocking finding stands
(**D-SYS-1**); trivial PRs are exempt. Note that [`WORKFLOW.md`](../WORKFLOW.md) §8 still describes review
as "optional" — D-SYS-1 supersedes that wording for risky sprints.

---

## Exit condition

The protected repo, governing docs, CI, Preview pipeline and rollback path are ready. No product feature is
claimed complete. Begin Stage 0 in `docs/ROADMAP.md`: the smallest complete website with its primary
journey working end to end.

**Next:** plan the first sprint with the `/sprint-prompt` skill, or fill
[`CLAUDE-SPRINT-PROMPT-TEMPLATE.md`](./CLAUDE-SPRINT-PROMPT-TEMPLATE.md) by hand into
`docs/sprint-prompts/[SPRINT_ID]-[SLUG].md`. The folder index is [`README.md`](./README.md).
