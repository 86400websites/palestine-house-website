# Feature List — Palestine House — 2026-08-22

> **APPROVED by the owner, 2026-08-22** (in session: "Perfect Thanks - Approved"). Filled from [`testing-setup/templates/FEATURE-LIST-TEMPLATE.md`](./testing-setup/templates/FEATURE-LIST-TEMPLATE.md). Changes to any approved line go back to the owner — never silently edited.

Everything the site does, one plain-English line each. **Everything on this list gets tested; nothing off this list does.** Drafted by Claude Code from a full scan of the code (`src/app/` — 39 routes, both Route Handlers, every Supabase RPC the app calls, all four email flows, the redirect map in `next.config.ts`, the Ctrl/⌘+K search boundary) cross-checked against the docs; approved by the owner before any test is written.

- Source scan date: **2026-08-22** · Repo head: **`cecb0d9`** · Preview tested: *filled at the full run (Phase 3)*
- Content numbers asserted by this list: **4 sections · 22 focus areas · 88 templates** *(as of 2026-08-22; these move only when real content is added, never invented)*
- Test users — **non-production Supabase project only, obviously fake, passwords never recorded anywhere**:
  - pending partner: `e2e-pending-partner@robot-test.invalid`
  - approved partner: `e2e-approved-partner@robot-test.invalid`
  - HQ admin: `e2e-hq-admin@robot-test.invalid`
  - anonymous: no account
  - plus **one disposable robot applicant per full run**, created through the real Apply form and named so it cannot be mistaken for a person (e.g. `e2e-applicant-run<N>@robot-test.invalid`), used to prove the apply → approve/decline journey end to end
- **Owner approval: 86400studio (owner), 2026-08-22** — given in session before any test was written.

**How to read a line:** `ID | Who can do what | What proves it worked`.

**Both directions, always.** This site is two shells behind one gate (`profiles.is_approved`) and has four roles — **anonymous · pending partner · approved partner · HQ admin**. Every access line needs its allowed case *and* its denied case. A gate tested only from the inside is a gate that has not been tested. The binding statements are [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) **§15** (blocking invariants), **§8** (Route Handlers + abuse controls) and **§13** (production deployment).

**No payments.** This site has no Stripe, no checkout, no card flow and no payment surface. If a line here ever mentions money, something has gone wrong.

**Two viewports on every visual line: desktop and 320px** ([`DESIGN.md`](./DESIGN.md) §10, [`QA-CHECKLIST.md`](./QA-CHECKLIST.md)).

---

## A. Public shell — pages and content

Routes: `/` · `/model` · `/experience` · `/bring-ph` · `/our-support` · `/focus-areas` · `/about` · `/contact` · `/apply` · `/privacy` · `/terms`

| ID | Feature | Proof of PASS |
|---|---|---|
| PG-001 | Every public page loads with no errors, desktop and 320px | Page renders, zero console errors, no horizontal scroll |
| PG-002 | Every link on every public page goes somewhere real | No 404s, no dead anchors |
| PG-003 | A wrong URL shows the site's own 404 page | Branded 404, not a blank error |
| PG-004 | Header and footer are identical on every page | Shared chrome, no per-page variant |
| PG-005 | The retired workspace paths still redirect | `/plan` `/build` `/food` `/programming` `/academy` `/tools` `/live` `/elements` `/resources` each 307 → `/dashboard`, **and** the children `/live/*` `/elements/*` `/resources/*` `/academy/*` too (`next.config.ts`) |
| PG-006 | The proof numbers are consistent everywhere they appear | **4 sections · 22 focus areas · 88 templates** — same figures on every public page that states them |
| PG-007 | The single conversion works from anywhere | The green **Apply** button in the header is on every page and lands on `/apply`; "Every application is reviewed by HQ." appears with the form |
| PG-008 | The machine surfaces resolve | `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` answer; the sitemap lists only public routes; gated and auth pages are noindexed |
| PG-009 | The header knows whether you are signed in | Signed out: "Sign in"; signed in: the signed-in state — via the same-origin session probe (`/api/auth/session`), which returns only a yes/no, never identity |

## B. The approval gate — the four roles *(the most important section in this file)*

Gated platform: `/dashboard` · `/setup` · `/operate` · `/program` · `/support` · `/{section}/{topic}/guide` (×22) · `/account`
HQ admin: `/admin` (→ `/admin/approvals`) · `/admin/approvals` · `/admin/content` · `/admin/content/pages` · `/admin/content/focus-areas` · `/admin/content/files` · `/admin/content/admins`

