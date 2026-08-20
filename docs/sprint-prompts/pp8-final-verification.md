# Sprint PP8 — Final verification

| | |
|---|---|
| **Date built** | 2026-08-20 |
| **Branch / PR** | `claude/sprint-pp8-final-verification` / (open) |
| **Goal** | Prove the cut-over platform end to end — by driving it, not reading it — close the open findings, and shut Stage 4. |
| **Migration** | `0034` (one `REVOKE`) — applied to **TEST only**; production is the owner's to run |

The full evidence, every query and every measurement, is
`docs/code-reviews/pp8-security-verification.md`. This record is the summary.

---

## What shipped

- **`0034_revoke_rls_auto_enable`** (+ `.down.sql` + `0034_verify_PROD_safe_readonly.sql`)
  — closes §7 issue #2, the last anon-executable `SECURITY DEFINER` function.
- **`src/app/admin/content/page.tsx`** — now `async` and gates on `isAdmin()`; closes
  §7 issue #3, the anonymous RSC structure leak.
- **`next.config.ts`** — `/academy` added to the child-redirect list; `/academy/[slug]`
  now redirects instead of 404ing.
- **`0031_verify_PROD_safe_readonly.sql`** — check 1 amended; it was reporting `ok=false`
  for the safest state a table can be in.
- **`.gitignore`** — `.playwright-mcp/` and screenshot names.
- **`docs/code-reviews/pp8-security-verification.md`** — the verification record.

**No change** to middleware, auth, the approval gate, any RPC, any route handler, env
handling or CI.

## What was verified, by running it

- **The whole RPC surface enumerated from `pg_proc`**, because §15 forbids stating the
  approval rule as a list: 45 authenticated-executable functions = 33 admin-gated + 7
  approval-gated + 3 helpers + 1 documented `/account` exception + 1 defect (now fixed).
  **Zero unaccounted.**
- **Approval enforcement executed, not grepped** — inside always-aborting transactions, a
  pending partner gets **0 rows from every platform read**, 0 from the download issuer, a
  refusal from Ask HQ, and only their own profile row; anon has no EXECUTE at all.
- **Draft is a boundary at the byte layer** — drafting one focus area drops topics 22→21,
  zeroes its rows *and* its `storage.objects`, and total objects 110→107: exactly its 3
  files, verified independently.
- **All four D-PP-i CHECK constraints attacked by direct `INSERT`**, each rejected by the
  *intended* constraint, plus a control insert that is accepted.
- **The partner platform driven in a browser** at 1440px and 320px: the D-PP-f model
  renders exactly, the reader is correct on **all 22** (one `h1`, no duplicate title
  heading, 5–10 Step `h2`s), **7 templates downloaded through real signed URLs and
  byte-exact** against the delivered documents' md5s, Ctrl/⌘+K search returns focus areas
  and templates carrying **no storage path, id or bucket name**, deep links work, Ask HQ
  and `/account` are correct.
- **Pending, anonymous and admin walkthroughs** — pending sees the review state and
  nothing else; anonymous is redirected from all 13 gated/admin routes with zero leakage;
  an admin still gets the content hub.
- **a11y** — skip link first, focus visible on every stop, native `<dialog>` in true
  `:modal` state with the trap walked, Escape restoring focus to the trigger, AA contrast
  everywhere (7.71–17.21), reduced motion honoured with no opacity trap.
- **Live production** — all six security headers, CSP byte-identical to the config.

## Checks & results

typecheck ✅ · lint ✅ · build ✅ · 320px ✅ · live production pass ✅ ·
§15 re-proven after `0034` ✅ · no secret in the diff ✅

## Deviations & learnings

- **The one-line fix for issue #2 does not work, and this was proven before shipping.**
  `revoke ... from anon` leaves the privilege intact: the ACL carried an explicit `anon`
  grant *and* a `PUBLIC` grant, and anon inherits the latter. It would have applied
  cleanly, reported success and closed nothing. **Always check the ACL, not just
  `has_function_privilege` after a revoke you assume worked.**
- **`rls_auto_enable` is an event-trigger function**, not a stray helper — it backs
  `ensure_rls`, which auto-enables RLS on every new `public` table. The risk in `0034`
  was never the grant; it was breaking the net. Proven safe by creating a table after the
  revoke and reading `relrowsecurity`.
- **A verification file can rot into a false alarm.** `0031`'s check 1 required policies
  to *exist* and be gated; `0033` dropped all four, so it reported `ok=false` for
  RLS-on-with-zero-policies — the strongest state available. The danger is not the red
  line; it is teaching an operator that a red line in that file is normal.
- **`list_migrations` returns `[]` on production.** Migrations here are applied by hand,
  so "prod is on `0033`" cannot be verified by asking — only by the shape it leaves.
