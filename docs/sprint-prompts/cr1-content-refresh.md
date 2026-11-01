# Sprint CR1 — New content replacement and website copy alignment

| | |
|---|---|
| **Date merged** | Not merged. Built and proven locally and on TEST; commit, push, PR, Preview, independent review and the production release are all still to come. |
| **Branch / PR** | `claude/sprint-cr1-content-refresh` / PR not opened |
| **Goal** | Replace the private learner content with the owner's new delivery and align the website copy with it, without rebuilding the site. |
| **Status** | 🔵 **Ready to commit.** Not Done, and production is not updated. See "What is still owed". |

Owner-requested on 2026-10-30, ahead of the planned next sprint (SYS1.5), with an explicit
continuous-execution override: no sub-step gates, no commits or pushes until the owner says so.

## What shipped

**Source protection.** The delivery arrived under `public/`, where Next.js would have served it.
It moved to the gitignored `docs/source-assets/content-refresh-cr1/New Content/`: every file hashed
first, copied without overwrite, verified 156 of 156, and only then removed from `public/`.

**Content, as tooling and a private spec.**

- `scripts/cr1-extract.ts` (offline) proves the delivery against its hash manifest and writes a
  private spec. For each focus area it makes three independent lists agree: the folder on disk,
  `Private_Website_Copy.docx`, and a private identity map. It reads summaries and expanded copy out
  of the document rather than retyping them, and checks each guide body word for word against its
  source.
- `scripts/cr1-content.ts` runs the release in explicit steps: `snapshot` → `upload` → `switch` →
  `verify` → `retire` → `cleanup`, and back: `restore-objects` → `rollback` → `rollback-sql` →
  `verify-rollback` → `remove-new-objects`. Every step is resumable, every `--dry-run` is offline,
  and production demands a typed confirmation at a real terminal.
- Identity is by row id, matched by purpose and checked against the old documents' actual text. See
  [`content-refresh-cr1-reconciliation.md`](../content-refresh-cr1-reconciliation.md).
- `src/lib/admin/file-safety.ts`: PNG signature and SVG safety checks, shared by the loader and the
  CMS.

**The result** (sanitized detail in the reconciliation): 22 guides and 76 templates replaced in place
with the same ids; 7 templates and 22 Overviews added; 12 templates retired; 13 cross-links. Old 88,
new 83. All 127 learner files reachable, and the 26 scripts mapped privately and never uploaded.

**Private platform.**

- A focus-area panel now holds: the resource introduction; an Overview download; the single Simple
  Guide card; the Templates grid; and, on 10 focus areas, "Shared resources from other focus areas".
- Rows carry the supplied download labels: Download Word File, Download Logo, Download Editable
  Layout.
- Search gains an OVERVIEW kind and indexes a shared resource only at its home.
- Ask HQ is replaced by the Community Contacts guidance block at `/support#community-contacts`. Its
  form, server action and category list are deleted; the RPC and table stay, unreached. The banner and
  footer reach it by plain anchors, on purpose: see the lost click under "Deviations & learnings".
- A declined account now sees the truthful notice on section pages too.
- CMS: PNG and SVG accepted with content checks; a new upload keeps its own filename.

**Public site.** All of `Public_Website_Copy.docx` applied in place, across navigation, footer,
invitation block, every public page, forms, states, emails and metadata. `/terms` removed.
`/privacy` is `Privacy_Policy.md` word for word.

**Checks.** `scripts/verify-public-copy.ts` now parses the supplied document and asserts on the pages
the strings its labels designate, plus a named list of copy under labels the parser has to skip, the
policy word for word, and that no central claim survives. A few low-risk labels are checked by neither,
and the script's header names them. The Playwright suite and `docs/FEATURE-LIST.md` follow the release.

## How it was built (the prompt)

