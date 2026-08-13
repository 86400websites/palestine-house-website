# Sprint PP5 — Teardown + cutover

| | |
|---|---|
| **Date built** | 2026-08-14 (pushed; awaiting owner review + merge) |
| **Branch / PR** | `claude/sprint-pp5-teardown-cutover` (off `main` `638b6f4`) / PR pending |
| **Goal** | Delete the legacy gated workspace now that the v2 platform is feature-complete, redirect its URLs, and make the governing docs describe the platform that actually exists. |
| **Shape** | 8 owner-gated steps (5a–5h), **code only — zero SQL files in the diff** |
| **Totals** | 56 files · **523 insertions / 6,087 deletions** · route table 52 → 41 · CSS bundle 219,786 → 180,391 bytes (**−39 KB**) |

## What shipped

**5a — the tracker flip.** PP4 had merged as PR #78 (`main` = `638b6f4`, branch deleted) but the trackers on `main` still said it was awaiting review — the recurring Stage 4 pattern, since the owner merges after the session ends. PROJECT-STATUS §1/§2 + change log updated, ROADMAP PP4 ticked, PP5 opened. The PP5 scope cell was **corrected in the same pass, before any deletion** (see Deviations).

**5b — `/account` moved and restyled.** `src/app/(workspace)/account` → `src/app/(platform)/account`. It is the one legacy page the new chrome still links to (header ×2, footer ×1), so it had to survive; restyling it rather than keeping its `.acct-*` block is what let 5e delete the legacy CSS in full (owner decision at kickoff). Behaviour unchanged: same `set_my_account` write, same uncontrolled inputs, same `/forgot-password` link (the S7 fix — `/update-password` only accepts a recovery session), Delete account still hidden (D-S6-c), still session-gated only. **Zero copy changes.** Rebuilt from the v2 vocabulary PP3 established (`.pw-field`, `.pw-form-actions`, `.pw-action`) plus two new pieces: a card surface and the system's first switch, whose input is the real one — visually hidden but focusable — so label, keyboard and FormData behave natively. The transient `.adm-toast` became an inline note in the action row (`role="alert"` on failure, `status` on save).

**5c — the routes.** Deleted `/plan /build /food /programming /live /live/[id] /elements/[slug] /resources /resources/[category] /academy /tools`, the `(workspace)` layout, `WorkspaceShell`, the legacy pending-state, and `components/shared/session-card.tsx` (its only consumers were the two `/live` routes). Left alone deliberately: `/admin/content/academy` (PP6's) and the dormant tables (PP7's `0030`).

**5d — the libs.** Deleted at zero consumers: `src/lib/build`, `live/{actions,format,sessions,types}.ts`, `resources/view.ts`, `workspace/{progress,sample-videos}.ts`. Pruned `getElements` / `getChecklist` / `getAcademyModules` from `workspace/content.ts` and `ChecklistRow` / `AcademyRow` / the `/build` progress + view-model types from `workspace/types.ts` — **which is also what stops PP7's `0030` dropping RPCs that still have live callers**.

**5e — the CSS.** `globals.css` −1,929 lines (the S4 workspace chrome + legacy page styles, and the LH1 live-hub block), `pages.css` −328, `v3.css` rewritten from three legacy overrides to one. 2,263 lines total.

**5f — the cutover.** `next.config.ts` gains `redirects()`: twelve paths → `/dashboard` at **307** (not permanent — gated, noindexed URLs, and a cached 308 would outlive a model that has changed twice this stage). `GATED_PREFIXES` pruned to the seven live prefixes. Admin `revalidatePath` targets re-pointed.

**5g — the docs.** CLAUDE.md, AGENTS.md, TECH-ARCHITECTURE §0, DESIGN §8 lost their Stage 4 supersession blocks and now describe the current platform; SECURITY-CHECKLIST §15 rewritten; DESIGN §14 marked HISTORY at its head; PROJECT-STATUS §4's marker updated. Each keeps a short history note so old sprint records still parse. Nine broken relative links fixed in the two root docs.

## Prompt used

<details><summary>Exact implementation prompt (from the <code>/sprint-prompt</code> plan, 2026-08-14)</summary>

