# Error Tracking Setup — one-time checklist

> Run once. Sentry is the **only account this module needs** (free tier — plenty at this scale). The owner's hands-on time is roughly fifteen minutes across the whole checklist; the rest is one sprint.
>
> Guide: [`ERROR-TRACKING-GUIDE.md`](./ERROR-TRACKING-GUIDE.md) · Entry point: [`00-START-HERE.md`](./00-START-HERE.md)

## 🟡 State of this checklist: NOTHING BELOW IS DONE

**Not one box is ticked, and none of them is ticked by installing this file.** This module was **installed at SYS1** as documentation. It is **activated in sprint SYS3 — Error tracking (Sentry)** ([`../ROADMAP.md`](../ROADMAP.md) Stage 5, [`../PROJECT-STATUS.md`](../PROJECT-STATUS.md) §2).

**There is zero Sentry code in this repository today** — verified at SYS1: no `@sentry/nextjs` in [`package.json`](../../package.json), no `instrumentation.ts`, no `sentry.*.config.*`, no `sentry` match in `src/`, and no `SENTRY` name in `.env.example`. The site's two error boundaries ([`src/app/error.tsx`](../../src/app/error.tsx), [`src/app/global-error.tsx`](../../src/app/global-error.tsx)) exist and render properly but **report nothing to anyone**.

| Part | Who | When | State |
|---|---|---|---|
| **1 — Create the recorder** | 👤 **Owner**, entirely | **Now** — it is the prerequisite for planning SYS3 | ⬜ Not started |
| **2 — Install it** | 🤖 Claude Code (one PR) + one owner step | **SYS3** | ⬜ Not started |
| **3 — Point the alarm at the inbox** | 👤 **Owner** | **SYS3**, after the install PR merges | ⬜ Not started |
| **4 — Fire the test shot, then close** | 🤖 Claude Code + 👤 **Owner** | **SYS3**, and it is the exit gate | ⬜ Not started |

---

## ⚠️ Before Part 2 is planned: the CSP amendment is part of this install

[`next.config.ts`](../../next.config.ts) ships **`connect-src 'self'`**. Sentry's browser reporting POSTs to its ingest origin, which that directive **silently blocks** — the SDK looks installed and the dashboard stays empty.

**Already decided — D-SYS-10** (owner, 2026-08-21; [`../PROJECT-STATUS.md`](../PROJECT-STATUS.md) §4): the ingest origin is added to `connect-src` **in SYS3**, and the "YouTube embed origin only" wording is corrected in the **same PR** in `next.config.ts`'s comment, [`../../CLAUDE.md`](../../CLAUDE.md)'s Hosting note and [`../TECH-ARCHITECTURE.md`](../TECH-ARCHITECTURE.md). Do not re-open it; the rejected `tunnelRoute` alternative and why it is not free here are in [`ERROR-TRACKING-GUIDE.md`](./ERROR-TRACKING-GUIDE.md) §1.

**Sequencing consequence:** the DSN names the ingest origin, so **Part 1 must be complete before the CSP line can be written**.

---

## Part 1 — Create the recorder (👤 **Owner**, ~5 min, do this first)

Every box here is the owner's. Claude Code cannot do any of it — it needs an account, a browser and an inbox.

- [ ] 👤 **Owner:** go to **sentry.io** and create a **free** account, or open the existing one (one account holds every site as a separate project).
- [ ] 👤 **Owner:** **Create Project** → platform **Next.js** → name it after this site (suggested: `palestine-house`).
- [ ] 👤 **Owner:** Sentry shows a **DSN** — a long address containing `ingest`. Copy it. It is the site's mailbox address for errors: fine to hand to Claude Code, it unlocks nothing else. ⚠️ **It is still a value, not a name — it goes into Vercel and into chat, never into a committed file. This GitHub repository is public.**
- [ ] 👤 **Owner:** hand it over when SYS3 starts: *"Set up error tracking from `docs/error-tracking` — here's the Sentry DSN: […]"*
- [ ] 👤 **Owner:** confirm which inbox the Sentry account uses. It must be one that is read daily. → **Owner to fill: ______________________** *(name the inbox here in your own private notes, not in this file — the repo is public.)*

## Part 2 — Install it (🤖 **Claude Code**, sprint **SYS3**, one PR)

Nothing in this part happens before SYS3, and nothing in it is a documentation change — this is the part that writes code.

