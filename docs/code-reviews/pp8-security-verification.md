# PP8 — verification evidence

The running evidence file for sprint PP8 (Final verification). One section per
gated sub-step. Every claim here is something that was **run**, with the result
recorded as it came back — including the ones that came back wrong.

Branch: `claude/sprint-pp8-final-verification`, off `main` = `dda9c0f`.

---

## 8-a — kickoff verification

The PP-series rule since PP6a: *the written plan is a hypothesis — verify every
claim from source before trusting one.* It earned its place again. **The plan was
wrong twice**, and both corrections are recorded below rather than quietly fixed.

### ✏️ Correction 1 — `platform_sections` is 5, not 4

The sprint plan asserted 4 sections and production returned **5**, which read as
a failure for about ten minutes. It is not. The fifth row is `about`
(`num = 0`, `sort_order = 0`) — the `/dashboard` About landing page, which lives
in `platform_sections` because it carries the same page chrome (title, lead,
hero image) as the toolkit sections. It has **zero groups and zero topics**.

The published figure "4 sections" counts the four **toolkit** sections. Both are
true; the plan conflated them.

| section | num | groups | topics | published |
|---|---|---|---|---|
| `about` | 0 | 0 | 0 | — (landing chrome only) |
| `setup` | 1 | 1 | 5 | 5 |
| `operate` | 2 | 1 | 6 | 6 |
| `program` | 3 | 1 | 6 | 6 |
| `support` | 4 | 1 | 5 | 5 |

5 / 6 / 6 / 5 = **22**, exactly `content-migration-map.md` §3.

### ✏️ Correction 2 — there is no migration ledger to ask

`list_migrations` against production returns **`[]`**. This project applies
migrations by hand through the SQL Editor (`WORKFLOW.md` §14), so nothing
maintains `supabase_migrations.schema_migrations`. **"Production is on `0033`"
cannot be verified by asking the database what it has applied** — it can only be
verified by the shape `0033` leaves behind. Any future check that reads the
ledger will report an empty history and be believed.

Verified by shape instead, and it holds:

- `elements.overview_md` — gone · `elements.watch_out_for_md` — gone
- `checklist_items`, `checklist_progress`, `academy_modules` — all three gone
- all seven retired RPCs gone (`set_checklist_progress`, the four
  `admin_*_academy_module*`, `member_programming_sessions`,
  `publish_programming_session`)
- `programming_sessions` still present, **0 policies** = default-deny, as decided

### Production state — 20 assertions, read-only

19 passed first time; the 20th was correction 1 above.

| | expected | actual |
|---|---|---|
| elements | 22 | 22 ✅ |
| platform_topics / published | 22 / 22 | 22 / 22 ✅ |
| platform_groups | 4 | 4 ✅ |
| templates (`is_public=false`, `doc_key IS NULL`, `code IS NOT NULL`) | 88 | 88 ✅ |
| guide files (`doc_key IS NOT NULL`) | 22 | 22 ✅ |
| public booklets | 2 | 2 ✅ |
| resources total | 112 | 112 ✅ |
| storage objects (`resources` bucket) | 110 | 110 ✅ |
| legacy A–K coded elements | 0 | 0 ✅ |
| numeric-coded elements (new IA) | 22 | 22 ✅ |
| private resources with no element (orphans) | 0 | 0 ✅ |
| topics not linked to an element | 0 | 0 ✅ |

**Referential integrity, both directions, both databases:**
rows with no object (broken downloads) = **0**; objects with no row (orphan
bytes) = **0**.

### TEST is a faithful mirror — so E2E on TEST tests the real words

This mattered enough to prove rather than assume: if TEST held a different
generation of the corpus, every walkthrough in 8-d/8-e would be theatre. (It is
not a hypothetical — PP6c found TEST and PROD holding *different generations* of
the legacy content, 630,020 chars vs 872,068.)

| digest | PROD | TEST | |
|---|---|---|---|
| elements (code, slug, title, one-line, guide-body md5) | `25e26ad3…` | `25e26ad3…` | **identical** |
| guide-body characters | 68,492 | 68,492 | **identical** |
| topics (slug, title, description, intro, image, published) | `618c4ea9…` | `618c4ea9…` | **identical** |
| storage object bytes | 20,435,564 | 20,435,564 | **identical** |
| resources rows (incl. `storage_path`) | `e3500efd…` | `abfb7e8b…` | differ — expected |
| storage object names | `0536b840…` | `c40e5f8c…` | differ — expected |

