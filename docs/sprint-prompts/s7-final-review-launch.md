# Sprint S7 — Final review & launch 🚀

| | |
|---|---|
| **Date merged** | **2026-06-19** (merge `6b56d2d`); site 🚀 **LAUNCHED** — production deploy verified live at the public layer (copy/§4, og:locale, metadata routes, canonical, headers); auth flows = owner click-through |
| **Branch / PR** | `claude/sprint-s7-final-review-launch` / **PR #29** |
| **Goal** | Take the merged, feature-complete site to a verified, zero-known-bug production launch on the existing Vercel domain — exhaustive QA + content/SEO verification + launch polish, no feature work. |

## What shipped

Verification + bug-fix + polish only (no features, no DB migrations). Commits `a7a5f89 → a4f6e04 → ca58938 → 9104fb8 → 8a2f8c7 → 89a4398 → 11ad5c9`. Build green throughout (34→37 routes).

- **Prereq verify (Step 1):** confirmed prod migrations `0016`–`0019` applied + correct via the read-only MCP (gate policies, hardened RPCs, buckets); `.env.local` gitignored + untracked.
- **Exhaustive QA (Step 2):** multi-agent route × auth-state sweep → 16 candidates adversarially verified to **11 real defects**, logged in `docs/code-reviews/s7-qa-findings.md`.
- **Functional fixes (Step 3, 10 fixed):** `GATED_PREFIXES` now covers the whole `(workspace)` group + `/admin` (kills double public+workspace chrome on every gated route except `/dashboard`) · `/account` "Change password" → working `/forgot-password` flow · `/contact` fallback for pending `/support` · `/update-password` cookie-gated to stop a silent post-submit bounce · truthful workspace status badge (was a hardcoded stage) · `/apply` duplicate-email **login/enumeration oracle removed** (no auto-signin) · DB `youtube_url` http(s)-validated before any `<a href>` (latent stored-XSS) · authed users redirected off `/login`+`/apply` · legal `[contact email]` token dropped · `/build` "Blocked?" stale-toggle reset. An 11-agent adversarial pass confirmed all resolved, gate invariants hold, **zero regressions**.
- **Content (Step 4):** proof numbers (10·30·200+·267·3) + booklet filename mapping verified clean; `/elements` help line bolded per the canonical template.
- **SEO/perf (Step 5):** `openGraph.locale` `en`→`en_US`; enabled `images.formats` AVIF+WebP; sitemap/robots/JSON-LD/OG verified correct.
- **Launch polish (Step 6):** `icon.svg` favicon · `apple-icon.tsx` (180×180 PNG via `ImageResponse`) · `manifest.ts` (theme `#1A6B4A`) · `viewport.themeColor` · Home `metadata` · root `loading.tsx` · Organization `logo` JSON-LD — all sourced from the brand arch mark, no asset generation.
- **Repo cleanup (Step 7):** verified **no gated-content exposure** (the gitignored source trees were never committed — clean history); `docs/notes/cleanup-before-launch.md` rewritten. No removals needed.
- **Exit gate (Step 8):** full-diff adversarial review (security/gate · correctness · copy · build) — security/gate/build clean, 1 low `/apply` stranded-recovery item fixed (redirect now conditional on having an application row). Trackers updated (`PROJECT-STATUS.md` §1/§2/§4/§8, `ROADMAP.md` S7); production smoke-test written into `s7-qa-findings.md`. Independent **Codex review brief**: `docs/code-reviews/s7-final-review-launch.md`.

## Prompt used

<details><summary>Exact gated master prompt (plan: ~/.claude/plans/floating-purring-grove.md §E)</summary>

```text
You are my senior engineer for the Palestine House website, working in Claude Code.

Session start: read docs/PROJECT-STATUS.md §1–§5 (note it is stale re: S6 being unmerged — S6 IS merged on main via PR #25; trust git over the doc), then the S7 scope + exit gate in docs/ROADMAP.md §B. CLAUDE.md governs everything below. For the DB-verification and repo-cleanup sub-steps also read WORKFLOW.md §12–§14, docs/SUPABASE-MCP-SAFETY.md, and PROJECT-STATUS.md §4 (locked decisions) + §5 (D-S6-a/b/c).

Sprint: S7 — Final review & launch
Branch: claude/sprint-s7-final-review-launch (create from latest main)

Goal:
Take the merged, feature-complete site to a verified, ZERO-known-bug production launch on the EXISTING Vercel domain (palestine-house-website.vercel.app). The heart is an exhaustive, religious QA pass: test every existing feature in every auth state, log every defect, fix each, re-verify — then content-verify, SEO/perf-check, add small launch polish, do the pre-launch repo cleanup, and verify go-live. Verification + bug-fix + launch, NOT a build sprint: change behavior ONLY to fix a bug or add the agreed launch polish. Do NOT redesign or restructure any page (private pages content-heavy/under-designed is a deliberate POST-LAUNCH concern). Do NOT rewrite or paraphrase approved copy. Build gates stay SUPPRESSED (D-S6-b, D-S6-a accepts launching this way). Custom domain, rate-limit/Turnstile, live email, /live real data, /account self-delete are accepted-deferred — out of scope.

Execute in gated sub-steps (one owner gate after each):
1. (7a-0) Prerequisite verification — prod migrations 0016–0019 applied + verified via supabase-prod-readonly MCP ONLY (never write prod); .env.local clean of temp ingest vars; NEXT_PUBLIC_SITE_URL = Vercel prod URL; S6 on main. STOP.
2. (7a) Exhaustive QA discovery — route × auth-state matrix (anon/pending/approved/admin, 320px + desktop) over every public/auth/workspace/admin route + /elements ×30; catalog EVERY defect (severity + repro + file) in docs/code-reviews/s7-qa-findings.md. STOP for review before fixes.
3. (7a) Functional fix pass — fix EVERY functional/correctness/gating/console/broken-link/form/download defect, re-verify each against its repro; loop to zero. STOP.
4. (7b) Content verification — copy verbatim vs docs/page-copy/; proof numbers 10·30·200+·267·3; booklet filename mapping; fix drift. STOP.
5. (7c) SEO + structured data + performance — metadata coverage, sitemap/robots, JSON-LD, OG, image optimization, CWV spot-check; fix gaps. STOP.
6. (polish) favicon + app icons, web manifest, Home metadata, root loading.tsx. STOP.
7. (pre-launch) git ls-files the gated content; author notes/cleanup-before-launch.md; execute ONLY owner-confirmed removals. STOP for confirmation.
8. (7d + exit gate) production smoke-test checklist for the Vercel domain; live header check; /code-review full diff + fix; update PROJECT-STATUS + tick ROADMAP S7. STOP.

Per-step protocol: read locked inputs → smallest safe change → typecheck/lint/build + spot-check + approval-gate check → self-review + fix → commit AND push → report ≤6 lines → STOP for "proceed".
DB: production is READ-ONLY via supabase-prod-readonly MCP; if prod needs a migration, hand the SQL to the owner.
Push policy: commit + push after every gated sub-step (standing authorization, 2026-06-12); never merge, never push beyond the task branch.
```

