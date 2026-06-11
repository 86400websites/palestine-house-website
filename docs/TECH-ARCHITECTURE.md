# Tech Architecture — Core Reference

> **Project: Palestine House** — `palestine-house`. This file is the generic locked stack **plus** the Palestine House specifics below. When any other doc disagrees with this one about the stack, this one wins. The full route map, access model, and data notes live in `PH_Sitemap_Architecture_TECH.docx` (repo `/docs`); the sprint order lives in [`ROADMAP.md`](./ROADMAP.md); current state lives in [`PROJECT-STATUS.md`](./PROJECT-STATUS.md).

## 0. Palestine House — project architecture summary

**Two shells, one gate.** A thin, conversion-focused **public shell** and a private partner **reference platform**. Access is **approval-gated**: the single `/apply` form is also sign-up — submitting it creates a *pending* account and records the partner application; an HQ admin flips `profiles.is_approved` to unlock the platform. Reference content is never public. It is a reference, **not a course** (no quizzes, no certificate) and not a day-to-day ops tool. The single piece of per-user interactivity is the saved launch-checklist progress in Stages › Design & Build.

**Route map (locked — full detail in the sitemap doc):**

| Layer | Routes |
|---|---|
| Public | `/` · `/model` · `/experience` · `/bring-ph` · `/our-support` · `/live` (+ watch view) · `/apply` (= sign-up) · `/about` · `/contact` · `/focus-areas` (footer) · `/privacy` · `/terms` · `/login` · `/forgot-password` · `/update-password` |
| Gated (`is_approved = true`) | `/dashboard` (renders pending state too) · `/plan` · `/build` (saved checklist) · `/operate` · `/elements/[slug]` (×30) · `/live` partner tools · `/resources` · `/resources/[category]` · `/tools` (coming soon) · `/academy` · `/academy/[slug]` · `/account` · `/support` · `/search` (V1) |
| Admin (server-checked `admins`) | `/admin/approvals` (MVP-critical) · `/admin/content` (V1) · `/admin/partner-interest` (later) |

**Core data (Supabase):** `profiles` (incl. `is_approved`) · `applications` · `admins` · `elements` (30, MDX bodies) · `checklist_items` + per-user `checklist_progress` (200+ items, 3 gates) · `programming_sessions` (title, mode, status, venue, stream_url, recording_url, starts_at, cover — public read anon-safe, partner writes owner-scoped) · `resources` (metadata + private Storage bucket, signed URLs) · `academy_modules`. RLS default-deny on all; public projections via anon-safe RPCs expose titles/overviews only.

**Integrations in scope:** Supabase (auth + DB + Storage), Mailchimp (lead magnets `lead-booklet-a` / `lead-booklet-b`, newsletter, apply tagging), Resend (contact + transactional), Upstash (rate limiting), Turnstile (public forms), PostHog + Sentry (optional). Live Programming embeds via YouTube or Vimeo (decision pending — extend CSP for the chosen origin only).

**Blocking security invariants (never merge with one unresolved — also in [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) §15):** approval enforcement server-side in every workspace RPC; RLS default-deny everywhere; hardened `SECURITY DEFINER` RPCs; public writes zod + rate-limit + Turnstile, fail-closed in Production; no secret client-side; templates served only by server-issued signed URLs to approved users; admin via server-checked `admins` table; security headers + tight CSP.

---
---

## 1. Locked stack (default)

| Layer | Choice | Always on? |
|---|---|---|
| Framework | **Next.js 15** (App Router) | Yes |
| Language | **TypeScript** (strict mode) | Yes |
| Package manager | **pnpm 10** | Yes |
| Styling | **Tailwind CSS v4** | Yes |
| Components | **shadcn/ui** | Yes |
| Animation | **Framer Motion** | Yes |
| Forms | **react-hook-form + zod** | When the site has forms |
| Icons | **lucide-react** | Yes |
| Auth + Database | **Supabase** (`@supabase/ssr`) | Only if the site needs accounts/data |
| Hosting | **Vercel** | Yes |
| Source control | **GitHub** | Yes |
| Marketing email | **Mailchimp** | Optional |
| Transactional email | **Resend** | Optional |
| Analytics | **PostHog** | Optional |
| Error tracking | **Sentry** | Optional |
| Rate limiting | **Upstash Redis** | Optional (recommended for public write endpoints) |
| CAPTCHA | **Cloudflare Turnstile** | Optional (recommended for public forms) |

