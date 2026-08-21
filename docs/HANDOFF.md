# Handoff — Palestine House

How to hand the Palestine House website over to whoever runs it next, so that nothing
depends on one person, no renewal is silently owned by someone who left, and the site
stays maintainable.

This is the **accounts-and-access inventory**. It lists every service the site depends
on, what each one does here, what breaks if it is lost, and how ownership moves.

Companions: [`README.md`](../README.md) *(root — arrives later in sprint SYS1)* ·
[`docs/README.md`](./README.md) (the docs-pack operating manual) ·
[`PROJECT-STATUS.md`](./PROJECT-STATUS.md) ·
[`WORKFLOW.md`](./WORKFLOW.md) ·
[`ROLLBACK-RUNBOOK.md`](./ROLLBACK-RUNBOOK.md).

---

## ⚠️ This file is committed to a public repository

`86400websites/palestine-house-website` is **public**. Everything in this file is
readable by anyone on the internet, forever, including in the git history.

**Never write into this file:**

- an email address, a person's name, or a login
- an account id, an organisation id, a Supabase project ref, or a Vercel team slug
- a dashboard URL that carries an id
- an API key, token, password, DSN, or any part of one
- anything about a partner, an applicant, or gated guide/template content

Services are named by **service name and role only**. Where a real identity belongs,
this file leaves a labelled blank — fill it in the private handover pack, not here.

> The private handover pack is a document the owner keeps **outside this repo** (the
> same place the off-machine archive copy lives). It carries the identities, the
> account holders, and the transfer confirmations. This file carries the structure.

---

## 1. Accounts and access inventory

Status values: **in use** (the live site depends on it today) · **configured, not
used** (set up, deliberately dormant) · **not wired yet** (name reserved, no code
reads it, arriving in a named sprint).

| # | Service | Role in this site | Status | Account held by | How ownership transfers |
|---|---|---|---|---|---|
| 1 | **GitHub** — repo `86400websites/palestine-house-website` | Source of truth. Holds the code, the docs pack, the SQL migrations, branch protection on `main`, and the `CI` workflow. | In use | _owner to complete (private pack)_ | GitHub's repo-transfer flow, or add the new owner as an org owner and downgrade the outgoing one. |
| 2 | **Vercel** — the `palestine-house-website` project | Hosting. Serves Production and a Preview deployment for every PR. Also the **only** store of the Production and Preview env-var values. | In use | _owner to complete (private pack)_ | Vercel's project/team transfer or invite flow. Transfer the team, not just the project, if billing sits on the team. |
| 3 | **Domain registrar + DNS — GoDaddy** (`palestine-house.com`) | Owns the name and the DNS zone. Carries the Resend sending records on the `send.` subdomain and the mailbox MX on the root. | In use | _owner to complete (private pack)_ | GoDaddy's own registrar transfer flow. **The domain is the client's property — never held by a contractor.** |
| 4 | **Supabase — PRODUCTION project** | Auth and database for the live site: every partner account, the `profiles.is_approved` approval flag, all focus-area/guide/template rows, and the private Storage bucket the templates are served from. Currently on migration `0034`. | In use | _owner to complete (private pack)_ | Supabase org/project ownership transfer. Move the **organisation**, because billing lives there. |
| 5 | **Supabase — NON-PRODUCTION (test) project** | The safe copy. Preview deployments and local development point here, so testing never touches partner data. Every migration is applied here first. | In use | _owner to complete (private pack)_ | Same transfer flow. It is a separate org from Production — transfer both. |
| 6 | **Resend** | Transactional email, four flows: contact → HQ · support → HQ · the application-received pair (applicant + HQ) · approve/decline → applicant. Sending domain verified 2026-07-09. | In use | _owner to complete (private pack)_ | Invite the new owner as admin, then remove the outgoing one. |
| 7 | **Microsoft 365 mailbox** on the domain | Receives everything Resend sends to HQ. Resend *receiving* is intentionally OFF — this mailbox owns the inbox. | In use | _owner to complete (private pack)_ | Microsoft 365 tenant/admin handover. Separate from Resend and from GoDaddy. |
| 8 | **YouTube** (video hosting) | Each focus area can carry a video link, set by HQ in `/admin/content/focus-areas`. `next.config.ts` allow-lists the privacy-enhanced embed origin in `frame-src`. | In use | _owner to complete (private pack)_ | Whoever owns the channel owns the videos. Google account / brand-account transfer. |
| 9 | **Mailchimp** | The apply-tagging integration. **Dormant by owner decision (E1, 2026-07-09)** — no account and no keys are planned; the code is a clean no-op while its env vars are absent. | Configured, not used | _no account exists — nothing to transfer_ | N/A unless the owner later decides to switch it on. |
| 10 | **Upstash Redis** | Rate limiting for the public writes (`/apply`, contact, `/support`). | **Not wired yet — arrives in sprint SYS1.5** (D-SYS-9) | _owner to create and complete (private pack)_ | Owner creates the account and adds the env vars in Vercel. Nothing to transfer today. |
| 11 | **Cloudflare Turnstile** | Bot check on the public forms, fail-closed in Production. | **Not wired yet — arrives in sprint SYS1.5** (D-SYS-9) | _owner to create and complete (private pack)_ | As above. |
| 12 | **Sentry** | Error tracking, with the Production alert rule. | **Not wired yet — arrives in sprint SYS3** | _owner to create and complete (private pack)_ | As above. SYS3 also adds the ingest origin to the CSP (D-SYS-10). |
| 13 | **PostHog** | Product analytics. **Name reserved in the docs, never adopted** — no code exists and no sprint schedules it. | Not adopted | _no account exists_ | N/A. |