</details>

Execution note: run under **ultracode** — each verification/review sub-step was a multi-agent workflow (read-only `Plan` agents: find → adversarial verify), and fixes were applied solo then adversarially re-verified.

## Checks & results

typecheck ✅ · lint ✅ · build ✅ (37 routes; gated `ƒ`, public `○`; CSP/headers untouched) · secret scan of full diff ✅ clean · `.env.local` untracked ✅ · adversarial fix-verify (11 agents) → all resolved, gate invariants hold, **zero regressions** ✅ · exit-gate full-diff review (security/gate/build clean) ✅ · independent **Codex review = approve, zero blocking** ✅ (one low build-tracker UI-state finding fixed) · local production smoke-test ✅ (caught + fixed a Home `og:locale` regression) · **production deploy verified live** at the public layer ✅ · authed-flow click-through ⬜ (owner — steps 3–7 in `s7-qa-findings.md`).

## Deviations & learnings

- **Café-card §4 catch (most important).** Step 4's content-verify agents flagged the Home café card as drift vs the on-disk `home.md` and I "fixed" it to the grandmother's-recipe line — but the **exit gate (reading PROJECT-STATUS §4) caught that this reverted a locked owner decision** (2026-06-12: the card is "A café where the recipes are here to stay."). The on-disk `home.md` is stale. **Restored the locked line.** Learning: **cross-check `PROJECT-STATUS.md` §4 locked decisions before "fixing" any copy that disagrees with an on-disk `docs/page-copy/` file** — the file can be out of sync with a later locked decision; when they conflict, §4 wins and the conflict gets surfaced, not silently picked.
- **Pre-launch cleanup was a no-op.** The §4 / D-S5-b "remove gated content before launch" concern resolved itself: `docs/page-copy/`, `docs/page-designs/`, `docs/source-assets/` are gitignored **and were never committed on any branch** (0 history adds), migrations are schema-only, the ingest script reads gitignored sources — so there is no public-repo exposure and nothing to remove. (`.gitignore` alone wouldn't prove this; the git-history check did.)
- **Smart-vs-straight-quote "nits" were the code being correct.** Several auth/apply strings render smart quotes where the `.md` uses straight quotes — the code is the right house style; the `.md` is the off one. Not "fixed."
- **S7-10 kept as locked copy.** The `/build` "Nothing checked off yet." empty state only surfaces on a checklist-load failure (the 200+ item catalog is never genuinely empty); rewording would break copy-verbatim, so it was documented, not changed.
- **S7-01 (double chrome) was the highest-impact find** — public header/footer wrapped every gated route except `/dashboard` (plus duplicate `<main>`/skip links + an Apply-CTA leak into the partner area). Fixed minimally by completing `GATED_PREFIXES`; the route-group split is a noted post-launch refactor.
- The multi-agent **find → adversarial-verify** pattern earned its keep: 16 candidates → 11 real (2 false-positives + 1 out-of-scope correctly dismissed), and the post-fix regression sweep found nothing.

## Follow-ups

- **Owner to launch:** open/review the PR → merge to `main` → Vercel auto-deploys → run the production smoke-test (`docs/code-reviews/s7-qa-findings.md`) → confirm green → mark **Launched** in `PROJECT-STATUS.md` (§1, §2 S7 row, §8). Optional pre-merge: the independent Codex review (`docs/code-reviews/s7-final-review-launch.md`).
- **Owner to reconcile:** the gitignored `docs/page-copy/01-public-pages/home.md` café line back to locked §4 ("…recipes are here to stay."); confirm temp `SUPABASE_INGEST_*` removed from `.env.local` and `NEXT_PUBLIC_SITE_URL` = the Vercel prod URL in Vercel Production.
- **Still open (deferred, non-blocking):** D-S6-b `/build` gate→item mapping + Gate 2 label (HQ content; gates stay suppressed) · rate-limit + Turnstile (S10) · live email for `/support` + newsletter (S9) · `/live` real data + YouTube CSP (S8) · `/account` self-delete (D-S6-c). Post-launch refactor: move the public chrome into a `(public)` route-group layout so the chrome decision is structural (noted in `site-chrome.tsx`).
