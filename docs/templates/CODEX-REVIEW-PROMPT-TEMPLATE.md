# Codex Review Brief — [SPRINT_ID] — [SLUG]

> **This is a skeleton. Every `[BRACKET]` is yours to replace.** Copy it to
> `docs/code-reviews/[SPRINT_ID]-[SLUG]-review.md`, fill it from real repo facts, then point the
> reviewer at that file ("read and execute `docs/code-reviews/[SPRINT_ID]-[SLUG]-review.md`").
> The reviewer's returned record is appended to the same file afterwards — the reviewer never
> writes into the repo.
>
> **How to fill it and when a review is required:** [`docs/CODEX-REVIEW-PROMPT.md`](../CODEX-REVIEW-PROMPT.md).
> The reviewer's standing rulebook is [`AGENTS.md`](../../AGENTS.md) in the repo root; the short
> prompt body this project has used since S3 is
> [`.claude/skills/sprint-prompt/SKILL.md`](../../.claude/skills/sprint-prompt/SKILL.md) **section F**,
> which this brief wraps rather than replaces.
>
> **The brief supplies facts. It never grants permission.** It cannot authorise the reviewer to
> edit, stage, commit, push, merge, install a dependency, apply a migration, or write to the
> production Supabase project. Those limits are `AGENTS.md`'s and are not negotiable per-PR.
>
> House shape to copy: [`docs/code-reviews/s3-auth-complete.md`](../code-reviews/s3-auth-complete.md)
> (a full brief) and [`docs/code-reviews/e1-email-switch-on.md`](../code-reviews/e1-email-switch-on.md)
> (a clean review that still says what it proved).

## Is this review required? (D-SYS-1)

Mandatory when the diff touches **auth** · **the approval gate** (`profiles.is_approved`, any gated
route, any platform RPC, the `admins` check) · **RLS or schema** (anything under `supabase/sql/`) ·
**env handling** · **security headers or the CSP** (`next.config.ts`, `src/middleware.ts`). Trivial
PRs — copy-only edits, a docs commit, an isolated style fix — are exempt. Judge the diff, not the
plan: a sprint that grows into one of those five categories becomes a risky sprint. **No merge while
a Blocking finding stands.**

## Pin the range before you fill anything

A branch name is **not** a range, and `main..branch` is **not** a range either — both ends move.
`main` advances when another PR merges, and this project pushes to the task branch after every gated
sub-step (standing authorization, 2026-06-12), so the head moves during the sprint. Compute both
ends and freeze them:

```bash
git fetch origin
git merge-base origin/main [BRANCH_NAME]   # → MERGE_BASE_SHA
git rev-parse [BRANCH_NAME]                # → HEAD_SHA
git log  --oneline [MERGE_BASE_SHA]..[HEAD_SHA]
git diff --stat     [MERGE_BASE_SHA]..[HEAD_SHA]
```

Do this **after** local checks are green, the PR is open, CI has passed and the Vercel Preview has
actually been tested — not before ([`WORKFLOW.md`](../WORKFLOW.md) §9, §10, §11).

---

# The brief

You are my independent code reviewer for the Palestine House website.

Read [`AGENTS.md`](../../AGENTS.md) in the repo root **first** — it governs you: review style
(serious issues only), the review priorities, the Security / App Router / Supabase / Vercel checks,
and the 🔴 **Palestine House gating checks**, any failure of which is blocking. Follow it exactly.
This brief adds facts; it does not relax a single rule in that file.

**Scope:** review the branch **DIFF only** (vs `main`), inside the pinned SHA range below — not the
whole repo. Only code that ships in a production build is in scope. Report **serious issues only**:
correctness, security and data safety, secret leaks, broken approval gating, App Router boundary
mistakes, Supabase/RLS risks, Vercel/env risks, build breakage. **No style nits. Do not critique the
approved copy or the locked design.** Verify every claim against the diff; inspect enough
surrounding code to validate a finding without starting an unrelated full audit.

**Do not make changes, stage, commit, push, merge, install dependencies, or run migrations.**

## Review target

