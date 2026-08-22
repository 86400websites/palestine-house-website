# Error Tracking Guide — how problems get caught, fixed, and closed

> Written for the owner. Your job in this system is never to read a log. You read plain English and make three decisions: **how urgent**, **approve the fix**, **send the message**.
>
> Entry point: [`00-START-HERE.md`](./00-START-HERE.md) · Setup: [`SETUP-CHECKLIST.md`](./SETUP-CHECKLIST.md) · The skill that does the work: [`/handle-error`](../../.claude/skills/handle-error/SKILL.md)

## 🟡 Status: INSTALLED at SYS1, ACTIVATED IN SYS3

**There is zero Sentry code in this repository today.** No `@sentry/nextjs`, no `instrumentation.ts`, no `sentry.*.config.*`, no `sentry` match in `src/`, no `SENTRY` name in `.env.example` — all verified at SYS1. The two error boundaries — [`src/app/error.tsx`](../../src/app/error.tsx) and [`src/app/global-error.tsx`](../../src/app/global-error.tsx) — are real and they render a calm page, but each destructures only `reset`: **they report nothing to anybody**. A Production crash today is invisible until a human writes in.

Everything below describes the system **as it will work once sprint SYS3 switches it on** ([`../ROADMAP.md`](../ROADMAP.md) Stage 5). Door B — a person reports something and `/handle-error` investigates — already works, minus the Sentry half of the evidence.

---

## 1. ⚠️ The one technical decision: Sentry vs this site's CSP (D-SYS-10)

Read this before SYS3 is planned. It is the only thing in this module that can make a correct-looking install report nothing.

**The conflict.** [`next.config.ts`](../../next.config.ts) ships a deliberately tight Content-Security-Policy on every route, including **`connect-src 'self'`**. Sentry's browser reporting sends each event by POSTing to Sentry's own **ingest origin** (the host inside the DSN). `connect-src 'self'` blocks exactly that. The block is quiet: the site keeps working, the SDK looks installed, the dashboard stays empty.

**Three places say the allow-list is YouTube-only**, and all three are wrong the moment Sentry ships:

| Where | What it says today |
|---|---|
| [`next.config.ts`](../../next.config.ts), the comment above the policy | *"The only planned extension is the YouTube embed origin… connect-src/form-action stay 'self'."* |
| [`../../CLAUDE.md`](../../CLAUDE.md), the Hosting note | *"the CSP allow-list is extended only for the YouTube embed origin (resolved decision D1)"* |
| [`../TECH-ARCHITECTURE.md`](../TECH-ARCHITECTURE.md) | *"CSP extended for the youtube-nocookie origin only"* |

**The decision is already made. Do not reopen it.** **D-SYS-10** (owner, 2026-08-21 — [`../PROJECT-STATUS.md`](../PROJECT-STATUS.md) §4, with the verified finding behind it in [`../notes/system-compliance-audit-2026-08-21.md`](../notes/system-compliance-audit-2026-08-21.md) → *Decision log*):

> Add the DSN's **ingest origin** to `connect-src`, and update the `next.config.ts` comment, the `CLAUDE.md` Hosting note and `TECH-ARCHITECTURE.md` **in the same PR**, superseding the YouTube-only phrasing. `worker-src` is touched only if Session Replay is ever enabled — it is not in SYS3's scope.

Consequences to carry into the sprint:

- The DSN must exist **before** the CSP line can be written, because the DSN names the origin. That is why `SETUP-CHECKLIST.md` Part 1 is the owner's and comes first.
- A CSP change makes SYS3 a **risky diff** under **D-SYS-1** — independent review is mandatory, over an immutable `merge-base..head` range, with the record saved in [`../code-reviews/`](../code-reviews/) and no merge over a Blocking finding ([`../WORKFLOW.md`](../WORKFLOW.md) §8).
- The verification is behavioural, not textual: on the Preview, an error must actually appear in Sentry, with **no CSP violation in the console**. Until then the change is unproven. See [`../BROWSER-TOOLS.md`](../BROWSER-TOOLS.md) and [`../templates/VERCEL-PREVIEW-TEST-TEMPLATE.md`](../templates/VERCEL-PREVIEW-TEST-TEMPLATE.md) — both currently say a CSP violation for any origin other than the YouTube embed is a real finding, and both already flag the Sentry origin as the SYS3 exception.
- [`../SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) §10 (security headers) is re-walked in the same PR; §9's *"PII is minimized in logs; Sentry scrubs request bodies"* box becomes tickable once scrubbing is configured.

**The alternative that was NOT chosen, and why it is not free here.** `withSentryConfig` offers a `tunnelRoute` — the browser posts to a same-origin path (e.g. `/monitoring`) and the server forwards it, so `connect-src 'self'` needs no change. On this codebase that is not free: [`src/middleware.ts`](../../src/middleware.ts)'s matcher excludes only build assets and metadata files, so **every single error event would run `updateSession` first** — a Supabase session refresh on a path that has no business touching auth, on every browser error, plus the extra serverless invocations. Making it safe would mean carving an exception into the middleware matcher, which is the file that guards session handling site-wide. Widening one CSP directive by one named origin is the smaller, more honest change.

---

## 2. What Sentry is

A black-box recorder for the website. Free account, one key, installed once. From then on, whenever an error happens to a real user — any page, any device — Sentry records **who** (their account identifier, if signed in), **which page**, **which device and browser**, **what the error said**, and **their last few clicks** before it broke. Then it emails you.

What that means in practice: when a partner writes *"it broke when I tried to open the guide"*, you do not ask twenty questions. Their answer is already recorded.

**Four roles matter here**, and Sentry will tell them apart once user context is on ([`SETUP-CHECKLIST.md`](./SETUP-CHECKLIST.md) Part 2): an **anonymous visitor** on the public shell · a **pending partner** whose account exists but is not approved · an **approved partner** inside the platform · an **HQ admin**. "Which partner hit this, and were they approved?" is the first question of almost every incident on the gated side.

## 3. The two doors in

**Door A — Sentry finds it first (most cases, once SYS3 ships).** You get an alert email, often before anyone has noticed. Forward it, or say: *"/handle-error — new Sentry alert, here's the link."*

**Door B — a person reports it (works today).** A partner or applicant writes in: the application never went through, they cannot sign in, the download does nothing. You paste their message: *"/handle-error — a partner reported this: [their message]."* Claude Code reconstructs what happened from the logs this site has.

⚠️ **This repository is public.** When you hand a report over, keep the person's identity out of anything that gets committed. Give the identifying detail in chat if the investigation needs it; the incident log, the PR and the commit message refer to them only as *"one partner"* or by an incident number. Never paste a password anywhere, and never ask for one.

Either way you get back **one plain paragraph**: what actually happened, who was affected (this one person / some / everyone), whether it is a bug at all, and a proposed severity.

## 4. The lane — every incident, both doors, same five steps

1. **Understand.** Claude Code investigates and explains in plain words. If the logs show nothing, it reproduces the problem in a real browser before concluding anything ([`../BROWSER-TOOLS.md`](../BROWSER-TOOLS.md)). *"Couldn't find the cause"* is a status, never a conclusion.

2. **Decide severity.** This is the brake that stops the system exhausting you. Not everything is a fire drill.

   | Severity | Means, on this site | You respond |
   |---|---|---|
   | **Blocker** | The site is down · nobody can sign in · the **approval gate** is wrong in either direction (gated content reachable without approval, or an approved partner locked out) · applications are not being saved | Fix **today**. If gated content is exposed or the site is truly down, revert first and fix second — [`../ROLLBACK.md`](../ROLLBACK.md) (and [`../ROLLBACK-RUNBOOK.md`](../ROLLBACK-RUNBOOK.md) if a migration is involved) |
   | **High** | A real feature broken for some people — template downloads failing, a guide page erroring, Ask HQ not reaching HQ, approval emails not sending | Fix sprint **this week** |
   | **Medium** | Annoying, but everything works | [`../POST-LAUNCH-BACKLOG.md`](../POST-LAUNCH-BACKLOG.md), next sprint |
   | **Low** | Cosmetic | Backlog |

   An exposure of approval-gated content is a **Blocker by definition** — [`../SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) §15 is the invariant list, and the gate is the first item on it.

3. **Fix.** A normal bug-fix sprint — branch → PR → Preview → review → merge ([`../WORKFLOW.md`](../WORKFLOW.md) §6–§12). Nothing new to learn. The prompt skeleton is [`../templates/BUG-FIX-PROMPT-TEMPLATE.md`](../templates/BUG-FIX-PROMPT-TEMPLATE.md). If the fix touches auth, the approval gate, RLS or schema, env handling, the security headers or the CSP, independent review is **mandatory** (**D-SYS-1**, [`../WORKFLOW.md`](../WORKFLOW.md) §8).

4. **A new test, always.** The fix is not done until a test exists that reproduces this exact bug — failing on the broken version, passing on the fixed one, and joining the launch-gate suite forever (and the morning check, if it is critical). This is what makes the system compound: **the same bug cannot quietly come back**.

   ✅ **Available since SYS2 (2026-08-22).** The suite is `tests/e2e/`, run with `pnpm run test:e2e` against a deployed Preview. Write the regression spec there, add its line to `docs/FEATURE-LIST.md` for owner approval, and only then mark the incident Closed. (CI still runs typecheck, lint, build, gitleaks and `pnpm audit` with no test step — the suite runs against Previews, not in CI.)

5. **Tell the person, close the log.** Sentry shows exactly who was hit, so you message exactly those people — [`templates/USER-UPDATE-TEMPLATE.md`](./templates/USER-UPDATE-TEMPLATE.md). A row in `docs/INCIDENT-LOG.md` cannot be marked Closed until **user informed** is ticked, or *"n/a — caught before anyone was affected"* is recorded. The loop always ends with a human hearing from you. That is how a bug becomes a trust moment instead of a churn moment — and on a site whose whole conversion is an application reviewed by HQ, trust is the product.

## 5. What Sentry cannot see — and who covers it

