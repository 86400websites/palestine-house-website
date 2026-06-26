# Email setup checklist — Palestine House

Follow this **once** to switch the email automation on. Until you do, every form
still works and shows its success message — it just quietly sends nothing, and
nothing is lost. **None of this touches the code** — it is all keys + settings.

The system has **two independent halves**. Do either one first; each works on its
own:

- **Mailchimp** → the free-booklet sign-up forms (and tags every applicant).
- **Resend** → the contact form, the support form, and the approve/decline
  emails sent to applicants.

> Technical reference (env names, format hints, DNS): `docs/SUPABASE-VERCEL-SETUP.md` → "Email integrations — Mailchimp + Resend".

---

## Part 1 — Mailchimp (the booklet forms)

**Turns on:** when someone enters their email to get a booklet, they are added to
your Mailchimp audience and tagged `lead-booklet-a` / `lead-booklet-b`. Every new
applicant is also tagged `applicant`.

- [ ] **1.** Create a Mailchimp account (free is fine) and create one **Audience**.
- [ ] **2.** Get your **API key** — Mailchimp → your profile (bottom-left) → **Account & billing** → **Extras** → **API keys** → **Create A Key**. Copy it. → this is `MAILCHIMP_API_KEY`.
- [ ] **3.** Note your **server prefix** — it is the part after the dash at the end of the API key (a key ending `-us21` means the prefix is `us21`). → this is `MAILCHIMP_SERVER_PREFIX`.
- [ ] **4.** Get your **Audience ID** — Mailchimp → **Audience** → **Settings** → **Audience name and defaults** → copy the **Audience ID** (looks like `a1b2c3d4e5`). → this is `MAILCHIMP_AUDIENCE_ID`.
- [ ] **5.** ⚠️ **To actually deliver the booklet:** in Mailchimp, build a simple **automation** — "when a contact is tagged `lead-booklet-a`, send them an email with the booklet link" (and the same for `lead-booklet-b`). **Without this, the email is captured and tagged but no booklet is sent** — the website only tags the contact; Mailchimp does the sending. The two booklet PDFs are public, so just link to them in the automation email.

→ You now have three values. Go to **Part 3**.

---

## Part 2 — Resend (contact, support, approval emails)

**Turns on:** the contact form emails you · the support form emails you ·
approving/declining an applicant emails the applicant.

> ⚠️ Resend can only send from a **domain you have verified**. If you do not have
> the custom domain yet, this half waits until you do (the custom domain is part
> of **S14**) — or verify any domain you already own now. The Mailchimp half
> (Part 1) does **not** need a domain and can go live first.

- [ ] **1.** Create a **Resend** account.
- [ ] **2.** **Add + verify your sending domain** — Resend → **Domains** → **Add Domain** → add the DNS records it shows (SPF, DKIM, DMARC) at your domain registrar → click **Verify** until it shows **Verified**. (Step-by-step in `docs/SUPABASE-VERCEL-SETUP.md` → "Resend sending-domain verification".)
- [ ] **3.** Get your **API key** — Resend → **API Keys** → **Create API Key**. Copy it. → this is `RESEND_API_KEY`.
- [ ] **4.** Pick the two addresses:
  - **From** → an address on the verified domain, e.g. `hello@yourdomain`. → this is `RESEND_FROM_EMAIL`.
  - **To** → the inbox where contact + support messages should land (your normal email is fine; this one does **not** need to be on the verified domain). → this is `RESEND_TO_EMAIL`.

→ You now have three values. Go to **Part 3**.

---

## Part 3 — Add the keys to Vercel, then redeploy

- [ ] **1.** Vercel → your project → **Settings** → **Environment Variables**.
- [ ] **2.** Add each value you have, scoped to **Production** (and **Preview** too if you want to test there). **All six are server-only** — never expose them to the browser, never rename one with a `NEXT_PUBLIC_` prefix.
  - `MAILCHIMP_API_KEY` · `MAILCHIMP_SERVER_PREFIX` · `MAILCHIMP_AUDIENCE_ID`
  - `RESEND_API_KEY` · `RESEND_FROM_EMAIL` · `RESEND_TO_EMAIL`
- [ ] **3.** **Redeploy** — Vercel → **Deployments** → ⋯ on the latest → **Redeploy**. Env-var changes only take effect after a redeploy.

> You can add Mailchimp's three now and Resend's later (or the reverse) — each
> half lights up on its own.

---

## Part 4 — Test it live (after the redeploy)

- [ ] **Lead form** (Home or footer): enter an email → you see "the booklet is on its way" → the contact appears in Mailchimp with the `lead-booklet-*` tag (and receives the booklet if you built the automation in Part 1 step 5).
- [ ] **Contact form** (`/contact`): send a message → it lands in your `RESEND_TO_EMAIL` inbox, and **Reply** goes straight to the sender.
- [ ] **Support form** (signed in as an approved partner): submit → it lands in your inbox.
- [ ] **Approvals** (`/admin/approvals`): approve an application → the applicant gets the "you're approved" email; decline another → the applicant gets the "not moving forward — contact us" email.
- [ ] **Declined applicant** signs in → sees the "we're not moving forward right now" message with a working link to `/contact`.

---

## Good to know

- **Nothing breaks before you do this.** With the keys absent, every form still
  works and shows its success message. On Preview/local it is an honest no-op; on
  real production a public form returns a soft error rather than silently losing a
  message.
- **The two booklet PDFs are the only public files** — safe to link in a Mailchimp
  email.
- **Spam/abuse protection** (rate-limiting + a Turnstile challenge) for the public
  forms is **S14**, not part of this setup.
- **You do not need to test delivery to merge S12** — the placeholders are review-
  approved and ship safely without any keys.
