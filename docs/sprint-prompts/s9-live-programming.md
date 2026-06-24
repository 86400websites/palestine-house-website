# S9 — Live Programming

| | |
|---|---|
| **Date** | Built 2026-06-24/25 · merged _pending_ |
| **Branch / PR** | `claude/sprint-s9-live-programming` · PR _pending_ |
| **Goal (one line)** | Wire `/live` + the Experience strip to real `programming_sessions` data through one shared `SessionCard`; add a `/live/[id]` youtube-nocookie watch view; let approved partners publish/edit/remove a YouTube link + metadata from a gated `/programming` tool. No streaming infra (D-S9-a); listing-only (D2). |

## What shipped

Built in 7 owner-gated sub-steps (push-per-step), each with an adversarial multi-agent review before commit.

- **9a — Data + shared component foundation** (`6e64cf8`). `src/lib/live/{types,sessions,youtube,format}.ts` + `src/components/shared/session-card.tsx` (`SessionCard` + `StatusBadge`, the one shared card per DESIGN §6). `getLiveSessions()` wraps the anon `public_programming_sessions()` RPC (0013), React-cached, fail-closed to `[]`; pure `groupSessions`/`filterByMode`; `parseYouTubeId`/`youTubeEmbedUrl` validate a link and rebuild it on `youtube-nocookie`; `formatSessionWhen` (UTC). _Review caught a **blocking** `Intl.DateTimeFormat` that mixed `dateStyle`/`timeStyle` with `timeZoneName` — would have thrown at module load and crashed 9c; fixed to component options._
- **9b — Wire public `/live`** (`26f2c9f`). Live now / Upcoming / Past grids of `SessionCard`; interactive `?mode=` chips resolved server-side against `LIVE_FILTERS`; approved empty states kept (zero-row feed = byte-identical to Stage 0). `/live` now dynamic.
- **9c — Watch view + CSP** 🔒 (`e7db3ab`). `src/app/live/[id]/page.tsx` + `not-found.tsx`: 16:9 youtube-nocookie embed rebuilt from a regex-validated 11-char id; missing/non-YouTube link → graceful state. `next.config.ts` CSP gained `frame-src 'self' https://www.youtube-nocookie.com` (D1); `X-Frame-Options: DENY` + `frame-ancestors 'none'` unchanged (header verified on a live response via `curl`).
- **9d — Experience strip** (`cfe1bea`). `/experience` `#whats-on` renders ≤3 cards from the **same** `getLiveSessions()` + **same** `SessionCard` (live→upcoming→past); approved empty line kept. `/experience` now dynamic.
- **9e — Migration `0020`** 🔒 (`861f383`). Hardened `publish_programming_session` RPC (SECURITY DEFINER, `search_path=''`, `is_approved()`+`auth.uid()` gate, `created_by` forced, `left()`-capped, `mode`/`status` validated, revoke public/anon→grant authenticated) + `mode` CHECK (the 4 threads, drop-guarded) + in-function `invalid mode` raise. **Applied + role-verified on TEST then PROD** via MCP.
- **9f — Gated `/programming` tool** 🔒 (`d6b9184`). Approval-gated publish/edit/remove of a YouTube link + metadata; lists own rows under `select_own` RLS; `src/lib/live/actions.ts` server actions (zod + YouTube validation, neutral errors, `revalidatePath`). Sidebar "Live Programming" repointed from the public `/live` to `/programming` (Locked for pending). **Migration `0021`** makes the delete verb `is_approved()`-symmetric (all three write verbs now require approval); applied + verified test+prod.
- **9g — Exit gate** (this commit). Holistic 4-lens full-diff review (security · cross-cutting correctness · invariants/copy · completeness critic) = clean (no blocking/high). Fixes applied: responsive collapse for the publish-form field pairs (mobile datetime overflow), `Watch`→`Details` on cards with no video yet, a filter-aware empty line on `/live`, card title/summary line-clamp, `encodeURIComponent` on the `?mode=` href, a stale comment. Trackers + this record updated.

**DB:** migrations `0020` + `0021` (+ `.down.sql`), applied + verified on **test and prod**. **Files:** `src/lib/live/*`, `src/components/shared/session-card.tsx`, `src/app/live/page.tsx` + `live/[id]/*`, `src/app/experience/page.tsx`, `src/app/(workspace)/programming/*`, `src/components/workspace/workspace-shell.tsx`, `next.config.ts`, `src/styles/{pages,globals}.css`.

