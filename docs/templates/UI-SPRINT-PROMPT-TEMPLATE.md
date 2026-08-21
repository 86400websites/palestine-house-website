# Presentation-Only UI Sprint Prompt — [SPRINT_ID] — [SPRINT_NAME]

> **This is a skeleton. Every `[BRACKET]` is yours to replace.**
> Use it **only** for visual / presentational work. A new route, any data fetching or mutation, auth,
> the approval gate, env handling, config, security headers, or new interaction logic means you need
> the standard [`CLAUDE-SPRINT-PROMPT-TEMPLATE.md`](./CLAUDE-SPRINT-PROMPT-TEMPLATE.md) instead.
>
> The filled copy becomes the sprint record at `docs/sprint-prompts/[SPRINT_ID]-[SLUG].md` (lowercase);
> `/sprint-prompt save` writes it for the closing PR
> ([`docs/sprint-prompts/README.md`](../sprint-prompts/README.md)). Guidance:
> [`docs/SPRINT-PROMPT-TEMPLATE.md`](../SPRINT-PROMPT-TEMPLATE.md).

~~~text
You are my senior engineer for the Palestine House website, working in Claude Code.

Session start: read docs/PROJECT-STATUS.md §1–§2, then the sprint's scope + exit gate row in
docs/ROADMAP.md. CLAUDE.md governs everything below.

## Context
[Why this presentation change is needed now.]

## Goal
[Testable visual outcome for the named pages/components — with no behavior change.]

## Read first
- CLAUDE.md
- docs/PROJECT-STATUS.md §1–§2 and the [SPRINT_ID] row in docs/ROADMAP.md
- docs/DESIGN.md — §3 color, §4 typography, §5 layout, §6 component rules, §7 shadcn/Tailwind v4,
  §8 motion, §9 image/media, §10 responsive, §11 accessibility [narrow to what applies]
- [PAGE/COMPONENT]: [mockup path] + [copy path] + [existing implementation path]

## Sprint / Branch
- Sprint: [SPRINT_ID] — [SPRINT_NAME]
- Branch: claude/sprint-[SPRINT_ID]-[short-slug], created from the latest main.
- Confirm the branch and inspect git status before editing. Preserve existing user changes.

## Scope and files
Only these pages/components change visually: [LIST].
Known consumers of any shared component being touched: [LIST — find them before editing, e.g.
`rg "<ComponentName" src/`].

Inspect:
- [exact mockup / copy / source paths]

Allowed to change:
- [exact style / component / page-body path]
- [exact style / component / page-body path]

Bookkeeping, only at the exit-gate step when this sprint closes:
- docs/PROJECT-STATUS.md
- docs/ROADMAP.md

If another file is needed, stop and explain why before editing it.

## Execute in gated sub-steps (one owner gate after each)
1. ([SPRINT_ID]-a) [first visual sub-step — one page or one component]
2. ([SPRINT_ID]-b) [next]
3. […]
N. Exit gate — full-diff review, path guard, every listed shared-component consumer re-checked,
   trackers updated.

## Per-step protocol (every sub-step, no exceptions)
1. Read the approved mockup, the copy file and the existing implementation BEFORE editing.
2. Make the smallest presentation-only change inside the allowed paths.
3. Verify: pnpm run typecheck && pnpm run lint && pnpm run build; then look at every scoped
   page/component and every listed consumer at desktop AND 320px.
4. Self-review the diff — scope, path guard, regressions.
5. Commit AND push to the task branch.
6. Report in ≤6 lines, then STOP and WAIT for "proceed".

Owner remote commands: "proceed" · "pause" · "status" · "fix <thing>" · "skip to <n>".

## Commit and push authorization — D-SYS-2 (this project does not use per-prompt YES/NO tokens)
A standing owner authorization (2026-06-12) commits AND pushes to the task branch after every gated
sub-step, so the owner reviews live in the open PR. Task branch only: never push to main, never
merge, never force-push, never `--no-verify`. Stage explicit paths; never `git add -A` in this repo.

## Hard boundary
No new routes. No change to data fetching, mutations, auth, the approval gate, admin checks, env
handling, config, security headers, analytics semantics, or interaction behavior. If any of those
must change, stop and switch to the standard sprint template. Before reporting done, list every
changed path and confirm each one is on the allowed list.

## Palestine House UI rules
- The header and footer are locked chrome — identical on every page. Never create a page-specific
  variant and never redesign them as a side effect.
