# Codex Review Guide

> How to commission the independent code review for the Palestine House website: **when** it is required, **how** to scope it so the verdict means something, and **where** the record is saved. It does not contain the review prompt. Two review assets already exist and this guide points at them instead of competing with them.

## 1. Do not write a new review prompt

The reviewer's rules already live in the repo. Reuse them.

| Asset | What it is | Who reads it |
|---|---|---|
| [`AGENTS.md`](../AGENTS.md) (repo root) | **The canonical reviewer policy.** Review style (serious issues only), the seven review priorities, the security / App Router / Supabase / Vercel checks, and the 🔴 **Palestine House gating checks** — any failure of which is blocking. It also states what an agent may and may not change. | The reviewer, first, in full |
| [`.claude/skills/sprint-prompt/SKILL.md`](../.claude/skills/sprint-prompt/SKILL.md) **section F** | The standing review-prompt body this project has actually used since S3 — [`code-reviews/s3-auth-complete.md`](./code-reviews/s3-auth-complete.md) and [`code-reviews/s5-content-schema.md`](./code-reviews/s5-content-schema.md) carry it near-verbatim. Short, and it works because it delegates: *read `AGENTS.md`, review the diff only, serious issues only, any gating-check failure is blocking, return findings + a merge recommendation, make no changes.* | The person commissioning the review, to copy |
| [`docs/templates/CODEX-REVIEW-PROMPT-TEMPLATE.md`](./templates/CODEX-REVIEW-PROMPT-TEMPLATE.md) | The fill-in brief that wraps section F with the PR facts: repo, PR, immutable SHA range, sprint record, expected changed paths, non-goals, check commands, CI and Preview evidence, and the returned-record format. | The person commissioning the review, to fill |

So the commissioning act is: take section F, wrap it in the brief, fill the brief from real repo facts, save it, send it. Nothing here authorises a second, hand-written prompt with its own rules.

**The brief supplies facts. It never grants permission.** It cannot authorise the reviewer to edit, stage, commit, push, merge, install a dependency, apply a migration, or write to the production Supabase project. Those limits are `AGENTS.md`'s and they are not negotiable per-PR.

## 2. When a review is required (D-SYS-1)

