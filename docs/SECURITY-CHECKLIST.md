# Security Checklist — Palestine House

> A reusable, pre-flight security checklist for every website on this system. Companion to [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md) (§13 security), [`SUPABASE-VERCEL-SETUP.md`](./SUPABASE-VERCEL-SETUP.md), [`WORKFLOW.md`](./WORKFLOW.md), and the agent rules in [`CLAUDE.md`](./CLAUDE.md) / [`AGENTS.md`](./AGENTS.md). Replace `[PLACEHOLDER]` values per project.

## Purpose

A single place to verify that a change — and the site as a whole — doesn't leak secrets, expose data, break auth, or ship an exploitable endpoint. Run the relevant sections **before every merge** and the full list **before launch** and **after each production deploy**. Items marked 🔴 are blocking — never merge with one unresolved.

> Scope note: only code that ships in a production build is in scope. Verify each claim against the repo; don't assume.

---

## 1. Secrets checklist

- [ ] 🔴 No secret, API key, token, password, or connection string is hardcoded anywhere in the repo
- [ ] 🔴 No secret carries a `NEXT_PUBLIC_*` prefix (that prefix ships to the browser)
- [ ] Secrets are referenced by **env-var name** only — never by value, even in comments, docs, PRs, or screenshots
- [ ] Server-only secrets are read only in Server Components, Route Handlers, Server Actions, or `instrumentation.ts`
- [ ] CI runs a secret scanner (e.g. gitleaks) and fails the build on a committed secret
- [ ] 🔴 Any leaked key is **rotated immediately** — never attempt to scrub git history as the fix

## 2. `.env.local` checklist

- [ ] 🔴 `.env.local` is listed in `.gitignore`
- [ ] 🔴 `.env.local` is **not** staged or committed (`git status` shows it untracked/ignored)
- [ ] Only `.env.example` (names + safe placeholders, no real values) is committed
- [ ] The diff under review contains no `.env.local` contents and no real keys
- [ ] Real values live only in `.env.local` (local) and Vercel env vars (deployed)

## 3. Supabase key safety

- [ ] Frontend uses **only** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] The publishable key (`sb_publishable_...`) is the only Supabase key in client code
- [ ] The secret key (`sb_secret_...`) and any legacy `service_role` key never appear in client code or `NEXT_PUBLIC_*` vars
- [ ] JWT secret, database password, and direct DB connection string never appear in the repo

## 4. `service_role` / secret-key warning

- [ ] 🔴 No normal application path (user reads/writes) relies on the secret/`service_role` key — those run under the user's session + RLS, or a `SECURITY DEFINER` RPC
- [ ] The secret key is used **only** in explicitly trusted server contexts (admin op, cron, webhook)
- [ ] Any new secret-key path **refreshes the threat model** and adds an explicit authorization check before release
- [ ] Remember: the secret key **bypasses RLS** — treat its use as a privilege boundary, not a convenience

> Using the Supabase MCP to inspect or change the database? Follow [`SUPABASE-MCP-SAFETY.md`](./SUPABASE-MCP-SAFETY.md) — `supabase-test` is read/write, `supabase-prod-readonly` is read-only, and neither connection ever uses the secret key.

## 5. Row Level Security (RLS) checklist

- [ ] 🔴 RLS is enabled on **every** user-reachable table, **default-deny**, before any user data lands
- [ ] Policies grant the minimum needed (owner-scoped reads/writes), not blanket access
- [ ] Controlled or cross-user operations go through a `SECURITY DEFINER` RPC the user is granted `execute` on — not broad table policies
- [ ] 🔴 Each `SECURITY DEFINER` function is hardened: pinned `search_path`, fully-qualified objects, `auth.uid()` authorization (not trusting arguments), narrow returns, and `revoke execute from public` then grant to the intended role only
- [ ] Public-facing projections (e.g. a certificate/verification endpoint) return only non-sensitive fields — **no PII leakage** (no raw emails, etc.)
- [ ] Schema changes ship the SQL **and** the RLS policies together in the PR (applied by hand via the Supabase SQL Editor, in order)
- [ ] Non-production (Preview/Dev) uses a **separate Supabase project** (or isolated branch/schema) — Preview testing never touches the production database

## 6. Auth / session checklist