The two that differ do so **by design**: every uploaded file's path carries a
base-36 upload-time suffix (`…-msw5cp8d.docx`), so two independent loads produce
two sets of names for identical bytes. Content, counts and total bytes match
exactly, and each environment is internally consistent (0 broken, 0 orphans
above). **Conclusion: TEST is a valid stand-in for the partner-visible corpus.**

### The four §7 known issues, each re-derived

| # | recorded | re-derived |
|---|---|---|
| 1 | Medium — public writes have no Upstash rate-limit / Turnstile | **Stands.** The only occurrence of those names in `src/` is the deferral comment at `src/app/api/resend/contact/route.ts:17`. Accepted per D-S6-a; §7's own preamble carves it out. |
| 2 | Low — `rls_auto_enable()` anon-EXECUTE | **Stands, on BOTH databases.** It is still the only anon-executable `SECURITY DEFINER` function in `public`. Closed in 8-c. |
| 3 | Low — `/admin/content` leaks its four labels + paths to anonymous RSC | **Stands, and the mechanism is confirmed from source.** `ContentAdminPage` is a *synchronous* component over a hardcoded `SECTIONS` array — it awaits nothing gated, so Next streams its flight data in parallel with `admin/layout.tsx`'s `redirect()`. The data-bearing admin screens fail closed because they await gated reads. Closed in 8-c. |
| 4 | Low — a `.docx` upload once refused, never reproduced | **Stays open and self-diagnosing.** Unchanged; closes when the owner next uploads by hand and reports the message. |

### The `0031` policy sweep — both databases

Exactly **three** ungated policies, and no fourth, on PROD *and* TEST:
`applications_insert_own`, `applications_select_own` (apply IS sign-up — an
unapproved user must create and read their own application) and
`profiles_select_own` (`/account` is session-gated by design). Re-run properly
against the committed
`supabase/sql/verification/0031_verify_PROD_safe_readonly.sql` in 8-b.

### Accounts available on TEST for 8-d / 8-e

6 profiles — **5 approved, 1 pending** — and 2 admins. Both walkthroughs have a
real account to run as; no seeding needed.

### ⚠️ Two things flagged rather than proven

1. **`.env.local` could not be read** — the harness refused the command, which is
   correct behaviour for a file holding secrets. The check it would have
   performed (does local dev point at TEST, not PROD?) is instead guaranteed
   *structurally* by `scripts/lib/connect.ts`: TEST is the default, production
   must be named with `--target prod`, each target reads its own variables **by
   name with no fallback**, and each asserts its host **exactly** before the
   first request. A `.env.local` pointed at production would make any default
   -target script throw at the host assertion rather than write to the wrong
   database. Owner to confirm the file targets TEST; the tooling cannot be
   fooled either way.
2. **`sharp`'s build script is ignored by pnpm** (`pnpm install` prints it).
   Local image behaviour may therefore differ from Vercel's. Noted for 8-h so a
   local measurement is not mistaken for the production one.

### Baseline

`pnpm install --frozen-lockfile` · `pnpm run typecheck` · `pnpm run lint` ·
`pnpm run build` — **all green** on `dda9c0f` before any change.

---

## 8-b — §15 invariants, re-verified end to end

§15's first bullet is explicit that the approval rule must be stated **as a
blanket, never as a list**, because an enumeration silently becomes an
allowlist. So the surface was enumerated **from the database**, not from the
doc, and then every claim was **executed** rather than pattern-matched.

### The whole RPC surface, classified from `pg_proc`

45 functions are `EXECUTE`-able by `authenticated` in `public`. Every one is
`SECURITY DEFINER` with `search_path` pinned to `''` — except the one defect.

