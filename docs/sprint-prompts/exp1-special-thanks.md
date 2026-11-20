# Sprint EXP1 — Experience: Special thanks to Casa Palestina

| | |
|---|---|
| **Date merged** | — (built 2026-11-20; Codex approved `19f0288..92a30ee` the same day; the owner approved the final version, "This is perfect", and merges PR #112) |
| **Branch / PR** | `claude/exp1-special-thanks` (from `main` = `19f0288`) / [#112](https://github.com/86400websites/palestine-house-website/pull/112) |
| **Review** | [`code-reviews/exp1-special-thanks.md`](../code-reviews/exp1-special-thanks.md): **APPROVE**, no findings |
| **Goal** | Add the owner's mockup section "Special thanks to Casa Palestina" as the last section of `/experience`, and change nothing else. |

## What shipped
- `src/app/experience/page.tsx`: a new §7, `section#special-thanks` (`aria-labelledby="thanks-heading"`), after §6 "More than somewhere to visit.". It holds the page's day-room photo (`ph-photo-exp-cafe-day`, the same asset and alt text the mockup uses), the eyebrow mark (`exp-orn exp-orn--eyebrow`), the heading, the thank-you paragraph, and "Visit Palestine House in Lisbon" linking to `https://casapalestina.pt/` (`target="_blank"`, `rel="noopener noreferrer"`, an `aria-hidden` arrow icon).
- `src/styles/pages.css`: the section's styles, ported value for value from the mockup's `<style>` block, renamed `thanks-*` → `exp-thanks-*` to match the page's namespace. The mockup's button greens, body ink and focus copper stay page-scoped literals, as `/bring-ph`'s CTA does. The cream ground and ink use the site tokens the mockup itself resolved (`--cream-100` `#f6efe4`, `--ink-900` `#1a1a17`). The two columns stack at 720px.
- Trackers: `ROADMAP.md` (new EXP1 row) and `PROJECT-STATUS.md` (§1, §2 board, §8 change log).

## Prompt used
<details><summary>Exact implementation prompt</summary>

```text
You are my senior engineer for the Palestine House website, working in Claude Code.

Session start: read docs/PROJECT-STATUS.md §1–§2, then the sprint scope + exit gate in docs/ROADMAP.md. CLAUDE.md governs everything below.

Sprint: EXP1 — Experience: Special thanks to Casa Palestina (owner-requested ad-hoc, 2026-11-20)
Branch: claude/exp1-special-thanks (create from latest main)

Goal:
Add the section "Special thanks to Casa Palestina" as the LAST section of /experience,
after "More than somewhere to visit.", exactly as the owner's mockup draws it:
photo left, eyebrow mark + heading + thank-you paragraph + "Visit Palestine House in
Lisbon" (new tab to https://casapalestina.pt/) right, stacking on mobile. No other change.

Allowed to change (WORKFLOW.md §0.8 — the diff stays inside this list):
src/app/experience/page.tsx, src/styles/pages.css, docs/PROJECT-STATUS.md,
docs/ROADMAP.md, docs/sprint-prompts/exp1-special-thanks.md
Explicitly NOT in scope: the footer (locked chrome, including the mockup's "Special
thanks" footer link), the header and the mockup's mobile-menu rewrite, any other
section or page, new photos or dependencies, CSP/headers/env/auth/schema.
If the work genuinely needs a file outside the list, STOP and say why before touching it.

Execute in gated sub-steps (one owner gate after each):
1. (1a) Build the section in page.tsx (reuse Photo + the exp-orn mark) and its scoped
   CSS in pages.css, ported value for value from the mockup's <style> block.
2. (1b) Sprint exit gate — full-diff review, fix everything found, update
   docs/PROJECT-STATUS.md + add the EXP1 row to docs/ROADMAP.md, write this record.

Per-step protocol (every sub-step, no exceptions):
1. Read the exact locked input(s) for this sub-step BEFORE coding.
2. Build it: smallest safe change, one focused concern.
3. Verify: pnpm run typecheck && pnpm run lint && pnpm run build; spot-check the affected routes and confirm nothing else broke.
4. Self-review the diff for bugs and fix them before committing (full review happens at the exit-gate step).
5. Commit AND push to the task branch — every sub-step, so the owner can review live in the open PR.
6. Report in ≤6 lines: what shipped, checks run, anything flagged — then STOP and WAIT for "proceed". Never start the next sub-step without it.

Owner remote commands: "proceed" = next step · "pause" = hold · "status" = where are we ·
"fix <thing>" = fix before continuing · "skip to <n>" = jump (record the skip in PROJECT-STATUS.md).

Locked inputs (never invent, never paraphrase):
- Copy, verbatim: docs/Experience Last Section Addition.html (the owner's mockup, section #special-thanks)
- Design: the same mockup's <style> block + design-system tokens (values recorded in docs/DESIGN.md §3)
- Proof numbers: untouched by this sprint (4 sections · 22 focus areas · 83 templates and practical tools). Header/footer chrome is locked — never redesign per page.

Before editing:
1. Inspect the repo (package.json, next.config.ts, src/app/) and read every locked input above.
2. Propose a short plan and confirm scope before changing files.

While editing:
- Smallest safe change; one focused concern per commit; no unrelated refactors.
- Server Components by default; "use client" only when interactivity requires it.
- Client code reads only NEXT_PUBLIC_* env vars; never hardcode or commit secrets; never commit .env.local.
- UI-only: reuse existing components/styles; no new dependencies; responsive + accessible.

Verification (must pass before reporting done):
- pnpm run typecheck && pnpm run lint && pnpm run build; pnpm exec tsx scripts/verify-public-copy.ts
- git status — .env.local untracked, no secrets staged
- Manual: the section is last in <main> on /experience; matches the mockup at 1440px;
  stacks at 320px with no horizontal scroll; the button opens casapalestina.pt in a new tab.

When the sprint is complete, in the same branch: update docs/PROJECT-STATUS.md (§1, §2, change log) and add the sprint to docs/ROADMAP.md.

Report at the end: summary · files changed · commands + results · risks/follow-ups · suggested commit message · sprint status. Push policy: commit + push after every gated sub-step (standing authorization, 2026-06-12) so the owner reviews in the open PR; never merge, never push beyond the task branch.
```

</details>

## Checks & results
typecheck ✅ · lint ✅ · build ✅ · public-copy checker 74/74 ✅ · local production build checked in a browser at 1440px and 320px ✅. Computed styles match the mockup's values, the section is the last child of `<main>`, and there's no horizontal scroll at 320px. Vercel Preview: the owner checks it on the PR.

## Deviations & learnings
- The owner's message ("run /sprint-prompt then execute and let me know when we are ready to run the codex review") pre-authorized both sub-steps, so they ran without a "proceed" between them.
- The section uses no `Reveal` fade-in, because the mockup's markup has none (every other section's `Reveal` wrapper shows up as a bare `<div>` in the export).
- The mockup HTML (4.8 MB, with embedded images) sits untracked at `docs/`. It isn't committed, like the other owner mockups, which live in gitignored folders.

## Follow-ups
- None. **Resolved 2026-11-20:** the mockup also added a "Special thanks" link (`/experience#special-thanks`) to the footer's Explore column. The footer is locked chrome, so it didn't ship, and the owner then declined it ("No need for footer"). The footer stays as it is.