**Optional integrations must no-op cleanly when their env vars are absent**, so local dev and Preview deployments work without provisioning every provider up front. Add a provider only when a feature needs it.

---

## 2. Folder structure (App Router)

```
palestine-house/
├── .github/workflows/ci.yml          # install + typecheck + lint + build + secret scan on PR
├── .vscode/settings.json             # format on save, Tailwind IntelliSense
├── public/
│   └── assets/                       # site images, organized by feature subfolder
│       ├── home/hero.jpg             #   referenced from code as /assets/home/hero.jpg
│       ├── logo/
│       └── ...                       #   replace a file in place to update an image
├── src/
│   ├── app/
│   │   ├── layout.tsx                # metadata, fonts, providers
│   │   ├── page.tsx
│   │   ├── providers.tsx             # client providers (e.g. analytics)
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   ├── opengraph-image.tsx       # dynamic OG image
│   │   ├── global-error.tsx          # root error boundary (Sentry, if used)
│   │   └── api/
│   │       └── <name>/route.ts       # server-only Route Handlers (one per integration)
│   ├── components/
│   │   ├── ui/                       # shadcn components
│   │   ├── motion/                   # reusable Framer Motion primitives
│   │   └── ...                       # your components
│   ├── lib/
│   │   ├── utils.ts                  # cn() helper
│   │   ├── supabase/
│   │   │   ├── client.ts             # browser client
│   │   │   └── server.ts             # server client (SSR/RSC)
│   │   ├── validation/               # zod schemas (shared client + server)
│   │   └── <integration>/            # one folder per optional provider helper
│   └── styles/globals.css            # Tailwind v4 entry + design tokens
├── middleware.ts                     # Supabase cookie-backed session refresh (if auth)
├── instrumentation.ts                # server-side observability init (if used)
├── instrumentation-client.ts         # browser SDK init (if used)
├── .env.example                      # template; never holds real secrets
├── .gitignore                        # .env, .env*.local, .vercel, node_modules, .next  — plus !.env.example so the template stays tracked
├── eslint.config.mjs
├── components.json                   # shadcn config
├── next.config.ts                    # security headers, optional integration wrappers
├── tailwind.config.ts                # optional in Tailwind v4 (CSS-first); tokens live in globals.css @theme
├── tsconfig.json                     # "strict": true
├── vercel.json                       # framework: nextjs, install/build commands
├── package.json                      # packageManager pins pnpm
├── pnpm-lock.yaml                    # commit this — never package-lock.json / yarn.lock
└── README.md
```

> All images live under `/public/assets/` and are referenced by path (`/assets/...`), never imported as modules. To update an image, replace the file in place with the same name — no code change. Sizing/format guidance is in [`DESIGN.md`](./DESIGN.md).

---

## 3. Dependencies

**Core (always):**
```
next react react-dom typescript
tailwindcss @tailwindcss/postcss
class-variance-authority clsx tailwind-merge tw-animate-css
lucide-react
framer-motion
```

**When the site has forms:**
```
react-hook-form @hookform/resolvers zod
```

**When the site has auth/DB:**
```
@supabase/ssr @supabase/supabase-js
```

**Optional integrations (add only when used):**
```
@sentry/nextjs
posthog-js posthog-node
@mailchimp/mailchimp_marketing
resend
@upstash/redis @upstash/ratelimit
```

**Dev:**
```
@types/node @types/react @types/react-dom
eslint eslint-config-next
prettier prettier-plugin-tailwindcss
```

### Dependency rules

- Prefer the standard library and the stack above before adding anything new.
- Add a dependency only when it clearly earns its place (saves real complexity, well-maintained, reasonable size).
- Never swap the locked layers (framework, package manager, styling, hosting) without a deliberate, recorded decision.
- Pin `pnpm` via `packageManager` in `package.json`. Use `pnpm`, never `npm` or `yarn`.

---

## 4. App Router structure & conventions

- Routes live under `src/app/`. A folder with `page.tsx` is a route; `layout.tsx` wraps its subtree.
- API endpoints are **Route Handlers** under `src/app/api/<name>/route.ts` — never legacy `pages/api`.
- Use `loading.tsx`, `error.tsx`, and `not-found.tsx` where they improve UX.
- Co-locate route-specific metadata via the `metadata` export (or `generateMetadata`) for SEO.
- Dynamic routes use `[param]` segments; pre-render known paths with `generateStaticParams` where the data is static.
- File structure does **not** enforce access control — every protected route needs an explicit server-side auth check (see §11).