- Copy is verbatim from the approved copy file. Never rewrite, tighten or "improve" approved copy.
  A genuinely new string (empty state, error, aria label) follows the brand voice — warm, short,
  concrete; never charity tone, franchise hype, political slogans or startup filler — and is flagged
  in the report as new.
- Use only the tokens and scales recorded in docs/DESIGN.md (CSS variables in src/styles/globals.css
  and src/styles/v3.css). No new hex values, spacing values or font sizes invented inline. Heritage
  green leads; muted red is used sparingly.
- Reuse the existing components, variants and utility classes before writing new ones. No new
  dependencies — Tailwind v4 + shadcn/ui + Framer Motion + lucide-react are what exists.
- Motion stays in the restrained editorial register of docs/DESIGN.md §8, and every animation
  respects prefers-reduced-motion.
- Responsive at desktop AND 320px — both, every time. No horizontal overflow at 320px; wide content
  scrolls inside its own container.
- Accessibility (docs/DESIGN.md §11, WCAG AA): keyboard order and visible focus unchanged, contrast
  retained, headings still in order, images keep meaningful alt text, interactive controls keep
  their accessible names.
- Proof numbers, if any appear: 4 sections · 22 focus areas · 88 templates. The retired band
  (11 · 33 · 297 · "200+ checklist items" · "120-day launch") must never reappear.
- If mockup, copy and DESIGN.md disagree, stop and record an open decision in
  docs/PROJECT-STATUS.md §5 — only when that file is allowed. Do not pick silently.

## Safety
- Never open, read, copy, print or modify .env.local or any other live-value env file.
- Never hardcode or echo a secret; env variables by name only.
- This GitHub repo is PUBLIC: no personal names, emails, account ids, partner or applicant
  identities, gated content or Storage paths in anything committed — screenshots included.

## Verification (must pass before reporting a sub-step done)
- Typecheck: pnpm run typecheck
- Lint: pnpm run lint
- Production build: pnpm run build
- Local production smoke: pnpm run start, then walk the scoped pages
- Automated tests: none in this repo yet — the Playwright suite arrives in sprint SYS2. Do not
  invent a test command. (No Prettier/format check exists here either — D-SYS-3.)
- Visual: every scoped page/component and every listed consumer, at desktop and 320px, in the states
  that matter [hover / focus / open / empty / error — name them]
- Accessibility: keyboard traversal, visible focus, reduced-motion behavior, contrast
- Console: no new errors and no hydration warnings
- Path guard: git diff --name-only main...HEAD — every path on the allowed list
- Evidence: capture before/after screenshots per docs/BROWSER-TOOLS.md, or run the /browser-qa skill

Do not guess a command or install a dependency to make a check run. CI is .github/workflows/ci.yml
(workflow "CI", job "verify"): gitleaks secret scan, install, typecheck, lint, build.

## Report (at the exit-gate step)
1. Outcome and the pages/components actually scoped.
2. Files changed + the path-guard result.
3. Commands/checks run and exact results.
4. Viewport (desktop + 320px), shared-consumer, accessibility and Preview verification.
5. Risks, conflicts found, follow-ups — and any new string introduced.
6. Branch plus the actual commit/push status (SHAs pushed).
7. Sprint status: the docs/ROADMAP.md row and whether docs/PROJECT-STATUS.md was updated.
~~~

## Before merge

- [ ] Before/after visual evidence attached — desktop and 320px, plus the states that changed
      (`docs/BROWSER-TOOLS.md`, or the `/browser-qa` skill).
- [ ] The sprint record at `docs/sprint-prompts/[SPRINT_ID]-[SLUG].md` is complete.
- [ ] The PR is open, CI green, and the Vercel Preview tested at both viewports
      (`docs/WORKFLOW.md` §10–§11).
- [ ] Independent review (D-SYS-1) is **not** normally required for presentation-only work — but it
      is mandatory the moment the diff touches auth, the approval gate, RLS or schema, env handling,
      security headers or the CSP, which means the sprint was not presentation-only after all. If it
      is required: review the immutable `merge-base..head` range using
      [`CODEX-REVIEW-PROMPT-TEMPLATE.md`](./CODEX-REVIEW-PROMPT-TEMPLATE.md) and save the verdict at
      `docs/code-reviews/[SPRINT_ID]-[SLUG]-review.md`; no merge while a Blocking finding stands.
- [ ] Any substantive change after review → refresh the evidence and the Preview, then review again.