- [ ] Session cookies are set/refreshed via `middleware.ts` + the server SSR client — not client-only code
- [ ] 🔴 Every protected route verifies the session **server-side** and redirects unauthenticated visitors to the login route (file location is not access control)
- [ ] 🔴 Auth redirect targets are validated **same-origin** (no open redirect via `?next=` or similar); any origin derived from `x-forwarded-host` / `host` is validated against an allow-list before use (no host-header poisoning)
- [ ] Signup/password-reset email links resolve to the **request origin**; Preview never redirects users to Production (see [`SUPABASE-VERCEL-SETUP.md`](./SUPABASE-VERCEL-SETUP.md))
- [ ] Supabase email templates (confirm signup, magic link, invite, reset) use `{{ .RedirectTo }}` / `{{ .ConfirmationURL }}`, not a hardcoded `{{ .SiteURL }}`
- [ ] Supabase redirect allow-list covers only local + Preview wildcard + Production — no broad wildcards
- [ ] Auth pages set `robots: { index: false, follow: false }`

## 7. Client / server boundary checklist

- [ ] Server Components are the default; `"use client"` only where interactivity requires it
- [ ] 🔴 No secret is passed from a Server Component into a Client Component as a prop
- [ ] Anything reaching the client is assumed public — only `NEXT_PUBLIC_*` and non-sensitive data cross the boundary
- [ ] Heavy data fetching and provider SDK calls that use secrets stay on the server

## 8. API route (Route Handler) checklist

- [ ] 🔴 Request bodies are **zod-validated** before use; params, headers, and cookies are treated as untrusted
- [ ] Provider secrets are used only server-side within the handler
- [ ] Public write endpoints are **rate-limited** (e.g. Upstash sliding window) and return `429` with `Retry-After`
- [ ] Public forms verify **CAPTCHA** (e.g. Turnstile) server-side when configured
- [ ] Error responses don't leak stack traces, credentials, internal URLs, or raw upstream error bodies
- [ ] Each integration endpoint no-ops cleanly when its env vars are absent in local/Preview — but in **Production**, live forms **fail closed** and rate-limit / CAPTCHA are configured (never silently drop submissions or run unprotected)

## 9. Form / input validation checklist

