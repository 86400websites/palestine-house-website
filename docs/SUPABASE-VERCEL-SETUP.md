# Supabase + Vercel Setup — Palestine House

## Palestine House project values

| Placeholder | Value |
|---|---|
| `[PROJECT_NAME]` | `palestine-house` |
| `[BRAND_NAME]` | Palestine House |
| `[PRODUCTION_DOMAIN]` | **TBD** — decide before Stage 1 launch; until then the site lives on the Vercel default domain |
| `[VERCEL_PROJECT_NAME]` | `palestine-house` (create at Stage 1) |
| `[VERCEL_TEAM_SLUG]` | **TBD** — read from the Vercel dashboard at Stage 1 |
| `[SUPABASE_PROJECT_REF]` (production) | **TBD** — created in Sprint 2 |
| `[SUPABASE_PROJECT_REF]` (non-production) | **TBD** — separate project for Preview/local; created in Sprint 2 |

This site **uses auth + DB** (approval-gated partner platform), so the full Supabase setup below applies. Auth routes to cover in the redirect rules: `/login`, `/forgot-password`, `/update-password`, `/apply` (sign-up), `/dashboard` (post-login landing). `SUPABASE_SECRET_KEY` is expected to be needed only for trusted admin/server paths (e.g. approval operations) — prefer hardened `SECURITY DEFINER` RPCs first. Record the final values here (names/refs only, never keys) when each is created, and mirror them in `PROJECT-STATUS.md`.

> Reusable setup guide for connecting a new website to **Supabase** (auth + database) and **Vercel** (hosting) safely. Companion to [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md) (the env-var model and Supabase architecture), [`WORKFLOW.md`](./WORKFLOW.md) (the deploy loop), and [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md). Replace every `[PLACEHOLDER]` with the real value for the project.

## Purpose

Lock down, for one website, the **environment variables** and the **Supabase Auth redirect URLs** across four contexts: local development, Vercel Preview, Vercel Production, and the future custom domain — so that secrets never leak, the right client uses the right key, and auth emails always send users back to the origin they came from.

This guide is intentionally limited to **deployment, auth, and environment configuration**. It does not define routes, design, copy, or table policies (those live in the code and SQL).

## When to use it

- Standing up a brand-new project that needs accounts or a database.
- Adding Supabase auth/DB to an existing site for the first time.
- Connecting the repo to Vercel and setting environment variables.
- Migrating to a custom domain (`[PRODUCTION_DOMAIN]`).
- Debugging "my password-reset email sent me to the wrong site" or "my env var didn't take effect."

> If the site does **not** need auth or a database, skip Supabase entirely — you only need `NEXT_PUBLIC_SITE_URL` plus any optional integration vars.

## Default stack assumptions

- Next.js 15 (App Router), TypeScript strict, pnpm, deployed on **Vercel**.
- Supabase via **`@supabase/ssr`** — separate browser and server clients, plus `middleware.ts` cookie-backed session refresh.
- New Supabase **key format**: `sb_publishable_...` (browser-safe, replaces the old `anon` key) and `sb_secret_...` (server-only, replaces `service_role`). Old JWT-format keys still work, but new projects use the new format.
- Each optional integration **no-ops when its env vars are absent**, so local/Preview work without provisioning everything.

---

## Local environment variable setup

1. Copy the template: `cp .env.example .env.local`
2. Fill in only the values you need from the Supabase dashboard.
3. Confirm `.env.local` is listed in `.gitignore`. **Never commit it.**

**`.env.local` (placeholders only — never commit real values):**
```bash
# Canonical public origin for this environment (no trailing slash)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[SUPABASE_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=        # sb_publishable_... — browser-safe
SUPABASE_SECRET_KEY=                         # sb_secret_... — server-only, add ONLY if a server path needs RLS bypass

# Optional integrations (add only what this site uses; each no-ops when blank)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_SENTRY_DSN=
MAILCHIMP_API_KEY=
MAILCHIMP_SERVER_PREFIX=
MAILCHIMP_AUDIENCE_ID=
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@[PRODUCTION_DOMAIN]
RESEND_TO_EMAIL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

> Add `SUPABASE_SECRET_KEY` only when a trusted server path genuinely needs to bypass RLS (admin op, cron, webhook). Most sites do not need it at all.

---

## Vercel environment variable setup

In **Vercel → Settings → Environment Variables**, add the same **variable names** with **environment-specific values**, scoping each to the environments that need it (never copy a Production value — especially `NEXT_PUBLIC_SITE_URL` or production Supabase credentials — into Preview):

| Variable | Dev | Preview | Production | Public / server-only | Notes |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ | Public | Required by browser, server, and middleware clients. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | ✅ | ✅ | Public | Publishable key only — never the secret key here. |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | *prefer omit* (see auth guidance) | `https://[PRODUCTION_DOMAIN]` | Public | Canonical URL for metadata/sitemap/robots/OG + auth fallback. |
| `SUPABASE_SECRET_KEY` | only if needed | only if needed | only if needed | **Server-only** | RLS bypass. Add only for trusted server paths; never expose. |
| `MAILCHIMP_API_KEY` / `_SERVER_PREFIX` / `_AUDIENCE_ID` | optional | when newsletter tested | when newsletter live | **Server-only** | Marketing email. |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `RESEND_TO_EMAIL` | optional | when contact tested | when contact live | **Server-only** | Transactional email. |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | omit | optional | optional | **Server/build-time** | Source-map upload. |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | optional | optional | Public | Sentry no-ops when blank. |
| `NEXT_PUBLIC_POSTHOG_KEY` / `_HOST` | optional | optional | optional | Public | PostHog no-ops when blank. |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | optional | optional | recommended | **Server-only** | Rate limiter no-ops when blank. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | optional | optional | recommended | Public | Widget hidden when blank. |
| `TURNSTILE_SECRET_KEY` | optional | optional | recommended | **Server-only** | Server verification skipped when blank. |

