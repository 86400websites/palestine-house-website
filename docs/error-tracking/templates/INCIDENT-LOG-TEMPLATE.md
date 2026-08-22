# Incident Log — Palestine House

> **This is the skeleton, not the register.** Copy it to **`docs/INCIDENT-LOG.md`**, which is **seeded in sprint SYS3** and then kept living forever. That file does not exist yet. Keep the `[BRACKETS]` here — they are filled when a row is written, not now.
>
> Guide: [`../ERROR-TRACKING-GUIDE.md`](../ERROR-TRACKING-GUIDE.md) · The skill that fills it: [`/handle-error`](../../../.claude/skills/handle-error/SKILL.md)

**Module state:** installed at **SYS1**, **activated in SYS3**. There is **zero Sentry code in the repository today**, so the "Sentry" door below cannot fire yet — a report from a real person is currently the only door in.

One row per post-launch problem, newest on top. This file is the owner's five-minute weekly glance: everything moving toward Closed, every Closed row complete.

## The two closure rules (enforced, not suggested)

1. **No Closed without a regression test** — the exact bug, reproduced as a permanent test in the launch-gate suite.
   ✅ **The suite shipped at SYS2** — `tests/e2e/`, `docs/FEATURE-LIST.md` and `pnpm run test:e2e` all exist. Every incident earns a permanent regression spec there (and its feature-list line, owner-approved) before its row can move to **Closed**.
2. **No Closed without User informed ✓** — or the recorded reason *"n/a — nobody was affected"*.

## ⚠️ This repository is public

Never put a real person's identity in this file: no email addresses, no names, no account ids, no partner or applicant identities, no Storage object paths, no gated content, no database project refs. Refer to affected people by count and role — *"1 pending partner"*, *"2 approved partners"*, *"1 applicant"*. The identifying detail stays in the owner's private notes and in chat with `/handle-error`; the log carries only what a stranger may read.

**Status:** Investigating → Fixing → Verifying → Closed
**Severity:** Blocker / High / Medium / Low — definitions in [`../ERROR-TRACKING-GUIDE.md`](../ERROR-TRACKING-GUIDE.md) §4
**Door:** Sentry *(from SYS3)* / User report / Morning check *(from SYS2)*
**Surface:** the real one — `/apply` · sign-in or password reset · approval unlock · template download · Ask HQ · a guide page · admin · public page

| # | Date | Door | Surface | What broke — plain words | Who was affected | Severity | Bug or not | Fix (PR / backlog ref) | Regression test | User informed | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 001 | [DATE] | [User report] | [/apply] | [e.g. The application saved but the confirmation email never sent, so the applicant thought nothing had happened] | [1 applicant] | [High] | [Bug] | [PR #__] | [test id / "owed — testing gate pending"] | [✓ DATE / n/a — reason] | [Verifying] |
| 002 | [DATE] | [Sentry] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [Investigating] |

## Patterns corner (reviewed in the weekly glance)

- [Same form, page or flow appearing 3+ times → note it here and ask whether something deeper needs its own sprint.]
- [Repeated "not a bug" access denials → is the pending/approval wait being explained clearly enough on the site? Owner decision, logged.]
- [Repeated email non-delivery on one provider or domain → a deliverability question, not a code question.]

## Where a row goes next

| Severity | Destination |
|---|---|
| Blocker | Fix today. If gated content is exposed or the site is down, revert first — [`../../ROLLBACK.md`](../../ROLLBACK.md) (and [`../../ROLLBACK-RUNBOOK.md`](../../ROLLBACK-RUNBOOK.md) if a migration is involved) |
| High | Bug-fix sprint this week — [`../../templates/BUG-FIX-PROMPT-TEMPLATE.md`](../../templates/BUG-FIX-PROMPT-TEMPLATE.md) |
| Medium / Low | [`../../POST-LAUNCH-BACKLOG.md`](../../POST-LAUNCH-BACKLOG.md) |

Anything touching auth, the approval gate, RLS or schema, env handling, the security headers or the CSP takes a **mandatory independent review** before merge (**D-SYS-1**, [`../../WORKFLOW.md`](../../WORKFLOW.md) §8), with the record saved in [`../../code-reviews/`](../../code-reviews/).
