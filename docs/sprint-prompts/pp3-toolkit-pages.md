# Sprint PP3 — The four toolkit pages

| | |
|---|---|
| **Date merged** | **Not yet merged.** Built + pushed 2026-08-12 (9 commits `72e0afd`→`3j`). |
| **Branch / PR** | `claude/sprint-pp3-toolkit-pages`, off `main` `ccbceba` |
| **Goal** | Fill `/setup` `/operate` `/program` `/support` with the real D-PP-f content, replacing PP2's "Content is on its way." stubs. Code only — `0027`/`0028` have run on production and are immutable, so the sprint ships **zero SQL**. |

Stage 4 — Private Platform Revamp. Public pages untouched throughout.

## What shipped

Nine owner-gated steps, commit + push per step. (Planned as ten; 3g's templates
grid moved into 3e — see Deviations.)

- `72e0afd` — **3a Trackers + kickoff decisions.** `docs/pp1-close` (#74), PP1.1
  (#75) and PP2 (#76) were all merged and `0027`+`0028` live on PROD, but the
  trackers still said "awaiting merge". Flipped, with the two point-in-time
  pre-PROD notes marked superseded rather than deleted. **D-PP-g**, **D-PP-h**
  and **D-PP-i** recorded in §5.
- `16b1a07` — **3b Data layer.** `src/lib/workspace-v2/content.ts`:
  `getSectionContent(section)` returns a page's groups in mockup order with
  their topics and files. Server-only, React-cached, fails closed. The **D-PP-i
  predicate is written once**, with each of its four conditions and the deferred
  `storage_bucket` guard explained in place. `youtube_url` runs through the
  existing `safeHttpUrl` rather than a second copy of that check.
- `459c8b8` — **3c CSS.** The whole sprint's CSS in one commit — toolkit and Ask
  HQ — so containment is proven once rather than re-argued per component.
- `2099e12` — **3d Group accordion.** `PwSectionExplorer`, live on all four
  pages. A real `<button aria-expanded>` inside a heading, panel hidden with the
  `hidden` attribute rather than a class.
- `11185ff` — **3e Focus-area cards.** Image-led card, Explore↔Back, Watch
  Video, `#topic-<slug>` deep links, and the templates grid with working
  signed-URL downloads.
- `6986ac2` — **3f Start here.** The one Simple guide card, with the sprint's
  three approved copy strings.
- `e262528` — **3g Ask HQ.** The mockup's moss panel wired to the S6 server
  action; the legacy form deleted.
- `e521e23` — **3i a11y + responsive.** Measured at 320px in a browser against
  the built CSS; one real defect found and fixed.
- **3j Exit gate.** Full-diff review, PROD invariants re-verified, trackers,
  this record.

## Checks & results

- `pnpm run typecheck` ✅ · `pnpm run lint` ✅ · `pnpm run build` ✅ (47 routes).
  Toolkit pages 106 → 117 kB first load; `/support` **145 → 119 kB**, because
  deleting the legacy form took its UI dependencies with it.
- **CSS containment proven, not asserted.** The bundle was diffed **rule by
  rule** against the PP2 baseline after 3c, 3d, 3e, 3g and 3i: **0 baseline
  rules removed · 129 added · every selector of every added rule rooted at
  `.pw-root` · 0 `.adm-*` rules touched.** Three baseline rules changed, all
  deliberately: the two PP2 touch-target rules whose selector lists this sprint
  extends (every original selector keeps its identical declaration), and
  `.pw-legacy-form`, deleted with its last consumer.
- **Path-guard clean across the whole sprint** — no public page, API route,
  `middleware`, `next.config`, `package.json`, `.env` **or SQL file** in the
  diff. `git diff --name-only origin/main...HEAD | grep -c supabase/` = **0**.
- **Server/client boundary:** the four pages and `pw-section-page` are Server
  Components; the five interactive pieces are client. No client component
  imports `workspace-v2/content` (server-only) — they take types from
  `workspace-v2/types`. No `storage_path`, `storage_bucket`, `createSignedUrl`
  or `supabase.storage` anywhere under `src/components/` or `(platform)`.
- **TEST (3b), read-only:** topics 33 · grid rows 297 across 33 distinct
  elements · empty topics 0 · 4–10 files each · duplicate codes within a topic 0
  · wrong-bucket rows 0 · guide files 0 · public booklets excluded 2 · total 299.
- **PROD (3j), read-only:** grid 297 · wrong-bucket 0 · empty topics 0 · 4–10
  each · 2 public rows excluded · 0 guide rows · 33 distinct topic slugs ·
  `anon` EXECUTE **false** / `authenticated` true on `get_platform_topics`,
  `get_resources`, `get_resource_download`, `submit_support_request` · all three
  read RPCs still carry `is_approved()`.
- **DOM-id safety:** all 33 topic slugs globally distinct, group slugs distinct
  within a section, and no topic slug equals a group slug — so `topic-<slug>`
  and `pw-group-<slug>` cannot collide (which would have broken deep links and
  `aria-controls`).
- **320px measured in a browser** against the built CSS: no horizontal overflow
  (scrollWidth 320 = viewport, zero overflowing elements); topic head, template
  grid and form grid all single-column; Explore/Watch Video 230×46; inputs 46px.
  Heading order h2 → h3 → h4 → h5 under the hero's h1; every field labelled;
  both images decorative.
- **Secret scan** of the sprint's added lines: clean.
- **⚠️ Not verified: the signed-in visual.** This checkout has no Supabase env,
  so the server cannot construct a client and no signed-in walkthrough is
  possible. Same limit PP2 hit; it stays the owner's Preview check.

## Decisions taken at kickoff and during the build

- **D-PP-g — no per-page local search.** `ROADMAP.md`'s PP3 scope *and* exit gate
  both demanded "local search + live count + no-results", but the final mockup
  renders no such control: `.toolkit-head`, `.local-search`, `.search-count` and
  `localSearch()` survive in its CSS/JS while **no render function emits the
  markup**. Owner: the mockup wins. The roadmap row was corrected in the same
  step, and search arrives once as PP4's global overlay.
- **D-PP-i — the grid predicate.** `SECURITY-CHECKLIST` §15 requires
  `is_public = false` **and** `storage_bucket = 'resources'`, but
  `get_resources()` returns no bucket and `0027` can no longer be edited. Owner:
  app-level now (`element_id` + `is_public = false` + `doc_key IS NULL` +
  `code IS NOT NULL`), bucket guard at PP6's 0029 — no shipped admin RPC can set
  `storage_bucket`, so the risk window opens with PP6 and PP6 must close it.
- **D-PP-h — SUPERSEDED mid-sprint.** It had deferred the Ask HQ send to PP4 and
  accepted a one-sprint regression. The owner asked whether the old workspace
  form was already wired. **It was, and more than the record claimed:**
  `submitSupportRequestAction` has been live since **S6** and has emailed HQ
  through **Resend since S12 12-6**. Only the field shape differed, and it maps
  with zero backend change (Focus Area → `subject`, question → `message`). PP3
  therefore ships the panel complete, deletes the legacy form outright, and
  hands PP4 nothing.
- **Three approved copy strings** (2026-08-12), all forced by D-PP-f leaving one
  card where the mockup drew four: the subhead became *"One simple guide
  explains this focus area from beginning to end."*; Read Now and Download Now
  toast *"Reading coming soon."* / *"Download coming soon."*, taking the shape
  of the mockup's own approved *"Video coming soon."*; and the count pill was
  dropped on Start here (kept on Templates), which also avoids the "1 files"
  grammar bug the mockup's template would produce.

## Deviations & learnings

- **Check what is already wired before scoping it as new work.** D-PP-h cost a
  planned regression, a set of fallback copy and a slice of PP4's scope — all
  for a send that had been in production since S6. The premise was never
  checked against `src/lib/support/actions.ts`. That is the sprint's most
  transferable lesson, and it is recorded in §5 next to the decision.
- **The mockup has eight stacked `<style>` blocks and the toolkit was rewritten
  twice inside them.** Reading the first match would have shipped the wrong
  design. The values here come from `final-focus-area-rollout` and
  `final-last-revision`, which supersede the compact card treatment earlier in
  the file. Its `#page-setup, #page-operate, …` prefixes exist only because all
  four toolkits live in one document; each of our pages renders its own section,
  so the prefixes carry no meaning and were dropped.
- **Steps were resequenced for verifiability, not tidiness.** 3d wired the four
  pages (planned for 3h) so every later step was reviewable in the running app;
  3e absorbed the templates grid (planned for 3g) because Explore opening onto
  an empty panel could not be verified. The sprint ran 9 steps, not 10.
- **Dead code was refused at every step, including my own plan's.**
  `get_platform_sections()` was not wrapped (the hero reads the generated spec,
  so it would have been an unused round-trip per page); `elementSlug`,
  `topicCount` and `platform_topics.icon` were dropped from the view model; the
  vestigial local-search, extras and preview-modal CSS was never ported; and
  `support-form.tsx`, `.pw-legacy-form` and `.pw-field-error` were deleted with
  their last consumers.
- **The a11y pass found bugs that a checklist would have missed.** Three came
  from thinking about what happens *after* a control is pressed: a `disabled`
  download button leaves the accessibility tree mid-download and dumps keyboard
  users to the top of the page (now `aria-disabled` + a guarded handler);
  submitting Ask HQ replaced the focused button with a confirmation nobody was
  told about (now focused); and a deep link flashed the card visually while
  leaving focus at the top of the document (now moved to the heading). A fourth
  came from reading the CSS honestly: an explicit `behavior: "smooth"` overrides
  the `scroll-behavior` rule, so the reduced-motion block could never have
  reached these scrolls.
- **320px was measured, and it was broken.** The group header's three-column row
  gives "N Focus Areas" plus the chevron ~100px, squeezing the group title to a
  shred and colliding the two. The mockup never solved it — its only narrow-screen
  rule for that control is a padding tweak. Below 620px the row now drops to two
  columns with the meta on its own line; the title went from ~100px to 208px.

## Follow-ups

1. **Owner: review + merge.** No DB step at this gate — PP3 ships zero SQL.
2. **Owner: the signed-in Preview walkthrough** (the one thing unverifiable
   here, carried over from PP2). Worth clicking: a group opening and closing, a
   focus area expanding to its Simple guide card and templates grid, **a real
   template download**, `/setup#topic-<slug>`, and `/support` sending an Ask HQ
   message end to end.
3. **Two judgement calls to eyeball while there.** The Start-here card sits left
   in a 1020px row, leaving space to its right — the D-PP-f consequence of one
   card where the mockup drew four; centring or widening it is a one-line
   change. And Setup and Support have a **single accordion group each** (Operate
   has 5, Program 3), so on those two pages the accordion may read as an
   unnecessary wrapper.
4. **Codex review recommended before merge** — the diff adds gated reads and
   puts the private-bucket download path on a new surface.
5. **PP4 inherits one mandatory hand-off, not two:** swap the Read Now
   coming-soon toast for the real reader link on all 33 topics. Ask HQ is done.
   Re-read `src/lib/support/actions.ts` before scoping any Ask HQ work there.
6. **PP6 owes the `storage_bucket` guard** (D-PP-i). PP3's predicate is safe only
   while no admin path can set that column; PP6 ships the path that can.