The owner's brief is summarised here rather than pasted, because it names local paths. Its
substance: execute continuously; relocate and hash-verify the delivery first; prove everything on
TEST and write nothing to production; preserve topic identities, slugs and routes; preserve resource
ids for genuine replacements; keep filenames exactly as supplied; add no schema, no dependency and no
new page; keep videos unavailable; remove Terms; replace Privacy; do not claim Preview, review or
production results before they happen; do not commit or push.

## Checks & results

At the final working tree, on base `89ffe71`, before any commit, each exit code read. **None of this is a
Preview, CI or production result; those are still owed.**

| Check | Result |
|---|---|
| `pnpm run typecheck` | exit 0 |
| `pnpm run lint` | exit 0 |
| `pnpm run build` | exit 0 |
| `pnpm exec tsx scripts/cr1-extract.ts` | exit 0: 156 files verified, 22/22 guides word for word, spec unchanged by the re-run |
| `pnpm exec tsx scripts/verify-public-copy.ts` | exit 0: 74 checks, including 267 of 267 designated strings |
| `... verify-public-copy.ts --without-delivery` | exit 0: 45 checks, verdict `PARTIAL` as designed |
| `pnpm exec tsx scripts/verify-svg-safety.ts` | exit 0: 58 refused, 22 pass, 6 hostile 4 MB shapes |
| `playwright test --list` | 154 tests: 3 setup, 55 + 55 viewport, 9 journeys, 16 + 16 morning |
| Read-only projects, local build against TEST, disposable accounts | **108 of 108, no flakes.** The 2 CT-005 runs were left out: they need the owner's robot password |
| CT-010, no retries, repeated | 6 of 6, after failing about half its runs before the link fix |
| AC-004, no retries, parallel | 8 of 8 |
| Journeys J3, J5, J6, J7, local | 4 of 4, and all six TEST fingerprints unchanged afterwards |
| `verify --phase retired`, final tool, final state | ALL CHECKS PASSED: 127 downloads byte-checked, anonymous and pending refused |
| Real-browser verifier, final build | ALL PASSED: 140 downloads with exact names and hashes, 22 readers, 26 videos, 22 Overview rows, 83 template rows, 13 shared rows |
| Production, read-only, all six fingerprints | Unchanged from before the sprint |

## Evidence

Everything here was measured on the uncommitted working tree on base `89ffe71` (also `origin/main`
at the time), against the non-production project. **Nothing here is a Preview, CI or production
result.**

**Delivery.** 156 of 156 files verified against their hash manifest after the move: 127 learner files
(22 Overviews, 22 Simple Guides, 80 DOCX, 1 PNG, 2 SVG), 26 video scripts, 3 copy documents. Nothing
is left under `public/`, and the destination is gitignored.

**Guide fidelity.** 22 of 22 guide bodies match their documents word for word, once by the extractor
and once again in a real browser reading the rendered reader. Across the 22: 0 tables, 3 hyperlinks,
all 3 preserved, and no image in any body. The single image in each Overview and Simple Guide sits in
the Word page header, so the reader has nothing to drop and the download keeps it.

**Rehearsal on TEST, forward.**

| Step | Result |
|---|---|
| `snapshot` | 22 focus areas, 110 private rows, 5 sections; 110 objects archived and verified on disk |
| `upload` | Stopped on purpose after 10, hit a real `Bad Gateway`, resumed: 127 uploaded and read back. Re-run: 0 uploaded, 127 matching |
| `switch` | Stopped on purpose after 40, resumed: 29 created, 98 repointed, 22 focus areas and 5 sections rewritten. Re-run: nothing to do |
| `verify --phase switched` | 127 downloads byte-checked as a plain approved partner; denied for anonymous and pending |
| `retire` | 12 removed. Re-run: 0 removed, 12 already gone |
| `cleanup` | 110 removed, bucket holds 127, 0 stray. Re-run: 0 removed |
| `verify --phase retired` | ALL CHECKS PASSED, including after `cleanup` |

