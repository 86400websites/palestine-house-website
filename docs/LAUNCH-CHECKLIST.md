# Launch Checklist — Palestine House

> **This site is already live.** It launched on **2026-06-19** (sprint **S7**, **PR #29**, merge `6b56d2d`) on the Vercel-assigned production domain, `https://palestine-house-website.vercel.app`. Nothing below is pending "go-live". This file is the honest **record** of which launch gates actually ran, which never ran, and which have to run again the day the custom domain goes live.
>
> It is written after the fact deliberately. A launch checklist installed post-launch that reads as though launch is still ahead is worse than no checklist — it invites someone to tick boxes that were never tested.

---

## What this file is for now

Three jobs, in order of how often you will use it:

| | |
|---|---|
| **1. The standing gate for the parked relaunch** | The custom domain `palestine-house.com` was connected on 2026-06-30 (canonical = `https://www.palestine-house.com`, apex 308-redirects to www) but **the switch-on was never executed**: `NEXT_PUBLIC_SITE_URL` in Vercel Production, the Supabase Auth Site URL + redirect allow-list, the redeploy, and the live re-verification are all still owed. That work is parked as **"Domain/SEO relaunch verification (ex-S14)"** in [`ROADMAP.md`](./ROADMAP.md) §A, with the exact switch-on sequence in [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §4. Every item below marked 🔁 must be re-run against the new domain that day. |
| **2. The exit reference SYS2 reports into** | The **Launch Gate** — Phase 1's one launch-blocking item — has never been satisfiable, because this repo has no automated test suite. **SYS2** ([`ROADMAP.md`](./ROADMAP.md) Stage 5) builds it. When SYS2's full run goes green and the owner signs the **GO** verdict, that verdict is recorded against the Launch Gate line in this file. |
| **3. The record of what the 2026-06-19 launch actually cleared** | Two Phase-1 items were **never satisfied** and the site went live anyway. Both were the owner's knowing decision, both are named below, and neither is softened. |

**Status vocabulary used throughout:**

| | |
|---|---|
| ✅ **Done** | Satisfied, with the date and the file you can check it in. |
| ⚠️ **Partly** | Something real was done and something real was not. Both are stated. |
| ⛔ **Not satisfied** | Never done. The sprint that does it is named. |
| ➖ **N/A** | Does not apply to this project, with the reason. |
| 👤 **Owner** | Only the owner can do it — a Vercel, GoDaddy, Supabase, registrar or third-party-account action. |
| 🔁 | Must be re-run on the custom domain at relaunch. |

---

## The two that were never satisfied

Stated first so nobody has to find them.

### ✅ The Launch Gate — SATISFIED 2026-08-22, for the first time in this project's life

**A full automated run now gates releases here.** SYS2 installed the Playwright suite and ran it: **98/98 green** on a deployed Preview across both viewports and all four roles, against an owner-approved 54-line `docs/FEATURE-LIST.md`, with the **GO signed by the owner on 2026-08-22** — report: [`test-reports/2026-08-22-test-report.md`](./test-reports/2026-08-22-test-report.md). A daily **morning check** (Option A — logged-out, read-only, zero standing credentials) now watches the live site and emails only on failure. The honest edge, carried openly: **MN-003's final step** (typing a new password on the reset screen and signing in with it) is not yet robot-proven — the request, the link acceptance and the fail-closed behaviour are; see the report and `PROJECT-STATUS.md` §7 #7.

*(The pre-SYS2 history is kept below, because a satisfied gate should still show what it replaced.)*

### ⛔ (Historic) The Launch Gate — no automated test run had ever gated a release here

The SOP's Phase 1 requires a **100% green whole-site test run on the release candidate**, with a **GO** verdict recorded in `docs/test-reports/`. None of that existed on 2026-06-19, and no automated run has ever gated a release here. *(The machinery now exists: `docs/testing-setup/` and the `/activate-testing` skill arrived at SYS1, and SYS2 installed the harness itself — `@playwright/test`, `tests/e2e/`, the `test:e2e` script, the four robot roles in the non-production project. An installed harness is still not a passed gate: this line stays un-ticked until a full run is 100% green and the owner signs the GO on the latest report in `docs/test-reports/`.)*

What ran instead at launch was a **manual** pass: an exhaustive route × auth-state QA sweep (16 candidate defects adversarially narrowed to 11 real, 10 fixed, all logged in [`docs/code-reviews/s7-qa-findings.md`](./code-reviews/s7-qa-findings.md)) plus an independent Codex review that returned **approve, zero blocking**. That is real work and it found real bugs. It is not a repeatable suite, it proves nothing about any later commit, and it is not the Launch Gate.

**Satisfied by: SYS2 — Testing launch gate** (Playwright; `docs/testing-setup/`, `tests/e2e/` and `docs/test-reports/` all **arrive in SYS2**). The same honest status line is carried in [`QA-CHECKLIST.md`](./QA-CHECKLIST.md) → Part 1 → Automated tests and in [`TECHNICAL-INTEGRITY.md`](./TECHNICAL-INTEGRITY.md). Do not tick this line, and do not let "CI is green" or "we clicked through it" stand in for it.

### ⛔ Public-write hardening — the site launched with its public forms unthrottled, and still is

`/apply`, `/contact` and `/support` went live **without Upstash rate limiting and without Turnstile**. This is [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §7 issue **#1**, open since S3c, and the oldest debt in the project. The owner accepted it knowingly at **D-S6-a** (2026-06-18) so the MVP could launch ahead of the hardening sprint; the roadmap then retired that sprint un-started on 2026-07-02.

What is *actually* protecting those endpoints today: zod validation on every input, Supabase email uniqueness, the `/support` write being itself `is_approved()`-gated, and — the load-bearing one — **the HQ approval gate**, which means a bot that successfully signs up reaches a pending account and nothing else. No guide body, no template, no topic summary. Abuse cannot reach gated content; abuse *can* fill the approvals queue and burn the mailbox.

**Satisfied by: SYS1.5 — Public-write hardening** (**D-SYS-9**, 2026-08-21 — off the backlog, now its own sprint between SYS1 and SYS2). Its exit gate: a real Production submission is rate-limited and a Turnstile-less request is refused, both demonstrated. Until then [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) §15's public-writes invariant is **not** fully satisfied. 👤 Owner supplies the Upstash and Turnstile accounts (env var names only — values go in Vercel).

---

## Phase 1 — PRE-LAUNCH

### Build completeness

- ✅ **All MVP sprints merged, no sprint half-open.** S1–S7 were all on `main` at launch ([`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §1). Stage 4 (PP1–PP8) closed 2026-08-20 with PP8 as **PR #88**; production is on migration `0034`.
- ⚠️ **`QA-CHECKLIST.md` passed in full.** [`QA-CHECKLIST.md`](./QA-CHECKLIST.md) is a **per-PR** sheet in this repo, not a one-time launch sheet — and it **did not exist on 2026-06-19**. It was installed in this same SYS1 sprint, on 2026-08-21. It has therefore gated **no PR yet**, and no PR can be claimed against it retroactively. What actually gated every PR through launch and Stage 4 is [`WORKFLOW.md`](./WORKFLOW.md) §9 → §10 → §11 → §12 plus its §17 definition of done; the sheet consolidates those into one list from here on. Its own Automated-tests block is the Launch Gate above and stays unticked until SYS2.
- ⛔ **Launch Gate passed.** See above. **SYS2.**
- ⚠️ **`SECURITY-CHECKLIST.md` passed in full, every blocking item resolved.** §15's blocking invariants were self-reviewed at S4 and re-proven repeatedly through Stage 4 — the gated RPCs, the two-gate rule on every route, the private-bucket signed-URL path, the empty search index for pending callers. **Two exceptions, both named:** the public-writes invariant (SYS1.5, above), and the full §1–§15 sweep, which is also SYS1.5's scope. Individual findings that *were* closed: [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §7 issue **#2** (the anon-executable `SECURITY DEFINER` function, migration `0034`, applied to production 2026-08-20) and §7 issue **#3** (the `/admin/content` RSC structure leak, PP8). *(Those two are the tracker's issue register, not sections of this checklist — `SECURITY-CHECKLIST.md` §7 is the client/server boundary list.)*
- ✅ **Post-launch items live in the backlog, not in anyone's head.** [`ROADMAP.md`](./ROADMAP.md) §A carries the Post-MVP backlog and the three items absorbed from the retired S13/S14 sprints; [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §5 and §7 carry the open decisions and known issues. See also [`POST-LAUNCH-BACKLOG.md`](./POST-LAUNCH-BACKLOG.md).
- ⚠️ **A restore has been rehearsed on a non-production copy.** Rehearsed **after** launch, and narrower than the SOP asks. On 2026-08-16 (PP7 review round 4) the **full content rollback cycle** was executed end to end on the non-production Supabase project: `0033`'s down-migration, the 1.68 MB `0030` rollback as one transaction (33 elements · 10 groups · 33 topics · 297 resources restored, prose byte-perfect), all 297 Storage objects restored to their exact keys and read back byte-identical, `broken_downloads = 0`, and TEST finishing byte-identical to its pre-rehearsal state. Recorded in [`ROLLBACK-RUNBOOK.md`](./ROLLBACK-RUNBOOK.md) §4. **What has *not* been rehearsed** is a platform-level restore — a Supabase backup or PITR restore of the whole project. 👤 If the owner wants that covered, it is a one-off rehearsal on the non-production project, and it belongs in [`POST-LAUNCH-BACKLOG.md`](./POST-LAUNCH-BACKLOG.md), not here.

### Content

- ✅ **Real content everywhere, zero placeholder tokens.** S7 Step 7 verified the repo carries no gated-content exposure at all (the gitignored source trees were never committed — checked against git history, not `.gitignore`). S7-09 removed the last literal `[contact email]` token from `/privacy` and `/terms`. One thing that *looks* like a placeholder and is not: both legal pages carry a visible "plain-language, pending counsel review" note that is **part of the approved copy**.
- ✅ **The locked facts and numbers verified, identical site-wide.** Verified at S7 Step 4 against the numbers of the day, then **superseded and re-verified twice**: FA11 (2026-07-18) moved them, and PP7/PP8 reconciled the public site to the real private model — **4 sections · 22 focus areas · 88 templates**. The owner signed off the public focus-area copy **on the live site** on 2026-08-20 (**D-PP-s**). This repo has no `locked-facts.md`; the binding record is [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §4 and [`CLAUDE.md`](../CLAUDE.md).
- ✅ **Images final, optimized, with alt text.** S7 Step 5 verified **zero raw `<img>` on 2026-06-19** — content images go through `next/image` with `sizes`, `priority` on the LCP heroes and lazy below the fold — and `next.config.ts` serves AVIF with a WebP fallback. **That "zero" is no longer true in the present tense, and should not be quoted as if it were.** The DR-series refresh and the CMS added a small set of deliberate raw `<img>` exceptions, each carrying an `eslint-disable` line that states why: decorative branch flourishes on `/model` and in the footer, the brand lockup and partner seals on `/model` and `/our-support`, the `/model` embassy gallery, and the 120px thumbnail in `/admin/content/focus-areas`. Every one is either decorative (`alt=""` + `aria-hidden`) or admin-only, so the alt-text half of this line still holds. Alt text is a standing per-PR gate ([`DESIGN.md`](./DESIGN.md) §11, [`QA-CHECKLIST.md`](./QA-CHECKLIST.md)), not a one-time launch check.
- ⚠️ **CMS: editor roles, draft→publish, redirects, media ownership, backup/export, client training.** The CMS did not exist at launch — `/admin/content` shipped post-launch at S11 (PR #39) and was rebuilt across PP6. Where it stands now: **editor roles** = the server-checked `admins` table, managed through `admin_add_admin` / `admin_remove_admin`, where the remove RPC refuses to drop yourself or the last admin (D-S11-e); **draft→publish** = a focus area is created **unpublished** and reaches partners only through a deliberate publish action (`admin_set_platform_topic_published`; Save can never silently publish); **redirects** = the retired-workspace 307s in `next.config.ts`; **media ownership** = a private Supabase Storage bucket, server-issued signed URLs, approved users only; **backup/export** = [`ROLLBACK-RUNBOOK.md`](./ROLLBACK-RUNBOOK.md); **client training** = the owner drove the CMS himself at the PP6b pilot on 2026-08-15 and his five answers became **D-PP-q**.

### SEO basics

- ✅ **Unique `<title>` and meta description on every page.** S7 Step 5 verified full metadata coverage, with `noindex` correct on the auth, platform and admin routes and the public/legal pages indexable.
- ✅ 🔁 **OG image set and rendering.** `src/app/opengraph-image.tsx`, 1200×630 with alt, verified at S7 Step 5; `og:locale` was corrected `en` → `en_US` in the same step and a Home override that silently dropped the root OG tags was caught by the pre-merge smoke test and removed. **Re-check the share preview on the custom domain at relaunch** — every OG URL derives from the site-URL variable.
- ✅ **Favicon and app icons present.** S7 Step 6: `src/app/icon.svg`, `src/app/apple-icon.tsx` (180×180), `src/app/manifest.ts`, `viewport.themeColor` — all built from the existing brand arch mark, no new assets.
- ✅ 🔁 **`sitemap.xml` and `robots.txt` generated and correct.** `src/app/sitemap.ts` emits every indexable public route and excludes the auth, platform, admin and dynamic routes; `src/app/robots.ts` allows public and points at `${SITE_URL}/sitemap.xml`. Both derive from the same variable, so both change with the domain — **re-verify live at relaunch**.
- ✅ **Canonical derives from the single public site-URL variable.** `src/lib/site.ts` reads **`NEXT_PUBLIC_SITE_URL`** (name only; the value is set per environment in Vercel) and every canonical, OG URL, sitemap entry and robots line derives from it. Nothing is hardcoded. Confirmed live at launch: canonical resolved to the Vercel domain.
- ⚠️ **Key pages meet the approved performance budget.** The budget is **not** in `QA-CHECKLIST.md` in this repo — it is [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md) §15 (Lighthouse 95+ across all four categories; LCP < 2.5s, INP < 200ms, CLS < 0.1). S7 Step 5 ran a spot-check and shipped the AVIF/WebP win; `LazyMotion` keeps the animation engine out of first-load JS and `next/font` uses `display: swap`. **No recorded PageSpeed Insights run against the production domain exists.** 👤 Worth one run at relaunch.

### Legal and tracking

- ⚠️ **Legal pages live.** `/privacy` and `/terms` are live and linked from the footer. There is **no cookies page** — see the consent line below for why one is not required. **Three drift items found while installing this file, none invented:** `/privacy` names **Mailchimp** as a processor, but Mailchimp has been **dormant by owner decision** since E1 (2026-07-09) and **Resend** — the processor that actually sends — is not named; `/privacy` says "view or delete your data anytime from your account", while the Delete-account section is **still hidden** by **D-S6-c** (deletion requests route through `/support`); and it lists "your progress on the platform" among what the site keeps, which **D-PP-b** dropped and PP7 removed from the database. Copy is verbatim from the approved source, so this is not a silent fix — it is an open decision for the owner. See the conflict note at the end of this file.
- ➖ **Analytics installed if agreed.** No analytics tool is installed and none is agreed. Verified: nothing in `src/` or `package.json` loads PostHog, Google Analytics, Plausible or Vercel Analytics; `src/app/providers.tsx` carries only `LazyMotion` and the tooltip provider. If one is ever adopted it needs a CSP amendment and a privacy-page update in the same PR.
- ✅ **The measurement instrument for the primary success metric is installed and verified capturing.** The single conversion is **Apply**, and it is measured **in the database**, not in an analytics tool: a submission writes a `profiles` row plus an `applications` row and appears immediately in `/admin/approvals`. That is a durable count the owner can read at any time, and it was exercised end to end at launch and repeatedly since — the ten live approved production accounts recorded at PP2 came through it.
- ➖ **Consent mechanism blocking third-party scripts before consent.** Nothing to gate. The site loads **no** third-party or analytics scripts; the CSP ships `default-src 'self'` with `connect-src 'self'` and the YouTube privacy-enhanced player as the only extension. The only cookies are the Supabase session and the `ph-recovery` marker — both strictly functional. **Revisit at SYS3:** **D-SYS-10** adds the Sentry ingest origin to `connect-src`, which introduces the site's first outbound third party.

### Conversion durability and deliverability

- ⚠️ **The primary conversion has ≥2 independent capture paths.** **Path 1 is solid and always was:** the `applications` row in Supabase, which survives any mail outage, expired key or provider change — an application cannot be lost by email failing. **Path 2 is wired but unproven live:** the Resend "New application" notification to HQ, shipped in E1 (PR #55, 2026-07-09). It has never been confirmed arriving from Production, because the Production **redeploy** that makes the env vars take effect is still owed ([`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §6).
- ⚠️ 👤 **SPF, DKIM and DMARC on the sending domain; an external submission lands in the inbox, not spam.** **SPF and DKIM: done** — the owner verified `palestine-house.com` in Resend on 2026-07-09, with the records on the `send.` subdomain and the `resend._domainkey` DKIM record, at GoDaddy. The Microsoft 365 mailbox and the root SPF were deliberately left untouched. **DMARC: no record that it was added** — it is the optional `_dmarc` step in [`EMAIL-SETUP-CHECKLIST.md`](./EMAIL-SETUP-CHECKLIST.md) Part 4, conditional on a spam-placement problem. **The external-address inbox test has not been run**: the whole Part 4 live matrix (contact · support · the application-received pair · approve/decline · spam placement) is still owed, behind the same Production redeploy.

### Monitoring — none of it exists

Every line in this block is unsatisfied. That is the single biggest gap between this repo and the SOP, and it is why Stage 5 has a SYS3.

- ⛔ 👤 **Uptime monitor + primary-conversion canary, alerting a named owner.** Not configured. Nothing watches the site. A silently broken Apply form would be discovered by someone noticing the approvals queue had gone quiet. **Alert recipient: _(owner to fill in — deliberately left blank; this repository is public)_.**
- ⛔ **Morning check ready.** Its template lives in [`testing-setup/templates/MORNING-CHECK-TEMPLATE.md`](./testing-setup/templates/MORNING-CHECK-TEMPLATE.md) (installed at SYS1); the workflow file itself and the `@morning` tagging **arrive in SYS2**, added *disabled*, with the selection of the 5–7 tests (and its production-login question) an explicit owner decision at that point.
- ⛔ 👤 **Error tracking live.** No Sentry, no DSN, no alert rule, no test error. The two error boundaries that exist — `src/app/error.tsx` and `src/app/global-error.tsx` — render a friendly page and report to nobody. Today the only error surface is the Vercel function log, read by hand. **Satisfied by SYS3**, which also carries the **D-SYS-10** CSP amendment. `docs/error-tracking/` and `docs/INCIDENT-LOG.md` **arrive in SYS3**. Owner supplies the account, DSN, Vercel env var and Production alert rule; the sprint does not pass until the owner confirms the alert email **actually arrived**.
- ⛔ 👤 **Domain and SSL expiry monitoring with a named owner.** SSL on the Vercel domain is issued and renewed by Vercel. The custom domain's registration renewal at GoDaddy is entirely owner-side and **nothing monitors it**. A lapsed renewal is the most common way a small site of this shape goes dark. **Renewal owner and alert address: _(owner to fill in)_.**

### Approval

- ✅ **The client has seen the full site on the production URL, desktop and mobile.** The owner ran the production smoke test himself after the merge and verified the public layer live. He has since worked the live site continuously — driving the CMS at the PP6b pilot, executing the PP7 production cutover by hand, and signing off the public focus-area copy **on the live site** on 2026-08-20 (**D-PP-s**).
- ➖ **Written launch approval received, dated.** **The owner is the client on this project.** There is no external client to countersign, no approval email, and none should be manufactured. The record of approval is the act: he merged **PR #29** on **2026-06-19**, which is what deployed it. That is the signature, and it is in git. **Do not add a name or a date to this line that cannot be read out of a file in this repo.**

---

## Phase 2 — LAUNCH DAY (2026-06-19) and the parked relaunch

The 2026-06-19 launch was on the **Vercel-assigned domain**, by resolved decision **D3** (2026-06-11): ship on the free domain, connect the custom domain later. So most of this phase was skipped by design at launch and is **owed at relaunch**. The full switch-on sequence is in [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §4; run it with [`PRODUCTION-CUTOVER-RUNBOOK.md`](./PRODUCTION-CUTOVER-RUNBOOK.md) discipline — one step, verify, next.

- ⚠️ 🔁 👤 **Connect the domain on Vercel; add only the provider-specified DNS records.** `palestine-house.com` was connected to the Vercel project on **2026-06-30** with the apex 308-redirecting to `www`. The domain is connected; the site is **not yet served from it as canonical**.
- ✅ **Sending-domain DNS records.** Added 2026-07-09 at GoDaddy — see the deliverability line in Phase 1. Not blocking the relaunch, and independent of it.
- ⛔ 🔁 👤 **DNS propagated and SSL issued — valid padlock before announcing.** Verify on `https://www.palestine-house.com` at relaunch.
- ⚠️ 🔁 **www vs apex decided, the other 301/308-redirects to it.** Decided and configured: canonical is **www**, apex redirects. Never verified against live traffic. Re-verify at relaunch.
- ⛔ 🔁 👤 **Update the site-URL env var in Production, then redeploy.** `NEXT_PUBLIC_SITE_URL` in Vercel **Production** still points at the Vercel domain. Setting it to `https://www.palestine-house.com` is step 1 of the switch-on, and **the redeploy is not optional** — env changes do nothing without one. Everything under SEO basics above changes the moment this lands.
- ⛔ 🔁 👤 **Add the new domain to the auth redirect allow-list, keeping the old one for a grace period.** In the production Supabase project: set the Auth **Site URL** to the www domain and **add** both the www and apex wildcard redirect patterns — **leave the Vercel domain listed**, so password-reset and confirmation links already in people's inboxes still resolve. The code side is already done: `src/lib/safe-redirect.ts` allow-lists both hosts in `PRODUCTION_HOSTS`, so no code change is needed and no gate, RLS or CSP change is involved (the CSP is origin-relative).
- ⚠️ 🔁 **Verify security headers on the LIVE domain response.** `next.config.ts` ships all six on every route — CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, HSTS and Permissions-Policy. What the launch record actually names as read off the deployed site on 2026-06-19 is **CSP, HSTS and X-Frame-Options** ([`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §1, Production URL); smoke-test step 8 asks for all six, and the other three are not written down as checked. Not a defect — the header block is one array applied to `/(.*)` — but do not report six as verified when three are recorded. **Re-run `curl -I` against the custom domain at relaunch and record all six**; config reading is not deployed reality.

---

## Phase 3 — POST-LAUNCH SMOKE TEST

The smoke-test script itself is written out in full at [`docs/code-reviews/s7-qa-findings.md`](./code-reviews/s7-qa-findings.md) → *Production smoke-test* — eight numbered steps across anonymous, pending, approved and admin, desktop and 320px. Run **that** at relaunch, against the new domain.

What was verified on 2026-06-19:

- ✅ 🔁 **Every page loads over https; full sitemap click-through.** Step 1, green — all public routes, no console errors, header and footer rendering, nav and footer links resolving, and the two locked-copy spot-checks (the café card per §4, no `[contact email]` on the legal pages).
- ⚠️ 🔁 **Primary conversion end-to-end as a real visitor.** Smoke-test step 3 — the Apply → pending-account → `/admin/approvals` walk — was left to the owner, and the S7 sprint record still shows the authenticated click-through **unticked**. The flow itself is demonstrably working in production (real approved accounts exist and came through it), but the scripted post-deploy run of steps 3–7 was never recorded as done. **Run steps 3–7 at relaunch and record them.**
- ⚠️ **Forms actually deliver: a real external submission arrives in the inbox, and the second path recorded it.** **This was never possible at launch** — Resend was not switched on until 2026-07-09, three weeks later, so at go-live the email path was an honest no-op and the *only* capture path was the database. The live test matrix is still owed (Phase 1, deliverability).
- ⚠️ 🔁 **Mobile pass on a real phone.** The 320px pass ran as part of S7's QA matrix; a real-device pass on the production domain is not recorded. Owner check at relaunch: home, `/apply`, one deep page.
- ✅ 🔁 **Canonical, `og:url` and sitemap URLs all show the right domain.** Confirmed live at launch against the Vercel domain. This is the item most likely to be silently wrong at relaunch — it is exactly what the env var + redeploy step controls.
- ➖ 🔁 **Relaunch only: spot-check the 301/410 redirect map.** There is **no old→new URL map** for this move: the paths are identical, only the host changes. The one redirect map this repo has is the retired-workspace set in `next.config.ts` (307 to `/dashboard` for `/plan`, `/build`, `/live`, `/elements/*`, `/resources/*`, `/academy/*` and the rest), last corrected and spot-checked at PP8 8-e. Re-check those on the new host at relaunch.
- ⛔ 🔁 👤 **Search console: property added, ownership verified, sitemap submitted.** No record anywhere in this repo that a Search Console property exists. This belongs to the **§A relaunch** work — adding it for the Vercel domain now would only have to be redone.
- ✅ 🔁 **No accidental `noindex`.** Verified at S7 Step 5 and again on the live response: `noindex` sits on the auth, platform and admin routes only; public and legal pages are indexable.
- ⚠️ 🔁 **Auth on the live domain: sign up / sign in / reset; email links land on the right domain.** Same gap as the conversion line — smoke-test steps 3–6 were the owner's and are unticked in the record. At relaunch this is the highest-risk item on the page: if the Supabase Auth Site URL and the site-URL variable disagree, reset links will point at the wrong host.

### The 48-hour watch

Keep this block. Understand what it currently means.

- ⛔ **Monitor errors for 48 hours.** There is **no error tracker**. Today this means reading Vercel function logs by hand, which nobody does at 2am. It becomes a real instruction only when **SYS3** lands Sentry with a Production alert rule the owner has confirmed by receiving a test alert. `docs/error-tracking/` and `docs/INCIDENT-LOG.md` **arrive in SYS3**.
- ⚠️ **Monitor form deliveries for 48 hours.** Possible today but partial: sends that reach Resend, including API rejections, appear in the Resend dashboard. Unconfigured skips and network failures never reach Resend and show only as `[resend] …` lines in the Vercel function logs.
- ✅ **Log every issue found, with severity.** [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §7 is the live issue register and has been used exactly this way — four entries, each with severity, evidence and either a resolution or the sprint that owns it. Longer-horizon items go to [`POST-LAUNCH-BACKLOG.md`](./POST-LAUNCH-BACKLOG.md).
- ✅ **Fix via the normal workflow.** branch → build → local checks ([`WORKFLOW.md`](./WORKFLOW.md) §9) → PR ([`WORKFLOW.md`](./WORKFLOW.md) §10) → deployed Vercel Preview ([`WORKFLOW.md`](./WORKFLOW.md) §11) → independent review → owner merges ([`WORKFLOW.md`](./WORKFLOW.md) §12) → production smoke test. Under **D-SYS-1**, independent review is **mandatory** for anything touching auth, the approval gate, RLS or schema, env handling, security headers or the CSP: an immutable `merge-base..head` SHA range, a record saved in `docs/code-reviews/`, and **no merge over a Blocking finding**. The brief is [`CODEX-REVIEW-PROMPT.md`](./CODEX-REVIEW-PROMPT.md).

---

## Never do this

- **Never hotfix directly on `main` in a launch-day panic.** This is [`WORKFLOW.md`](./WORKFLOW.md) §15's "never edit production directly" rule, restated here only because launch day is when it gets broken. If production is broken, [`ROLLBACK.md`](./ROLLBACK.md) is the decision tree; if the break involves the migrated content or the Storage objects, it sends you straight to [`ROLLBACK-RUNBOOK.md`](./ROLLBACK-RUNBOOK.md). Every production action is the owner's — the build engine's Supabase access to production is read-only.
- **Never mark a launch "done" without a real test submission delivered.** This one was **not honored on 2026-06-19** — the conversion was captured to the database and nothing was emailed, because email did not exist yet. Stated so the relaunch does not repeat it: the live email matrix in [`EMAIL-SETUP-CHECKLIST.md`](./EMAIL-SETUP-CHECKLIST.md) Part 4 is owed *before* the domain switch-on, not after.
- **Never launch with an unresolved security-checklist blocking item.** This site did, knowingly, at **D-S6-a**. It is closed by **SYS1.5**, and it is the reason that sprint runs before the test suite is written.
- **Never launch with placeholder content "we'll swap later."** Honored — S7-09 removed the last literal token (`[contact email]`, on the two legal pages) before the merge, and S7 Step 7 proved there was no gated-content exposure in the public repo.

---

## Conflict found while installing this file (2026-08-21, SYS1)

Recorded here rather than fixed, because copy is verbatim and this is the owner's call. Belongs in [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §5 as an open decision:

**`/privacy` describes a data reality the site no longer has.** `src/app/privacy/page.tsx` names **Mailchimp** as a processor ("if you opt in, Mailchimp (email)") — dormant by owner decision since E1, 2026-07-09 — and does **not** name **Resend**, which is what actually sends mail on behalf of the site. The same page says a partner can "view or delete your data anytime from your account", while the Delete-account section is deliberately hidden under **D-S6-c**, with deletion requests routed through `/support`. And its "What we keep" answer still lists "your progress on the platform" — saved progress was dropped at **D-PP-b** and `checklist_progress` was dropped from the database at PP7, so the site keeps no such thing. Three statements, all inaccurate to a reader today. A privacy page that names the wrong processor is the kind of thing that matters precisely once, and expensively.

---

Next step → if production breaks, [`ROLLBACK.md`](./ROLLBACK.md). Before any relaunch step, re-read the switch-on sequence in [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §4. When the dust settles, [`HANDOFF.md`](./HANDOFF.md) — *installed in this same SYS1 sprint*.
