# Codex Review Brief — CR1 — content-refresh

> **Status: ready to commission.** One run covers two PRs: SEC1 (#103, dependencies and the React
> patch) and CR1, which is built on it, so CR1's range contains both while SEC1 is unmerged. The exact
> range is in the prompt that commissions this. The reviewer's returned record is appended here afterwards.

## Is this review required? (D-SYS-1)

**Yes.** The diff touches gated pages, the CMS upload path and the approval-state notice, it patches
the framework's copy of React, and it comes with a procedure that rewrites live content and deletes
objects. PP6b, PP6c, PP7 and PP8 each drew a BLOCKING verdict that was right. **No merge while a
Blocking finding stands.**

## Pin the range before reviewing

```bash
git fetch origin
git merge-base origin/main claude/sprint-cr1-content-refresh   # -> MERGE_BASE_SHA
git rev-parse claude/sprint-cr1-content-refresh                # -> HEAD_SHA
git log  --oneline MERGE_BASE_SHA..HEAD_SHA
git diff --stat     MERGE_BASE_SHA..HEAD_SHA
```

If #103 has merged by the time this runs, that merge-base moves. The range of this first round stays
`89ffe71..HEAD_SHA`, so it still covers both PRs.

---

# The brief

You are my independent code reviewer for the Palestine House website.

Read [`AGENTS.md`](../../AGENTS.md) in the repo root **first**. It governs you: review style (serious
issues only), the review priorities, the checks, and the 🔴 **Palestine House gating checks**, any
failure of which is blocking. This brief adds facts; it does not relax a single rule in that file.

**Scope:** the branch **diff only**, inside the pinned range below. **Do not make changes, stage,
commit, push, merge, install dependencies, or run migrations or content steps.** Do not write to any
database or bucket. Do not critique the approved copy or the locked design.

## Review target

