# Database Change Record — [CHANGE_NAME]

> **Fill-in template.** Copy this file to `docs/[SPRINT_ID]-[SLUG]-db-change.md` (or paste it into the PR
> description) and replace every `[BRACKETED]` value. One record per database change. Keep it in the same
> branch and PR as the SQL — a schema change and its record ship together or not at all.
>
> This repo runs a **live product with real partner accounts and approval-gated content**. Migrations are
> applied **by hand in the Supabase SQL Editor, non-production project first** — there is no CLI migration
> step ([`WORKFLOW.md`](../WORKFLOW.md) §14). The rules this record enforces are not restated here; they
> live in [`WORKFLOW.md`](../WORKFLOW.md) §14 (the change protocol), [`SUPABASE-MCP-SAFETY.md`](../SUPABASE-MCP-SAFETY.md)
> (who may touch which project), [`SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) §5 + §15 (RLS and the
> blocking invariants) and [`ROLLBACK.md`](../ROLLBACK.md) (what to do when it goes wrong). Read them; this
> record only proves you did.

## 1. The change

| Field | Value |
|---|---|
| Change name | [CHANGE_NAME] |
| Migration number | `[NNNN]` — **must be 0035 or higher** (see §2) |
| Sprint · branch · PR | [SPRINT_ID] · `claude/[BRANCH_NAME]` · #[PR_NUMBER] |
| Change class | **[additive · rewriting · destructive]** — classify in §5 before writing any SQL |
| Tables / functions / policies touched | [LIST] |
| Data impact | [none · rows rewritten · rows deleted — name the affected data, never a partner or applicant identity] |
| **Storage objects touched?** | **[no · yes — [WHICH_BUCKET, HOW_MANY]]**. If yes, §6 is mandatory: a `.down.sql` restores rows and **never** restores Storage objects |
| Recovery source | [not needed · the verified cold backup at [PATH] + its fingerprint · forward-repair only — never a credential] |
| Independent review | **Mandatory.** A schema/RLS change is always a risky sprint (**D-SYS-1**) → record at [`../code-reviews/`](../code-reviews/)`[SPRINT_ID]-[SLUG]-review.md` |
| Owner approval to run on production | [DATE + how it was given] |

## 2. Migration numbering (verify, do not assume)

Production is on **`0034`**, and **migrations `0027`–`0034` are applied to production and IMMUTABLE**
([`AGENTS.md`](../../AGENTS.md)). Never edit an applied migration to fix it — **any fix is a new migration,
`0035` or higher.**

- [ ] Listed `supabase/sql/migrations/` and taken the next free number: `[NNNN]`
- [ ] Confirmed no other open branch has claimed `[NNNN]`
- [ ] No file numbered `0027`–`0034` appears in this diff

## 3. What and why

[One paragraph. What this migration does — tables, columns, functions, policies — and why the sprint needs
it. If it contains a `DROP`, `DELETE`, `TRUNCATE`, `UPDATE` over existing rows, or a type change, say so
here in the first sentence, loudly.]

## 4. Files shipped in this PR (all four rows required)

| What | Path |
|---|---|
| Up-SQL | `supabase/sql/migrations/[NNNN]_[name].up.sql` |
| Down-SQL | `supabase/sql/migrations/[NNNN]_[name].down.sql` — [state exactly what schema it reverses] |
| RLS policies | [in the up-SQL · `[LIST_POLICIES]` · "none changed" — and say why none were needed] |
| Verification SQL | `supabase/sql/verification/[NNNN]_verify_TEST_db_only.sql` **and** `supabase/sql/verification/[NNNN]_verify_PROD_safe_readonly.sql` |

Two naming rules the repo already follows and this record inherits: `.up.sql` / `.down.sql` pairs live in
`supabase/sql/migrations/`, and every verification script says in its own filename whether it is safe to run
against production (`_PROD_safe_readonly`) or test-only (`_TEST_db_only`). A production verifier that writes
is a defect in the filename, not just the file. The folder documents both itself —
[`supabase/sql/README.md`](../../supabase/sql/README.md) §2 (folder map) and §6 (naming); this record does
not restate them.

If several migrations must land in one paste, add the bundle at `supabase/sql/bundles/[SPRINT_ID]_apply_prod.sql`
and name the exact order here: [ORDER].

- [ ] The down-SQL describes only the **schema** it reverses; it does not claim to restore deleted or
      rewritten data
- [ ] The change is **expand → migrate → contract**: the currently deployed code works before *and* after
      the up-SQL ([`WORKFLOW.md`](../WORKFLOW.md) §14). If it cannot be, say why here: [ANSWER]
- [ ] Schema deploys **before** the code that depends on it; on rollback the code retreats first

## 5. Change class — decide this before writing SQL

| Class | What it means | What it requires |
|---|---|---|
| **Additive** | New table/column/function/policy. Nothing existing is rewritten or removed. Old code still works. | §7 and §8. This is the class to aim for. |
| **Rewriting** | Existing rows are updated, a type changes, a policy narrows, a function's contract changes. Reversible in schema, but the prior *values* are gone once it runs. | §6 **Gates 1 and 4** (Gate 2 as well when the down-path has never been run; Gate 3 only if bytes are involved), then §7 and §8, plus a named recovery source in §1. |
| **Destructive** | `DROP`, `DELETE`, `TRUNCATE`, or anything that removes Storage objects. | **§6 in full**, then §7 and §8. No exceptions. |

These are the same three judgements [`ROLLBACK.md`](../ROLLBACK.md) → Step 4 asks for in an incident, under
its own names — *additive/backwards-compatible · reversible schema-only · destructive or data-changing*.
**Additive** is its first; **rewriting** covers its *reversible schema-only* case and the value-changing half
of *destructive or data-changing*; **destructive** is the rest. Fill this record in these names and read
Step 4 in its own — do not invent a fourth vocabulary.

Chosen class: **[additive · rewriting · destructive]** — because [ONE_SENTENCE_JUSTIFICATION].

## 6. Destructive-change block (delete this section only if the class is additive)

A rollback nobody has executed is a hypothesis, not a rollback. Every gate §5 assigns to this change must be
green **before** the production run — for a destructive change that is all four — and the shape to copy is
[`PRODUCTION-CUTOVER-RUNBOOK.md`](../PRODUCTION-CUTOVER-RUNBOOK.md): an ordered run sheet where every step
names its expected output and the point at which stopping is still free.

**Gate 1 — the cold backup exists and was verified from disk with a read-only tool.**

- [ ] Backup taken: [WHAT · WHERE · HOW MANY OBJECTS · TOTAL BYTES · FINGERPRINT]
- [ ] Verified with a tool that **only reads**. A verifier that downloads into the archive can destroy the
      thing it verifies — that was a blocking review finding here ([`ROLLBACK.md`](../ROLLBACK.md) →
      *Lessons this project already paid for*). Tool used: [WHICH]
- [ ] Required copies are in place per [`ROLLBACK-RUNBOOK.md`](../ROLLBACK-RUNBOOK.md) §1, including the
      off-machine copy
- [ ] "Verified" means a fingerprint someone checked, not a folder someone remembers copying

**Gate 2 — the rollback was rehearsed on the non-production project, by running it.**

- [ ] The full down-path was **executed** on TEST — not reviewed, run: [WHAT WAS RUN, IN ORDER]
- [ ] TEST was then brought forward again through the same up-path
- [ ] End state on TEST is identical to the start state: [THE MEASUREMENT THAT PROVES IT]
- [ ] Rehearsal date + who ran it: [DATE] · [WHO]

Precedent: PP7 rolled TEST all the way back to the legacy platform, restored every Storage object at its
exact key, ran forward again, and finished byte-identical — *then* production was touched
([`ROLLBACK.md`](../ROLLBACK.md), [`ROLLBACK-RUNBOOK.md`](../ROLLBACK-RUNBOOK.md) §4).

**Gate 3 — ordering, if bytes are involved.**

- [ ] **Rows first, bytes second.** Orphaned bytes are inert and retryable; live rows pointing at deleted
      files are not
- [ ] **Storage objects are never deleted with SQL.** Deleting `storage.objects` rows in a migration orphans
      the bytes — deletion goes through the Storage API, in a separate step, after the migration has
      committed ([`ROLLBACK.md`](../ROLLBACK.md) → Step 4)
- [ ] The deletion step re-verifies the archive from disk and refuses if the migration has not committed

**Gate 4 — the owner said go.**

- [ ] The owner has read this record, including §8, and approved the production run in writing: [DATE]
- [ ] The engine has not written to production through any channel, and will not
      ([`SUPABASE-MCP-SAFETY.md`](../SUPABASE-MCP-SAFETY.md) §1)

**Run sheet** — number every step, name its expected output, and mark the last step at which stopping is
still free and the first step that is irreversible:

```
 1  [STEP]                        [EXPECTED OUTPUT]
 2  [STEP]                        [EXPECTED OUTPUT]
 …
```

- Last free stop: step [N]
- First irreversible step: step [N] — because [WHY]

## 7. Access check (blocking — none of these may be skipped)

Verified against [`SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) §5 and §15:

