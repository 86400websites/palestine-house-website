# Sprint PP6a — IA unlock + CMS write layer

| | |
|---|---|
| **Date built** | 2026-08-14 (local only; not pushed) |
| **Branch / PR** | `claude/sprint-pp6a-ia-unlock-cms-write` (off `docs/pp6-replan`, itself off `claude/sprint-pp5-teardown-cutover`) / PR pending |
| **Goal** | Make the platform able to hold the owner's real content, and give him a CMS that can manage it — without moving a single row of content. |
| **Shape** | 9 owner-gated steps (6a-a … 6a-i) · **migration 0029** (up + down + 2 verification scripts) |
| **Totals** | 34 files · **+5,382 / −1,055** · CSS 180,391 → 180,530 (**+139**, two deliberate rules) |

## Why this sprint exists

The owner delivered the final content on 2026-08-14: **4 sections → 22 focus areas → 88 templates**, with essentially zero overlap against the 33 focus areas / 297 templates the platform was seeded with (D-PP-k). It is a replacement information architecture, not an upload. PP6 as written — "let the owner edit the existing 33" — no longer matched reality, so it split into **PP6a (machinery) → PP6b (pilot) → PP6c (rollout)**.

PP6a moves **no content**. That is what makes it reviewable.

## What shipped

**6a-a — the plan was verified and failed.** Every load-bearing claim was re-checked against production instead of trusted. Six blocking corrections, one scope addition, one scope drop — all folded into the ROADMAP before any SQL existed. The three that mattered most:

- The 33-slot ceiling had **three** enforcement layers, not one. Relaxing only the table CHECK would have shipped a sprint whose headline deliverable did not work.
- `elements.focus_area_code` / `focus_area_name` are NOT NULL with a `^[A-K]$` CHECK, so a focus area outside A–K could not be inserted at all.
- The Draft/Live filter was scoped to one read. Three others hand out content directly — including the one that hands out **files**.

**6a-b — migration 0029 pass 1.** All three ceiling layers relaxed (table CHECKs, the `admin_upsert_element` body, three zod schemas). `published boolean not null default true` on `platform_topics` + `platform_groups`, filtered into **four** member reads. `get_elements()` dropped — unfiltered, caller-less, and absent from PP7's contraction list.

**6a-c — pass 2, the IA write path.** Eleven new admin RPCs where there were none: the platform tables had been readable since PP1 and completely unwritable. Creating a focus area is a two-table transaction. Four rules enforced in the database, not the UI: delete-only-on-Draft, no deleting a non-empty group, no deleting a focus area that still has files, and a frozen URL slug.

**6a-d — pass 3, files and D-PP-i.** The file lifecycle (register / replace / rename / reorder / delete) plus four `storage.objects` policies for admins. **`SECURITY-CHECKLIST` §15 closed** — and closed harder than it was owed: as four **table CHECK constraints** rather than RPC checks, so they bind every future writer.

**6a-e — CMS shell + Pages screen.** `get_platform_sections()` had **zero call sites**, so a Pages screen would have been a form whose Save changed nothing visible. Shipped `getPlatformPages()` with the generated spec as a per-field fallback, and switched five consumers. Videos screen deleted.

**6a-f — the Focus areas screen.** Eleven fields, Draft/Live, a live card preview, and the eight rules. Replaces the Elements screen, which edited two bodies no partner can reach.

**6a-g — the Files screen.** The upload path the platform never had. One guide slot, a templates list, and the compensation contract in code.

**6a-h — flat-list rendering** for single-group sections (D-PP-n). Setup and Support show it immediately.

**6a-i — the exit gate, which found three more defects and fixed them.**

A four-dimension adversarial review of the whole diff (gate · migration · upload · app), each dimension's findings then independently verified, returned **request changes**. It was right on every count, and all of it was fixed before this record was written — while `0029` had still never touched production, which is the only window in which any of it was cheap.

