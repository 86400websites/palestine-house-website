# ENV-VARS-SAFETY.md — Environment Variables, In Plain English

The owner-readable explanation of how configuration values and secrets work on **Palestine House**. Read it once so the rules make sense; follow the rules every time after.

> **This document explains. It does not decide.**
> The binding rules live in two places and only two places:
> - [`WORKFLOW.md` §14 — Supabase & environment-variable safety](./WORKFLOW.md) (the procedure)
> - [`CLAUDE.md` → "Protect env vars and Supabase secrets"](../CLAUDE.md) (the build-agent rule)
>
> The full per-variable matrix — which variable goes in which Vercel scope, Supabase client setup, auth redirect URLs — lives in [`SUPABASE-VERCEL-SETUP.md`](./SUPABASE-VERCEL-SETUP.md).
> If this page ever disagrees with any of those, **they win and this page is wrong** — fix it here.
> Everything below is explanation, real variable names, and the traps that are specific to this project.

---

## What an environment variable is

An environment variable is a named value the app reads when it builds or runs — "which database do I talk to", "what is the email provider's key". It lets the same code run on your laptop, on a Vercel Preview, and on Production with three different values, and it keeps secrets out of the repo.

**The code contains the NAME. The value lives outside the repo.** That is the whole idea. `src/lib/resend/client.ts` says `process.env.RESEND_API_KEY`; the actual key is typed into the Vercel dashboard and nowhere else.

---

## The two classes

Everything on this project falls into one of two buckets, and the **name itself** tells you which.

### PUBLIC — anything named `NEXT_PUBLIC_*`

- Next.js **inlines these into the JavaScript the browser downloads, at build time**. Anyone can read them by opening dev tools.
- Treat them as world-readable, permanently. There is no undo.
- Only ever: URLs, publishable (RLS-bound) keys, and site config.
- **If you wouldn't print it on the homepage, it does not get the `NEXT_PUBLIC_` prefix.**

### PRIVATE — everything else

- Provider API keys, secret keys, passwords, tokens.
- Read **only** in Server Components, Route Handlers, Server Actions, or `instrumentation.ts` — never in a Client Component, never passed down as a prop.
- The prefix is not decoration. It is the boundary between "public forever" and "secret". **One misprefixed variable is a full leak.**

---

## This project's actual variables

These are the real names, taken from the committed `.env.example`. **Names only — this document never carries a value, and neither does `.env.example`.**

### Public / browser-safe (`NEXT_PUBLIC_*`)

| Name | What it is | Live in the code today? |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata, sitemap, robots, OG; last-resort fallback for auth redirects | Yes — `src/lib/site.ts`, `src/lib/safe-redirect.ts` |
| `NEXT_PUBLIC_SUPABASE_URL` | The Supabase project URL | Yes — browser, server and middleware clients |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The browser-safe Supabase key (`sb_publishable_…`), bound by Row Level Security | Yes — browser, server and middleware clients |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile widget key (public half) | **No — name reserved, arrives in SYS1.5** |

### Server-only secrets (never `NEXT_PUBLIC_`, never in client code)

| Name | What it is | Live in the code today? |
|---|---|---|
| `RESEND_API_KEY` | Resend transactional email | Yes — `src/lib/resend/client.ts` |
| `RESEND_FROM_EMAIL` | The verified sending address | Yes — `src/lib/resend/client.ts` |
| `RESEND_TO_EMAIL` | The inbox that receives contact + support + application notices | Yes — contact route, `src/lib/auth/actions.ts`, `src/lib/support/actions.ts` |
| `MAILCHIMP_API_KEY` | Marketing email | Yes — `src/lib/mailchimp/client.ts` (dormant, see below) |
| `MAILCHIMP_SERVER_PREFIX` | Region suffix on the Mailchimp key | Yes — same file |
| `MAILCHIMP_AUDIENCE_ID` | Target audience/list | Yes — same file |
| `SUPABASE_SECRET_KEY` | The RLS-bypassing Supabase key (`sb_secret_…`) | **No — name reserved only. Nothing in `src/` reads it, and nothing should without a recorded decision.** |
| `UPSTASH_REDIS_REST_URL` | Rate-limiter endpoint | **No — name reserved, arrives in SYS1.5** |
| `UPSTASH_REDIS_REST_TOKEN` | Rate-limiter token | **No — name reserved, arrives in SYS1.5** |
| `TURNSTILE_SECRET_KEY` | Turnstile server-side verification | **No — name reserved, arrives in SYS1.5** |

