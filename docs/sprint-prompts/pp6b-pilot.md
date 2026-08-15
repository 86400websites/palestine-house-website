# Sprint PP6b — PILOT: Focus Area 1.1 end-to-end

| | |
|---|---|
| **Date built** | 2026-08-15 |
| **Branch / PR** | `claude/sprint-pp6b-pilot-focus-area` (off `main` = `8fbff9d`) / PR pending |
| **Goal** | Load one focus area end to end with the machinery that will do the other 21, and prove it as a real signed-in partner. **The owner's sign-off is the gate.** |
| **Shape** | 8 steps (6b-a … 6b-h) + a guide-file addition + **an independent review round** · **TEST only · zero SQL · production untouched** |
| **Totals** | 18 files · CSS **180,530 → 180,418** (−112 bytes, −2 rules, **0 added**) |

## Why this sprint exists

PP6a made the platform able to hold the owner's real content and gave him a CMS to manage it, but moved nothing. PP6b is the cheapest possible place to find out that the pipeline, the content shapes or the CMS are wrong — before 22 focus areas, 88 templates and a destructive `0030` depend on them.

It found six things wrong. Two were in the plan, three were in code that had already shipped, one was in this sprint's own work.

## What shipped

**6b-a — the plan was verified and failed, again.** Every load-bearing claim was re-checked by extracting all 132 delivered documents with the product's own code and querying both databases read-only. **Twelve findings, three blocking**, folded into `ROADMAP.md`, `content-migration-map.md` and `PROJECT-STATUS.md` before any code was written.

- 🔴 `stripGuideCover` fired on **0 of 22** delivered guides — not on 1.1 alone, as recorded.
- 🔴 **All 132 delivered documents carry `<a id="…"></a>` anchors, 19–21 each; not one of the 33 live guide bodies carries any.** A shape that appears in no document in the repo, and the mechanism behind the first finding.
- 🔴 The migration map's headline *folder ≠ title* example was recorded **backwards** (3.5).
- 🟠 Six titles differ, not four; one wraps two source lines; the "opening sentence" rule breaks on a quoted question mark; template titles needed a rule; the ingest's *back* half had to go too; the CMS Photo field was a path box.
- ✅ And the one thing the sprint was told to "resolve at kickoff" — which database Vercel Preview points at — **was already recorded in `PROJECT-STATUS.md` §6**: TEST.

**6b-b — the cover strip, fixed against measurement rather than description.** Three causes, not the one "one-line fix" the plan promised: the Word bookmark anchors, whose ids survive the function's compaction and read as content; the section label (`Palestine House: Set up`), which was not cover vocabulary; and **a title that wraps two cover lines**, so no single line contains the whole title and both look like content. The scan now carries an unmatched title tail forward and holds such lines provisionally, removing them only once a later line continues the title exactly — a run that never completes deletes nothing.

**6b-c — the ingest script replaced by an extractor.** It writes one reviewable file, `docs/content-v2-spec.json`, and touches no database. The old script could not be adapted: its source directory is gone, it hard-failed below 30 focus areas and 267 templates, and its write half fed two retired tables. Every structural expectation is asserted — the section a document declares must match the folder it sits in, the Overview and the Guide must agree on the title, each mapped photograph must exist, no two focus areas may claim one address, totals must be 4 / 22 / 88.

**6b-d — the loader, driving the CMS's own RPCs.** Not a detail: `published` defaults to **TRUE** at the column level, so a hand-written INSERT lands unreleased content **Live**, while `admin_upsert_platform_topic` defaults to Draft. It signs in as the admin and uses the admin's own session, never a service key, so an upload that works here works from the browser. TEST went from 33 topics to **34** — the first proof with real content that PP6a's 33-slot ceiling is actually gone.

**6b-e — the partner path proven by running it.** Both methods, because they answer different questions.

**6b-f — the photo picker**, replacing a text box whose placeholder was a file path. If a row's current photograph is not in the list it is added to the list, so opening a focus area can never silently change its picture.

**6b-g — the owner's walkthrough.** His, not mine. Outstanding.

**6b-h — the exit gate**, which found the CSS regression below.

## Prompt used

<details><summary>Exact implementation prompt (from the <code>/sprint-prompt</code> plan, 2026-08-15)</summary>

