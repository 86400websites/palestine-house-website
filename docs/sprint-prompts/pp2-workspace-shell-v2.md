# Sprint PP2 — Workspace shell v2 + About landing (+ the D-PP-f model re-correction)

| | |
|---|---|
| **Date merged** | **Not yet merged.** Built + pushed 2026-08-12 (10 commits `ba853da`→`7861c02`+). Owner merges `docs/pp1-close`, then PP1.1, then this PR. |
| **Branch / PR** | `claude/sprint-pp2-workspace-shell-v2` (off `claude/pp1-1-card-model`) / PR opened by the owner |
| **Goal** | Build the new gated workspace chrome and its first page — header, footer, toast, `/dashboard` as the About landing, and the four section routes — so the partner-facing shell exists for PP3 to fill. Mid-sprint the owner revised the topic model (**D-PP-f**), so the sprint also re-corrected PP1's foundations pre-PROD. |

Stage 4 — Private Platform Revamp. Public pages untouched throughout.

## What shipped

Ten owner-gated steps, commit + push per step.

- `ba853da` — **2a Chrome copy.** The header/footer strings live in the mockup's markup and render functions, not `#appData`, so PP1 never captured them. The extractor now emits `spec.chrome` (skip link, brand, 5 nav items + tooltips, account/menu labels, title suffix, the whole footer) with per-capture asserts. Recorded **D-PP-d** and **D-PP-e** in PROJECT-STATUS §5.
- `59f2d11` — **2b Foundations.** `src/styles/workspace-v2.css`: the mockup palette, layout and motion tokens plus primitives, all declared **on** and nested **under** `.pw-root`. Fonts needed no change — the root layout already loads Spectral + Inter via `next/font` as `--font-display`/`--font-body`.
- `0c1e699` — **2c Header + the `(platform)` route group.** Five nav links with tooltips, solid-on-scroll, mobile panel with scroll lock / Escape / focus trap / focus restore, account button as a real link to `/account`. New route group with its **own** server-side session gate; `/setup` created and added to `GATED_PREFIXES` in the same commit. The extractor also began emitting `src/lib/workspace-v2/spec.ts` (~6 KB) because `docs/workspace-spec.json` is ~167 KB and far too heavy to import.
- `e192d6a` — **2d D-PP-f planning.** ROADMAP decision ⑦ + the card-model exception, model paragraph, dormancy list and contraction list rewritten; PP1.1 row marked partly superseded; PP3/PP4/PP6/PP7 scopes and exit gates amended. **D-PP-f** recorded in §5.
- `ee5307e` — **2e Generator + spec + seed.** Transform keeps **guide only** (33, one per topic), drops the synthesized Template card, and emits the **297 templates as a live per-topic surface**. New asserts: exactly one kept standard resource per topic, and no topic with an empty grid. `RESOURCE_KINDS` + `TEMPLATE_COPY` added to the generated module so PP3 never hand-types card copy.
- `5cce1a8` — **2f Schema + TEST.** `0027` edited in place again (PROD still never ran it): `doc_key` CHECK → `('guide')`. Both verification scripts updated; TEST re-applied and re-verified.
- `02f8e64` — **2g Footer + toast.** The moss CTA band, tatreez band, five-column grid with the Arabic tagline, bottom bar. `.pw-toast` provider (`role="status"`, `aria-live="polite"`, 3.2 s) — **`.adm-toast` untouched**. Two owner-approved copy edits applied in the generator, asserted.
- `d028e8a` — **2h About landing.** `/dashboard` moved to `(platform)` (path unchanged — it is hardcoded in the public header, login/apply redirects and outbound email) and rebuilt as hero + the four journey cards. `PwPendingState` preserves **both** approved pending wordings plus the declined branch and the `/contact` fallback.
- `0703aa9` — **2i Section pages.** `/setup` upgraded; `/operate`, `/program`, `/support` moved. `/support` keeps its existing working Ask HQ form under the new hero (D-PP-e).
- `7861c02` — **2j a11y + touch targets.** Native React 19 `inert` on the closed panel; controls raised to 44 px under `(pointer: coarse)` only.

## Checks & results

- `pnpm run typecheck` ✅ · `pnpm run lint` ✅ · `pnpm run build` ✅ (47 routes).
- **CSS containment proven, not asserted.** Built the CSS bundle before and after and diffed it **rule by rule** at 2b, 2c, 2g, 2h and finally: **0 baseline rules removed or changed · 167 added · all 167 scoped under `.pw-` · 0 `.adm-toast` rules touched.**
- **TEST re-apply (2f).** `0028` down → `0027` down → corrected `0027` up → corrected `0028` up → `0027_verify_TEST_db_only.sql`. Every EXPECT passed: 5/10/33, distinct elements 33, unmapped 0, extras table + RPC absent, `doc_key_check` = `'guide'` alone, coded 297 / uncoded 2 / doc_keys 0, unique index present, RLS on with zero client policies, anon EXECUTE denied on all three RPCs. **Templates grid: 33 topics, 0 empty, 297 files, 4–10 per topic.** Role sims **8/8** including the new `approved templates visible = 297`. `get_advisors` unchanged.
- **Seed fidelity by digest** (the MCP takes SQL as a string, so the seed is transcribed): topics `c948dc40…` and sections `983e2df3…` computed independently from `docs/workspace-spec.json` and from the DB — identical both times.
- **Regeneration byte-stable** at every step; the 47 workspace assets re-encoded identically throughout (zero asset diffs).
- **Path-guard CLEAN** — no public page, API route, `middleware`, `next.config`, `package.json` or `.env` file in the sprint diff.
- **Anonymous walkthrough** of all 7 gated paths: each redirects to login and leaks no chrome markup; the public home page still renders its own header. No double chrome.
- **Secret scan** of the full sprint diff: no `service_role`, `sb_secret_`, JWT or private key introduced; `.env.local` untracked.

