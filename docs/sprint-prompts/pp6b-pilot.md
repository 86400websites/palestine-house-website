# Sprint PP6b — PILOT: Focus Area 1.1 end-to-end

| | |
|---|---|
| **Date built** | 2026-08-15 |
| **Branch / PR** | `claude/sprint-pp6b-pilot-focus-area` (off `main` = `8fbff9d`) / PR pending |
| **Goal** | Load one focus area end to end with the machinery that will do the other 21, and prove it as a real signed-in partner. **The owner's sign-off is the gate.** |
| **Shape** | 8 steps (6b-a … 6b-h) · **TEST only · zero SQL · production untouched** |
| **Totals** | 12 files · CSS **180,530 → 180,418** (−112 bytes, −2 rules, **0 added**) |

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

## Checks & results

typecheck ✅ · lint ✅ · build ✅ · guide-cover regression **28/28** ✅ (all 15 PP4 cases still green)

**The A/B proof for the cover strip.** The old and new functions were run over **all 33 live guide bodies on TEST**: byte-identical output on every one, so the change is provably not a regression on shipped content. Over the **22 delivered guides**: old fired on 0, new fires on 22, none still showing cover matter.

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

**Six defects. Not one was found by reading code.**

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
| 5 | An independent review is not booked. PP6a's found four blocking defects in work that had already passed self-review. | Owner, before merge |
