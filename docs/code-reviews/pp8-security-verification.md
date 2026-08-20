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