Enable **"Automatically expose System Environment Variables"** if the project will use `VERCEL_URL` / `VERCEL_BRANCH_URL` to derive the deployment origin.

### Production / Preview / Development guidance

- **Separate Supabase project (or isolated branch/schema) for non-production.** Production, Preview, and Development should point at **different** Supabase URLs + keys so Preview/local testing never creates users or mutates rows in the production database. If a small project must share one, make non-prod access read-only and document the exception.
- **Production:** real values for everything the live site uses. `NEXT_PUBLIC_SITE_URL=https://[PRODUCTION_DOMAIN]`.
- **Preview:** the Supabase URL + publishable key, plus any feature you want to test. **Do not set Preview `NEXT_PUBLIC_SITE_URL` to the Production URL** (see auth guidance) — prefer leaving it unset, or set it to the exact Preview origin you're testing if Preview SEO canonicals need a value.
- **Development:** needed only if you use `vercel dev` / `vercel env pull`; otherwise local values live in `.env.local`.

---

## Frontend-safe variables (`NEXT_PUBLIC_*`)

These are **inlined into the client bundle at build time** and are public. Only put browser-safe values here:

- `NEXT_PUBLIC_SUPABASE_URL` — the project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the publishable key (RLS-bound, browser-safe).
- `NEXT_PUBLIC_SITE_URL` — canonical origin for metadata, sitemap, robots, OG, and as an auth redirect fallback.

## Server-only / private variable rules

- Read **only** in Server Components, Route Handlers, Server Actions, or `instrumentation.ts`.
- **Never** carry a `NEXT_PUBLIC_*` prefix.
- Examples: `SUPABASE_SECRET_KEY`, `MAILCHIMP_API_KEY`, `RESEND_API_KEY`, `SENTRY_AUTH_TOKEN`, `TURNSTILE_SECRET_KEY`, `UPSTASH_REDIS_REST_TOKEN`.

## Values that must NEVER appear in client code

- Supabase **secret key** (`sb_secret_...`) / legacy **`service_role`** key
- Supabase **JWT secret** and **database password** / direct DB connection string
- Any provider API key, auth token, or webhook secret
- Anything from `.env.local` that is not a `NEXT_PUBLIC_*` value

If any of these is ever exposed, **rotate it immediately** — do not try to scrub git history.

---

## Supabase browser client rules

- Created in `src/lib/supabase/client.ts` via `@supabase/ssr`.
- Uses **only** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- All access is subject to **Row Level Security** — assume the user can read only what RLS allows.
- Never imports or references the secret key.

## Supabase server client rules

