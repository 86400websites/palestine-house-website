# SEC1 — Next 15.5.28, React's fix for a dropped wake-up, and the open dependency updates

**Branch:** `claude/sec1-dependencies`, from `main` at `89ffe71`. **Requested by:** the owner, 2026-10-31 and 2026-11-01
("fix all the bugs", "fix the other open PRs and close them"). **Status:** built and measured; merged only by the owner.

It is its own PR because it fixes the live site as it stands and owes nothing to the content release, so it should
not wait for it. CR1 is built on top of it.

## What changed

- **`next` 15.5.23 → 15.5.28.** CI blocks on a critical advisory, so no PR could pass until this moved.
- **`patches/next@15.5.28.patch`:** React's own one-expression fix for a dropped wake-up. `patches/README.md` says
  why it exists, what to do when a Next bump stops the install, and when to delete it.
- **Everything Dependabot had open, at today's versions:** #96 (framer-motion to 13), #101 (`upload-artifact` to v6)
  and #102 (the minor and patch group). Those three PRs are closed as superseded by this one.
- `.gitattributes` pins a patch file's line endings, because pnpm pins its hash in the lockfile.

No application code, no migration, no env var, no `next.config.ts` or middleware change.

## The advisories

`pnpm audit` before: **3 critical, 25 high, 16 moderate, 2 low.** After: **0 critical, 2 high, 8 moderate.** The 2 highs
are one package, `postcss@8.4.31`, which Next pins exactly and runs at build time on this repo's own CSS.

| Advisory | What | Applies here? |
|---|---|---|
| GHSA-2xp9-vwfh-vxw4, critical | Remote code execution through the image optimizer, AVIF | Probably not reachable: Vercel normally serves `/_next/image` itself rather than this app's `sharp`. The advisory does not say so and it was not tested, so it is fixed regardless. |
| GHSA-2464-fhr4-w9xw, critical | The same, SVG, on glibc Linux | As above. |
| GHSA-p293-qw3h-jr36, critical | Remote code execution on Windows-hosted servers | No: production is on Vercel. |
| GHSA-p3m5-59mp-jv5r, high | Denial of service through Server Actions | Yes: this app uses them throughout. |

## The dropped wake-up

**The symptom.** A click on a link between private pages can do nothing, with the page's data and code all delivered,
and only a second click works. An admin form can sit on "Deleting…" after the server has finished. Found because CR1's
CT-010 failed about 1 run in 2, and it was measured rather than re-run.

**The cause.** Read line by line in the vendored `react-dom`, and it reproduces every field of the state measured after
a lost click. A render that has suspended without a fallback attaches its ping listener after choosing to wait. If the
Flight chunk resolves in that window, `.then` calls the listener synchronously, and `pingSuspendedRoot`, seeing a render
in progress, neither restarts it nor records the ping. The lanes are then marked suspended and warm, `getNextLanes`
returns nothing, and no callback remains. Any later update clears those lanes, which is why a second click works.
Upstream: [react#37830](https://github.com/react/react/issues/37830), fixed by
[react#36134](https://github.com/react/react/pull/36134), first shipped in Next 16.3.0. 15.5.28's copy of the file is
byte-identical to 15.5.23's, so no 15.x bump helps, and the backport
([react#38013](https://github.com/react/react/pull/38013)) is still open. The live state was captured on the admin
screen too: the same lanes, with the server's reply finished.

**Measured: a local production build of the committed code, against TEST, by robot.** Same build, same script, with and
without this PR.

| | Before | After |
|---|---|---|
| Tab, Operate to Program | 1 of 20 lost | 0 of 20 |
| Tab, Program to Support | 0 of 20 | 0 of 20 |
| Footer, Setup to Program | 1 of 20 | 0 of 20 |
| Section into its own guide reader | 7 of 20 | 0 of 20 |
| Guide reader back to its section | 3 of 20 | 0 of 20 |
| **Clicks, in all** | **12 of 100 lost** | **0 of 100** |
| **Files screen, add then delete, screen updates without a reload** | **4 of 28 stuck** | **0 of 28** |

Median time to the new URL did not change (about 1.2 seconds, both ways).

**Why not loading boundaries.** They were built and measured first, because they looked like the idiomatic answer: seven
`loading.tsx` files cured the links (0 of 100 on the worst routes). They were dropped. A boundary cannot reach a same-page
update, so the admin forms and `?topic=` pushes stayed exposed, and they would have added a loading state to every
private navigation and extra server reads to each prefetch. The patch removes the cause, in every flow, with no visible
change. CR1's later `CT-012` goes red if the patch goes missing before Next 16.3.

**A Next upgrade.** 16.3 or later is the permanent cure, and it is a major upgrade, so it is left for its own sprint.

## Checks at this head, before push

`pnpm run typecheck`, `lint` and `build`: exit 0. `pnpm audit --audit-level critical`: exit 0, the step CI blocks on.
Installed from the lockfile in a clean clone, with no env file and none of the gitignored private material present.

**Not shown here:** CI at the pushed head and a Vercel Preview, which come next and are recorded on the PR. Nothing was
measured on the live site. The full private-platform suite cannot run against this PR on its own: its Preview reads the
TEST database, which now holds CR1's content while this code's tests still expect the previous numbers. It runs against
CR1's Preview, which contains every change here.

## Rollback

Vercel, Deployments, promote the previous deployment, then revert through a PR. No data moved, so nothing else is owed.

## Follow-ups

- When Next moves again, `pnpm install` stops until the patch is re-targeted: `patches/README.md`. On a Dependabot PR that
  shows as a red install, on purpose.
- `postcss` clears when Next stops pinning it. CI still reports it, without blocking.
