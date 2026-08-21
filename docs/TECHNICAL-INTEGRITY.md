# Technical Integrity — Palestine House

> How every line of code in this repo is held to standard. The standards are written once as configuration and enforced by machines on every change. Read this with [`WORKFLOW.md`](./WORKFLOW.md) (the delivery chain), [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) (the security gate) and [`../CLAUDE.md`](../CLAUDE.md) (the build agent's rules).
>
> **This file describes the repo that exists today.** Where the Website-Development-System SOP asks for something Palestine House does not have, it says so and names the sprint that adds it — or the decision that waived it. Nothing here is aspirational.

## Status in this repo

Verified 2026-08-21 against `.github/workflows/ci.yml`, `package.json`, `tsconfig.json` and `eslint.config.mjs`, and cross-checked with the compliance audit at [`notes/system-compliance-audit-2026-08-21.md`](./notes/system-compliance-audit-2026-08-21.md) §3.

| | Item | Status |
|---|---|---|
| **Wall 1** | The rules — how code must be written | **Present** — `CLAUDE.md`, `AGENTS.md`, [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md), [`DESIGN.md`](./DESIGN.md) |
| **Wall 2** | The Code Check — every PR gated by CI | **Present** — `.github/workflows/ci.yml`, workflow **CI**, job **`verify`** |
| **Wall 3** | Independent review | **Present, scoped** — mandatory for risky sprints (D‑SYS‑1); 15 records in [`code-reviews/`](./code-reviews/) |
| **Wall 4a** | Behaviour proof — tests | **Not built** — arrives in **SYS2** (Playwright launch gate) |
| **Wall 4b** | Behaviour proof — error tracking | **Not built** — arrives in **SYS3** (Sentry) |
| Check 1 | Strict types (`pnpm run typecheck`) | **Present** — CI step "Type check"; `tsconfig.json` has `"strict": true` |
| Check 2 | Lint (`pnpm run lint`) | **Present** — CI step "Lint"; ESLint flat config, no rules disabled |
| Check 3 | Formatting (`format:check`) | **Waived — D‑SYS‑3.** Prettier is not installed. Adopting it on this already-built site would force one whole-repo reformat commit on stable `main`, which fails the smallest-safe-change rule. Adopt on the next fresh build |
| Check 4 | Production build (`pnpm run build`) | **Present** — CI step "Build" |
| Check 5 | Tests run when present | **Scheduled — SYS2.** There is no test script, no test runner and no test file in this repo today. The CI step lands in the same PR as the first suite |
| Check 6 | No known-critical vulnerabilities (`pnpm audit`) | **Present — added at SYS1 1h.** Blocking at `--audit-level critical`, plus a non-blocking step reporting high/moderate on every run. The threshold is deliberate: on 2026-08-21 the repo had 0 critical, 14 high, 8 moderate, so gating at `high` would have shipped permanently-red CI. Raise it once §7 #6 is cleared |
| Extra | Secret scan over full history (gitleaks) | **Present — and the SOP does not ask for it.** A genuine addition on this repo's side |
| Owner | Branch protection on `main`, verified once | **Owner action — SYS1.** The setting lives in GitHub, not on disk, and cannot be confirmed from this machine (no `gh` CLI). An unverified gate is the same as no gate |

---

## The four walls

| Wall | What it guarantees | Where it lives in this repo |
|---|---|---|
| 1. The rules | How code must be written | [`../CLAUDE.md`](../CLAUDE.md), [`../AGENTS.md`](../AGENTS.md), [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md), [`DESIGN.md`](./DESIGN.md) |
| 2. **The Code Check** | Every PR passes the checks below — red cannot merge, *provided* the branch-protection rule is enrolled (see Setup) | This file + [`../.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
| 3. Independent review | A second pair of eyes on risky PRs; no merge over a Blocking finding | [`WORKFLOW.md`](./WORKFLOW.md) §8, [`../AGENTS.md`](../AGENTS.md), records in [`code-reviews/`](./code-reviews/) |
| 4. Behaviour proof | That the site actually works, before launch and after | **Unbuilt.** SYS2 builds 4a, SYS3 builds 4b |

Walls 1–3 are standing. Wall 4 is the honest gap: this site has been live since 2026‑06‑19 (Production URL recorded in [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §1) with an approval gate, a private Storage bucket and real partner accounts, and **not one automated test and no runtime error capture**. Every behavioural claim made about it so far rests on a human or an agent walking the site by hand. Closing that is the whole point of Stage 5.

---

## The house standard, in plain words

1. **Strict types** — TypeScript runs in `strict` mode (`tsconfig.json`); the compiler rejects vague or unsafe code before it exists.
2. **Lint-clean** — ESLint checks every line for known bad patterns. `eslint.config.mjs` extends `next/core-web-vitals` and `next/typescript` and **disables no rules** — its only `ignores` are `.next/**`, `node_modules/**`, `next-env.d.ts` and `docs/**` (locked reference inputs, never app source).
3. **Formatted** — **waived here (D‑SYS‑3)**, see the status table. Formatting stays a matter of matching the surrounding file.
4. **It builds** — `pnpm run build` must succeed. "Works in dev" counts for nothing.
5. **Tests pass** — **nothing to run yet.** SYS2 adds the Playwright suite and wires it into `ci.yml` in the same PR.
6. **No known-critical vulnerabilities** — `pnpm audit` runs on every PR since **SYS1 1h**: blocking at `critical`, reporting `high`/`moderate` without blocking. Dependabot's weekly PRs remain the update channel. **The high advisories are real and outstanding** — production runs `next@15.5.20` with SSRF advisories patched in `>=15.5.21` (`PROJECT-STATUS.md` §7 #6).
7. **No secrets in history** — every PR is scanned by gitleaks over the branch's full history. This is Palestine House's own addition; it backs [`WORKFLOW.md`](./WORKFLOW.md) §15 and the env rules in [`ENV-VARS-SAFETY.md`](./ENV-VARS-SAFETY.md).

**Line-level rule for the build agent:** no `any`, no `@ts-ignore`, no `eslint-disable` without a written reason. As of 2026‑08‑21 this repo satisfies it outright — `src/` contains **zero** `any` annotations, **zero** `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`, and all **11** `eslint-disable-next-line` comments are the same benign `@next/next/no-img-element`, each carrying its reason inline (ten as a trailing `--` note, one as a comment block directly above). Keep it that way: a new suppression without a reason is a review finding.

---

## The Code Check → `.github/workflows/ci.yml`

Runs automatically on every push to `main` and every pull request targeting `main`. You never trigger it, tune it, or maintain it.

**Workflow name:** `CI` · **Job id:** `verify` · **Job display name (this is the required check GitHub shows):** `Install · Typecheck · Lint · Build`

What the file actually does, in order:

| | Step | How |
|---|---|---|
| — | Permissions | `contents: read`, `pull-requests: read` — least privilege; the PR read scope exists because gitleaks lists PR commits via the API |
| — | Concurrency | `cancel-in-progress: true` per branch/PR, so superseded runs stop and runner minutes are not burned |
| 1 | Checkout | `actions/checkout@v6` with `fetch-depth: 0` — full history, so the secret scan covers every commit in the PR |
| 2 | Secret scan | `gitleaks/gitleaks-action@v3` — fails the run if a secret was ever committed on the branch |
| 3 | Enable Corepack | `corepack enable` — the pnpm version comes from `packageManager` in `package.json` (`pnpm@10.34.2`), so CI and local can never drift |
| 4 | Set up Node.js | `actions/setup-node@v7`, `node-version: 22`, `cache: pnpm` |
| 5 | Install | `pnpm install --frozen-lockfile` |
| 6 | Type check | `pnpm run typecheck` → `tsc --noEmit` |
| 7 | Lint | `pnpm run lint` → `eslint .` |
| 8 | Build | `pnpm run build` → `next build`, with `NEXT_TELEMETRY_DISABLED: "1"` set for the job |
| 9 | Audit (blocking) | `pnpm audit --audit-level critical` — added at **SYS1 1h**. Critical-only on purpose; see Check 6 above |
| 10 | Audit report (non-blocking) | `pnpm audit --audit-level moderate`, `continue-on-error` — prints high/moderate so a reviewer sees them on the PR |
| — | Job timeout | `timeout-minutes: 20` — added at **SYS1 1h**, so a hung step cannot run to GitHub's six-hour default |

The contract behind it: `package.json` defines `dev`, `build`, `start`, `lint` and `typecheck` — and nothing else. There is no `test` script and no `format:check` script. **Do not write a doc, prompt or checklist that assumes either exists.**

### Known deltas from the SOP template, both recorded

- ~~**No `timeout-minutes` on the job.**~~ **Closed at SYS1 1h** — the job now carries `timeout-minutes: 20`. *(Kept as a record of what was found and fixed.)* The original note: a hung install or build would run to GitHub's six-hour default. The concurrency block cancels *repeat* pushes but not a single hung run. Added alongside the audit step at **SYS1 1h**.
- **`pull_request:` is filtered to `branches: [main]`.** A PR opened against any non-`main` base — a stacked phase branch, say — gets no CI run at all. Low practical risk given this project's one-sprint-one-branch-to-`main` habit, but it is a real gap; the fix (drop the filter under `pull_request:`, keep it under `push:`) is recorded in the audit §3.

---

## Why this workflow is not called "Code Check" (D‑SYS‑4)

The SOP hard-codes `.github/workflows/code-check.yml` with the workflow name `Code Check`, and tells the owner to select a status check by that name in branch protection. **Palestine House keeps `ci.yml` / `CI` / job `verify`.** This is a deliberate, owner-recorded deviation, not an oversight.

The reason it matters is mechanical, and it is a foot-gun worth stating plainly: **GitHub's branch protection matches required status checks by name string.** Rename the workflow or the job without re-pointing the rule in the same sitting and one of two things happens, both bad:

- the rule still requires the **old** name, no check ever reports under it, and the merge button stays permanently locked; or
- the rule is loosened to clear the block, and the gate is now **silently absent** — PRs merge green-looking with nothing enforcing anything.

So: this repo's required check is the CI **`verify`** job, displayed as `Install · Typecheck · Lint · Build`. If the workflow is ever renamed, the GitHub branch-protection rule must be re-pointed in the same sitting, and one PR must be watched to confirm the merge button locks until the new check reports.

---

## Setup and verification

- [x] **Strict `tsconfig`, ESLint config, the scripts, the workflow file** — all shipped; the workflow file (with gitleaks and Dependabot) at **Stage 1.1**, 2026‑06‑12, PR #5 — see [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §2. Nothing to do.
- [ ] **Owner, once, ~2 minutes:** GitHub → the repo → **Settings → Branches → `main`** → confirm **"Require a pull request before merging"** and **"Require status checks to pass before merging"** are on, and that the required-check list names the check `ci.yml` actually emits (the `verify` job — **not** "Code Check"). See [`WORKFLOW.md`](./WORKFLOW.md) §3.
- [ ] **Owner + agent, verify once:** watch one PR — the check appears, goes green, and the merge button stays locked until it does. **An unverified gate is the same as no gate.** This cannot be checked from the repo: the setting lives in GitHub and the `gh` CLI is not installed on the build machine.

## Day to day

Every PR carries a green or red check before the merge button. On green, follow the rest of the chain — [`WORKFLOW.md`](./WORKFLOW.md) §10 (PR), §11 (Preview), §8 (review where D‑SYS‑1 requires it), §12 (merge). On red, the build agent reads the failure, fixes it, pushes, and the check re-runs.

Two working conventions that differ from the SOP and are recorded, not accidental:

- **No `Commit: YES` / `Push: YES` tokens (D‑SYS‑2).** This project runs a standing authorization dated 2026‑06‑12: the build agent commits **and pushes** after every gated sub-step, so the owner reviews live in the open PR from his phone. Do not add the token convention — it would contradict the skill the sprints actually run on.
- **Review is risky-sprint-scoped, not blanket (D‑SYS‑1)** — see Wall 3 below.

## Wall 3 — independent review, as this project runs it

Per **D‑SYS‑1** (owner, 2026‑08‑21), independent review is **mandatory** for any PR touching auth, the approval gate, RLS or schema, env handling, security headers, or the CSP. Trivial PRs are exempt.

✅ **[`WORKFLOW.md`](./WORKFLOW.md) has caught up — this was resolved at SYS1 1h.** §8 is now titled *"Independent review — mandatory on risky changes (D-SYS-1)"* and §3, §12 and §17 agree with it. **§8 is the binding statement; this section summarises it and must not drift from it.** *(Until 1h, all four called review optional.)* **D‑SYS‑1 is the newer rule and wins.** Those sections are re-worded at **SYS1 sub-step 1h**; once they are, this section should cite §8 rather than restate it.

The regime, in four rules:

1. The review targets an **immutable `merge-base..head` SHA range**, recorded in the review itself. A branch name is context, not an exact range.
2. The record is **saved in the repo** at [`code-reviews/`](./code-reviews/) — 15 real records live there today, covering S3, S5, S6, S7, LH1, E1, FA11, PP1, PP7 and PP8, alongside smaller PRs.
3. **No merge over a Blocking finding.** A non-blocking finding the owner chooses not to fix before merge gets a dated deferral note (owner + reason) in [`PROJECT-STATUS.md`](./PROJECT-STATUS.md).
4. A substantive change after review **invalidates the approval** — re-run the checks, retest Preview, re-review at the new head.

The prompt to run one is [`CODEX-REVIEW-PROMPT.md`](./CODEX-REVIEW-PROMPT.md); the reviewer's own rules are in [`../AGENTS.md`](../AGENTS.md).

This is not theory here. PP7 went through **five** review rounds, rounds 3–5 each returning BLOCKING with real Criticals; PP8 went through **three**. On this project's own record, the independent review is the thing that has most reliably found the Criticals.

## Wall 4 — behaviour proof, and why it is empty

Wall 2 proves the **code** is sound. It says nothing about whether the site **behaves**. Today Palestine House has no automated answer to either half of that:

**4a — tests (SYS2).** No test runner, no test script, no test file, no `tests/` directory, and `@playwright/test` is not a dependency. SYS2 installs `docs/testing-setup/` and the `/activate-testing` skill, adds Playwright with `tests/e2e/`, generates one test per approved line of `docs/FEATURE-LIST.md` — including the negative access-gate tests for all four roles (anonymous · pending partner · approved partner · HQ admin) — and records the GO verdict in `docs/test-reports/`. *(All four of those paths arrive in SYS2; they do not exist yet.)* The CI test step is wired into `ci.yml` in that same PR.

**4b — error tracking (SYS3).** No Sentry, no PostHog — zero references anywhere in the code. A live site with real partners currently has no runtime error capture at all: if a partner hits a 500, nobody is told. SYS3 installs `docs/error-tracking/` and the `/handle-error` skill, adds `@sentry/nextjs` with the DSN as an env var **by name only**, wires the two existing error boundaries (`src/app/error.tsx`, `src/app/global-error.tsx`) to report, and seeds `docs/INCIDENT-LOG.md` at the first real incident. *(Those paths arrive in SYS3.)* Per **D‑SYS‑10**, that sprint also extends the CSP `connect-src` to the Sentry ingest origin — today `next.config.ts` ships `connect-src 'self'` and the only allow-list extension is the YouTube embed origin.

Until both land, the substitute is human: [`QA-CHECKLIST.md`](./QA-CHECKLIST.md), the Preview walk in [`WORKFLOW.md`](./WORKFLOW.md) §11, and the [`LAUNCH-CHECKLIST.md`](./LAUNCH-CHECKLIST.md) gate. Say so plainly in any report — do not let "CI is green" stand in for "the site works".

## What the Code Check does *not* cover

Green CI is necessary and nowhere near sufficient. It does not know about:

- **Access control.** The approval gate, the admin gate and RLS are proved by [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) §5 (RLS), §6 (auth / session) and §15 (this project's blocking invariants) and by review — never by `tsc`.
- **Public-write abuse controls.** Rate limiting and Turnstile on `/apply`, contact and `/support` are **not shipped** (D‑SYS‑9; [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §7 issue #1) — the invariant they owe is [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) §8, §13 and §15. Those writes are unthrottled on Production right now. Sprint **SYS1.5** ships them, fail-closed.
- **The database.** Migrations are applied by hand in the Supabase SQL Editor, non-production project first — [`WORKFLOW.md`](./WORKFLOW.md) §14 and [`SUPABASE-MCP-SAFETY.md`](./SUPABASE-MCP-SAFETY.md). Production is on migration `0034`. CI never touches a database, and a Vercel rollback never rolls one back — see [`ROLLBACK.md`](./ROLLBACK.md).
- **Copy and design.** Verbatim copy and locked chrome are a human check against `/docs/page-copy/` and `/docs/page-designs/` — both **gitignored** (see `.gitignore`), so they live in the owner's working copy, not in a fresh clone.
- **Whether it behaves.** See Wall 4.

## The boundary, one line

The Code Check proves the **code** is sound on every PR; the Launch Gate and the morning check — once SYS2 builds them — prove the **site** behaves. Both, always. Neither replaces the other, and today only the first one exists.