- Created in `src/lib/supabase/server.ts` via `@supabase/ssr`, used in Server Components / Route Handlers / Server Actions.
- Reads/refreshes the session from cookies; `middleware.ts` keeps the session fresh on relevant requests.
- For normal user data, the server client also runs under the **user's session + RLS** — it does not need the secret key.
- Use `SUPABASE_SECRET_KEY` (RLS bypass) only in explicitly trusted server paths (admin/cron/webhook). Prefer a **`SECURITY DEFINER` RPC** for controlled reads/writes over handing out the secret key. SQL is applied by hand via the Supabase dashboard SQL Editor (this stack doesn't use CLI migrations).

---

## Auth redirect & Site URL guidance

The classic failure mode: a password-reset or signup-confirmation email created on a **Preview** deployment links back to **Production**. Prevent it:

- **Auth redirect URLs come from the request/deployment origin**, not a hardcoded Production URL. A typical origin helper prefers `x-forwarded-proto` + `x-forwarded-host` (then `host`), then `VERCEL_BRANCH_URL` / `VERCEL_URL`, then `NEXT_PUBLIC_SITE_URL`, then `http://localhost:3000`. **Validate the derived origin against an allow-list** (localhost, your production domain(s), the expected Preview pattern) before using it — a forged `x-forwarded-host` / `host` header must never produce an auth link to an attacker domain.
- **Canonical SEO URLs come from `NEXT_PUBLIC_SITE_URL`** (metadata, sitemap, robots, OG) — keep that separate from auth redirects.
- **Do not point Preview auth redirects at Production.** Leave Preview `NEXT_PUBLIC_SITE_URL` unset (or set to the exact Preview origin) rather than the Production URL.
- **Audit Supabase email templates.** Confirm the Confirm-signup, Magic-Link, Invite, and Reset-Password templates use `{{ .ConfirmationURL }}` / `{{ .RedirectTo }}` and do **not** hardcode `{{ .SiteURL }}` — otherwise Preview signup/reset emails still send users to Production even when `redirectTo` is correct.

**Supabase → Authentication → URL Configuration:**

- **Site URL** (default redirect target when no explicit `redirectTo` is given):
  ```
  https://[PRODUCTION_DOMAIN]
  ```
- **Redirect URLs** (wildcards cover route-specific paths like `/login`, `/update-password`):
  ```
  http://localhost:3000/**
  https://*-[VERCEL_TEAM_SLUG].vercel.app/**      # Vercel Preview wildcard
  https://[PRODUCTION_DOMAIN]/**
  https://www.[PRODUCTION_DOMAIN]/**               # only if www is a live hostname
  ```
- Add `/auth/callback` to the allow-list **only if** you introduce an OAuth flow that needs it. Keep the allow-list tight — local, Preview wildcard, Production only. No broad catch-alls.
- Remove stale old-stack URLs (e.g. `http://localhost:5000/**`, one-off Preview URLs) **only after** confirming no live deployment, email template, or saved test flow still uses them.

---

## Vercel Preview testing checklist

Every PR gets a Preview deployment. Test it before merge:

- [ ] Open the Preview URL from the PR
- [ ] Sign in / sign out work
- [ ] Sign up works and the confirmation email link points to the **Preview** origin (not Production)
- [ ] Forgot password → reset email link points to the **Preview** origin
- [ ] Update password from the email link works
- [ ] A protected route (e.g. account) redirects to login when signed out, with a valid `next=` target
- [ ] Any feature integration (newsletter/contact) either works or no-ops cleanly when its env vars are absent
- [ ] No console/runtime errors; layout intact on desktop + mobile

## Production deployment checklist

After merge to `main`:

- [ ] Production env vars are set (Supabase URL + publishable key + `NEXT_PUBLIC_SITE_URL=https://[PRODUCTION_DOMAIN]`, plus any live features)
- [ ] Supabase Site URL = Production; Redirect URLs include local + Preview wildcard + Production
- [ ] Watch the Production deploy finish, then test on the live domain: login, signup, forgot/update password, protected route
- [ ] Email links (signup confirm, password reset) resolve to Production
- [ ] Sitemap, robots, canonical URLs, and OG URLs use `https://[PRODUCTION_DOMAIN]`
- [ ] If a sending domain is used (Resend), it is verified (SPF/DKIM/DMARC)

## Environment-variable redeploy warning

> **Changing or adding an env var does not affect existing deployments.** You must **redeploy** for it to take effect. `NEXT_PUBLIC_*` values are inlined at **build time**; server-only values are read at **runtime** per deployment. After any env-var change in Vercel, trigger a redeploy and retest.

---

## Common setup mistakes

- ❌ Putting the secret key (or any secret) behind a `NEXT_PUBLIC_*` name.
- ❌ Using the secret/`service_role` key in browser or normal app paths instead of the publishable key + RLS.
- ❌ Setting Preview `NEXT_PUBLIC_SITE_URL` to the Production URL → Preview auth emails send users to Production.
- ❌ Forgetting to redeploy after an env-var change and assuming it took effect.
- ❌ Shipping tables with **no RLS** (default-allow) — must be default-deny from day one.
- ❌ Committing `.env.local`, or pasting real keys into docs/PRs/screenshots.
- ❌ Over-broad Supabase redirect wildcards that allow arbitrary origins.
- ❌ Leaving the rate limiter / CAPTCHA disabled in Production because their env vars were never set.
- ❌ Sharing one Supabase project across Production and Preview/Dev → Preview testing mutates production data.
- ❌ Relying on "no-op when env vars absent" for **production** forms or anti-abuse — live forms must fail closed, and rate limiting / CAPTCHA must be configured in Production.

## What to customize for each new website

- `[PRODUCTION_DOMAIN]`, `[VERCEL_PROJECT_NAME]`, `[VERCEL_TEAM_SLUG]`, `[SUPABASE_PROJECT_REF]`
- Which optional integrations are in scope (and therefore which server-only vars exist)
- The Supabase Site URL + redirect allow-list (local + your Preview wildcard + your domain)
- Whether `SUPABASE_SECRET_KEY` is needed at all (most sites: no)
- The exact auth routes (`/login`, `/signup`, `/update-password`, protected routes) the redirect rules must cover
