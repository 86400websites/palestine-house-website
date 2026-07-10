# Sprint LH1 — Implementation prompt (Codex)

> **You are the implementation engine for this sprint.** This file is the complete, self-contained brief. Written 2026-07-10 against `main` @ `b206bc9`. Execute the tasks in order; stop at each **GATE** and wait for the owner to say "proceed" after eyeballing the result.

---

## 0. Ground rules (read first, non-negotiable)

1. Read **`AGENTS.md`** (repo root) and follow its "If an agent edits code" working agreement and its 🔴 Palestine House gating checks. Read `docs/SUPABASE-MCP-SAFETY.md` before any database work.
2. **Branch:** create `codex/sprint-lh1-live-hub` from the latest `main`. All work happens there. **Never** commit to `main`, never push unless the owner asks, never merge, never `--no-verify`.
3. **Package manager is pnpm** (pinned via `packageManager`). Never npm/yarn. Start with `pnpm install --frozen-lockfile`.
4. **Copy rules:** every existing approved string is verbatim — do not rewrite, "improve," or paraphrase anything that already ships. New strings (empty states, aria labels, confirms) must follow brand voice: warm, short, concrete; never charity tone, franchise hype, political slogans, or startup filler. This prompt provides the new strings — use them verbatim.
5. **Proof numbers are fixed** (10 focus areas · 30 topics · 200+ checklist items · 267 templates · 120-day launch) — never touch them.
6. **Do not touch:** CSP / security headers (`next.config.ts`), env handling, auth flows, header chrome, any route or copy not named in this brief. The ONE authorized footer edit is named in Task 6. No new dependencies. Server Components by default.
7. **Never commit** anything under `docs/source-assets/` (gitignored owner masters), any file over ~500 KB, or any mockup/screenshot. Verify with `git status` before every commit.
8. **Commit per task**, short imperative messages (e.g. `Add 0025 member live hub migration`, `Move live pages into workspace`). This prompt file itself is committed in Task 0.
9. This is Windows; use `git mv` for file moves so history stays intact.

## 1. Context

Palestine House is two shells behind one gate: a calm, premium public marketing site whose one conversion is the green Apply button, and an approval-gated partner reference platform (`profiles.is_approved`). Stack: Next.js 15 App Router, TypeScript strict, Tailwind v4 + custom CSS (`src/styles/globals.css` imports `pages.css` + `v3.css`), Supabase via `@supabase/ssr`, Vercel hosting.

**This sprint (LH1) does three things:**

- **A — Members-only Live hub (feature + DB).** Live/recorded events move entirely into the member workspace. Approved partners publish sessions AND watch what other Houses have published (play a recording or live stream in their own House). The public site exposes **zero** session data — no titles, dates, or videos. Publishing is already approved-only; the change is **viewing** + consolidating publish/watch into one premium, idiot-proof hub at `/live` (workspace-gated).
- **B — Experience page body to v3 mockups.** New photos into the "café by day / stage by night" pair; the "Permanence" band becomes a text-panel + photo split. Copy unchanged.
- **C — Model page collage sizing.** CSS-only rebalance of the "cultural embassy" collage per the owner's mockup.

**Owner mockups + photo masters** (gitignored, present in THIS working copy — do not commit them):

- `docs/source-assets/design-refs/v3/mockups/exp-daynight-mockup.png` — Experience §2 target
- `docs/source-assets/design-refs/v3/mockups/exp-home-split-mockup.png` — Experience §5 target
- `docs/source-assets/design-refs/v3/mockups/model-collage-sizes-mockup.jpeg` — Model collage target
- `docs/source-assets/design-refs/v3/photos/exp-cafe-day.jpg` — day café/audience master (4608×3072)
- `docs/source-assets/design-refs/v3/photos/exp-stage-night.jpg` — night stage/musician master (6650×4433)
- `docs/source-assets/design-refs/v3/photos/exp-home.jpg` — bonsai/prayer-beads still-life master (3072×4608 portrait)

## 2. Database rules for this sprint

