# Feature List — Palestine House — [DATE]

> **This is a SKELETON. The `[BRACKETS]` stay brackets in this file, forever.** Copy it out to `docs/FEATURE-LIST.md`, fill the copy, leave this original alone — same rule as [`docs/templates/`](../../templates/README.md).
>
> ⛔ **Installed at SYS1 · filled and used in SYS2.** There is no test runner in this repo today — `package.json` defines exactly five scripts (`dev`, `build`, `start`, `lint`, `typecheck`), and there is no `tests/e2e/`. `docs/FEATURE-LIST.md` **arrives in SYS2**.

Everything the site does, one plain-English line each. **Everything on this list gets tested; nothing off this list does.** Drafted by Claude Code from a full scan of the code (`src/app/`, Route Handlers, Supabase RPCs and RLS policies, email triggers) cross-checked against the docs; approved by the owner before any test is written.

- Source scan date: **[DATE]** · Repo head: **[SHA]** · Preview tested: **[PREVIEW_URL]**
- Content numbers asserted by this list: **[N] sections · [N] focus areas · [N] templates** *(as of [DATE] — today's truth is 4 · 22 · 88; these move only when real content is added, never invented)*
- Test users — **non-production Supabase project only, obviously fake, passwords never recorded anywhere**:
  - pending partner: `[pending-robot@example.invalid]`
  - approved partner: `[approved-robot@example.invalid]`
  - HQ admin: `[admin-robot@example.invalid]`
  - anonymous: no account
- **Owner approval: [NAME], [DATE]** ← no tests are written until this line is filled.

**How to read a line:** `ID | Who can do what | What proves it worked`.

**Both directions, always.** This site is two shells behind one gate (`profiles.is_approved`) and has four roles — **anonymous · pending partner · approved partner · HQ admin**. Every access line needs its allowed case *and* its denied case. A gate tested only from the inside is a gate that has not been tested. The binding statements are [`SECURITY-CHECKLIST.md`](../../SECURITY-CHECKLIST.md) **§15** (blocking invariants), **§8** (Route Handlers + abuse controls) and **§13** (production deployment) — read them, do not paraphrase them.

**No payments.** This site has no Stripe, no checkout, no card flow and no payment surface. The source SOP's payment section was deleted, not marked N/A. If a line here ever mentions money, something has gone wrong.

**Two viewports on every visual line: desktop and 320px** ([`DESIGN.md`](../../DESIGN.md) §10, [`QA-CHECKLIST.md`](../../QA-CHECKLIST.md)).

---

## A. Public shell — pages and content

Routes: `/` · `/model` · `/experience` · `/bring-ph` · `/our-support` · `/focus-areas` · `/about` · `/contact` · `/apply` · `/privacy` · `/terms`

| ID | Feature | Proof of PASS |
|---|---|---|
| PG-001 | Every public page loads with no errors, desktop and 320px | Page renders, zero console errors, no horizontal scroll |
| PG-002 | Every link on every public page goes somewhere real | No 404s, no dead anchors |
| PG-003 | A wrong URL shows the site's own 404 page | Branded 404, not a blank error |
| PG-004 | Header and footer are identical on every page | Shared chrome, no per-page variant |
| PG-005 | The retired workspace paths still redirect | `[list the retired paths and their 307 target — verify against next.config.ts, parents AND children]` |
| PG-006 | The proof numbers are consistent everywhere they appear | `[N sections · N focus areas · N templates — same figures on every page that states them]` |
| PG-0xx | `[Page-specific content promise — e.g. "the Apply CTA appears once on [PAGE] and points at /apply"]` | `[Visible proof]` |

## B. The approval gate — the four roles *(the most important section in this file)*

Gated platform: `/dashboard` · `/setup` · `/operate` · `/program` · `/support` · `/{section}/{topic}/guide` · `/account`
HQ admin: `/admin` · `/admin/approvals` · `/admin/content` · `/admin/content/pages` · `/admin/content/focus-areas` · `/admin/content/files` · `/admin/content/admins`

| ID | Feature | Proof of PASS |
|---|---|---|
| AC-001 | 🔴 **An anonymous visitor cannot open any gated route, even by typing the URL** | Redirect to `/login`. **And no gated string appears in the HTML *or* the RSC payload** — check the response body, not just what renders |
| AC-002 | 🔴 **An anonymous visitor cannot open any `/admin/*` route** | `[Redirect / 404 — record which, per route]`; no admin strings in the payload |
| AC-003 | 🔴 **A pending partner is held at the pending state** | `/dashboard` renders the pending state. No guide body, no topic summary, no template row resolves anywhere |
| AC-004 | 🔴 **A pending partner's Ctrl/⌘+K search index is empty** | Zero results; no resource ids, storage paths or bucket names anywhere in the response |
| AC-005 | **A pending partner CAN reach `/account`** | Accessible — the one deliberate exception, session-gated only, so they can set name and password while they wait. Exposes only their own `profiles` row |
| AC-006 | 🔴 **An approved partner cannot open any `/admin/*` route** | **404** — being approved is never being an admin |
| AC-007 | An approved partner reaches the whole platform | `[Sections, focus areas, guide reader, templates — all resolve]` |
| AC-008 | An HQ admin reaches `/admin/*` | `[Each admin route renders for an admin]` |
| AC-009 | A gate short-circuits before rendering | 🔴 **A gate is a throw, not an await** — a gated page must not construct any JSX before denying. `[How this is asserted]` |
| AC-010 | Login and logout work | Lands on `[route]`; session ends on logout; the gated route is denied again afterwards |
| AC-011 | Password reset works end to end | The reset link resolves to **this environment's** origin, never Production `[capture method]` |
| AC-012 | Sign-up = Apply | `[A submission creates a pending profile + an application row and appears in /admin/approvals]` |
| AC-013 | HQ approval unlocks the platform | `[Approve in /admin/approvals → the same account now resolves gated content; decline → it does not]` |
| AC-0xx | `[One allowed + one denied line per remaining role boundary]` | |

## C. Gated content and downloads

| ID | Feature | Proof of PASS |
|---|---|---|
| CT-001 | Each section lists its focus areas | `[Counts match the numbers asserted at the top of this file]` |
| CT-002 | A focus area shows summary → one guide card → Watch Video → templates grid | `[No Overview card, no per-topic checklist card, no watch-out card — those do not exist in this model]` |
| CT-003 | The guide reader renders every topic | `[All topics open; content renders; deep links to #topic-slug land correctly]` |
| CT-004 | A template downloads for an approved partner | Server-issued **signed URL**; the file arrives; `[TTL behaviour]` |
| CT-005 | 🔴 A template does **not** download for a pending or anonymous caller | Denied. No signed URL is ever issued, no storage path or bucket name leaks |
| CT-006 | Ctrl/⌘+K search spans focus areas, guides and templates for an approved partner | `[Results resolve and navigate]` |
| CT-007 | Unpublished / draft content is invisible | 🔴 Invisible **for rows and for bytes** — not in the list, not fetchable by id |
| CT-0xx | `[Other gated-content promise]` | `[Observable proof]` |

## D. Forms and email

Public writes: `/apply`, `/contact` (Route Handler `src/app/api/resend/contact`). Gated write: the Ask HQ form on `/support` (approved partners only).

| ID | Feature | Proof of PASS |
|---|---|---|
| FM-001 | `[Form name]` rejects bad input with a clear message | Inline error, no submission, zod rejection server-side too |
| FM-002 | `[Form name]` valid submission works end to end | Success state + the record it should create exists `[where]` |
| FM-003 | `[Triggered email]` is sent with the right content and links | `[Capture method]` |
| FM-004 | A double-submit does not create two records | One record `[how asserted]` |

> ⚠️ **Preview sends REAL email.** `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `RESEND_TO_EMAIL` are configured in **both** Production and Preview, so a Preview `/contact` or Ask HQ submission lands in a real inbox ([`BROWSER-TOOLS.md`](../../BROWSER-TOOLS.md) §6). Mark robot submissions unmistakably as tests, keep them few, and tell the owner before the run. Never submit anything on Production.

## E. HQ admin

| ID | Feature | Proof of PASS |
|---|---|---|
| AD-001 | `/admin/approvals` lists pending applications and approve/decline works | `[Proof — using the fake pending account only]` |
| AD-002 | The content CMS saves without publishing | `[Save never silently publishes; publishing is a deliberate separate action]` |
| AD-003 | Admin management refuses to remove yourself or the last admin | `[Refusal is the PASS]` |
| AD-0xx | `[Other admin flow]` | `[Proof]` |

## F. Protection and abuse controls — ⛔ **NOT TESTABLE UNTIL SYS1.5**

> 🔴 **Read this before writing a single line here.** `/apply`, `/contact` and the Ask HQ write are live **today without rate limiting (Upstash) and without Turnstile** — [`PROJECT-STATUS.md`](../../PROJECT-STATUS.md) §7 issue **#1**, open since S3c, the oldest debt in the project. **Hammering a form today gets you through, not blocked.**
>
> **Do not write a test that expects a 429 or a CAPTCHA challenge, and do not let any report claim one.** A test asserting a control that does not exist either fails forever or, far worse, is quietly rewritten until it passes and then reports safety that is not there.
>
> These controls arrive in **SYS1.5** (**D-SYS-9**), which runs *before* SYS2 precisely so the suite is written against final-form behavior. Write the lines below now; mark them **pending SYS1.5**; test them once SYS1.5 has merged. Requirements: [`SECURITY-CHECKLIST.md`](../../SECURITY-CHECKLIST.md) **§8** and **§15** — *(the source SOP cites "§5" for this; in this repo §5 is Row Level Security. The public-write and abuse-control rules are §8, §13 and §15.)*

| ID | Feature | Proof of PASS | State |
|---|---|---|---|
| PR-001 | Hammering login with wrong passwords gets blocked | **Being blocked is the PASS** — `[assertion]` | `[pending SYS1.5 / live]` |
| PR-002 | Rapid-fire submissions to `[public form]` get rejected | Rate limit rejects | **pending SYS1.5** |
| PR-003 | Submitting `[form]` without the human-check token is rejected | Server-side rejection, fail closed in Production | **pending SYS1.5** |
| PR-004 | Security headers are present and correct | `[CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy — assert against next.config.ts, never against a frozen literal string]` | live |

> ℹ️ **The CSP is already spoken for, and PR-004 must not reopen it.** **D-SYS-10 is decided**: SYS3 adds the Sentry ingest origin to `connect-src` when error tracking is switched on ([`ROADMAP.md`](../../ROADMAP.md) §A and the SYS3 row). Until then the only third-party extension is `frame-src https://www.youtube-nocookie.com` (D1). So assert the headers against `next.config.ts` as it stands at run time — a test pinned to today's exact CSP string is a test that fails the day SYS3 merges, for no defect.

## G. Integrations and everything else

| ID | Feature | Proof of PASS |
|---|---|---|
| IN-0xx | `[Integration — each no-ops when its env vars are absent; assert the no-op too]` | `[Observable proof, test hooks only, names never values]` |

## H. Manual checks *(real but not robot-testable — still on the list, still need evidence)*

| ID | Feature | How a human verifies |
|---|---|---|
| MN-001 | `[e.g. the approval email renders correctly in a real client]` | `[Exact steps + evidence]` |
| MN-002 | The one real submission on the live domain | 👤 Owner, by hand, per [`LAUNCH-CHECKLIST.md`](../../LAUNCH-CHECKLIST.md) Phase 3. **Never automated, never on Production by a robot** |
| MN-0xx | `[Anything requiring human judgement — visual fidelity against the mockups, tone, a11y feel]` | `[Steps + evidence]` |

---

## Cross-check findings (docs vs code)

- **Promised in the docs but missing in the code:** `[none / list — each is a finding before any test runs]`
- **Found in the code but not in the docs:** `[none / list — included above, marked "(found in code, not in docs)"]`
- **Known issues already logged, not re-discovered here:** `[reference PROJECT-STATUS.md §7 by number — do not restate the detail]`

## Public-repo rule

🔴 This repository is **public**. Nothing in the filled copy may contain a real person's name or email, a real partner or applicant identity, an account id, a Supabase project ref, a credential, a dashboard URL carrying an id, gated content, or a Storage object path. Where a person or account is needed, use an obviously-fake placeholder or leave a labelled owner-fill blank.

## Change log

Approved lines are never silently edited. Every later addition or change: `[DATE — ID — what changed — re-approved by]`.
