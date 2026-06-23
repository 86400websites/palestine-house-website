# Sprint S8 — Workspace Visual Polish

| | |
|---|---|
| **Status** | **PREPARED — ready to run** (planned 2026-06-23; not yet started). This is the *forward* prompt, not a post-merge record — run it next session, then convert to a full record with `/sprint-prompt save` after the PR merges. |
| **Branch / PR** | `claude/sprint-s8-workspace-visual-polish` (create from latest `main`) / PR TBD |
| **Goal** | Lift all ~12 gated/workspace pages to the **public-shell premium bar** — premium, stunning, digestible, delightful, idiot-proof, not overwhelming — by faithfully applying the site's already-approved patterns + design-system tokens. **Finish, not redesign. No new design language, no new mockups, behaviour 100% untouched.** |

## How to run this
1. Start a fresh session on latest `main`.
2. Paste the prompt below into Claude Code.
3. Gate each sub-step with **"proceed"** (your standard workflow). The engine commits + pushes per step into the open PR so you review live.
4. Locked design input: `DESIGN.md` §14 (Workspace premium layer); decision `PROJECT-STATUS.md` §4 **D-S8-a**; the premium reference is the live public shell, the structural reference is `docs/page-designs/member-workspace/`.

## Why (context)
The MVP shipped the gated pages functionally perfect but visually plain — a senior-design review found them a notch below the live public pages (they read like a clean admin panel, not "a serious cultural institution"). The fix is to apply the public shell's *already-approved* premium patterns (entrance motion, tatreez dividers, warm washes, card-lift, richer empty states, a stronger dashboard hero) to the workspace's sound structure. `/live` is the benchmark and is **not** edited.

## Prompt used

<details><summary>Exact gated master prompt (ready to run)</summary>

