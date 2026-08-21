# QA Checklist — Palestine House

> **The per-PR gate sheet.** Part 1 runs locally before the PR is opened; Part 2 runs on the deployed Vercel Preview before independent review and merge. Both are recorded in the PR against the **tested head SHA**.
>
> **The rule: merge only after BOTH parts pass.** Local green is necessary but not sufficient — env inlining, auth origins, Supabase redirect URLs and the integrations all behave differently deployed.

## What this sheet is (and is not)

This sheet **sequences** the gates; it does not restate them. The binding wording lives in the docs below, and where this sheet and one of them disagree, **the other doc wins and this sheet is the defect to fix**:

| Gate | Binding source |
|---|---|
| Local checks before pushing | [`WORKFLOW.md`](./WORKFLOW.md) §9 |
| Opening the PR | [`WORKFLOW.md`](./WORKFLOW.md) §10 |
| Testing the Vercel Preview | [`WORKFLOW.md`](./WORKFLOW.md) §11 |
| Merging + production | [`WORKFLOW.md`](./WORKFLOW.md) §12 · §17 Definition of done |
| Supabase / env-var changes | [`WORKFLOW.md`](./WORKFLOW.md) §14 · [`SUPABASE-MCP-SAFETY.md`](./SUPABASE-MCP-SAFETY.md) · [`ENV-VARS-SAFETY.md`](./ENV-VARS-SAFETY.md) |
| Sprint exit | [`ROADMAP.md`](./ROADMAP.md) → "Sprint exit gate (applies to every sprint)" |
| Security | [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) — §1/§2 secrets · §5 RLS · §6 auth · §8 Route Handlers and abuse controls · §13 production deploy · §15 the Palestine House blocking invariants |
| Performance | [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md) §15 |
| Build/test expectations | [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md) §16 |
| Responsive + accessibility | [`DESIGN.md`](./DESIGN.md) §10 · §11 (and §0, the non-negotiable) |
| Agent conduct | [`CLAUDE.md`](../CLAUDE.md) · [`AGENTS.md`](../AGENTS.md) |

**Three things this sheet adds that `WORKFLOW.md` does not have:**

1. **The two-part split, stated as a merge condition** — local green and deployed green are separate gates, and neither substitutes for the other.
2. **A per-PR record naming the tested head SHA.** `WORKFLOW.md` §11 says test the Preview; it does not say *which build you tested*. A new commit — code, config **or** SQL — creates a new head and invalidates the Part 2 record.
3. **An honest status line for the automated-suite gate**, which this repo does not yet satisfy. See Part 1 → Automated tests.

---

## Part 1 — LOCAL (before opening the PR)

### Build health