- 🔴 **Draft was a boundary for rows and an illusion for bytes.** The four RPCs filter `published`; `storage.objects` did not. `0017` granted approved partners SELECT on *every* object in the private bucket, so a partner holding their own access token could have listed it and signed a URL for an unreleased focus area's files with no RPC involved — precisely the failure `0029`'s own header claimed to have closed. Fixed by narrowing that policy. ⚠️ **The first attempt at the fix was itself wrong**: an inline `EXISTS` in a policy is evaluated as the *invoking* role, and `public.resources` is RLS default-deny, so it matched nothing and denied **every** download. TEST caught it on the first run. The shipped fix goes through `is_published_object()`, `SECURITY DEFINER`.
- 🔴 **An ordinary Save destroyed data the screen could not even show.** `admin_update_platform_section` takes 13 parameters; the Pages screen sends 8. The five it does not send — `subtitle` and the four `journey_*`, all populated on all four toolkit sections in production — were written over with NULL. One typo fix would have silently nulled twenty columns. Same class in `admin_upsert_platform_topic`: `icon` defaulted to `'sprig'` on update and the Focus areas screen has no icon field, so editing any title would have flattened one of 32 distinct curated icons. Both now leave-alone.
- 🟠 **An infinite refresh loop** on the Focus areas screen: an inline `onDone={() => router.refresh()}` prop is a new function identity every render, sitting in an effect's dependency list — so once a publish succeeded it refreshed forever.
- 🟠 **The upload size limit promised what the host refuses.** 10 MB enforced against a 12 MB body limit was internally consistent and wrong about the deploy target: Vercel rejects a function body over ~4.5 MB with a 413 before our code runs, and `bodySizeLimit` cannot raise a platform limit. **Three** numbers had to agree, not two — now 4 MB / 4.5 MB / host.
- 🟠 **The upload path did not slugify the template code** while the replace path did, so a code containing `../` could climb out of the focus-area folder and leave undeletable orphaned bytes.

Nine regression tests were added for these across §7b and §7c of the TEST verification script.

**Then an independent review found four more blocking defects, and it was right about all of them.** Fixed in the same sprint, still before `0029` reached production:

- 🔴 **`is_published_object()` was an oracle for pending partners.** It is `SECURITY DEFINER` over RLS-hidden tables and *must* be granted to `authenticated` for the storage policy to call it — which also exposes it at `/rest/v1/rpc/`. Without its own `is_approved()` check, a pending account could ask whether a given key names Live content. Now checks approval itself.
- 🔴 **Two more member reads ignored Draft.** `get_checklist()` and `get_academy_modules()` both return `elements.title` and know nothing about `published` — two further windows onto a drafted focus area's name. Both had zero callers since PP5, so `0029` **drops** them rather than filtering a window nobody looks through. Their tables remain for PP7's `0031`, whose row is updated to say so.
- 🔴 **File replacement did not bind the file to its focus area.** The action sent an `id` and an `elementId` as independent fields and the RPC updated by `id` alone, so one focus area's element id with another's file id would upload bytes under A and repoint B's row at them — B's old object deleted, B's partners served A's file. The RPC now matches on id **and** element **and** private **and** bucket.
- 🔴 **The rollback guard would have published every Draft.** It checked only legacy slugs and focus-area codes. Dropping `published` does not forget the flag — it publishes every row that carried it, and re-widens the storage policy in the same statement. The guard now refuses while anything is Draft. *(I had argued the opposite at the internal gate — that such a guard "refuses exactly when a rollback is most needed". That was wrong: the operator can clear drafts in one statement, and cannot un-publish what a partner has already downloaded.)*
- 🟠 **The Pages screen shipped two controls with no consumer** — eyebrow and section video. Both columns exist and both save, but nothing renders them. Removed, because a control that reports "Saved" and changes nothing visible is the exact failure this screen was built to avoid.
- 🟠 **The delete confirmation trusted two browser values.** A stale tab could confirm a name that had since changed. The typed name now goes to the database and is compared against the row being deleted, in the same statement.

Six more regression tests cover these in §7d.

## Checks & results

typecheck ✅ · lint ✅ · build ✅ (41 routes)

