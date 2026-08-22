# SYS2 — Launch Gate run — independent review (D-SYS-1)

| | |
|---|---|
| **Date** | 2026-08-22 |
| **Range** | `cecb0d9c29c18fe84d02f032c33dffe3098c8853..13da82c6132df5a33534e52c67abe525615fc4c8` (immutable) |
| **Branch** | `claude/sprint-sys2-launch-gate-run` |
| **Scope** | The SYS2 gate run: the 98-spec suite, the morning-check workflow, the feature list and the test report. Tests + docs + one workflow — zero `src/`, zero `supabase/`. |
| **Verdict** | 🔴 **BLOCKING** → **all blocking and High findings fixed; re-run green** |

## Why this review was mandatory

D-SYS-1: a sprint touching **env handling** is a risky sprint, and this one introduced a
workflow that runs against **Production** plus a config that reads a bypass secret. The
review was right to be demanded — it returned BLOCKING and the finding was real.

## Findings and dispositions

| # | Sev | Finding | Disposition |
|---|---|---|---|
| **F1** | 🔴 **Blocking** | The two `morning-*` Playwright projects had **no `grep` of their own** — only the workflow's `--grep` flag limited them. A plain `pnpm run test:e2e` therefore scheduled **192** tests, ~90 of them credentialed specs inside projects that carry **no auth-setup dependency**; the documented full-run command was broken on a clean clone, and the config asserted a credential-free property it did not enforce. | **FIXED** — `grep: /@morning/` moved into both project definitions. Verified: full run **192 → 136**; morning selection still exactly **34**. |
| **F7** | Medium | Nothing refused a **production** `PLAYWRIGHT_BASE_URL` for the write-capable projects. The only brake was accidental (the robots do not exist in production, so sign-in fails). | **FIXED** — `playwright.config.ts` now refuses a production host outright unless `MORNING_CHECK=1`, which only the morning workflow sets. Verified both ways: production URL alone → refused with a named error; with the flag → 34 tests listed. |
| **F5** | High | The leak-probe baseline rejected an **empty** discovery but accepted a **garbage** one: a failed guide navigation lands on the branded 404, whose 22-character h1 passed the bare `length > 3` filter and would have made every "no gated string leaked" assertion vacuous. | **FIXED** — discovery now requires exactly 22 guide links, refuses any known denial/pending heading as a marker, and requires ≥3 distinct markers. |
| **F4** | High | `expect(body).toContain("/login")` is satisfied by the public header's own Sign in link, which every 200 carries — so the redirect half of AC-001/AC-002 proved nothing on streamed responses. | **FIXED** — asserts `/login?next=`, the app's real redirect signature (`(platform)/layout.tsx`, `admin/layout.tsx`, `account/page.tsx`), which no public header emits. Applied in `access-denied.spec.ts` ×2 and `morning.spec.ts`. |
| **F2** | High | AC-003 checked the **post-hydration DOM** (`page.content()`), not the raw response — invisible to the exact PP8 8-k failure shape (content streamed, then replaced by React), which is what §15 exists for. | **FIXED** — added `AC-003 (raw)`, which probes every platform route and all 22 guide URLs as the pending session in both HTML and RSC form. The DOM check stays as well. |
| **F3** | High | CT-005 proved only that **no Download button exists** for a pending partner — near-trivially true, and it would stay green if `get_resource_download` lost its `is_approved()` check. | **FIXED** — CT-005 now attacks the issuer: it takes a **real** resource id, proves the RPC **works** for the approved robot (so the probe is not shooting at a blank), then proves it returns **zero rows, no bucket, no storage path** for the pending robot. The passive UI check is retained as a secondary. |
| **F6** | Medium | J8 was the only mutating journey with **no `finally`** — a mid-test failure would leave the pending robot in `admins`, which would then fail AC-003/AC-006 on the *next* run looking exactly like a gate breach. | **FIXED** — wrapped in `try/finally` with a best-effort removal that cannot mask the original failure. |
| **F8** | Medium | FM-005 and FM-008 were recorded PASS with **no automated assertion** behind them; the feature list even claimed content was "asserted at the sending boundary". | **FIXED (record corrected)** — both lines now state their evidence is **MN-001**, the owner's inbox confirmation. Change-logged and flagged for the owner's re-approval. |
| **F9** | Medium | The report's "98/98 on the current head" went stale once later commits added specs. | **FIXED** — the run header now pins 98 to `b2ef492` and states today's counts (136 full / 34 morning), noting the site code is byte-identical throughout. |
| **F13** | Low | The feature list said "one disposable robot applicant per run"; the suite creates **two**. | **FIXED** — corrected and change-logged for re-approval. |
| **F10** | Medium | `verify-reset-flow.ts`'s non-production guard sat inside the `link` branch only. | **Accepted, deferred** — the tool is operator-run, never part of a gate run, and its worst case against production is a neutral reset request for an address that does not exist there. Hoisting the guard is queued with the MN-003 close-out. |
| **F11** | Low | Hardcoded non-production project ref in a committed test. | **Accepted** — the reviewer confirmed it is pre-existing in 30 tracked files (`.mcp.json`, `PROJECT-STATUS.md` §6) and that a project ref is a public hostname, not a secret. Not introduced here; not worth churn in this sprint. |
| **F12** | Low | The admin-marker leak check is whitespace-brittle (`>Marker<`). | **Accepted, deferred** — a real regression of the PP8 8-k shape would also trip the gated-string and `/guide"` probes in the same test. Worth tightening when that guard is next touched. |
| **F14** | Low | Robot applicants are never deleted, so the test queue accretes rows. | **Accepted** — non-production, `.invalid`, no safety impact; cleaned by hand this sprint. Automatic sweep is a follow-up. |
| **F15** | Low | The bypass-hop heuristic misfires on `/login?next=/setup` (ends with the path), double-requesting each probe. | **Accepted, deferred** — harmless today (the retry returns the same answer); noted so the next toucher tightens it to `location === path` plus a `set-cookie` check. |

## What the reviewer checked and found clean

Secret safety (no credential, token, password or real person's email anywhere in the diff);
CI integrity (`ci.yml` byte-identical, no collision with the required `verify` job — D-SYS-4);
scope (zero `src/`, zero `supabase/`); the morning workflow's actual behaviour (all 34
selected tests enumerated and verified read-only and credential-free); `retries: 0` on the
journeys project genuinely enforced; AC-004 called "the strongest test in the suite"; and the
three earlier proof-cell corrections verified as **legitimate corrections, not goalpost moves**.

## Lesson worth keeping

**A safety property enforced by a command-line flag is not enforced.** F1 was invisible to
twenty green runs because every one of them passed the flag. The fix — putting `grep` in the
config — is one line, and it is the difference between "safe because we invoked it correctly"
and "safe however it is invoked". The same reasoning produced F7's production refusal.
