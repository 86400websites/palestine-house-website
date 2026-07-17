# Copy overhaul — owner "TEXT EDITS" across the public site (2026-07-17)

> **Record.** Owner-directed ad-hoc sprint (same shape as the DR series). Branch
> `claude/public-copy-overhaul`. Frontend copy + two photos only — no DB/auth/gate/CSP/routing/env change.

## What prompted it

The owner dropped `public/assets/TEXT EDITS/` (untracked) containing **seven Word docs** — one per public page —
plus **six images**. The docs carry revised, approved copy, interleaved with editorial instructions ("rename this
section", "REMOVE THIS PART COMPLETELY", "Remove:", "add this before the call to action", "see photo in folder").
Two images are new photos to embed; three are design references; one is a photo already covered by its reference.

The DR3 series had already rebuilt these page bodies to v3, so this sprint is a **copy overhaul on top of the
existing v3 layouts**, plus three targeted design pieces.

## Owner decisions (captured at planning, 2026-07-17)

1. **Copy scope:** apply *all* the new copy across all 7 pages; **keep the existing v3 layouts**, nudging spacing
   where the fuller copy needs room. (Not "marked edits only"; not "restructure freely".)
2. **Footer CTA:** update the shared footer CTA site-wide to the doc's "8. The bottom header" copy.
3. **120-day timeline:** rebuild `/bring-ph` §5 into four arched DAY cards (adds Day 120) + a ribbon line, per the
   owner's "Redesign Example" reference.

## What shipped

**Pages** — `/` · `/model` · `/experience` · `/bring-ph` · `/our-support` · `/apply` · `/focus-areas`, plus the
shared footer CTA (`site-footer.tsx` — the one locked-chrome edit, owner-authorised by decision 2).

**Three design pieces (built to the owner's reference images):**
- `/bring-ph` §5 — the 3-item star-medallion timeline → **four arched DAY cards** (30 · 60 · 108 · **120 new**),
  alternating moss/terracotta circles on a copper connector, closing on a ribbon: *"The goal is not simply to open
  on time. It is to open well."* Old `.bring-mile*` markup + CSS removed.
- `/model` §6 — rebuilt to `model-what-it-is-ref.png`: heading **"A cultural institution built to last."**,
  "A Palestine House is:" / "It is not:" columns (fuller items), and an aside carrying **"Culture leads. / The
  structure helps it last."** + the closing reciprocity pair + the **new coffee still-life photo** (replacing the
  centre bonsai).
- `/experience` §6 — **new** closing section **"More than somewhere to visit."** built to
  `exp-more-than-visit-ref.png` (copy left, the **new gathering photo** right), sitting above the site-wide footer CTA.

**Two new photos** via `scripts/optimize-photos.ts` → `ph-photo-model-culture.jpg` · `ph-photo-exp-gather.jpg`,
keyed in `PHOTO_SOURCES`. Masters sorted into gitignored `docs/source-assets/design-refs/v3/{photos,mockups}/`.
**`public/assets/TEXT EDITS/` was removed from `public/`** — it sat in the served tree and was never committed.

**Two explicit removals** (owner instructions): the Home "It isn't charity. It isn't a franchise you buy and
forget." line; the whole Our Support "You bring / We make sure" split (markup + `SUP_YOU_BRING`/`SUP_WE_ENSURE` +
its CSS — already covered on Bring a House).

**Two explicit renames:** "Three rules, no exceptions." → **"Three commitments every House shares."**
(`/bring-ph` §6, and the `/model` §5 eyebrow, which read "Three things, never negotiable"); "The agreement" →
**"The Partnership"** (`/model` §4).

**One shared-component change:** `StageCards` gained a `stages` prop (default = Home's copy) + an optional bold
lead line, because the docs now give Home and `/bring-ph` **different** stage copy. Content-parametrisation only;
the card layout is unchanged.

## Micro-decisions (recorded so they are not rediscovered)

- **Locked brand line kept:** "Every application is reviewed by HQ." verbatim site-wide. The docs' casual variants
  ("personally reviewed" Home §7, "carefully reviewed" Focus Areas) were **not** adopted. *Owner can reverse.*
- **267, not "over 200":** the Our Support §2 body sentence uses the exact fixed proof number.
- **Proof numerals never moved** (10 · 30 · 200+ · 267 · 120) — only labels changed. The 120 stat keeps its unit in
  the label ("Day guided launch plan" / "day guided launch plan") so it still reads as *a 120-day launch plan*;
  a first pass dropped the unit and was caught in verification.
- **`/model` §4** — the doc frames "Local ownership. Shared standards. Cultural integrity." as the ONE principle the
  agreement binds partners to, so the moss band now carries the two responsibilities as icon columns and closes on
  the framing sentence + the principle. (It previously rendered as a third peer column.)
- **`/our-support` §4 eyebrow** reads "Cultural support from" directly above the Aswātna wordmark — together they
  carry the doc's label "Cultural support from Aswātna" without stuttering the name.
- **British spelling** from the docs applied (programme, organisation, licence, diasporas).

## Verification (this is the part that mattered)

Because the engineer transcribing the docs is a lossy channel, the copy was verified by **independent agents that
extracted the owner's original `.docx` themselves** (PowerShell → `word/document.xml`) and diffed it against the
shipped page — never against the engineer's transcription.

- **Round 1** (7 pages + guards): `/bring-ph`, `/apply`, `/focus-areas` **FAITHFUL**. **6 real defects** found on
  Home, Model, Experience, Our Support — incl. the Model doc's **closing two sentences dropped entirely**, the
  Experience hero dropping "throughout the week and", and both proof rows losing the 120 unit.
- **Round 2** (4 corrected pages): Home + Experience **FAITHFUL**; **5 more defects** found (Model's missing
  "The agreement connects all partners around one principle:", the flattened "every…every…" anaphora, and three
  Our Support section labels never applied).
- **Round 3** (Model + Our Support): final confirmation.
- **Guards: PASS** — proof numerals unchanged vs `main`; locked line verbatim at all 7 call sites; **path-guard
  clean** (zero files under `supabase/`, `src/app/api/`, `(workspace)/`, `admin/`, `middleware.ts`,
  `next.config.ts`, `package.json`, lockfile, `.env*`); `TEXT EDITS` untracked and off disk; no dangling refs.
- typecheck / lint / build green throughout; 45/45 static pages; all 7 public routes serve 200 from `next start`
  and every rebuilt section verified in the shipped HTML.

**Lesson worth keeping:** verifying against *the owner's original file* rather than the engineer's reading is what
caught 11 defects — several of which (a dropped closing statement, a flattened rhetorical device) would have read
as deliberate editing and never been questioned.

## Follow-ups (non-blocking)

- `ph-photo-model-still.jpg` (the old `/model` §6 bonsai) and `ph-photo-support-responsibility.jpg` (the removed
  Our Support split) are now **orphaned assets** — prune in housekeeping alongside the DR3.4 `ph-photo-apply` note.
- Dead CSS left in place: `.model-arch-note` / `.model-arch-arrow` (their JSX was removed with the §3 arrows).
- The canonical `docs/page-copy/01-public-pages/*.md` (OneDrive, gitignored) are now **stale** — the shipped pages
  and these seven docs are the source of truth. Owner to refresh when convenient.
- `/model` §3 renders the three partners unnumbered while §5 keeps 01/02/03 — the docs number both. Owner's call.