## Deviations & learnings

- **The model changed mid-sprint.** The owner replaced D-PP-c's 3-card row with **D-PP-f** on day two. Because `0027`/`0028` had still never reached PROD, this was again a cheap in-place correction rather than a new migration pair — the expand-early/contract-last posture has now paid for itself twice. The lesson holds: **defer the PROD apply until the UI that depends on the schema is real.**
- **Planning before code, deliberately.** Step 2d rewrote ROADMAP/PROJECT-STATUS *before* touching the generator, so PP3–PP7 could not be built against a stale model. That ordering is what makes "no inconsistencies by the end of the sprint" achievable rather than aspirational.
- **`doc_key` shrank as the model clarified** — `overview/guide/checklist/watch` → `overview/guide/template` → `guide`. Each narrowing removed a flag that duplicated information already in the data. The templates grid needs **no** flag at all: `element_id` already says which topic a file belongs to, which is why the 297 files went live with nothing to re-upload.
- **Two design systems, one bundle.** Rather than trusting scoping by convention, every step re-ran a rule-level bundle diff. That is what makes "zero visual change to the public site and the legacy workspace" a measured claim.
- **A new route group beat a shared shell.** Putting the new pages in `(platform)` — with its own session gate — meant the legacy sidebar never had to know the revamp existed, and PP5 can delete the old group wholesale.
- **The generator is the copy contract.** Every chrome string, every approved trim and both owner copy edits are applied inside `scripts/extract-mockup-spec.ts` behind asserts, so a future mockup re-export cannot silently reintroduce removed wording.

## Follow-ups

1. **Owner merges:** `docs/pp1-close` PR → the PP1.1 PR → this PR.
2. ~~PROD apply~~ ✅ **DONE 2026-08-12 — the owner ran `0027_platform_ia.up.sql` then `0028_platform_seed.up.sql` on production by hand, and it is verified read-only via `supabase-prod-readonly`:**
   - 3 platform tables, RLS on, **0 client policies** each.
   - sections 5 · groups 10 · topics 33 · distinct elements 33 · **unmapped elements 0**.
   - `platform_extras` absent · `get_platform_extras` count 0.
   - `resources_doc_key_shape` = `CHECK (doc_key IS NULL OR doc_key = 'guide')` — the D-PP-f shape, nothing else.
   - resources: coded **297** · uncoded 2 (booklets) · **doc_keys 0** · `resources_element_doc_key_ux` present.
   - templates grid: **33 topics, 0 empty, 297 files, 4–10 per topic.**
   - EXECUTE: `anon` **false** / `authenticated` true on all three RPCs; `get_resources` confirmed widened with `code` + `doc_key`.
   - Untouched content intact: elements 33 · checklist_items 818 · resources 299 · profiles 10 (10 approved) · applications 10 · support_requests 2 · checklist_progress 15.
   - **Seed fidelity in PROD proven by digest:** topics `c948dc40bab1cc8b54be6999c6784b07` and sections `983e2df37e910f1e9f5cd90228aaa766` — **identical to TEST and to `docs/workspace-spec.json`**.
   - `get_advisors(security)` on PROD: **no new findings** — same INFO/WARN set as TEST (the `platform_*` RLS-no-policy INFOs are the intended RPC-only posture).

   **Migration immutability now applies to 0027/0028** — they have run on production, so any further change ships as a NEW numbered migration, never an in-place edit. The one exception already taken: the generated `0028` header comment was corrected from "D-PP-c: 3-card model" to name D-PP-c + D-PP-f, because a permanent migration file misstating its own governing decision is a trap for later sprints. **Comment-only — zero SQL statements differ from what PROD ran.**
3. ⚠️ **Not verified in this sprint: the signed-in visual.** The gate, routing, CSS containment and DB were all proven, but nobody has seen the shell as an approved partner — that needs a real session. **Owner: walk the Vercel Preview** (About landing, all 5 nav links, mobile panel, toast, `/support` form still submits) at desktop and 320 px.
4. **New copy awaiting explicit sign-off** (all reversible one-liners): the section waiting state — *"Content is on its way." / "This section's focus areas are being prepared. Check back shortly."* — and *"Search coming soon."* (modelled on the mockup's own *"Video coming soon."*). The two footer edits and the `launching-a-new-house` intro trim were approved in-session.
5. **Codex review of this branch is recommended before merge** — it changes the approval surface (a new gated route group) and carries a PROD migration. Prompt in the session close.
6. During the PP2→PP3 gap the legacy routes (`/plan`, `/build`, `/elements`, `/resources`, `/academy`, `/live`, `/food`, `/tools`) still resolve by direct URL but are unreachable from the new chrome — **intended**, per D-PP-d. PP5 deletes them and adds redirects.