```text
Sprint: PP6b — PILOT: Focus Area 1.1 end-to-end (data only, NO migration), Stage 4
Branch: claude/sprint-pp6b-pilot-focus-area (from latest main)

Goal: load ONE focus area — Setup → Get Legally Ready — end to end as Draft on
TEST, using the exact pipeline that will later do the other 21, and prove it with
a real signed-in session rather than by reading the code. The owner's sign-off is
the gate. No migration. Production is not touched: PROJECT-STATUS §6 records that
Vercel Preview + Development point at the TEST project.

Execute in gated sub-steps (one owner gate after each):
 6b-a  Tracker flip + KICKOFF VERIFICATION. The plan is a hypothesis; the code,
       the files and the database are the truth. Re-check every claim. Fold the
       amended scope into the trackers BEFORE writing any code.
 6b-b  Content-shape fix. stripGuideCover fires on 0 of 22 delivered guides —
       MEASURE this. Fix conservatively: it is the one piece of the product that
       alters an owner-authored body. Extend the regression suite with the REAL
       new openings and keep every existing case green.
 6b-c  The extractor. Rewrite scripts/ingest-content.ts against the delivered
       folder. Title from INSIDE the document; the title block may span lines.
       D-PP-m split, quote-aware. Hard-assert 4 · 22 · 88, failing loudly. Emit a
       committed, reviewable spec. NO DB WRITES.
 6b-d  Load 1.1 onto TEST as Draft THROUGH THE ADMIN RPCs, never hand-written
       INSERTs: `published` defaults to TRUE at the column level.
 6b-e  PROVE IT BY RUNNING IT, as a real signed-in partner: Draft invisible on
       four surfaces, Live correct, pending nothing. Restore TEST exactly.
 6b-f  Photo picker (if accepted at 6b-a).
 6b-g  Hand it to the owner: the walkthrough and the five pilot questions.
 6b-h  Sprint exit gate — full-diff review, CSS rule-level diff against a build
       of the base commit, path-guard, trackers, record.

Per-step protocol: read the locked inputs first · re-verify every factual claim ·
smallest safe change · typecheck + lint + build · self-review the diff · commit
AND push · report in ≤6 lines, then STOP and wait for "proceed".

Database discipline: supabase-test is read/write; supabase-prod-readonly is
READ-ONLY. Never write to production through any channel. 0027, 0028 and 0029 are
IMMUTABLE — this sprint ships NO SQL migration.

Palestine House rules this sprint touches: the approval gate is blanket (every
platform RPC, read AND write); Draft is a SECURITY boundary, not an editorial one
— prove it, do not reason about it; templates stay private-bucket + signed URLs;
never a path, id or bucket name on an admin screen; do not add a caller to a
retired table; never commit or print a credential.
```

</details>

> ⚠️ **The owner removed the per-step gates mid-sprint** ("execute from a to h at once… ensuring no mistakes, no errors, no bugs and no shallow work"), so 6b-b … 6b-h ran uninterrupted with a single review at the end. That trade is visible in the outcome: the work was completed faster, and the independent review then found a Critical defect that six owner gates would have had six chances to catch. **The gates are not ceremony.**

## The independent review round — BLOCKING, and right on every count

Booked after the build, pinned to `8fbff9d..e49d243`. It returned **request changes — blocking**, with one Critical and one High. Both were real, both were reproduced here before being fixed, and the Critical was **content loss in the one function that edits an owner's words**.

🔴 **Critical — the section label deleted a legitimate heading.** PP6b passed the label as an ordinary title key. Title keys are subtracted from *anywhere* in a line, and a section label is a short ordinary English word, so:

```
# SIMPLE GUIDE
## Program            <- deleted
The first real paragraph.
```

any guide in Program whose own first heading was `## Program` lost it. **The sprint's own test suite missed this, and the way it missed it is the lesson:** the case it wrote paired a `Support` heading with a `Setup` label — a heading naming a *different* section, which was never the dangerous one. A test that exercises the safe variant of a risk reads as coverage and is not. The label is now a separate third argument, subtracted only from a line that also names Palestine House — which is exactly what the real cover line does, so nothing legitimate is lost and the dangerous case cannot arise.

The same finding surfaced two more defects in that file. **It was not idempotent at the `MAX_COVER_LINES` boundary** — one counter covered confirmed *and* provisional lines, so a long cover block could exhaust the budget mid-way through a wrapped title, and a second call removed what the first had kept. There are now two bounds: what may be removed, and how far the scan may look. And **the first kept line lost its indentation**, because the leading-whitespace strip took more than blank lines; four spaces is a Markdown code block, so that silently changed how a document rendered. That one had been in the file since PP4.