**Rehearsal on TEST, back.** The first four runs, on the tool as it then stood, each ended with
**independent read-only fingerprints of all six stores (resources, topics, elements, sections, groups,
Storage objects) equal to the pre-CR1 baseline**, and `verify-rollback` reporting MATCHES THE SNAPSHOT
EXACTLY. Three later runs are under "After the first report", the last of them with the final tool.

| Rolled back from | Result |
|---|---|
| The released state, three times (`retire` and `cleanup` had run) | The first time, `rollback` refused because the old objects were gone. `restore-objects` 110; `rollback` removed 29, repointed 98, restored 63 metadata changes, 22 focus areas, 5 sections; the retired rows' SQL restored 12; `remove-new-objects` 127 |
| Straight after `switch`, where a failed step 5 leads, with the 12 `OLD-` rows still present | `rollback` removed 29, repointed 98, restored 75 metadata changes, 22 focus areas, 5 sections; 0 rows left to restore; the SQL changed nothing; `remove-new-objects` 127 |

**Forward again, on the tool as it then stood.** `upload` 127; `switch` created 29, repointed 98, 22 focus areas
and 5 sections, in under two minutes; `verify --phase switched` passed; `retire` removed 12; `verify --phase retired`
passed. `cleanup` then hit a real `fetch failed` after 40 of 110, with no row affected: the bucket held 197 and
every row still had its object. Re-running it, as the runbook says, removed the other 70, a further re-run
removed 0, and `verify --phase retired` passed with the bucket at 127.

**Guards, each seen to refuse on TEST, and the ledger shows no write from any of them.** No `--target`;
`--target production`; `--target prod` without credentials, naming the four missing variables; `rollback`
before `restore-objects`; `switch` and `snapshot` after a deliberate content edit; `switch`, `snapshot` and
`rollback` with a file added through the CMS, each naming the focus area. A `--dry-run --target prod`
creates no client. The production path was never run: `--target prod` has only ever reached those refusals,
and that dry run.

**In a simulator only.** Some faults are too costly or too rare to stage on TEST, so a reviewer built a
simulator that runs the real tool, byte for byte, on a fake backend. These results come from there and not
from TEST. An interrupted rollback: `switch` refuses, and a retaken snapshot refuses. A failed retake: `switch`
refuses, because the archive and the snapshot disagree, and a re-run heals it. A retake with a file added
refuses, naming the focus area and the count. A file replaced in the CMS after `switch`: `rollback` warns with
the focus area and the code, and the replacement stays behind as one unreferenced object. A Draft focus area
refuses. A text edit made after `switch` is restored silently by `rollback`, and the runbook says so. Injected
download faults, with `verify`: a 429 or a 404 fails and names the status; a stall past the URL's lifetime is
retried with a fresh URL and passes; a deleted object fails and reports 126 of 127 present.

**The SVG check.** `scripts/verify-svg-safety.ts` runs the real function through the same decode the CMS
uses, and anyone can re-run it: 58 hostile or careless files refused, 22 legitimate shapes pass, and 6
hostile shapes at the 4 MB limit each finish inside its 5-second bound (under a second when measured). Both
delivered layouts pass, through `cr1-extract.ts`. The cases came from three rounds of attack, each file opened from disk in a real
Chromium with its requests recorded. The first review reproduced bypasses by namespace prefix, UTF-16,
ISO-2022-JP, character references and CSS escapes. A second-round reviewer wrote more than 60 more, and 21
fetched something while passing. After those fixes, a further 27 found 15 that still passed and acted: script
through a prefix route, remote fetches through style and encoding routes, a local request through CDATA. One
of those was opened by a bound I had added as a fix. After the last fixes, none of the attack sets has a file
that passes and acts. Chromium only, and no design tool was run: hand-written samples of common exports from
Figma, Illustrator, Canva, Inkscape's Optimized and Sketch pass, while exports carrying a DOCTYPE or extra
namespaces, or showing a visible web address, are refused with the reason. It reads text and is not a
sanitizer, and its header says so.