- Repo: `palestine-house` — **this GitHub repository is PUBLIC**
- PRs: [#103](https://github.com/86400websites/palestine-house-website/pull/103) (SEC1) and
  [#104](https://github.com/86400websites/palestine-house-website/pull/104) (CR1)
- Branch: `claude/sprint-cr1-content-refresh`, on top of `claude/sec1-dependencies` (context only; neither
  is the review scope)
- **Immutable range: `MERGE_BASE_SHA..HEAD_SHA`, given in the commissioning prompt, never a branch name**
- Sprint records: [`docs/sprint-prompts/cr1-content-refresh.md`](../sprint-prompts/cr1-content-refresh.md) and
  [`docs/sprint-prompts/sec1-dependencies.md`](../sprint-prompts/sec1-dependencies.md)
- Review round: 1 — first round

**Expected changed paths.** *From SEC1:* `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`,
`patches/**`, `.gitattributes`, `.github/workflows/morning-check.yml` (one line), `docs/PROJECT-STATUS.md`,
`docs/sprint-prompts/sec1-dependencies.md`. *From CR1:* `src/app/**`: public and platform pages, including
`(platform)/not-found.tsx`; the admin content landing page and the admins, files, focus-areas and pages
screens; the root `layout.tsx` (metadata) and `opengraph-image.tsx`; `src/app/terms/page.tsx` (deleted).
`src/components/layout/**`, `src/components/sections/**`, `src/components/motion/reveal.tsx`,
`src/components/shared/**`, `src/components/workspace-v2/**` (`pw-ask-hq.tsx` deleted),
`src/components/admin/**`; `src/lib/site.ts`, `src/lib/auth/actions.ts`, `src/lib/admin/**`,
`src/lib/workspace-v2/**`; `src/lib/support/**` (deleted); `src/styles/**`; `scripts/lib/connect.ts`,
`scripts/verify-public-copy.ts`, header notes on two historical scripts and
`scripts/extract-mockup-spec.ts`; `tests/e2e/**`; `playwright.config.ts` (one comment); and current-fact
documentation: `AGENTS.md`, `CLAUDE.md`, `README.md`, `docs/**`, and the facts inside `.claude/skills/**`.
New files: `src/components/workspace-v2/pw-community-contacts.tsx`, `src/components/admin/reveal-when-stacked.ts`,
`src/lib/admin/file-safety.ts`, `src/lib/workspace-v2/shared-resources.ts`, `scripts/cr1-extract.ts`,
`scripts/cr1-content.ts`, `scripts/lib/cr1.ts`, `scripts/verify-svg-safety.ts`, `docs/CR1-RELEASE-RUNBOOK.md`,
`docs/content-refresh-cr1-reconciliation.md`, this brief and the sprint record. **Nothing under
`supabase/`, and no change to `next.config.ts`, `src/middleware.ts` or `.gitignore`.**
Confirm both SHAs resolve and the actual file list matches before reviewing. A mismatch is reported and
the review stops. This list was written by hand before the commit, on purpose: one generated from the
diff would always match it.

## Source package and precedence

The delivery is the owner's and is gitignored, at `docs/source-assets/content-refresh-cr1/New Content/`.
It arrived under `public/` and was moved before anything was served or built. Its contents and the
private artifacts beside it (`_private/`: manifest, identity map, spec, snapshots, archive) are not in
the diff and must not be.

Where sources disagree, in this order: the owner's sprint brief; `Privacy_Policy.md` for `/privacy`;
`Public_Website_Copy.docx` and `Private_Website_Copy.docx` for their surfaces; the supplied learner
files for bytes and guide bodies; existing approved copy for anything they do not cover. So `/terms` is
removed although the copy document says to keep it, and the policy replaces the document's earlier
privacy placeholder.

## Read for context

- [`AGENTS.md`](../../AGENTS.md) in full, first.
- The sprint record, [`docs/CR1-RELEASE-RUNBOOK.md`](../CR1-RELEASE-RUNBOOK.md) and
  [`docs/content-refresh-cr1-reconciliation.md`](../content-refresh-cr1-reconciliation.md).
- [`docs/PROJECT-STATUS.md`](../PROJECT-STATUS.md) §1, D-CR1-a…e in §4, D-CR1-1…6 in §5, §7.
- [`docs/SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) §15 ·
  [`docs/SUPABASE-MCP-SAFETY.md`](../SUPABASE-MCP-SAFETY.md).

## Sprint intent

- **Goal and exit condition:** replace the private learner content with the owner's delivery (22
  Overviews, 22 Simple Guides, 83 practical resources: 127 files) and align public and private copy
  with the supplied documents, without rebuilding anything. Done only when the owner has run the
  release on production and it verifies.
- **Owner-authorized exceptions:** this sprint jumps the queue ahead of SYS1.5. `/terms` is removed
  although the supplied copy document says to keep it. `/privacy` is the owner's `Privacy_Policy.md`.
  Copy comes from the supplied documents rather than `docs/page-copy/`. Header and footer text
  changes are authorized; their design is not changed. Continuous execution with no per-step commits.
  On 2026-10-31 and 2026-11-01 the owner widened the scope: "fix all the bugs", clear the other open PRs,
  and let finished videos go in from the CMS without a sprint. So the fixes for `PROJECT-STATUS` §7
  #12–#16, the dependency updates and the section video field are in scope, and D-CR1-1…6 are the
  engine's recorded calls, for the owner to overrule.
- **Intentionally out of scope:** hardening and monitoring (SYS1.5, SYS3); any schema, RPC or RLS
  change; a redesign; a major Next upgrade.
- **Database state:** no migration ships. **Production is on `0034` and still serves the previous
  release.** TEST holds the CR1 content, released and rehearsed.
- **Preview state:** the full suite ran at `9c28bfb` against that commit's Preview, at desktop and 320px, on
  2026-11-02: 157 of 157. Only documents changed after it. The earlier red run at `a3ba14e` is explained in the
  sprint record.

## Standing repo facts — already decided, not new findings

- **The reviewer cannot run the content steps or see the delivery.** The delivery, identity map, spec,
  snapshots and archive are gitignored under `docs/source-assets/content-refresh-cr1/`. Review the
  logic; verify the evidence record rather than re-running it.
- **`pnpm run test:e2e`** needs a deployed Preview and robot credentials a reviewer does not have.
  The build side runs it and records the result.
- **Public writes are not yet rate-limited or CAPTCHA-verified** (SYS1.5, §7 #1). This sprint neither
  fixes nor worsens that, and it removes one gated write surface.
- **`submit_support_request` and `support_requests` stay in the database, unreached.** Their removal
  would be a schema change. The RPC remains approval-gated.
- **Migrations `0027`–`0034` are immutable.**
- **Old band now includes 88** as a previous-release number. It correctly survives in history.
- **`docs/content-v2-spec.json` holds the previous release's 22 guide bodies and intros, in public git
  since `664b7ec`.** The owner declassified them on 2026-08-16 (`PROJECT-STATUS` §8), and this sprint
  does not touch the file. CR1's guides reuse many of those sentences, so that wording is already
  public, and the owner has been told. For hunt item 3, report CR1-only text found in a tracked file.
- **The two Community Contacts links in `pw-footer-actions.tsx` are plain anchors on purpose,** not a
  `next/link` oversight, and a same-page search hit is one too (`HitLink`): `Link` changes a fragment with
  `pushState`, which fires no `hashchange`.
- **`patches/next@15.5.28.patch` is deliberate.** It carries React's own fix, react#36134; `patches/README.md`
  has the reasoning and `docs/sprint-prompts/sec1-dependencies.md` the measurements. Loading boundaries were
  built, measured and dropped; that record says why. Check the patch against the upstream change.
- **`NO_VIDEO_LINK` is deliberate.** `admin_update_platform_section` reads a blank as "keep" and `0029` is
  immutable, so taking a section's video link off stores a value that is not a URL, and `safeHttpUrl` turns it
  back into nothing for every reader. It avoids a migration.
- **A `.docx` is checked by name, not content** at the Files screen. That predates CR1, and only an admin can
  upload.
- **`main` has no required status check** (`PROJECT-STATUS` §7 #17). It is a repo setting, logged for the owner,
  and not something this diff can change.
- **A comment in `next.config.ts` (line 55) still says the Files screen accepts PDFs.** It is history about an
  earlier config decision, and that file is out of scope here, so it stays.
- **`verify` only notes a video link added after the snapshot, and still fails on one the snapshot held that
  has changed or gone.** The tool only writes back the link it read, so an addition cannot be its doing, and the
  owner may add finished videos during the release. A rollback still takes such a link off, and the runbook says so.
- `src/lib/admin/file-safety.ts` says what it can and cannot catch, and `scripts/verify-svg-safety.ts` holds
  its cases.

## Evidence

Measured against TEST, apart from the Preview run named below. The full record is in the sprint record's
"Checks & results", "Evidence" and "After the first report". **None of this is a production result.**

- **Inventory.** 156 of 156 delivered files verified against their hashes after the move. 127 learner
  files (22 Overviews, 22 Simple Guides, 83 practical resources: 80 DOCX, 1 PNG, 2 SVG), 26 video scripts
  never uploaded, 3 copy documents. Three independent lists (the folder, the copy document, the private
  identity map) agree for all 22 focus areas.
- **Replacement.** 22 guides and 76 templates replaced under the same ids; 22 Overviews and 7 templates
  added under new ids; 12 retired; 13 cross-links. `76 + 12 = 88`, `76 + 7 = 83`, `22 + 22 + 83 = 127`.
- **Bytes.** 127 downloads byte-checked as a plain approved partner after `switch`, after `retire` and
  after `cleanup`. In a real browser, 140 downloads (the 127 plus the 13 shared rows): 140 exact names,
  140 exact hashes.
- **Cleanup.** 110 superseded objects removed by an explicit list after a byte check of all 127; bucket
  holds 127; 0 strays; re-run removes nothing.
- **Rollback.** Seven runs. The last, with the final tool on the final packages, from the released state:
  `restore-objects`, `rollback`, the retired-row SQL, `verify-rollback` and `remove-new-objects`, then
  independent read-only fingerprints of all six stores equal to the pre-CR1 baseline, with no hand fix. The
  release then ran forward again with no step retried, so TEST is in the final state. From straight after
  `switch`, all six matched on an earlier tool, and the four compared matched with the rollback code as it is
  now. One earlier run wrote the "no video" marker on all five sections; `verify-rollback` missed it, only the
  fingerprints caught it, and the sprint record has the account.
- **Refusals seen on TEST, with no ledger write.** No target; `--target production`; missing production
  credentials; `rollback` before `restore-objects`; `switch` and `snapshot` after a content edit; `switch`,
  `snapshot` and `rollback` with a file added in the CMS. `--dry-run --target prod` creates no client.
- **In a simulator only** (the real tool on a fake backend): an interrupted rollback, a failed retake, a
  file replaced in the CMS after `switch`, and injected download faults. The sprint record lists them.

**Commands at the pushed head `9c28bfb`:** CI green; `pnpm run typecheck`, `lint` and `build` exit 0; the
extractor exit 0; the copy checker exit 0 with 74 checks; `verify-svg-safety` exit 0; `pnpm run test:e2e` on that
commit's Preview, with the owner's robots, **157 of 157 with no flake**, all ten journeys included. Only documents
changed after that head. The sprint record's "Checks & results" has the full table.

**The guards, watched failing, on a scratch build with the faults put in on purpose.** AC-002 and AC-006 went red with
one admin page's gate removed. CT-012 went red at once with React's fix taken out, on its check of the shipped copy; its clicks
alone lost a click in 7 of 12 runs.

**Production's rules, compared read-only with TEST's.** Policies, columns, constraints, buckets, and all 46 functions
with their grants match, whitespace and comments aside, except `admin_cutover_focus_areas`, an earlier sprint's
one-off that this release does not call. Its 110 private files match the 110 the rehearsal started from, by checksum and
size.

**Actual state.** TEST holds the released CR1 content, rehearsed forward and back. **Production is on
`0034` and serves the previous 88-template release, untouched by this sprint: it was only read, through
the read-only MCP.** `--target prod` has only ever reached its refusals and a dry run.

**Known gaps, all still owed:**

- J1 sent its marked email from the Preview and the form reported success. Whether it arrived is for the owner's
  inbox to show (D-CR1-4), and the hosted Supabase email templates are out of reach here.
- D-CR1-1…6 are decided as the engine's recorded calls (`PROJECT-STATUS` §5), for the owner to overrule, so
  they are not a merge condition.
- `main` lists no required status check (`PROJECT-STATUS` §7 #17), which is the owner's to set.
- Every production step in the runbook. The production path has never run.
- Rehearsal limits: the final tool's rollback ran from the released state; from straight after `switch` it ran on the
  same rollback code, with four stores compared. Partner downloads on production rest on the rehearsal, the read-only
  comparison above, and the non-admin account step 7 asks for.

## Hunt list

1. **Identity mapping.** Is any row matched by title, position or code rather than by the id its
   target's snapshot recorded? Can a re-run after `switch` confuse a row? Is a new resource able to
   reuse an old id?
2. **Content fidelity.** Do `cr1-extract.ts`'s three-list check and word-for-word check really fail on
   a mismatch? Does anything rewrite words rather than marks?
3. **Private exposure.** Does any tracked file carry a guide body, expanded topic copy, the private
   manifest, an id or a storage key? Does anything new reach a pending or anonymous caller, a client
   bundle or a public asset? Is the delivery entirely out of `public/`?
4. **Safe replacement.** Partial failure and re-run at every step. Can anything be overwritten? Is
   upload truly inert? Are `retire` and `cleanup` truly guarded, and is the cleanup set explicit and
   rechecked immediately before each delete?
5. **Rollback.** Do `rollback`, `rollback-sql`, `restore-objects`, `verify-rollback` and
   `remove-new-objects` restore exact state, including after a partial switch and when `retire` never
   ran? Is anything different on `--target prod` from what TEST proved?
6. **Production boundary.** Can any mutating step reach production without the typed confirmation at a
   terminal? Does a dry run create a client? Do the runbook's commands and expected output match the
   code?
7. **Access gates (blocking).** Each gated page still gates itself before constructing JSX, including
   `support/page.tsx`, `dashboard/page.tsx` and the now-async `PwPendingState`. `/account` keeps its
   exception. Anonymous and pending callers receive no rows, bodies, paths or bytes.
8. **PNG and SVG.** The CMS checks in `file-safety.ts` and `file-actions.ts`: path safety of the new
   `objectKey`, the gate still first, the code-to-format rule, and downloads still via signed URLs.
9. **Copy coverage.** No central claim survives on a public page, form state, email or metadata, and
   `scripts/verify-public-copy.ts` cannot report a pass it did not check. Do not critique the wording.
10. **Terms and Privacy.** `/terms` is the site's own 404 with nothing linking to it, and `/privacy` is
    the delivered policy.
11. **Videos.** All 26 placements unavailable and truthful on release; no script used as a link or
    uploaded; no dead embed. A link pasted in the CMS goes live on save, is held to YouTube and to
    `safeHttpUrl`, reaches no pending or anonymous caller, and can be taken off. The release tool neither adds
    nor removes a link, and rollback restores links exactly.
12. **The dependency update.** The patch is React's change and nothing more, and it applies from a clean
    install. Do any of the bumps change behaviour the app relies on: `@supabase/ssr` and `supabase-js` around
    sessions and cookies, `sanitize-html` and `marked` around guide rendering, `zod`, framer-motion 13?
13. **The admin changes.** `checkCode` in `file-actions.ts`: can a code still be made untrue, and can it refuse
    something legitimate, such as a save that leaves the code alone? PDFs refused consistently, client and
    server. No gate moved. The focus-area and Pages forms now submit through `onSubmit` so a refusal resets
    nothing: does any field still post a value the admin did not choose? When the guide read fails the form
    leaves the guide field out: can any path still write an empty body over a real one?
14. **Regressions.** Shared CSS edits, anchors, metadata, and the Playwright guards (the production
    guard, `@morning` read-only and credential-free, journeys `retries: 0`).

## Safety lines

- Never open, read, echo or copy `.env.local` or any live-value env file. Suspect a secret? Report its
  file, line and type, never the value.
- The production Supabase project is read-only from here. Never write to production through any
  channel.
- **This repository is public.** Nothing in your returned record may carry partner or applicant
  identities, account email addresses, gated guide or template content, Storage object paths, or
  dashboard deep links.

## What to return

A paste-ready record. Open with the **confirmed range** (both SHAs), **scope match** (YES or NO),
**files and context inspected**, and **commands and evidence**. Then one block per finding:

### Finding [N]
- **Severity:** Critical / High / Medium / Low
- **Merge call:** Blocking / Should-fix (any failure of an `AGENTS.md` gating check is Blocking)
- **Location:** `path/file.ts:line`, plus the route or flow
- **Issue:** one or two evidence-based sentences
- **Why it matters:** the concrete consequence
- **Failure scenario:** concrete input or state → wrong outcome
- **Suggested fix:** the specific minimal fix
- **Confidence:** high / medium / low

Then **missing checks**. If nothing is wrong, say **No findings** and list what you verified. End with
exactly one verdict:

> **Verdict: [APPROVE / REQUEST CHANGES]** — [one-line reason].
> Reviewed range: `MERGE_BASE_SHA..HEAD_SHA` · Reviewed by [REVIEWER] on [DATE].

## After the review

- Append the returned record here. Blocking findings are fixed by the builder on the same branch.
- A commit that only appends the returned record does not change what was reviewed: name it in the record.
- **Any substantive change after the reviewed head invalidates the approval:** re-run the checks,
  retest the Preview and re-review at the new head.
- Merging is the owner's, and for CR1 it happens at step 6 of the runbook, not before.

---

# Reviewer's record

*(None yet.)*
