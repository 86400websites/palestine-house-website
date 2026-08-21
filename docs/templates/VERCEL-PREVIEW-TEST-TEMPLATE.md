# Deployed Preview Test Record — PR #[PR_NUMBER]

> **Copy this file, fill it in, link it in the PR.** Mandatory before independent review and before merge ([`QA-CHECKLIST.md`](../QA-CHECKLIST.md) Part 2). Test the **Vercel Preview** the PR deploys — never localhost. Local green proves the code compiles; only the Preview proves the build production will get.
>
> Leave the `[BRACKETED]` fields as brackets until you actually have the value. An unfilled bracket is an honest "not done"; a guessed value is a false record.

**The head-SHA rule.** This record is valid **only** for the head SHA it names. Any new commit — code, config, or SQL — creates a new head and voids it. Re-run the walk and write a fresh record. Approval never carries forward (**D-SYS-1**, [`PROJECT-STATUS.md`](../PROJECT-STATUS.md) §4). This matters more here than on most projects because of **D-SYS-2**: this repo has no "Commit: YES / Push: YES" gate — a standing owner authorization (2026-06-12) means Claude commits **and pushes** after every gated sub-step, so the head moves on its own while the owner reviews in the open PR. Check the SHA at the top of the PR against the SHA in this file before you trust it.

---

## 1. Test session

| Field | Value |
|---|---|
| PR | #[PR_NUMBER] — [PR_TITLE] |
| Sprint | [SPRINT_ID] |
| Branch | `[BRANCH_NAME]` — with its type prefix, per [`WORKFLOW.md`](../WORKFLOW.md) §4 (`claude/…` for Claude Code work) |
| Environment | Vercel **Preview** (non-production Supabase project) |
| Preview URL | [PREVIEW_URL] |
| **Tested head SHA** | `[HEAD_SHA]` (full 40 chars — `git rev-parse HEAD`) |
| Date | [YYYY-MM-DD] |
| Tester | [OWNER / CLAUDE / BOTH — say which half each did] |
| Pass type | [FULL DESKTOP PASS / MOBILE SMOKE SUBSET] |

**Full pass vs mobile smoke — be honest.** A full pass needs a desktop browser with devtools (console, 320px viewport, role switching). A look from a phone is a **mobile smoke subset**: pages load, the primary flow completes, nothing is obviously broken. A change touching **auth, the approval gate, the shared header/footer, or the Apply conversion** requires the full desktop pass and cannot be signed off from mobile ([`QA-CHECKLIST.md`](../QA-CHECKLIST.md) Part 2).

### Diff scope — which sections of this record apply

Tick what the diff touches; untouched sections may be marked N/A **with the reason**, not deleted.

- [ ] Public shell pages → §3, §4.1
- [ ] Auth (login / forgot / update password / Apply sign-up) → §4, §6
- [ ] Approval gate, a platform RPC, or `/admin/*` → §4 **in full** (all four roles)
- [ ] A form or a server action → §6
- [ ] SQL / RLS → §7
- [ ] Shared chrome (header, footer, nav) → §4.1 **and** §8 on both shells

---

## 2. The binding checklist

[`WORKFLOW.md`](../WORKFLOW.md) **§11 (Vercel Preview checklist)** is the binding list. Open it, work it, and tick it there — this record does **not** restate it in different words, because two lists that drift are worse than one.

- [ ] All boxes in [`WORKFLOW.md`](../WORKFLOW.md) §11 are ticked for this head SHA.
- [ ] The fuller Part 2 walk in [`QA-CHECKLIST.md`](../QA-CHECKLIST.md) was worked alongside it.

Everything below §2 is the **record of what was actually clicked** — the evidence §11 asks for, in a form that can be filed and audited.

---

## 3. Touched pages

One row per page this PR touches. Both viewports every time: **desktop** and **320px** — 320 is a hard floor ([`DESIGN.md`](../DESIGN.md) §10: no horizontal scroll, single column, tap targets ≥44×44px). Result: PASS / FAIL / N/A.

