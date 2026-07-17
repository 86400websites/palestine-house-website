# Copy overhaul — owner "TEXT EDITS" across the public site

| | |
|---|---|
| **Date merged** | *pending* — build complete + pushed 2026-07-17; record saved pre-merge at the owner's request |
| **Branch / PR** | `claude/public-copy-overhaul` / *PR pending* |
| **Code range** | `1c8191c..ee3c601` (8 commits, 20 files) + docs commits `c1e8d28`, `a6b5c9d`, `84d79b7` |
| **Goal** | Apply the owner's seven per-page Word documents across all seven public pages on top of the existing v3 layouts, plus the shared footer CTA and three reference-built design pieces. |

> Owner-directed ad-hoc sprint (same shape as the DR series). Frontend copy + two photos only — no
> DB/auth/gate/CSP/routing/env change.

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

## Prompt used

**This sprint had no gated master prompt** — worth recording, because it deviates from the house pattern. The owner
opened it in **plan mode** with a folder drop rather than a sprint ID, so the "prompt" was the owner's request plus
the seven documents themselves. The plan was researched, put to the owner as three decisions (§ *Owner decisions*),
approved via ExitPlanMode, then executed page-by-page in one session with a commit per page.

<details><summary>The owner's opening request (verbatim)</summary>

```text
Ok I've added "TEXT EDITS" folder with all the text changes across the public pages with a few other
changes (reference images and new images are provided and instructions are inside the relevant document)

Lets complete this ensuring we dont miss any changes and also at the very end give me a list of all the
changes that you did so that I can confirm (but please ensure I dont need to double check and I can trust you!!)
```

</details>

<details><summary>Follow-up request (verbatim) — the review round</summary>

```text
ok please push and also give me the final codex review and it should also double check the accuracy of our copy
so we ensure we covered everything

so ensure the prompt is very detailed as we also have a new session working on a new branch in parallel session

Also please fix the permenanace section as it looks weird, maybe we can revsie it to look like the section after
it or do anything here as it looks weird and forced and unprofessional..
```

</details>

**If this is re-run for another batch of owner copy docs, the prompt that matters is not an instruction list — it
is the verification harness.** See § *Verification*: point independent agents at the owner's original `.docx`
files, never at the engineer's transcription.

## Checks & results

typecheck ✅ · lint ✅ (clean via `eslint . --ignore-pattern ".claude/worktrees/**"`; the bare `pnpm run lint`
FAIL is a **parallel session's worktree inside the repo**, outside this range) · build ✅ (45/45 static, zero route
changes) · all 7 public routes 200 from `next start`, every rebuilt section verified in the shipped HTML ✅ ·
path-guard ✅ (zero forbidden-path files) · proof numerals ✅ · locked HQ line ✅ · no tracked `TEXT EDITS` ✅ ·
independent Codex review ✅ (REQUEST CHANGES → 4 findings, all resolved) · **Preview (desktop + 320px) ⛔ NOT yet
done — owner's step.** The three rebuilt sections and the fuller copy in tighter components were verified at code
and HTML level only; no screenshot was possible in-session.

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

**Lesson worth keeping (the main deviation/learning of this sprint):** verifying against *the owner's original
file* rather than the engineer's reading is what caught 11 defects — several of which (a dropped closing statement,
a flattened rhetorical device) would have read as deliberate editing and never been questioned. The engineer who
transcribes the copy cannot be the one who certifies it: a self-check inherits the same blind spots that caused the
misses. **For any future owner-copy batch, budget for the docx-extraction verification harness up front — it is not
optional polish, it found more than the build did.**

A corollary for `/close` and for Codex: because `docs/source-assets/` is gitignored, a reviewer on a fresh clone has
**no ground truth** and will "pass" copy blind. The Codex brief for this sprint therefore **embeds all seven
documents verbatim** (machine-extracted). Do the same next time.

## Independent Codex review (2026-07-17) — REQUEST CHANGES → all resolved

Brief: `docs/code-reviews/copy-overhaul-text-edits.md` (pinned to `1c8191c..ee3c601`; because
`docs/source-assets/` is gitignored, the brief **embeds all seven owner documents verbatim**, machine-extracted —
otherwise the reviewer would have had no ground truth to check copy against and would have "passed" it blind).

Codex found **4 items, all fixed on-branch**:
1. **`/experience` hero** — the doc's last hero sentence had lost its subject (glued to the previous sentence with
   an em dash). Restored as its own sentence.
2. **`/bring-ph` §7 CTA** — doc says "Explore our support"; shipped "See our support". Applied. (The hero keeps
   "See our support"; the doc specifies no hero CTA label — owner may want them matched.)
3. **AA:** `.model-arch-role` `opacity: 0.82` → ≈3.95:1 on terracotta. Opacity removed.
4. **AA:** `.bring-arch-day-label` `opacity: 0.85` → ≈4.32:1 on the terracotta Day circles. Opacity removed.

Everything else PASSED, including all gating checks and the `StageCards`/timeline/cascade/semantics review. The one
lint FAIL was **environmental** — a parallel session's worktree (`.claude/worktrees/…`) inside the repo, outside
this range; `eslint . --ignore-pattern ".claude/worktrees/**"` is clean.

**Lesson #2 worth keeping:** the two AA misses were both `opacity` on small text over a mid-tone brand surface —
a shape that reads as "subtle" while quietly failing contrast. Prefer an opaque lighter colour over `opacity` for
any text on the terracotta/red/moss bands.

## Owner-requested design change (same round)

`/experience` §5 **Permanence** read as *"weird and forced and unprofessional"* under the fuller copy. Cause: the
LH1 band was tuned for a one-line lead — a wider photo column plus a gradient dissolving the photo's inner edge
into the panel — and the owner's longer copy plus a bolted-on triad unbalanced it.

**Fix:** §5 now shares §6's closing-beat recipe, so the page's two closing sections read as a deliberate pair:
eyebrow + mark · heading · `.ph-lead` · `.v3-split-body` · copper rule (`.exp-close-rule`) · triad (`.exp-triad`;
§6 adds `.exp-triad--lead` for its bold openers). The doc's Permanence copy was **redistributed to match the doc's
own paragraph breaks** (lead / body / triad) — no word changed. The pair alternates ground only: §5 on the page
cream (`.v3-split.exp-perm-split`), §6 on the default `.v3-split` cream-100 card. The `.exp-home-split` dissolve
band + its wider column + its ≤880px re-assert are **retired** (dead after the recompose).

## Follow-ups (non-blocking)

- `ph-photo-model-still.jpg` (the old `/model` §6 bonsai) and `ph-photo-support-responsibility.jpg` (the removed
  Our Support split) are now **orphaned assets** — prune in housekeeping alongside the DR3.4 `ph-photo-apply` note.
- Dead CSS left in place: `.model-arch-note` / `.model-arch-arrow` (their JSX was removed with the §3 arrows).
- The canonical `docs/page-copy/01-public-pages/*.md` (OneDrive, gitignored) are now **stale** — the shipped pages
  and these seven docs are the source of truth. Owner to refresh when convenient.
- `/model` §3 renders the three partners unnumbered while §5 keeps 01/02/03 — the docs number both. Owner's call.
- **Repo hygiene (not this sprint):** `pnpm run lint` trips on a parallel session's worktree at
  `.claude/worktrees/…/next-env.d.ts`. Consider adding `.claude/worktrees/**` to the eslint ignores so lint is
  green for everyone regardless of who has a worktree checked out.
- `/bring-ph` now says "See our support" in the hero and "Explore our support" in §7 (the doc specifies the §7
  label only). Owner may want them matched.
