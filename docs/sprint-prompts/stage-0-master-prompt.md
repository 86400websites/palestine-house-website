# Stage 0 master prompt — gated sub-step execution

> Owner-approved working agreement (2026-06-12): complete ALL of Stage 0 (sprints 0.2 → 0.5)
> on the branch `claude/sprint-0-1-foundation`, in 13 gated sub-steps, **commit + push after
> every successful sub-step**, owner gates each step remotely with "proceed". **No merge until
> Stage 0 is complete** — one PR at the end (deliberate deviation from the per-sprint PR loop
> in WORKFLOW.md, owner decision; CI still runs on every push, Preview verified before the
> single merge). Sprint 0.1 (foundation + locked chrome) was built and committed first on the
> same branch.

```text
You are my senior engineer for the Palestine House website, working in Claude Code.

Session start: read docs/PROJECT-STATUS.md §1–§2, docs/ROADMAP.md Stage 0, and
docs/sprint-prompts/ records. CLAUDE.md governs everything below.

Mission: complete ALL of Stage 0 (sprints 0.2 → 0.5) on the existing branch
claude/sprint-0-1-foundation, in 13 gated sub-steps. NO merge until Stage 0 is
complete — one PR at the end. After EVERY successful sub-step: commit + push to
the branch (push authorized by owner, 2026-06-12). The owner drives remotely:
build a step, report briefly, then WAIT for "proceed" before starting the next.

Sub-steps (one owner gate after each):
 1.  (0.2a) `/` Home            — page-copy/01-public-pages/home.md + page-designs/public/Home.app.jsx
 2.  (0.2b) `/model`            — model.md + TheModel.app.jsx
 3.  (0.3a) `/experience`       — experience.md + Experience.app.jsx (live strip in designed empty state)
 4.  (0.3b) `/bring-ph`         — bring-a-house.md + BringAHouse.app.jsx (triptych + gates timeline; densest page)
 5.  (0.3c) `/our-support`      — our-support.md + OurSupport.app.jsx
 6.  (0.4a) `/live`             — live-programming.md + Live.app.jsx (listing + watch view, static empty states)
 7.  (0.4b) `/focus-areas` + `/about` — focus-areas.md/about.md + FocusAreas/About.app.jsx
 8.  (0.4c) `/contact`          — contact.md + Contact.app.jsx (form UI, clean no-op)
 9.  (0.5a) `/apply`            — apply-partner.md + Apply.app.jsx (single "Your name" field; honest no-op submit)
10.  (0.5b) auth shells         — login/forgot-password/update-password .md + auth/*.app.jsx (UI only, no Supabase)
11.  (0.5c) `/privacy` + `/terms` — privacy.md/terms.md + Privacy/Terms.app.jsx
12.  (0.5d) SEO                 — per-route metadata, sitemap.ts, robots.ts, OG image, JSON-LD (Organization, WebSite)
13.  Stage 0 exit gate          — full sweep: /code-review on the whole stage diff, copy-verbatim audit
     vs page-copy/, proof numbers (10 · 30 · 200+ · 267 · 3), every page at 320px→desktop vs its mockup,
     reduced-motion, console clean, headers/footer identical everywhere; fix everything; update
     PROJECT-STATUS.md + tick ROADMAP.md; final commit + push; owner opens the Stage 0 PR and merges.

Per-step protocol (every sub-step, no exceptions):
1. Read the exact copy file(s) and mockup .app.jsx (+ pages.css patterns it uses) BEFORE coding.
2. Build the page: copy verbatim (never paraphrase); port needed pages.css primitives into
   globals.css as they're first used; artwork via the Artwork component — copy the needed
   PH-* files from docs/page-designs/assets/art/ into /public/assets/art/; reuse the existing
   chrome, motion primitives (m.* only), and shadcn components; Server Components by default.
3. Verify: pnpm typecheck && lint && build; render the page on the production build and check
   content + copy strings; no console errors; 320px sanity via the rendered CSS.
4. Self-check the diff for bugs before committing (quick pass; full /code-review at step 13).
5. Commit ("Build <route> page from approved copy + mockup"), push.
6. Report in ≤6 lines: what shipped, checks, anything flagged. Then STOP and wait for "proceed".

Owner remote commands: "proceed" = next step · "pause" = hold · "status" = where are we ·
"fix <thing>" = fix before continuing · "skip to <n>" = jump (records the skip in PROJECT-STATUS).

Rules: smallest safe change per step; no new dependencies; no secrets; never redesign the
locked chrome; conflicts between copy/mockup → stop and ask, never pick silently; update
PROJECT-STATUS.md sprint board as each SPRINT (0.2, 0.3, 0.4, 0.5) completes, in-branch.
Do not merge anything.
```

