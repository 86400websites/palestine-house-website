# Email setup checklist — Palestine House

> **Rewritten for E1 (2026-07-09).** The lead-magnet/booklet capture was removed
> from the site in DR1-8 (2026-07-02), and the owner decided (E1, 2026-07-09)
> that **Mailchimp stays dormant** — so live email is **Resend only**. The old
> Mailchimp Part 1 of this checklist is retired; a short dormant-Mailchimp
> appendix survives at the bottom.

Follow this **once** to switch the site's email on. Until you do, every form
still works and shows its success message — it just quietly sends nothing on
local/Preview, and the **public contact form fails closed (a soft error) on
real Production** so a message is never silently lost. **None of this touches
the code** — it is all keys + DNS + a redeploy.

**What it turns on — the four flows (all Resend, all plain-text):**

1. **Contact form** (`/contact`) → emails **you** (`RESEND_TO_EMAIL`), Reply goes to the sender.
2. **Support form** (signed-in partners) → emails **you**, Reply goes to the partner.
3. **Application received** (`/apply`) → emails **you** (name, email, city, organisation, why + a link to `/admin/approvals`) **and** emails **the applicant** a "we received your application" confirmation.
4. **Approve / decline** (`/admin/approvals`) → emails **the applicant** the approved ("sign in") or declined ("contact us") notice.

> Technical reference (env names, format hints, DNS): `docs/SUPABASE-VERCEL-SETUP.md` → "Email integrations".

**Recommended ordering:** do the still-pending **custom-domain cutover first**
(Vercel `NEXT_PUBLIC_SITE_URL` + Supabase auth Site URL — `PROJECT-STATUS.md`
§1/§4) — every emailed link (`/login`, `/contact`, `/dashboard`,
`/admin/approvals`) is built from `NEXT_PUBLIC_SITE_URL`, so until then emails
carry working but off-brand `…vercel.app` links. Email works either way.

---

## Part 1 — Verify the sending domain in Resend

Resend can only send from a domain you have verified. Ours is
**`palestine-house.com`** (DNS is at **GoDaddy** — nameservers
`ns11/ns12.domaincontrol.com`, confirmed 2026-07-09).

> **Your `info@palestine-house.com` inbox is safe.** Resend's records go on a
> `send.palestine-house.com` subdomain (SPF + MX for bounces) and
> `resend._domainkey` (DKIM) — the root domain's MX (Microsoft 365) and its
> SPF record are **not** modified. Copy exactly what the Resend dashboard
> shows; the dashboard is authoritative.

- [ ] **1.** Create a **Resend** account (the free tier — 100 emails/day, 3,000/month — is ample).
- [ ] **2.** Resend → **Domains** → **Add Domain** → `palestine-house.com` (pick the closest region).
- [ ] **3.** In **GoDaddy** (My Products → your domain → **DNS** → Add New Record), add each record Resend lists. Enter only the host part in *Name* (e.g. `send`, `resend._domainkey`) — GoDaddy appends the domain. Default TTL is fine.
- [ ] **4.** Back in Resend, click **Verify** until the domain shows **Verified** (usually minutes; can take up to 48 h). **Don't add the Vercel keys until it's Verified.**

## Part 2 — API key + the three addresses

- [ ] **1.** Resend → **API Keys** → **Create API Key** (sending access only). Copy it once. → `RESEND_API_KEY`
- [ ] **2.** **From:** `info@palestine-house.com` (on the verified domain). → `RESEND_FROM_EMAIL`
- [ ] **3.** **To:** the inbox where contact/support/application notifications land — `info@palestine-house.com` (default; any inbox works, it does **not** need to be on the verified domain). → `RESEND_TO_EMAIL`

> ⚠️ **All three are required.** The first two make sending possible; without
> `RESEND_TO_EMAIL` the contact form still fails closed in Production and the
> support/application notifications to you are skipped.

## Part 3 — Add the keys to Vercel, then redeploy

- [ ] **1.** Vercel → `palestine-house-website` → **Settings** → **Environment Variables**.
- [ ] **2.** Add all three, scoped to **Production and Preview** (Preview lets you test with real sends before touching Production). **All server-only** — never expose to the browser, never a `NEXT_PUBLIC_` prefix. Mark the API key *Sensitive*.
  - `RESEND_API_KEY` · `RESEND_FROM_EMAIL=info@palestine-house.com` · `RESEND_TO_EMAIL=info@palestine-house.com`
- [ ] **3.** **Redeploy** — Vercel → **Deployments** → ⋯ on the latest → **Redeploy**. Env-var changes only take effect after a redeploy. (Preview picks them up on the next push.)

> **Preview-test caveat:** emails sent from a **Preview** deployment carry
> `http://localhost:3000` links — `NEXT_PUBLIC_SITE_URL` is set for Production
> only, so Preview falls back to the localhost default. That's expected; use
> Preview to confirm **delivery**, and verify the **links** on Production.

## Part 4 — Test it live (after the redeploy)

- [ ] **Contact** (`/contact`): send a message → it lands in `info@`; **Reply** addresses the sender.
- [ ] **Support** (signed in as an approved partner): submit → lands in `info@`; **Reply** addresses the partner.
- [ ] **Apply** (`/apply`, use a test email you control): sign-up still lands on the pending dashboard → `info@` gets the **"New application"** notification (all fields present) → the test inbox gets the **"We received your application"** confirmation → both emails' links open the right pages.
- [ ] **Approve** (`/admin/approvals`): approve the test application → the applicant gets **"You're approved"** with a working sign-in link.
- [ ] **Decline**: create a second test application, decline it → the applicant gets the **"not moving forward — contact us"** email; signing in shows the declined notice linking `/contact`.
- [ ] Spot-check **spam placement** on at least one non-Gmail inbox. If it lands in spam, add the optional DMARC record (`_dmarc` TXT, `v=DMARC1; p=none;`) and retest.

---

## Good to know

- **Nothing breaks before you do this.** Keys absent = honest no-op on
  local/Preview; on real Production the public contact form fails closed
  (soft error) and everything else stores/works — emails are simply skipped.
- **Observability:** sends that reach Resend (including API rejections, e.g.
  an unverified domain) show in the Resend dashboard → **Emails**.
  Unconfigured skips and network failures never reach Resend — those appear
  only in the Vercel function logs (`[resend] …`).
- **Spam/abuse protection** (rate-limiting + Turnstile) for the public forms
  is in the Post-MVP hardening backlog (`ROADMAP.md` §A) — required before
  scale, not for this switch-on.

## Appendix — Mailchimp (dormant by owner decision, 2026-07-09)

The Mailchimp integration (tagging each new applicant `applicant` in an
audience) remains in the code as a clean no-op and is **intentionally off** —
no account, no keys. The booklet lead magnet it once served was removed in
DR1-8. If it is ever wanted: create a Mailchimp account + one Audience, add
`MAILCHIMP_API_KEY` + `MAILCHIMP_SERVER_PREFIX` + `MAILCHIMP_AUDIENCE_ID`
(server-only) in Vercel and redeploy — applicants start being tagged; nothing
else changes.