---

## 5. Server vs Client component rules

- **Server Components are the default.** Keep components on the server unless they need interactivity.
- Add `"use client"` only when a component needs state, effects, browser APIs, or event handlers.
- Server Components may read **server-only** env vars and call the server Supabase client / provider SDKs directly.
- Client Components may read **only** `NEXT_PUBLIC_*` env vars. Anything they touch is public.
- Never pass a secret from a Server Component into a Client Component as a prop — it ships to the browser.
- Keep data fetching and secret use on the server; pass already-safe, minimal data down to client components.

---

## 6. API route (Route Handler) rules

Route Handlers (`src/app/api/<name>/route.ts`) are server-only and are the right home for any call that uses a secret.

- **Validate every request body with zod** before acting on it. Treat all params, bodies, cookies, and headers as untrusted.
- Keep provider secrets here (or in Server Actions) — never in client code.
- **Rate-limit public write endpoints** (Upstash sliding window) and return `429` with `Retry-After` when exceeded.
- Add **CAPTCHA verification** (Turnstile) server-side on public forms when configured.
- Never return stack traces, credentials, internal URLs, or raw upstream error bodies to the client.
- An integration endpoint may **no-op cleanly** when its env vars are absent in **local/Preview** so they don't break. In **Production**, a live form or anti-abuse control (rate limit / CAPTCHA) must **fail closed** (reject the request) or be explicitly disabled — never silently drop user submissions or run unprotected.

---

## 7. Supabase architecture

Use Supabase only when the site needs auth or a database.

- **Use a separate Supabase project (or an isolated branch/schema) for non-production.** Production, Preview, and Development must not share one Supabase database, or Preview/local testing can create users or mutate production rows. Each Vercel environment points at its own Supabase URL + keys.
- Use **`@supabase/ssr`** — it provides separate clients for browser (`src/lib/supabase/client.ts`) and server (`src/lib/supabase/server.ts`).
- Session is cookie-backed and refreshed in `middleware.ts` on relevant requests. Cookies are set/refreshed by the server SSR client and middleware — not by client-only code.
- **Keys:**
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the `sb_publishable_...` key — replaces the old `anon` key) is browser-safe and subject to Row Level Security.
  - `SUPABASE_SECRET_KEY` (the `sb_secret_...` key — replaces the old `service_role` key) **bypasses RLS**. Use it only in trusted server contexts (admin ops, cron, webhooks). Old JWT-format keys still work, but new projects use the new format.
- **Row Level Security on every table from day one, default-deny**, then add policies.
- Prefer **`SECURITY DEFINER` RPCs** for controlled reads/writes (e.g. a server-graded action, a privacy-safe public projection) over broad table SELECT/INSERT policies. The app calls the RPC; the function decides what's allowed and what's returned.
- **Harden every `SECURITY DEFINER` function:** pin `search_path` (e.g. `set search_path = ''` with fully-qualified objects), authorize the caller with `auth.uid()` rather than trusting arguments, return only the narrow columns needed, and `revoke execute ... from public` then `grant execute` to `authenticated` (or the intended role) only — an unhardened definer function silently bypasses RLS.
- **No application path should use the secret/`service_role` key** for normal user reads/writes — every read/write goes through the user's own session under RLS, or a `SECURITY DEFINER` RPC the user is granted `execute` on.
- **SQL is applied by hand** via the Supabase dashboard **SQL Editor**, in order, one file at a time (this stack does not use the Supabase CLI migrations workflow). Keep numbered `.sql` up-files and `.down.sql` rollback files in the repo, and document the apply/rollback order in a `supabase/sql/README.md`. Apply changes to a **non-production** project first, keep them **backwards-compatible** so code and schema can deploy independently, and remember a Vercel rollback does **not** roll back the database — follow the database change protocol in [`WORKFLOW.md`](./WORKFLOW.md).

---

## 8. Environment-variable model

- `NEXT_PUBLIC_*` values are **inlined into the client bundle at build time** and are public. Anything sensitive must **not** carry this prefix.
- Server-only secrets are read **at runtime, per deployment**, and only in Server Components, Route Handlers, Server Actions, or `instrumentation.ts`.
- Commit **`.env.example`** (names + safe placeholders) only. `.env.local` is gitignored and never committed.
- Adding/changing a var in Vercel requires a **redeploy** to take effect.