- [ ] All inputs validated server-side with zod (don't trust the client, even if the client also validates)
- [ ] No `dangerouslySetInnerHTML` / `innerHTML` fed by user-controlled or query-string data
- [ ] Rendered user content stays as plain React text/attributes (no raw HTML injection)
- [ ] File uploads (if any) are type/size-restricted and never executed
- [ ] PII is minimized in logs; Sentry scrubs request bodies; analytics masks sensitive fields

## 10. Security headers checklist

- [ ] `next.config.ts` ships: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, `Permissions-Policy` (camera/mic/geolocation off unless needed)
- [ ] A **Content-Security-Policy** with an explicit allow-list for only the third-party origins this site actually loads (fonts, media, embeds, analytics) — kept tight
- [ ] External `target="_blank"` links use `rel="noopener noreferrer"`
- [ ] HTTPS only (Vercel handles TLS); no mixed content

## 11. GitHub PR security checklist

- [ ] PR is one focused change; the diff contains no secrets or `.env.local`
- [ ] New/changed env vars are listed by **name only** (with public vs server-only noted)
- [ ] Schema/SQL changes include up + `.down.sql` and RLS policies in the PR, are backwards-compatible, and were applied/tested on a non-production Supabase project first
- [ ] CI is green (install, typecheck, lint, build, secret scan)
- [ ] GitHub secret scanning + Dependabot alerts are enabled on the repo
- [ ] No Git hooks or CI checks skipped (`--no-verify`) without an explicit, recorded reason

## 12. Vercel Preview security checklist

- [ ] The change is tested on the Preview URL, not just locally
- [ ] If auth is involved: signup/reset email links resolve to the **Preview** origin, not Production
- [ ] Preview `NEXT_PUBLIC_SITE_URL` is not set to the Production URL
- [ ] Feature integrations behave (or no-op safely) with the env vars set for Preview
- [ ] No secret is observable in client bundles / network responses on Preview

## 13. Production deployment security checklist

- [ ] Production env vars are complete; server-only secrets are present and correctly non-`NEXT_PUBLIC_`
- [ ] Rate limiter and CAPTCHA env vars are set so they're **actually enforced** in Production
- [ ] Supabase Site URL + redirect allow-list are correct for the live domain
- [ ] Transactional sending domain (if used) is verified (SPF/DKIM/DMARC)
- [ ] Live auth flows tested: login, signup, forgot/update password, protected route
- [ ] Security headers + CSP verified on the live response (e.g. via browser devtools / a header checker)
- [ ] No `noindex` left on production pages by accident

## 14. Dependency safety checklist

- [ ] No unnecessary dependencies added; new ones are justified and well-maintained
- [ ] Locked stack layers (framework, package manager, styling, hosting) unchanged unless explicitly requested
- [ ] `pnpm-lock.yaml` committed and in sync; no `package-lock.json` / `yarn.lock` introduced
- [ ] Dependabot alerts triaged; known-vulnerable packages updated or mitigated
- [ ] No install/postinstall scripts from untrusted packages running with elevated access

---

## 15. Palestine House blocking invariants (project-specific)

These mirror §6 of the sitemap/architecture doc. 🔴 All are blocking — never merge a PR that violates one.

- [ ] 🔴 **Approval enforcement:** every workspace data RPC checks `profiles.is_approved` **server-side**. An unapproved (pending) session can resolve only its own profile/approval status — never element bodies, checklist items/progress, templates, resources, or Academy content.
- [ ] 🔴 **Apply = sign-up:** the `/apply` route is the only account-creation door. It creates a pending account + application record in one submit; there is no separate public signup, and approval is granted only via `/admin/approvals` (server-checked `admins` table).
- [ ] 🔴 **Reference content never public:** any public projection/teaser exposes titles/overviews/metadata only, via anon-safe reads — never gated bodies or files. (The Experience live strip + the public `/live` listing were retired in LH1, 2026-07-10 — session data has no public surface at all.)
- [ ] 🔴 **Templates & booklets:** the 297 templates live in a **private** Storage bucket; downloads only via **server-issued signed URLs** to authenticated, approved users. (The two public booklet PDFs — *The House Promise*, *Operating Model & Governance* — are the only public files, served as public lead magnets.)
- [ ] 🔴 **Public writes** (`/apply`, contact, lead-magnet, newsletter): zod-validated, rate-limited (Upstash), Turnstile-verified, and **fail closed in Production**.
- [ ] 🔴 **Live Programming is members-only end-to-end** (LH1, 2026-07-10): writes owner-scoped under RLS to approved partners; reads only via the approved-gated `member_programming_sessions()` projection (0025) — no anon read path. CSP allow-list extended **only** for the one chosen embed origin (YouTube).
- [ ] 🔴 **Admin routes** (`/admin/*`) verify the `admins` table server-side on every request — `is_approved` alone is not admin.

---

## What to check before merge (quick gate)

1. 🔴 No secrets / no `.env.local` in the diff (§1, §2)
2. 🔴 Correct Supabase key usage + secret-key discipline (§3, §4)
3. 🔴 RLS default-deny on any new/affected table (§5)
4. 🔴 Protected routes have server-side auth checks; redirects validated same-origin (§6)
5. 🔴 No secret crosses the server→client boundary (§7)
6. 🔴 Route Handlers zod-validate input; public writes rate-limited (§8)
7. 🔴 Palestine House invariants intact (§15)
8. CI green + Preview tested (§11, §12)

## What to check after production deployment

1. Live auth flows work and email links resolve to Production (§13)
2. Security headers + CSP present on the live response (§10, §13)
3. Rate limiting + CAPTCHA actually enforced (§13)
4. No secret observable in the production client bundle or network tab
5. Error tracking shows no secret/PII leakage in captured events
6. No accidental `noindex`; sitemap/robots/canonical use `https://[PRODUCTION_DOMAIN]`

## Emergency rollback security notes

- If a **secret was exposed** (committed, logged, or shipped to the client): **rotate the key first**, then remove it from code. Rotation is the fix — git history scrubbing is not, and the key must be assumed compromised the moment it was exposed.
- To restore a safe production state fast: **Vercel → Deployments → previous good deployment → Promote to Production**, then still fix `main` on GitHub (revert the bad PR) so the next deploy doesn't reintroduce the issue.
- **A Vercel rollback restores code, not the database.** If the bad deploy included a schema/RLS change, decide explicitly whether to keep it (only if backwards-compatible) or apply its `.down.sql`; never assume the promote reverted the schema.
- After any rollback caused by a security issue: confirm rotated keys are updated in Vercel (all environments) and `.env.local`, redeploy, and re-run §13.
- Never force-push or rewrite `main` history to "hide" a leak — it doesn't remove the key from forks/caches and breaks history. Rotate instead.
- Record what happened and what was rotated so the threat model and this checklist stay accurate.