| ID | Feature | Proof of PASS |
|---|---|---|
| AC-001 | 🔴 **An anonymous visitor cannot open any gated route, even by typing the URL** | Redirect to `/login`, **and no gated string appears in the HTML *or* the RSC payload** — the response body is checked, not just what renders. Covers all 5 platform pages, all 22 guide URLs, and `/account` |
| AC-002 | 🔴 **An anonymous visitor cannot open any `/admin/*` route** | Redirect to `/login`; no admin strings (page headings, labels, paths) in the HTML or RSC payload — all six admin pages |
| AC-003 | 🔴 **A pending partner is held at the pending state** | `/dashboard` renders the pending state; `/setup` `/operate` `/program` `/support` and every guide URL resolve **no** focus-area summary, no guide body, no template row — the gated reads return nothing |
| AC-004 | 🔴 **A pending partner's Ctrl/⌘+K search is empty** | The search index call returns zero entries; no resource ids, storage paths or bucket names anywhere in the response |
| AC-005 | **A pending partner CAN reach `/account`** | Accessible — the one deliberate exception, session-gated only, so they can set name and password while they wait; it exposes only their own profile row |
| AC-006 | 🔴 **An approved partner cannot open any `/admin/*` route** | **404** on all six — being approved is never being an admin |
| AC-007 | An approved partner reaches the whole platform | `/dashboard` and all four sections render with real content; every one of the 22 guide pages opens; no console errors, desktop + 320px |
| AC-008 | An HQ admin reaches every `/admin/*` route | `/admin` forwards to `/admin/approvals`; all six admin pages render for the admin robot |
| AC-009 | 🔴 **A gate is a throw, not an await** | Asserted through AC-001/002/003's response-body checks: a denied response carries none of the page's own strings, which is only possible when the gate short-circuits before any content is built ([`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) §15) |
| AC-010 | Login and logout work | Sign-in lands on `/dashboard`; sign-out ends the session; the same gated URL is denied again immediately after |
| AC-011 | A signed-in visitor who opens `/login` is sent onward | Straight to `/dashboard` (or their `next` destination) — no sign-in form shown to someone already in |
| AC-012 | Wrong password fails safely | Clear inline message; no session created; the message does not reveal whether the account exists |
| AC-013 | Password-reset request is safe in both directions | `/forgot-password` returns the same neutral "check your inbox" message whether or not the email has an account (no account-existence disclosure); a bad or expired recovery link at `/auth/confirm` fails to a safe page with no session |
| AC-014 | Apply = sign-up, end to end | One submission on the deployed Preview creates a pending account + a pending application (disposable robot applicant); the new account sees the pending state; the application appears in `/admin/approvals` |
| AC-015 | 🔴 **HQ approval is the only unlock** | Admin robot approves the robot applicant in `/admin/approvals` → the same account now reaches real content with no re-login; a **declined** applicant stays locked out of everything |

## C. Gated content and downloads

| ID | Feature | Proof of PASS |
|---|---|---|
| CT-001 | Each section lists its focus areas | `/setup` 5 · `/operate` 6 · `/program` 6 · `/support` 5 — 22 total, matching the numbers at the top of this file |
| CT-002 | A focus area shows exactly the private model | Summary → **one** Simple guide card (Read Now → the reader · Download Now → the file) → **Watch Video** → the templates grid. No Overview card, no checklist card, no watch-out card — those do not exist in this model |
| CT-003 | The guide reader renders every topic | All 22 `/{section}/{topic}/guide` pages open for the approved robot and show guide content |
| CT-004 | A template downloads for an approved partner | Server-issued **signed URL**; the file actually arrives (bytes, not just a link) |
| CT-005 | 🔴 A template does **not** download for a pending or anonymous caller | Denied — no signed URL is ever issued; no storage path or bucket name leaks in any response |
| CT-006 | Ctrl/⌘+K search works for an approved partner | Results span focus areas, guides and templates; choosing a result navigates to it |
| CT-007 | Draft content is invisible to partners | Admin robot sets one topic to Draft (non-production data) → it vanishes from the section page, the guide URL, and the search for the approved robot → restored to Live afterwards, and everything reappears |

## D. Forms and email

Public writes: `/apply` (server action) · `/contact` (Route Handler `/api/resend/contact`). Gated write: **Ask HQ** on `/support` (approved partners only, `submit_support_request`). Account write: `/account` (`set_my_account` + password change).

| ID | Feature | Proof of PASS |
|---|---|---|
| FM-001 | The contact form rejects bad input | Inline message; server-side zod rejection too — a request around the form is also refused |
| FM-002 | The contact form works end to end | Success state shown; **one real email reaches HQ** (unmistakably marked TEST — see the warning below); reply-to is the submitter |
| FM-003 | The apply form rejects bad input | Missing fields, bad email, short password — each gets its clear message; nothing is created |
| FM-004 | A duplicate application cannot be created | Submitting again as the same signed-in applicant lands on `/dashboard` with still exactly **one** application row; applying with an email that already has an account gets "try signing in instead" |
| FM-005 | Applying notifies both sides | The application-received pair: HQ notification + applicant confirmation (the applicant copy goes to the robot's undeliverable `.invalid` address by design) |
| FM-006 | Ask HQ works for an approved partner — and only for them | Approved robot: the request is stored and **one marked-TEST email** reaches HQ. A pending caller's write is refused by the database |
| FM-007 | `/account` works | Display name saves; password change works (sign in with the new one, robot rotates it back); a pending partner can do both |
| FM-008 | Approve/decline notifies the applicant | Approving or declining the robot applicant sends the right email variant (to the `.invalid` robot address — content asserted at the sending boundary, delivery is MN-001) |

> ⚠️ **Preview sends REAL email.** Resend is configured in Preview, so `/contact`, Apply and Ask HQ submissions from the robot deliver to the real HQ inbox (`RESEND_TO_EMAIL`). The full run sends **at most one of each**, subject-lined as a robot test, and the owner is told before every full run. Never on Production.

## E. HQ admin

| ID | Feature | Proof of PASS |
|---|---|---|
| AD-001 | `/admin/approvals` lists pending applications; approve and decline both work | Using the disposable robot applicant only (AC-014/AC-015 are the same journey) |
| AD-002 | Pages editor saves | Edit a section's text (non-production data), see it live on the platform, restore it |
| AD-003 | Focus-areas editor works | Edit a topic's summary; toggle Draft ↔ Live (CT-007); reorder; restore — all as the admin robot |
| AD-004 | Files manager works | Upload a small test document → it appears in the topic's templates grid and downloads; replace metadata; delete it; the 4 MB limit and the file-type check refuse what they should |
| AD-005 | Admin management works — and refuses the dangerous cases | Add an admin by email and remove them (fake robot only); **removing yourself is refused; removing the last admin is refused** — the refusal is the PASS |

## F. Protection and abuse controls — ⛔ **partly NOT TESTABLE UNTIL SYS1.5**

> 🔴 `/apply`, `/contact` and Ask HQ are live **today without rate limiting and without Turnstile** — [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §7 #1, scheduled as sprint **SYS1.5** (D-SYS-9, re-ordered after SYS2 by **D-SYS-11**). **No test asserts a 429 or a CAPTCHA until SYS1.5 has merged, and no test hammers a form.** The lines below are written now so they are not forgotten; they activate when SYS1.5 lands.

| ID | Feature | Proof of PASS | State |
|---|---|---|---|
| PR-001 | Hammering login with wrong passwords gets blocked | Being blocked is the PASS | **pending SYS1.5** |
| PR-002 | Rapid-fire submissions to a public form get rejected | Rate limit rejects | **pending SYS1.5** |
| PR-003 | Submitting a public form without the human-check token is rejected | Server-side rejection, fail closed in Production | **pending SYS1.5** |
| PR-004 | Security headers are present and correct | All six headers from `next.config.ts` (CSP · HSTS · X-Frame-Options · X-Content-Type-Options · Referrer-Policy · Permissions-Policy); CSP's only third-party allowance is the YouTube embed origin. Asserted against the config's shape, **never** a frozen literal — D-SYS-10 adds the Sentry origin at SYS3 and this line must not fail that day | **live** |

## G. Integrations and everything else

| ID | Feature | Proof of PASS |
|---|---|---|
| IN-001 | The session probe reveals nothing | `/api/auth/session` returns only `{ authed: true/false }` for the caller's own session — no identity, no email, ever |
| IN-002 | Mailchimp stays a clean no-op | Dormant by owner decision (E1) — no signup path calls it; nothing errors because it is absent |

## H. Manual checks *(real but not robot-testable — still on the list, still need evidence)*

| ID | Feature | How a human verifies |
|---|---|---|
| MN-001 | The four email flows render correctly in a real inbox | 👤 Owner, once: the marked-TEST contact, application-received, approval and Ask HQ emails from the full run — open each in the HQ inbox, confirm sender, subject and body read right |
| MN-002 | The one real submission on the live domain | 👤 Owner, by hand, per [`LAUNCH-CHECKLIST.md`](./LAUNCH-CHECKLIST.md) Phase 3. Never automated, never on Production by a robot |
| MN-003 | The password-reset email link walk | 👤 Owner, once, with a real inbox they control: request a reset, click the link, set a new password, sign in. (The robot proves the safe-failure half in AC-013; the happy path needs a deliverable inbox, which the robots deliberately lack) |

---

## Cross-check findings (docs vs code)

- **Promised in the docs but missing in the code:** none newly discovered. Everything absent is absent by a recorded decision: Mailchimp dormant (E1, 2026-07-09) · Upstash/Turnstile → SYS1.5 (D-SYS-9/D-SYS-11) · Sentry/PostHog → SYS3 · the booklet lead-magnet UI removed at DR1-8 (its two PDFs remain the only public Storage files).
- **Found in the code but not prominent in the docs:** `/api/auth/session` (the header's yes/no session probe) and the `/auth/confirm` token handler — both internal plumbing, both on this list (IN-001, AC-013).
- **Known issues already logged, not re-discovered here:** §7 #1 (abuse controls — section F), §7 #4 (`.docx` upload refusal, self-diagnosing — AD-004 will exercise that path), §7 #5 (`/privacy` wording over-claims retention — a **copy** defect awaiting owner wording, natural home SYS1.5; PG-001 tests that the page renders, not that its words are true).

## Public-repo rule

🔴 This repository is **public**. Nothing in this file may contain a real person's name or email, a real partner or applicant identity, an account id, a project ref, a credential, a dashboard URL carrying an id, gated content, or a Storage object path. The only addresses here are the robots' undeliverable `.invalid` ones.

## Change log

Approved lines are never silently edited. Every later addition or change: `[DATE — ID — what changed — re-approved by]`.