**`.env.example` template (placeholders only):**
```bash
# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase (only if the site uses auth/DB)
NEXT_PUBLIC_SUPABASE_URL=https://[SUPABASE_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=          # sb_publishable_... — browser-safe
SUPABASE_SECRET_KEY=                           # sb_secret_... — server-only, never expose

# Optional analytics / error tracking
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=                             # server/build-time only (source maps)
SENTRY_ORG=
SENTRY_PROJECT=

# Optional marketing email (Mailchimp) — server-only
MAILCHIMP_API_KEY=
MAILCHIMP_SERVER_PREFIX=
MAILCHIMP_AUDIENCE_ID=

# Optional transactional email (Resend) — server-only
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@[PRODUCTION_DOMAIN]
RESEND_TO_EMAIL=

# Optional hardening
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=                       # server-only
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=                           # server-only
```

**Public vs server-only at a glance:**

| Public (`NEXT_PUBLIC_*`, browser-safe) | Server-only (never `NEXT_PUBLIC_*`) |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `SUPABASE_SECRET_KEY` |
| `NEXT_PUBLIC_SUPABASE_URL` | `MAILCHIMP_API_KEY`, `MAILCHIMP_*` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `RESEND_API_KEY` |
| `NEXT_PUBLIC_POSTHOG_KEY` / `_HOST` | `SENTRY_AUTH_TOKEN` |
| `NEXT_PUBLIC_SENTRY_DSN` | `TURNSTILE_SECRET_KEY` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `UPSTASH_REDIS_REST_TOKEN` |

---

## 9. Vercel deployment model

```
main (protected, production)
  ↑  merge after CI green + Preview tested
feature/<short-description>  →  pushing the branch builds a Vercel Preview
  ↑
local dev
```

- Pushing a branch builds a **Preview** deployment. Merging to `main` builds a **Production** deployment.
- `vercel.json`: framework preset `nextjs`, install `pnpm install --frozen-lockfile`, build `pnpm run build`. App Router handles routing — no SPA rewrite/fallback.
- `next.config.ts` ships security headers (see §13) and wraps optional integrations (e.g. Sentry) when their env vars are present.
- Set the **same variable names** in **Vercel → Settings → Environment Variables** for Production, Preview, and Development, with **environment-specific values** — never copy the Production `NEXT_PUBLIC_SITE_URL` or production Supabase credentials into Preview. `NEXT_PUBLIC_*` inline at build; server-only read at runtime. **Redeploy after any env change.**
- Branch protection on `main`: require PR + CI green + successful Preview; no direct pushes, no force-push.
- The full per-feature loop and rollback are in [`WORKFLOW.md`](./WORKFLOW.md); the env-var matrix, Supabase client setup, and auth redirect URLs are in [`SUPABASE-VERCEL-SETUP.md`](./SUPABASE-VERCEL-SETUP.md).

---

## 10. Auth & database safety assumptions

When the site has auth/DB, these are guarantees, not options (step-by-step env + redirect setup is in [`SUPABASE-VERCEL-SETUP.md`](./SUPABASE-VERCEL-SETUP.md)):

- **Every protected route verifies the session server-side** and redirects unauthenticated visitors to the login route — App Router file structure alone is not access control.
- **Auth redirect targets must be validated same-origin** (no open redirect via `?next=` and similar). When the origin is derived from request headers (`x-forwarded-host` / `host`), **normalize and validate it against an allow-list** (localhost, approved production domain(s), the expected Preview pattern) before using it in a redirect — a forged host header must never poison an auth link.
- **Signup / password-reset email links resolve to the origin where the request was made.** Derive the origin from request/deployment headers; fall back to `NEXT_PUBLIC_SITE_URL`, then `http://localhost:3000`. **Preview deployments must not send users to Production.** Keep canonical SEO URLs on `NEXT_PUBLIC_SITE_URL`.
- **Supabase Auth → URL Configuration:** Site URL = Production; Redirect URLs cover local (`http://localhost:3000/**`), the Preview wildcard (`https://*-[VERCEL_TEAM_SLUG].vercel.app/**`), and Production (`https://[PRODUCTION_DOMAIN]/**`). No broad wildcards beyond those.
- **RLS default-deny on every user-reachable table before any user data lands.** Any future `service_role`/secret-key path refreshes the threat model before release.
- **Transactional sending domain (Resend) verified (SPF/DKIM/DMARC)** before email features go live, so mail isn't flagged as spoofed.

