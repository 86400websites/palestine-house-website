# SYS1 — System alignment (Stage 5, sprint 1 of 4)

> **Status:** BUILT 2026-08-22, awaiting the owner's review + merge · **Branch:** `claude/sprint-sys1-system-alignment` (from `main` = `a276b3b`, the PR #88 merge) · **Diff:** 38 files, +5,043 / −64 · **App code touched: none.**

---

## 1. Why this sprint existed

The owner added the reusable **`Website-Development-System`** SOP to the repo and asked for three things, in his words: make sure the repo follows the development system, then add testing, then error tracking — "maybe we should make this like a sprint where we first ensure we are using the system and then we activate the testing setup and then error tracking one by one."

That became Stage 5: **SYS1 alignment → SYS1.5 hardening → SYS2 testing → SYS3 error tracking.** SYS1 is the docs-and-config sprint that makes the other three land on a repo whose rules agree with each other.

## 2. What was done first: a verified audit, not an assumption

Before changing anything, a 14-agent audit compared the repo against the SOP across seven dimensions, with **every non-`present` claim re-checked by an independent adversarial verifier**. It produced 103 findings and is saved at [`../notes/system-compliance-audit-2026-08-21.md`](../notes/system-compliance-audit-2026-08-21.md), together with the **D-SYS-1…10** decision log.

Its verdict: the repo already followed the system's delivery *spirit* — filled governing docs, 43 sprint records, 15 review records, CI running typecheck/lint/build plus a gitleaks scan the SOP never asks for, strict TypeScript, zero unexplained lint suppressions — but had never installed about a third of its *file surface*, and the entire testing and error-tracking layers did not exist in the codebase at all.

The audit is the traceable basis for the whole stage: every change below maps to a finding, and nothing beyond them was in scope.

## 3. The nine gated sub-steps

