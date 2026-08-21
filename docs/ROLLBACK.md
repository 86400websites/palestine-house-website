# Rollback — Palestine House

What to do when production breaks. Follow the steps in order: a working site in minutes, then a
correct `main`, then a fixed root cause. **Never improvise on `main`.**

> **Which rollback document do I want?**
>
> | | |
> |---|---|
> | **This file** | The general case — *production is broken right now, what do I do.* Any sprint, any cause. |
> | [`ROLLBACK-RUNBOOK.md`](./ROLLBACK-RUNBOOK.md) | The **one specific case**: undoing the PP7 content cutover (migration `0030`, the 297-file cold archive, `0033`'s contraction). If the break involves the legacy platform's rows or Storage objects, stop reading here and use that file — it is executed, rehearsed and exact. |
> | [`WORKFLOW.md` §13](./WORKFLOW.md#13-rollback-process) | The three-line summary that sits inside the delivery loop. It is the same rules, compressed. |
> | [`PRODUCTION-CUTOVER-RUNBOOK.md`](./PRODUCTION-CUTOVER-RUNBOOK.md) | The forward direction of the PP7 cutover, for reference on what was done to production and in what order. |
> | [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) → *Emergency rollback security notes* | If a **secret was exposed**. Rotate the key first — that section owns this case, not this file. |
>
> These do not compete. This file is the decision tree; the runbooks are the executed procedures it
> sends you to.

---

## Who decides

**The owner.** Every production action below — promoting a deployment, merging a revert, pasting SQL
into the Supabase SQL Editor — is the owner's to take.

This is not a formality, it is how the repo is wired: the Supabase MCP available to the build engine
is **read-only on production** (`supabase-prod-readonly`), migrations are applied by hand in the SQL
Editor, and the destructive scripts refuse a production target without a typed confirmation at a real
terminal ([`SUPABASE-MCP-SAFETY.md`](./SUPABASE-MCP-SAFETY.md), [`WORKFLOW.md` §14](./WORKFLOW.md#14-supabase--environment-variable-safety)).
An agent can diagnose, read production, prepare the revert branch and rehearse a rollback on the
non-production project. It cannot execute one.

> **Detection is manual today.** There is no error tracking in this codebase yet — Sentry arrives in
> sprint **SYS3** ([`ROADMAP.md`](./ROADMAP.md) Stage 5). Nothing pages anyone. A break is found by the
> owner, a partner, or the post-merge smoke test in [`WORKFLOW.md` §12](./WORKFLOW.md#12-production-merge-checklist),
> which is exactly why that smoke test is not optional.

---

## The decision tree (memorize this)

| Situation | Action |
|---|---|
| Production broken, cause known | **Revert the PR on `main`** — the default fix |
| Production broken, partners or visitors affected NOW | **Vercel → Deployments → previous good deployment → Promote to Production**, then still correct `main` |
| A migration shipped with the break | Code rollback alone is NOT enough — see Step 4 |
| The break involves the legacy content, its rows or its Storage objects | Use [`ROLLBACK-RUNBOOK.md`](./ROLLBACK-RUNBOOK.md), not this tree |
| A secret was exposed | **Rotate the key first** — [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) → *Emergency rollback security notes* |
| Tempted to fix-forward directly on `main` | **Don't.** Branch, fix, and go through the full workflow |

---

## The two levers, and why they are not equals

This project has exactly two rollback levers, and the asymmetry between them governs everything else
in this file.

| | **Code — Vercel promote** | **Data — the migration's `.down.sql`** |
|---|---|---|
| What it does | Re-serves a previous deployment artifact | Reverses a schema/data change, by hand in the Supabase SQL Editor |
| How long | Seconds | Minutes to hours, depending on the migration |
| Reversible? | Yes — promote forward again | Not necessarily. Some of it never is |
| Rehearsable? | Trivially | Only on the non-production project, and only if someone actually does it |
| Verdict | **Instant and safe** | **Neither** |

**Code rollback is instant and safe. Data rollback is neither.** That single sentence is why
[`WORKFLOW.md` §14](./WORKFLOW.md#14-supabase--environment-variable-safety) requires every migration
to ship a matching `.down.sql`, to be applied to the **non-production Supabase project first**, and to
stay backwards-compatible where it can (expand → migrate → contract) — so that the fast, safe lever is
usually enough on its own.

Migrations live in `supabase/sql/migrations/` as `NNNN_name.up.sql` + `NNNN_name.down.sql`.
**Production is on `0034`** (applied by the owner 2026-08-20; recorded in
[`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §1). Production does not report its migration list — PP8
established that `list_migrations` returns `[]` there, because migrations are applied by hand — so
"which migration is production on" is answered by the shape it leaves, or by §1.

---

## Step 1 — Confirm what broke and which deploy caused it

- [ ] Reproduce the breakage on the live site — the Production URL recorded in
      [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §1. Note the exact page, flow and error text.
- [ ] Note **which shell** it is in: the public marketing pages, or the approval-gated partner
      platform. A gated break needs a real signed-in partner account to reproduce, and a break that
      *exposes* gated content is a security incident first — see
      [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) §15.
- [ ] In Vercel → Deployments, identify the last GOOD deployment and the first BAD one.
- [ ] Match the bad deployment to its merge/PR (`git log main` — deployment commits map to `main`).

**Why this matters:** rolling back the wrong deploy fixes nothing and doubles the confusion.

> **If the "break" is a flood of submissions, this is the wrong file.** The public writes (`/apply`,
> contact, `/support`) are still **unthrottled** — Upstash rate limiting and Turnstile are not shipped
> yet; they are sprint **SYS1.5** (`PROJECT-STATUS.md` §7 #1, **D-SYS-9**). There is no rate limiter to
> turn up. What holds in the meantime is that the writes are zod-validated and fail closed, and the HQ
> approval gate (`is_approved = false`) keeps abusive signups away from every piece of gated content.
> Rolling back a deployment does not help; SYS1.5 does.

## Step 2 — Instant restore (if users are affected)

- [ ] **Vercel → Deployments → previous good deployment → Promote to Production.**
- [ ] Confirm the live site works again.

This is a stopgap, not the fix — `main` still needs the revert (Step 3). It also restores **code
only**; read Step 4 before assuming anything about the database.

## Step 3 — Fix the source of truth

- [ ] On GitHub, open the merged PR that caused the break → **Revert** → merge the revert PR.
      (Locally: `git revert <commit-sha>` on a branch → push → PR → merge.)
- [ ] Confirm the new production deployment, built from the reverted `main`, is good.

GitHub remains the source of truth: once the dust settles, **production must equal `main`** again. A
promoted old deployment sitting on top of a poisoned `main` means the next merge re-ships the bug.

## Step 4 — The data lever (skip only if the break involved no schema or data change)

Promoting a deployment restores **code, not the database.** A `.down.sql` may reverse schema; it
cannot recreate deleted rows, undo side effects that already left the system (emails sent, files
removed), or guarantee the prior data state.

- [ ] Classify the migration honestly: additive/backwards-compatible · reversible schema-only ·
      destructive or data-changing.
- [ ] **If the old code works against the new schema, keep the schema and forward-fix.** This is the
      preferred outcome and the reason migrations are written expand-first.
- [ ] Before running any `.down.sql` against production, run it on the **non-production project**
      (`palestine-house-test-database`) and confirm the dependent code has already retreated —
      [`WORKFLOW.md` §14](./WORKFLOW.md#14-supabase--environment-variable-safety).
- [ ] If rows or files were deleted, the `.down.sql` alone is **not** recovery. Use the migration's own
      recovery plan; for the PP7 content cutover that plan is
      [`ROLLBACK-RUNBOOK.md`](./ROLLBACK-RUNBOOK.md), which restores bytes before rows.
- [ ] The owner runs it, in the Supabase SQL Editor, and records the result. Never improvise a
      production edit mid-incident.

**Two facts this project established the hard way, both of which belong here:**

- **A `.down.sql` restores rows. It never restores Storage objects** (decision **D-PP-k**, 2026-08-14).
  Any destructive run that can remove files must be preceded by a **verified** object backup, and
  "verified" means a fingerprint someone checked, not a folder someone remembers copying. Restoring
  rows without their bytes produces a platform that looks perfectly healthy and hands every partner a
  broken download.
- **Do not delete Storage objects with SQL.** Deleting `storage.objects` rows in a migration orphans
  the bytes; deletion goes through the Storage API instead. This is why `0030` never deletes from
  `storage.objects` — it only locks and reads that table while it runs — and a separate script
  removes the files afterwards, rows first, bytes second.

## Step 5 — Verify with a smoke test

- [ ] The previously broken page/flow works on the live site.
- [ ] The public conversion path still works: the **Apply** CTA → `/apply` → the form submits.
- [ ] If the break touched the gated side: sign in as a real approved partner and open a focus area,
      read a Simple guide, and download one template through its signed URL. Confirm a **pending**
      account still sees only the pending state.
- [ ] No new console errors; key pages fine on desktop and mobile.
- [ ] Fuller pass when there is time: [`QA-CHECKLIST.md`](./QA-CHECKLIST.md).

> **Check your instruments before you trust them.** PP8 finished with **one** product defect against
> **ten** defects in its own probes — including a screenshot that showed a blank band where all 22
> focus areas were in fact rendering, and a selector that made a working search palette look
> completely broken. During an incident, a tool that reports the site is broken may itself be the
> broken thing. Confirm in a real browser before acting on a script's word.

## Step 6 — Root-cause and re-land properly

- [ ] Find WHY it broke — **and why the Preview test didn't catch it.** That second question is
      usually the more valuable one.
- [ ] Fix on a normal branch and re-land through the full chain:
      branch → local checks (`pnpm run typecheck`, `pnpm run lint`, `pnpm run build`) → PR → green CI
      (the **`verify`** job in `.github/workflows/ci.yml`) → tested Vercel Preview → independent review
      where required → merge → production smoke test.
- [ ] **Independent review is mandatory** if the fix touches auth, the approval gate, RLS/schema, env
      handling, security headers or the CSP (**D-SYS-1**). Run it over the immutable
      `merge-base..head` SHA range, save the record in [`code-reviews/`](./code-reviews/), and do not
      merge over a Blocking finding. Trivial PRs are exempt; a hotfix in those areas is not. Prompt:
      [`CODEX-REVIEW-PROMPT.md`](./CODEX-REVIEW-PROMPT.md).
- [ ] Add whatever check would have caught it to [`QA-CHECKLIST.md`](./QA-CHECKLIST.md) or
      [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md).

**On the checks, stated so nobody mis-runs them:** the Playwright suite (`pnpm run test:e2e`, since
SYS2) targets a **deployed Preview**, not the local tree — during a rollback, re-running the affected
specs against the restored deployment is the right use of it, and a local `test:e2e` without
`PLAYWRIGHT_BASE_URL` refuses to run by design. **Prettier / `format:check` is deliberately waived**
for this already-built site (**D-SYS-3**): adding it now would force a whole-repo reformat, so it is
not part of the chain and its absence is not an oversight.

## Step 7 — Write the incident note

- [ ] Log it in [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) — §7 *Known issues* while it is open, §8
      *Change log* when it closes: date, what broke, which deploy/PR, why, what was done, and what now
      prevents a repeat.
- [ ] If the incident produced a new rule, put the rule where it will be read — `CLAUDE.md`,
      [`AGENTS.md`](../AGENTS.md), or the relevant checklist — not only in the log.

**Why this matters:** an unrecorded incident is a scheduled repeat.

> A dedicated `INCIDENT-LOG.md` arrives with the error-tracking module in **SYS3**. Until then
> `PROJECT-STATUS.md` §7/§8 is the log, and it has carried this project's incidents so far.

---

## What to tell users

Palestine House has two audiences and they need different words.

- **Public visitors** — if the marketing shell was down, say nothing unless someone asks. The site is
  either working or it isn't.
- **Partners and applicants** — if the gated platform, a download, or an application submission was
  affected, the owner tells them directly, through the same channel HQ already uses
  (`info@palestine-house.com` — see [`EMAIL-SETUP-CHECKLIST.md`](./EMAIL-SETUP-CHECKLIST.md)). Say what
  broke, for how long, whether anything they submitted was lost, and that it is fixed. Do not describe
  internals, and never speculate about a cause that has not been confirmed.
- **If gated content or personal data was exposed, even briefly**, that is not a status update — it is
  a security incident. Work [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) §15 and its *Emergency
  rollback security notes* first, and the owner decides on notification.

> **Templates for both the incident record and the user-facing update ship with the error-tracking
> module in SYS3** ([`ROADMAP.md`](./ROADMAP.md) Stage 5). They do not exist in this repo yet — write
> the update by hand, in the brand voice, and keep a copy in the `PROJECT-STATUS.md` entry.

---

## Lessons this project already paid for

Carried forward rather than re-learned. Both come from the PP7 cutover.

**1. A rollback nobody has executed is a hypothesis, not a rollback.**
The independent review of 2026-08-16 found that the recovery plan for `0030` amounted to *a sentence
telling the operator to re-upload 297 files by hand* (finding **B5**,
[`code-reviews/pp7-round-3-ledger.md`](./code-reviews/pp7-round-3-ledger.md)). The response was to
rehearse the whole thing: on the **non-production project**, the full cycle was executed end to end
— `0033`'s down-migration (its first
ever run), the complete 1.68 MB `0030` rollback as one transaction, all 297 objects restored at their
exact keys ending at `broken_downloads = 0`, then forward again through the hardened migration and the
object deletion — and TEST finished **byte-identical to where it started**. Only then did anything
touch production.

The rule that follows: **for any destructive or hard-to-reverse change, the rollback is rehearsed on
the non-production project before the forward change reaches production.** Not reviewed. Run.

**2. Verify the backup with a tool that cannot damage it.**
The same review found that the documented way to check the only copy of 297 files was a script that
**downloaded into the archive** — the verification could destroy the thing it verified. The fix was a
strictly read-only verifier. Before any destructive run, check the backup with something that only
reads.

---

## Never do this

- [ ] Never fix-forward directly on `main` — even a one-liner goes through a branch and a PR.
- [ ] Never force-push or rewrite `main` history to "erase" a bad commit.
- [ ] Never assume a code rollback rolled back the database.
- [ ] Never run a `.down.sql` as a reflex, or claim it restores data it never preserved — it does not
      restore Storage objects at all.
- [ ] Never run a destructive step against production before the same step has been run on the
      non-production project.
- [ ] Never skip the revert PR after an emergency promote — `main` must be corrected either way.
- [ ] Never let an agent write to production. Read-only there, always
      ([`SUPABASE-MCP-SAFETY.md`](./SUPABASE-MCP-SAFETY.md)).
- [ ] Never close an incident without recording it in [`PROJECT-STATUS.md`](./PROJECT-STATUS.md).

---

Next step → re-land the fix through the normal loop in [`WORKFLOW.md`](./WORKFLOW.md) §6–§12.