---

## 11. Styling / UI architecture

- **Tailwind CSS v4** is **CSS-first**: import it with `@import "tailwindcss";` and define tokens in `src/styles/globals.css` via `@theme` / `@theme inline` — a `tailwind.config.*` file is optional (use `@config` only if you need JS config). shadcn/ui reads those CSS variables, so every component inherits the brand automatically. Use `tw-animate-css` (the v4 successor to `tailwindcss-animate`) for animation utilities.
- **shadcn/ui** for primitives (buttons, inputs, dialog/sheet, etc.) — themed via the CSS variables, not one-off overrides.
- **`next/font`** for all fonts — never a `<link>` to Google Fonts (performance + CLS).
- **`next/image`** for every image — never raw `<img>`. `priority` on above-the-fold images; explicit `width`/`height` to prevent layout shift.
- **Framer Motion** wrapped in `LazyMotion` with `domAnimation`; reusable primitives in `src/components/motion/`; always respect `prefers-reduced-motion`.
- The brand tokens, type scale, motion register, and component look are defined per project in [`DESIGN.md`](./DESIGN.md). This file only fixes the *mechanics*; DESIGN fixes the *taste*.

---

## 12. Optional integration setup (condensed)

Add each only when its feature is needed; each no-ops when its env vars are missing in local/Preview. In Production, anti-abuse controls (rate limiting, CAPTCHA) and live form delivery must be configured — see the fail-closed rule in §6.

- **Sentry** — `pnpm dlx @sentry/wizard@latest -i nextjs` once; it generates configs and wraps `next.config.ts`. Source maps upload on production builds via `SENTRY_AUTH_TOKEN`. Start `tracesSampleRate` low (e.g. `0.1`) and tune. Scrub PII from captured request bodies.
- **PostHog** — browser client in `app/providers.tsx`; Node client in `instrumentation.ts`. Enable autocapture, session replay, web vitals; mask sensitive form fields. Pick `us`/`eu` host by audience.
- **Mailchimp (marketing)** — newsletter/audience management, **server-side only** via a Route Handler. Never expose the API key to the browser.
- **Resend (transactional)** — receipts, password resets, notifications, **server-side only**. Verify the sending domain before launch.
- **Upstash Redis** — per-IP rate limiting for public Route Handlers / Server Actions.
- **Cloudflare Turnstile** — privacy-friendly CAPTCHA on public forms; verify server-side.
- **Framer Motion** — see §11 and [`DESIGN.md`](./DESIGN.md) for the motion language.

---

## 13. Security checklist (every site, from day one)

> The full pre-merge and pre-launch security gate is in [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md). The essentials below ship from day one.

- [ ] `.env.local` confirmed in `.gitignore`; no secret committed
- [ ] No secret carries a `NEXT_PUBLIC_` prefix
- [ ] Supabase RLS enabled on every table, default-deny (if DB used)
- [ ] Supabase secret key used server-side only; no app path uses it for normal user reads/writes
- [ ] Security headers in `next.config.ts`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, `Permissions-Policy`, and a CSP with an explicit allow-list for the third parties you actually load
- [ ] Public write endpoints rate-limited (Upstash) and CAPTCHA-protected (Turnstile) when applicable
- [ ] All inputs zod-validated server-side
- [ ] No `dangerouslySetInnerHTML` / `innerHTML` from user-controlled or query data
- [ ] Auth redirect targets validated same-origin; external `target="_blank"` links use `rel="noopener noreferrer"`
- [ ] GitHub secret scanning + Dependabot enabled; CI fails on committed secrets (e.g. gitleaks)
- [ ] Any leaked key is rotated immediately — never try to scrub git history
- [ ] Transactional sending domain verified (SPF/DKIM/DMARC) before launch

---

## 14. SEO checklist (built for organic ranking)

**Technical:** dynamic `app/sitemap.ts`; `app/robots.ts` pointing to it; canonical URLs per route via `metadata`; HTTPS only (Vercel); clean readable slugs; 301s for any URL change (never 404 a moved page); correct `lang` on `<html>`; no accidental `noindex` on production.

**On-page:** unique `<title>` (50–60 chars) and meta description (140–160) per page; one `<h1>` matching intent; ordered `h1→h2→h3` (no skipped levels); descriptive internal links and anchor text; breadcrumbs on multi-level sites.