Owner decision D-SYS-1, taken 2026-08-21 and recorded in [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §4 with the audit finding behind it in [`notes/system-compliance-audit-2026-08-21.md`](./notes/system-compliance-audit-2026-08-21.md):

> **Independent review is MANDATORY for risky sprints.** A sprint is risky if its diff touches any of:
>
> - **auth** — sign-in/up, session, password reset, redirect handling
> - **the approval gate** — `profiles.is_approved`, any gated route, any platform RPC, the `admins` check
> - **RLS or schema** — any file under `supabase/sql/`
> - **env handling** — new or changed env vars, anything reading a server-only secret
> - **security headers or CSP** — `next.config.ts` headers, `src/middleware.ts`
>
> **Trivial PRs are exempt.** Copy-only edits, a docs commit, an isolated style fix.
>
> The verdict is **the verdict of record**, not an opinion: **no merge while a Blocking finding stands.**

Two consequences worth stating plainly:

- A sprint that starts trivial and grows into one of the five categories becomes a risky sprint. Judge the diff, not the plan.
- "The engine reviewed its own diff at the exit gate" is not this review. Self-review is required by `CLAUDE.md` and is separate.

> **Wording note — resolved.** [`WORKFLOW.md`](./WORKFLOW.md) §8 and the `/sprint-prompt` skill both called the review optional until SYS1 sub-steps 1h and 1g rewrote them. They now agree with this guide: mandatory on a risky diff. §8 is the binding statement. Where the older "optional" wording still appears, **D-SYS-1 governs.**

## 3. Why it is not optional here

This is not a precaution borrowed from a generic SOP. In this repo the independent review has repeatedly returned BLOCKING and been right. From the change log in [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §8 and the Stage 4 rows in [`ROADMAP.md`](./ROADMAP.md):

- **S2** — one blocking finding: an applicant could insert their own `applications` row pre-set to `status='approved'`. Fixed by migration `0007`.
- **S3** — one blocking finding in `safe-redirect.ts`: `resolveSafeOrigin` trusted the raw `x-forwarded-proto`, producing an attacker-origin redirect from a forged header pair. Record: [`code-reviews/s3-auth-complete.md`](./code-reviews/s3-auth-complete.md).
- **S5** — two blocking gate gaps, both real: a gated read that did not re-check approval, and a DELETE verb that was ownership-only while insert/update required approval. Fixed by a new migration `0016`, because the earlier ones were already applied to production and immutable.
- **S11** — one blocking finding: `admin_remove_admin` counted admins without locking the table, so two admins removing each other concurrently could both pass the last-admin guard and empty the table. A TOCTOU race that serial-only reasoning had missed.
- **PP6b** — BLOCKING, four findings, all correct, all fixed on branch. The critical one deleted a legitimate heading from an owner's guide — content loss in the one function that edits an owner's words — and the sprint's own test suite had missed it because the test paired a heading with a *different* section's label, which was never the dangerous case. **This round is also the one time the range was pinned properly:** `8fbff9d..e49d243`.
- **PP6c** — BLOCKING, 11 blocking + 4 medium. The finding that needed the owner: a spec file carrying all 22 approval-gated guide bodies had been **tracked in public git** since a PP6b commit. PP6c merged as PR #85 with `0030` applied to TEST only, deliberately leaving production untouched, *because* the review had rejected the destructive tooling.
- **PP7** — review rounds 4 and 5, both BLOCKING. Round 4's worst finding: the production cutover runbook instructed the owner to run three scripts against production while all three hard-refused a production target — the documented procedure could not be executed, and one step would have flipped TEST while the operator believed it was production. That round is what forced the full rehearsal on TEST.
- **PP8** — step **8-k ran three review rounds** (`b7d7f4e`, `ea471ea`, `c7d8333`). One of them caught that a shipped fix was right for a **wrong recorded reason**: awaiting a gated RPC does *not* stop a route segment streaming ahead of a parent layout's `redirect()`. Five more `/admin` pages awaited gated round-trips and still leaked their headings to anonymous callers. The gating check in `AGENTS.md` now says the check must **throw before it constructs any JSX** — a gate is a throw, not an await.

That is the case for D-SYS-1 in one line: on this codebase, on risky work, the independent pass has found things the builder and the builder's own tests did not.

## 4. Scope it to an immutable SHA range

This is the discipline the repo has been missing. The compliance audit found it directly: the SOP pins every review to a merge-base..head range, and this repo's governing docs carried no such rule at all. Practice landed on it once, at PP6b, where the change log records the round as pinned to `8fbff9d..e49d243`.

**A branch name is not a range. `main..branch` is not a range either — both ends move.** `main` advances when another PR merges. The branch advances the moment the builder pushes a fix. A verdict against a moving target approves something nobody can reconstruct.

Compute and record both ends before sending the brief:

```bash
git fetch origin
git merge-base origin/main <branch>   # the merge-base SHA
git rev-parse <branch>                # the head SHA
```

Then paste both into the brief as an explicit range, and sanity-check what it actually contains:

```bash
git log  --oneline <merge-base>..<head>
git diff --stat     <merge-base>..<head>
```

Rules that follow from the range:

1. **The reviewer confirms the range first.** Both SHAs must resolve and the changed-file list must match the "expected changed paths" line in the brief. A mismatch is reported and the review stops — it is not quietly re-scoped.
2. **CI and Preview evidence must belong to that head.** A green CI run and a tested Vercel Preview from an earlier commit are not evidence for this one.
3. **Approval does not carry forward.** Any substantive change after the reviewed head invalidates the verdict: re-run the checks, refresh and re-test the Preview, and commission a review of the **new** immutable head. "It was only a small fix" is exactly the case this rule exists for.
4. **One documented exemption:** a commit whose only content is appending the returned review record. Record the reviewed head and the documentation-only scope in the record itself, and it does not need a re-review.
5. **Before merging, confirm the reviewed head is still the PR head.**

## 5. Prepare the review

Do this after local checks are green, the PR is open, CI has passed, and the Vercel Preview has actually been tested — not before. See [`WORKFLOW.md`](./WORKFLOW.md) §9 (local), §10 (PR) and §11 (Preview).

- [ ] Create `docs/code-reviews/<sprint-id>-<slug>-review.md` and put the filled brief in it.
- [ ] Fill: repo, PR number and URL, branch (context only), sprint record path under [`sprint-prompts/`](./sprint-prompts/), expected changed paths, and **explicit non-goals** — what this sprint deliberately did not do.
- [ ] Record the **merge-base SHA** and the **head SHA** from §4 as an explicit range.
- [ ] Record the CI result for that head: workflow **CI** ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)), job **`verify`** — gitleaks secret scan, `pnpm install --frozen-lockfile`, typecheck, lint, build.
- [ ] Record the **Vercel Preview** URL and what was tested on it, at that head, desktop **and** 320px.
- [ ] Supply the exact read-only commands:

  ```bash
  pnpm run typecheck
  pnpm run lint
  pnpm run build
  ```

  The Playwright suite (`pnpm run test:e2e`, since SYS2) is **not a review command**: it needs a deployed Preview URL and the robot credentials, which a reviewer does not have — "Tests: run by the build side against the Preview" is the honest entry. Prettier / `format:check` is **waived** for this repo (D-SYS-3), so it is not a review command either.