**Checks on this table**

- [ ] Every service the site touches appears above. Cross-check the env-var names in
      `.env.example` and the matrix in [`SUPABASE-VERCEL-SETUP.md`](./SUPABASE-VERCEL-SETUP.md) —
      a name with no row is a service someone forgot.
- [ ] Every row names **who** holds it (in the private pack) and **how** it moves.
- [ ] Rows 10–12 are re-checked once those sprints land. A "not wired yet" row that
      has quietly gone live is exactly the account that ends up orphaned.

**Why this matters:** the most common post-handover failure is not a bug. It is a
renewal, a payment method, or a password owned by someone who is no longer here.

---

## 2. If an account is lost — what breaks, and the way back

One line per service. This is the column that matters at handover.

| Service | What breaks if the account is lost | Replacement path |
|---|---|---|
| **GitHub** | The shared source of truth, the PR history, branch protection, and CI. The **code** itself survives — every clone is a full copy. | Push an existing clone to a new remote, then re-create branch protection on `main` and re-add `CI` as a required check. Cheap. |
| **Vercel** | The live site is down and no PR gets a Preview. Worse: Vercel holds the **only** copy of some env-var values, because nothing secret is in the repo. | Re-import the repo into a new Vercel project, re-add each variable **by name** from `.env.example` and `SUPABASE-VERCEL-SETUP.md`, re-issue the values from each provider's own dashboard, re-point DNS, redeploy. |
| **Domain / DNS (GoDaddy)** | Control of the name, plus email: the Resend SPF/DKIM records and the mailbox MX both live in this zone. | **There is no replacement path.** A lost domain is not recoverable by a developer. This is the single strongest reason the registrar account must be the client's from day one. |
| **Supabase PRODUCTION** | Total loss of the live service — every partner account, every approval flag, every guide and template row, and the private Storage bucket. | The **schema** is reproducible: apply `supabase/sql/migrations/` in order, `0001` → `0034`. The **template bytes** come back from the cold archive (see §4). **Partner accounts and approvals have no in-repo copy** — they exist only in this project, so its backup posture is the real recovery plan. |
| **Supabase NON-PRODUCTION** | Preview and local development lose their database. Annoying, not fatal — no live data lives here. | Create a new project, replay the migrations in order, re-point the Preview and Development env vars, redeploy. |
| **Resend** | The four email flows stop. The public **contact form fails closed in Production** (a submission is refused rather than silently dropped); apply/support/approve/decline degrade gracefully — the data is saved, the email is skipped. | New Resend account → re-verify the sending domain at GoDaddy (SPF, DKIM, DMARC per [`EMAIL-SETUP-CHECKLIST.md`](./EMAIL-SETUP-CHECKLIST.md)) → re-set the three `RESEND_*` names in Vercel → **redeploy** → re-run the live test matrix. |
| **Microsoft 365 mailbox** | HQ stops receiving contact, support and new-application notifications. The site keeps working and keeps saving the data. | Restore or re-create the mailbox, then point `RESEND_TO_EMAIL` at it and redeploy. |
| **YouTube** | Every focus-area video link 404s. No other part of the platform is affected — the guides and templates are independent. | Re-upload the videos to a new channel and update each focus area's video link in `/admin/content/focus-areas`. |
| **Mailchimp / Upstash / Turnstile / Sentry** | Nothing today — none of them is wired. | Create the account when its sprint runs. |