**The CMS in a real browser.** Journey AD-004, three times, in its first version: a refused type, size, PNG
code and script, then a PDF, a real PNG and a clean SVG uploaded, each downloaded by a partner under the name
it was uploaded with, and all removed again. A PDF has been refused since D-CR1-5, so the test now uploads a
Word file there and asserts the refusal; its result is under "After the first report".

**A real browser, local production build against TEST, as a real approved partner.** 140 downloads (127
plus the 13 shared rows): 140 exact filenames, 140 exact hashes. 22 Overview rows, 83 template rows, 13
shared rows, 22 expanded intros, 22 readers. 26 video placements, all truthful: "Video coming soon."
Search returns no retired title and no script. `/support#community-contacts` lands on a direct load,
has no form, and links to `/contact`. Pending accounts see only the notice; anonymous visitors land
on login; `/terms` is the site's 404; no Terms or HQ on any public route; no sideways scroll at 320px.

**Visual review.** Three independent passes over every public and private page at 1440px and 320px,
then a re-check from fresh scrolled screenshots: all 29 re-checked items held, and the last small
items it found were fixed and measured at nine widths. What predates CR1 is logged in `PROJECT-STATUS` §7 #12 and #13,
not fixed here.

**Self-review.** A multi-agent review of the whole diff through four lenses (access and security,
tooling and data, rendering, tests and docs), with each finding independently challenged: 22 findings,
17 upheld, none a broken gate or a leak of private content. All 17 were fixed or recorded. A second round
reviewed those fixes through five lenses (release tooling, the SVG check and CMS, the copy checker and tests,
the UI changes, and the brief line by line): 30 findings, 9 of them challenged and upheld as real and 21 low,
again with no broken gate and no leak. They were fixed or recorded (`PROJECT-STATUS` §5 and §7). That round
also confirmed all 267 designated strings against the running pages, the counts and identities on TEST, and
production's untouched state, read-only. Its limits: Chromium only, no real design-tool exports, no Preview.

**Phones, focus and own-row refusal, in a real browser.** All 22 cards at 320px and 390px, with Read more
shut and open: closing a card leaves the control in view and focused. The footer link from another page and
from `/support` lands on the block with focus on it, re-measured at desktop and 320px after those links became
plain anchors. 300 of 300 direct loads of three fragments landed at desktop and 390px. The disposable admin's
own Remove is refused with the reason, and the row stays.

## After the first report: the owner's hand-over

On 2026-10-31 the owner read the first report and handed the open calls over: "fix all yourselves and dont depend
on me". On 2026-11-01: fix the other open PRs and close them, and let finished videos go in from the CMS without a
sprint. They also added `.env.local`, which the project's tools load; it was never opened or printed here. Production
stays the owner's: the brief's boundary was not lifted, and the tool refuses an agent at its typed confirmation.