```text
Sprint: PP5 — Teardown + cutover (Stage 4, Private Platform Revamp)
Branch: claude/sprint-pp5-teardown-cutover (from main = 638b6f4, PP4/PR #78 merged)

Goal: delete the legacy gated workspace now that the v2 platform is feature-complete
(PP2 shell, PP3 toolkit pages, PP4 reader + search). Old routes still resolve by direct
URL and ~1,900 lines of legacy CSS still ship; both go. /account — the one legacy page
the new chrome still links to — moves into (platform) and is restyled in the .pw- register.
Old URLs redirect to /dashboard. The governing docs stop describing a workspace that no
longer exists. CODE ONLY: zero SQL. The academy/checklist TABLES stay until PP7's 0030 —
deleting their UI must not imply dropping their data.

Steps, one owner gate after each:
 5a  Flip the stale PP4 trackers (the recurring one). No code.
 5b  /account moves to (platform) and is restyled; never touch .adm-*; prove containment.
 5c  Delete the ten route families + the (workspace) layout + the legacy components.
     Do not touch (platform)/** or /admin/**. Grep-verify zero references first.
 5d  Dead-lib sweep. KEEP lib/live/youtube.ts, lib/resources/actions.ts,
     lib/workspace/{content,markdown,types}.ts, lib/support/focus-areas.ts.
 5e  CSS teardown — cut on banner comments, never on the ROADMAP's line numbers.
     pages.css .live-* may be shared with the PUBLIC /experience strip: delete only what
     grep proves unreferenced. Watch the Tailwind comment trap.
 5f  redirects() + GATED_PREFIXES + admin revalidatePath targets. Keep headers/CSP as they are.
 5g  Rewrite CLAUDE.md, AGENTS.md, TECH-ARCHITECTURE, SECURITY-CHECKLIST §15, DESIGN.
 5h  Exit gate: full-diff review, path-guard, PROD invariants read-only, trackers, record.

Per-step protocol: read the locked inputs first · smallest safe change · typecheck + lint +
build · self-review the diff · commit AND push · report in ≤6 lines, then STOP and wait for
"proceed".
```

</details>

## Checks & results

typecheck ✅ · lint ✅ · build ✅ (**41 routes**, from 52)

- **Path-guard clean.** No public page, API route, `src/middleware.ts` or `src/lib/site.ts` in the diff. `src/app/layout.tsx` changed by one comment word. `next.config.ts` changed only by `redirects()` plus a CSP **comment** — no directive value moved, no header changed.
- **Redirects verified live**, not merely built: a production server on port 3117 returned **307 → `/dashboard`** for all twelve retired paths, including the child forms `/live/abc123`, `/elements/c2`, `/resources/forms`.
- **CSS containment proven twice over.** At source: **2,269 deletions / 6 insertions**, the insertions being one selector and its comment — so no surviving declaration was touched. At bundle: 1,954 → 1,588 rule headers, 337 removed, 2 "added" (the two edited selectors). Then every one of the **243 classes** appearing in removed rules was cross-checked against every `className` token in `src`: 12 apparent hits, all resolved, and every public class has an **identical rule count before and after**. Final state: `.ws-`/`.acct-`/`.live-` at **0**, `.adm-` unchanged at **64**, `.pw-` 311 → 329.
- **`/account` measured in a browser** against the built CSS (harness served over HTTP, since nothing here can sign in): 320px → **0 horizontal overflow**, switch reads olive and translates 18px when checked, accessibility tree gives the checkbox the label's sentence as its name; desktop → the reader's 640px column.
- **Public side re-verified against the running server:** five pages render full content, `/our-support` still emits its 12 artefact icons with the rescued rule shipping, and **no public page's markup references any deleted class**.
- **PROD invariants re-verified read-only** (`supabase-prod-readonly`, no write): 297 in-grid templates · 0 wrong-bucket · 2 public booklets · 33 topics / 10 groups / 5 sections / 33 elements · 0 orphan guides · anon `EXECUTE` **false** and `is_approved` gating **present** on every read RPC (`get_platform_sections/topics`, `get_element`, `get_resources`, `member_programming_sessions`) · `set_my_account` correctly ungated on approval and anon-denied · the four dormant tables untouched (818 checklist items, 33 academy modules, 0 sessions).
- **Not verified: the signed-in visual.** No `.env.local` in this checkout, so the Supabase client throws before any gate runs and `loading.tsx` has already committed a 200 — which is why gated routes appear to return 200 to an anonymous curl. Unchanged from PP2/PP3/PP4; PP5 touched no gate logic.

## Deviations & learnings

