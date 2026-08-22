# Test Report — Palestine House — [YYYY-MM-DD]

> **This is a SKELETON. The `[BRACKETS]` stay brackets in this file, forever.** Copy it out to `docs/test-reports/[YYYY-MM-DD]-test-report.md`, fill the copy, leave this original alone — same rule as [`docs/templates/`](../../templates/README.md).
>
> ✅ **Installed at SYS1 · in use since SYS2 (2026-08-22).** The suite is real (`tests/e2e/`, `pnpm run test:e2e`) and the first report — `docs/test-reports/2026-08-22-test-report.md`, 136/136 green with the owner's signed GO — is the model to follow.

One row per feature from `docs/FEATURE-LIST.md`. Every failure explained in plain words. The newest report is the current truth.

---

## Run header

- **Run type:** **FULL** / **PARTIAL (failed-only re-run)** ← a verdict can only ever come from a FULL run
- **Environment:** Preview URL `[PREVIEW_URL]` · head SHA `[SHA]` · branch `[BRANCH]`
- **Data separation confirmed:** Preview points at the **non-production** Supabase project `[confirmed by whom, how]`
- **Viewports:** desktop + **320px** `[both run — if only one, say so and why]`
- **Roles exercised:** anonymous `[y/n]` · pending partner `[y/n]` · approved partner `[y/n]` · HQ admin `[y/n]`
- **Feature list version:** approved `[DATE]` by `[NAME]` · `[N]` lines
- **Totals:** `[N]` tests → `[N]` PASS · `[N]` FAIL · `[N]` MANUAL pending · `[N]` pending SYS1.5 (untestable today)
- **Real emails sent during this run:** `[N — Preview carries live Resend keys; list what was sent and to which inbox category, never an address]`

## Severity, in plain words

| Severity | Means | Response |
|---|---|---|
| **Blocker** | The approval gate, login, or the whole site is affected — anything that lets the wrong role see gated content, or stops the right role getting in | Nothing ships with one open |
| **High** | A real feature is broken for some users | Fixed before the run is called green |
| **Medium** | Annoying, but the site works | Fix now or next sprint — owner's call, logged |
| **Low** | Cosmetic | Backlog — [`POST-LAUNCH-BACKLOG.md`](../../POST-LAUNCH-BACKLOG.md) |

*(There is no money severity. This site has no payment surface.)*

## Results

| ID | Feature | Result | What happened (plain words) | Severity | Next step |
|---|---|---|---|---|---|
| `[AC-003]` | `[A pending partner is held at the pending state]` | **FAIL** | `[Plain words. What a person would see. No stack traces, no jargon, no route-handler internals.]` | `[Blocker]` | `[Fix sprint ref]` |
| `[PG-001]` | `[Every public page loads with no errors]` | PASS | — | — | — |
| `[MN-001]` | `[Manual line]` | PENDING / PASS | `[Evidence]` | — | `[Who verifies, by when]` |
| `[PR-002]` | `[Rate limit on a public form]` | **N/A — pending SYS1.5** | The control does not exist yet ([`PROJECT-STATUS.md`](../../PROJECT-STATUS.md) §7 #1). **Not a PASS. Not a FAIL. Not tested.** | — | SYS1.5 |
| … | | | | | |

> 🔴 **Never record a PASS for a control that does not exist.** A line whose feature has not shipped is `N/A — pending [SPRINT]`, and it counts against a GO exactly as much as a FAIL does if the sprint that ships it has already merged.

## Failures, grouped

| # | Severity | IDs | One-line summary | Where it lives now |
|---|---|---|---|---|
| 1 | `[Blocker]` | `[IDs]` | `[Plain-words summary]` | `[Fix sprint / PR / PROJECT-STATUS §7 row]` |

## Fix handoff

- Failures grouped into: `[BUG-FIX prompt / sprint ID + link — templates in docs/templates/, process in WORKFLOW.md §6]`
- Anything touching auth, the approval gate, RLS, an RPC or `/admin/*` takes the mandatory independent review — [`WORKFLOW.md`](../../WORKFLOW.md) **§8** (**D-SYS-1**).
- Anything with a security dimension is re-checked against [`SECURITY-CHECKLIST.md`](../../SECURITY-CHECKLIST.md) **§15** before it is called fixed.
- While fixing: re-run failed IDs only. **Before the verdict: full re-run, always.**
- New known issues found here are logged in [`PROJECT-STATUS.md`](../../PROJECT-STATUS.md) §7, not left in this report alone.

---

## Verdict

**GO / NO-GO**

GO requires all four, no exceptions:

1. This report is a **FULL** run on the **current head**.
2. **100%** of automated lines pass, and every manual line has recorded evidence.
3. **No test was skipped, disabled, weakened or edited** without the feature-list change being re-approved and noted in its change log.
4. **No line is sitting at `N/A — pending [SPRINT]` for a sprint that has already merged.**

- **Verdict:** `[GO / NO-GO]` · **Date:** `[DATE]` · **Signed:** `[NAME]` · Full-run report: this file
- **On GO** → record it against [`LAUNCH-CHECKLIST.md`](../../LAUNCH-CHECKLIST.md) → "The two that were never satisfied" → the Launch Gate line, which has never been ticked in this project and is ticked only by a green full run. Then the morning-check selection ([`MORNING-CHECK-TEMPLATE.md`](./MORNING-CHECK-TEMPLATE.md)) — including its open decision.
- **On NO-GO** → open items are listed above; next full run scheduled: `[DATE]`.

## Public-repo rule

🔴 This repository is **public**. A filled report must contain no real person's name or email, no partner or applicant identity, no account id, no Supabase project ref, no credential, no dashboard URL carrying an id, no gated content excerpt and no Storage object path. Describe a failure by what a role saw, not by who saw it.