---

## 3. Credentials handling

- [ ] Never send a password or key in plain text — email, chat, or a screenshot. Use a
      password-manager share or the provider's own invite/transfer flow.
- [ ] The client owns their accounts. Everyone else is removed, or downgraded to the
      minimum agreed role, at handover.
- [ ] **Rotate everything that was shared during the build:** Supabase keys, the Resend
      API key, and any password more than one person has seen.
- [ ] After rotation, update the values **in Vercel** (Production and Preview) and
      **redeploy** — an env-var change does not reach an existing deployment. Never put
      a value in a committed file.
- [ ] Confirm billing on GitHub, Vercel, Supabase (both orgs), GoDaddy and Resend points
      at the client's payment method.
- [ ] Re-read [`ENV-VARS-SAFETY.md`](./ENV-VARS-SAFETY.md) before touching any variable.

**Never do this**

- Never keep silent admin access "just in case". Access after handover is agreed in
  writing, or it is removed.
- Never hand over a key that has ever been pasted into a chat without rotating it first.
- Never put a server-only secret behind a `NEXT_PUBLIC_*` name. Those are inlined into
  the browser bundle at build time.
- If a secret is ever exposed, **rotate it**. Do not try to scrub git history.

---

## 4. What the repo hands over

There is no separate manual to write. The docs pack **is** the manual. Walk the
incoming developer through it in this order:

- [ ] **`README.md`** (root — *arrives later in sprint SYS1*) — what the project is and
      how to run it.
- [ ] [`docs/README.md`](./README.md) — the operating manual and the map of the docs pack.
- [ ] [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) — the living tracker: current stage,
      sprint board, locked decisions (§4), open decisions (§5), the environment record
      (§6), and known issues (§7). **The decision log is the "why", and it is the part
      that cannot be reconstructed from code.**
- [ ] [`ROADMAP.md`](./ROADMAP.md) — what was deliberately deferred, and where. §A is the
      full MVP feature list and ends with the post-MVP backlog.
- [ ] [`WORKFLOW.md`](./WORKFLOW.md) — how changes are made safely. The next developer
      starts here.
- [ ] [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md) and [`DESIGN.md`](./DESIGN.md) — the
      locked stack, the route map, and the visual system.
- [ ] [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) — especially **§15, the blocking
      invariants**. The approval gate is the product's core promise.
- [ ] `.env.example` — every variable **name** the site uses. Values live only in Vercel
      and the providers' own dashboards, and are never shown during a walkthrough.
- [ ] A 30–60 minute walkthrough: run the site locally, make a trivial change on a
      branch, open a PR, look at the Preview, merge it.

### The three facts that surprise people

