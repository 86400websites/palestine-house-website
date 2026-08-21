# Post-Launch Backlog — [PROJECT_NAME]

> **Already instantiated here.** Palestine House's copy is [`../POST-LAUNCH-BACKLOG.md`](../POST-LAUNCH-BACKLOG.md),
> written at SYS1 sub-step 1e — and **[`ROADMAP.md`](../ROADMAP.md) §A remains the backlog of record**.
> Nothing in this skeleton decides priority for this project. Fill it fresh only for a **new** project.
> Every `[BRACKET]` stays a bracket.

The single holding pen for everything that is not the current sprint. Copy once per project and keep it
living — on a new project this file *is* the backlog of record. On a project that already keeps its
backlog somewhere else, cross-link to that one place and never duplicate ownership: two backlog homes are
worse than none, because the second one is always the stale one.

## Backlog

Type: feature / fix / improvement · Priority: High / Medium / Low · Effort: S / M / L · Status: Parked /
Ready / Promoted / Done

| Item | Type | Priority | Effort | Source | Status | Notes |
|---|---|---|---|---|---|---|
| [Item name] | [feature] | [High] | [M] | [predev "Later" list / build deferral / post-launch feedback] | Parked | [Context, dependencies, needed-by if any] |
| [Item name] | [fix] | [Low] | [S] | [build deferral — [SPRINT_ID]] | Parked | [Why it was deferred] |
| | | | | | | |

## Intake rules

- [ ] New ideas land HERE, not in the current sprint. The sprint's scope is closed the moment it starts
      ([`WORKFLOW.md`](../WORKFLOW.md) §0 — one sprint at a time, one sprint = one focused branch/PR).
- [ ] Deferred sprint scope arrives with a pointer to its brief
      (`docs/sprint-prompts/[SPRINT_ID]-[SLUG].md`) so context isn't lost.
- [ ] Security hardening deferrals are marked **required-before-scale**, not optional. But **basic**
      public-write abuse control — a server-verified bot check and a rate limit, **failing closed in
      Production** — is launch-blocking and may **not** be parked here
      ([`SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) §8, §13, §15). Only *advanced* hardening
      (tighter limits, anomaly detection) is scale-deferrable.
- [ ] A **bug** is not a backlog item. It goes to [`PROJECT-STATUS.md`](../PROJECT-STATUS.md) §7 with a
      severity.
- [ ] An **unresolved choice** is not a backlog item either. It goes to `PROJECT-STATUS.md` §5 (Open
      decisions) so the owner can settle it, and moves to §4 once settled.
- [ ] Copy is a locked input. An item that changes a user-facing string says so, because it needs the
      owner's sign-off before an engineer touches it — not after.
- [ ] Every item records its **Source**. "Owner asked in passing", "deferred from [SPRINT_ID]", "found
      during QA" and "post-launch partner feedback" need very different amounts of re-validation later.
- [ ] Nothing is deleted. Parked is a status, not a fate; a dropped idea keeps a one-line "why" in Notes.

Why this matters: a trusted backlog is what makes "not now" a safe answer — ideas stop leaking into open
sprints.

## Promotion rule

- [ ] A backlog item becomes work only by being **promoted into a sprint** when its turn comes: scope it
      with the `/sprint-prompt` skill (or [`SPRINT-PLAN-TEMPLATE.md`](./SPRINT-PLAN-TEMPLATE.md) by hand),
      save the brief in `docs/sprint-prompts/`, and add the sprint row to `docs/ROADMAP.md`.
- [ ] On promotion: set Status to **Promoted**, note the `[SPRINT_ID]`, and **re-validate the item against
      the current repo**. Paths, routes and assumptions rot — an old item often describes a surface that no
      longer exists.
- [ ] One sprint at a time — never promote an item into a sprint that is already running.

Never do this: never "quickly slip in" a backlog item mid-sprint because the file is already open, and
never fix a backlog item silently inside an unrelated PR. It ends up unreviewed and undocumented.

---

Next step → when an item's turn comes, scope it into a sprint and add its row to
[`ROADMAP.md`](../ROADMAP.md). The folder index is [`README.md`](./README.md).