Sentry catches things that **crash**. This site's most likely failures do not crash: the email that never arrived, the form that succeeded into a void. Nothing threw, so Sentry has nothing.

The real silent-failure surfaces here, verified in the code:

| Surface | The silent failure | Where the answer is |
|---|---|---|
| **`/apply`** (apply = sign-up: one form creates the pending account **and** the application) | The account and application save, then the confirmation email to the applicant and the notice to HQ are sent **best-effort** — a Resend failure is caught, logged to the server console and deliberately allowed to pass, because it must never block a sign-up. The applicant sees success and hears nothing. | Vercel logs · the Resend delivery log · the `applications` row in the database |
| **`/apply` → Mailchimp tag** | The `applicant` tag is best-effort under the same rule. Failure is invisible. | Vercel logs · Mailchimp |
| **Approval at `/admin/approvals`** | `is_approved` flips correctly and the platform unlocks, but the approval or decline **email** is best-effort too. The partner is approved and never told. | The Resend delivery log · the `profiles` row |
| **Password reset (`/forgot-password`)** | The page **always** shows the same neutral confirmation, on purpose, so it never reveals whether an address is registered. It looks identical whether Supabase Auth sent the mail or not. | Supabase Auth logs · the person's spam folder |
| **Ask HQ on `/support`** | The question is validated and written through the approved-only RPC, then emailed to HQ via Resend with the sender's account address as reply-to. The write can succeed while the email does not arrive. | The Resend delivery log · the support request row |
| **Contact form** | Server-side Route Handler → Resend. Same shape. | The Resend delivery log |
| **Template download** | Templates live in a **private** Storage bucket and are handed out as short-lived server-issued signed URLs to approved partners only. A download can fail from an expired link, a missing object, or a caller who is not approved — the last of which is the gate **working**. | Vercel logs · Storage · the caller's approval status |
| **A guide page** (`/{section}/{topic}/guide`) | This one usually *does* crash, so Sentry will catch it once SYS3 ships. | Sentry |

`/handle-error` knows this table and checks the right places. You never need to know which log holds the answer. Two standing rules it follows: **production is read-only from here** ([`../SUPABASE-MCP-SAFETY.md`](../SUPABASE-MCP-SAFETY.md) — `supabase-test` is read/write, `supabase-prod-readonly` is read-only, and nothing writes to Production through any channel), and once SYS2 ships, the **morning check** re-runs the critical journeys daily, which is what catches a silent failure nobody reported.

## 6. "It didn't go through" — read this before panicking

Most reports are not bugs, and on this site the most common of them are these. `/handle-error` will tell you plainly which case you are in.

- **"I applied and never heard anything."** Usually the application is saved and the confirmation email did not arrive, or landed in spam — see §5. The site did its job; the person needs telling. Not a bug unless the row is missing.
- **"I was approved but nothing changed."** The gate unlocks on approval with no re-login needed. If it genuinely did not unlock, that is a **Blocker**. If it did and they were looking at a stale tab, it is a refresh.
- **"I can't sign in."** Check *which role*. A pending partner **is** blocked from the platform, correctly (see §7). An approved partner who cannot get in is High or Blocker.
- **"The download does nothing."** Expired signed URL, or a caller who is not approved. The second is the gate working.

There is **no payment failure case on this site**, because there is no payment surface — no Stripe, no checkout, no card flow, no store, no donations. If a message mentions paying for anything, it is not about this website.

## 7. Access denied — often the system working

*"I can't get in"* is frequently the approval gate doing exactly what it exists to do: the account is **pending** and HQ has not approved it, or it was declined. `/handle-error` checks whether the denial was **correct** before treating it as a bug. If it was correct, the reply explains their real status kindly — that is support, not a fix, and it closes the incident as "not a bug".

One deliberate exception worth remembering: **`/account` is session-gated only, by design.** A pending partner must be able to set their name and password while they wait. Someone who is pending reaching `/account` is not a leak.

## 8. Privacy, in one paragraph

Sentry stores technical details plus the account identifier so you can help the person — never passwords. There are no card numbers anywhere in this system, because there is no payment surface at all. SYS3 configures Sentry's data scrubbing during install, which is what makes [`../SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) §9's *"PII is minimized in logs; Sentry scrubs request bodies"* box tickable. When you hand a report to `/handle-error`, the person's email is enough — and because **this GitHub repository is public**, that email must never reach a committed file, a commit message, a PR description or an issue. Gated partner content, storage paths and applicant identities stay out of all of them too. Never ask a user for a password, and never paste one anywhere.

## 9. Your weekly five minutes

Open `docs/INCIDENT-LOG.md` (created in SYS3). Every row should be moving toward Closed. Every Closed row has its regression test and its **user informed ✓**. Repeating patterns — three incidents on the same form, or the same email path failing twice — go in the log's *Patterns corner*, and are worth asking whether something deeper needs its own sprint. That is the whole job.

---

Next step → [`SETUP-CHECKLIST.md`](./SETUP-CHECKLIST.md). It ends with a deliberate test error, so the first alert you ever receive is one you were expecting. **Nothing on it is done yet.**