## Checks & results

- `pnpm run typecheck` ✅ · `pnpm run lint` ✅ · `pnpm run build` ✅ (37 routes; `/live`, `/live/[id]`, `/experience`, `/programming` are `ƒ` dynamic, all other public pages stayed `○`).
- **DB role matrix (MCP, test+prod):** anon EXECUTE revoked · no-JWT + pending → `not authorized` · approved publishes · cross-owner edit → `session not found` · cross-owner delete → 0 rows · bad mode → CHECK reject + `invalid mode` · anon projection leaks no `created_by`/timestamps. Prod policies symmetric (insert/update/delete all `created_by=auth.uid() AND is_approved()`).
- **CSP** verified on a live response: YouTube-only `frame-src`; `DENY` framing of us intact.
- Reviews: per-step adversarial workflows (9a–9f) + a holistic 4-lens exit-gate workflow, all clean after fixes.

## Owner Preview test script

Vercel Preview uses the **test** DB, seeded with 3 demo sessions (live / upcoming / past; all real, neutral public YouTube videos).

1. **Public, logged out — `/live`:** see "Live now" (An Evening of Oud), "Upcoming" (Cooking the Coast), "Past recordings" (A Reading…). Click a category chip (e.g. **Food**) → the feed filters; an empty category shows "Nothing in {category} right now — see everything that's on." Click a card → `/live/[id]` plays the embed.
2. **`/experience` → "See what's on right now":** the strip mirrors `/live` (same cards), or the approved quiet line when empty.
3. **Log in as an approved partner → sidebar "Live Programming" (`/programming`):** publish a session — paste any YouTube link (`https://youtu.be/…` or `…/watch?v=…`), pick Status/Category/Venue/Starts (UTC)/About → **Publish session**. It appears under "Your sessions" and on public `/live` + Experience.
4. **Edit** a session → change something → **Save changes** → reflected on `/live`. **Remove** → confirm → it disappears everywhere.
5. **Edge cases to confirm "no surprises":** publish with **no** link (an Upcoming announcement) → card shows **Details**, watch page says "No video to watch here yet." Paste a **non-YouTube** URL → friendly error, nothing saved. Open the form on a **phone** → the two field-pairs stack, the date field fits.

> A **pending** (unapproved) account sees "Live Programming" as **Locked** and `/programming` shows the under-review notice — this is intended (was previously an external link to public `/live`).

## Deviations & learnings

- **The DB layer pre-existed (S5/0013):** the table + anon `public_programming_sessions()` RPC + owner-scoped RLS + the `.live-card*` CSS were already shipped, so S9 was mostly wiring + the one publish form. The `mode` free-text "design gap" was closed here with the `0020` CHECK.
- **Publish-tool placement:** a workspace `/live` would collide with the public `/live` (route groups add no path segment), so the tool lives at **`/programming`** and the sidebar item was repointed there (owner direction: "place it here instead of linking the public page").
- **Write-verb symmetry (`0021`):** the exit review surfaced that `0013`'s `delete_own` was ownership-only while insert/update required approval — harmless today (pending users own no rows) but asymmetric if approval is ever revoked. Fixed with a one-line RLS migration. PostgREST exposes table DELETE directly, so this had to be fixed at the RLS layer, not the action.
- **UTC end-to-end:** publish form, storage, and display are all UTC (the field is labelled "Starts (UTC)"), avoiding timezone-conversion bugs for an MVP. Per-event local timezone is a follow-up.
- **Adversarial review earned its keep:** the 9a `Intl.DateTimeFormat` bug passed typecheck/lint/build (TS allows the option combo; the module wasn't imported yet) and would have crashed the watch view on first render — caught only by a reviewer that reproduced it on the runtime.

## Follow-ups (non-blocking; recorded in PROJECT-STATUS §1/§3)

- **Stale "Live now":** `status='live'` is set by the partner by hand and won't auto-flip — a forgotten session shows a permanent red badge. Consider an auto-flip (`live`→`past` after `starts_at` + N hours) or a "still showing as Live" nudge in `/programming`.
- **Per-event local timezone** capture + display (times are UTC-only today).
- **Partner cover-image upload** (`cover_path` is null today → text-first cards; needs a Storage bucket + signed-URL plumbing).
- Owner Preview click-through + **merge**; then **S10** (email + approval ops).
