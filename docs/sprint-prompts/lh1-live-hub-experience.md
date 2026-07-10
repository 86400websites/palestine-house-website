# Sprint LH1 — Members-only Live hub + Experience body v3 + Model collage sizing

| | |
|---|---|
| **Date** | 2026-07-10 (build + both DB applies + Codex review, one day) |
| **Branch / PR** | `codex/sprint-lh1-live-hub` (9 commits, `aae3eb2…c9a23b3`, pushed) — owner opens + merges the PR himself |
| **Goal** | Live/recorded sessions become **members-only end-to-end**: approved partners publish AND watch each other's sessions from one unified, idiot-proof hub inside the workspace; the public site exposes **zero** session data. Plus the `/experience` body to the owner's v3 mockups and a CSS-only `/model` collage rebalance. |

## What shipped

- **Migration `0025_member_live_hub`** — dropped the anon `public_programming_sessions()` RPC; added `member_programming_sessions()` (SECURITY DEFINER, `search_path=''`, `where public.is_approved()`, derived `is_mine boolean` — raw `created_by` never leaves the DB; EXECUTE authenticated-only). Up + down + `0025_verify_TEST_db_only.sql` (role-simulated) + `0025_verify_PROD_safe_readonly.sql` in the PR. **Applied + verified on TEST** (all EXPECTs pass: approved feed exact incl. `is_mine` · pending 0 rows · publish regression `not authorized`; down + re-up reversibility proven; advisors clean) **and on PROD** (owner applied the up file **early, pre-merge**; engine verified read-only). Table RLS + `publish_programming_session` (0022) untouched.
- **The unified Live hub** — `src/app/live/*` moved into `(workspace)/live/*` (same `/live` URL, now session-gated + noindex): page head + always-visible "Publish a session" anchor → Live now (rendered only when on air) → Browse chips (`?mode=`) → Upcoming → Recordings → `#publish` "Your sessions" (the old `/programming` form + owned rows with Edit/Delete, folded in; `/programming` → `redirect("/live")`). Watch view runs the approval check **before** `notFound()` (pending → PendingState, never a 404); workspace-styled not-found; `SessionCard` gains a "Yours" tag. Data layer: `getLiveSessions()` → the member RPC (React-cached, fail-closed `[]`), `mine.ts` deleted, actions revalidate `/live` only.
- **Navigation** — sidebar "Live Programming" → `/live`; fifth dashboard card (Live / `Radio` / "Watch what other Houses are running — and publish your own."). `"/live"` added to `GATED_PREFIXES` in `site-chrome.tsx` (double-chrome trap).
- **Public removals** — Experience live strip + hero "Watch what's on" CTA (page fully static); footer "Live Programming" link (owner-authorized locked-chrome edit); `/live` out of `PUBLIC_ROUTES` + the sitemap special-case; `robots.ts` unchanged by design; stale "public Live page" strings updated (publish success · delete confirm).
- **Experience §2** — both moods are the new owner photos as 3:2 landscape `Photo`s (`ph-photo-exp-cafe-day` / `ph-photo-exp-stage-night`; the `PH-EXP-02b` Artwork retired), captions centered, the mockup's line-and-diamond ornament under the heading (`.exp-orn`).
- **Experience §5 "Permanence"** — text-only statement → `.v3-split.exp-home-split` cream/photo band (`ph-photo-exp-home` bonsai still-life, ~57% photo, copy verbatim), with the mockup's **center gradient blend** (photo edge dissolving into the cream panel; stacked-mobile variant fades the photo's bottom edge) and the small eyebrow hairline-and-diamond mark.
- **Closing section removed** (owner, post-review) — "The first step" + its divider retired; the DR3.1 footer CTA is the one closing invitation site-wide.
- **Model collage** — CSS-only rebalance to the sizes mockup: `.embassy-big` 4/5 → 1/1.05 + radius-lg; `.embassy-thumb` 4/5 → 5/7 + radius-md; thumb gap/margin → space-3; mat padding → space-4.
- **Assets** — 3 masters through `optimize-photos.ts` → committed `ph-photo-exp-{cafe-day,stage-night,home}.jpg` (≤ ~430 KB); masters + the 3 section mockups sorted into gitignored `docs/source-assets/design-refs/v3/{photos,mockups}/`.

## Prompt used

The committed self-contained brief `docs/sprint-prompts/lh1-live-hub-experience-codex-prompt.md` (Tasks 0–11, gates A/B/C, copy table, SQL sketches, verification matrix) — written by Claude for the **role-swap experiment**: OpenAI Codex (Sol 6) was to build, Claude to review. Codex completed Task 0 (branch + brief commit + the four 0025 SQL drafts) but consumed ~42% of its 5-hour usage window doing so and was blocked by the paused TEST Supabase project, so the owner redirected mid-sprint: **Claude built the sprint from the same brief; Codex ran the independent PR review instead.** Normal roles resume next sprint.

## Checks & results