| class | n | anon EXECUTE |
|---|---|---|
| admin-gated (body references `is_admin`) | 33 | none |
| approval-gated (body references `is_approved`) | 7 | none |
| helpers (`is_admin`, `is_approved`, `is_published_object`) | 3 | none |
| documented `/account` exception (`set_my_account`) | 1 | none |
| **DEFECT — `rls_auto_enable`** | 1 | **yes** (issue #2, closed in 8-c) |
| **`*** UNACCOUNTED ***`** | **0** | — |

Zero unaccounted is the assertion that matters: a new RPC shipped without a gate
would land in that last row.

### …and then actually called, because a regex is not enforcement

`prosrc ~ 'is_approved'` proves a function *mentions* approval, not that it
*enforces* it. Every probe below ran inside a transaction that ends in
`RAISE EXCEPTION`, so **nothing was written** — the pattern PP7 used to measure
guards without leaving state behind.

| | approved partner | pending partner | anonymous |
|---|---|---|---|
| `get_platform_sections()` | 5 | **0** | DENIED (no EXECUTE) |
| `get_platform_topics()` | 22 | **0** | DENIED (no EXECUTE) |
| `get_element(slug)` | 1 | **0** | DENIED (no EXECUTE) |
| `get_resources()` | 112 | **0** | DENIED (no EXECUTE) |
| `get_resource_download(id)` | 1 row | **0 rows** | DENIED (no EXECUTE) |
| `submit_support_request()` (Ask HQ) | — | **REFUSED** | DENIED |
| `get_my_profile()` | 1 | **1 — own row only** | DENIED |
| `public.resources` direct read | — | — | **0 rows** (RLS default-deny) |
| `public.elements` direct read | — | — | **0 rows** (RLS default-deny) |
| `storage.objects` (`resources`) | 110 | **0 — BYTE layer** | — |

The pending row for `get_my_profile` is **correct and required**: a pending
partner must be able to resolve their own approval status and use `/account`.
It returns their own row and nothing else.

### Draft is a boundary for bytes as well as rows

Proven by drafting a real focus area (`get-legally-ready`) inside the aborting
transaction and re-reading as an **approved** partner:

| | result |
|---|---|
| topics visible | 22 → **21** |
| `get_element()` on the drafted slug | **0 rows** |
| its resource rows via `get_resources()` | **0** |
| its `get_resource_download()` | **0 rows** |
| **its `storage.objects` rows** | **0** |
| all objects visible | 110 → **107** |

110 − 107 = **3**, and that focus area holds exactly 3 files (1 guide + 2
templates) — verified independently. The arithmetic closes, so the drop is its
files and nothing else. `is_published_object()` is doing real work.

### The four D-PP-i CHECK constraints, attacked directly

Direct `INSERT`s that bypass every RPC. Each assertion names the constraint it
*expects*, so a rejection by the wrong one cannot score as a pass:

| attack | result |
|---|---|
| private file pointed at another bucket | REJECTED by `resources_private_bucket_shape` ✅ |
| private file with no focus area | REJECTED by `resources_private_needs_element` ✅ |
| guide file with no focus area | REJECTED by `resources_guide_needs_element` ✅ |
| private file with neither `code` nor `doc_key` | REJECTED by `resources_private_needs_code` ✅ |
| duplicate `storage_path` | REJECTED by `resources_storage_key` (UNIQUE) ✅ |
| **CONTROL — a legitimate private template** | **ACCEPTED** ✅ |

The control matters: without it, four rejections prove only that the table
rejects everything.

### The admin gate — approved is not admin

As an **approved, non-admin** partner: `is_approved()` = true,
`is_admin()` = **false**. Admin reads return **zero rows**; admin **writes**
(`admin_set_platform_topic_published`, `admin_upsert_element`) raise
**`42501 insufficient_privilege`**. Both directions fail closed.

### Signed-URL issuance

`src/lib/resources/actions.ts` — TTL **60 seconds**; the raw storage path never
reaches the client; the URL is minted with the **caller's own** authenticated
client, so storage RLS applies on top of the RPC gate; a zero-row result and an
unknown id return the *same* generic message, so there is no enumeration oracle.

### Client bundle + live production headers

- `.next/static` — **no** occurrence of `service_role`, `sb_secret_`,
  `SUPABASE_SECRET`, `RESEND_API_KEY`, `SENTRY_AUTH_TOKEN`,
  `UPSTASH_REDIS_REST_TOKEN`, `TURNSTILE_SECRET`, `MAILCHIMP_API_KEY` or any
  credential variable; no JWT-shaped token at all.
- Live production response carries all six headers, CSP byte-matching
  `next.config.ts` with **no `unsafe-eval`** (dev-only, correctly absent):
  `Content-Security-Policy` · `X-Frame-Options: DENY` ·
  `X-Content-Type-Options: nosniff` · `Referrer-Policy` ·
  `Strict-Transport-Security: max-age=63072000; includeSubDomains` ·
  `Permissions-Policy`.

### Anonymous probes against LIVE production

| route | result |
|---|---|
| `/dashboard` | **0** focus-area strings, storage paths or codes |
| `/setup` | **0** focus-area titles |
| `/admin/content` | 🔴 **four card labels + all four `/admin/content/*` paths**, in the HTML *and* the RSC flight payload |

**Issue #3 is reproduced on production**, exactly as recorded — structure only,
never data. Closed in 8-c.

### The `0031` sweep — and a stale check it exposed

Run from the committed
`supabase/sql/verification/0031_verify_PROD_safe_readonly.sql`:

| check | PROD |
|---|---|
| 1 all `programming_sessions` policies require approval | **`false` — see below** |
| 2 ownership still required | true |
| 3 RLS enabled on `programming_sessions` | true |
| **4 ungated policies are only the 3 documented ones** | **true** ✅ |
| 5 every public table has RLS enabled | true |

**Check 4 is the one PP8 owed, and it passes**: exactly
`applications_insert_own`, `applications_select_own`, `profiles_select_own`, and
no fourth, on **both** databases.

⚠️ **Check 1 is stale, not broken security.** It was written before `0033`, and
asserts `count(*) > 0` — i.e. *policies exist and all are gated*. `0033` dropped
all four `programming_sessions` policies, so the table is now **RLS-enabled with
zero policies = default-deny**, which is strictly *stronger* than any set of
gated policies. The check reports `ok = false` for the safest possible state.
Left uncorrected, the next operator either panics or — worse — learns that a
red line in this file is normal. Fixed in 8-c.

### ⚠️ Two defects found in my own probes, not in the product

Recorded because this project's record is that the probe is where the bug
usually is — five of five in PP6c:

1. **`perform` on a TABLE-returning function swallows the result.** The first
   pending-partner probe reported `download = ISSUED`, which read as a live
   approval-gate breach. `get_resource_download` is a SQL function returning
   `TABLE(...)` with `and public.is_approved()` in the `WHERE`: a pending caller
   gets **zero rows**, not an exception, so `perform` succeeded and the probe
   called it success. Re-run counting rows: **0**. The gate was never open.
2. **The constraint attack used an invalid `type`.** `type = 'template'` is not
   in `resources_type_check`'s allowed set (`form, script, log, report,
   approval, guide, booklet`), so all four D-PP-i attacks would have been
   rejected by **the wrong constraint** and scored as passes. Caught only
   because a later attack's handler printed the constraint *name*. Every
   assertion now names the constraint it expects.

---

## 8-c — the two open findings closed, and a stale check corrected

### 🔴 The one-line fix for issue #2 does not work

Migration `0034` was planned as a single
`revoke execute on function public.rls_auto_enable() from anon`. **Rehearsed on
TEST inside an aborting transaction, that statement changed nothing** —
afterwards `has_function_privilege('anon', …)` was still `true` and `anon` could
still invoke the function.

The ACL carried **two** grants:

```
=X/postgres              <- PUBLIC
postgres=X/postgres
anon=X/postgres          <- and an explicit one
authenticated=X/postgres
service_role=X/postgres
```

Revoking the explicit `anon` row leaves the PUBLIC grant, which `anon`
inherits. For contrast, a correctly-locked RPC — `get_platform_topics` — is
exactly `postgres`, `authenticated`, `service_role`: no PUBLIC, no anon.

Had the one-liner shipped, it would have **applied cleanly, reported success,
and closed nothing**, while the advisor kept flagging the same function. The
migration is `from public, anon, authenticated`.

### What the function actually is — and the real risk in touching it

`rls_auto_enable()` returns `event_trigger` and is wired to the **`ensure_rls`**
event trigger on `ddl_command_end`: on every `CREATE TABLE` in `public` it runs
`ALTER TABLE … ENABLE ROW LEVEL SECURITY`. It is the safety net behind
CLAUDE.md's *"RLS default-deny on every user-reachable table from day one."*

So the risk in `0034` was never the grant — it was **breaking the net**. A
migration that closes a cosmetic advisor finding and silently stops future
tables getting RLS would be far worse than the finding.

Exploitability of the finding itself is low: the function takes no arguments,
returns a pseudo-type with no output function, reads no application table, and
its only action is driven by `pg_event_trigger_ddl_commands()` — which raises
**`39P03`** outside an event-trigger context (verified). An anon caller names no
tables and alters nothing. It is privilege hygiene, not a data path.

### `0034` applied to TEST — six checks

| check | result |
|---|---|
| `anon` cannot execute | **true** |
| `authenticated` cannot execute | **true** |
| no PUBLIC grant remains | **true** — ACL now `postgres=X \| service_role=X` |
| no anon-executable `SECURITY DEFINER` left in `public` | **true — 0 remaining** |
| **`ensure_rls` still armed** | **true** (`ddl_command_end`, enabled) |
| every public table has RLS enabled | **true** |

And the regression test that mattered, run live after the revoke:
**`CREATE TABLE public.pp8_postrevoke_probe` came out with
`relrowsecurity = true`** — the net still catches. Table dropped; the probe ran
inside an aborting block.

**The down-migration was executed too** (also aborted, so TEST stays revoked):
it restores all three entries — PUBLIC, `anon`, `authenticated`. Granting only
to PUBLIC would make `has_function_privilege` read `true` while the explicit
rows stayed missing — a state that *looks* restored and is not.

`service_role` is kept deliberately: it is Supabase's own privileged role, it
bypasses RLS regardless, and moving it is not this migration's business.

**⛔ PRODUCTION IS NOT TOUCHED.** `0034` is applied to TEST only. The owner's
paste and verification file are named in the sprint report.

### Issue #3 — `/admin/content`

`ContentAdminPage` was a *synchronous* component over a hardcoded array, so it
awaited nothing and Next streamed its flight data in parallel with the layout's
`redirect()`. It is now `async` and calls `isAdmin()` itself, which both adds
the second gate CLAUDE.md requires of every route and makes the render depend
on a server round-trip — the part that actually stops the segment racing the
gate. `isAdmin()` is request-cached, so there is no extra query.

**Verified against a locally-served production build, anonymous:**

| route | before | after |
|---|---|---|
| `/admin/content` HTML | 4 labels + 4 paths | **clean** |
| `/admin/content` RSC payload | 4 labels + 4 paths | **clean** |

Every other admin and gated route was swept in the same pass — `/admin`,
`/admin/approvals`, `/admin/content/{focus-areas,files,pages,admins}`,
`/dashboard`, `/setup`, `/operate`, `/program`, `/support`, `/account`, in HTML
**and** RSC — all clean.

A source sweep for the same *shape* (a gated segment that awaits nothing) found
exactly one other: `src/app/admin/page.tsx`. Its entire body is
`redirect("/admin/approvals")`, so it emits no content and has nothing to leak.

### The stale `0031` check, corrected

`0031_verify_PROD_safe_readonly.sql` check 1 required `count(*) > 0` — policies
must exist and all be gated. `0033` dropped all four `programming_sessions`
policies, so the table is RLS-enabled with **zero** policies: default-deny, and
strictly stronger. The file reported `ok = false` for the safest state the table
has ever been in. It now accepts either end state — all-gated, or none-at-all —
while still failing on *some ungated* policy, which is the case it exists for.

Left alone, the harm is not the red line: it is that the next operator learns a
red line in this file is normal.

### ⚠️ Probe defect #3 and #4 (mine, again)

3. **`@` in a leak pattern matches `@media` in inline CSS.** The first sweep
   reported `leaked=2` on five clean admin routes. Pure false positive.
4. **The leak sweep was case-sensitive and mis-cased.** It searched
   `Get legally ready`; the site renders **`Get Legally Ready`**. Every route
   came back "clean" — including the public page that *does* list all 22 by
   name, which is what exposed it. Without that positive control the whole
   sweep would have been meaningless and would have read as a pass. The final
   sweep is case-insensitive **and** asserts the pattern matches on
   `/focus-areas` first.

---

## 8-d / 8-f — the browser pass (public shell done; gated walkthrough BLOCKED)

### ⛔ `.env.local` does not exist — the signed-in walkthrough cannot run

This is a fresh clone. `scripts/verify-partner-path.ts` failed immediately with
`ENOENT … .env.local`, and both `.env.local` and `.env.example` are fenced off
by the harness permission settings. That fence is deliberate and was **not**
routed around.

Consequences, stated plainly:

- **8-d (approved partner) and 8-e (pending · admin) cannot run.** They need a
  session against TEST, which needs those two `NEXT_PUBLIC_*` values.
- The delivered source documents (`docs/source-assets/Resource/…`) are also
  absent — gitignored, OneDrive is canon — so template downloads cannot be
  byte-compared against the originals. **`docs/content-v2-spec.json` carries a
  per-file `md5` for all 88 templates** (added by PP7 round 5, H3), so the
  byte-check is still possible against those digests when the walkthrough runs.

**⚠️ This also qualifies an 8-c result.** The `/admin/content` fix was verified
against a local build running *without* Supabase env vars. The strings it used
to leak are hardcoded in the component, so their disappearance is real and
meaningful. But the other half — *an actual admin still sees the hub* — is
**not** proven. `isAdmin()` is the same function the layout already calls to let
admins through, so the risk is low; it is unproven, not verified, and it is
re-tested in 8-e once credentials exist.

So 8-f was brought forward and completed instead of leaving the step idle.

### The public pass ran against LIVE PRODUCTION, deliberately

The first local run produced a console error — `500` on `/api/auth/session` —
which looked like a defect and is not: production returns `200 {"authed":false}`
for the same request, and the local 500 is purely the missing env. **Every
console-error observation from a local run is therefore polluted**, so the
public pass was re-run against `https://palestine-house-website.vercel.app`,
which is also the surface the owner has to sign off.

**Console across the entire production session: 0 errors, 0 warnings.**

### Pages walked, 320px and 1440px

| page | 320px overflow | broken images | legacy vocabulary |
|---|---|---|---|
| `/` | none (305/320) | 0 of 24 | none |
| `/focus-areas` | none | 0 of 10 | none |
| `/our-support` | none | 0 of 18 | none |
| `/bring-ph` | none | 0 of 32 | none |
| `/model` | none | 0 of 26 | none |
| `/experience` | none | 0 of 19 | none |
| `/apply` | none | 0 | — |
| `/contact` | none | 0 | — |
| `/login` | none | 0 of 10 | — |
| `/about` · `/privacy` · `/terms` | 200, `h1` present | — | none |

"Legacy vocabulary" = `200+ checklist items`, `11 focus areas`, `33 topics`,
`297 templates`, `Academy`, `Live Programming`. **Zero occurrences anywhere.**

Overflow was measured per element (`getBoundingClientRect().right > viewport`),
not just by `scrollWidth`: **0 offending elements on every page**.

### The public copy is correct, and cannot drift from the private side

All **22** focus-area titles appear on `/focus-areas`, and they were checked
against the titles read live from `platform_topics` — **22/22 present, 0
missing**, in the exact 5 / 6 / 6 / 5 grouping. Proof band reads
**4 sections · 22 focus areas · 88 real templates · 120 day launch**. Forms:
`/apply` carries all six fields (incl. the D5 password) and `/contact` four —
**every one labelled**, zero visible unlabelled fields. The single CTA renders
as *Apply to bring a House* with *Every application is reviewed by HQ.*

### ⚠️ Probe defect #5 — and it nearly became a false alarm

The first full-page screenshot of `/focus-areas` showed **a large empty dark
band** where the four sections and 22 focus areas should be. That reads as a
severe production defect on the exact page PP7 built.

It is a **screenshot artefact**. The reveals are `Reveal`/`FadeIn`
(`src/components/motion/reveal.tsx`) — `initial={{opacity: 0, y: 20}}` with
`whileInView`. `fullPage: true` renders the whole document while the viewport is
still at scroll-top, so anything below the fold never intersects and never
reveals.

The follow-up test was **also** wrong: jumping `scrollTo(0, height/2)` then
`scrollTo(0, height)` left the wrapper at `opacity: 0` and looked like
confirmation that the reveal never fires. Scrolling the element into view
properly (`scrollIntoView` + settle) made it visible immediately. Scrolling the
page in **0.6-viewport steps** then re-checking gives
**`stillHidden = 0`** — every reveal fires. The corrected screenshot renders the
complete map.

Two real things did come out of chasing it:

1. **Reduced motion is handled correctly.** `Reveal`/`FadeIn` call
   `useReducedMotion()` and return a plain `<div>` when set — no opacity trap,
   so a reduced-motion user gets the content immediately rather than a blank
   band. Verified in source and in the shipped CSS
   (`prefers-reduced-motion` present in the 170 KB bundle).
2. **Without JavaScript, 8 blocks stay invisible.** The server HTML carries 8
   inline `opacity:0` wrappers, because `useReducedMotion()` is false during
   SSR. The 22 titles *are* in the raw HTML (so a non-executing crawler still
   reads them), but a no-JS visitor sees blank sections. This is a site-wide
   consequence of the DR1 reveal system, **pre-dates PP7/PP8, and is not fixed
   here** — redesigning the motion system is not this sprint's scope. Logged as
   an observation for the owner, severity Low.

### Repo hygiene

The Playwright MCP writes snapshots, console logs and screenshots into the
working directory, **untracked and un-ignored** — one `git add -A` would have
committed them. `.gitignore` now covers `.playwright-mcp/` and the screenshot
names; the captures were moved to the scratchpad.