- [ ] 🔴 **RLS enabled, default-deny**, on every user-reachable table this change creates or touches; no
      default-allow table ships
- [ ] 🔴 **Every platform RPC — read *and* write — checks `is_approved` server-side.** This is a blanket
      rule, never a list of function names: an enumeration silently becomes an allowlist (§15). The one
      exception is an owner-scoped account/profile RPC restricted to `auth.uid()`, which can touch nothing
      but the caller's own row
- [ ] 🔴 Each `SECURITY DEFINER` function is **hardened**: pinned `search_path`, fully-qualified objects,
      `auth.uid()` authorization (never trusting an argument), narrow returns, and
      `revoke execute from public` **then** grant to the intended role only
- [ ] 🔴 No anonymous read/write path added unintentionally. Any intentional anon path, and why: [ANSWER]
- [ ] 🔴 If this touches templates or `storage.objects`: files stay in the private bucket, reachable only
      through server-issued signed URLs to approved users, and no storage path or bucket name reaches the
      client. **The Storage API honours `storage.objects` policies directly** — filtering the read RPCs is
      not sufficient on its own (§15)
- [ ] 🔴 `programming_sessions` stays default-deny — RLS on, no policies, no rows, no callers. A diff that
      gives it a policy, a caller or a row needs a very good reason ([`AGENTS.md`](../../AGENTS.md))