- You have the **`supabase-test`** MCP server (TEST project `sdszcralogcrujtyghig`, read/write). Use it to apply and prove migration 0025. You do **not** have production access; the human owner applies the migration to production by hand (SQL Editor) after merge. Never attempt to reach production through any channel.
- Migrations live in `supabase/sql/migrations/` as paired `NNNN_name.up.sql` + `NNNN_name.down.sql`; verification scripts in `supabase/sql/verification/`. Match the house style of `0013_programming_sessions.up.sql` and `0022_programming_publish_url_guard.up.sql` (header comments, `security definer`, `set search_path = ''`, revoke-then-grant, narrow returns).
- The app must fail closed: if the RPC errors (e.g. prod not yet migrated), lists render empty — never crash, never leak.

---

## Task 0 — Branch + housekeeping

1. `git checkout main && git pull`, then `git checkout -b codex/sprint-lh1-live-hub`.
2. `pnpm install --frozen-lockfile`.
3. Commit this prompt file (`docs/sprint-prompts/lh1-live-hub-experience-codex-prompt.md`) if untracked.

## Task 1 — Migration 0025 (files + TEST apply + verify)

Current state: RLS on `programming_sessions` is default-deny with owner-scoped `to authenticated` policies (writes require `public.is_approved()`, see 0016/0021). The only anon read path is the SECURITY DEFINER RPC `public_programming_sessions()` (created in `0013` lines 73–98, granted to `anon, authenticated`). The write RPC `publish_programming_session` (authoritative in `0022`) is already approval-gated — leave it and all table RLS untouched.

**Create `supabase/sql/migrations/0025_member_live_hub.up.sql`:**

```sql
-- 0025_member_live_hub.up.sql
-- Live/recorded sessions move entirely into the member workspace (owner
-- decision, 2026-07-10, sprint LH1): approved partners publish AND watch.
-- The anon read path dies; the member read path is a new approved-only
-- projection with a derived is_mine flag (never raw created_by). Table,
-- RLS policies, and publish_programming_session (0022) are untouched.

drop function if exists public.public_programming_sessions();

create or replace function public.member_programming_sessions()
returns table (
  id            uuid,
  title         text,
  summary       text,
  mode          text,
  status        text,
  venue         text,
  stream_url    text,
  recording_url text,
  starts_at     timestamptz,
  cover_path    text,
  is_mine       boolean
)
language sql
security definer
set search_path = ''
stable
as $$
  select s.id, s.title, s.summary, s.mode, s.status, s.venue,
         s.stream_url, s.recording_url, s.starts_at, s.cover_path,
         (s.created_by = (select auth.uid())) as is_mine
  from public.programming_sessions s
  where public.is_approved()          -- pending/revoked callers: zero rows
  order by s.starts_at desc nulls last;
$$;

revoke execute on function public.member_programming_sessions() from public, anon;
grant  execute on function public.member_programming_sessions() to authenticated;
```

**Create `supabase/sql/migrations/0025_member_live_hub.down.sql`:** drop `member_programming_sessions()` and restore `public_programming_sessions()` **verbatim from 0013 lines 73–98** including its `revoke ... from public;` + `grant ... to anon, authenticated;`.

**Create verification scripts** (match the house style of existing files in `supabase/sql/verification/`):

- `0025_verify_TEST_db_only.sql` — sections: (0) `member_programming_sessions` exists and `public_programming_sessions` does NOT; (1) `has_function_privilege`: `anon` = false, `authenticated` = true on the member RPC; (2) `begin…rollback` role simulations: an approved user's JWT sees all rows with correct `is_mine`; a non-approved JWT gets 0 rows; (3) regression: `publish_programming_session` still raises `not authorized` for non-approved.
- `0025_verify_PROD_safe_readonly.sql` — read-only versions of (0) + (1) only.

**Then, on TEST via the `supabase-test` MCP:** apply the up migration (`apply_migration`), run the TEST verify script and confirm every EXPECT, apply the down migration once and re-apply up (prove reversibility), and run `get_advisors` — no new security findings.

