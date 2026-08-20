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

`ContentAdminPage` was a *synchronous* component over a hardcoded array, so
Next streamed its flight data in parallel with the layout's `redirect()`. It is
now `async` and calls `isAdmin()` itself, adding the second gate CLAUDE.md
requires of every route. `isAdmin()` is request-cached, so there is no extra
query.

**Verified against a locally-served production build, anonymous:**

| route | before | after |
|---|---|---|
| `/admin/content` HTML | 4 labels + 4 paths | **clean** |
| `/admin/content` RSC payload | 4 labels + 4 paths | **clean** |

> ### 🔴 THIS SECTION WAS WRONG, AND 8-k PROVED IT
>
> Two claims made here originally were **false**, and they are corrected in
> place rather than quietly edited away — see **8-k** for the full account.
>
> **① The stated mechanism was wrong.** This section claimed the fix worked
> because awaiting `isAdmin()` *"makes the render depend on a server round-trip
> — the part that actually stops the segment racing the gate."* It does not.
> `/admin/content/files` awaits `searchParams` **and two gated Supabase RPCs** —
> real network round trips — and still flushed its own heading and intro to an
> anonymous caller. What closes the leak is that `notFound()` **throws before
> the JSX is constructed**.
>
> **② The "all clean" sweep was false.** This section claimed every other admin
> and gated route was swept clean in HTML and RSC. The sweep searched for the
> **four `/admin/content` card labels** — so it could not, by construction,
> detect a *different* route leaking its *own* heading. Re-probed per-route at
> 8-k: **`/admin/approvals`, `/admin/content/files`, `/pages`, `/admins` and
> `/focus-areas` all leaked their own heading and intro.** All five are now
> gated and re-verified clean.
>
> **What was true and stayed true:** *structure, never data.* Those payloads
> carried headings and intros but **no topic title, no storage path, no
> applicant email** — the gated RPCs fail closed, re-confirmed at 8-k.
>
> A source sweep for the same *shape* originally reported "exactly one other"
> page. That sweep was scoped by the false mechanism above ("a gated segment
> that awaits nothing"), so it under-counted. Under the correct rule — *does
> the page gate itself before constructing JSX* — **five more shared it.**

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

---

## 8-h — performance: the premise was wrong, measured not assumed

`ROADMAP.md`'s PP8 row lists the images as a performance concern: *"the 22 topic
photographs are 200–290 KB each, unoptimised, and there are now 22 of them above
the fold across four pages."*

**The disk figure is right and the conclusion does not follow.** Those files are
never served. `pw-topic-card.tsx` renders them through `next/image` with
`sizes="(max-width: 760px) 100vw, 320px"`, so the browser requests the optimizer
at the card's real width and gets **AVIF**:

| photograph | on disk | actually served (`w=384`) | saving | format |
|---|---|---|---|---|
| `get-legally-ready` | 232 KB | **31 KB** | 87% | `image/avif` |
| `plan-the-money` | 226 KB | **27 KB** | 88% | `image/avif` |
| `promote-the-event` | 265 KB | **36 KB** | 87% | `image/avif` |
| `sponsorship-fundraising` | 280 KB | **38 KB** | 87% | `image/avif` |
| `money` | 212 KB | **26 KB** | 88% | `image/avif` |

Worst-case real page — **Operate**, the section with 6 focus areas:

```
money 26 · daily-house-operations 24 · food-beverages 23
members-and-visitors 29 · team 28 · monthly-check-up 24
------------------------------------------------------
TOTAL 158 KB   (the raw files would have been ~1.3 MB)
```

They are also **lazy** — `pw-topic-card.tsx` passes no `priority`, and
`next/image` defaults to `loading="lazy"`, so a card below the fold costs
nothing until it is scrolled to. The phrase "22 of them above the fold" does not
describe what happens: at most a handful are above the fold on any one page, and
the rest are deferred.

**Conclusion: no re-encoding, no action.** `scripts/optimize-photos.ts` is not
run and the masters are untouched. The 4.14 MB on disk is repo weight, not user
weight, and re-encoding would trade image quality for bytes nobody downloads.

⚠️ One caveat kept from 8-a: `sharp`'s build script is ignored by pnpm locally,
so these numbers come from the local optimizer. Vercel runs the same pipeline
with `sharp` available and generally does **better**, not worse — so this is a
conservative measurement, but it is a local one.

*(Minor a11y note for 8-g: the topic image carries `alt=""`. That is correct —
it is decorative, and the focus-area title sits beside it as real text.)*

---

## ⛔ 8-d / 8-e — BLOCKED on three permission guards

`.env.local` now exists and **targets TEST** (`verify-partner-path.ts` printed
`target: sdszcralogcrujtyghig.supabase.co (TEST)`), which closes the item 8-a
could only flag. The build was redone with the env present — `/api/auth/session`
now returns `200 {"authed":false}` locally, matching production and confirming
8-f's diagnosis of the earlier 500.

The signed-in walkthrough still cannot run. Three separate guards refused, and
**none was worked around**:

| # | attempt | why it was refused | verdict |
|---|---|---|---|
| 1 | read `.env.local` / `.env.example` | secrets file | correct |
| 2 | `delete from public.admins where user_id = …` | `verify-partner-path.ts` **requires** the account not be an admin, or every read goes through the admin Storage policy and proves nothing about the partner path | correct — this is an admin table |
| 3 | `browser_run_code_unsafe` reading `.env.local` inside the Playwright process to type the credentials | RCE-equivalent tool touching a secrets file | correct |

Guard 3 was the attempt designed to keep the credentials **out of this
transcript entirely** — the browser process would have read the file and typed
into the form without the values ever reaching the model. That is still the best
option if the owner wants to grant it.

**Not yet verified, and not to be claimed:** the four toolkit pages, the reader
on the 22, guide/template downloads and their byte-check against the 88 spec
md5s, Ctrl/⌘+K search, `#topic-slug` deep links, Ask HQ, the pending-partner
state, the admin CMS write path — and the re-test of 8-c's `/admin/content` fix
from an **admin's** session.

---

## 8-d — the approved-partner walkthrough (UNBLOCKED and run)

The owner authorised the browser to read `.env.local` so the credentials stay
out of this transcript. The Playwright snippet VM turned out to have **no
`require` and no dynamic `import`**, so it cannot read a file at all. A
**login bridge** was used instead — a scratchpad-only Node server that reads the
credentials, signs in, and emits **nothing but `Set-Cookie`**. Cookies are not
port-scoped, so a cookie set for `localhost` by the bridge on `:3101` reaches
the app on `:3000`. The cookie encoding comes from **`@supabase/ssr` itself**
via a capturing cookie adapter, so it cannot drift from what the app reads, and
the bridge refuses to start unless the URL is the TEST project.

⚠️ **The rebuild mattered.** The earlier build was compiled with no
`NEXT_PUBLIC_*` values, so they were baked in as undefined. After rebuilding
with the env present, `/api/auth/session` returns `200 {"authed":false}`
locally — matching production and confirming 8-f's diagnosis of the 500.

### The four toolkit pages

`/setup` renders **5 cards** with exactly the 5 expected titles, 5 guide links,
5 Watch Video controls, 0 broken images, no overflow. Expanding *Get Legally
Ready* produces the **D-PP-f model exactly**:

> summary → *See more* → *Back to Main Menu* → *Watch Video* → **START HERE** →
> Simple guide card (**Read Now** · **Download Now**) → **TEMPLATES** → "2 files"
> → T01 *Palestine House Brand Guide*, T02 *Palestine House Setup Checklist*

Two templates + one guide = the 3 files the database holds for that focus area.
No Overview card, no checklist card, no watch-out card. **This is the "signed-in
visual" PP7 recorded as owed** — screenshot in the sprint record.

### The reader, on all 22

All 22 routes driven in one pass. **22/22 pass**, with structural assertions
only (the first attempt's heuristics were wrong — see probe defects below):

- exactly **one `<h1>`** per guide, and **no duplicate title heading** — PP6b's
  cover-strip rule holds across the whole real corpus
- **5–10 `<h2>` Step headings** each, per **D-PP-q**
- 2,553–4,737 characters each, **70,659 total** rendered

### Downloads — byte-exact, through real signed URLs

Seven templates downloaded by clicking the actual UI, each served from
`…/storage/v1/object/sign/resources/…` with a short-lived token, then hashed and
compared against `docs/content-v2-spec.json`'s per-file md5s (computed from the
owner's delivered documents at extraction):

| focus area | template | bytes | md5 |
|---|---|---|---|
| get-legally-ready | T02 Palestine House Setup Checklist | 186,401 | ✅ |
| money | T04 Simple Financial Policy | 184,276 | ✅ |
| money | T05 Supplier Payment Tracker | 184,143 | ✅ |
| plan-an-event | T04 Guest List | 187,231 | ✅ |
| plan-an-event | T05 Simple Event Budget | 186,983 | ✅ |
| marketing | T04 Press Release Template | 186,204 | ✅ |
| marketing | T05 Simple Marketing Plan | 186,723 | ✅ |

**byte-exact: 7 · mismatched: 0 · unmatched: 0**, spanning all four sections.

### Search, deep links, Ask HQ, `/account`

- **Ctrl/⌘+K** opens the palette; **Escape** closes it. Typing `brand` returns 3
  results across **both** kinds — `FOCUS AREA Get Legally Ready`,
  `TEMPLATE Palestine House Brand Guide`, `FOCUS AREA Ask Community Support for
  Help` — each with a breadcrumb path and an anchor link.
- **D-PP-j holds in the UI**: the rendered result markup carries **no storage
  path, no `.docx`, no resource UUID** — only `/setup#topic-get-legally-ready`.
- **Deep links** work: `/program#topic-promote-the-event` preserves the hash and
  opens that focus area with its guide card.
- **Ask HQ** renders a form with name, email, subject and message — all
  labelled.
- **`/account`** renders *"Your account."* with `displayName` and `optIn` — the
  one deliberately approval-free gated page (§15).

### 320px

All four toolkit pages at 320px: **no horizontal overflow, 0 offending elements
measured per-element, 0 broken images** (`scrollWidth` 305 against a 320
viewport on every one).

### ⚠️ Probe defects #6–#9 — four more, all mine

1. **`waitUntil: 'domcontentloaded'` fires before RSC content renders.** Two
   guide routes reported `chars: 0`, which reads as a blank page — one of them
   had rendered 3,996 characters moments earlier when visited alone.
2. **`/pending|approval/i` matched legitimate guide prose.** Guides about
   permits and licensing legitimately contain the word "approval", so 11 of 22
   readers were flagged as showing a pending state. None was.
3. **Counting title occurrences in body text.** `Money` appeared 3 times and
   `Marketing` twice — because those are ordinary words in their own prose. The
   real assertion is structural: is the title an `<h1>`, and is it repeated as a
   lower heading?
4. **`[class*="pw-search"]` matched `.pw-search-tools` first.** The search
   palette appeared to return **zero results for every query**, which reads as a
   broken headline feature. The results were rendering the whole time in
   `.pw-search-results`, one sibling away. This one was two `document.querySelector`
   calls away from being written up as a defect on a shipped feature.

That is **nine probe defects and zero product defects** found by my own checks
across this sprint — the same ratio PP6c recorded (five of five). The lesson is
not that the checks are useless; it is that a check that reports a failure has
to be debugged before it is believed, exactly as hard as the product would be.

---

## 8-e — pending · anonymous · admin

### 8-c's caveat is now closed

The `/admin/content` fix was previously verified only against a build with no
Supabase env, so "an admin still sees the hub" was recorded as **unproven**.
Re-tested from a real admin session: `/admin/content` renders *"Content admin."*
with all four hub cards (Pages · Focus areas · Files · Admins), and all six
admin screens load — `/admin/approvals`, `/admin/content`, and
`/admin/content/{focus-areas,files,pages,admins}`. **The fix closes the
anonymous leak without locking admins out.**

### Anonymous, cookies cleared

All 13 gated and admin routes redirect to `/login` with the correct `next=`
target, and **not one leaks a focus-area title, a `.docx`, a storage path or an
email address**. `/api/auth/session` reports `{"authed":false}`. This repeats
8-c's sweep **with the env present**, so the earlier qualified result now
stands unqualified.

### Pending partner — flipped on TEST, then restored

`is_approved` was set false for the signed-in account, the whole gated surface
re-walked, and approval restored immediately after.

| route | what a pending partner sees |
|---|---|
| `/dashboard` | *"Welcome."* → **"Your application is under review."** · "HQ reads every one by hand. The moment yours is approved, everything here opens up" |
| `/setup` `/operate` `/program` `/support` | **"Request received — under review."** |
| `/setup/get-legally-ready/guide` | the same pending state — the reader does not leak |
| `/account` | **"Your account."**, `displayName` + `optIn` still editable |

**Content leaked: none.** No *Read Now*, no *Download Now*, no *TEMPLATES*, no
*Simple guide*, and none of the focus-area titles, on any of them. `/account`
staying editable while pending is the deliberate §15 exception, working.

**TEST was restored and the restoration verified**: 5 approved of 6 profiles ·
2 admins · 22 topics live · 112 resources · 110 objects — identical to the 8-a
baseline.

### 🐞 Defect found and fixed — `/academy/[slug]` answered 404

`next.config.ts`'s redirect block states its own intent plainly: *"Rather than
404 someone who saved `/elements/c2`, send them to the About landing."* But
`withChildren` listed only `/live`, `/elements` and `/resources`. `/academy` was
in `gone` (so `/academy` itself redirected) and **absent from `withChildren`**,
so `/academy/some-module` — a real route until PP5, and as bookmarkable as
`/elements/c2` — returned **404** while `/live/123` redirected.

Found by requesting the **children** rather than the parents. Fixed by adding
`/academy` to `withChildren`; verified after rebuild:

```
/academy/foo          307 → /dashboard
/academy/some-module  307 → /dashboard
/live/123             307 → /dashboard
/elements/c2          307 → /dashboard
/resources/forms      307 → /dashboard
```

This is the sprint's **first product defect**, and it is a small one.

### 🔴 Finding NOT fixed — every `/admin/*` screen overflows at 320px

| screen | `scrollWidth` at 320px | offending elements |
|---|---|---|
| `/admin/approvals` | **480** | 65 |
| `/admin/content` | **480** | 6 |
| `/admin/content/focus-areas` | **736** | 217 |
| `/admin/content/files` | **480** | 6 |
| `/admin/content/pages` | **736** | 33 |
| `/admin/content/admins` | **480** | 23 |
| `/dashboard` (partner) | 305 | **0** |
| `/account` (partner) | 305 | **0** |

The partner-facing platform is clean; the **HQ admin UI is not responsive**. The
first offenders are the admin nav links at 349/431px, and the two worst screens
are wide data tables.

**Pre-existing, not introduced here** — it affects `/admin/approvals`, which
this sprint never touched, and the admin UI has been desktop-first since S11.

**Deliberately not fixed.** Making six admin screens responsive is a design
change against `docs/page-designs/admin/`, not a verification fix, and it is far
outside "the smallest safe change". It is HQ-only, desktop-used, and carries no
security or partner-facing consequence. **Logged for the owner to schedule**;
severity Low, raised only because PP8's scope asked for 320px on the admin
flows and silently omitting the answer would misrepresent the pass.

---

## 8-g — accessibility

### Keyboard-only traversal

- **The skip link is the first tab stop**, and `#pw-main` exists as its target.
- **Focus is visibly indicated on every stop** — a solid 2.4px outline on all
  ten sampled stops, with no `outline: none` anywhere in the path.
- Tab order follows the visual order: skip → brand → About · Setup · Operate ·
  Program · Support → Partner Platform → *See more* → *Explore …*.
- **The accordion opens from the keyboard** (`Enter` on *Explore Get Legally
  Ready*) and **focus is deliberately moved to "Back to Main Menu"** inside the
  newly-revealed panel, rather than left stranded on a button whose label has
  changed meaning.

### The search palette

It is a **native `<dialog>` driven by `showModal()`**, which is why it behaves
correctly: measured live, `dialog.open === true` and **`dialog.matches(':modal')
=== true`**, so the browser itself owns the focus trap and the inert background.

| | |
|---|---|
| labelled | `aria-labelledby="pw-search-title"` → *"Search all knowledge resources"* (visually hidden) |
| input | labelled *"Search all resources"* |
| results | `aria-busy` toggles with load state — **deliberately not `aria-live`**, per the component's own note, so a live region cannot re-announce on every keystroke |
| empty state | `role="status"` → *"No results found. Try a shorter word or a topic name."* is announced |
| filters | `role="group"` with an accessible label |
| close | `aria-label="Close search"` |
| **Escape** | closes **and returns focus to the trigger** that opened it |

**Focus trap verified by walking it**: Close → All → Focus Areas → Guides →
Templates → input → Close → … The cycle never reaches a background control.

### Structure, contrast, motion

- **Landmarks**: 1 `banner`, 2 `nav` — both labelled (*"Partner platform"*,
  *"Partner platform, mobile"*) — 1 `main`, 1 `contentinfo`. One `<h1>`.
  `lang="en"`. **0 images without `alt`** (the topic photo is `alt=""`, correct:
  it is decorative and the title sits beside it as text).
- **Contrast, computed from the live rendered colours** — every sampled pair
  passes **AA** with room to spare:

  | element | size | ratio | AA threshold |
  |---|---|---|---|
  | `h1` | 55px | **17.21** | 3 |
  | `.pw-topic-title` | 24px | **17.21** | 3 |
  | `p` | 18px | **17.21** | 4.5 |
  | `a` | 15px | **7.71** | 4.5 |
  | `button` | 14px | **15.05** | 4.5 |
  | `.pw-topic-summary` | 14px | **12.21** | 4.5 |

- **Reduced motion**: with `prefers-reduced-motion: reduce` emulated, the media
  query matches and **all five topic titles render visible**. `Reveal`/`FadeIn`
  return a plain `<div>` in that mode, so there is no opacity trap — the failure
  mode where reduced motion disables the animation and leaves the content at
  `opacity: 0` does **not** occur here.

### ⚠️ Advisory finding — heading order skips `h1 → h3` (not fixed, deliberately)

The toolkit pages emit `1, 3, 4, 5, 4, 3, …, 2, 2` — no `<h2>` between the page
title and the focus-area titles.

It is not an oversight. `pw-section-explorer.tsx` renders
`<h2 class="pw-group-heading">` **only when a section has more than one group**;
with a single group it deliberately drops the heading, its chevron and its count
("*with one group the count is simply the list you can see*"). Every section
currently has exactly one group, so every toolkit page skips the level.

**Not fixed, and the reason is the fix is worse.** Promoting the focus-area
title from `h3` to `h2` would close today's gap and then collide with the real
group `h2` the moment any section gains a second group — trading an advisory
issue for a latent structural one. Heading order is best practice under WCAG
1.3.1 rather than a hard AA failure, screen readers navigate this page correctly
by landmark and by heading regardless, and re-architecting the heading hierarchy
is a design decision, not a verification fix. **Logged for the owner**, severity
Low.

### ⚠️ Probe defect #10

`document.querySelector('[role="dialog"]')` matched nothing, so the palette
appeared to have **no dialog role, no aria labelling and no focus trap** — which
would have been a serious a11y finding on the headline feature. It is a *native*
`<dialog>`: the role is implicit and the attribute is correctly absent. Every
subsequent measurement had to be redone against `document.querySelector('dialog')`
and `:modal`.

---

## 8-i — fix-all, and the regression the fix demanded

The fix list is genuinely short: **one product defect** (`/academy/[slug]`),
already fixed and re-verified in 8-e. Three further findings are logged
deliberately unfixed, each with its reason recorded above.

But that fix landed in **`next.config.ts` — the file that ships the security
headers**. A redirect edit and the CSP live eight lines apart, so the rule
applies: a fix touching a security surface re-runs the proof.

### After the config change

| | result |
|---|---|
| all six security headers still present | ✅ |
| **CSP byte-identical to production** | ✅ |
| `/admin/content` anon leak (8-c fix) after rebuild — HTML / RSC | **0 / 0** |
| all 12 legacy paths still `307 → /dashboard` | ✅ |

### After migration `0034` — every §15 invariant re-proven on TEST

The revoke is the only schema change in this sprint, and the risk was never the
grant but the `ensure_rls` safety net behind it. Re-run end to end:

| | |
|---|---|
| approved: topics / `get_element` / download rows / storage objects | **22 / 1 / 1 / 110** |
| pending: topics / storage objects | **0 / 0** — rows *and* bytes |
| anon: `get_platform_topics()` | **DENIED (42501)** |
| anon: `rls_auto_enable()` | **DENIED (42501)** — `0034` doing its job |
| new table created after the revoke | **`relrowsecurity = true`** — net still armed |
| ungated policies | **3**, the documented three |

### Final gate

`pnpm run typecheck` · `pnpm run lint` · `pnpm run build` — **all green**.
`git status` clean; `.env.local` untracked and matched by `.gitignore:22`
(`.env*.local`). The branch diff was scanned for credential patterns: the only
hits are **documentation** — this file listing the variable *names* that were
searched for, and the ACL string `service_role=X/postgres`, which is a privilege
grant, not a credential. **No secret in the diff.**

### The sprint's defect ledger

| | |
|---|---|
| **Product defects found** | **1** — `/academy/[slug]` returned 404 instead of redirecting. **Fixed.** |
| **Findings logged, deliberately unfixed** | **3** — `/admin/*` overflows at 320px (pre-existing since S11, HQ-only, a design change not a verification fix) · heading order skips `h1→h3` (a consequence of the deliberate single-group flattening; the obvious fix creates a latent collision) · 8 blocks invisible without JavaScript (site-wide since DR1) |
| **Defects in my own probes** | **10** |

Ten to one. Every single "failure" this sprint surfaced had to be debugged
before it could be believed, and ten of the eleven turned out to be the
measuring instrument. Two of them — the blank `/focus-areas` band and the
search palette returning nothing — would have been written up as severe defects
on shipped, working features if the first result had been trusted.

*(Superseded at 8-k: the ledger is now **2 product defects**, and the ratio
above is the sprint's own argument turned against it — see below.)*

---

## 8-k — the independent review, and it was right for the sixth time

An adversarial multi-agent review of the branch diff: **15 findings raised, 14
refuted under independent scrutiny, 1 survived.** The survivor was aimed
squarely at this document.

### What it found

**The mechanism recorded for the 8-c fix was false, and the sweep that
mechanism scoped was false with it.**

The reviewer's verifier rebuilt the branch, served it, and requested each admin
route anonymously — searching for **each route's own strings** rather than the
four `/admin/content` labels. **I reproduced this independently before accepting
it:**

| route (anonymous) | own heading + intro — before | after |
|---|---|---|
| `/admin/content` | clean (8-c fix) | clean |
| `/admin/approvals` | **LEAKED** (html + rsc) | **clean** |
| `/admin/content/files` | **LEAKED** | **clean** |
| `/admin/content/pages` | **LEAKED** | **clean** |
| `/admin/content/admins` | **LEAKED** | **clean** |
| `/admin/content/focus-areas` | **LEAKED** | **clean** |

`/admin/content/files` awaits `searchParams` **and two gated Supabase RPCs**.
Real round trips. It flushed anyway. So the claim that "awaiting makes the
render depend on a server round-trip, which is what actually stops the segment
streaming ahead of the gate" is simply not how it works.

**The rule that is actually true, now recorded in the code:**

> Every gated segment must run its own server-side check and short-circuit with
> `notFound()`/`redirect()` **before it constructs any JSX**. Awaiting something
> is not a gate. A parent layout's `redirect()` does not stop the child segment
> rendering into the streamed response.

### Fixed

All five routes now carry `if (!(await isAdmin())) notFound();` as their first
statement. Re-verified anonymous: **0 own-string hits in HTML and RSC on all
six**. Re-verified from a real **admin** session: all six still render with
their correct `h1` — no 404s, no redirects. `typecheck` · `lint` · `build`
green.

### What this costs the sprint's own argument

The 8-i ledger read *"ten probe defects, one product defect"* and drew the
lesson that a failing check must be debugged before it is believed. That lesson
stands. But the inverse was the real risk here, and this document walked into
it: **a check that reports SUCCESS deserves exactly the same scrutiny, and this
one got none.** A sweep searching for the wrong strings returns "all clean" and
feels like evidence. It was published as evidence.

The corrected ledger is **2 product defects** (`/academy/[slug]`, and five admin
routes leaking their structure), **found by a review I did not run myself.**
Six independent rounds across this series; six times the reviewer was right.