**Lost clicks and stuck admin forms: root cause and fix, in SEC1 (#103), which this branch is built on.** A React
bug, read line by line and matching the measured state. Measured on the committed code against TEST, with and without
the fix: clicks lost 12 of 100 to 0 of 100, Files-screen changes stuck 4 of 28 to 0 of 28. Record:
[`sec1-dependencies.md`](./sec1-dependencies.md). CT-012 now guards it.

**Videos.** The 22 focus-area links always came from the CMS. The 4 on `/dashboard` could not: their card never read
the column, and the Pages screen had no field. Now all 26 can, with no code change, proven both ways by journey
AD-006. The section RPC reads a blank as "keep", and it is applied, so taking a link off stores `NO_VIDEO_LINK`, which
is not a URL and which `safeHttpUrl` turns back into nothing. No schema or RPC change.

**The release tool had to change with that, and a rehearsal found a bug in the change.** `switch` passed a blank link
and `verify` failed on any link it found, so a video added in the CMS before the release would have been erased, or
stopped it. Both now leave links as they are. The tool and its database client had changed, so the whole release was
rehearsed again on TEST with the final packages, and that is where the bug showed: the new rollback wrote the "no
video" marker onto all five sections, though none had a link. `verify-rollback` said it matched, because its comparison
treats the marker as nothing, and only the independent fingerprints caught it. Fixed, then re-proven:

- Back from the released state on the final packages: `restore-objects` 110, `rollback` removed 29, repointed 98,
  metadata 63, focus areas 22, sections 5, 12 rows by SQL. After removing the marker that run had wrongly written, all
  six fingerprints equal the pre-CR1 baseline.
- With a link on a focus area and on a section before the snapshot: `snapshot`, `upload` 127, `switch`, `verify`, all
  passed, with both links in place. `rollback` from there, with the fixed tool: sections, topics, elements and
  resources all equal the fingerprints taken before the release, links included.
- A link added after the snapshot: `rollback` touched those two rows only, and took both off.
- Forward to the end, on a fresh snapshot with no links: `upload` 127 already present, `switch`, `verify`, `retire` 12,
  `verify`, `cleanup` 110, `verify`: bucket 127, ALL CHECKS PASSED. Elements, groups, objects, sections and topics
  are identical to the previous release's fingerprints. Resources differs only by the 29 new rows' new ids.

A real `fetch failed` stopped one `switch` at its sign-in, before it wrote anything, and re-running finished it.

**A self-review of that day's work, each finding challenged independently, and what it changed.** No broken gate and
no leak. These were real:

- *The CMS.* A failed guide read showed an empty box, so a Save, even one only adding a video link, could wipe the
  guide. React resets a form after every action, a refusal included, so a refused link also lost what else had been
  typed and dropped the Photo select to its first option, and the next Save wrote the wrong photograph. A "Saved."
  carried over from one page or focus area to the next. `checkCode` failed open when one of its two reads failed. The
  Short code hint said partners never see that code, and they do. All fixed, and AD-006 now guards the reset.
- *The tests.* CT-012 could not pass at 320px, because its selector found the closed menu's link. It also inherited a
  retry, the very thing that hid this bug. AD-006's clean-up could hang on a disabled button and report that instead
  of the real failure. All fixed.
- *The release.* `verify`, `retire` and `cleanup` failed on a video link added during the release, and the runbook
  then pointed at Rollback, so a finished video could have undone a healthy release. `switch` wrote a link read before
  the confirmation prompt, so one added while the prompt waited would have been erased. On production the tool would
  have tried any test-account names it found. The runbook never mentioned #103, whose merge method decides whether #104
  conflicts, and it told the owner to add the 4 `/dashboard` links at a time when the live screen has no field for them.
  The claim that rollback was exact "each time" went further than the record. All fixed; the claim is now what was run.
- *GitHub.* `main` lists no required status check (`PROJECT-STATUS` §7 #17). It is a repo-wide setting, so it is logged
  for the owner and not changed here.

Checked and left alone: every card's stored text fits the form's limits (expanded copy 929 of 1,000 characters, summary
100 of 500, title 46 of 200, guide 5,736 of 100,000), so every card can be saved. A comment in `next.config.ts` still
mentions PDFs; it is history, in a file this sprint does not touch.

**Rehearsed again, with the final tool on the final packages.**

- `verify` with a link added since the snapshot, on a focus area and a section: two `note:` lines, ALL CHECKS PASSED.
- `verify` against a snapshot holding links that are now gone: FAILED, with `video link changed` for both.
- Back from the released state: `restore-objects` 110; `rollback` removed 29, repointed 98, metadata 63, focus areas 22,
  sections 5; the SQL restored 12; `verify-rollback` MATCHES THE SNAPSHOT EXACTLY; `remove-new-objects` 127. **All six
  fingerprints equal the pre-CR1 baseline, with no hand fix.**
- Forward to the end: `upload` 127; `switch` created 29, repointed 98, 22 focus areas, 5 sections; `verify`; `retire` 12;
  `verify`; `cleanup` 110; `verify`: bucket 127, ALL CHECKS PASSED, no step retried. Elements, groups, objects, sections
  and topics are identical to the previous run's fingerprints, and resources differs only by the 29 new rows' new ids.
- A card saved from a stale form, simulated on the released state (its title, summary and guide changed, and a link
  added): `verify` named only that card's fields and noted the link; `switch` rewrote that one card, left the other 127
  files alone and kept the link; `verify` passed; and with the link cleared, all six fingerprints were back exactly.

**A second review, of those fixes, found more, and one was a regression of mine.** With the form no longer reset, a
new focus area left a filled form with no id behind it, so each further Save created another: it now opens as its real
row, and AD-003 proves it. A blank photo or focal point on Pages showed blank though the page kept its value. A Save now
writes the guide only if it was edited, so a tab opened earlier cannot put old text back. AD-006's clean-up could not run
after a timeout, and it trusted the screen rather than reading the row back. AC-002 could not see a leaked admin heading
on five routes, because the real headings end in a full stop. The runbook sent the owner to the live Focus areas screen
before step 6, where these same bugs are still live, so video links now wait until the release closes. Its step 7 named
no partner account, so an admin could have "checked a partner's view" through a different Storage policy. All fixed. That
review's own challengers and its completeness pass stopped at a usage limit part-way, so its findings on the tool, the
docs and the gates were judged here rather than challenged independently.

**The guards, watched failing, on a scratch build with the faults put in on purpose.**

- The Files page's admin gate removed: AC-002 went red, naming the leaked heading.
- React's fix taken out: CT-012 went red at once on the shipped-React check. Its clicks alone, 12 runs across both
  viewports: 7 lost a click, 1 ran out of time on a slow load, 4 passed. That is what a race allows, and why the first
  check exists. Before the review's changes to the test, the same clicks caught it in 5 of 12.

**Production's rules, compared read-only.** 8 row and Storage policies, 100 columns, 37 constraints, 2 buckets, and 46
functions with their grants equal TEST's, whitespace and comments aside. The one function that differs,
`admin_cutover_focus_areas`, is a one-off from an earlier sprint that this release does not call. Production holds no
video links today, and has 9 approved partner accounts and 2 approved admins.

**The decisions.** D-CR1-1…6 are recorded in `PROJECT-STATUS` §5 as the engine's calls, not the owner's signature, for
the owner to overrule. One stays with the owner because nothing here can reach it: the hosted Supabase email templates.

**§7 #12–#15 fixed.** The header on pages with no hero; the visual items, after an independent review of every page at
seven widths, with each finding challenged; a row's code can no longer be edited into something untrue; PDFs are
refused at the Files screen; Watch Video is disabled with its message in the accessible name, as Private copy asks.
What is left of #13 is listed there, with why.

**The other open PRs.** #96, #101 and #102 went into SEC1 at today's versions and were closed as superseded.

**Exercised locally only,** against a production build and TEST, with disposable accounts rather than
the owner's robots: the read-only Playwright projects, and journeys J3, J5, J6 and J7.

**Not exercised anywhere yet:** a deployed Preview, CI on a pushed head, the independent review, journeys
J1 and J2 (they send real TEST-marked email), J4, J8 and J9, CT-005 (it signs in with the owner's robot
password), a real contact delivery, and every production step. J8 must not be run locally with a disposable
admin session: its self-row names the owner's admin robot.

## Deviations & learnings

- **The owner's prompt said "Use `/sprint-prompt`" and also overrode its gates.** Followed the
  structure and the override: one continuous run, no per-step commits.
- **A code is not an identity, again.** Badges became sequential real codes, so rows are matched by
  the id in the snapshot, and a row awaiting retirement steps aside (`OLD-…`) so a cross-link can
  never resolve to it.
- **A real `Bad Gateway` hit mid-upload** during the rehearsal, and re-running simply finished the
  job. Re-running is the recovery, by design.
- **A rehearsal batch ran past a transient verify failure,** because a shell batch does not stop on
  one. Hence `retire` and `cleanup` now byte-check all 127 downloads themselves before removing
  anything: removing rows must not depend on someone having read earlier output.
- **The fidelity check earned its place twice.** Word-for-word comparison found a CSS rule
  (`p > strong:only-child`, built for the old bold-only headings) breaking one sentence in guide 4.4,
  and the first browser run found that `/support#community-contacts` does not land on a direct load,
  because the gated page streams.
- **An agent's fix went beyond the brief.** While making the declined notice truthful, it added a
  redirect to `/apply` for accounts with no application row. That is an access decision, out of
  scope, and it was removed. The truthful notice stayed.
- **Storage hardens SVGs on its own:** a forced `attachment`, a sandboxing CSP and `nosniff`, and no
  filename in the header. A real browser still saves the supplied name, from the URL's last segment.
- **A test that checks the wrong thing can hide a bug for a long time.** AD-004 confirmed a delete by
  looking for the Edit button to vanish, and an open row never has one. Asking it to handle more than
  one row exposed that, and with it a stale Files screen. A build of the committed `main` showed the
  same staleness, so it was logged (`PROJECT-STATUS` §7 #14), not fixed here.
- **A hit on the current page used to leave its card shut.** Search worked from every other page, so
  this went unseen until CR1's shortcuts started resolving. Link's `pushState` fires no `hashchange`.
  Fixed, with a test, because the brief asks for search to work.
- **A rollback restores the snapshot, whatever happened since.** So an edit made between the snapshot and
  the switch would have been silently undone by a later rollback. `switch` now compares the live content
  with the snapshot first and refuses. The rollback also refuses a row it does not recognise, and warns
  when a CMS replacement will be left attached to nothing.
- **A retake could have recorded CR1's own words as the original.** After an interrupted rollback, moving
  the snapshot aside and taking another would have made the half-restored state the rollback's target.
  `snapshot` now refuses if the target carries CR1's words, and checks each focus area's row count.
- **Fixes need their own attack.** The third SVG round found 15 live bypasses in code the second round had
  passed, one of them created by the previous fix. Hence a committed case list rather than a claim.
- **Running a journey twice at once proves nothing.** `--repeat-each=2` put J7 in two parallel workers,
  whose clean-up sweeps deleted each other's rows. It looked like a product bug until it ran with
  `--workers=1`.
- **The second review hit a usage limit part-way** and returned nothing. It was re-run from each lens's
  partial transcript, so the work already done was kept.
- **A flaky test turned out to be a real defect.** CT-010 failed about 1 run in 2 near the end. Re-running
  would have turned it green. Measured instead: a click on a link to a gated page can silently do nothing,
  with the data already arrived, and `main` does it too. Three wrong turns on the way, each killed by a
  measurement: a race right after load (still lost at a 3-second pause), my own expired test session (fresh
  sessions lost just as often), and a boundary left dehydrated (none was). `ERR_ABORTED`, which looked like
  the cause, appears on good clicks as well. CR1's two links became plain anchors. *Superseded the next day: that
  first answer was loading boundaries, which this record then left for the owner. They were measured and dropped,
  and the bug was fixed at source by SEC1. See "After the first report".*
- **An access test could fail without checking anything.** AC-004 read the search index through the browser
  and swallowed a failed read, so on a slow machine it went red with nothing checked. It could not pass that
  way, because it needs a non-empty body, but a false alarm on an access test teaches people to ignore it. It
  now reads the body inside the page, and its checks are unchanged. 8 of 8 under parallel load.

## What is still owed

1. Independent review (D-SYS-1): [`code-reviews/cr1-content-refresh-review.md`](../code-reviews/cr1-content-refresh-review.md).
2. The owner merges SEC1 (#103), which fixes the live site on its own.
3. The owner runs [`CR1-RELEASE-RUNBOOK.md`](../CR1-RELEASE-RUNBOOK.md) on production, which merges this PR.
4. A look at the hosted Supabase email templates, which nothing here can reach.
5. Trackers flipped to Done only after that.