- `pnpm run typecheck` · `lint` · `build` green after every task and at close (46 routes; `/experience` ○ static 1.76 kB; `/live` + `/live/[id]` ƒ gated).
- **TEST DB**: 0025 applied via `supabase-test` MCP; verify script all-pass; down + re-up proven; security advisors — no new findings (the member RPC appears only in the expected authenticated-callable list; anon-callable list unchanged).
- **PROD DB**: verified read-only after the owner's early apply — member RPC present, anon revoked, old public RPC gone.
- Tree clean; no masters/mockups/`>500 KB` files committed; `.env.local` untracked; CSP/env/deps untouched.
- Trackers (`PROJECT-STATUS.md` §1/§2/§8 + `ROADMAP.md` LH1 row, DR3 row's remaining-pages list) updated in-branch.

### Codex review (2026-07-10)

**APPROVE — no serious or blocking findings; prioritized findings: none.** Verified: approval checks precede data reads and `notFound()`; 0025 + rollback satisfy the gating contract; public surfaces/data references removed; CSP, middleware, deps, admin routes, secrets, masters untouched; checks pass; `/experience` static, `/live` dynamic. Full brief + verdict: `docs/code-reviews/lh1-live-hub-experience.md`.

### Post-review owner delta (same day)

Three owner asks after the verdict — Permanence center gradient · closing section removal · §2 mockup-match + mobile pass — built by the engine and put through a **3-lens adversarial verification workflow** (correctness / mockup-fidelity / scope, every finding independently verified). 2 confirmed findings, both fixed in `c9a23b3`: **(1)** `.exp-home-split`'s column rule was **dead in the cascade** (pages.css loads before v3.css, equal-specificity tie lost to `.v3-split` — the recurring import-order gotcha) → bumped to `.v3-split.exp-home-split` + re-asserted the ≤880px single-column stack the bump would otherwise break; **(2)** the mockup's small eyebrow mark on the Permanence panel was missing → added (`.exp-orn--eyebrow`). 0 refuted-as-real findings shipped.

**Owner Preview pass (final polish):** §2 photos gained the mockup's rounded corners (`--radius-lg`) and the closing line dropped the display `statement-line` style for quiet body type; the Permanence band + its blend switched from `--cream-100` to **`var(--background)`** (= cream-50 in the v3 shell) — the mockup's panel is the *page* background, so the band and its now-wider dissolve (`clamp(10rem, 24vw, 20rem)`; gradient ends in `transparent`, no hardcoded color twin) disappear seamlessly into the page. **Owner add-on:** the `/focus-areas` hero was cropping badly (and still carried a stale ink-wash-illustration alt from before the S1 photo swap) → replaced the `PH-EXP-02a` Artwork with the v3 `Photo` frame on `ph-photo-tatreez-workshop` (crop-tolerant detail shot, honest alt, 16:11 rounded frame); `Photo` gained the deliberately-deferred `priority` prop for this above-the-fold caller.

## Deviations & learnings

- **The role-swap experiment collapsed on cost, not quality.** Codex Sol 6's Task-0 output (SQL drafts) audited correct, but one setup task burned ~42% of a 5-hour usage window. Lesson: keep Codex as the reviewer (its strong role here) unless its economics change.
- **The TEST Supabase project auto-pauses** (free tier, ~1 week idle — last DB work was S11, 2026-06-27). Codex's "connection terminated" was the paused project, not an MCP fault. Before any DB sprint: check the project is awake first.
- **Owner applied 0025 to PROD before merge** — safe because the app fails closed (deployed prod rendered the approved empty live states, no crash), but it created a visible empty-section window on production → **merge promptly** after DB-ahead-of-code applies; sequence prod applies after merge when possible.
- **`@container page` queries never fire in the workspace** — only the public `.ph-page` shell is the named container, so the pages.css `.live-grid` breakpoints are inert inside the shell-less workspace; the hub grid uses the `.dash-cards` auto-fit recipe instead.
- **The pages.css-before-v3.css import-order gotcha struck again** (third sprint): a pages.css override of a v3.css rule at equal specificity silently loses. Always bump specificity — and the delta-verify workflow proved its worth by catching the dead rule pre-merge.
- The verify script's `begin…rollback` block ran via MCP without its trailing `rollback;` — the transaction auto-rolled-back at connection close and the sentinels were confirmed absent, but include the `rollback;` in the same statement batch next time.

## Follow-ups

- Owner: open the PR → Preview gates A (hub role matrix) / B (`/experience`) / C (`/model` collage) → **merge promptly** (ends prod's empty-live-sections window). No post-merge DB step — both databases already verified.
- The canonical gitignored `docs/page-copy/01-public-pages/experience.md` (OneDrive) should be updated by the owner to match the shipped page (strip + closing section gone; the shipped page is the source of truth).
- `PH-EXP-02b` artwork + the `is-night` class are now unused on `/experience` (asset retained; harmless) — candidates for a later asset-hygiene pass.
- Next sprint: continue the DR3 series (`/bring-ph` or `/our-support`), normal roles (Claude builds, Codex reviews).