**Owner-decision context**, recorded in [`PROJECT-STATUS.md` §6](./PROJECT-STATUS.md):

- **Mailchimp is dormant** by owner decision E1 (2026-07-09) — no account, no keys planned. The code stays a clean no-op.
- **Resend is provisioned, but not yet proven end to end** — sending domain verified, and `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `RESEND_TO_EMAIL` are set in Vercel Production and Preview. §6 still records two remaining owner steps: **redeploy Production**, then work the live-test matrix in [`EMAIL-SETUP-CHECKLIST.md`](./EMAIL-SETUP-CHECKLIST.md). Until that runs, treat delivery as unverified — see Trap 2.
- **Upstash and Turnstile are not provisioned.** The owner supplies those accounts at **SYS1.5** ([`ROADMAP.md`](./ROADMAP.md)). Until then, public writes are unthrottled — that is known issue **#1** in [`PROJECT-STATUS.md` §7](./PROJECT-STATUS.md), not a bug to re-report.

### Supplied by Vercel, never set by hand

`VERCEL_ENV`, `VERCEL_URL` and `VERCEL_BRANCH_URL` are injected by the hosting platform. The code reads them server-side (`src/lib/env.ts`, `src/lib/safe-redirect.ts`) to tell a real Production deployment apart from a Preview and to derive the right auth-redirect origin. **Do not add these to the Vercel dashboard by hand** — you would be overriding the platform's own answer.

### Local-only, for the verification scripts

Some scripts under `scripts/` load `.env.local` directly and need names that are deliberately **not** in `.env.example`, because they are one operator's own test credentials: `TEST_PARTNER_EMAIL`, `TEST_PARTNER_PASSWORD`, and — for the one script that reads Production — `PROD_SUPABASE_URL`, `PROD_SUPABASE_PUBLISHABLE_KEY`, `PROD_ADMIN_EMAIL`, `PROD_ADMIN_PASSWORD`. These belong on the authorized operator's machine and nowhere else. They are never set in Vercel and never committed.

---

## Trap 1 — the two Supabase key types

Supabase issues **two** keys and they look similar enough to swap by accident. They are not interchangeable; one of them ends the project.

| | `sb_publishable_…` | `sb_secret_…` |
|---|---|---|
| Goes in | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `SUPABASE_SECRET_KEY` |
| Visible to the browser | **Yes, by design** | **Never** |
| Respects Row Level Security | Yes — it can only read what your policies allow | **No — it bypasses RLS entirely** |
| Replaces the old | `anon` key | `service_role` key |

**The frontend of this site uses exactly two Supabase variables and no others:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The browser client, the server client and the middleware client all read only those two.

Why the publishable key is safe to expose: every table is RLS default-deny, and the platform's data is read through hardened `SECURITY DEFINER` RPCs that check `is_approved` server-side. A stranger holding the publishable key gets exactly what an anonymous visitor gets: nothing gated.

Why the secret key is not: it ignores all of that. Pasting `sb_secret_…` into a `NEXT_PUBLIC_` name would publish, to every visitor, a key that can read every partner's account, every application and every private template. That is why `SUPABASE_SECRET_KEY` is a reserved name with no reader in `src/` — and why adding one needs a plan first, per `CLAUDE.md`.

**Also never in client code, ever:** the Supabase JWT secret, the database password, or a direct database connection string.

---

## Trap 2 — a missing variable looks like "working", not "broken"

This is the trap that costs the most time on this project, so it gets its own section.

**Every integration here is written to no-op cleanly when its variables are absent.** That is deliberate — it means a fresh clone runs and a Preview deploys without provisioning five accounts. But it also means:

> A form that "submitted successfully" on Preview may have sent no email at all.

`src/lib/resend/client.ts` returns `{ configured: false }` and logs a notice rather than throwing when `RESEND_API_KEY` or `RESEND_FROM_EMAIL` is missing. Mailchimp behaves the same way. Upstash, Turnstile, PostHog and Sentry are all specified to behave the same way when they arrive.

The one guard against silently dropping real messages is the **fail-closed-in-Production** rule: on a real Production deployment the public contact route returns an error rather than a fake success when Resend or the destination inbox is unconfigured. It tells Production apart from Preview using `VERCEL_ENV`, because `NODE_ENV` is `"production"` on Vercel Preview builds too — checking `NODE_ENV` alone would make Preview fail closed by mistake.

**What this means for you:** after adding or changing any integration variable, **verify the feature on the deployed site**, not just that the page loaded. "No error" is not evidence. See [`SECURITY-CHECKLIST.md` §8 and §15](./SECURITY-CHECKLIST.md) for the abuse-control and public-write invariants these integrations have to satisfy.

---

## Trap 3 — Preview must never point at Production

Production and non-production are **separate Supabase projects**. Both refs are recorded in [`PROJECT-STATUS.md` §6](./PROJECT-STATUS.md); Preview and Development env vars point at the non-production one.

Two things go wrong when that slips:

1. **Preview testing mutates real partner data.** Sign-ups, approvals and admin actions taken while testing a PR would land in the live database.
2. **Preview auth emails send people to Production.** A password-reset created on a Preview deployment links back to the live site, so the tester never exercises the branch they are testing.

So: same names everywhere, **environment-specific values**. Never copy a Production value into Preview — least of all the Supabase credentials or `NEXT_PUBLIC_SITE_URL`. The redirect-URL configuration that makes this work is in [`SUPABASE-VERCEL-SETUP.md`](./SUPABASE-VERCEL-SETUP.md) → "Auth redirect & Site URL guidance".

The same separation governs database access from a machine: `supabase-test` is read/write, Production is read-only, and the rules are in [`SUPABASE-MCP-SAFETY.md`](./SUPABASE-MCP-SAFETY.md). Migrations are applied by hand in the Supabase SQL Editor, **non-production first** (`WORKFLOW.md` §14).

---

## Where each value lives

| Place | What it holds | Committed? |
|---|---|---|
| **Vercel → Settings → Environment Variables, Production scope** | The real values the live site uses | No — dashboard only |
| **Vercel → Settings → Environment Variables, Preview scope** | The same names, non-production values (non-production Supabase project; test-mode keys for any paid provider) | No — dashboard only |
| **Vercel → Settings → Environment Variables, Development scope** | Only needed if you use `vercel dev` / `vercel env pull`; otherwise local values live in `.env.local` | No — dashboard only |
| **GitHub Actions secrets** | **Nothing app-related today.** The `CI` workflow's `verify` job (`.github/workflows/ci.yml`) runs install, typecheck, lint and build with no application env vars — it sets only `NEXT_TELEMETRY_DISABLED`, and the gitleaks secret scan uses the automatic `GITHUB_TOKEN`. Nothing needs adding here unless a future sprint says so. | n/a |
| **`.env.local` on the operator's machine** | The real local values, plus the `TEST_PARTNER_*` / `PROD_*` script credentials | **No — gitignored** (`.gitignore` covers `.env` and `.env*.local`) |
| **`.env.example` in the repo** | Variable **names** and explanatory comments only. One live line, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`; every secret name is present but commented out and blank. | **Yes — and it is the only env file in git** |

