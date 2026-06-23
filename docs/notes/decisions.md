# Palestine House — Build Decisions

Use this file to record decisions that affect implementation. Resolved decisions are propagated to `PROJECT-STATUS.md` §4 (locked) / §5 (open) in the same pass.

## Open decisions

- **D2 — In-person events: RSVP at MVP?** Lean: listing-only at MVP. Needed by S8 (post-launch Live Programming; reshuffled 2026-06-18).

## Closed decisions (propagated to PROJECT-STATUS.md §4)

### 2026-06-24

- **D-S8-c — Milestone "gates" retired site-wide:** the milestone "gates" concept (the "3 gates" proof number + the Day 30/60/108 "go/no-go gates / three checkpoints" journey) is RETIRED site-wide for simplicity (owner decision). The public proof strip's 5th stat becomes "120-day launch"; `/bring-ph` keeps the Day 30/60/108 milestone timeline but drops the "gate"/"checkpoint"/"go-no-go" framing. Supersedes the public half of D-S6-b. The approval/access gate and the sprint "exit gate" are unrelated and unchanged.

- **Supabase environments (2026-06-12):** one project for now, used as **production** (ref `jwogtqizqujwhbvpoziu`, project `palestine-house-website`). The separate non-production project is created at the start of S2 — in a separate **free** Supabase org so it adds no billing — before any schema lands; environments never share a database once schema/users exist. Supabase env vars live in Vercel Production only until then. (Note: ref `kdawymeskszjfqbbcknj` belongs to `the-singapore-way-website`, a different site.)
- **Repo visibility (2026-06-12): stays public** (owner decision, accepted trade-off). Gated source content (`page-copy/06-elements/`, `source-assets/resources/`) must leave the repo by S5 ingestion / before launch — see `cleanup-before-launch.md`. Free-plan branch protection remains enforceable as a result.

- **Header mega-menus (2026-06-12):** match the approved mockup — tooltip one-liners on all four nav labels plus mega-menu panels on The Model and Experience; the mega-menu link strings are approved-via-mockup (they appear only in `page-designs/shared/site-chrome.jsx`, not in `page-copy/`).

### 2026-06-11

- **D1 — Live Programming video host:** YouTube. CSP extended for the YouTube embed origin only (S8, post-launch; reshuffled 2026-06-18).
- **D3 — Production domain:** Vercel domain for launch; custom domain connected later.
- **D4 — Contact/legal email:** none for now; owner adds later as env vars before S9 / legal go-live.
- **D5 — Apply form name format:** single "Your name" field, per the approved Apply mockup (`/docs/page-designs/public/Apply.app.jsx`); derive first name server-side if needed.
- **D6 — Partner publishing at MVP:** keep as specified — partner publishing behind approval (architecture doc recommendation). Note: the partner-publishing UI is a flagged design gap (`PROJECT-STATUS.md` §3) — design + copy needed before S8c.
- **Mailchimp audience / Resend sender domain:** values added later by the owner as environment variables (S9, post-launch) — names only, never committed.
