# Sprint [SPRINT_ID] — [SPRINT_NAME]

> **This is a skeleton. Every `[BRACKET]` is yours to replace.**
> Fill it, then paste the condensed row into the current stage's table in
> [`docs/ROADMAP.md`](../ROADMAP.md) **§B — Stages & sprints** (deferred work belongs in §A, the
> backlog of record). Those tables are the live plan, and their columns are
> **Sprint · Scope · Exit gate · Depends on**. Keep this long-form version only while the sprint is
> being planned; the permanent record is the sprint prompt at `docs/sprint-prompts/[SPRINT_ID]-[SLUG].md`.
>
> **One sprint at a time.** Never start this sprint while the previous one is unmerged, and never
> bundle two sprints into one branch.
>
> Faster route: run the **`/sprint-prompt`** skill
> ([`.claude/skills/sprint-prompt/SKILL.md`](../../.claude/skills/sprint-prompt/SKILL.md)) — it reads
> `PROJECT-STATUS.md` + `ROADMAP.md` and produces this plan plus the ready-to-run implementation prompt.

## Goal

[One sentence: what this sprint ships, and why it matters now.]

## Scope

1. [Deliverable 1 — concrete and verifiable]
2. [Deliverable 2]
3. [Deliverable 3]

Allowed files/paths: `[EXACT_PATHS]`. Any other path needs owner approval before it is edited.

## Out of scope (each with a forwarding address)

- [Excluded item] → Sprint [SPRINT_ID that owns it]
- [Excluded item] → [`docs/POST-LAUNCH-BACKLOG.md`](../POST-LAUNCH-BACKLOG.md)

## Depends on

- [e.g. "Sprint [SPRINT_ID] merged" · "migration [NNNN] applied to the non-production project" ·
  "owner supplies [SERVICE] account (env var names only)" · "none"]

## Locked inputs

- Copy: `docs/page-copy/[file(s)]` — verbatim (owner-held set, not tracked in git).
- Design: `docs/page-designs/[mockup(s)]` + tokens in [`docs/DESIGN.md`](../DESIGN.md) §3–§4.
- [Schema / architecture: [`docs/TECH-ARCHITECTURE.md`](../TECH-ARCHITECTURE.md) §[N].]
- Proof numbers: **4 sections · 22 focus areas · 88 templates**. Header and footer chrome is locked.

## Risk class (decides the review regime — D-SYS-1)

- [ ] Touches **auth · the approval gate · RLS or schema · env handling · security headers · the CSP**
      → **independent review is mandatory** before merge.
- [ ] None of the above → review optional; a trivial PR is exempt.

## Acceptance criteria (observable, not impressions)

- [ ] [What a tester can see or do — name the role: anonymous · pending partner · approved partner · HQ admin]
- [ ] [Observable behavior 2]
- [ ] [Observable behavior 3]

## Exit gate (every box before merge)

- [ ] `pnpm run typecheck`, `pnpm run lint`, `pnpm run build` green locally; CI green
      (`.github/workflows/ci.yml`, workflow **CI**, job **verify** — gitleaks scan, install,
      typecheck, lint, build). No automated test suite yet — it arrives in sprint **SYS2**.
- [ ] Vercel Preview from the PR tested at `[HEAD_SHA]` — **desktop and 320px**
      ([`docs/WORKFLOW.md`](../WORKFLOW.md) §11)
- [ ] Every [`docs/SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) section the diff touches
      re-checked — **always §15** (blocking invariants) once auth is involved; §5 RLS · §6
      auth/session · §8 Route Handlers and abuse controls · §13 production deployment
- [ ] Copy verbatim from the approved source; design matches the mockups and `DESIGN.md` tokens;
      locked numbers correct (4 · 22 · 88)
- [ ] No new console errors and no hydration warnings
- [ ] [Schema sprints only] up-SQL **and** `.down.sql` **and** RLS policies in the PR; applied by
      hand to the **non-production** Supabase project first and verified there; production applied
      by the owner (`WORKFLOW.md` §14)
- [ ] [`docs/PROJECT-STATUS.md`](../PROJECT-STATUS.md) updated and the `ROADMAP.md` row ticked, in
      the same PR
- [ ] [Risky sprints — D-SYS-1] Independent review of the immutable `[MERGE_BASE_SHA]..[HEAD_SHA]`
      range returned approve; verdict saved at `docs/code-reviews/[SPRINT_ID]-[SLUG]-review.md`;
      **no merge while a Blocking finding stands**
- [ ] No substantive change after approval — otherwise the Preview and the review are repeated
- [ ] The sprint record at `docs/sprint-prompts/[SPRINT_ID]-[SLUG].md` is complete

## Branch

`claude/sprint-[SPRINT_ID]-[short-slug]`

## Status

[Not Started · In Progress · Blocked · Ready for Review · Merged · Done · Not Applicable (reason required)]
— [DATE]

---

## The ROADMAP.md row (paste this)

Condense the above into one row of the current stage's table in §B. Keep the four columns exactly:

```markdown
| **[SPRINT_ID] — [SPRINT_NAME]** *(one-line qualifier, e.g. docs + config only)* | [Scope: the numbered deliverables in prose, with the excluded items and their forwarding addresses.] | [Exit gate: the observable conditions, semicolon-separated, ending with the checks and the review requirement.] | [Sprint that must be merged first, or "none"] |
```

When the sprint closes, edit the row in place — mark it **✅ MERGED as PR #[N], [DATE]** with the
branch name and the resulting `main` SHA, exactly as the Stage 4 rows do. The row is the history;
do not delete it.

Next step → write the implementation prompt with
[`CLAUDE-SPRINT-PROMPT-TEMPLATE.md`](./CLAUDE-SPRINT-PROMPT-TEMPLATE.md).