🟠 **High — the loader could delete a registered object.** Matching templates by *title* meant a rename read as a new file; the deterministic key then collided, `upsert: true` overwrote the live object, registration failed on the unique `(bucket, path)`, and the compensation deleted bytes the original row still pointed at. A punctuation change to a filename would have broken a working download. Files are now matched by **stable identity** — `code` for a template, `doc_key` for the guide — a changed title is a metadata rename that never moves the file, and creates use a unique key with `upsert: false` so a create cannot collide with anything in use and the compensation can only remove what it just wrote. Reproduced end to end before and after.

🟠 **Medium ×2.** "It never publishes" was **too broad a claim** — it does create groups published (deliberately, like the CMS), and rewriting an already-Live focus area puts new words in front of partners even though no flag moves. It now refuses a Live row without `--allow-live`, and the header states what the guarantee is *and is not*. And the extractor's assertions were **incomplete**: `find()` picked one Overview without asserting there was only one, and 4/22/88 still held if a template moved between focus areas. It now requires exactly one Overview and one Guide per folder, asserts the complete focus-area number set, and asserts per-area template counts from the migration map.

**What the review could not refute:** C2 (no regression on live bodies), C4 (the picker), C5 (no secrets), C6 (which it independently reproduced byte-for-byte), C7 (the owner's wording preserved), and the loader's production-host guard.

**The honest summary: three of my seven claims were wrong or overstated, and the one that mattered most was the one I was most confident about.** C1 was asserted on the strength of a suite I had written myself.

## Checks & results

typecheck ✅ · lint ✅ · build ✅ · guide-cover regression **32/32** ✅ (all 15 PP4 cases still green, plus 3 from the review)

**The A/B proof for the cover strip**, now a committed harness — `scripts/verify-guide-cover-live.mts --baseline <ref>`, which runs the pre-change two-argument caller beside the current three-argument one. Against `8fbff9d`: **byte-identical on all 34 live bodies**, so nothing partners already read changed. Over the **22 delivered guides**: 0 → 22 firing, none still showing cover matter, and every one idempotent. (It fires on 33 of the 34 live bodies: the pilot's stored body has no cover, because the extractor removed it at ingest.)

**The partner path, executed rather than reasoned.**

| | Draft | Live |
|---|---|---|
| topics visible to an approved non-admin | 33 (pilot absent) | 34 |
| direct `get_element` on the pilot | 0 rows | 3,933 chars |
| its template via `get_resources` | absent | present |
| `get_resource_download` | nothing | **183,352 bytes downloaded** |
| direct storage signing of its object key | **refused** | signed |
| its folder listed from a valid session | **0 entries** | 2 |
| a pending caller | nothing | nothing |
| anonymous | refused | refused |

183,352 bytes is byte-identical to the source `.docx`. Role simulation covered approved / pending / anonymous across both Draft states; a real signed-in session covered the last mile. The account is an admin, so it was removed from `admins` on TEST for the partner leg and restored.

**CSS containment**, measured against a build of the sprint's base commit by the same method at both ends: **180,530 → 180,418 bytes, 1,824 → 1,822 rules. Zero added.** The two removed are phantoms (`.collapse`, `.antialiased`) that came from `scripts/`; neither is used as a class anywhere — both words appear in `src` only as CSS property values.

**Path guard clean:** no public page, API route, middleware, `lib/site.ts` or `next.config.ts` in the diff. **Zero SQL files.**

**TEST left in a stated, known state.** Snapshot before: 5 / 10 / 33 / 33 elements / 299 resources / 297 objects / 2 admins. After: 5 / **11** / **34** / 33 Live + **1 Draft** / **34** elements / **301** resources / **299** objects / **2 admins, both original ids**. 0 wrong-bucket, 0 rows without an object, 0 unreferenced objects.

## Deviations & learnings

**Ten defects. Not one was found by reading code.** Six by running it, four by an independent reviewer running it differently.

**The one worth carrying forward: a test that exercises the safe variant of a risk reads as coverage and is not.** The suite had a case named "a heading naming ANOTHER section survives — the label is scoped", and it passed. The dangerous case — a heading naming the topic's *own* section — was never written, because I wrote the test from the same mental model that produced the bug. That is the argument for an independent reviewer in one sentence: it is not that they look harder, it is that they do not share the model.

**And the corollary about confidence:** of the seven claims put to the review, the three it refuted were not the ones hedged as uncertain. C1 — "cannot lose owner content" — was the most emphatic and the most wrong.

1. **The cover strip failed on a wrapped title.** The first fix passed 25 hand-written cases and still left one of the 22 printing its title twice. Only running it over all 22 real files found it.
2. **An ordinary Save rewrote the owner's prose.** HTML requires a textarea to submit CRLF line breaks whatever was put into it, so saving *anything* — even only the photograph — added a carriage return to all 154 lines of the pilot's guide, 3,933 → 4,087 characters. Never visible in the reader, and precisely the silent edit to approved content this project forbids. Shipped in PP6a; only demonstrable once there was real content. Found by changing a photo and reading the row back. One pre-existing casualty survives on TEST — `a1`, last touched 2026-06-26, 329 carriage returns — which `0030` deletes anyway.
3. **Tailwind scanned `scripts/` and shipped three utilities to every visitor**, and this time not from prose: `path.relative(...)` produced `.relative`. Third directory, third sprint. `scripts/` is now excluded alongside `docs/` and `supabase/`.
4. **A "stable" generated file that was not.** `core.autocrlf` rewrites the spec to CRLF on checkout while the extractor writes LF, so regeneration looked unstable when it was byte-identical. Pinned in `.gitattributes`, because PP6c diffs a regenerated spec and a phantom diff there would mislead.
5. **The terminator conflation.** Reading the Overview's title with the Guide's rule produced the title *"Get Legally Ready Overview"*. Caught by the extractor's own Overview-vs-Guide agreement assert on the first run — the assert paid for itself immediately.
6. **Two bugs in my own probe, not the product.** It called `get_resource_download` with the wrong argument name and treated its return as a URL when it returns a row, so a healthy live template reported as broken. The same class of error PP6a's close recorded. **A probe that disagrees with the product is a bug in the probe until proven otherwise** — the fix was to make it do exactly what `src/lib/resources/actions.ts` does.

**One false alarm, worth recording so it is not re-raised.** The admin CMS rendered completely unstyled in a screenshot. Cause: `next build` was run while `next dev` was live, and they share `.next`. On a clean dev server it renders correctly. Measure, then check the measurement.

**The signed-in visual, recorded as unverified by PP2, PP3, PP4, PP5 and PP6a, is now verified.** The section page, the card, the reader, Ctrl/⌘+K search, the CMS list and the CMS form were all driven in a browser as a real signed-in user. What remains the owner's is judgement, not existence.

## For the owner — the five pilot questions, with what the pilot found

1. **Summary length.** The card counter warns above 90 characters. The Overview's opening sentence runs **37–115**, and **8 of the 22 exceed 90** (1.1 is 104). Trim the long ones, raise the guidance, or accept the wrap.
2. **Guide proportions in the reader.** The Overview's remainder now opens the guide, before Step 1 (D-PP-m). ⚠️ Worth your eye: the delivered documents style *"Step 1. …"* as ordinary paragraphs while their sub-headings are real headings, so the guide's hierarchy reads inverted. Fixable in one line of the extractor — but it is your formatting, so it is your call, not a silent correction.
3. **The photo mapping.** 1.1 reuses `legal-compliance-and-risk`. Any swap is one line in `content-migration-map.md` §4.
4. **Is the CMS simple enough?** The Photo path box is gone. The list, Draft/Live, reorder, delete-by-typing-the-name and the guide textarea are all yours to try.
5. **The three prose "templates."** Shipped exactly as delivered. Your call whether they are downloads or reading material.

## Follow-ups

| # | Item | Where it belongs |
|---|---|---|
| 1 | 3.5 is created as *Learn the Event* per D-PP-p, and the URL freezes at creation. If the wording is to change, change it **before PP6c creates it**. | PP6c kickoff |
| 2 | `content-migration-map.md` §4's template names are a cleaned summary; the spec is the source. Re-sync §4 from the spec. | PP6c |
| 3 | `a1` on TEST carries 329 carriage returns from the old CMS. `0030` deletes the row. | PP6c, automatically |
| 4 | The pilot has guide **text** but no guide **file**, so the card's "Download Now" shows the coming-soon toast (`pw-guide-download.tsx` handles this correctly — nothing is broken). Decide whether the new guides get a downloadable file at all, or whether Read Now is the whole offer. | PP6b sign-off |
| 5 | ~~An independent review is not booked.~~ **DONE 2026-08-15 — verdict BLOCKING, 1 Critical + 1 High + 2 Medium, all four fixed on-branch and reproduced before and after.** A re-review of the fix commit (`4ce4b5e`) is optional but cheap. | Done |
| 6 | The review was pinned to `e49d243` and does not cover the guide-file commit (`1bb6a46`). Its loader findings were fixed across that code too, but the guide-file path itself is unreviewed. | Re-review, or PP6c kickoff |
| 7 | The pilot is currently **Live** on TEST (the owner published it during his walkthrough). PP6c's loader now refuses to touch a Live row without `--allow-live` — expect that on the first rollout run. | PP6c kickoff |