## Task 2 — Data layer (`src/lib/live/`)

- `types.ts` — add `is_mine: boolean` to `LiveSession`; update the header comment (the shape now mirrors `member_programming_sessions()`, migration 0025). `LIVE_MODES`, `LIVE_FILTERS`, grouping types unchanged.
- `sessions.ts` — `getLiveSessions()`: switch `rpc("public_programming_sessions")` → `rpc("member_programming_sessions")`. Keep the React `cache` wrapper, `server-only`, and the fail-closed `return []` on error. Update comments (this is no longer "the anon-safe public projection" — it is the member projection; anon/pending get zero rows).
- **Delete `mine.ts`** — the hub filters the one feed by `is_mine` instead (one round-trip, one source of truth). The `select_own` RLS policy stays in the DB; only the app file goes.
- `actions.ts` — `revalidatePath`: keep `"/live"`, drop `"/experience"` and `"/programming"`. Replace the success string per the copy table (Task 5). The delete action's direct table delete under RLS is unchanged.

## Task 3 — Route move + legacy redirect

1. `git mv src/app/live/page.tsx src/app/(workspace)/live/page.tsx` (rewritten as the hub in Task 5); likewise `[id]/page.tsx` and `[id]/not-found.tsx`; delete the now-empty `src/app/live/`.
2. `git mv src/app/(workspace)/programming/programming-form.tsx src/app/(workspace)/live/` and the same for `delete-session-button.tsx`. In the form, the Cancel link `/programming` → `/live`.
3. `src/app/(workspace)/programming/page.tsx` — replace the body with a `redirect("/live")` server component (one-line comment: folded into the Live hub, sprint LH1).
4. **`src/components/layout/site-chrome.tsx` — add `"/live"` to `GATED_PREFIXES`** (line ~23). Without this the public header+footer wrap the workspace shell (double chrome). Keep `/programming` in the list.
5. `src/middleware.ts` needs no change (session refresh only). The workspace layout (`src/app/(workspace)/layout.tsx`) already redirects signed-out users to `/login?next=/dashboard` and sets `robots: noindex` — leave its hardcoded `next` as is (accepted tradeoff; the hub is one sidebar click from the dashboard).

## Task 4 — Workspace navigation (idiot-proof reachability)

- `src/components/workspace/workspace-shell.tsx` (~line 57): sidebar item `{ key: "live", label: "Live Programming", href: "/programming" }` → `href: "/live"`. Label, icon, and pre-approval Locked behavior unchanged.
- `src/app/(workspace)/dashboard/page.tsx`: add a fifth card to the `cards` array — key `live`, title `Live`, icon `Radio` (lucide, already used by session-card), line and CTA from the copy table, href `/live`. `.dash-cards` auto-fits; no CSS change needed.

## Task 5 — The hub + watch page (premium, v3 language)

Design registers: Spectral display / Inter body, heritage green `#1A6B4A` leads, cream paper washes, restrained `Reveal`/`FadeIn` motion as already used in the workspace. Reuse `SessionCard` (`src/components/shared/session-card.tsx`), `StatusBadge`, and the existing `live-grid` / `live-filter-tags` / `live-watch-*` CSS (global). Do **not** reuse the sticky `.live-filterbar` (its `top: 72px` assumes the public header). New CSS: only a few small rules appended to the workspace block in `src/styles/globals.css` (section spacing, browse-row flex).

**Hub — `src/app/(workspace)/live/page.tsx`** (Server Component; reads `searchParams` `mode?`, `edit?`):