## Step log

| # | Step | Status | Commit |
|---|---|---|---|
| 0 | (0.1) Foundation: tokens, fonts, motion, headers, locked chrome, 404 | ✅ 2026-06-12 | `706bb35` |
| 1 | (0.2a) `/` Home | ✅ 2026-06-12 (+ owner change: mobile hero art first) | `b999eeb` |
| 2 | (0.2b) `/model` | ✅ 2026-06-12 | see git log |
| 3 | (0.3a) `/experience` | ✅ 2026-06-12 (live strip = designed empty state until S7) | see git log |
| 4 | (0.3b) `/bring-ph` | ✅ 2026-06-12 | see git log |
| 5 | (0.3c) `/our-support` | ✅ 2026-06-12 — Sprint 0.3 complete | see git log |
| 6 | (0.4a) `/live` | ✅ 2026-06-12 — approved empty states; watch view + filters go live with real data in S7 | see git log |
| 7 | (0.4b) `/focus-areas` + `/about` | ✅ 2026-06-12 | see git log |
| 8 | (0.4c) `/contact` | ✅ 2026-06-12 — Sprint 0.4 complete; approved confirmation line ships with real send (S8) | see git log |
| 9 | (0.5a) `/apply` | ✅ 2026-06-12 — honest no-op confirm; approved confirmation ships with real signup (S3c) | see git log |
| 10 | (0.5b) auth shells | ✅ 2026-06-12 — approved errors client-side; confirmations ship with real auth (S3) | see git log |
| 11 | (0.5c) `/privacy` + `/terms` | ✅ 2026-06-12 — placeholder legal copy with visible counsel-review note (approved); [contact email] pending D4 | see git log |
| 12 | (0.5d) SEO | ✅ 2026-06-12 — Sprint 0.5 complete: metadata + canonicals, sitemap (12 routes), robots, OG image, JSON-LD; auth pages noindexed | see git log |
| 13 | Stage 0 exit gate | ✅ 2026-06-12 — build-side gate passed; owner Preview sign-off + merge pending | see git log |

## Stage 0 record (outcome)

**What shipped:** the complete public shell — locked chrome (header with tooltip nav + mega-menus + mobile Sheet, dark footer with lead form), 12 public pages, 3 auth UI shells, branded 404/error, design tokens + 5 page-pattern CSS layers ported from the mockups, motion primitives (lazy-loaded Framer features), security headers + tight CSP, 18 final artworks, SEO layer (canonicals, sitemap, robots, OG image, JSON-LD).

**Checks & results:** typecheck ✅ lint ✅ build ✅ on every step (19 production builds) · copy verified verbatim per page by grep against `page-copy/` (200+ strings) · proof numbers correct everywhere they appear · chrome identical on all 16 routes (incl. 404) · reduced-motion respected (global CSS + `useReducedMotion`) · canonicals verified per-route · security headers verified on responses · two multi-angle /code-review passes (foundation + exit gate), all confirmed findings fixed.

**Deviations & decisions (all owner-approved or rule-driven):**
- Header mega-menus per mockup (owner decision, recorded in PROJECT-STATUS §4 + notes/decisions.md).
- Home mobile: hero art stacks above headline (owner change).
- Honest no-op submits everywhere a backend is missing — approved confirmations ship with the real flows (Apply→S3c, contact→S8b, booklets→S8a, auth→S3). Contact mockup's success string differed from the copy file; copy file wins (ships in S8b).
- `/live` ships the three approved empty states; the mockups' session cards are fictional demo data and were not shipped.

**Follow-ups (tracked):**
- S1: compress the 2–3 MB artwork PNGs (owner sign-off — final art); consider extracting the repeated Apply-CTA block (~11 call-sites) into a shared component.
- S3: real auth flows + approved confirmations; S3c live Apply.
- S7: `/live` session data, watch view, live filter chips, live-now card (styles already ported); Experience live strip on the same feed.
- S8: Mailchimp booklet capture + newsletter; Resend contact sends + approved confirmation line.
- Before launch (S10): counsel-reviewed legal text; fill `[contact email]` (D4); navigation-copy.md "five short labels" heading vs four labels — cosmetic discrepancy in approved copy, flagged not fixed.