- [ ] List **owner-authorized exceptions** — anything the reviewer would otherwise flag: a deliberate deviation, a finding logged unfixed, a known issue from `PROJECT-STATUS.md` §7.
- [ ] Record the **database / migration state** when the sprint touches `supabase/sql/`: which migration production is on, which migrations are applied where, and that migrations here are applied **by hand in the Supabase SQL Editor, non-production project first** ([`WORKFLOW.md`](./WORKFLOW.md) §14). Applied migrations are immutable; a fix is a new migration.
- [ ] Point the reviewer at the context it needs: `AGENTS.md`, the sprint record, `PROJECT-STATUS.md` §1/§7, the active `ROADMAP.md` row, and the relevant sections of [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) (§5 RLS · §6 auth/session · §8 API routes and abuse controls · §15 blocking invariants), [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md), and [`SUPABASE-MCP-SAFETY.md`](./SUPABASE-MCP-SAFETY.md).

**Safety lines that go in every brief, unweakened.** They restate — never soften — [`AGENTS.md`](../AGENTS.md) § *Secrets & `.env.local` rules* and [`SUPABASE-MCP-SAFETY.md`](./SUPABASE-MCP-SAFETY.md); if the two ever differ, those files win:

- Never open, read, echo or copy `.env.local`. `.env.example` holds names and placeholders only. If a secret is suspected, report the file, line and secret type — never the value — and recommend rotation.
- Env vars and third-party services by **name** only.
- The production Supabase project is **read-only** from here; never write to production through any channel ([`SUPABASE-MCP-SAFETY.md`](./SUPABASE-MCP-SAFETY.md)).
- This GitHub repository is **public**. Nothing in the brief or the record may carry partner or applicant identities, gated guide or template content, Storage object paths, account email addresses, or dashboard deep links.

## 6. What the reviewer returns

A paste-ready record, not a chat reply. It opens with:

- **Confirmed range** — both SHAs, restated.
- **Scope match** — yes, or no with the explanation.
- **Files and context inspected.**
- **Commands and evidence** — what was run, what came back, what was skipped and why, plus the CI and Preview evidence for the reviewed head.

Then each finding, one block each:

- **Severity** — **Blocking** (merge would be unsafe, broken or data-destructive) or **Should-fix** (a verified defect that is not merge-blocking, with its disposition stated). Any failure of an `AGENTS.md` **Palestine House gating check** is Blocking by definition.
- **Location** — `path/file.ts:line`, plus the route or flow.
- **Issue** — one or two evidence-based sentences.
- **Failure scenario** — concrete input or state → wrong outcome.
- **Suggested fix** — the specific minimal fix.
- **Confidence** — high / medium / low.

> **Two severity scales are in the repo, and this is not a contradiction.** [`AGENTS.md`](../AGENTS.md) § *How to report findings* labels a finding Critical / High / Medium / Low and asks for *Why it matters*; the block above is the D-SYS-1 record format. Give the `AGENTS.md` severity as well if it helps, but the record must carry the **Blocking / Should-fix** call, because that is the one the merge decision reads.

It ends with **exactly one verdict: APPROVE or REQUEST CHANGES**, one line of reason, the reviewed range restated, and who reviewed it on what date.

**A clean review still has to say what it checked.** "No findings" is followed by the correctness, gating, secret, build and Preview paths that were actually verified. A bare approval is not a review — the E1 record, [`code-reviews/e1-email-switch-on.md`](./code-reviews/e1-email-switch-on.md), is the shape to copy: zero blocking, zero non-blocking, and a list of exactly what was proven.

The reviewer does not write into the repo. The builder or the owner appends the returned record to the review file.

## 7. After the review

- [ ] **Blocking findings are fixed by the builder, on the same branch.** Not deferred, not argued away.
- [ ] **Every Should-fix item is either fixed or explicitly deferred** — with the owner named, the reason, and the residual risk written down. A deferred finding that is worth carrying goes into `PROJECT-STATUS.md` §7 or the post-launch backlog (`docs/POST-LAUNCH-BACKLOG.md` — **arrives later in SYS1**).
- [ ] **Any substantive post-review change invalidates the approval.** Re-run the checks, refresh the Preview, re-review the new head (§4).
- [ ] **The owner merges only after an APPROVE for the current substantive head.** No merge while a Blocking finding stands.
- [ ] Then the merge and production checks in [`WORKFLOW.md`](./WORKFLOW.md) §12, with §13 and [`ROLLBACK-RUNBOOK.md`](./ROLLBACK-RUNBOOK.md) ready if the production smoke test fails.

Delivery order — [`WORKFLOW.md`](./WORKFLOW.md) §3 and §12, with the review link no longer optional (D-SYS-1):

```
local checks → PR → CI green → tested Vercel Preview → independent review → merge by owner → Production smoke test
```

## 8. Where the record goes

**Forward from SYS1, every review record is saved at:**

```
docs/code-reviews/<sprint-id>-<slug>-review.md
```

The folder already holds **15 records** under **mixed names**, because the convention was practised before it was written down — for example [`pp8-security-verification.md`](./code-reviews/pp8-security-verification.md), [`pp7-round-3-ledger.md`](./code-reviews/pp7-round-3-ledger.md), [`pp1-platform-foundations.md`](./code-reviews/pp1-platform-foundations.md), [`s3-auth-complete.md`](./code-reviews/s3-auth-complete.md) and [`e1-email-switch-on.md`](./code-reviews/e1-email-switch-on.md).

**The naming convention applies going forward only. Historical records are not renamed** — they are cited by their real filenames from `PROJECT-STATUS.md` and `ROADMAP.md`, and renaming them would break those citations for no gain.

Each file holds the filled brief and then the reviewer's returned record, appended. Where a sprint runs several rounds, they accumulate in the one file in order, each with its own range — that is what PP7's and PP8's records look like.

---

**Next step →** commission the review with the brief template ([`templates/CODEX-REVIEW-PROMPT-TEMPLATE.md`](./templates/CODEX-REVIEW-PROMPT-TEMPLATE.md)) wrapped around section F of [`.claude/skills/sprint-prompt/SKILL.md`](../.claude/skills/sprint-prompt/SKILL.md), save it under [`code-reviews/`](./code-reviews/), append the returned record, then merge only if the current head is approved.