1. First logic line: `const profile = await getMyProfile();` → if `!profile?.is_approved` return `<PendingState contactFallback />` (`src/components/workspace/pending-state.tsx`). The approval gate must come before ANY data read.
2. Page head (workspace `ws-pagehead` pattern): eyebrow + `ws-h1` + lead + a primary Button anchor `#publish` — publishing always one visible click away.
3. **Live now** — only rendered when `live.length > 0`: `.live-grid` of `SessionCard`s. No empty state; absence of the section is the state.
4. **Browse chips** — `LIVE_FILTERS` as links `/live` / `/live?mode=X` reusing `.live-filter-tags` markup in a plain non-sticky div (port `resolveFilter` from the old public page). Filter applies to Upcoming + Recordings.
5. **Upcoming** — heading + grid, or its empty-state line.
6. **Recordings** — heading + grid, or its empty-state line.
7. **`<section id="publish">` — Your sessions**: the `ProgrammingForm` (create; edit mode when `?edit=<id>` matches one of `sessions.filter(s => s.is_mine)`), then the owned-session rows ported from the old `/programming` page (StatusBadge + mode tag + title + meta + Edit link `/live?edit=<id>#publish` + `DeleteSessionButton`). If the member owns nothing yet, the empty-state line from the copy table.
8. `SessionCard` — additive only: when `session.is_mine`, render `<span className="live-tag">Yours</span>` beside the mode tag.
9. Metadata: `title: "Live Programming"` (noindex inherited from the workspace layout).

**Watch — `src/app/(workspace)/live/[id]/page.tsx`:** keep the current implementation with three changes: (a) run the `getMyProfile()` approval check **before** `findSession`/`notFound()` — pending members must get PendingState, not a 404 (the RPC returns them zero rows); (b) back link per copy table (still `/live`); (c) comment updates. The `youTubeEmbedUrl` / `youtube-nocookie` iframe logic and the graceful no-video state are unchanged — CSP is untouched. `generateMetadata` unchanged.

**`src/app/(workspace)/live/[id]/not-found.tsx`:** restyle from public classes (`ph-section-lg`/`ph-container`/`ph-center-stack`) to workspace ones (`ws-h1`, `ws-lead`, Button link to `/live`); copy itself stays.

**New UI strings — use verbatim:**

| Slot | String |
|---|---|
| Hub eyebrow | `The network, live` |
| Hub H1 | `Live Programming` |
| Hub lead | `What Houses around the world are streaming and recording — and where you publish your own.` |
| Head CTA | `Publish a session` |
| Live-now heading | eyebrow `On air` · h2 `Live now.` |
| Upcoming heading | eyebrow `On the calendar` · h2 `Upcoming.` |
| Recordings heading | eyebrow `Watch any time` · h2 `Recordings.` |
| Upcoming empty | `Nothing on the calendar yet. When a House schedules a session, it lands here.` |
| Recordings empty | `No recordings yet — the first House to publish opens the library.` |
| Filter-empty line | `Nothing in {filter} right now — ` + link `see everything that’s on` |
| Your-sessions heading | eyebrow `Your House` · h2 `Your sessions.` |
| Your-sessions empty | `You haven’t published anything yet. Paste a YouTube link above — it takes about a minute.` |
| "Yours" card tag | `Yours` |
| Publish success (`actions.ts`) | `Published — every House can see it now.` |
| Delete confirm (`delete-session-button.tsx`) | `Remove this session? Other Houses will no longer see it.` |
| Watch back link | `Back to Live Programming` |
| Dashboard card | title `Live` · line `Watch what other Houses are running — and publish your own.` · CTA `Open Live` |

## Task 6 — Public removals (exact checklist)

1. `src/app/experience/page.tsx` — delete section 4 (the live strip, lines 176–212 incl. its empty-state line) and the hero secondary CTA ("Watch what's on" → `#whats-on`, lines ~84–89); remove the now-unused imports (`SessionCard`, `getLiveSessions`, `groupSessions`, `Play`, `ArrowRight`) and the `strip` computation; the page becomes fully static. Update `metadata.description` to: `What a Palestine House feels like — a café by day, a stage by night, and five threads of programming that hold a year together.`
2. `src/components/layout/site-footer.tsx` (~line 82) — remove the `<Link href="/live">Live Programming</Link>` item from the Explore column. **This is the one authorized locked-chrome edit** (owner-approved for this sprint). Change nothing else in the footer.
3. `src/lib/site.ts` — remove `"/live"` from `PUBLIC_ROUTES`.
4. `src/app/sitemap.ts` — remove the `route === "/live"` special-case (all remaining routes `"monthly"`).
5. `src/app/robots.ts` — **no change** (gated routes are handled by meta noindex, not robots disallow; a disallow would advertise the path).
6. Comment sweep in files you already touch (`src/lib/live/*.ts`, `session-card.tsx`, the `live-*` header comments in `src/styles/pages.css`): update mentions of "public /live + Experience strip" where misleading — but do not churn files touched for comments alone.