- [ ] Run [`WORKFLOW.md`](./WORKFLOW.md) §9 in full — `pnpm run typecheck`, `pnpm run lint`, `pnpm run build`, dev-server check, no new console errors, `.env.local` untracked. Those six boxes are not repeated here.
- [ ] Optional production smoke: `pnpm run start` after the build, per [`WORKFLOW.md`](./WORKFLOW.md) §5.
- [ ] The same three gates run on the PR as [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — workflow **CI**, job **`verify`** — alongside `pnpm install --frozen-lockfile` and a gitleaks secret scan. A green **`verify`** on the *current head* satisfies this block; red never merges. See [`TECHNICAL-INTEGRITY.md`](./TECHNICAL-INTEGRITY.md).
  - **D-SYS-4:** the workflow keeps its `ci.yml` / "CI" identity and its required `verify` job. Where the SOP says "Code Check", read `verify`.
- [ ] **Formatting — WAIVED (D-SYS-3).** There is no `format:check` and no Prettier gate in this repo, and none is being added: introducing one to an already-built site would force a whole-repo reformat and bury every future diff. `pnpm run lint` (`eslint .`) is the style gate. `package.json` defines exactly five scripts — `dev`, `build`, `start`, `lint`, `typecheck`. Never invent a sixth.

### Automated tests

- [ ] ⛔ **Not yet satisfiable — the Launch Gate suite arrives in SYS2** ([`ROADMAP.md`](./ROADMAP.md) Stage 5). There is no `test` script, no `tests/e2e/`, and no `docs/test-reports/` in this repo today.
  - The SOP's rule is that "no suite" is permitted **only for a fully static site**, and that a project with auth, gated content or a database must have an automated suite — *a blocking gate, not a preference*. Palestine House has all three. **By that rule this repo does not pass Part 1 today**, and the compliance audit records exactly that ([`notes/system-compliance-audit-2026-08-21.md`](./notes/system-compliance-audit-2026-08-21.md), "System QA-CHECKLIST.md — net-new install; automated-suite blocking gate currently violated").
  - Do not tick this box, do not delete it, and do not claim manual clicking closed it. It is ticked the day SYS2's suite runs green.
- [ ] Until SYS2 lands: **record the manual coverage actually run** in the PR — which roles, which routes, which denied-state checks — so the gap stays visible instead of implied.
- [ ] 🔴 **Denied-state rule — applies now, manually; automated in SYS2.** Any change touching auth, the approval gate, RLS, an RPC or an `/admin/*` route is verified in **both** directions for every affected role: **anonymous · pending partner · approved partner · HQ admin**. Allowed *and* denied. What must hold is [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) §15 — read it, do not paraphrase it — and in particular its last bullet: **a gate is a throw, not an await**, so a gated page must short-circuit before it constructs any JSX.
- [ ] When SYS2 ships, this block becomes: suite green · new behavior covered at the right layer · **at least one denied-state assertion per protected boundary**. The feature list and specs land in `docs/testing-setup/` and `tests/e2e/` — *both arrive in SYS2, neither exists yet*.

### Every touched page

- [ ] Renders without errors in the dev server **and** on the production build.
- [ ] Zero console errors and no hydration warnings — open DevTools, don't assume ([`ROADMAP.md`](./ROADMAP.md) sprint exit gate).
- [ ] Check the pages the change *could* have affected, not only the ones you edited ([`WORKFLOW.md`](./WORKFLOW.md) §11).
- [ ] Shared chrome unchanged: the header and footer are identical on every page — never a per-page variant ([`CLAUDE.md`](../CLAUDE.md), [`DESIGN.md`](./DESIGN.md)).

### The two viewports

- [ ] **Desktop and 320px.** Every touched page: no horizontal scroll, no overlap, tap targets ≥ 44×44px, single column on mobile ([`DESIGN.md`](./DESIGN.md) §10 — "verify every breakpoint from 320px up").
- [ ] Layout still matches its mockup at 320px → desktop, per the Stage 0 exit gate in [`ROADMAP.md`](./ROADMAP.md).

### Forms (if touched)

The write surfaces shipped today: **`/apply`** and **`/contact`** are the public writes; the **Ask HQ** request on the gated support surface (`submit_support_request`) is an approved-partner-only write. **Read that as examples, not as the scope** — [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) §15 states the public-write rule as a blanket rule (it also names lead-magnet and newsletter writes, neither of which ships here), and a new public write is covered the day it is written. §15's own history is why: an enumeration silently becomes an allowlist.

- [ ] Client validation fires on bad input with a clear message; the string follows the brand-voice rules for new copy ([`CLAUDE.md`](../CLAUDE.md) → Locked content & design inputs).
- [ ] Valid submit works end to end, or shows an honest unavailable state — **never a fake success** ([`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) §8).
- [ ] Server-side zod validation is present and the handler leaks no stack trace or upstream error body ([`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) §8, §9).
- [ ] ⚠️ **Rate limiting and Turnstile are NOT shipped yet — D-SYS-9.** The public writes are currently unthrottled; this is known issue #1 in [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §7 and is scheduled as sprint **SYS1.5**. Do **not** test for, or report, a `429` or a CAPTCHA challenge before SYS1.5 ships — and do not claim §8's rate-limit/CAPTCHA boxes or §15's public-writes invariant as satisfied. What *is* live and must be verified: zod validation, fail-closed behavior, and the approval gate that keeps abuse out of gated content.

### Accessibility

The standard is [`DESIGN.md`](./DESIGN.md) §11 (WCAG AA minimum) — that section is the wording, this is the running order:

- [ ] Keyboard-only pass on the touched flow: logical tab order, visible focus ring (`--ring`), working skip-to-content link, no keyboard trap in the mobile Sheet or any dialog; nav Tooltip content reachable without hover.
- [ ] Forms have programmatic labels; required/error/success states are announced and never rely on colour alone.
- [ ] Semantic landmarks and correct heading order; `alt` text per [`DESIGN.md`](./DESIGN.md) §9 (describe the scene; don't assert events or identify people).
- [ ] Contrast AA on every brand pair used (4.5:1 body, 3:1 large text/UI) — check green-on-paper combinations specifically.
- [ ] `prefers-reduced-motion` respected; content usable at 200% zoom.
- [ ] **No automated accessibility scanner is wired into this repo.** The SOP asks for one; there is no configured scan and no script for it, so this check is manual against §11 until a scanner is adopted (a natural candidate for SYS2). Do not report a scan you did not run.

### Performance

- [ ] Use **this project's recorded budget**, [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md) §15 — it is stricter than the SOP default and therefore replaces it: **Lighthouse 95+** (Performance, Accessibility, Best Practices, SEO) before merging, and Core Web Vitals **LCP < 2.5s · INP < 200ms · CLS < 0.1**, tested on PageSpeed Insights on every Preview.
- [ ] Images via `next/image` with correct `sizes` and `priority` above the fold; explicit dimensions or a fixed-size frame so nothing shifts; no accidental large asset, font, script or request added ([`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md) §15, [`DESIGN.md`](./DESIGN.md) §9).
- [ ] **No JS transfer budget is recorded for this project.** The SOP suggests ~300KB gzipped on the primary journey; that number has never been adopted here, so treat it as unset rather than as a pass or a failure — and don't invent one.
- [ ] Known weight note: the PP8 row in [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §2 records the 22 focus-area photos at **200–290 KB each, unoptimised**. Check that row's current state before re-raising or assuming it closed.

### Content fidelity

- [ ] Every visible string is verbatim from the approved copy source named in [`CLAUDE.md`](../CLAUDE.md) → Locked content & design inputs (`/docs/page-copy/`). **Note:** that folder and `/docs/page-designs/` are **gitignored** (see `.gitignore`) — they live in the owner's working copy, not in a fresh clone. If you cannot read the copy file, you cannot approve new copy; say so rather than paraphrasing.
- [ ] **Proof numbers: 4 sections · 22 focus areas · 88 templates** ([`WORKFLOW.md`](./WORKFLOW.md) §0.4). The retired bands — 11 · 33 · 200+ · 297 · 120-day — name deleted content and must not reappear.
- [ ] If the change touches the public focus-area copy or the proof numbers, run the checker: `pnpm exec tsx scripts/verify-public-copy.ts` (it asserts exactly 22 focus areas, 4 sections and an 88 template total, and that each public one-liner is the owner's own Overview sentence — D-PP-s).
- [ ] No unfilled `[placeholder]` token reaches the DOM.

### Secrets

- [ ] The last box of [`WORKFLOW.md`](./WORKFLOW.md) §9 plus [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) §1 and §2 — that is the wording. Confirm `.env.local` is ignored **without opening it** (`git check-ignore .env.local`), and that neither it nor any key, token or connection string is in the diff.
- [ ] Stage explicit files rather than a blanket `git add -A` ([`WORKFLOW.md`](./WORKFLOW.md) §6). A browser QA run in particular leaves untracked page snapshots and **downloaded partner templates** in the tree ([`BROWSER-TOOLS.md`](./BROWSER-TOOLS.md)) — approval-gated content one careless stage away from the diff.
- [ ] New env var → list it in the PR **by name only**, note public vs server-only, and add it in Vercel per [`WORKFLOW.md`](./WORKFLOW.md) §14 and [`ENV-VARS-SAFETY.md`](./ENV-VARS-SAFETY.md).

**Why this matters:** everything above is cheap to fix now and expensive to fix after merge.

---

## Part 2 — DEPLOYED PREVIEW (before review and merge — mandatory)

Open the PR's Vercel Preview URL and test **the deployed build**, not your local one. Record the environment, URL and **tested head SHA** in a copy of [`templates/VERCEL-PREVIEW-TEST-TEMPLATE.md`](./templates/VERCEL-PREVIEW-TEST-TEMPLATE.md) and link it in the PR.

> **The head-SHA rule.** A Part 2 record is valid only for the head SHA it names. Any new commit — code, config or SQL — creates a new head and requires a refreshed Preview test. This is the one thing `WORKFLOW.md` §11 does not say, and it is why this sheet exists.

> **Full pass vs mobile smoke subset — be honest about which you ran.** The full pass below (keyboard/a11y, 320px layout, every touched page, role matrix, regression spot-checks) needs a desktop browser with devtools. A quick look from a phone is a **mobile smoke subset**: the touched pages load, the primary flow completes, nothing is obviously broken — record it as "mobile smoke only". A change touching **auth, the approval gate, the shared header/footer, or the Apply conversion** requires the full desktop pass before merge; it cannot be signed off from mobile.

### Full pass of touched pages

- [ ] Every touched page on desktop: layout, images, interactions.
- [ ] Every touched page at **320px** (and, if you have it, a real device).
- [ ] No layout shift, broken images or runtime errors; console clean.
- [ ] The Preview checklist boxes in [`WORKFLOW.md`](./WORKFLOW.md) §11 are all ticked.

### Visual QA evidence (UI sprints)

- [ ] Capture every touched page at **320 / 768 / 1440** on the deployed Preview, plus state coverage where it applies (default, hover/focus-visible, loading, empty, error), using the tooling in [`BROWSER-TOOLS.md`](./BROWSER-TOOLS.md) — the [`browser-qa`](../.claude/skills/browser-qa/SKILL.md) skill runs this.
- [ ] Judge the captures against the approved mockup and [`DESIGN.md`](./DESIGN.md) **§0 (the non-negotiable)**, **§10 (responsive)** and **§11 (accessibility)**. Record PASS or the exact visual gaps. "It renders" is not the bar — the site must read as a serious cultural institution.
  - *Citation fix:* the SOP points at "DESIGN.md §8 (frontend craft)". In **this** repo §8 is Motion / Framer Motion guidelines; the craft bar is §0, and the layout/a11y rules are §10 and §11.
- [ ] Attach or link the evidence in the PR alongside the Preview record.

### Roles and gates (any change touching auth, the gate, RPCs or `/admin/*`)

Walk the four roles — **anonymous · pending partner · approved partner · HQ admin** — against the surfaces the change could reach:

- [ ] Public shell: `/`, `/model`, `/experience`, `/bring-ph`, `/our-support`, `/about`, `/contact`, `/focus-areas`, `/apply`, legal, auth pages.
- [ ] Gated platform: `/dashboard`, the four toolkit sections `/setup` · `/operate` · `/program` · `/support`, the guide reader at `/{section}/{topic}/guide`, and `/account`.
- [ ] HQ: `/admin/approvals` and `/admin/content` (`pages`, `focus-areas`, `files`, `admins`).
- [ ] 🔴 A **pending** session resolves only its own profile/approval status — never a guide body, a topic summary or a template row — and the global search index is empty for pending and anonymous callers.
- [ ] 🔴 `/account` is the **one** deliberate session-only exception (no approval check), and exposes nothing but the caller's own `profiles` row. Any *other* gated route missing an approval check is a defect.
- [ ] 🔴 `/admin/*` verifies the `admins` table server-side; `is_approved` alone is not admin. Each admin page gates **itself** before producing JSX.
- [ ] 🔴 Template downloads are server-issued signed URLs to approved users only; the two public booklet PDFs are the only public files.
- [ ] The full wording of all four rules is [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) §15 — re-read it per PR, and run §5 (RLS), §6 (auth/session) and §8 (Route Handlers) where the diff touches them.

### Auth (only if the change touches auth — skip otherwise)

- [ ] Sign in / sign out / Apply sign-up / password reset all work on the Preview.
- [ ] Auth email links resolve to the **Preview** origin, never Production, and Preview's `NEXT_PUBLIC_SITE_URL` is not the Production URL ([`WORKFLOW.md`](./WORKFLOW.md) §11 and §14, [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) §12).
- [ ] Redirect targets stay same-origin ([`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) §6).

### Database changes (only if the diff carries SQL)

- [ ] Up-SQL, matching `.down.sql` and RLS policies are all in the PR, applied and tested on the **non-production** Supabase project first — the protocol is [`WORKFLOW.md`](./WORKFLOW.md) §14, and it is applied by hand in the Supabase SQL Editor.
- [ ] Preview was tested against the non-production project, not production. Production is on migration **`0034`** ([`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §1) and is **read-only from here** — never write to it through any channel, including the MCP ([`SUPABASE-MCP-SAFETY.md`](./SUPABASE-MCP-SAFETY.md)).
- [ ] A Vercel rollback restores code, not the database — confirm the change is backwards-compatible or that the `.down.sql` is rehearsed ([`WORKFLOW.md`](./WORKFLOW.md) §13, [`ROLLBACK.md`](./ROLLBACK.md), and for undoing the `0030` content cutover specifically, [`ROLLBACK-RUNBOOK.md`](./ROLLBACK-RUNBOOK.md)).

### Primary conversion flow

- [ ] Walk **Apply** end to end on the Preview: public page → `/apply` → submit → pending account created → lands on the `/dashboard` pending state. It is the site's single public conversion and its only account-creation door.
- [ ] The header's Apply CTA behaves per session state (Apply when logged out, My Dashboard when signed in).
- [ ] Any integration that has no Preview env vars shows its honest unavailable state — never a fake success.

### Links and images

- [ ] Every link on the touched pages resolves — no 404s, no dead anchors.
- [ ] Images load and are not stretched or cropped wrongly.

### Regression spot-check

- [ ] Open 3–5 key **untouched** pages across **both shells** (public and gated) and confirm no unintended chrome, console or styling regression.

**Never do this:**

- Never merge on local checks alone.
- Never mark Preview "tested" without opening the URL at both viewports.
- Never wave a Preview failure through as "probably an env thing" — diagnose it or fix the env, then re-test.
- Never carry a Part 2 record forward onto a new head SHA.

---

## Independent review

- [ ] **D-SYS-1: independent review is mandatory for risky sprints** — auth, the approval gate, RLS/schema, env handling, security headers, CSP. Run it on an **immutable `merge-base..head` SHA range** (a branch name or `main..branch` is not an exact range), save the record in [`code-reviews/`](./code-reviews/), and **do not merge over a Blocking finding**. Trivial PRs are exempt.
- [ ] The prompt to hand the reviewer is [`CODEX-REVIEW-PROMPT.md`](./CODEX-REVIEW-PROMPT.md); the agent's own conduct rules are [`AGENTS.md`](../AGENTS.md).

---

## Recording the result

- [ ] Comment on the PR with **both parts**:
  - **Part 1** — the exact commands run and their results; the manual coverage that stands in for the absent suite; accessibility and performance findings; and the SYS2 gap stated plainly rather than omitted.
  - **Part 2** — Preview URL, **tested head SHA**, viewports, roles walked, flows, links, regression pages, plus a11y and performance results.
- [ ] Anything found and fixed during QA is re-tested **from the top of the affected section** — and if the fix produced a new commit, Part 2 is re-run and re-recorded against the new head.
- [ ] **Commit/push cadence — D-SYS-2.** This project does **not** use the SOP's `Commit: YES / Push: YES` tokens. It runs a standing authorization (2026-06-12) to commit and push after every gated sub-step, so the owner reviews the work live in the open PR. Deliberate deviation; the ban on pushing to `main`, merging PRs unasked, force-pushing and skipping hooks is unaffected.
- [ ] Sprint bookkeeping: tick the sprint's checklist in [`ROADMAP.md`](./ROADMAP.md), update [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) **in the same PR**, and run the [`close`](../.claude/skills/close/SKILL.md) skill for the GO / NO-GO verdict.

Next step → independent review per [`CODEX-REVIEW-PROMPT.md`](./CODEX-REVIEW-PROMPT.md), then the owner merges and runs the production checklist in [`WORKFLOW.md`](./WORKFLOW.md) §12. At launch or relaunch time, [`LAUNCH-CHECKLIST.md`](./LAUNCH-CHECKLIST.md) — which cites this sheet as "passed in full".
