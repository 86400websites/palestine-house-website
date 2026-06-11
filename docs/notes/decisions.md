# Palestine House — Build Decisions

Use this file to record decisions that affect implementation. Resolved decisions are propagated to `PROJECT-STATUS.md` §4 (locked) / §5 (open) in the same pass.

## Open decisions

- **D2 — In-person events: RSVP at MVP?** Lean: listing-only at MVP. Needed by S7.

## Closed decisions (propagated to PROJECT-STATUS.md §4)

- **Header mega-menus (2026-06-12):** match the approved mockup — tooltip one-liners on all four nav labels plus mega-menu panels on The Model and Experience; the mega-menu link strings are approved-via-mockup (they appear only in `page-designs/shared/site-chrome.jsx`, not in `page-copy/`).

### 2026-06-11

- **D1 — Live Programming video host:** YouTube. CSP extended for the YouTube embed origin only (S7).
- **D3 — Production domain:** Vercel domain for launch; custom domain connected later.
- **D4 — Contact/legal email:** none for now; owner adds later as env vars before S8 / legal go-live.
- **D5 — Apply form name format:** single "Your name" field, per the approved Apply mockup (`/docs/page-designs/public/Apply.app.jsx`); derive first name server-side if needed.
- **D6 — Partner publishing at MVP:** keep as specified — partner publishing behind approval (architecture doc recommendation). Note: the partner-publishing UI is a flagged design gap (`PROJECT-STATUS.md` §3) — design + copy needed before S7c.
- **Mailchimp audience / Resend sender domain:** values added later by the owner as environment variables (S8) — names only, never committed.