Get started locally by copying the template: `cp .env.example .env.local`, then fill in only what you need.

---

## What never gets committed

- `.env.local` — ever. `git status` before every commit; `WORKFLOW.md` §9 and §10 both check this.
- Any file containing a real value: notes, docs, PR descriptions, screenshots, chat messages, commit messages, "temporary" scratch files.
- The only env file in git is `.env.example`, names and placeholders only.

**Build agents specifically:** never open, print, copy or edit `.env.local`. Verify a file's ignored/tracked state without reading its contents. This is a `CLAUDE.md` rule, not a preference.

**A backstop, not a substitute:** CI runs a **gitleaks** secret scan over the full history of every PR and fails the run on a hit. Treat it as the net that catches the mistake you already made, not as permission to be careless.

---

## The change procedure — adding or changing a variable

1. Add the **NAME** (never the value) to `.env.example`, marked public or server-only, and note it in the PR description — names only. `WORKFLOW.md` §10 requires this.
2. The **owner** sets the real value in **Vercel → Settings → Environment Variables** for each scope that needs it, using environment-specific values, and in their own `.env.local` where local work needs it.
3. **Redeploy.** This is the step everyone forgets. Existing deployments do not pick up a changed value. `NEXT_PUBLIC_*` values are baked in at **build time**, so they need a fresh build; server-only values are read at **runtime** per deployment.
4. **Verify the feature actually works on the deployed site** — see Trap 2. A silent no-op looks exactly like success.

