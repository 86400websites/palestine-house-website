# Feature List — Palestine House — 2026-08-22

> **APPROVED by the owner, 2026-08-22** (in session: "Perfect Thanks - Approved"). Filled from [`testing-setup/templates/FEATURE-LIST-TEMPLATE.md`](./testing-setup/templates/FEATURE-LIST-TEMPLATE.md). Changes to any approved line go back to the owner — never silently edited.
>
> **Changed for CR1. The owner handed the re-approval over on 2026-10-31 ("fix all yourselves and dont depend on me"), so these changes stand on the engine's acceptance, recorded at `PROJECT-STATUS` §5 D-CR1-3, and stay the owner's to overrule.** The content refresh changed what these lines describe, so the lines changed with it: the numbers, `/terms` removed, `/privacy` replaced, the public call to action, the form labels, the pending and declined wording, the focus-area panel, Ask HQ replaced by Community Contacts, and the email notes. PG-010, PG-011 and CT-008 to CT-011 are new, for what CR1 added. Every id is kept, every change is in the [change log](#change-log), and all of it is flagged for the owner's re-approval. **Nothing in this CR1 version has been run against a Preview yet.** The CR1 lines also assume the CR1 content is loaded on the non-production project the Preview reads.

Everything the site does, one plain-English line each. **Everything on this list gets tested, apart from clauses marked *not robot-tested*; nothing off this list does.** Drafted by Claude Code from a full scan of the code (`src/app/` — 39 routes, both Route Handlers, every Supabase RPC the app calls, all four email flows, the redirect map in `next.config.ts`, the Ctrl/⌘+K search boundary) cross-checked against the docs; approved by the owner before any test is written. *(Those figures are that scan's. CR1 has since removed `/terms` and the Ask HQ email flow.)*

- Source scan date: **2026-08-22** · Repo head: **`cecb0d9`** (site code; tests on `claude/sprint-sys2-launch-gate-run`) · Preview tested: the branch's deployed Preview, 2026-08-22 — **FULL run 98/98 green**, report: [`test-reports/2026-08-22-test-report.md`](./test-reports/2026-08-22-test-report.md). *That run predates CR1 and proves none of what CR1 changed.*
- Content numbers asserted by this list: **4 sections · 22 focus areas · 83 templates and practical tools** *(83 since CR1, 88 before it; these move only when real content is added, never invented. The private library holds 127 learner files in all, which are not all templates: 22 Overviews, 22 Simple Guides and the 83.)*
- Test users — **non-production Supabase project only, obviously fake, passwords never recorded anywhere**:
  - pending partner: `e2e-pending-partner@robot-test.invalid`
  - approved partner: `e2e-approved-partner@robot-test.invalid`
  - HQ admin: `e2e-hq-admin@robot-test.invalid`
  - anonymous: no account
  - plus **two disposable robot applicants per full run** — one per decision branch, because a decision is final in the approvals UI (Approve/Decline render only while an application is pending, by design). Created through the real Apply form and named so they cannot be mistaken for people (`e2e-applicant-{decline,approve}-<runId>@robot-test.invalid`), used to prove the apply → decline-holds and apply → approve-unlocks journeys end to end. *(Corrected 2026-08-22 — see the change log.)*
- **Owner approval: 86400studio (owner), 2026-08-22** — given in session before any test was written.

**How to read a line:** `ID | Who can do what | What proves it worked`.

**Both directions, always.** This site is two shells behind one gate (`profiles.is_approved`) and has four roles — **anonymous · pending partner · approved partner · HQ admin**. Every access line needs its allowed case *and* its denied case. A gate tested only from the inside is a gate that has not been tested. The binding statements are [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) **§15** (blocking invariants), **§8** (Route Handlers + abuse controls) and **§13** (production deployment).

**No payments.** This site has no Stripe, no checkout, no card flow and no payment surface. If a line here ever mentions money, something has gone wrong.

**Two viewports on every visual line: desktop and 320px** ([`DESIGN.md`](./DESIGN.md) §10, [`QA-CHECKLIST.md`](./QA-CHECKLIST.md)).

---

## A. Public shell — pages and content

Routes: `/` · `/model` · `/experience` · `/bring-ph` · `/our-support` · `/focus-areas` · `/about` · `/contact` · `/apply` · `/privacy`

| ID | Feature | Proof of PASS |
|---|---|---|
| PG-001 | Every public page loads with no errors, desktop and 320px | Page renders, zero console errors, no horizontal scroll |
| PG-002 | Every link on every public page goes somewhere real | No 404s, no dead anchors |
| PG-003 | A wrong URL shows the site's own 404 page | Branded 404, not a blank error |
| PG-004 | Header and footer are identical on every page | Shared chrome, no per-page variant: the same links with the same words. The header reads The Model · Experience · Bring a House · The Community (the route stays `/our-support`) · Sign in · Apply to Join |
| PG-005 | The retired workspace paths still redirect | `/plan` `/build` `/food` `/programming` `/academy` `/tools` `/live` `/elements` `/resources` each 307 → `/dashboard`, **and** the children `/live/*` `/elements/*` `/resources/*` `/academy/*` too (`next.config.ts`) |
| PG-006 | The proof numbers are consistent everywhere they appear | **4 sections · 22 focus areas · 83 templates and practical tools** — same figures on every public page that states them (`/focus-areas`, `/our-support`, `/bring-ph`); the retired figures, the 88 among them, appear on no public page |
| PG-007 | The single conversion works from anywhere | The green **Apply to Join** button in the header is on every page and lands on `/apply`; what an application is for is stated — "Apply for community access, not permission to operate a House." beside the call to action, and `/apply`'s own approved copy with the form. The old review promise is gone: no public page says "Every application is reviewed by HQ" or "HQ reviews your application" |
| PG-008 | The machine surfaces resolve | `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` answer; the sitemap lists only public routes; gated and auth pages are noindexed |
| PG-009 | The header knows whether you are signed in | Signed out: "Sign in"; signed in: the signed-in state — via the same-origin session probe (`/api/auth/session`), which returns only a yes/no, never identity |
| PG-010 | `/terms` is gone | `/terms` answers the site's own 404 (status 404, branded page), and no public page links to it or mentions it |
| PG-011 | `/privacy` is the owner's policy | The h1 reads "Privacy Policy", the page names 86400 Studio as operator and links to the contact form; no placeholder notice and no on-page contents list |

## B. The approval gate — the four roles *(the most important section in this file)*

Gated platform: `/dashboard` · `/setup` · `/operate` · `/program` · `/support` · `/{section}/{topic}/guide` (×22) · `/account`
HQ admin: `/admin` (→ `/admin/approvals`) · `/admin/approvals` · `/admin/content` · `/admin/content/pages` · `/admin/content/focus-areas` · `/admin/content/files` · `/admin/content/admins`

| ID | Feature | Proof of PASS |
|---|---|---|
| AC-001 | 🔴 **An anonymous visitor cannot open any gated route, even by typing the URL** | Redirect to `/login`, **and no gated string appears in the HTML *or* the RSC payload** — the response body is checked, not just what renders. Covers all 5 platform pages, all 22 guide URLs, and `/account` |
| AC-002 | 🔴 **An anonymous visitor cannot open any `/admin/*` route** | Redirect to `/login`; no admin strings (page headings, labels, paths) in the HTML or RSC payload — all six admin pages |
| AC-003 | 🔴 **A pending partner is held at the pending state** | `/dashboard`, the four section pages and every guide URL show the pending notice ("Your community access is being arranged."); `/setup` `/operate` `/program` `/support` and every guide URL resolve **no** focus-area summary, no guide body, no template row — the gated reads return nothing |
| AC-004 | 🔴 **A pending partner's Ctrl/⌘+K search is empty** | The search index call returns zero entries; no resource ids, storage paths or bucket names anywhere in the response |
| AC-005 | **A pending partner CAN reach `/account`** | Accessible — the one deliberate exception, session-gated only, so they can set name and password while they wait; it exposes only their own profile row |
| AC-006 | 🔴 **An approved partner cannot open any `/admin/*` route** | The branded **404 page** on all six, with zero admin content in the response — being approved is never being an admin. *(The HTTP status can read 200 on the redirect-chain hop — a Next.js streaming soft-404; recorded per run, not a leak.)* |
| AC-007 | An approved partner reaches the whole platform | `/dashboard` and all four sections render with real content; every one of the 22 guide pages opens; no console errors, desktop + 320px |
| AC-008 | An HQ admin reaches every `/admin/*` route | `/admin` forwards to `/admin/approvals`; all six admin pages render for the admin robot |
| AC-009 | 🔴 **A gate is a throw, not an await** | Asserted through AC-001/002/003's response-body checks: a denied response carries none of the page's own strings, which is only possible when the gate short-circuits before any content is built ([`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) §15) |
| AC-010 | Login and logout work | Sign-in lands on `/dashboard`; sign-out ends the session; the same gated URL is denied again immediately after |
| AC-011 | A signed-in visitor who opens `/login` is sent onward | Straight to `/dashboard` (or their `next` destination) — no sign-in form shown to someone already in |
| AC-012 | Wrong password fails safely | Clear inline message; no session created; the message does not reveal whether the account exists |
| AC-013 | Password-reset request is safe in both directions | `/forgot-password` returns the same neutral "check your inbox" message whether or not the email has an account (no account-existence disclosure); a bad or expired recovery link at `/auth/confirm` fails to a safe page with no session |
| AC-014 | Apply = sign-up, end to end | One submission on the deployed Preview creates a pending account + a pending application (disposable robot applicant); the new account sees the pending state; the application appears in `/admin/approvals` |
| AC-015 | 🔴 **HQ approval is the only unlock** | Admin robot approves the robot applicant in `/admin/approvals` → the same account now reaches real content with no re-login; a **declined** applicant stays locked out of everything, and gets the declined notice ("We cannot offer community access at the moment.") on `/dashboard` and on the section pages too |

## C. Gated content and downloads

| ID | Feature | Proof of PASS |
|---|---|---|
| CT-001 | Each section lists its focus areas | `/setup` 5 · `/operate` 6 · `/program` 6 · `/support` 5 — 22 total, holding **83** templates by their own count pills, matching the numbers at the top of this file |
| CT-002 | A focus area shows exactly the private model | The closed card: summary, Read more / Show less, Explore, **Watch Video**. Explore opens two resource-introduction lines, then three distinct groups: **Overview** (one download row, badge OV; a row, not a card) · **Simple Guide** (the **one** card on the panel, carrying the document's own title: Read Now → the reader · Download Word File → the file) · **Templates** (the focus area's own files, each with its badge, a caption and an icon button labelled by what it is; the count pill counts these only). No checklist card, no watch-out card — those do not exist in this model |
| CT-003 | The guide reader renders every topic | All 22 `/{section}/{topic}/guide` pages open for the approved robot and show guide content |
| CT-004 | A template downloads for an approved partner | Server-issued **signed URL**; the file actually arrives (bytes, not just a link). The same for the Simple Guide and the Overview, each saved as a `.docx` |
| CT-005 | 🔴 A template does **not** download for a pending or anonymous caller | Denied — no signed URL is ever issued; no storage path or bucket name leaks in any response |
| CT-006 | Ctrl/⌘+K search works for an approved partner | Results span focus areas, Overviews, guides and templates; the chips are All · Focus Areas · Guides · Templates, with an Overview under Guides; the four popular shortcuts resolve; choosing a result navigates to it, and choosing one on the page you are already on opens its card |
| CT-007 | Draft content is invisible to partners | Admin robot sets one topic to Draft (non-production data) → it vanishes from the section page, the guide URL, and the search for the approved robot → restored to Live afterwards, and everything reappears |
| CT-008 | A shared resource appears on the focus areas that borrow it | 10 focus areas show a "Shared resources from other focus areas" group, 13 rows in all; each row's badge is its home focus area's number and its screen-reader label names the home; the own-template pill does not count these; a shared row downloads; search finds the file once, at its home |
| CT-009 | Watch Video says so until a video exists | All 26 placements (4 on `/dashboard`, 1 on each focus area) are disabled buttons whose accessible name carries "Video coming soon.", none is a link; pressing one toasts the same words and goes nowhere |
| CT-010 | The Community Contacts links resolve | The banner's "Request Community Contacts" and the footer's "Community Contacts" both go to `/support#community-contacts`, where the block is showing |
| CT-011 | The private chrome carries the community wording | Nav: Overview (→ `/dashboard`) · Setup · Operate · Program · Support; the account button reads "Community Platform"; banner and footer offer "Search Resources"; the `/dashboard` tab title is Overview; "Partner Platform", "Ask HQ" and "Search all resources" appear nowhere in the shell |
| CT-012 | A link to a gated page answers the first click | Three tabs and a section's Read Now link, three rounds from a fresh load: each reaches its page on one click, through the router, and nothing clicks twice. It also reads the copy of React the checkout ships, so it goes red for certain if `patches/next@15.5.28.patch` goes missing before Next 16.3 |

## D. Forms and email

Public writes: `/apply` (server action) · `/contact` (Route Handler `/api/resend/contact`). Account write: `/account` (`set_my_account` + password change). No approval-gated partner form is left: CR1 removed Ask HQ from `/support`, and the `submit_support_request` RPC and its table remain in the database, unreached.

| ID | Feature | Proof of PASS |
|---|---|---|
| FM-001 | The contact form rejects bad input | The browser stops the submit at the first empty field and no success state shows; server-side zod rejection too — a request around the form is also refused |
| FM-002 | The contact form works end to end | Success state shown ("Thank you. Your enquiry has been submitted."); **one real email reaches HQ** (unmistakably marked TEST — see the warning below); its reply-to being the submitter is checked in the inbox at MN-001 |
| FM-003 | The apply form rejects bad input | The browser stops a bad email; with that check off, the server gives its own clear message for a bad email, a short password and a missing field; nothing is created |
| FM-004 | A duplicate application cannot be created | Submitting again as the same signed-in applicant lands on `/dashboard` with still exactly **one** application row. *Not robot-tested: applying with an email that already has an account gets "try signing in instead".* |
| FM-005 | Applying notifies both sides | The application-received pair: HQ notification + applicant confirmation (the applicant copy goes to the robot's undeliverable `.invalid` address by design). **Evidence is MN-001** (owner inbox confirmation); the robot proves the application is created, not that the mail left — corrected 2026-08-22 |
| FM-006 | The Community Contacts block on `/support` works for an approved partner — and shows only to them | Approved robot: `section#community-contacts` has no form fields, its link goes to `/contact`, its helper says it does not post to community members, and the walk fires no server action and no API POST: **no row is written and no email is sent**. Pending robot: the pending notice, and none of the block |
| FM-007 | `/account` works | Display name saves and persists; the Password card offers the change path (a link into the reset flow — `/account` deliberately has no in-place password form); a pending partner can do both. The reset flow's safety is AC-013; the full email walk is MN-003 |
| FM-008 | Approve/decline notifies the applicant | Approving or declining the robot applicant sends the right email variant (to the `.invalid` robot address — **no automated send-boundary assertion — this line's evidence is MN-001**, the owner's inbox confirmation; corrected 2026-08-22) |

> ⚠️ **Preview sends REAL email.** Resend is configured in Preview, so `/contact` and Apply submissions from the robot deliver to the real HQ inbox (`RESEND_TO_EMAIL`). The full run sends **one contact email and two application pairs**, subject-lined as a robot test, and the owner is told before every full run. Community Contacts sends nothing (FM-006). Never on Production.

## E. HQ admin

| ID | Feature | Proof of PASS |
|---|---|---|
| AD-001 | `/admin/approvals` lists pending applications; approve and decline both work | Using the disposable robot applicant only (AC-014/AC-015 are the same journey) |
| AD-002 | Pages editor saves | Edit a section's text (non-production data), see it live on the platform, restore it |
| AD-003 | Focus-areas editor works | Toggle Draft ↔ Live (CT-007); reorder; restore; a new focus area opens as its real row once saved, so a further Save edits it and cannot create another — all as the admin robot. *Not robot-tested: editing a topic's summary.* |
| AD-004 | Files manager works | Upload a small test document → it appears in the topic's templates grid and downloads under the name it was uploaded with; delete it; the 4 MB limit and the file-type check refuse what they should: anything but .docx, PNG or SVG is refused by name, a PNG under a template's code and an SVG carrying a script are refused before anything is stored; a real PNG and a clean SVG go through, labelled and named for what they are; a row's code cannot be edited into a different file kind or into the reserved `OV`. *Not robot-tested: replacing a file's metadata.* The SVG check's own cases are offline, in `scripts/verify-svg-safety.ts` |
| AD-006 | A finished video goes live from the CMS, with no code change | Paste a YouTube link on `/admin/content/pages` (a section's card on `/dashboard`) or `/admin/content/focus-areas` (a focus-area card) and save: the partner's Watch Video becomes a link that opens it in a new tab, on that card only. Anything but a YouTube link is refused, and the refusal loses nothing: what was typed stays for correcting, and the photo stays selected. Clear it and save: the placeholder is back. *Robot-tested on one placement of each kind. The other 24 share that path, and their stored text fits the form's limits (the longest expanded copy is 929 of 1,000 characters, the longest summary 100 of 500).* |
| AD-005 | Admin management works — and refuses the dangerous cases | Add an admin by email and remove them (fake robot only); **removing yourself is refused** — the refusal is the PASS. *Not robot-tested: the last-admin guard, which the database holds and this screen cannot reach, because removing yourself is refused first.* |

## F. Protection and abuse controls — ⛔ **partly NOT TESTABLE UNTIL SYS1.5**

> 🔴 `/apply` and `/contact` are live **today without rate limiting and without Turnstile** — [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §7 #1, scheduled as sprint **SYS1.5** (D-SYS-9, re-ordered after SYS2 by **D-SYS-11**). **No test asserts a 429 or a CAPTCHA until SYS1.5 has merged, and no test hammers a form.** The lines below are written now so they are not forgotten; they activate when SYS1.5 lands.

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
| MN-001 | The three email flows render correctly in a real inbox | 👤 Owner, once: the marked-TEST contact, application-received and approval emails from the full run — open each in the HQ inbox, confirm sender, subject and body read right, and that the contact email's reply-to is the submitter. The Ask HQ flow left at CR1 |
| MN-002 | The one real submission on the live domain | 👤 Owner, by hand, per [`LAUNCH-CHECKLIST.md`](./LAUNCH-CHECKLIST.md) Phase 3. Never automated, never on Production by a robot |
| MN-003 | The password-reset email link walk | 👤 Owner, once, with a real inbox they control: request a reset, click the link, set a new password, sign in. (The robot proves the safe-failure half in AC-013; the happy path needs a deliverable inbox, which the robots deliberately lack) |

---

## Cross-check findings (docs vs code)

- **Promised in the docs but missing in the code:** none newly discovered. Everything absent is absent by a recorded decision: Mailchimp dormant (E1, 2026-07-09) · Upstash/Turnstile → SYS1.5 (D-SYS-9/D-SYS-11) · Sentry/PostHog → SYS3 · the booklet lead-magnet UI removed at DR1-8 (its two PDFs remain the only public Storage files).
- **Found in the code but not prominent in the docs:** `/api/auth/session` (the header's yes/no session probe) and the `/auth/confirm` token handler — both internal plumbing, both on this list (IN-001, AC-013).
- **Known issues already logged, not re-discovered here:** §7 #1 (abuse controls — section F), §7 #4 (`.docx` upload refusal, self-diagnosing — AD-004 will exercise that path), §7 #5 (`/privacy` wording over-claimed retention — CR1 replaced the page with the owner's own policy; PG-011 checks that it is that policy, not that its words are true).

## Public-repo rule

🔴 This repository is **public**. Nothing in this file may contain a real person's name or email, a real partner or applicant identity, an account id, a project ref, a credential, a dashboard URL carrying an id, gated content, or a Storage object path. The only addresses here are the robots' undeliverable `.invalid` ones.

## Change log

Approved lines are never silently edited. Every later addition or change: `[DATE — ID — what changed — re-approved by]`.

- 2026-08-22 — **PG-007** — proof cell corrected after the first run: the literal tagline "Every application is reviewed by HQ." lives on the home platform card; `/apply` states the same promise in its own approved copy ("HQ reviews your application"). The feature (Apply reachable everywhere + the review promise stated) is unchanged — flagged in the test report for the owner's re-approval.
- 2026-08-22 — **AC-006** — proof cell corrected after the first run: the denial substance is the branded 404 page + zero admin content; the HTTP status can read 200 on the redirect-chain hop (Next.js streaming). Observed statuses are recorded per run — flagged in the test report for the owner's re-approval.
- 2026-08-22 — **FM-007** — proof cell corrected during the fix loop: `/account` has no in-place password form — its Password card links into the reset flow, by design. The robot asserts the path; AC-013 covers the flow's safety; MN-003 stays the manual email walk — flagged in the test report for the owner's re-approval.
- 2026-08-22 — **test-user roster + FM-005 + FM-008** — corrected after the D-SYS-1 independent review: the roster said "one disposable robot applicant per full run" while the suite creates **two** (one per decision branch, because an approvals decision is final in the UI); and FM-005/FM-008 were worded as though an automated assertion watched the sending boundary, when their real evidence is **MN-001**, the owner's inbox confirmation. Neither is a change of intent — both are the record catching up with what the tests do. **Flagged for the owner's re-approval.**
- 2026-10-31 — **the numbers + the public route list + PG-004 + PG-006 + PG-007** — CR1: 88 became 83 templates and practical tools; `/terms` left the routes; the header gained The Community and Apply to Join; the review promise gave way to "Apply for community access, not permission to operate a House." Not yet run against a Preview. **Flagged for the owner's re-approval.**
- 2026-10-31 — **AC-003 + AC-015** — CR1: new pending and declined wording, and both notices now show on `/dashboard`, the four section pages and every guide URL, so a declined account gets its own notice on the section pages too. The gate itself did not move. Not yet run against a Preview. **Flagged for the owner's re-approval.**
- 2026-10-31 — **CT-001 + CT-002 + CT-004 + CT-006 + AD-004** — CR1: the panel gained an Overview row and the Simple Guide card's download became Download Word File; search gained an Overview kind and the Files screen gained PNG and SVG, proven both ways; a search hit on the current page now opens its card. CT-004 now presses a real template row, where it used to press the guide's button, and proves the guide and the Overview as well. Not yet run against a Preview. **Flagged for the owner's re-approval.**
- 2026-10-31 — **FM-002 + FM-006 + MN-001 + the email notes + the section F note** — CR1: new contact-form wording; Ask HQ replaced by a Community Contacts block with no form, so FM-006 now proves that nothing is submitted, and the run's email count drops by one. The RPC and table behind Ask HQ remain in the database, unreached. Not yet run against a Preview. **Flagged for the owner's re-approval.**
- 2026-10-31 — **PG-010 + PG-011 + CT-008 + CT-009 + CT-010 + CT-011 (new)** — CR1: lines for what the release added or removed. Not yet run against a Preview. **Flagged for the owner's re-approval.**
- 2026-10-31 — **the Section D intro + the §7 #5 bullet + the scan and run notes at the top of this file** — CR1: the Section D intro now names `/account` as the account write and says no approval-gated partner form is left; the §7 #5 bullet now says CR1 replaced `/privacy` with the owner's own policy, and that PG-011 checks that it is that policy, not that its words are true; the scan paragraph and the Preview-tested line now say what CR1 has since changed. These lines state no new behaviour of their own. **Flagged for the owner's re-approval.**
- 2026-10-31 — **the top-of-file sentence + FM-001 + FM-002 + FM-003 + FM-004 + AD-003 + AD-004 + AD-005 + MN-001** — CR1's second-round review found clauses in these cells that no test proves, most of them older than CR1. Where a test could prove the clause it now does: PG-002 checks that fragments land, PG-008 reads the noindex tag on the sign-in, gated and admin pages, AC-012 compares the message for an unknown address, CT-005 asks the issuer as a caller who never signed in, CT-007 opens the Draft topic's guide URL and searches for it, FM-003 turns the browser's check off and reads the server's message for each bad field, and AD-005 waits for the refusal itself. Where one could not, the cell now says so with *not robot-tested*: the existing-account message, editing a summary, replacing a file's metadata, and the last-admin guard. FM-002's reply-to moved to the inbox check at MN-001. Not yet run against a Preview. **Flagged for the owner's re-approval.**
- 2026-10-31 — **CT-009 + AD-004 + CT-012 (new)** — The owner handed the open CR1 calls over the same day ("fix all yourselves and don't depend on me"). CT-009: the handover asks for the placeholder to be disabled with a clear message, so all 26 now are, and their accessible name says why. AD-004: the Files screen refuses a PDF, which the copy has no download label for, and refuses a code that would make a row untrue. CT-012: new, for the dropped-wake-up defect, so its fix cannot leave unnoticed.
- 2026-11-01 — **AD-006 (new)** — The owner asked that finished videos go live from the CMS without a sprint. The 22 focus-area links always could; the four on `/dashboard` had no field and their card ignored the column. Now all 26 can, and this line proves it end to end, both ways.
- 2026-11-01 — **AD-003 + AD-006 + CT-012 + AC-002** — CR1's last review. AD-003 now proves a new focus area opens as its real row once saved. AD-006 is robot-tested on one placement of each kind, not all 26, and also proves a refused link loses nothing. CT-012 also reads the shipped copy of React for the buggy line, because the clicks alone catch a missing fix only some of the time (7 of 12 runs with the fix taken out), and it now proves each click went through the router. AC-002 could not see a leaked admin heading on five of its routes, because the real headings end in a full stop: it now looks for them as they render, in the HTML and in a raw RSC payload, and it was watched going red with one page's gate removed.
