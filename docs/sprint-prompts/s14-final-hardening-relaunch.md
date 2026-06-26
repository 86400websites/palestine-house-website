# S14 — Final hardening + relaunch

| | |
|---|---|
| **Status** | ⬜ Ready to run (not started) |
| **Branch** | `claude/sprint-s14-final-hardening-relaunch` (from latest `main`) |
| **Decision** | Created by the 2026-06-18 launch-first reshuffle, re-sequenced under D-S10-b (2026-06-26); resolves the accepted deferral D-S6-a / known issue #1 |
| **Goal** | Add Upstash rate-limiting + Turnstile to the public writes — `/apply`, contact, the lead-magnet + newsletter captures (the `SECURITY-CHECKLIST.md` §15 invariant) — plus a secondary rate-limit guard on the already-auth-gated `/support` write (Turnstile there optional); all fail closed in Production, no-op in dev/Preview; verify CSP/headers live + run the secret-path threat model; pass `SECURITY-CHECKLIST.md` §1–§15; cut over to the custom domain with SEO; re-smoke-test Production; and mark the site relaunched |

> This is the **ready-to-run brief** (not a post-merge record). Paste the prompt below into a fresh Claude Code session to execute S14 in owner-gated sub-steps. Save the completed record (`/sprint-prompt save`, Mode B) **after** the PR merges. **Re-validate against repo state before running** — the codebase will have changed (S11/S12/S13 land first). Scope + exit gate: `ROADMAP.md` §B (S14, line 104); the deferral being resolved: `PROJECT-STATUS.md` §5 (D-S6-a) + §7 (issue #1). **Depends on S13** (must be merged before S14 runs).

## Scope (9 gated sub-steps)

1. **(14-pre)** Pre-flight — **proposal-first, no code.** Confirm with the owner that (a) the custom domain is provisioned + its DNS record resolves to Vercel, (b) the Upstash Redis project exists (owner provides `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`), (c) the Turnstile site exists (owner provides `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY`). Add the four var **names** to `.env.example` (no values; the secret-prefixed three server-only, only the site key `NEXT_PUBLIC_*`). Propose the rate-limit window/limit per endpoint + the Turnstile interaction mode, and **wait for approval** before any code.
2. **(14-a)** Rate-limit foundation — add `@upstash/redis` + `@upstash/ratelimit` and a server-only `src/lib/security/rate-limit.ts` sliding-window helper that reads `UPSTASH_*` server-side, keys on a trusted client IP, returns `429`-shaped results with `Retry-After`, **no-ops cleanly when the env vars are absent** (dev/Preview) but is wired so Production fails closed at the call sites in 14-d. Plus a server-only `src/lib/security/turnstile.ts` verify helper (POST the token to the Cloudflare siteverify endpoint with `TURNSTILE_SECRET_KEY`; absent secret → no-op locally, enforce in Production).
3. **(14-b)** `/apply` — gate `applyAction` (`src/lib/auth/actions.ts`) with the rate-limit pre-check + server-side Turnstile verification **before** any account/application write; render the Turnstile widget on the Apply form with `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; neutral brand-voice error on rate-limit/challenge failure (**draft + owner-approve any new string**). Existing zod + enumeration-safe flow unchanged.
4. **(14-c)** Lead-magnet + newsletter captures — add the Turnstile widget + a server-side verify path to `src/components/sections/lead-form.tsx` + `src/components/layout/footer-lead-form.tsx` (today honest no-ops); attach the guard at whatever server path S12 created for these captures (Route Handler under `src/app/api/*` or Server Action — confirm first), and only add a new Route Handler if S12 left the capture client-side, so the public capture **fails closed in Production**. Keep the honest "not ready to send yet" no-op behaviour until S12's Mailchimp keys are present — this step adds the guard layer, not the send.
5. **(14-d)** Contact + `/support` writes — wire the contact write (`src/components/sections/contact-form.tsx` → its S12 server path) through the rate-limit pre-check + Turnstile (contact is a §15 public write); add the rate-limit pre-check to `submitSupportRequestAction` (`src/lib/support/actions.ts`) as a **secondary guard** — `/support` is already approval-gated (the `submit_support_request` RPC) and is **not** a §15 public write, so Turnstile there is optional (**propose, owner decides**). Confirm the **fail-closed-in-Production** rule holds for every public write: missing `TURNSTILE_SECRET_KEY` → reject with a friendly error; missing `UPSTASH_*` → rate-limit skipped but Turnstile still enforced.
6. **(14-e)** Headers + secret-path threat model — verify `next.config.ts` security headers + CSP are unchanged and correct **live via `curl`** on the Preview/Production response (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`, and CSP with `frame-src https://www.youtube-nocookie.com` only — **no `'self'`** — plus `frame-ancestors 'none'`). Run the secret-path audit: every public write is zod-validated + rate-limited + Turnstile-verified + server-side-gated + fail-closed; no new `service_role`/`sb_secret_*` path; `UPSTASH_*` + `TURNSTILE_SECRET_KEY` are server-only; only `NEXT_PUBLIC_TURNSTILE_SITE_KEY` reaches the client.
7. **(14-f)** Custom-domain cutover + SEO — once the owner confirms DNS resolves: update `NEXT_PUBLIC_SITE_URL` in Vercel **Production** to the custom domain, add the custom domain to the Supabase **prod** Auth Site URL + redirect allow-list (**keep the old Vercel domain during the grace period**), redeploy, then **re-verify** that `src/lib/site.ts` `SITE_URL`-derived surfaces all resolve to the custom domain — canonical, `og:url`/`og:image`, JSON-LD (Organization + WebSite), `sitemap.xml`, `robots.txt` — via `curl` on the live domain. No code change to the SEO layer is expected (it reads `NEXT_PUBLIC_SITE_URL`); flag the moment if any value is still hard-pinned to the Vercel domain.
8. **(14-g)** Production smoke-test (custom domain) — walk: `/apply` (creates a pending account; rate-limit kicks in on rapid retries; Turnstile challenge present), `/contact` (submits, no error), the footer + inline lead-magnet forms (Turnstile present), `/live` + `/live/[id]` (feed + youtube-nocookie embed, no CSP console errors), sign in → `/resources` (signed-URL template download), `/build` (toggle a checklist item, saves). Re-`curl` the headers/CSP on the live domain. No console errors, no hydration warnings.
9. **(14-h)** Exit gate — full-diff review of the whole sprint; run **`SECURITY-CHECKLIST.md` §1–§15** top to bottom and record each section's pass (all 🔴 blocking items clear); confirm the §15 public writes (`/apply`, contact, lead-magnet, newsletter) are rate-limited + Turnstile-verified + fail-closed in Production, and the `/support` write carries its secondary rate-limit guard (its §15 status is unchanged — it is auth-gated, not a public write); confirm CSP/headers verified live + custom domain + SEO live + Production re-smoke-tested; then update `docs/PROJECT-STATUS.md` (§1 marked **Relaunched / hardened**, §2 S14 row ✅ + date, §6 Upstash/Turnstile + domain recorded, §7 issue #1 → **Resolved**, change log) and tick S14 in `docs/ROADMAP.md`. Save the sprint record with the chosen rate-limit thresholds + the domain used.

## Prompt used

```text
You are my senior engineer for the Palestine House website, working in Claude Code.

Session start: read docs/PROJECT-STATUS.md §1–§2 (and §5 D-S6-a + §7 issue #1 — the deferral this sprint resolves), then the S14 scope + exit gate in docs/ROADMAP.md (S14, line 104). CLAUDE.md governs everything below. This is the FINAL HARDENING + RELAUNCH sprint — a SECURITY + PRODUCTION sprint, not a feature sprint: NO new features, NO public-page or private-page UI/copy redesign, NO database migrations, NO auth/RLS/approval-gate changes. The only new user-facing surfaces are the Turnstile widget on the public forms and any error string for a rate-limit/challenge failure — draft those per brand-voice and get my approval at the gate.

Sprint: S14 — Final hardening + relaunch
Branch: claude/sprint-s14-final-hardening-relaunch (create from latest main)

Goal:
Complete the site's hardening and relaunch it on the custom domain:
- Add Upstash rate-limiting + Turnstile to the PUBLIC WRITES (/apply, contact, the lead-magnet + newsletter captures) — these are the SECURITY-CHECKLIST §15 invariant. Add a secondary Upstash rate-limit guard to the already-auth-gated /support write too (Turnstile there is optional — propose, I decide). They MUST fail closed in Production but no-op cleanly in local dev + Preview when their env vars are absent.
- Verify the CSP + security headers on the LIVE response (curl) and run a secret-path threat-model pass; then sign off the full docs/SECURITY-CHECKLIST.md §1–§15.
- Cut over to the custom domain carefully (DNS confirmed by me → update NEXT_PUBLIC_SITE_URL → Supabase Auth allow-list → redeploy → re-verify canonical/sitemap/robots/OG/JSON-LD on the live domain), then re-smoke-test Production and mark the site relaunched in PROJECT-STATUS.

Execute in gated sub-steps (one owner gate after each):
1. (14-pre) PROPOSAL FIRST, NO CODE. Confirm with me: (a) the custom domain is provisioned + DNS resolves to Vercel; (b) the Upstash Redis project exists (I provide UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN); (c) the Turnstile site exists (I provide TURNSTILE_SECRET_KEY + NEXT_PUBLIC_TURNSTILE_SITE_KEY). Add the four var NAMES to .env.example (no values; the three secret-prefixed ones server-only, only the site key NEXT_PUBLIC_*). Propose the sliding-window rate-limit (window + max requests per IP) per endpoint — recommend ~5 req / 10s for /apply + /contact + /support, tighter for the lead-magnet/newsletter captures to deter email-list abuse — and the Turnstile interaction mode (recommend "managed"/invisible since we also rate-limit). WAIT for my approval of the thresholds before any code.
2. (14-a) Rate-limit + Turnstile foundation. Add @upstash/redis + @upstash/ratelimit (justify; both are optional integrations that no-op without env). Create src/lib/security/rate-limit.ts: a server-only sliding-window helper that reads UPSTASH_* server-side, keys on a trusted client IP, returns a 429-shaped result with Retry-After, and NO-OPS (allow) when the env vars are absent. Create src/lib/security/turnstile.ts: a server-only helper that POSTs the token to Cloudflare siteverify with TURNSTILE_SECRET_KEY; absent secret → no-op (pass) locally/Preview but ENFORCE (reject) in Production. Neither helper leaks upstream error bodies. STOP.
3. (14-b) /apply. In src/lib/auth/actions.ts gate applyAction with: rate-limit pre-check → server-side Turnstile verify → THEN the existing zod parse + account/application write (do not change the enumeration-safe duplicate-email flow). Add the Turnstile widget to the Apply form using NEXT_PUBLIC_TURNSTILE_SITE_KEY. Neutral brand-voice error copy for a rate-limit or challenge failure — show me the draft and WAIT for approval before shipping it. STOP.
4. (14-c) Lead-magnet + newsletter captures. Add the Turnstile widget + a server-side verify path to src/components/sections/lead-form.tsx + src/components/layout/footer-lead-form.tsx (today honest client-side no-ops). Attach the guard at whatever server path S12 created for these captures (a Route Handler under src/app/api/<name>/route.ts or a Server Action — confirm FIRST); only add a NEW zod-validated, rate-limited Route Handler if S12 left the capture client-side, so the public capture fails closed in Production. KEEP the existing honest "not ready to send just yet" no-op outcome until S12's Mailchimp keys are present — this step adds the guard layer, not the send. Any new string → draft + my approval. STOP.
5. (14-d) Contact + /support. Wire the contact write through its server path + the rate-limit pre-check, and add the Turnstile widget to /contact (src/components/sections/contact-form.tsx) — contact is a §15 public write. Add the rate-limit pre-check to submitSupportRequestAction in src/lib/support/actions.ts (it is already approval-gated via the submit_support_request RPC and is NOT a §15 public write — this is a secondary guard); Turnstile on /support is optional — propose, I decide. Confirm the FAIL-CLOSED-IN-PRODUCTION rule across every public write: missing TURNSTILE_SECRET_KEY → reject with a friendly error; missing UPSTASH_* → skip rate-limit but Turnstile still enforces. STOP.
6. (14-e) Headers + secret-path threat model. Verify next.config.ts headers + CSP are unchanged + correct on a LIVE response via curl (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Strict-Transport-Security, Permissions-Policy; CSP frame-src https://www.youtube-nocookie.com ONLY — no 'self' — plus frame-ancestors 'none'). Run the secret-path audit: every public write is zod-validated + rate-limited + Turnstile-verified + server-side-gated + fail-closed; no new service_role/sb_secret_* path; UPSTASH_* + TURNSTILE_SECRET_KEY server-only; only NEXT_PUBLIC_TURNSTILE_SITE_KEY on the client. Record the result. STOP.
7. (14-f) Custom-domain cutover + SEO — ONLY after I confirm DNS resolves. Update NEXT_PUBLIC_SITE_URL in Vercel Production to the custom domain; add the custom domain to the Supabase PROD Auth Site URL + redirect allow-list (KEEP the old Vercel domain during the grace period so existing email links still resolve); redeploy. Then re-verify, via curl on the live domain, that everything src/lib/site.ts drives now resolves to the custom domain: canonical, og:url/og:image, JSON-LD (Organization + WebSite), /sitemap.xml, /robots.txt. No SEO-layer code change is expected (it reads NEXT_PUBLIC_SITE_URL) — if any value is still hard-pinned to the Vercel domain, STOP and flag it. STOP.
8. (14-g) Production smoke-test on the custom domain. Walk: /apply (create a pending account; rapid retries hit the rate-limit; Turnstile challenge present), /contact (submits, no error), the footer + inline lead-magnet forms (Turnstile present), /live + /live/[id] (feed + youtube-nocookie embed, no CSP console errors), sign in → /resources (download a template via signed URL), /build (toggle a checklist item, saves). Re-curl the headers/CSP on the live domain. Confirm no console errors + no hydration warnings. Report the results. STOP.
9. (14-h) Sprint exit gate — full-diff review of the whole sprint; then run docs/SECURITY-CHECKLIST.md §1–§15 top to bottom and record each section's pass (every 🔴 blocking item clear — especially §8 public writes + §15 "public writes (/apply, contact, lead-magnet, newsletter) zod + rate-limit + Turnstile, fail-closed in Production"). Confirm: the §15 public writes are rate-limited + Turnstile-verified + fail-closed in Production; the /support write carries its secondary rate-limit guard (its §15 status is unchanged — auth-gated, not a public write); CSP/headers verified live; custom domain + SEO live; Production re-smoke-tested. Update docs/PROJECT-STATUS.md (§1 marked Relaunched/hardened; §2 S14 row ✅ + date; §6 Upstash/Turnstile + the custom domain recorded; §7 issue #1 → Resolved; change log) and tick S14 in docs/ROADMAP.md. Save the chosen rate-limit thresholds + the domain used in the record. STOP.

Per-step protocol (every sub-step, no exceptions):
1. Read the exact input(s) for this sub-step BEFORE coding: the named file(s), the matching SECURITY-CHECKLIST section, and next.config.ts where headers/CSP are in scope.
2. Build it: smallest safe change, one focused concern; no unrelated refactors, no redesign of any page/copy.
3. Verify: pnpm run typecheck && pnpm run lint && pnpm run build; spot-check the affected routes/actions and confirm nothing else broke. Where headers/CSP/SEO are in scope, verify on a LIVE response with curl (not just by reading the config).
4. Self-review the diff for bugs, leaked secrets, and fail-closed correctness before committing (full review at the exit gate).
5. Commit AND push to the task branch — every sub-step, so I can review live in the open PR.
6. Report in ≤6 lines: what shipped, checks run, anything flagged — then STOP and WAIT for "proceed". Never start the next sub-step without it. For ANY new user-facing string AND for the rate-limit thresholds / Turnstile mode / domain decisions, show me the draft and wait for my approval before shipping it.

Owner remote commands: "proceed" = next step · "pause" = hold · "status" = where are we ·
"fix <thing>" = fix before continuing · "skip to <n>" = jump (record the skip in PROJECT-STATUS.md).

Locked inputs (read before coding; never invent copy or design values):
- Brand voice for ALL new strings (rate-limit / challenge / error states, aria labels): docs/page-copy/00-global/brand-voice.md — warm, short, concrete; never charity tone, hype, slogans, or filler; no exclamation marks.
- Existing public-write copy that stays verbatim: docs/page-copy/01-public-pages/ (apply, contact) + the shared CTA / footer copy already in lead-form.tsx / footer-lead-form.tsx. Only ADD the minimum new strings the guard needs.
- Security contract: docs/SECURITY-CHECKLIST.md §1–§15 (the merge gate; §8 + §15 are the public-writes invariants this sprint completes — the §15 public-writes line is exactly /apply, contact, lead-magnet, newsletter; /support is auth-gated and not part of that invariant); docs/TECH-ARCHITECTURE.md §0 ("public writes zod + rate-limit + Turnstile, fail-closed in Production"); docs/WORKFLOW.md §14 (env-var + Supabase Auth-URL rules for the domain cutover).
- Headers/CSP: next.config.ts is the single source — frame-src stays youtube-nocookie-only (S9 D1); do NOT weaken or broaden the CSP. Mailchimp/Resend/Upstash/Turnstile all run server-side, so connect-src/form-action stay 'self'.
- SEO origin: src/lib/site.ts SITE_URL = NEXT_PUBLIC_SITE_URL; sitemap.ts / robots.ts / layout.tsx all derive from it — the cutover is an env-var + redeploy, not a code rewrite.
- Proof numbers are fixed: 10 · 30 · 200+ · 267 · 120-day launch. Header/footer chrome is locked — never redesign.

Before editing:
1. Inspect the repo (package.json, next.config.ts, src/lib/auth/actions.ts, src/lib/support/actions.ts, src/components/sections/contact-form.tsx + lead-form.tsx, src/components/layout/footer-lead-form.tsx, src/lib/site.ts) and read every input above. NOTE: the codebase has moved since this brief was written (S11/S12/S13 merged) — re-confirm the live file paths, the contact/lead server paths S12 added (Route Handler vs Server Action), and the latest migration number before assuming anything.
2. Propose a short plan and confirm scope before changing files — especially the rate-limit helper shape (14-a) and the fail-closed contract (14-d).

While editing:
- Smallest safe change; one focused concern per commit; no unrelated refactors; no page/copy redesign.
- Server Components by default. The rate-limit + Turnstile-verify helpers run ONLY in Server Actions / Route Handlers / Server Components — never the client. UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, and TURNSTILE_SECRET_KEY are server-only secrets; only NEXT_PUBLIC_TURNSTILE_SITE_KEY may reach the browser. Never hardcode or commit a secret; never commit .env.local; reference env vars by NAME only (in code, .env.example, and the PR).
- Rate-limit + Turnstile must NO-OP cleanly (forms render + submit + succeed) when their env vars are absent in local dev + Preview, but FAIL CLOSED in Production: a missing TURNSTILE_SECRET_KEY rejects the write with a friendly error; a missing UPSTASH_* skips the rate-limit but Turnstile still enforces. Never silently drop a submission and never run a public write unprotected in Production.
- No database migration, no RLS/auth/approval-gate change, no new secret-key path. Do not touch /live read logic, the approval gate, or any gated content.
- Domain cutover: update NEXT_PUBLIC_SITE_URL via Vercel env vars (not code); keep the Supabase Auth allow-list covering BOTH the old Vercel domain and the new custom domain through the grace period; never point Preview auth redirects at Production.

Verification (must pass before reporting each step done):
- pnpm run typecheck && pnpm run lint && pnpm run build
- git status — .env.local untracked, no secrets staged, only in-scope files changed.
- Headers/CSP verified on a LIVE response via curl (Preview, then Production after cutover): X-Frame-Options DENY · X-Content-Type-Options nosniff · Referrer-Policy · Strict-Transport-Security · Permissions-Policy · CSP frame-src youtube-nocookie-only (no 'self') + frame-ancestors 'none'.
- Manual, at 320px AND desktop: the Turnstile widget renders on /apply, /contact, and the lead-magnet forms without breaking layout; a public write succeeds once and is rate-limited on rapid repeats; with the env vars unset (local) the forms still submit (no-op) and nothing throws.
- After cutover: /sitemap.xml, /robots.txt, canonical, og:url, og:image, and the JSON-LD all show the custom domain (curl on the live domain).

When the sprint is complete, in the same branch: update docs/PROJECT-STATUS.md (§1 Relaunched/hardened, §2 board, §6 env + domain, §7 issue #1 Resolved, change log) and tick S14 in docs/ROADMAP.md.

Report at the end: summary · files changed · commands + results · the SECURITY-CHECKLIST §1–§15 pass record · the chosen rate-limit thresholds + Turnstile mode + custom domain · risks/follow-ups · suggested commit message · sprint status. Push policy: commit + push after every gated sub-step (standing authorization, 2026-06-12) so I review in the open PR; never merge, never push beyond the task branch.
```

## Independent review (required)

S14 changes the public-write security posture, the CSP/header verification path, and the production domain/Auth-URL config — a security + production sprint, so an independent **Codex** review is **required** before merge (per `AGENTS.md`). Run it on the branch diff after 14-h, fix everything blocking, and re-run until clean. Paste this into a fresh Codex session:

```text
You are my independent code reviewer for the Palestine House website.
Read AGENTS.md in the repo root — it defines your rules, priorities, and the
blocking gating checks. Review the branch DIFF only (vs main), not the whole repo.

This is the S14 "Final hardening + relaunch" sprint. Focus on:
- Public-write protection: /apply, contact, and the lead-magnet/newsletter captures
  (the SECURITY-CHECKLIST §15 invariant) must each be zod-validated, rate-limited
  (Upstash), and Turnstile-verified server-side, and must FAIL CLOSED in Production
  (a missing TURNSTILE_SECRET_KEY rejects with a friendly error; a missing UPSTASH_*
  skips rate-limit but Turnstile still enforces) while no-opping cleanly when env
  vars are absent locally/Preview. The /support write is already auth-gated (the
  submit_support_request RPC) and is NOT a §15 public write — it should carry a
  secondary rate-limit guard only; Turnstile there is optional.
- Secret discipline: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, and
  TURNSTILE_SECRET_KEY are read ONLY server-side; only NEXT_PUBLIC_TURNSTILE_SITE_KEY
  reaches the client; no secret behind a NEXT_PUBLIC_* name; no secret in the diff.
- Turnstile token handling: the server never trusts the client token without calling
  siteverify; no upstream error body or stack trace leaks in responses.
- Headers/CSP: next.config.ts is not weakened; frame-src stays youtube-nocookie-only
  (no 'self'); frame-ancestors 'none' + X-Frame-Options DENY intact.
- Domain cutover: NEXT_PUBLIC_SITE_URL drives canonical/sitemap/robots/OG/JSON-LD;
  Supabase Auth allow-list covers both domains during the grace period; no open
  redirect; Preview auth never points at Production.
- No regression: no database migration, no RLS/auth/approval-gate change, no
  secret-key path introduced; gated content + signed-URL downloads still gated.

Report serious issues only: correctness, security/data safety, secret leaks, a
public write that is not fail-closed in Production, broken approval gating, App
Router boundary mistakes (secrets into client components), Supabase/RLS or
Vercel/env risks, CSP/header weakening, build breakage. No style nits; do not
critique approved copy or the locked design. Any failure of the AGENTS.md
"Palestine House gating checks" or SECURITY-CHECKLIST §15 invariants is blocking.

Return: Blocking issues · Non-blocking issues · Missing checks · exact
file:line locations · suggested fix for each · merge recommendation
(approve / request changes / blocking). Do not make changes, push, or merge.
```

## Re-validate before running

**Depends on S13** (Full testing + fix-all → 0 bugs) — it must be **merged on `main`** before S14 starts (one sprint at a time, `WORKFLOW.md` §0). S14 also assumes S12's email placeholders exist, since 14-c/14-d wrap the contact + lead-magnet server paths S12 introduces.

Because the codebase will have changed by the time this runs, confirm against repo state first:

- **Live file paths** — re-check `src/lib/auth/actions.ts` (`applyAction`), `src/lib/support/actions.ts` (`submitSupportRequestAction`), `src/components/sections/contact-form.tsx`, `src/components/sections/lead-form.tsx`, `src/components/layout/footer-lead-form.tsx`, `src/lib/site.ts` (`SITE_URL`), and `next.config.ts`. As of this brief: the lead-magnet + footer forms and the contact form are still **honest client-side no-ops**, `applyAction` has **no** rate-limit/Turnstile yet, and `/support` writes through the approval-gated `submit_support_request` RPC (it requires an authenticated session — it is **not** a §15 public write).
- **The S12 server paths** — confirm where S12 wired the contact write and the lead-magnet/newsletter captures (Route Handlers under `src/app/api/*` vs Server Actions); 14-c/14-d attach the guards at that existing path rather than recreating it. Only add a new Route Handler if S12 left a capture client-side.
- **Latest migration number** — currently the newest is **`0022_programming_publish_url_guard`** (applied + verified test + prod). S14 needs **no** migration, but confirm S11 didn't add ones that change the security surface, and that there is nothing un-applied.
- **Dependencies** — `@upstash/redis` + `@upstash/ratelimit` are **not yet** in `package.json`; no npm package is needed for Turnstile (CDN widget + server-side siteverify only).
- **Env vars** — `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: confirm they are in `.env.example` (names only) and set in Vercel **Preview + Production** before relying on enforcement; `PROJECT-STATUS.md` §6 currently lists Upstash/Turnstile as **TBD (S14)**.
- **Domain readiness** — the custom domain + its DNS record (owner action, outside S14) must be **provisioned and resolving to Vercel** before 14-f; the sprint is otherwise ready to execute the app-side cutover (env var + Supabase Auth allow-list + redeploy + re-verify).
- **Process** — branch from latest `main`; commit + push after every gated sub-step into the open PR (do not merge, do not push beyond the task branch); CI green + Vercel Preview tested before merge (`WORKFLOW.md` §9–§12); the **required Codex review** clears before merge (`AGENTS.md`). Post-cutover owner follow-ups (record, don't block): submit the custom domain to Google Search Console + Bing Webmaster Tools; confirm any sending-domain SPF/DKIM/DMARC if S12's email is switched on.