- [ ] 🔴 No secret, key, connection string or Supabase project ref in the SQL, the PR, or this record.
      Env vars by **name** only
- [ ] Controlled or cross-user operations go through a granted RPC, not a broad table policy
- [ ] Public projections expose titles/overviews only — never gated bodies, guide text or template rows

## 8. Applied and verified

| Environment | Date | Applied by | Verified how |
|---|---|---|---|
| **TEST** (non-production) | [DATE] | [WHO] | [Ran `supabase/sql/verification/[NNNN]_verify_TEST_db_only.sql` — result: [RESULT]. Plus: gated function refuses an anonymous caller; policy list matches] |
| **PRODUCTION** | [DATE] | **the owner, by hand in the SQL Editor** | [Ran `supabase/sql/verification/[NNNN]_verify_PROD_safe_readonly.sql` read-only *after* the manual run — result: [RESULT]] |

- [ ] TEST was applied **and verified** before production was touched
- [ ] The production run was done by the owner in the Supabase SQL Editor. **No agent writes to production
      through any channel** — the engine's production MCP connection is read-only, and that is the point,
      not a formality ([`SUPABASE-MCP-SAFETY.md`](../SUPABASE-MCP-SAFETY.md) §1 + §4)
- [ ] Production verification was **read-only** and ran after the manual apply
- [ ] Production does not report its migration list (`list_migrations` returns `[]` there, because
      migrations are applied by hand) — so "which migration is production on" is answered by the shape the
      migration leaves, or by [`PROJECT-STATUS.md`](../PROJECT-STATUS.md) §1