| Route | Desktop | 320px | Result | Notes |
|---|---|---|---|---|
| `[ROUTE_1]` | [ ] | [ ] | | |
| `[ROUTE_2]` | [ ] | [ ] | | |
| `[ROUTE_3 — add a row per touched page]` | [ ] | [ ] | | |

- [ ] Layout, images and interactions correct at both widths; no layout shift, no broken images.
- [ ] Judged against the approved mockup and [`DESIGN.md`](../DESIGN.md) §0 (the non-negotiable), §10 (responsive), §11 (accessibility). "It renders" is not the bar.
  - ⚠️ The mockups live in `docs/page-designs/`, which is **gitignored — OneDrive is canon**. A fresh clone does not contain them. If you judged a page without the mockup on disk, say so here: [MOCKUP AVAILABLE / JUDGED WITHOUT MOCKUP]

---

## 4. Role walk — the approval gate

**This is the section that matters most on this project.** Palestine House is two shells behind one gate, and the gate is the core invariant ([`SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) §15, [`CLAUDE.md`](../../CLAUDE.md) access rules). Walk it by **role**, not by page.

> ⚠️ **The standing credential constraint** ([`BROWSER-TOOLS.md`](../BROWSER-TOOLS.md) §4). The owner works from a fresh clone per sprint, and a fresh clone has no `.env.local` — so **assume no signed-in walkthrough runs from a bare checkout** unless the owner has authorised a credential path **for this run**. That authorisation is his to give, per run: ask, and treat it as absent until granted. Without it, §4.2–§4.4 are **the owner's to do on his own Preview walkthrough**, and Claude fills in only §4.1 (anonymous). Never present an unproven half as verified — PP8 is the recorded example: the *disappearance* of hardcoded admin strings was provable without a session, but *an actual admin still sees the hub* was not, and had to be re-tested later.
>
> Credentials, when authorised, are for the **non-production** project only, and env vars are referred to **by name** — never open, read or quote `.env.local` ([`ENV-VARS-SAFETY.md`](../ENV-VARS-SAFETY.md)).

**Who ran which half:** anonymous = [CLAUDE / OWNER] · signed-in = [OWNER / CLAUDE WITH AUTHORISED CREDENTIAL PATH / NOT RUN — reason]

### 4.1 Anonymous (no session)

| Check | Desktop | 320px | Result | Notes |
|---|---|---|---|---|
| Public shell loads: `/`, `/model`, `/experience`, `/bring-ph`, `/our-support`, `/focus-areas`, `/about`, `/contact`, `/apply` | [ ] | [ ] | | |
| Legal + auth pages load: `/privacy`, `/terms`, `/login`, `/forgot-password`, `/update-password` | [ ] | [ ] | | |
| Gated routes redirect to `/login`: `/dashboard`, `/setup`, `/operate`, `/program`, `/support`, `/{section}/{topic}/guide`, `/account` | [ ] | [ ] | | |
| `/admin/*` redirects to `/login`: `/admin`, `/admin/approvals`, `/admin/content` (+ `pages`, `focus-areas`, `files`, `admins`) | [ ] | [ ] | | |
| 🔴 **Gate probe:** none of those pages' own strings appear in the HTML **or the RSC payload** | [ ] | — | | View source *and* the flight data, not just the rendered result |
| Retired routes still 307 to `/dashboard` — **and their children**: `/live/…`, `/elements/…`, `/resources/…`, `/academy/…` (those four only) | [ ] | — | | Probe a child path, not just the parent |

> **Why the RSC row exists.** PP8 found an anonymous `GET /admin/content` returning 200 with all four hub labels and paths in both the HTML and the RSC payload. A gate is a **throw, not an await** — a page must `redirect()`/`notFound()` **before it constructs any JSX**; awaiting data does not stop the segment streaming ahead of its layout ([`SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) §15). Source review does not catch this; a browser does.

### 4.2 Pending partner (signed in, `is_approved = false`)

| Check | Desktop | 320px | Result | Notes |
|---|---|---|---|---|
| `/dashboard` renders the **pending state** | [ ] | [ ] | | |
| Toolkit sections resolve no content — no topic summary, no guide body, no template row | [ ] | [ ] | | |
| Guide reader `/{section}/{topic}/guide` resolves nothing | [ ] | [ ] | | |
| 🔴 Ctrl/⌘+K search index is **empty** (D-PP-j) — and carries no resource ids, storage paths or bucket names | [ ] | — | | |
| `/account` **is accessible** — the one deliberate session-only exception; name + password can be set | [ ] | [ ] | | Exposes nothing but the caller's own `profiles` row |
| `/admin/*` → not an admin | [ ] | — | | |

### 4.3 Approved partner (`is_approved = true`)

| Check | Desktop | 320px | Result | Notes |
|---|---|---|---|---|
| `/dashboard` renders the About landing | [ ] | [ ] | | |
| All four toolkit sections render: `/setup`, `/operate`, `/program`, `/support` | [ ] | [ ] | | 4 sections · 22 focus areas · 88 templates |
| A focus area shows summary → one Simple guide card → Watch Video → templates grid | [ ] | [ ] | | No Overview card, no per-topic checklist card, no watch-out card |
| Guide reader opens (Read Now) at `/{section}/{topic}/guide` | [ ] | [ ] | | |
| 🔴 Template download works via a **server-issued signed URL** (Download Now) | [ ] | — | | ⚠️ Downloads land in `.playwright-mcp/` — **gated partner content, never commit it** |
| Ctrl/⌘+K search spans focus areas, guides and templates | [ ] | — | | |
| Ask HQ submits (emails HQ — no ticket is opened) | [ ] | [ ] | | See §6 before submitting: Preview sends **real** email |
| `/account` accessible | [ ] | [ ] | | |
| `/admin/*` → **404** (`is_approved` alone is never admin) | [ ] | — | | |

### 4.4 HQ admin (in the `admins` table)

| Check | Desktop | 320px | Result | Notes |
|---|---|---|---|---|
| `/admin` and `/admin/approvals` render | [ ] | [ ] | | ⚠️ Shows applicant emails — **never screenshot**; redact or skip |
| `/admin/content` hub + `pages`, `focus-areas`, `files`, `admins` render | [ ] | [ ] | | |
| Public + gated shells still fully accessible | [ ] | [ ] | | |
| Any admin write this PR touches behaves and reflects back | [ ] | — | | Non-production database only |

---

## 5. Apply — the primary conversion

The site's single public conversion and its **only** account-creation door.

- [ ] Public page → `/apply` → submit → pending account + application created → lands on the `/dashboard` pending state. Desktop [ ] · 320px [ ]
- [ ] The header's Apply CTA behaves per session state (Apply when logged out, My Dashboard when signed in).
- [ ] The green Apply button and its supporting line are the approved copy, unaltered.

Outcome: [PASS / FAIL — what broke]

---

## 6. Forms and integrations

Only the ones this PR touches. Preview points at the **non-production** Supabase project — confirm you are on a Preview URL before typing into anything ([`PROJECT-STATUS.md`](../PROJECT-STATUS.md) §6).

| Form | Success path | Error states | Result | Notes |
|---|---|---|---|---|
| `/apply` (apply = sign-up) | [ ] | [ ] | | Invalid input + empty required fields give friendly errors, nothing silently dropped |
| `/contact` | [ ] | [ ] | | ⚠️ see the email warning below |
| `/login` · `/forgot-password` · `/update-password` | [ ] | [ ] | | Only if auth changed |
| Gated Ask HQ | [ ] | [ ] | | ⚠️ see the email warning below |
| `/account` (name, password) | [ ] | [ ] | | |
| `/admin/*` writes | [ ] | [ ] | | |

- [ ] 🔴 **A Preview contact submit sends a REAL email.** `RESEND_*` is set in Preview as well as Production. Mark test submissions unmistakably as tests, keep them few, and tell the owner they are coming.
- [ ] Any integration with no Preview env vars shows its **honest unavailable state** — never a fake success.
- [ ] 🔴 **Never bypass an abuse control.** ⚠️ **Today there is nothing to bypass, and that is a known issue, not a licence** — Upstash rate limiting and Turnstile are **not shipped** (**D-SYS-9**; sprint SYS1.5), so public writes are currently unthrottled ([`PROJECT-STATUS.md`](../PROJECT-STATUS.md) §7 #1). Do not loop, do not hammer `/apply` or `/contact`, and **never record these controls as verified**. When SYS1.5 ships, verifying the `429` / challenge becomes a required row here.
- [ ] 🔴 No real credentials, live keys, applicant details or partner PII typed into any form, URL or prompt. Test data only.

**Auth-only rows** (skip unless the diff touches auth):

- [ ] Auth email links resolve to the **Preview** origin, never Production, and Preview's `NEXT_PUBLIC_SITE_URL` is not the Production URL ([`WORKFLOW.md`](../WORKFLOW.md) §11, §14).
- [ ] Redirect targets stay same-origin ([`SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) §6).

---

## 7. Database changes (only if the diff carries SQL)

- [ ] Up-SQL, matching `.down.sql` and RLS policies are all in the PR.
- [ ] Applied **by hand in the Supabase SQL Editor to the non-production project first**, and tested there before this Preview pass ([`WORKFLOW.md`](../WORKFLOW.md) §14).
- [ ] This Preview was tested against the non-production project. Production is **read-only from here** through every channel, MCP included ([`SUPABASE-MCP-SAFETY.md`](../SUPABASE-MCP-SAFETY.md)).
- [ ] Change is backwards-compatible, or the `.down.sql` is rehearsed — a Vercel rollback restores code, **not** the database ([`WORKFLOW.md`](../WORKFLOW.md) §13, [`ROLLBACK.md`](../ROLLBACK.md)).

Migration(s) in this PR: [NUMBER(S) or N/A]

---

## 8. Console, CSP and regression

- [ ] **Zero console errors and zero hydration warnings** on every page walked above, at both viewports.
- [ ] No CSP violations. Today `next.config.ts` ships `connect-src 'self'` with exactly one third-party extension — `frame-src https://www.youtube-nocookie.com` (decision D1). **A violation for any other origin is a real finding.** *(The Sentry ingest origin is added in SYS3 — **D-SYS-10** — so do not pre-emptively treat one as expected.)*
- [ ] Security headers present on the Preview response (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- [ ] Every link on the touched pages resolves — no 404s, no dead anchors.

**Regression spot-check** — 3–5 key **untouched** pages, across **both shells**:

| Untouched page | Desktop | 320px | Result | Notes |
|---|---|---|---|---|
| `[UNTOUCHED_PUBLIC_PAGE]` | [ ] | [ ] | | Should be unchanged |
| `[UNTOUCHED_GATED_PAGE]` | [ ] | [ ] | | Should be unchanged |
| `[UNTOUCHED_PAGE_3]` | [ ] | [ ] | | Optional third page |

- [ ] Shared chrome is identical across pages — the header and footer are the same on every page, and there are no per-page variants.

---

## 9. Evidence

- [ ] **UI sprints:** every touched page captured at **320 / 768 / 1440** on the deployed Preview, plus applicable states (default, hover/focus-visible, loading, empty, error), using [`BROWSER-TOOLS.md`](../BROWSER-TOOLS.md) — the [`browser-qa`](../../.claude/skills/browser-qa/SKILL.md) skill runs this.
- [ ] Filenames `<SPRINT_ID>-<page>-<viewport>-<state>.png`; attached or linked in the PR beside this record.
- [ ] 🔴 **Nothing committed.** No screenshot binaries, no `.playwright-mcp/` — it collects downloaded gated templates as well as snapshots. `.gitignore` covers `*-1440.png`, `*-768.png` and `*-320.png`, so all three standard widths are ignored by default; a capture named anything else needs an already-ignored location, or extend the rule in the same PR.
- [ ] 🔴 No capture contains applicant emails or partner PII.
- [ ] `git status` clean of verification scratch — a browser run mutates the working tree, which is why files are staged explicitly and never with `git add -A` ([`WORKFLOW.md`](../WORKFLOW.md) §6).

Evidence location: [PATH OR PR LINK — gitignored/scratch only]

---

## 10. Findings

| # | Severity | Where | What happened | Status |
|---|---|---|---|---|
| 1 | [BLOCKING / SHOULD-FIX] | `[ROUTE]` @ [VIEWPORT/ROLE] | [WHAT IS WRONG, AND WHICH RULE IT BREAKS] | [OPEN / FIXED IN [SHA]] |
| 2 | | | | |

Severity uses this repo's existing review scale — **Blocking** or **Should-fix** ([`CODEX-REVIEW-PROMPT.md`](../CODEX-REVIEW-PROMPT.md)); do not invent a third scale. Any failure of an [`AGENTS.md`](../../AGENTS.md) Palestine House gating check is Blocking by definition. Adding the `AGENTS.md` Critical / High / Medium / Low label as well is fine; the Blocking call is the one the merge decision reads.

Record **PASS or the exact gaps** — file : element, what is wrong, which rule it breaks.

---

## 11. Verdict

**Verdict:** [PASS → ready for independent review / FAIL → fix and retest]

- **On FAIL:** fix on the same branch, wait for the new Preview, and run this record again from the top. Under the standing authorization (**D-SYS-2**) the fix is committed and pushed as it is made — which **changes the head SHA and voids this record**. Never merge on a FAIL, and never carry a record forward onto a new head.
- **A PASS is necessary but not sufficient.** Merge also requires: CI green (workflow **`CI`**, job **`verify`** — `pnpm run typecheck`, `pnpm run lint`, `pnpm run build`, plus the gitleaks secret scan) and, for a **risky** sprint — auth · approval gate · RLS/schema · env · security headers · CSP — an independent review against the immutable `merge-base..head` range with **no Blocking finding standing** (**D-SYS-1**). Trivial PRs are exempt from the review, not from this record.
- **Automated tests:** none — **SYS2 (no suite yet)**. `package.json` defines exactly `dev`, `build`, `start`, `lint`, `typecheck`. Do not describe this repo as having a test suite, and never present this walk as one.

**Filed at:** paste into the PR, and for a risky sprint save a copy at `docs/code-reviews/[SPRINT_ID]-[SLUG]-preview-test.md` so the review record can cite it. Close-out §8 asks the **owner** to confirm the Preview was tested ([`.claude/skills/close/SKILL.md`](../../.claude/skills/close/SKILL.md)) — this record is what that confirmation rests on.

**Signed:** [NAME/ROLE] · **for head SHA** `[HEAD_SHA]`

---

**What SYS2 changes.** The Playwright launch gate (`tests/e2e/`, a real `test` script, `docs/test-reports/`) will replace most of the mechanical rows above — route loads, redirects, form validation, the role matrix — with a suite that runs on every build. **This form stays** for the judgment the robot cannot make: does the page look like a serious cultural institution, does the mockup match, is the copy the approved copy, does the 320px layout actually read. A browser pass proves *this build, this moment*; a suite proves *every build after it*. Neither replaces the other.

Next step → hand the independent reviewer the immutable `merge-base..head` range and **this tested head SHA**. After a clean review, the owner merges and smoke-tests Production ([`WORKFLOW.md`](../WORKFLOW.md) §12).