**🔶 GATE A — stop, owner eyeballs (local `pnpm run dev` or Preview):** anon sees no trace of sessions anywhere (Experience has no strip, footer has no Live link, `/live` bounces to login); a pending account sees PendingState at `/live` (not a 404); an approved account browses, filters, watches, publishes, edits, deletes; a second approved account sees the first's published session.

## Task 7 — Asset pipeline (before the Experience sections)

1. `scripts/optimize-photos.ts` — append 3 entries to the `PHOTOS` table with a sprint comment in house style (`/* LH1 — Experience body: day/night pair + permanence split (owner masters, 2026-07-10) */`):
   - `{ src: "exp-cafe-day.jpg", out: "ph-photo-exp-cafe-day.jpg", width: 2000, height: 2000 }`
   - `{ src: "exp-stage-night.jpg", out: "ph-photo-exp-stage-night.jpg", width: 2000, height: 2000 }`
   - `{ src: "exp-home.jpg", out: "ph-photo-exp-home.jpg", width: 1600, height: 2000 }`
2. Run `pnpm tsx scripts/optimize-photos.ts`. Check the log: each new output ≤ ~500 KB.
3. Commit ONLY the three new `public/assets/photos/ph-photo-exp-*.jpg`. Confirm `git status` shows no masters/mockups.
4. `src/components/shared/photo.tsx` — register the three ids in `PHOTO_SOURCES` (comment group: `/* LH1 — Experience body */`).

## Task 8 — Experience §2 "A café by day. A stage by night."

`src/app/experience/page.tsx` lines 92–133, target = `exp-daynight-mockup.png`:

- Day figure: `Photo assetId="ph-photo-exp-cafe-day"` (replaces `ph-photo-arch-cafe`), alt `The café room by day — guests at wooden tables under the arches, listening in.`
- Night figure: `Photo assetId="ph-photo-exp-stage-night"` (replaces the `Artwork PH-EXP-02b`), alt `The same room by night — a musician on stage, the audience gathered on the rugs.` Keep the `Artwork` import (still used by §3 pillars). Drop the figure's `is-night` class only if nothing in CSS still styles it.
- Both figures use class `exp-mood-photo` and `sizes="(max-width: 760px) 100vw, 45vw"`.
- Eyebrow, H2, both captions, and the closing line stay verbatim.
- CSS: `src/styles/v3.css` (~line 423): `.exp-mood-photo { aspect-ratio: 4 / 5 }` → `aspect-ratio: 3 / 2` (update the comment — the "Artwork twin" note is obsolete). Optional tune-at-gate knob: `.exp-daynight` max-width 62rem → 66rem in `src/styles/pages.css` if the pair feels small.

## Task 9 — Experience §5 "Permanence" split band

Replace the text-only statement (page.tsx lines 214–227) per `exp-home-split-mockup.png`, reusing the Home split pattern (`.v3-split`, `src/styles/v3.css` ~427–472):

- `<section className="v3-split exp-home-split">`: panel left — eyebrow `Permanence`, `<h2>A home, not a moment.</h2>`, body **verbatim**: `Pop-ups close. A House stays — open every day, at the same address. Not a protest, not a campaign. A place where the culture lives in the open.`
- Photo right: `Photo assetId="ph-photo-exp-home"`, alt `A bonsai and prayer beads on a woven table, a candle burning behind.`, `sizes="(max-width: 880px) 100vw, 60vw"`.
- One new rule in the Experience block of `pages.css`: `.exp-home-split { grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr); }` (photo ≈ 57% per mockup). Everything else (cream wash, responsive stack) inherits from `.v3-split`.
- Final section order: five threads → Permanence split → `PageDivider` → closing statement. Hero and five threads untouched.