**1. The approved inputs are not in the repo.** `docs/page-copy/`, `docs/page-designs/`
and `docs/source-assets/` are **gitignored** — they live on the owner's machine only.
A fresh clone does not contain the approved copy, the mockups, the design tokens, or
the source templates. **These must be handed over out-of-band**, or the reasoning and
raw material behind every page is lost. Confirm the transfer explicitly.

**2. Migrations are applied by hand.** There is no CLI migration step in this stack.
Versioned up-SQL and a matching `.down.sql` ship in the PR, and a human pastes them
into the Supabase **SQL Editor** — **non-production project first**, then Production.
The full protocol is [`WORKFLOW.md`](./WORKFLOW.md) §14, and the MCP read/write rules
are [`SUPABASE-MCP-SAFETY.md`](./SUPABASE-MCP-SAFETY.md) (`supabase-test` is read/write,
`supabase-prod-readonly` is read-only — never write to Production through any channel).
**A Vercel rollback does not roll back the database.**

**3. Production data has its own runbook.** [`ROLLBACK-RUNBOOK.md`](./ROLLBACK-RUNBOOK.md)
covers undoing the destructive content migration: rows come back from the down-SQL,
**bytes come back only from the cold archive**, and both halves are always needed —
restoring rows without bytes gives you a platform that looks healthy and hands every
partner a broken download. The archive's three required copies are listed there in §1;
**copy 3 is off-machine and is the owner's to place.** Verify any copy read-only with
`pnpm exec tsx scripts/verify-archive.ts --dir <path>`. Code-level rollback (revert,
redeploy a previous build) is [`ROLLBACK.md`](./ROLLBACK.md).

---

## 5. Standing owner-only actions

These do not transfer to a developer or to an AI agent. They stay with whoever owns
the site.

- [ ] **Merging PRs.** `main` is protected. Nothing reaches it without a green `CI`
      run and a tested Preview, and the owner does the merge.
- [ ] **Applying migrations to Production.** By hand, in the SQL Editor, after the same
      SQL has been applied and verified on the non-production project.
- [ ] **Holding the off-machine cold-archive copy** (`ROLLBACK-RUNBOOK.md` §1, copy 3),
      and re-verifying it periodically. *A OneDrive-synced folder is a replica, not a
      backup policy.*
- [ ] **Creating and holding the third-party accounts** the remaining sprints need —
      Upstash and Turnstile for SYS1.5, Sentry for SYS3 — and adding their values in
      Vercel. Agents get the variable **names** only.
- [ ] **Signing off approved copy and design changes**, and approving anything that
      moves a proof number.
- [ ] **Approving partner accounts** at `/admin/approvals`. This is the live product
      gate, not a build task.

---

## 6. Not transferable by us

Some things only the account holder can move. Plan for them, and do not let a handover
date depend on them.

- **The domain.** Registrar transfer is initiated by the registrant, needs the auth
  code, and is rate-limited by ICANN rules (a recently transferred or newly registered
  domain can be locked for up to 60 days). Start early.
- **Billing and payment methods.** Every service bills a card or an account we cannot
  change on the owner's behalf. Each provider must be re-pointed by its own account
  holder.
- **Account ownership itself.** GitHub org ownership, the Vercel team, the two Supabase
  organisations, the Microsoft 365 tenant, and the YouTube/Google account are moved by
  their owners through each provider's own flow. A developer can prepare and document
  the steps; only the holder can complete them.
- **The out-of-band inputs.** The gitignored `page-copy` / `page-designs` /
  `source-assets` folders and the off-machine archive copy live on the owner's storage.
  They are copied, not "transferred", and the copy must be confirmed received.

---

## 7. Maintenance notes (leave these in writing)

