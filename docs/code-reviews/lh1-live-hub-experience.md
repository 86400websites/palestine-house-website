# LH1 — Independent review brief (Codex)

> **Role:** independent REVIEWER per `AGENTS.md` — serious issues only, review the **PR diff** (`main..codex/sprint-lh1-live-hub`), never the whole repo. Do **not** edit code, do not push, do not merge, do not run migrations. If something needs fixing, report it — the build engine applies fixes. Report findings in the AGENTS.md format (Severity · Location `path/file.ts:line` + route · Issue · Why it matters · Suggested fix · Confidence) and end with a prioritized list + a merge recommendation (approve / request changes / blocking).

## What this sprint is

**LH1 — Members-only Live hub + Experience body v3 + Model collage sizing.** Owner decisions (2026-07-10): live/recorded sessions move entirely into the member workspace — approved partners (`profiles.is_approved`) publish AND watch each other's sessions; the public site exposes **zero session data**. Publishing was already approval-gated; the change is **viewing** + consolidating publish/watch into one gated hub at `/live`. Plus two design workstreams: the `/experience` body to the owner's v3 mockups (§2 day/night photo pair, §5 Permanence split band, live strip removed) and a CSS-only `/model` collage rebalance.

Full task-level spec: `docs/sprint-prompts/lh1-live-hub-experience-codex-prompt.md` (committed in this branch — the build followed it).

**Database state at review time (already done, verified):** migration `0025_member_live_hub` is applied + verified on **both** TEST and PROD (owner applied PROD early; the engine verified read-only: `member_programming_sessions()` present, anon EXECUTE revoked, `public_programming_sessions()` gone). The deployed production **code** still calls the old RPC and fail-closes to empty live sections until this PR merges — an accepted, flagged state; merge should be prompt.

## Blocking checks (🔴 gating — any failure is a merge-stopper)

1. **Gate ordering on every moved route.** `(workspace)/live/page.tsx` and `(workspace)/live/[id]/page.tsx` must run `getMyProfile()` → `is_approved` → `PendingState` **before any data read**, and on the watch page **before `notFound()`** (a pending partner must see the under-review notice, never a 404). `(workspace)/programming/page.tsx` must be a bare redirect to `/live`.
2. **Migration 0025** (`supabase/sql/migrations/`): `member_programming_sessions()` is SECURITY DEFINER with `set search_path = ''`, filters `where public.is_approved()`, returns the derived `is_mine` boolean and **never raw `created_by`**; EXECUTE revoked from `public, anon`, granted to `authenticated` only; `public_programming_sessions()` dropped; `.down.sql` restores the 0013 state verbatim. Table RLS and `publish_programming_session` (0022) untouched by the diff.
3. **No public surface leaks session data.** In the diff: `/experience` no longer imports `SessionCard`/`getLiveSessions` and renders fully static; no other public page/component references the live feed; footer has no `/live` link; `/live` is out of `PUBLIC_ROUTES` (`src/lib/site.ts`) and the sitemap special-case is gone.
4. **`"/live"` added to `GATED_PREFIXES`** in `src/components/layout/site-chrome.tsx` (without it the public header+footer wrap the workspace shell — the S10 double-chrome regression).
5. **Untouched-by-design surfaces:** `next.config.ts` (CSP — `frame-src https://www.youtube-nocookie.com` must survive; members still watch embeds), `src/middleware.ts`, env handling, `package.json`/lockfile (no new deps), all `/admin/*`, and every workspace route not named in the spec.
6. **No secrets, no masters.** Nothing under `docs/source-assets/` in the diff; no file > 500 KB (the 3 new optimized photos are 250–430 KB); no `.env*`; no keys.
7. **Copy fidelity.** §2 eyebrow/heading/captions/closing line and the §5 Permanence eyebrow/heading/body are **verbatim** vs the previous page version (compare against the pre-diff `src/app/experience/page.tsx`); the five-threads section, hero copy, and closing section are untouched. All **new** strings (hub headings, empty states, dashboard card, publish success, delete confirm, back link) match the copy table in the brief's Task 5 **exactly**.
8. **Build health.** `pnpm run typecheck` / `lint` / `build` green; `/experience` builds static (○), `(workspace)/live` dynamic (ƒ); nothing imports the deleted `src/lib/live/mine.ts`.

## Secondary checks (report, non-blocking unless severe)

- Hub data flow: one `getLiveSessions()` feed; "Your sessions" filters by `is_mine`; edit mode only matches the caller's own sessions (`mine.find`); the delete action stays owner-scoped under RLS.
- `revalidatePath` now targets only `/live` — confirm no stale-cache path for the removed public surfaces.
- The hub grid deliberately does NOT rely on the pages.css `@container page` breakpoints (they only fire inside the public `.ph-page` shell); it uses an auto-fit grid in `globals.css`. Confirm no other reused `live-*` class depends on a public-only container/sticky-header assumption.
- Workspace-styled `not-found.tsx`; `Metadata` on the hub carries no public-marketing description; noindex is inherited from the workspace layout.
- Optional, via your `supabase-test` MCP (read-only queries only): re-run the two structural checks from `supabase/sql/verification/0025_verify_PROD_safe_readonly.sql` against TEST.

## Owner-authorized exceptions (do not flag)

- The footer "Live Programming" link removal — the ONE authorized locked-chrome edit this sprint.
- The fifth dashboard card ("Live") and the sidebar href flip `/programming` → `/live`.
- The Experience `metadata.description` rewording (owner-approved in the brief).
- The role swap itself: built by the primary engine from the Codex brief; you are the reviewer.

---

## Codex review verdict (2026-07-10)

**Verdict: APPROVE — no serious or blocking findings; prioritized findings: none.**

Codex verified: approval checks precede Live page data reads and `notFound()`; migration 0025 + rollback satisfy the gating contract; public Live surfaces and data references are removed; CSP, middleware, dependencies, admin routes, secrets, and source masters are untouched; typecheck, lint, and build pass; `/experience` is static while `/live` and `/live/[id]` are dynamic; the worktree remained clean.

**Post-review owner delta (same day, reviewed by the engine + a 3-lens verification pass):** the Permanence split gained the mockup's center gradient blend (photo edge dissolving into the cream panel, with a stacked-mobile variant); the "The first step" closing section was removed (the DR3.1 footer CTA is the one closing invitation site-wide); §2 gained the mockup's line-and-diamond ornament under the heading and centered captions; the dead `.exp-statement-h` rule was removed.