- [ ] 🤖 **SYS3:** add `@sentry/nextjs` with **pnpm** (`pnpm add @sentry/nextjs` — never npm or yarn; the package manager is pinned in `package.json`). This is the first Sentry dependency the repo has ever had.
- [ ] 🤖 **SYS3:** wire the SDK — `instrumentation.ts` (`register` + `onRequestError`), the client instrumentation, and the server/edge init — reading the DSN from the env var **by name only**. The reserved name is **`NEXT_PUBLIC_SENTRY_DSN`** ([`../TECH-ARCHITECTURE.md`](../TECH-ARCHITECTURE.md) env block, [`../SUPABASE-VERCEL-SETUP.md`](../SUPABASE-VERCEL-SETUP.md) table) — reserved, not final: [`../ENV-VARS-SAFETY.md`](../ENV-VARS-SAFETY.md) records that SYS3 is the sprint that fixes the name. Guard every init so a **blank DSN genuinely no-ops** — several docs already claim Sentry "no-ops when env vars are absent", and this is the box that makes that sentence true.
- [ ] 🤖 **SYS3:** ⚠️ **the D-SYS-10 CSP amendment** — add the DSN's ingest origin to `connect-src` in [`next.config.ts`](../../next.config.ts), and in the **same PR** update that file's own comment, `CLAUDE.md`'s Hosting note and `TECH-ARCHITECTURE.md`. Re-walk [`../SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) §10. `worker-src` only if Session Replay is ever enabled — it is not in scope.
- [ ] 🤖 **SYS3:** enable **user context** so *"which partner hit this"* is answerable — the account identifier, set after the Supabase session loads, with Sentry's default **data scrubbing** on. That is what makes [`../SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) §9's *"PII is minimized in logs; Sentry scrubs request bodies"* box tickable. Never send a password or a signed Storage URL.
- [ ] 🤖 **SYS3:** **tag environments** so Production errors are unmistakable from Preview noise. The Part 3 alert rule fires on Production only, so this must be verified on a Preview deploy first.
- [ ] 🤖 **SYS3:** enable **readable error reports** — wrap the config with `withSentryConfig` so source maps upload when `SENTRY_AUTH_TOKEN` is present. ⚠️ **CI has no such secret**, and CI runs `pnpm run build`; the build must still pass without it. The build-time names are reserved already: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` (server/build-time only — never behind a `NEXT_PUBLIC_*` name).
- [ ] 🤖 **SYS3:** wire the **existing** error boundaries — add `Sentry.captureException(error)` inside a `useEffect` in **both** [`src/app/error.tsx`](../../src/app/error.tsx) and [`src/app/global-error.tsx`](../../src/app/global-error.tsx). Imports only. ⚠️ **Do not change a single rendered string** in either file — that copy is approved brand-voice copy ("That didn't work." / "Something broke on our side, not yours.").
- [ ] 🤖 **SYS3:** add the four Sentry names — **commented, names only, no values** — to `.env.example` under an `# Error tracking — Sentry` block. Do **not** open `.env.local`; inspect the example file with `git show HEAD:.env.example`.
- [ ] 🤖 **SYS3:** because this PR touches **security headers and the CSP**, independent review is **mandatory** (**D-SYS-1**): immutable `merge-base..head` range, record saved in [`../code-reviews/`](../code-reviews/), no merge over a Blocking finding — [`../WORKFLOW.md`](../WORKFLOW.md) §8.
- [ ] 👤 **Owner:** add `NEXT_PUBLIC_SENTRY_DSN` in the Vercel dashboard (**Production and Preview**), value pasted by you, then redeploy. Add `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` only if source-map upload is wanted. Merge the PR through the normal workflow. ([`../SUPABASE-VERCEL-SETUP.md`](../SUPABASE-VERCEL-SETUP.md), [`../ENV-VARS-SAFETY.md`](../ENV-VARS-SAFETY.md).)

## Part 3 — Point the alarm at the inbox (👤 **Owner**, ~3 min, after the install PR merges)

Claude Code supplies the exact click path in the SYS3 close-out. Do this **after** environment tagging is verified, or Preview noise will reach the same inbox as Production.

- [ ] 👤 **Owner:** in Sentry → the project → **Alerts** → create the rule: **a new issue appears in Production → email me immediately**. (Optional later: a second rule for "an old issue is happening a lot".)
- [ ] 👤 **Owner:** confirm the Sentry account email is the inbox you actually read daily (the one named in Part 1).

## Part 4 — Fire the test shot, then close (this is the SYS3 exit gate)

- [ ] 🤖 **SYS3:** ship one **deliberate test error** behind a throwaway hidden path — a route that throws only when hit with a nonce query parameter. Keep it on a **public** path, not behind the approval gate, so the probe is independent of auth state and adds no gated surface. It rides the normal chain: branch → PR → Preview → owner merges.
- [ ] 👤 **Owner:** hit the path once on Production, then confirm the **alert email actually arrived** and open it. You are looking at your first Sentry issue: the page, the device, the error, the moment. This is exactly what a real one will look like. ⚠️ Also confirm there is **no CSP violation** in the browser console — that is the proof D-SYS-10 landed correctly.
- [ ] 🤖 **SYS3:** **remove the test error in the same sprint**, in a second PR. The exit checklist is not tickable until that removal is merged. (PP8's committed SQL probes are the opposite case and stay where they are — a replayable proof is worth keeping. A live route that throws is not a proof, it is a liability, so it goes.)
- [ ] 🤖 **SYS3:** seed `docs/INCIDENT-LOG.md` from [`templates/INCIDENT-LOG-TEMPLATE.md`](./templates/INCIDENT-LOG-TEMPLATE.md) — empty register, closure rules in place.
- [ ] 👤 **Owner:** record the dated confirmation in [`../PROJECT-STATUS.md`](../PROJECT-STATUS.md). **An unverified alert channel is the same as no alert channel** — this box is the point of the whole checklist.

---

## One dependency, deliberately sequenced

Step 4 of the incident lane ("a new test, always") needs the launch-gate suite from **SYS2** ([`../testing-setup/00-START-HERE.md`](../testing-setup/00-START-HERE.md)). Today there is no `tests/` directory and no `test` script — `package.json` defines `dev`, `build`, `start`, `lint`, `typecheck` and nothing else. SYS2 runs before SYS3 for this reason. Door A works standalone; the lane's regression step does not.

**When every box above is ticked:** alerts land in the owner's inbox (Door A), reports go to [`/handle-error`](../../.claude/skills/handle-error/SKILL.md) (Door B), and [`ERROR-TRACKING-GUIDE.md`](./ERROR-TRACKING-GUIDE.md) §4 is the lane every incident travels. **Until then, nothing is watching.**