- [ ] **How to request changes.** One change = one branch = one PR, even after handover,
      even for a typo. The chain is: branch from `main` → build → `pnpm run typecheck`,
      `pnpm run lint`, `pnpm run build` → PR → green `CI` (job **verify**: gitleaks
      secret scan, install, typecheck, lint, build) → tested Vercel Preview →
      independent review where required → merge by the owner → Production smoke test.
      The binding version of that chain is [`WORKFLOW.md`](./WORKFLOW.md) §9–§12 — follow
      it there, not this summary, if the two ever drift.
- [ ] **Independent review is mandatory for risky work** (D-SYS-1): anything touching
      auth, the approval gate, RLS or schema, env handling, security headers or the CSP.
      The review runs over an immutable `merge-base..head` SHA range, its record is saved
      in [`docs/code-reviews/`](./code-reviews/), and **nothing merges over a Blocking
      finding**. Trivial PRs are exempt.
- [ ] **Dependency updates.** Agree a cadence (monthly is reasonable), always on a
      branch, always Preview-tested before merge. pnpm only — the version is pinned by
      `packageManager` in `package.json`. Never `npm` or `yarn`.
- [ ] **When Production breaks.** Who to call and on which channel: _owner to complete
      (private pack)_. Then: the Vercel rollback and Git revert paths in
      [`ROLLBACK.md`](./ROLLBACK.md), and the database limits in
      [`ROLLBACK-RUNBOOK.md`](./ROLLBACK-RUNBOOK.md). Remember a hosting rollback does not
      roll back the database.
- [ ] **Monitoring and renewals.** Who receives the domain-expiry, SSL, and (from SYS3)
      the error alerts, and what they do when one fires: _owner to complete (private
      pack)_. Confirm each alert reaches a real, monitored person — a failure nobody is
      paged for is the same as no monitoring. **There is no error tracking today; Sentry
      arrives in SYS3.**
- [ ] **Content edits.** Public copy is verbatim from the approved copy set and changes
      deliberately, never ad hoc in a component. Platform content — focus areas, guides,
      template files, page fields — is edited by HQ through `/admin/content/*`, and
      template files are served from a **private** Storage bucket by server-issued signed
      URLs to approved users only. The two booklet PDFs are the only public files.
- [ ] **Locked facts and numbers.** The site's proof numbers are **4 sections · 22 focus
      areas · 88 templates** (reconciled at PP7, owner-signed on the live site
      2026-08-20). They move only when real content is added. The retired 11 · 33 · 297
      figures describe deleted content and must never come back.
- [ ] **Known open items at handover.** Read [`PROJECT-STATUS.md`](./PROJECT-STATUS.md)
      §7 before promising anything. The headline one: public writes are still
      **unthrottled** (no rate limiting, no bot check) until sprint SYS1.5 ships.

---

## 8. Final checklist and sign-off

- [ ] Every service in §1 is transferred; outgoing access removed or downgraded as agreed.
- [ ] The private handover pack exists and carries every identity this file deliberately
      leaves blank.
- [ ] All shared credentials rotated per §3, values updated in Vercel, Production
      redeployed and re-tested.
- [ ] The gitignored inputs (`page-copy`, `page-designs`, `source-assets`) and the
      off-machine archive copy are handed over and **confirmed received**.
- [ ] Docs walkthrough completed; the incoming developer knows the manual is the docs
      pack and starts at `WORKFLOW.md`.
- [ ] Maintenance notes delivered in writing, with the on-call and alert-recipient
      blanks filled.
- [ ] Open items reviewed together — §7 known issues and `ROADMAP.md` §A — so nothing
      in the backlog is a surprise.

**Sign-off** — *all four fields below are owner-fill. Complete them in the private
handover pack, not in this public file.*

| | Name | Date | Signature |
|---|---|---|---|
| Delivered by | _owner-fill (private pack)_ | _owner-fill_ | _owner-fill (private pack)_ |
| Accepted by | _owner-fill (private pack)_ | _owner-fill_ | _owner-fill (private pack)_ |

Next step → future work re-enters through [`WORKFLOW.md`](./WORKFLOW.md), one branch at
a time.
