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

## Independent review (2026-08-12) — "request changes", all findings resolved

An external reviewer audited the branch with the mockup available (it confirmed
both local copies byte-identical). Verdict: **no blocking issue** — the gating
checks all pass, and it independently confirmed the D-PP-i argument by reading
`0026_focus_area_k.up.sql:114-160` and `scripts/ingest-content.ts:675-699` and
agreeing that no shipped path can produce a wrong-bucket row that passes the
four-column predicate. It found two correctness defects and a set of design
mismatches. Every one is now fixed.

**C1 — the Ask HQ category allowlist was client-only.** The UI offers a fixed
`<select>`, but the action's schema accepted any 1–200 character subject, so an
approved caller could forge FormData and spoof the category a request lands in.
Not injection — the RPC is parameterised and the mail is plain text — but the
allowlist was decorative. **Fixed:** the list moved to
`src/lib/support/focus-areas.ts`, imported by both sides, and the schema is now
`z.enum(SUPPORT_FOCUS_AREAS)`.

**C2 — a malformed deep link could take the page down.** `decodeURIComponent()`
throws `URIError` on a fragment like `/setup#topic-%`, which would have killed
the explorer during mount or `hashchange`. **Fixed:** decoding is wrapped, and a
fragment that cannot be read is simply not a topic.

**D1 — the Start-here card was built from a superseded CSS layer. This is the
one that mattered, and the owner had already spotted it: "it looks stretched".**
The mockup restyles `.resource-card` in three of its eight `<style>` blocks, and
the sprint took the FIRST match. The effective values are
`compact-card-review`'s: padding **18px not 28px**, radius **15px not 20px**,
icon **46px not 64px**, title **1.2rem not 1.55rem**, body **12.5px not 14px**,
actions **14px not 22px**. On top of that the card had been stretched to
`min(560px, 100%)`. **Fixed:** the mockup's own `.resource-grid` is restored
(4-up → 2 at 980 → 1 at 520 wide below 760), so the card is exactly the width
the mockup computes at every breakpoint — **236×274 at desktop**, measured, down
from a 560px slab. All the compact values and their ≤620px overrides are ported.

**D2 — the 320px group-header collision was already solved by the mockup.** The
sprint invented a two-row header for it. The mockup hides `.group-meta span` at
≤620px and keeps its three-column row. **Fixed:** the invention is reverted and
the mockup's answer used. Claimed deviation (f) was simply wrong.

**D3 — Ask HQ drifted from the mockup.** The submit icon was `ArrowRight`, not
the mockup's Send/paper-plane; the reset button said "Send another request"
where the mockup says "Ask another question". **Fixed both.** The reviewer also
flagged three strings that were approved S6 copy rather than the mockup's; an
earlier pass kept them because the mockup's versions describe a prototype that
could not send. **The owner ruled for the mockup (2026-08-12)**, so `/support`
now ships:

| slot | shipping | source |
|---|---|---|
| form note | "This will go to the right HQ team." | mockup, minus its "In the live platform," clause |
| pending | "Sending…" | no mockup equivalent — the prototype never sent |
| success | "Your question is ready." | mockup, verbatim |
| reset | "Ask another question" | mockup, verbatim |

The mockup's success paragraph — *"The live platform will send it to HQ and show
the response in your account."* — is **deliberately not shipped**: it promises an
in-account response view that **D-PP-b ④ removed** (Ask HQ is email to HQ only).
Shipping it would commit the platform to a feature that does not exist.

**D4 — the Simple guide card used a lucide lookalike** where `RESOURCE_KINDS`
names the mockup's `guide` glyph. **Fixed:** the mockup's own one-path symbol is
inlined.

**D5 — six effective responsive rules were missing**, each because a later
`<style>` block supersedes an earlier one: 24px gutters from 760px (not 620),
shell radius 15px, group-content padding 11px, the topic description clamped to
one line, Ask HQ 70px/18px, and the success button at a full 42px rather than
`.small`. **All ported and re-measured at 320px.**

Two things the reviewer raised that were *not* changed: the single card still
leaves space to its right on desktop (it is now the mockup's card in the
mockup's grid — the alignment is an owner call, noted in the follow-ups), and
brand-voice verification of the three new strings is impossible for any agent
because `docs/page-copy/` is gitignored.

**A correction to the review, for the record:** it noted the HEAD diff was
19 files / +2374 rather than the brief's 18 / +2190. That is because the exit
gate (3j) landed after the review brief was written, not a discrepancy.

## Deviations & learnings

- **Check what is already wired before scoping it as new work.** D-PP-h cost a
  planned regression, a set of fallback copy and a slice of PP4's scope — all
  for a send that had been in production since S6. The premise was never
  checked against `src/lib/support/actions.ts`. That is the sprint's most
  transferable lesson, and it is recorded in §5 next to the decision.
- **The mockup has eight stacked `<style>` blocks, and resolving that cascade is
  the single hardest part of porting it — I got it wrong once.** The card, the
  group header and six responsive rules were all taken from a block that a later
  one supersedes, and the review caught every one. The lesson is sharper than
  "read the last block": *precedence is per-property, not per-block.* The topic
  card's layout comes from `final-focus-area-rollout`, its actions from
  `final-last-revision`, and the Start-here card's proportions from
  `compact-card-review` — three different blocks, all effective at once. A rule
  in an early `@media` also beats a later unconditional one only if it is more
  specific, which is why `.toolkit-section`'s padding resolves to the desktop
  value even at 320px. **Port by resolving each property, never by trusting a
  block.** The `#page-setup, #page-operate, …` prefixes carry no meaning here —
  they exist only because all four toolkits live in one document.
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
3. **Two judgement calls to eyeball while there.** The Start-here card is now
   the mockup's card at the mockup's width (236px at desktop), sitting in cell
   one of a 4-up grid — so ~774px to its right is empty. Centring it is one
   line if the owner prefers. And Setup and Support have a **single accordion
   group each** (Operate has 5, Program 3), so on those two pages the accordion
   may read as an unnecessary wrapper.
4. ~~Codex review recommended~~ ✅ **Done 2026-08-12** — "request changes",
   no blocking issue, two correctness defects and five design mismatches, all
   fixed on-branch and re-verified. See the review section above.
5. ~~Owner sign-off wanted on three Ask HQ strings~~ ✅ **Resolved 2026-08-12 —
   the owner chose the mockup's copy;** the S6 substitutes are gone. The one
   mockup line still withheld is its success paragraph, which promises an
   in-account response view D-PP-b ④ removed.
6. **`/support` success copy reads "Your question is ready." after a successful
   send** — the mockup's word for a prototype that stopped short of sending.
   Worth a second look on Preview now that it really does send; changing it is a
   one-string edit.
5. **PP4 inherits one mandatory hand-off, not two:** swap the Read Now
   coming-soon toast for the real reader link on all 33 topics. Ask HQ is done.
   Re-read `src/lib/support/actions.ts` before scoping any Ask HQ work there.
6. **PP6 owes the `storage_bucket` guard** (D-PP-i). PP3's predicate is safe only
   while no admin path can set that column; PP6 ships the path that can.