| # | Sub-step | Commit | What shipped |
|---|---|---|---|
| 1a | Audit record | `d48de6d` | The 103 verified findings + the D-SYS decision log |
| 1b | Tracker truth | `9356aaf` | Stage 4 closed (PP8 = **PR #88**, prod on `0034`), Stage 5 opened, D-FA11-b closed, D-PP-a re-scoped |
| 1c | Governing-doc currency | `02875d5` | Proof numbers → **4 · 22 · 88** across 9 files; DB claims re-verified against production |
| 1d | Docs batch 1 | `b8832c8` | TECHNICAL-INTEGRITY · BROWSER-TOOLS · ENV-VARS-SAFETY · QA-CHECKLIST · ROLLBACK |
| 1e | Docs batch 2 | `f198178` | LAUNCH-CHECKLIST · HANDOFF · CODEX-REVIEW-PROMPT · root `README.md` · POST-LAUNCH-BACKLOG |
| 1f | Templates | `31c88ce` | `docs/templates/` — 11 skeletons + index, + the sprint-prompt guide |
| 1g | Skills | `5cddef5` | `browser-qa` installed; `close` + `sprint-prompt` surgically edited |
| 1h | WORKFLOW + CI | `8fd4e60` | Review became a merge gate; `pnpm audit` + job timeout added |
| 1i | Exit gate | *(this commit)* | 5-lens full-diff review, 22 confirmed findings fixed, trackers finalised |

## 4. What changed, in substance

- **The trackers stopped lying.** PP8 had merged on 2026-08-20 and nothing said so. §1 still narrated PP7 and migration `0033` while §7 of the same file recorded `0034` applied to production.
- **Independent review became a gate.** `WORKFLOW.md` §8 was titled *"Optional Codex / agent review workflow"*; it is now mandatory on any risky diff (auth · approval gate · RLS/schema · env · security headers · CSP), with an immutable `merge-base..head` range, a saved record, no merge over a Blocking finding, and approval invalidated by any substantive change. This **codified existing practice** rather than inventing a rule — `docs/code-reviews/` already held records for every major sprint.
- **The repo stopped contradicting itself** on pushing (D-SYS-2 standing authorization vs "never push"), on hook-skipping (an escape clause vs an absolute ban), and on the proof numbers.
- **CI gained Code Check 6** — `pnpm audit`, blocking at `critical`, plus a non-blocking high/moderate report — and a 20-minute job timeout.

## 5. Facts corrected by checking production rather than the docs

Sub-step 1c queried the production database read-only instead of trusting the trackers, and **two documented claims turned out to be wrong**:

1. **`programming_sessions` was never dropped.** `CLAUDE.md` and `AGENTS.md` both said `0030` dropped all four retired tables. Three are gone; this one survives with RLS on, **zero policies and zero rows**. `AGENTS.md` had been telling reviewers to verify "public read anon-safe; writes owner-scoped" — policies that do not and should not exist.
2. **D-PP-i was already discharged.** `CLAUDE.md` said the `storage_bucket` half of SECURITY-CHECKLIST §15 was "still owed by PP6's `0029`". It shipped: the `resources_private_bucket_shape` CHECK (`is_public OR storage_bucket = 'resources'`) is live on production.

Verified shape: 5 `platform_sections` rows (4 toolkit + `about`), 4 groups (5·6·6·5), 22 topics, 112 resources = 22 guides + 88 templates + 2 public booklets, 110 Storage objects.

## 6. The exit-gate review

Five independent lenses over the full `a276b3b..HEAD` diff — truthfulness, internal consistency, scope/safety, the CI change, and system usability — with **every finding sent to an adversarial verifier instructed to refute it**.

**48 raised → 22 confirmed → 22 fixed. 6 explicitly refuted.**

⚠️ **20 verification agents failed on a session limit.** Their findings are neither confirmed nor dismissed; the fixes applied cover the confirmed set only. If a later reviewer wants full coverage, that is the gap to re-run.

**The dominant defect class was self-inflicted: later sub-steps invalidating docs written by earlier ones.** Worth naming, because it is the failure mode of any long docs sprint:

- **The CI job rename (the one with real teeth).** 1h renamed the job's *display name* to add "· Audit". That string **is** the branch-protection required-check context — the exact foot-gun `TECHNICAL-INTEGRITY.md` warns about in its own words. Reverted at 1i, with a `DO NOT RENAME` comment left in `ci.yml` explaining why. Branch-protection state cannot be read from this machine (no `gh` CLI), so the safe move was to stop the name moving at all.
- `TECHNICAL-INTEGRITY.md` — written at 1d, claimed "nothing here is aspirational", then stated four things about `ci.yml` that 1h made false.
- `CLAUDE.md` line 88 still carried the pre-PP7 "tables still in the database" claim — **the exact defect 1c was commissioned to remove**, missed in one of two places.
- Three docs told readers to disregard `WORKFLOW.md` §8 as stale, after 1h had already fixed it.
- Two docs warned that `*-768.png` was not gitignored, in the same commit that added it.

## 7. Live-site problems found and deliberately NOT fixed

All three are outside a docs+config sprint. They are logged in `PROJECT-STATUS.md` §7 so they cannot be lost:

| # | Issue | Why not here |
|---|---|---|
| **§7 #5** | **`/privacy` over-claims data retention.** The live page says we keep "your progress on the platform"; saved progress was dropped at D-PP-b and `checklist_progress` dropped by `0030`. A privacy notice claiming retention we do not have is a legal/trust surface. | App code, and its words are **locked copy** — the owner supplies or approves the replacement. |
| **§7 #6** | **`next@15.5.20` carries HIGH advisories** — SSRF in Server Actions, SSRF in rewrites, Server Action DoS — patched in `>=15.5.21`. 22 advisories total (0 critical / 14 high / 8 moderate). | A framework bump needs its own build, Preview and review. **A Dependabot grouped PR is already open on `origin`.** |
| — | ~8 stale `src/` code comments still describing "all 33 topics" / "297 templates". | Any edit is an app-code diff; this sprint excluded `src/`. |

## 8. Lessons

1. **Verify against the system, not the record.** Both DB corrections in §5 came from querying production; both would have survived another sprint if the trackers had been trusted.
2. **A long docs sprint invalidates its own early output.** Six of the 22 confirmed findings were sub-step N breaking sub-step N−1's doc. A re-read pass over earlier sub-steps belongs in the exit gate of any multi-step docs sprint — this one caught them only because the exit gate reviewed the *whole* diff rather than the last commit.
3. **Never rename a CI job on a repo with branch protection you cannot inspect.** The steps inside a job are free to change; the display name is an API contract with GitHub.
4. **Install docs that admit what is missing.** Every installed file marks the gaps — Prettier waived, tests scheduled, branch protection unverified, the Launch Gate not passed — because a doc that flatters the repo is how the repo stops noticing.
5. **`git add -A` is still banned here, and now enforced.** D-SYS-5 rested only on care; the SOP folder is now gitignored so a stray blanket add cannot commit 57 duplicate governing docs.

## 9. Follow-ups

- **Owner:** review + merge the PR; place the off-machine copy of the 297-file cold archive (the last PP8 item); decide on §7 #5's replacement wording; act on §7 #6 before SYS2; **confirm the external SOP master still exists** before the in-repo copy is deleted (it was not locatable from this machine — D-SYS-5).
- **Owner, one to verify in GitHub:** branch protection on `main` lists the required check **`Install · Typecheck · Lint · Build`** and that a red run blocks merge. An unverified gate is the same as no gate.
- **Next sprint:** **SYS1.5** — Upstash rate limiting + Turnstile on the public writes, fail-closed in Production (needs the owner's accounts). Then SYS2, then SYS3.
