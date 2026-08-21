# User Update Messages — Palestine House

> **Skeletons, not finished messages.** The `[BRACKETS]` stay in this file. Claude Code fills them from the incident; **the owner sends** — by email, or whatever channel the person used.
>
> Guide: [`../ERROR-TRACKING-GUIDE.md`](../ERROR-TRACKING-GUIDE.md) · Register: `docs/INCIDENT-LOG.md` *(seeded in SYS3)*

**Module state:** installed at **SYS1**, **activated in SYS3**. There is **zero Sentry code in the repository today** — so today you only know who was affected if they told you. Once SYS3 ships, Sentry names them.

## Who you are writing to

**Partners and applicants** — people who have applied to bring a Palestine House, or who are already approved and using the platform. Not customers, not donors, not subscribers. **This site takes no payments**, so no message here ever concerns money, cards or refunds.

**Voice.** These are new strings, so the brand-voice rules govern them: **warm, short, concrete**. Never charity tone, never franchise hype, never political slogans, never startup filler. The canonical rules live in `docs/page-copy/00-global/brand-voice.md` — ⚠️ that path is **gitignored and owner-held** (the copy canon lives on the owner's drive, not in this public repo), so check it there before inventing a new phrasing. When in doubt, match the tone the site already uses: *"Something broke on our side, not yours."*

⚠️ **This repository is public.** These messages contain a real person's name and address when you send them. Never paste a filled-in copy into a commit, a PR, an issue or the incident log.

---

## 1. "We're on it" — send within hours of a report, before the fix

> Subject: We found the problem you hit
>
> Hi [NAME],
>
> Thank you for telling us about [WHAT THEY HIT, IN THEIR OWN WORDS]. You were right — [ONE PLAIN SENTENCE OF WHAT ACTUALLY HAPPENED].
>
> We're fixing it now and I'll confirm here the moment it's done. Nothing is wrong with your account, and there's nothing you need to do on your side.
>
> Thanks again for flagging it — it genuinely helps.
>
> [OWNER_NAME]

## 2. "Fixed" — send after the fix is verified live

> Subject: Fixed — and thank you
>
> Hi [NAME],
>
> The problem you hit — [ONE PLAIN SENTENCE] — is fixed and verified. [WHAT TO DO NOW, IF ANYTHING.]
>
> We've also added a permanent check for this exact issue, so it can't quietly come back.
>
> If anything still looks off, reply here and I'll look straight away.
>
> [OWNER_NAME]

⚠️ Only claim the permanent check once it exists. The launch-gate suite arrives in **SYS2**; before then, drop that sentence rather than promise it.

## 3. "Not a bug" — access is working as intended

For the most common report on this site: someone cannot reach the platform, and the approval gate is right to stop them. Confirm the denial was **correct** before sending ([`../ERROR-TRACKING-GUIDE.md`](../ERROR-TRACKING-GUIDE.md) §7).

> Subject: About your access
>
> Hi [NAME],
>
> I checked on our side. Nothing is broken — [THEIR ACTUAL STATUS IN ONE PLAIN SENTENCE, e.g. "your application is still with HQ, so the partner platform hasn't opened for you yet"].
>
> [WHAT HAPPENS NEXT AND ROUGHLY WHEN, e.g. "Every application is reviewed by HQ. We'll email you the moment there's a decision."]
>
> In the meantime you can still sign in and update your name or password on your account page.
>
> If you think this is wrong, reply here and I'll look again.
>
> [OWNER_NAME]

## 4. "Not a bug" — your application did arrive

For *"I applied and never heard anything."* Usually the application is safely saved and only the confirmation email failed — see [`../ERROR-TRACKING-GUIDE.md`](../ERROR-TRACKING-GUIDE.md) §5.

> Subject: We have your application
>
> Hi [NAME],
>
> Your application reached us on [DATE] — it's with HQ. [IF TRUE: "The confirmation email didn't reach you, which is on us, and we've fixed that."]
>
> Every application is reviewed by HQ. We'll email you as soon as there's a decision.
>
> Sorry for the silence, and thank you for the nudge.
>
> [OWNER_NAME]

If the application genuinely is **not** there, do not send this one. Say so plainly, ask them to apply again, and log it as a Blocker — an application that was never saved is the most serious failure this site has.

---

## The plain sentence for each surface

One line each, for the `[ONE PLAIN SENTENCE]` slot above. Fill in what actually happened; never describe the internals.

| What broke | Say something like |
|---|---|
| `/apply` didn't save the application | *"Your application didn't reach us, and the page didn't tell you that."* |
| The confirmation or decision email never arrived | *"The email we should have sent you never went out."* |
| Sign-in or password reset failed | *"The reset link wasn't reaching you."* |
| Approval didn't unlock the platform | *"Your account was approved, but the platform didn't open for you."* |
| A template download failed | *"The download link was expiring before it could open."* |
| An Ask HQ message didn't reach HQ | *"Your question didn't get through to the team."* |
| A guide page errored | *"That page was failing to load for some partners."* |

## Rules

- **Never send to anyone the incident didn't affect.**
- **Never promise a date** you haven't confirmed.
- **Never mention tools, logs or internals** — no "Sentry", no "Resend", no "RPC", no "signed URL", no error codes. Plain words only.
- **Never ask for a password**, and never ask them to send you one.
- **For a Blocker that hit several people**, send message 1 to everyone affected without waiting for them to report it.
- **Nothing closes until the message is sent** — the incident log's second closure rule.
