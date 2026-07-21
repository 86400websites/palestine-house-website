# PROOF-0721 — Proof band to /bring-ph · Home apply CTA removal

> **Status: BUILD COMPLETE + REVIEWED — READY TO MERGE (2026-07-21).** One
> branch, **Codex APPROVE, zero blocking / zero non-blocking** (verdict:
> `docs/code-reviews/proof-band-move-apply-cta.md`).
> `claude/proof-band-move-apply-cta` — build commit `9a617dc` off `main`
> `d968438` (5 files +376/−279) + this record/verdict commit.
>
> Owner: open the PR → Vercel Preview → merge → delete the branch.
> **No DB, no deploy step, no env change.**

| | |
|---|---|
| **Date built** | 2026-07-21 (merge pending) |
| **Branch** | `claude/proof-band-move-apply-cta` |
| **Goal** | Move the olive proof band from Home to /bring-ph below the three stages; remove the Home platform-card Apply CTA. |

## Goal

Not a ROADMAP sprint — an ad-hoc owner request (same register as
`dedupe-and-admin-labels.md`, and a direct continuation of it): two quick
public-shell tweaks, then a Codex review so the PR merges safely.

## Owner decisions (chat + AskUserQuestion, 2026-07-21)

- **Proof band → /bring-ph:** the dark 11 · 33 · 200+ · 297 · 120 band moves
  from Home §4 to /bring-ph, directly below "One clear path. Three stages."
  This **supersedes** the DEDUPE-0720 decision to keep it on Home (that
  decision only established the band wasn't a duplicate; the owner now wants
  it beside the stages narrative).
- **Apply CTA:** remove "Apply to bring a House" from Home's "The full system
  opens to approved partners." card — **including** its coupled
  "Every application is reviewed by HQ." support line (owner confirmed both
  go via AskUserQuestion; alone it would dangle). The outline
  "Explore the model" button stays; Home's hero + the site-wide footer CTA
  still carry the apply path.

## What shipped

- `src/app/page.tsx` — `HOME_PROOF` const + the whole `.home-proof` section
  deleted (platform comment renumbered 5→4); the platform card's inner CTA
  `<div>` (Apply button + HQ line) deleted, leaving the outline button as
  `.home-platform-ctas`' only flex child; unused `ArrowRight` +
  `ART_SOURCES` imports trimmed. Home flow: Hero → split → InsideStrip →
  platform.
- `src/app/bring-ph/page.tsx` — `BRING_PROOF` const added (same five stats,
  provenance comment carried over); the band inserted verbatim as a new
  sibling section between §4 `#what-it-takes` and the 120-day timeline;
  classes/ids renamed `home-proof*` → `bring-proof*`
  (`aria-labelledby`/`id` → `bring-proof-title`); later section comments
  renumbered 5–7 → 6–8. No new imports needed.
- `src/styles/pages.css` — the entire proof-band block relocated from the
  Home region into the /bring-ph region (after `.bring-stages-close`),
  every selector renamed `.bring-proof*` (rule bodies + the three
  `@container page` queries byte-identical apart from the rename); orphaned
  `.home-cta-support` deleted; /bring-ph §-numbered comments renumbered
  (timeline §5→§6, commitments §6→§7, apply §7→§8 + the two cross-refs);
  Home region header notes the move.
- `docs/PROJECT-STATUS.md` §1 — PROOF-0721 set active; housekeeping folded
  in: DEDUPE-0720 (PR #67) + ADMIN-LABELS (PR #68) verified merged
  (`ce37638` ∈ main, branches deleted) and flipped from "READY TO MERGE".
- `docs/code-reviews/proof-band-move-apply-cta.md` — the Codex review brief
  (committed pre-review; verdict appended post-review).

## Prompt used

No gated master prompt — interactive session: plan mode (1 Explore agent +
direct cascade/adjacency verification) → one AskUserQuestion (HQ line) →
build → checks → Codex review via the committed brief (which doubles as the
exact review prompt).

## Checks & results

`pnpm install --frozen-lockfile` (fresh clone) · typecheck ✅ · lint ✅ ·
build ✅ (46/46 pages) · grep sweeps clean (`home-proof`/`HOME_PROOF`/
`home-cta-support` = zero hits; `bring-proof` only in bring-ph/page.tsx +
pages.css) · `git status` clean, no secrets. Codex independent review
(2026-07-21): **APPROVE — zero blocking, zero non-blocking**; move fidelity,
dead-reference/collision sweeps, cascade + named-container checks, copy
discipline, and scope/path-guard all passed; checks re-run green.

## Deviations & learnings

- **Verify the cascade before moving a section between pages:** the band's
  white caption depends on `.bring-proof .bring-proof-caption h2` (0,2,1)
  beating globals' late `.ph-section-dark` heading rules, and /bring-ph has
  its own forest-green heading recipe (`.bring-page :is(.bring-head h2, …)`)
  that must NOT match the incoming h2 — checked before building, confirmed
  safe (it targets only listed classes). The rename preserves specificity.
- **Adjacency sweep pays:** DEDUPE-0720's paired-padding lesson prompted a
  grep for `+`/`~` combinators around the band before the move — only the
  band-internal stat hairlines use adjacency, so no join CSS existed to
  break on either page.
- **Owner decisions are revisable:** DEDUPE-0720 recorded "band KEPT on
  Home"; this sprint reverses it by explicit request. The review brief
  pre-empted the reversal being flagged ("do not flag") — worth doing
  whenever a change contradicts a recorded decision.
- **Support-line coupling:** microcopy that exists to support a specific
  control ("Every application is reviewed by HQ.") should be removed with
  the control — confirmed with the owner rather than assumed.

## Follow-ups

- **OneDrive-canonical page-copy docs** (home / bring-a-house) are now
  staler on the moved/removed sections — owner annotates (outside the repo,
  standing follow-up from DEDUPE-0720).
- After the PR merges: next session flips PROJECT-STATUS §1 to merged as
  part of its normal session-start reconcile.