```text
You are my senior engineer for the Palestine House website, working in Claude Code.

Session start: read docs/PROJECT-STATUS.md §1–§2 + §4 (decisions D-S8-a, D-S6-b RESOLVED, D-S6-c), then the S8 scope + exit gate in docs/ROADMAP.md §B (Stage 3), then docs/DESIGN.md §3 (tokens), §6 (components), §8 (motion), §11 (a11y), and §14 (Workspace premium layer — the locked brief for this sprint). CLAUDE.md governs everything below.

Sprint: S8 — Workspace Visual Polish
Branch: claude/sprint-s8-workspace-visual-polish (create from latest main)

Goal:
Lift every gated/workspace page to the PUBLIC-SHELL PREMIUM BAR so the partner platform feels premium, stunning, digestible, delightful and idiot-proof — without feeling overwhelming. This is FINISH, NOT REDESIGN: apply the site's already-approved patterns (the Reveal/FadeIn/Stagger motion, TatreezDivider, warm paper washes, ≤2px card-lift, richer empty/loading states, a stronger dashboard hero) within the existing design-system tokens. NO new design language, NO new mockups, NO new dependencies. BEHAVIOUR IS 100% UNTOUCHED — every edit is markup / className / wrapper / CSS-token only; never change a server gate, RPC, Server Action, checklist save, signed-URL download, form submit, filter/tab/sign-out logic, copy string, or proof number. The member-workspace mockups are the STRUCTURAL reference; the live public shell (src/app/live/page.tsx, src/components/shared/, the public globals.css classes) is the PREMIUM reference. /live is the benchmark — DO NOT edit it. Build gates stay OFF (D-S6-b RESOLVED — never render gate UI or invent gate data). /account delete stays hidden (D-S6-c).

In scope (12 gated routes under src/app/(workspace)/ + the shared shell): /dashboard (3 states), /plan, /build (+build-tracker.tsx), /operate, /elements/[slug] (+element-tabs.tsx), /resources (+resource-library.tsx), /resources/[category], /academy, /account (+account-form.tsx), /support (+support-form.tsx), /tools, plus src/components/workspace/workspace-shell.tsx + pending-state.tsx.
Out of scope: /live and every public/auth/admin page; new features; /search; /academy/[slug].

Execute in gated sub-steps (one owner gate after each):
1. (8a) Shared foundation — finish workspace-shell.tsx chrome to docs/page-designs/shared/workspace.css (active-rail/hover/locked items, topbar, avatar/status pill). CONFIRM a LazyMotion/domAnimation provider wraps the workspace tree (Reveal uses `m`); if the public chrome owns it, add it to the workspace shell. Add a small shared `ws-pagehead` rhythm (eyebrow→h1→lead) to remove per-page inline marginTop. Establish the premium kit as reusable primitives (the Reveal/Stagger convention copied from /live; one reusable warm empty-state; a card-lift utility). STOP.
2. (8b) Dashboard (all 3 states) — restore the mockup snapshot as the page hero: stat grid with lucide icons + a more present progress bar (KEEP the "Current gate" stat suppressed — D-S6-b); Stagger snapshot + next-steps + CTA row; entrance-fade the pending and newly-approved notice cards. STOP.
3. (8c) Plan + Operate — cardify/lift the .topic-row lists to the mockup feel (warm border OR soft shadow, ≤2px lift, never both), Stagger rows per group, align Operate's routine-cadence meta. Keep the curated group→code grouping + verbatim group names. STOP.
4. (8d) Build tracker — eased .bld-meter fill (entrance only), status pill = colour+icon+label (AA), accordion-body reveal on open, completed-area affordance, .ws-empty polish. GATES STAY OFF. Confirm mark complete/in-progress/blocked/reopen behaviour is byte-identical. STOP.
5. (8e) Element page — breadcrumb + Topic {code} eyebrow→h1→lead rhythm, action bar, .ws-tab active underline, single fade on panel mount (no height animation), apply the existing .ws-prose/.ws-checkrow/.ws-templaterow/.ws-placeholder/.ws-empty. All 6 tabs + signed-URL template download unchanged. STOP.
6. (8f) Resources + Resources/[category] + Academy — featured booklet cards on surface-hero (cover/badge/download aligned), .ws-tag rail + focus-area filter polish, .ws-empty no-match, Academy .vid-card ≤2px lift + thumb gradient + runtime chip + muted "Video coming" CTA, Stagger grids. Filters/type-toggle must still work. STOP.
7. (8g) Account + Support + Tools — wrap the bare forms in card containers (.ws-card/.acct-section — support-form.tsx is currently a bare inline div); input/.acct-switch finish; polished confirmation/empty states; one entrance Reveal + TatreezDivider rhythm on /tools. /account delete stays hidden (D-S6-c). Account save + Support submit→confirmation→send-another behaviour unchanged. STOP.
8. (8h) Sprint exit gate — full-diff review of the whole sprint; confirm NO copy string changed, proof numbers (10·30·200+·267·3) intact, NO behaviour/gate/RPC touched, a11y held (focus rings, prefers-reduced-motion, AA, colour+icon+label); update docs/PROJECT-STATUS.md (§1/§2 + change log) and tick S8 in docs/ROADMAP.md. STOP.

Per-step protocol (every sub-step, no exceptions):
1. Read the exact locked input(s) for this sub-step BEFORE coding: the matching docs/page-designs/member-workspace/*.app.jsx mockup, DESIGN.md §14, and the current page file.
2. Build it: smallest safe change, one focused concern; extend existing .ws-*/.bld-*/.dash-*/.res-*/.vid-*/.acct-* classes + Reveal + Artwork/TatreezDivider — never rebuild.
3. Verify: pnpm run typecheck && pnpm run lint && pnpm run build; then RUN THE DEV SERVER AND SCREENSHOT the step's route(s) at 320px AND ~1280px, compare against the mockup + the /live premium bar, and confirm under reduced-motion emulation that reveals resolve and content is visible. Re-click the step's interactive paths and confirm IDENTICAL behaviour.
4. Self-review the diff for any behaviour/copy/proof-number/gate drift and fix before committing (full review at the exit gate).
5. Commit AND push to the task branch — every sub-step, so the owner reviews live in the open PR.
6. Report in ≤6 lines: what shipped, checks run, screenshots taken, anything flagged — then STOP and WAIT for "proceed". Never start the next sub-step without it.

Owner remote commands: "proceed" = next step · "pause" = hold · "status" = where are we · "fix <thing>" = fix before continuing · "skip to <n>" = jump (record the skip in PROJECT-STATUS.md).

Locked inputs (never invent, never paraphrase):
- Design brief: docs/DESIGN.md §14 (Workspace premium layer) + §3/§6/§8/§11 tokens & rules.
- Structure: docs/page-designs/member-workspace/*.app.jsx (the per-page mockups).
- Premium reference: src/app/live/page.tsx + src/components/shared/ + the public classes in src/styles/globals.css (do NOT edit /live).
- Copy is verbatim from docs/page-copy/03-member-workspace/ + 06-elements/. Proof numbers fixed: 10 · 30 · 200+ · 267 · 3. Header/footer/sidebar chrome is locked — finish, never redesign.

Before editing:
1. Inspect the repo (package.json, next.config.ts, src/app/(workspace)/) and read every locked input above.
2. Propose a short plan and confirm scope before changing files.

While editing:
- Smallest safe change; one focused concern per commit; no unrelated refactors.
- Server Components stay server; add "use client" only if a NEW interaction genuinely requires it (it should not — this is presentation).
- Color lives in artwork, not chrome; warm border OR soft shadow, never both heavy; hover lift ≤2px; motion entrance-only and always behind prefers-reduced-motion.
- No new dependencies. Client code reads only NEXT_PUBLIC_* env vars; never hardcode or commit secrets; never commit .env.local.

Verification (must pass before reporting each step done):
- pnpm run typecheck && pnpm run lint && pnpm run build
- git status — .env.local untracked, no secrets staged, only in-scope files changed
- Screenshot-vs-mockup at 320px + desktop + reduced-motion; behaviour re-click identical; no copy string or proof number changed.

When the sprint is complete, in the same branch: update docs/PROJECT-STATUS.md (§1, §2 board, change log) and tick S8 in docs/ROADMAP.md.

Report at the end: summary · files changed · commands + results · risks/follow-ups · suggested commit message · sprint status. Push policy: commit + push after every gated sub-step (standing authorization, 2026-06-12) so the owner reviews in the open PR; never merge, never push beyond the task branch.
```

</details>

## The premium kit (reference — full detail in `DESIGN.md` §14)
1. **Entrance motion** — wire `Reveal`/`FadeIn`/`Stagger` (`src/components/motion/reveal.tsx`) into workspace sections; confirm `LazyMotion`/`domAnimation` wraps the workspace tree first.
2. **Rhythm** — `TatreezDivider` between sections + alternate `--paper-150/200`/`surface-hero` washes.
3. **Elevated empty/loading states** — one reusable warm empty-state; add `loading.tsx` where a route fetches.
4. **Card-lift** — ≤2px hover lift + `--shadow-md` (warm border OR soft shadow).
5. **Dashboard hero** — stat grid + lucide icons + present progress bar (gate stat stays suppressed).

## Checks & results
_To be filled after the sprint runs (typecheck/lint/build · screenshot-vs-mockup at 320px+desktop+reduced-motion · behaviour-unchanged re-clicks · diff shows zero copy/proof-number/gate changes)._

## Deviations & learnings
_To be filled after merge._

## Follow-ups
_To be filled after merge._
