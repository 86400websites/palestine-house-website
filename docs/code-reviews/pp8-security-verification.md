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