**Code checks for the PR that ships the SQL:** `pnpm run typecheck` · `pnpm run lint` · `pnpm run build`,
plus `pnpm run start` for a local production smoke. CI is the **`verify`** job in `.github/workflows/ci.yml`
(typecheck, lint, build, gitleaks secret scan). *Tests: none yet — the Playwright suite arrives in **SYS2**,
so "tests pass" is not a box you can tick today. Prettier / `format:check` is deliberately waived
(**D-SYS-3**).*

**Post-apply smoke** ([`ROLLBACK.md`](../ROLLBACK.md) → Step 5), on **desktop and 320px**:

- [ ] The public conversion path still works: **Apply** CTA → `/apply` → the form submits
- [ ] Signed in as an approved partner: a focus area opens, a Simple guide reads, one template downloads
      through its signed URL
- [ ] A **pending** account still sees only the pending state
- [ ] Proof numbers unchanged unless this change moved them: **4 sections · 22 focus areas · 88 templates**

## 9. Rollback plan

Do not restate the rules — [`ROLLBACK.md`](../ROLLBACK.md) owns them, Step 4 is the data lever, and
[`WORKFLOW.md`](../WORKFLOW.md) §13 is the compressed version inside the delivery loop. Fill in what is
specific to **this** migration:

| Question | Answer |
|---|---|
| If this breaks production, what is the first move? | [Vercel promote (code only) · revert the PR · both] |
| Does the previously deployed code work against the new schema? | [yes → keep the schema and forward-fix, which is the preferred outcome · no → why] |
| What exactly does `[NNNN]_[name].down.sql` reverse? | [ANSWER] |
| What does it **not** restore? | [rows deleted · values overwritten · **Storage objects — always**] |
| Has the down-SQL been run end to end on TEST? | [DATE + result · **no** — then this is a hypothesis, not a rollback] |
| Who runs it, and where? | The owner, by hand in the Supabase SQL Editor |
| Is there a point of no return? | [no · step [N] of §6, because [WHY]] |

- [ ] Writes are stopped or limited first if continued traffic would compound the damage; who authorized
      that: [WHO]
- [ ] The dependent code retreats before the schema does
- [ ] Never run a `.down.sql` as a reflex merely because the file exists
- [ ] The rollback is not "complete" until schema, data and the affected user flow have each been verified,
      and the record says what was **not** restored

> PP7 built `scripts/verify-down-migration.ts` to validate a down file offline — transaction wrapper
> balanced, statements recognised, dollar-quotes terminated, foreign-key insert order correct — because a
> rollback that fails at insert 200 of 373 during an incident is worse than one that fails at insert 1. It
> takes `--file`, so it can be pointed at a new down file. Use it when the down file is large or generated.

## 10. Record it

- [ ] [`PROJECT-STATUS.md`](../PROJECT-STATUS.md) §1 updated with the migration number production now runs
- [ ] [`PROJECT-STATUS.md`](../PROJECT-STATUS.md) §8 change log entry: date, what changed, verified result
- [ ] Any new rule this change taught goes where it will be read — [`../../CLAUDE.md`](../../CLAUDE.md),
      [`AGENTS.md`](../../AGENTS.md), or the relevant checklist — not only in the log
- [ ] Sprint record saved in [`../sprint-prompts/`](../sprint-prompts/) via the `/sprint-prompt` skill
- [ ] This record is committed in the same PR as the SQL

> **On committing:** this project does **not** use the SOP's "Commit: YES / Push: YES" tokens. A standing
> authorization (2026-06-12) means the engine commits **and** pushes after every gated sub-step, so the
> owner reviews live in the open PR (**D-SYS-2**). Merging is still the owner's, and only after CI is green,
> the Preview is tested, and no Blocking review finding stands ([`WORKFLOW.md`](../WORKFLOW.md) §10–§12).

---

Next step → the independent review ([`CODEX-REVIEW-PROMPT.md`](../CODEX-REVIEW-PROMPT.md), record in
[`../code-reviews/`](../code-reviews/)), then the owner merges and runs the production apply.