**Structured data (JSON-LD):** add the types that match the content — `Organization`/`LocalBusiness` (in layout), `WebSite`+`SearchAction`, `Article`/`BlogPosting`, `Product`, `FAQPage`, `BreadcrumbList`, `Person`.

**Social:** Open Graph + Twitter Card tags via `metadata`; dynamic OG images via `opengraph-image.tsx` (1200×630, under 1MB, readable text).

**After launch:** submit the sitemap to Google Search Console + Bing Webmaster; verify domain ownership; monitor coverage/crawl errors weekly.

---

## 15. Performance checklist

- [ ] Lighthouse 95+ (Performance, Accessibility, Best Practices, SEO) before merging
- [ ] Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1 — test PageSpeed Insights on every Preview
- [ ] `next/image` with correct `sizes`, `priority` above the fold
- [ ] `next/font` with `display: swap`, primary font preloaded
- [ ] Framer Motion in `LazyMotion` with `domAnimation`
- [ ] No client component above the fold unless interactivity requires it
- [ ] Third-party scripts via `next/script` (`strategy="lazyOnload"` where possible)
- [ ] Reserve space for late-loading content (no layout shift); analyze the bundle periodically

---

## 16. Testing / build expectations

- The required gates are `pnpm run typecheck`, `pnpm run lint`, and `pnpm run build`. All three must pass locally and in CI before merge.
- There is **no `test` script by default.** If a project adds automated tests, wire them into CI and document the command in its `README.md`.
- CI (`.github/workflows/ci.yml`) runs `pnpm install --frozen-lockfile`, typecheck, lint, build, and a secret scan on every PR.
- A change is not "done" until local checks pass, CI is green, and the Vercel Preview is tested (see Definition of Done in [`WORKFLOW.md`](./WORKFLOW.md)).

**Minimal CI (`.github/workflows/ci.yml`):**

```yaml
name: ci
on: { pull_request: { branches: [main] } }
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm run typecheck
      - run: pnpm run lint
      - run: pnpm run build
      - uses: gitleaks/gitleaks-action@v2   # fails the PR if a secret is committed
```

Make the `ci` check a **required status** in branch protection so no PR merges without it.

---

## 17. Migration guard

The current defaults are **pnpm**, **Next.js App Router**, and **Vercel**. If you find any of the following in older notes or scaffolds, treat it as historical and migrate to the current default:

| Historical (do not adopt) | Current default |
|---|---|
| `npm` / `package-lock.json` / `yarn.lock` | `pnpm` / `pnpm-lock.yaml` |
| `VITE_*` env vars | `NEXT_PUBLIC_*` (public) / unprefixed (server-only) |
| `localhost:5000`, `localhost:5173` | `http://localhost:3000` |
| `dist/` build output | `.next/` |
| React Router | Next.js App Router (`src/app/`) |
| `pages/api` | `src/app/api/<name>/route.ts` |
| Replit / Vite preview | Vercel Preview |

Trust the repo (`package.json`, `next.config.ts`, `src/app/`) over any stale note.

---

## 18. Architecture decisions to customize per project

The stack is locked; these choices are per-site:

- **Identifiers:** `palestine-house`, `Palestine House`, `[FOUNDER_OR_AUTHOR_NAME]`, `[PRODUCTION_DOMAIN]`, `[VERCEL_PROJECT_NAME]`, `[VERCEL_TEAM_SLUG]`, `[SUPABASE_PROJECT_REF]`.
- **Does it need auth/DB?** If not, skip Supabase, `middleware.ts`, and the auth assumptions in §10 entirely.
- **Which optional integrations are in scope?** (`[OPTIONAL_INTEGRATION]` — analytics, error tracking, marketing/transactional email, rate limiting, CAPTCHA.) Add each only when a feature needs it.
- **Content model:** static content in the repo, MDX, a CMS, or Supabase-backed dynamic content? Pick the simplest that fits.
- **Audience & offer:** `[PRIMARY_AUDIENCE]` and `[CORE_OFFER]` shape routes, copy, structured-data types, and the SEO surface.
- **CSP allow-list:** include only the third-party origins this specific site actually loads (fonts, media, embeds, analytics) — keep it tight.

**This is the locked architecture.** Hand it to any AI tool or contributor and they have what they need to build on this stack consistently.