**🔶 GATE B — stop, owner eyeballs:** Experience page — landscape pair matching the mockup, Permanence split, no live strip, single hero CTA; check 320px → desktop.

## Task 10 — Model collage sizing (CSS only)

`src/styles/pages.css` lines ~730–813, target = `model-collage-sizes-mockup.jpeg`. No markup change to `embassy-gallery.tsx`:

- `.embassy-col` padding: `var(--space-3) var(--space-3) var(--space-6)` → `var(--space-4) var(--space-4) var(--space-6)`
- `.embassy-big`: `aspect-ratio: 4 / 5` → `1 / 1.05`; `border-radius: var(--radius-md)` → `var(--radius-lg)`
- `.embassy-thumbs`: `gap` and `margin-top` `var(--space-2)` → `var(--space-3)`
- `.embassy-thumb`: `aspect-ratio: 4 / 5` → `5 / 7`; `border-radius: var(--radius-sm)` → `var(--radius-md)`
- Keep both responsive breakpoints as-is.

**🔶 GATE C — stop, owner eyeballs:** `/model` collage vs the mockup; the two aspect ratios are the tuning knobs.

## Task 11 — Close-out

1. `pnpm run typecheck` && `pnpm run lint` && `pnpm run build` — all green; build output shows `/experience` static and `(workspace)/live` dynamic; no imports of the deleted `mine.ts`.
2. `git status` — clean; nothing from `docs/source-assets/`, nothing > 500 KB, `.env.local` absent from the diff.
3. Update `docs/PROJECT-STATUS.md` (§1 Right now, §2 sprint board, §8 change log) and `docs/ROADMAP.md` (new LH1 row + tick) in the same branch.
4. Report per the AGENTS.md format, and list for the PR body: the four owner-visible flags — footer link removed (authorized), fifth dashboard card, Experience metadata description, and the **prod security window**: `public_programming_sessions()` stays anon-callable on production until the owner applies 0025 there by hand (data was always anon-safe titles/metadata; all public UI is already gone at merge).
5. State explicitly in the PR body: **after the owner applies 0025 on production (SQL Editor), Claude verifies production read-only** (the `0025_verify_PROD_safe_readonly.sql` checks via the `supabase-prod-readonly` MCP) as part of `/close` — the sprint is not closed until that verification passes.

## Verification matrix (run through before declaring done)

| Path | Check |
|---|---|
| **Anon** | `/live`, `/live/<id>`, `/programming` → redirect to `/login?next=/dashboard`; `/experience` has no strip/CTA and zero session strings in view-source; footer has no Live link; sitemap has no `/live`; on TEST, calling `member_programming_sessions` with the anon key → permission denied; `public_programming_sessions` → unknown function |
| **Pending (signed in, not approved)** | `/live` and `/live/<id>` render PendingState (not 404); sidebar "Live Programming" shows Locked; their JWT gets 0 rows from the RPC; publish RPC still raises `not authorized` |
| **Approved (non-owner)** | Hub lists ALL sessions incl. other Houses'; `?mode=` filters work; watch page embeds youtube-nocookie (CSP intact); no "Yours" tag on others' cards; cannot edit/delete others' rows |
| **Approved (owner of a session)** | "Yours" tag on own cards; Your-sessions list shows only own rows; publish → visible to a second approved account; edit prefills via `/live?edit=<id>#publish`; delete removes it |
| **Build/static** | typecheck/lint/build green; masters/mockups uncommitted; only 3 new optimized jpgs added under `public/` |
| **TEST DB** | 0025 applied via `supabase-test` MCP; TEST verify script all EXPECTs pass; down + re-up proven; `get_advisors` clean |