- **⚠️ Ten probe defects, one product defect.** Every "failure" this sprint surfaced had
  to be debugged before it could be believed, and ten of eleven were the measuring
  instrument: `perform` swallowing a TABLE-returning function's zero rows (made the
  approval gate look open); an invalid `type` sending all four constraint attacks to the
  wrong constraint; `@` in a leak pattern matching `@media`; a case-sensitive sweep
  against the wrong case; `domcontentloaded` firing before RSC render; a regex matching
  guide prose about permits; counting occurrences of common words like "Money";
  `[class*="pw-search"]` matching `.pw-search-tools` so **the search palette appeared
  completely broken**; a `fullPage` screenshot showing **a blank band where all 22 focus
  areas belong**, then a jump-scroll test that appeared to confirm it; and
  `[role="dialog"]` missing a *native* `<dialog>` so the palette looked like it had no
  aria at all. **Two of those would have shipped as severe defect reports against working
  features.** The PP6c lesson holds exactly: debug the probe as hard as the product.
- **Harness guards shaped the work and were not worked around.** Reading `.env.local`,
  deleting the `admins` row, and the RCE-equivalent browser tool were each refused. The
  signed-in walkthrough was unblocked by the owner's explicit permission plus a
  scratchpad **login bridge** that reads the credentials and emits nothing but a session
  cookie — so they never entered the transcript.

## The independent review prompt (step 8-k)

Five rounds across this series have returned BLOCKING and been right five times.

```text
You are my independent code reviewer for the Palestine House website.
Read AGENTS.md in the repo root — it defines your rules, priorities, and the
blocking gating checks. Review the branch DIFF only (vs main), not the whole repo.

Context: this is PP8, the final verification sprint of Stage 4. FIVE previous
independent rounds in this series each returned BLOCKING and each found a real
Critical — including two in the single function that edits the owner's prose,
the second found AFTER a round had gone looking for exactly that class of bug.
Production is LIVE and serves real partners.

The diff is small and mostly evidence. It carries:
  - migration 0034 (+ .down.sql + a verification file): revokes EXECUTE on
    public.rls_auto_enable() from public, anon, authenticated. That function
    returns event_trigger and backs the `ensure_rls` trigger which auto-enables
    RLS on every new public table. Applied to TEST only.
  - src/app/admin/content/page.tsx: made async, gates on isAdmin(), to stop a
    synchronous segment streaming its hardcoded labels into an anonymous RSC
    payload before the layout's redirect() resolves.
  - next.config.ts: "/academy" added to the child-redirect list.
  - an amendment to supabase/sql/verification/0031_verify_PROD_safe_readonly.sql
    relaxing check 1 so that ZERO policies also passes (0033 dropped all four
    programming_sessions policies).
  - docs/code-reviews/pp8-security-verification.md: the sprint's claim-set.

Report serious issues only: correctness, security/data safety, secret leaks,
broken approval gating, App Router boundary mistakes (server/client, secrets
into client components), Supabase/RLS risks, migration risk, Vercel/env risks,
build breakage. No style nits; do not critique approved copy or the locked design.

JUDGE THE EVIDENCE, NOT ONLY THE CODE. Where the evidence file claims an
invariant holds, decide whether what was actually RUN proves what is CLAIMED.
Pay particular attention to:
  - whether relaxing 0031's check 1 has weakened a security verification file
    such that a real regression could now pass (e.g. RLS disabled + no policies);
  - whether 0034 is safe against a live production database, and whether its
    down-migration truly restores the prior ACL;
  - whether awaiting isAdmin() genuinely prevents the streaming leak;
  - whether any claim rests on a probe run inside an aborting transaction in a
    way the abort could have masked.

Any failure of the AGENTS.md "Palestine House gating checks" is blocking.

Return: Blocking issues · Non-blocking issues · Missing checks · exact
file:line locations · suggested fix for each · merge recommendation
(approve / request changes / blocking). Do not make changes, push, or merge.
```

## Follow-ups

| # | |
|---|---|
| 1 | **Owner: apply `0034` to production.** Paste `supabase/sql/migrations/0034_revoke_rls_auto_enable.up.sql`, verify with `supabase/sql/verification/0034_verify_PROD_safe_readonly.sql`. One `REVOKE`, instantly reversible, and the `ensure_rls` net was proven to survive it on TEST. |
| 2 | **Owner: the off-machine copy of the 297-file cold archive** (`ROLLBACK-RUNBOOK` §1, copy 3). Still outstanding from PP7. |
| 3 | **Owner: sign off the public copy** (D-PP-s) — now a **live** sign-off; screenshot supplied. |
| 4 | **`/admin/*` is not responsive** — every admin screen overflows at 320px (`scrollWidth` 480–736). Pre-existing since S11, HQ-only, no security or partner consequence. A design change, not a verification fix. |
| 5 | **Heading order skips `h1 → h3`** on the toolkit pages — a consequence of the deliberate single-group flattening. The obvious fix collides with the real group `h2` when a section gains a second group. Advisory under WCAG 1.3.1. |
| 6 | **8 blocks are invisible without JavaScript** — SSR emits `opacity:0` for the DR1 reveal system. Site-wide, pre-dates PP7/PP8. |
| 7 | **§7 issue #4** (a `.docx` upload once refused, never reproduced) stays open and self-diagnosing. |