- **The written plan was wrong in three places, and each was caught by checking a claim rather than trusting it.** This is the sprint's real lesson, and it is the same one PP3 and PP4 recorded in different clothes.
  1. **The ROADMAP's delete list named four load-bearing modules.** "Delete `src/lib/{live,build}`" would have taken `live/youtube.ts`, which `admin/content-actions.ts` imports and PP6's CMS needs. `lib/resources/actions.ts` is the signed-URL download behind both v2 download surfaces. `lib/workspace/{content,markdown,types}.ts` feed `workspace-v2/content.ts`. `lib/support/focus-areas.ts` feeds Ask HQ. One grep per module, run at kickoff and written into the tracker before a single deletion.
  2. **The `pages.css` `.live-*` recipes were NOT shared with the public Experience strip.** The ROADMAP said they were and had to stay; the file's own comment said so too. Both were stale: **LH1 moved sessions entirely into the member workspace on 2026-07-10**, and `/experience` says in its header comment that it carries zero session data. So the block was dead and went — this step removed *more* than planned, not less.
  3. **`v3.css` was not in the scope at all, and held a booby trap.** Three legacy overrides survived there, one being `.ph-page :is(.live-pill, .sup-artefact-icon)` — a dead class paired with one the **public** `/our-support` page still uses. Deleting the rule whole would have dropped the olive chips on a live public page. It is now `.ph-page .sup-artefact-icon`: same specificity (0,2,0), same declaration. The same care applied to the `.ph-section-dark :is(...)` list in `pages.css`, where only `.live-empty` was struck and the most-specific argument (`.split-copy p`) is unchanged, so the remaining members keep their specificity.
- **A verification script that "passes" can be broken.** The first cross-check reported all 243 removed classes as still referenced, every one supposedly in the same file — obviously wrong. The regex had been mangled by shell quoting. Rewritten as a real file (`check-removed-classes.mjs`) it found 12 hits, all explicable. **A checker whose output is implausible has failed, even when it exits 0.**
- **I introduced a defect and caught it in my own diff.** The re-pointed `revalidatePath` first built the reader path from `d.slug` — but the reader's `[topic]` segment is the **`platform_topics` slug**, not the element slug, so it would have matched nothing and failed silently, which is exactly the fault I had just written a comment criticising. Fixed to `revalidatePath('/{section}/[topic]/guide', 'page')`, the documented dynamic-route form.
- **`display: contents` on the account `<form>` was written and then removed** before commit: it bought nothing (the cards' own margins produce the identical rhythm) and carries known accessibility-tree caveats. Not every clever rule earns its place.
- **The ROADMAP's CSS line numbers had drifted ~11 lines** (it said 874–2716 + 3130–3214; the real blocks were 885–2726 and 3141–3225). Cutting on the banner comments rather than the numbers is the only safe method, and the numbers should not have been written down as if durable.
- **`/account` gained one small regression, recorded rather than hidden:** the `(platform)` layout's redirect is hardcoded to `?next=/dashboard`, so an anonymous deep-link to `/account` lands on About after signing in rather than back on the page. Noted in the page comment; a proper fix needs the layout to know the path.

## Follow-ups

1. **Owner: review + merge.** No DB step at this gate — zero SQL. A Codex review is worth it despite the diff being mostly deletions: it changes `GATED_PREFIXES`, adds `redirects()`, and rewrites the security docs.
2. **Owner: the signed-in Preview walkthrough** (the standing blind spot). Worth clicking: `/account` — the one new visual — saving a name change (the confirmation is an inline note now, not a toast), the email switch, the Change password link; then a bookmarked old URL or two; then the four sections, a reader and Ctrl/⌘+K to confirm the teardown took nothing with it. On the public site, check `/our-support`'s toolkit cards still show their olive icon chips — that is the single place a wrong CSS cut would show.
3. **PP6 still owes the `storage_bucket` guard** (D-PP-i), now stated plainly in SECURITY-CHECKLIST §15 with the reason it is safe until then. PP5 verified the invariant holds in production; it could not close it.
4. **PP7 inherits a cleaner run at `0030`:** every app-side caller of `get_checklist`, `get_academy_modules` and `get_elements` is gone, so the drops cannot break a live caller. Still outstanding for that sprint: `CREATE OR REPLACE` the three functions that select `elements.overview_md` before dropping the column, drop the four academy-dependent admin RPCs in the same migration, and retire or update `scripts/ingest-content.ts` — which **still writes Academy, overview and checklist data**, and which PP5 deliberately did not touch.
5. **`/admin/content/academy` is now the only place the Academy exists in the UI.** PP6 deletes that screen; until then it edits rows nothing renders.
6. **Carried from PP4, still unhomed:** wire `scripts/verify-guide-cover.mts` into CI (PP7's natural home), and PP3's follow-up #6 — `/support` says *Your question is ready.* after a send that really does send, a one-string edit.