- **PROD untouched and verified read-only at the gate:** 5 sections / 10 groups / 33 topics / 33 elements / 299 resources / 297 in-grid / 0 wrong-bucket / 2 booklets / 0 guide rows · `published` column **absent** · **0** platform admin functions · **1** storage policy (the 0017 partner SELECT). `0029` has correctly **not** been applied — that is the owner's hand-run at the merge gate.
- **0029 proven on TEST**, which started byte-identical to PROD: full **down → up → down → up** cycle clean and idempotent; the `.up.sql` file re-applied **verbatim**; the down file's **abort guard** fires on a post-0029 slug; **zero leftover functions** after the down, which matters because `drop function if exists` with a wrong signature succeeds *silently*.
- **Role-simulated scenarios, all passing:** 18 (Draft/Live across all four reads, one topic drafted, a whole group drafted, a pending caller) · 21 (the write path and every delete guard) · 21 (the file lifecycle, including 4 direct-INSERT attacks that bypass every RPC) · 3 (guide-body NULL vs empty) · 7 (the exact parameter shape the server action sends) · 4 of 5 storage policies.
- **Path-guard clean:** no public page, API route, middleware or `lib/site.ts` in the diff. `next.config.ts` changed only by the `serverActions` block.
- **CSS containment, measured against a build of the sprint's base commit:** 180,391 → 180,530 bytes, 1,822 → 1,824 rules. Added exactly two, both rooted at `.pw-root`. **Removed: none.**

## Deviations & learnings

**The pattern of this sprint: nine defects, and not one of them was found by reading the code.** Five came from running it on TEST, three from an adversarial review of the finished diff, one from a rule-level CSS diff. Two of those — the storage hole and the destructive Save — would have reached production and been expensive there, because an applied migration is immutable and `0030` already belongs to PP7. The one general lesson worth carrying: **an assertion in a header comment is not a proof.** `0029`'s header claimed Draft covered files. It did not, and nothing in the code or the review of the code would have said otherwise — only asking the database.

**Five bugs were found by running things, not by reading them.**

1. `public.resources` has `created_at` but **no `updated_at`** — three new functions set it.
2. `resources.version` is NOT NULL with no default. Passing NULL raised a not-null error that **masked two security tests**: the "no second guide" and "no duplicate file" cases *looked* rejected for the right reason when they were not.
3. **The guide body could never be emptied.** `coalesce` treated a cleared textarea as "not supplied", so the old text silently returned. NULL and `''` now mean different things.
4. A **blanket** `storage_bucket = 'resources'` CHECK would have **aborted the migration on apply** — the two public booklets legitimately live elsewhere. Caught at 6a-a, before it was written.
5. The orphan-guide hole was real: the partial unique index is on `(element_id, doc_key)` with no `NULLS NOT DISTINCT`, so it never constrained a NULL `element_id`.

**One decision was reversed on purpose.** `serverActions.bodySizeLimit` was dropped at 6a-a on the evidence then available, with a stated condition for revisiting it. Building the upload path *was* that condition.

**Tailwind scanned prose into the stylesheet three times in one sprint.** PP4 found this mechanism in `docs/` and added an `@source` guard. PP6a found it in **`supabase/`** (57 bytes of SQL comments) and added a second guard — then reintroduced PP4's own cautionary example, **`.lowercase`**, from a code comment in `src/`, which cannot be excluded. Then reintroduced it *again* in the comment written to explain it. Both fixed by rewording. **The lesson is narrower than "prose leaks": any English word in any scanned file that happens to name a utility becomes a rule that every visitor downloads, and only a rule-level bundle diff will tell you.**

**One self-inflicted mistake.** Removing a caller-less action, the file was truncated from that banner to the end, taking the Admins actions with it. The build caught it immediately and they were restored verbatim. "Delete from here to the end" was the wrong instrument for "delete this section".

**Not verified: the signed-in visual.** There is no `.env.local` in this checkout, so the gated pages cannot be rendered here — the same limit PP2, PP3, PP4 and PP5 each recorded. Fail-closed behaviour was proven by database role simulation instead.

## Follow-ups

| # | Item | Where it belongs |
|---|---|---|
| 1 | `public.rls_auto_enable()` is executable by `anon` as a SECURITY DEFINER function — the only one in the schema; pre-dates Stage 4, not introduced here. | PP7 security pass (logged as known issue 2) |
| 2 | `admin_upsert_element`, `admin_update_resource`, `admin_delete_resource` and the four academy RPCs now have no caller in the app. | PP7's `0031` |
| 3 | Photo **upload** is not built — the photo field takes a path. D-PP-o reuses the existing 33 images, so PP6c needs no upload. | Only if the owner later wants new photography |
| 4 | The owner applies `0029` to PROD by hand at the merge gate, then runs `0029_verify_PROD_safe_readonly.sql`. | Merge gate |
