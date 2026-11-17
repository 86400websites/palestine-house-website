# L1 — Domain launch — independent review (D-SYS-1)

| | |
|---|---|
| **Date** | 2026-11-17 |
| **Range** | `4d1352c..ae3e081` (immutable), then the fix delta `ae3e081..07d08ed` re-reviewed on its own |
| **Branch / PR** | `claude/sprint-l1-domain-launch` / [#110](https://github.com/86400websites/palestine-house-website/pull/110) |
| **Scope** | The Search Console file, `og:url` and the JSON-LD logo, the in-site video player on all 26 Watch Video placements, the Reduce Motion fix, the private header logo link, the AD-006 and PG-012 tests, the launch runbook and its read-only checker, and the tracker changes. No route, gate, RPC, migration, middleware, env var, header or CSP change. |
| **Verdict** | **APPROVE** from the security and code-correctness lenses; **request changes** from the docs lens. Four findings confirmed, **none blocking**, all four fixed in `2100741` (code) and `07d08ed` (docs). |

## Why this review was mandatory

D-SYS-1: the sprint adds a third-party frame to approval-gated pages, and its runbook drives
production auth configuration (the Supabase redirect allow-list and Site URL). Either is enough
to make a sprint risky.

## How it was run

Three independent reviewers, each given the range, `AGENTS.md` and the sprint's stated intent,
and nothing of the engine's own conclusions: **security and the approval gate**, **code
correctness in real browsers**, and **whether the docs would mislead the owner during the
launch**. Each finding then went to a separate skeptic told to refute it and to default to
refuted when unsure. 10 agents. Reviewers were told not to build, start servers or run
Playwright, because the Launch Gate suite was running on the same machine.

## Findings and dispositions

| # | Sev | Finding | Disposition |
|---|---|---|---|
| **R1** | Non-blocking | **Focus did not return to Watch Video after closing the player in WebKit** (Safari, and every browser on an iPhone or iPad). WebKit does not focus a button on a click or tap, so `showModal()` stores nothing to restore, and when the `close` event fires focus is still on the dialog or inside it, which is not "body", so the hand-written fallback was skipped and focus fell to the page when the dialog unmounted. AD-006's focus check runs only in Chromium, where the browser restores focus itself. | **FIXED** (`2100741`): the fallback now refocuses Watch Video when focus is nowhere, on the page body, or still inside the closing dialog, with `preventScroll`. |
| **R2** | Non-blocking | The runbook's emergency rollback named **Promote to Production**. `ROLLBACK.md` Step 2 and Vercel's documentation both say the instant restore is **Instant Rollback** on the Production Deployment tile, and that later merges then stay off the live site until **Undo Rollback**. | **FIXED** (`07d08ed`), worded as `ROLLBACK.md` words it. |
| **R3** | Non-blocking | Runbook step 3 said a manual Morning Check run "proves its alarm", but with failure-only notifications a green run sends no email. | **FIXED** (`07d08ed`): retitled, and an optional ten-minute proof added: point `PRODUCTION_URL` at the reserved `https://alarm-test.invalid`, run the workflow, see the failure email, set it back. The workflow selects only the read-only morning projects whatever the variable holds. |
| **R4** | Non-blocking | The runbook said the later decision to redirect the Vercel address was tracked in `POST-LAUNCH-BACKLOG.md`; it is in `ROADMAP.md` §A. | **FIXED** (`07d08ed`). |

## Refuted (raised, then refuted by the skeptic, with the reason kept)

- **"Nothing checks that the owner's 26 videos allow embedding."** The skeptic sent YouTube's
  oEmbed request for all 26 production links (26 × 200) and read each watch page
  (`playableInEmbed: true`). The sprint had done the same check before writing the player.
- **"Tapping outside the player on an iPhone may not close it."** React DOM puts a no-op native
  `onclick` on every element given an `onClick` prop, precisely to work around Mobile Safari's
  click delegation (`trapClickOnNonInteractiveElement`), so the tap reaches the dialog's handler.
- **"P2 (lock the merge button behind CI) has no undo."** Accurate but below the bar: nothing it
  says is false, the only check name containing "Install" is the CI job's, and the step already
  warns against typing the name.

## What the reviewers checked and found clean

- Every `AGENTS.md` gating check: no gated route, RPC, public projection, download path or signup
  path touched; `next.config.ts`, `src/middleware.ts`, `vercel.json` and the lockfile unchanged.
- The player frames only `https://www.youtube-nocookie.com/embed/<11-character id>?autoplay=1&rel=0&playsinline=1`,
  rebuilt by `youTubeEmbedUrl()`; the non-YouTube fallback is reached only by an http(s) URL that
  already passed `safeHttpUrl` (which refuses `javascript:`, `data:` and protocol-relative values);
  nothing is framed before the press.
- The live CSP and headers on `www` are unchanged; Permissions-Policy does not block autoplay,
  fullscreen or picture-in-picture; the referrer the frame sends is the origin only.
- `reveal.tsx`: the same `m.div` on server and client, only the transition varies; with
  `duration: 0` framer-motion applies the final keyframe at once; the normal animation is
  unchanged for everyone else.
- `og:url: "./"` resolves per route through the same Next function as the canonical; no page
  overrides `openGraph`.
- The new JSON-LD logo is tracked, 289×303, served 200 `image/png`; the verification file is
  53 bytes with no newline, byte-exact.
- `scripts/verify-domain-launch.ts` is GET-only, holds no credentials, writes nothing, is wired
  into nothing, and behaves as documented against the live site.
- AD-006's exact-name locator separates the live button from the placeholder; PG-012 submits
  nothing; the Playwright production guard is untouched.
- No new name, email, account id, project ref or credential in the public repo.
- `pnpm exec tsc --noEmit` exit 0 at `ae3e081`.

## Re-review of the fix delta: `ae3e081..07d08ed` → **APPROVE**

A fresh reviewer, given only the delta and the four findings, read-only:

- **R1 resolved.** The fallback covers focus on nothing, on the body, on the dialog itself or on
  the YouTube frame inside it (`contains` is inclusive): exactly what WebKit leaves at `close`. In
  Chromium the browser has already restored focus, so the branch does nothing there. `close` is a
  discrete event, so React commits after the listener returns and the dialog is still attached
  while focus moves; React's own commit-time focus handling then finds the trigger focused and does
  not fight it. `preventScroll` matches what the native restore does.
- **R2, R3, R4 resolved.**
- **The new alarm proof is safe, verified line by line:** the workflow selects only the two
  morning projects, which carry their own `@morning` grep, have no sign-in dependency, ignore the
  journeys and read no secrets; the seven `@morning` specs only make GET requests through the base
  URL and hard-code no real host; `.invalid` is reserved (RFC 6761) and never resolves, so the run
  fails fast and touches no server; no other workflow reads the variable. GitHub mails a manual
  run's failure to whoever pressed Run; the account that last changed the workflow's schedule is
  the same one, so the manual proof also covers the 06:30 alarm, provided the owner presses Run as
  that account.

Two new Low points, both fixed in the closing commit: the rollback's undo button has been labelled
both **Undo Rollback** and **Manage** by Vercel, so the runbook now names both and says to choose
the **fixed** deployment; and the sprint record now lists every file the sprint changed beyond its
plan. Two follow-ups outside the range were taken up: `PROJECT-STATUS.md` §7 #10 no longer claims a
green run proves the alert, and the search overlay's matching Safari focus gap is logged as §7 #23.