**Review.** A PR that wires a variable into code is env handling, which is one of the risky categories under **D-SYS-1** ([`PROJECT-STATUS.md` §4](./PROJECT-STATUS.md)): it takes an independent review over the immutable `merge-base..head` SHA range, the record saved under [`docs/code-reviews/`](./code-reviews/), and no merge over a Blocking finding. The mechanics are [`WORKFLOW.md` §8](./WORKFLOW.md); D-SYS-1 is what upgrades that pass from optional to mandatory here.

---

## The leak procedure — if a secret gets exposed

1. **Rotate the key at the provider immediately.** First. Before cleanup, before working out how it happened, before telling anyone.
2. The owner sets the new value in every affected Vercel scope and local machine, then **redeploys**.
3. *Then* clean up: remove the value from wherever it leaked, and fix the process that let it out.
4. Record it in [`PROJECT-STATUS.md` §7](./PROJECT-STATUS.md) (known issues) or §8 (change log), depending on whether anything remains open.

**Why rotation comes first:** git history, forks, CI logs, caches and screenshots are forever. The key was compromised the moment it was exposed. Scrubbing history is not a fix — a dead key is.

If a build agent suspects a leak, it reports the **file, line and secret type only** — never the value — and tells the owner to rotate.

---

## Names arriving in later sprints

Listed here so nobody adds them early or wonders where they went. **No code in the repo reads any of these today** — the four SYS1.5 names are reserved (commented out) in `.env.example`; the rest exist nowhere yet.

| Name | Arrives in | Notes |
|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | **SYS1.5** | Names already reserved in `.env.example`; no code reads them yet. Owner supplies the accounts. |
| `PLAYWRIGHT_BASE_URL` | **SYS2** | Points the Playwright suite at the deployed Preview under test. |
| A Preview-protection bypass secret (Vercel's `VERCEL_AUTOMATION_BYPASS_SECRET`) | **SYS2, only if needed** | Required only if Vercel Preview protection is on and the test runner has to get past it. The owner confirms Preview's protection status at the start of SYS2; do not add it speculatively. |
| The **Sentry DSN** variable | **SYS3** | Name to be fixed in that sprint — the stack template in [`SUPABASE-VERCEL-SETUP.md`](./SUPABASE-VERCEL-SETUP.md) uses `NEXT_PUBLIC_SENTRY_DSN`, but nothing is decided until SYS3 installs it. SYS3 also carries **D-SYS-10**: the CSP's `connect-src` gains the Sentry ingest origin. Today `next.config.ts` ships `connect-src 'self'`, and the only third-party origin anywhere in the policy is the privacy-enhanced YouTube embed origin on `frame-src`. |

> **A note on `SUPABASE-VERCEL-SETUP.md`:** that document is the reusable stack template and its example blocks list variables this repo has not adopted — `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`. None of them appear in this repo's `.env.example` and none are read anywhere in `src/`. **This page's tables above are the current truth for what exists;** that page is the reference for how the Vercel/Supabase wiring is set up.

---

## The short version

- The `NEXT_PUBLIC_` prefix means public forever. Everything else is a secret.
- The frontend uses exactly two Supabase variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `sb_secret_…` never goes near the browser.
- `.env.local` is never committed. `.env.example` is names only.
- Preview points at the non-production Supabase project, never Production.
- Changing a variable requires a **redeploy**, then a real check on the deployed site — because a missing variable makes a feature go quiet, not loud.
- If a secret leaks: **rotate first**, clean up second.

Next step → the binding procedure is [`WORKFLOW.md` §14](./WORKFLOW.md); the per-variable Vercel/Supabase wiring is [`SUPABASE-VERCEL-SETUP.md`](./SUPABASE-VERCEL-SETUP.md); the pre-merge security gate is [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md).
