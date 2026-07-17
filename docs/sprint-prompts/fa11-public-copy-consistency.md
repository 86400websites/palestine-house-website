# FA11-COPY — Public copy consistency for Focus Area 11

> **Status: BUILD COMPLETE + REVIEWED — READY TO MERGE (2026-07-18).** Branch
> `claude/sprint-fa11-public-copy-consistency`, fresh worktree off the fully-
> merged `main` `aba8b1b`. The **D-FA11-a** follow-up: bring the public
> marketing site into line now that Focus Area 11 ("Café & Culinary
> Experience", K/k1–k3) is live for members (FA11, PR #65, prod-deployed
> 2026-07-18). **Independent Codex review = zero blocking; one Medium (incomplete
> governance-doc pass) — RESOLVED on-branch: 8 more current-authoritative doc
> statements + 2 tracked skill files updated to 11·33·297; gates re-run green.
> Verdict + resolution: `docs/code-reviews/fa11-public-copy-consistency.md`.**
> Owner: PR → Preview → merge → delete branch. No DB/deploy step.

## Goal

FA11 added the 11th focus area to the gated workspace + database but left the
public site advertising the old counts and an A–J (10-area) map, by owner
decision D-FA11-a (to avoid conflicting with the parallel copy-overhaul branch,
since merged as PR #64). This sprint updates every public surface for
consistency and resolves D-FA11-a.

## Owner-approved copy (AskUserQuestion, 2026-07-18)

- **Proof numbers 10 · 30 · 267 → 11 · 33 · 297** (200+ unchanged — still true
  at 818 checklist items; 120-day launch unchanged). Pre-authorized by D-FA11-a.
- **New Focus Area K entry** for the public `/focus-areas` map (approved
  "as shown"), in the page's terse house style:
  - **K — Café & Culinary Experience** · blurb: "Menu and Palestinian culinary
    identity, the coffee and tea program, and catering and culinary events."
  - "Menu & Palestinian Culinary Identity" — *Menu and culinary identity*
  - "Coffee, Tea & Beverage Program" — *The coffee and tea program*
  - "Catering, Private Events & Culinary Programming" — *Catering and culinary events*
  - (Titles = the verbatim FA11 names; blurb + sub-lines mirror the A–J phrasing.)
- **Scope** (approved "Public + authoritative docs"): the 3 public files + the
  K map entry + the authoritative governance-doc invariant lines. Internal
  gated-code comments left as-is; historical sprint/review logs left as-is.

## Changes (path-guard CLEAN — 3 public files + 1 CSS comment + 5 docs)

**Public (user-visible):**
- `src/app/focus-areas/page.tsx` — `FA_STATS` 10/30/267 → 11/33/297 · metadata
  description "ten…thirty…267" → "eleven…thirty-three…297" · the dark-index
  eyebrow "Ten focus areas · Thirty topics" → "Eleven…Thirty-three" · the
  "How to read this map" prose "(A–J)" → "(A–K)" · **new K entry appended to
  `FA_AREAS`** (rendering is fully data-driven, so the entry is all that's
  needed).
- `src/app/page.tsx` (Home) — `HOME_PROOF` 10/30/267 → 11/33/297 (+ the
  now-false "numbers never change" comment corrected).
- `src/app/our-support/page.tsx` — metadata "(10, 30, 267)" → "(11, 33, 297)" ·
  `SUP_PROOF` 10/30/267 → 11/33/297 · prose "ten focus areas and thirty
  practical topics" → "eleven…thirty-three" · "267 templates" → "297 templates".
- `src/styles/pages.css` — the "/* 267 templates line */" hook comment → 297
  (adjacent to the our-support edit; kept internally consistent).

**Authoritative governance docs (so future sessions don't flag a contradiction).**
First pass: `CLAUDE.md` proof line, `docs/PROJECT-STATUS.md` §4, `docs/README.md`
guardrail (line 98), `docs/ROADMAP.md` Stage-0 exit gate, `docs/DESIGN.md` §
guardrail. Codex-review round (the reviewer caught the pass was incomplete —
8 more current-authoritative statements + 2 tracked skill files):
`AGENTS.md`; `docs/README.md` summary (line 5); `docs/WORKFLOW.md` exit gate;
`docs/DESIGN.md` /our-support description; `docs/SECURITY-CHECKLIST.md`
(267→297 templates); `CLAUDE.md` route summary (`/elements/[slug]` ×30→×33);
`docs/TECH-ARCHITECTURE.md` (route ×30→×33 + `elements` 30→33); `docs/ROADMAP.md`
§A feature list (10→11 areas, A1–J3→A1–K3 ×33, 267→297 templates); and
`.claude/skills/sprint-prompt/SKILL.md` + `.claude/skills/close/SKILL.md` (the
proof-number checks these skills embed). All → 11 · 33 · 200+ · 297 · 120.
**Left by design:** historical `docs/code-reviews/*` + `docs/sprint-prompts/*`
records; the D-FA11-b-deferred ingest/package references (`supabase/sql/README`,
`docs/PROJECT-STATUS.md` §3 content-package line, `docs/README.md` source-assets
line, retired S13/S14 briefs).

**Deliberately NOT changed:** Model/Experience/Bring/Apply/About/Contact/footer/
OG image/JSON-LD/`site.ts` (carry no counts — verified) · the gated/admin
captions (already "eleven/thirty-three/297" from FA11) · 8 internal gated-code
comments still saying "30 topics"/"10 focus areas" (owner scope choice — not
user-visible) · historical sprint/review logs (point-in-time records).

## Verification

typecheck / lint / build green. Sweep confirmed no user-visible "10 focus /
30 topics / 267" strings remain in `src/`. Path-guard: diff touches only the 4
frontend files + 5 docs — zero chrome (`site-header`/`site-footer`), auth/gate,
`middleware`, `next.config`, `supabase/sql`, `package.json`/lockfile, `.env`.
Owner confirms the Vercel Preview (numbers on Home/`/focus-areas`/`/our-support`;
the 11th area on the map; desktop + 320px).

## Housekeeping done this session

The finished FA11 worktree (`claude+sprint-fa11-food-focus-area`) — which held a
`.env.local` temporarily pointed at **prod** for the prod ingest — was
git-deregistered and its directory (incl. that `.env.local`) deleted, so no prod
credentials remain on disk. `.env.local` is gitignored throughout, so there was
never any git/PR exposure.