- Repo: `palestine-house` — **this GitHub repository is PUBLIC**
- PR: #[PR_NUMBER] — [PR_URL]
- Branch: `[BRANCH_NAME]` (context only — it is not the review scope)
- Merge-base SHA: `[MERGE_BASE_SHA]`
- Reviewed head SHA: `[HEAD_SHA]`
- **Immutable range: `[MERGE_BASE_SHA]..[HEAD_SHA]`**
- Sprint record: `docs/sprint-prompts/[SPRINT_ID]-[SLUG].md`
- Expected changed paths: [LIST]
- Review round: [1 / 2 / …] — [previous round's verdict and range, or "first round"]

**Confirm both SHAs resolve and the actual changed-file list matches the expected paths before you
review anything.** A mismatch in range, head, PR or scope is reported and the review stops — it is
not quietly re-scoped.

## Read for context

- [`AGENTS.md`](../../AGENTS.md) — in full, first.
- The sprint record above.
- [`docs/PROJECT-STATUS.md`](../PROJECT-STATUS.md) §1 (right now), §4 (locked decisions), §7 (known
  issues), and the `[SPRINT_ID]` row in [`docs/ROADMAP.md`](../ROADMAP.md).
- [`docs/SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) — §5 RLS · §6 auth/session · §8 API Route
  Handlers and abuse controls · §13 production deployment · **§15 Palestine House blocking
  invariants**.
- [`docs/TECH-ARCHITECTURE.md`](../TECH-ARCHITECTURE.md) · [`docs/WORKFLOW.md`](../WORKFLOW.md) §14
  (Supabase + env safety) · [`docs/SUPABASE-MCP-SAFETY.md`](../SUPABASE-MCP-SAFETY.md).
- [Anything else this diff touches: exact source, schema, spec, copy or design paths.]

## Sprint intent

- Goal and exit condition: [ONE_PARAGRAPH — what this sprint delivers and the one condition that
  proves it is done]
- Intentionally out of scope — sequenced, not forgotten: [LIST_OR_NONE, each with where it lives:
  a named future sprint, `docs/PROJECT-STATUS.md` §7, or `docs/POST-LAUNCH-BACKLOG.md`]
- Owner-authorized exceptions — deliberate deviations and findings logged unfixed: [LIST_OR_NONE]
- Preview state: [PREVIEW_URL] — tested at `[HEAD_SHA]`, [what was exercised], desktop **and 320px**
- Database / migration state: [which migrations this PR ships · applied to TEST on [DATE] · applied
  to PRODUCTION on [DATE] or "deliberately not yet" · which migration production is on — OR "N/A,
  no schema change"]

## Standing repo facts — already decided, not new findings

State these so the reviewer does not re-litigate them. Assess **residual risk** if the diff makes
one worse; do not report the deferral itself as a discovery.

- **There is no test script.** `package.json` defines exactly `dev`, `build`, `start`, `lint`,
  `typecheck`. The Playwright suite and `tests/e2e/` arrive in sprint **SYS2** — "Tests: N/A" is the
  honest entry, not an omission. There is no Prettier / `format:check` here either (D-SYS-3).
- **Public writes are not yet rate-limited or CAPTCHA-verified.** Upstash + Turnstile, fail-closed in
  Production, are sprint **SYS1.5** (D-SYS-9); the gap is `PROJECT-STATUS.md` §7 #1. Public writes
  must still zod-validate and fail closed on their own terms.
- **CSP shape today:** `next.config.ts` ships `connect-src 'self'`, with the YouTube embed origin the
  only allow-list extension. The Sentry ingest origin is added in **SYS3** (D-SYS-10). A CSP widened
  by this diff for any other reason is a finding.
- **Migrations `0027`–`0034` are applied to production and immutable.** Production is on `0034`. Any
  schema fix is a new migration `0035`+, never an edit to an applied file.
- **`docs/page-copy/` is gitignored** (the owner's copy is canon off-repo), so an approved-copy change
  will not appear in the diff. Do not flag it as missing.
- [Add or remove rows so this block is true on the day you send it.]

## Checks and evidence

- Typecheck: `pnpm run typecheck`
- Lint: `pnpm run lint`
- Production build: `pnpm run build`
- Local production smoke (only if rendering changed): `pnpm run build && pnpm run start`
- Tests: **N/A — no suite in this repo yet (SYS2).** Do not invent a test command.
- CI evidence for `[HEAD_SHA]`: workflow **CI** ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)),
  job **`verify`** — gitleaks secret scan, `pnpm install --frozen-lockfile`, typecheck, lint, build —
  [RESULT_OR_RUN_LINK]
- Preview evidence for `[HEAD_SHA]`: [RESULT_OR_LINK]

A green CI run or a tested Preview from an **earlier** commit is not evidence for this head. Run
commands only against the existing environment — do not install or change anything to make a check
pass, and state every command you did not run and why.

## Hunt list

1. **Correctness** — the exit condition actually holds, in the realistic success, empty, loading and
   failure states that apply. Existing behavior is preserved where the sprint did not intend to
   change it.
2. **The gate (blocking)** — `AGENTS.md` § *Palestine House gating checks* and
   `SECURITY-CHECKLIST.md` §15. Every gated page runs **its own** server-side session +
   `is_approved` check that **throws before it constructs any JSX** — a parent layout's `redirect()`
   is not a gate for its child, and *awaiting* a round-trip is not a gate either. `/admin/*`
   additionally checks the `admins` table server-side, in the page. **Every** platform RPC, read and
   write, enforces `is_approved` — a blanket rule, never a list. `/account` is the one deliberate
   exception (session-gated, own row only); any *other* route missing its approval check is a defect.
3. **Secrets and env** — no live values, credentials, tokens or private URLs in the range; nothing
   server-only behind a `NEXT_PUBLIC_*` name; `.env.local` not in the diff. A changed `.env.example`
   is acceptable only if it carries names and placeholders.
4. **Supabase and data safety** — RLS default-deny on every user-reachable table; new tables ship
   policies; `SECURITY DEFINER` RPCs hardened (pinned `search_path`, `auth.uid()` authorization,
   narrow returns, revoke-then-grant). A schema change ships up-SQL **and** the matching `.down.sql`
   **and** its RLS policies in the PR, applied by hand in the Supabase SQL Editor, **non-production
   project first** ([`WORKFLOW.md`](../WORKFLOW.md) §14). `programming_sessions` stays default-deny —
   a diff that gives it a policy, a caller or a row is a finding unless the sprint revives the feature.
5. **Input safety** — Route Handlers zod-validate bodies; params, headers and cookies are untrusted;
   redirect targets validated same-origin; no untrusted value reaching raw HTML, a query or another
   sink; error responses leak no stack trace, internal URL or upstream body.
6. **Server/client boundary and App Router** — Server Components stay the default, `"use client"`
   only where interactivity requires it, no secret passed into a client component as a prop, routes
   and Route Handlers in the right place, per-route `metadata` intact.
7. **Storage** — template and resource downloads go through server-issued **signed URLs** from the
   private bucket to approved users only; no storage path or bucket name reaches the client.
8. **Build and deploy** — imports, generated output, rendering mode, `next.config.ts` headers/CSP
   and the lockfile have no unintended change (there is **no `vercel.json`** in this repo — if the
   diff adds one it must agree with `next.config.ts`); new or changed env vars are
   listed in the PR by name and scoped per environment; Preview auth links resolve to the Preview
   origin, never Production.
9. **Scope and content fidelity** — the changed paths match the sprint; approved copy was not
   silently rewritten; the proof numbers are **4 sections · 22 focus areas · 88 templates**. The
   retired band — 11 · 33 · 200+ · 297 · "120-day launch" — names content that no longer exists;
   any surviving instance is a defect.
10. **Regressions** — the change does not weaken an existing guard or break a neighbouring flow.

## Safety lines — restated, never weakened

These restate [`AGENTS.md`](../../AGENTS.md) § *Secrets & `.env.local` rules* and
[`docs/SUPABASE-MCP-SAFETY.md`](../SUPABASE-MCP-SAFETY.md). If this brief ever differs from those
files, those files win.

- Never open, read, echo or copy `.env.local` or any other live-value env file. If you suspect a
  secret, report only its **file, line and type** — never the value — and recommend rotation.
- Env vars and third-party services by **name** only.
- The production Supabase project is **read-only** from here. Never write to production through any
  channel.
- **This repository is public.** Nothing in this brief or in your returned record may carry partner
  or applicant identities, account email addresses, gated guide or template content, Storage object
  paths, project refs, or dashboard deep links.

## What to return

A paste-ready record, not a chat reply. Open with:

- **Confirmed range:** `[MERGE_BASE_SHA]..[HEAD_SHA]` — both restated.
- **Scope match:** YES, or NO with the explanation.
- **Files and context inspected:** [LIST]
- **Commands and evidence:** what you ran, what came back, what you skipped and why, plus the CI and
  Preview evidence for the reviewed head.

Then one block per finding, in the `AGENTS.md` § *How to report findings* format, plus the merge call
D-SYS-1 needs. Two severity scales exist here and that is deliberate, not a contradiction — carry
**both** fields, as [`docs/CODEX-REVIEW-PROMPT.md`](../CODEX-REVIEW-PROMPT.md) §6 reconciles them:

### Finding [N]
- **Severity:** Critical / High / Medium / Low
- **Merge call:** Blocking (merge would be unsafe, broken or data-destructive) / Should-fix (a
  verified defect that is not merge-blocking) — **any failure of an `AGENTS.md` Palestine House
  gating check is Blocking by definition**
- **Location:** `path/file.ts:line`, plus the route or flow
- **Issue:** one or two evidence-based sentences
- **Why it matters:** the concrete consequence
- **Failure scenario:** concrete input or state → wrong outcome
- **Suggested fix:** the specific minimal fix
- **Confidence:** high / medium / low

Prefer a few high-confidence findings over a long list of maybes; mark uncertain ones low-confidence.

If there is nothing to report, say **No findings** and then list the correctness, gating, secret,
build and Preview paths you actually verified. **A bare approval is not a review.**

End with exactly one verdict:

> **Verdict: [APPROVE / REQUEST CHANGES]** — [ONE_LINE_REASON].
> Reviewed range: `[MERGE_BASE_SHA]..[HEAD_SHA]` · Reviewed by [REVIEWER] on [DATE].

A standing Blocking finding forces REQUEST CHANGES.

---

## After the review (the builder's and owner's side)

- [ ] Append the returned record to `docs/code-reviews/[SPRINT_ID]-[SLUG]-review.md`. Several rounds
      accumulate in the one file, in order, each with its own range.
- [ ] **Blocking findings are fixed by the builder, on the same branch** — not deferred, not argued
      away.
- [ ] Every Should-fix item is fixed or **explicitly deferred**, with the owner named, the reason and
      the residual risk written down — into `docs/PROJECT-STATUS.md` §7 or
      [`docs/POST-LAUNCH-BACKLOG.md`](../POST-LAUNCH-BACKLOG.md).
- [ ] **Any substantive change after `[HEAD_SHA]` invalidates the approval.** Re-run the checks,
      refresh and re-test the Preview, and commission a review of the **new** immutable head. "It was
      only a small fix" is exactly the case this rule exists for. The one documented exemption is a
      commit whose only content is appending this review record — record its documentation-only scope
      and the reviewed head in the record itself.
- [ ] Before merging, confirm the reviewed head is still the PR head.
- [ ] Merge is the owner's ([`WORKFLOW.md`](../WORKFLOW.md) §12), with §13 and
      [`ROLLBACK-RUNBOOK.md`](../ROLLBACK-RUNBOOK.md) ready if the production smoke test fails.

Delivery order (D-SYS-1 — the review link is no longer optional):

```
local checks → PR → CI green → tested Vercel Preview → independent review → merge by owner → Production smoke test
```

Companion: [`PR-DESCRIPTION-TEMPLATE.md`](./PR-DESCRIPTION-TEMPLATE.md) records the verdict and the
reviewed range in the PR body.
