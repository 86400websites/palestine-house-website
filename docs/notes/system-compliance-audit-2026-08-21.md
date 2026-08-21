# Website-Development-System compliance audit — 2026-08-21

> The verified findings of the pre-SYS1 audit of this repo against `docs/Website-Development-System/`
> (development core + testing-setup + error-tracking modules; the predevelopment track was excluded by
> the owner — this site predates it). **This file is the traceable basis for the SYS series: every
> SYS1/SYS2/SYS3 change maps to a finding below, and nothing beyond them is in scope.**

## Method

Seven dimension auditors ran in parallel, and every non-`present` claim was then re-checked by an
independent adversarial verifier with its own file reads (14 agents, ~370 tool calls). What follows is
the **verified** set — where the verifier corrected an auditor's citation or refuted a claim, the
corrected version appears and says so inline.

Ground facts at audit time: PP8 merged as **PR #88** on 2026-08-20 (`main` = `a276b3b`); production is
on migration `0034` with the real content (4 sections · 22 focus areas · 88 templates, owner-signed
live per D-PP-s); no sprint was active. The system folder sits **untracked** at
`docs/Website-Development-System/` (57 files) and is not gitignored.

## Decision log — D-SYS series

All ten recommendations were adopted by the owner on 2026-08-21 ("Proceed").

| ID | Decision | Recorded choice | Applied in |
|---|---|---|---|
| D-SYS-1 | Independent-review regime | **Mandatory for risky sprints** (auth / approval gate / RLS / schema / env / headers / CSP): immutable merge-base..head SHA range, saved record in `docs/code-reviews/`, no merge over a Blocking finding. Trivial PRs exempt. Codifies existing practice. | SYS1 (1g, 1h) |
| D-SYS-2 | Commit/Push authorization | **Keep the standing 2026-06-12 commit+push-per-substep authorization**; recorded as a deliberate deviation from the system's Commit:YES/Push:YES tokens. | SYS1 (record only) |
| D-SYS-3 | Prettier / format:check | **Waived for this already-built site** (avoids a whole-repo reformat commit); recorded deviation. Adopt on the next fresh build. | SYS1 (record only) |
| D-SYS-4 | CI workflow identity | **Keep `ci.yml` / "CI"**; the branch-protection required check is the CI `verify` job. Recorded deviation from `code-check.yml` / "Code Check". | SYS1 (record only) |
| D-SYS-5 | Fate of `docs/Website-Development-System/` | **Leave untracked through the SYS series; delete after SYS3 only once the owner confirms the external SOP master exists** (it was not locatable from this machine — re-zip out first if needed). Never staged meanwhile. | after SYS3 |
| D-SYS-6 | D-PP-a | **Re-scoped** to its surviving half: the OneDrive page-copy docs for the workspace pages are stale against the shipped platform (owner follow-up). The numbers/terminology half was discharged by D-PP-s. CLAUDE.md proof numbers → 4 · 22 · 88. | SYS1 (1b, 1c) |
| D-SYS-7 | D-FA11-b | **Closed as superseded** by D-PP-k / the 0030 cutover — its subject schema (33 topics · 297 templates · ingest guards) was deleted. | SYS1 (1b) |
| D-SYS-8 | New-string mechanism | **Keep the repo's inline mechanism** (new strings written directly under the brand-voice rules) — the copy canon lives on OneDrive, so the system's in-repo copy-file routing does not fit. Recorded deviation. | SYS1 (record only) |
| D-SYS-9 | Ex-S14 hardening (known issue #1) | **Its own sprint between SYS1 and SYS2**, so the launch-gate test suite is written against final-form behavior (Upstash rate limiting + Turnstile live, fail-closed). Needs owner accounts/keys. | ROADMAP Stage 5 (1i) |
| D-SYS-10 | CSP vs Sentry ingest | **Option A, decided now, applied in SYS3**: add the Sentry DSN's ingest origin to `connect-src` and update the `next.config.ts` comment + CLAUDE.md Hosting note + TECH-ARCHITECTURE in the same PR, superseding the YouTube-only phrasing. `worker-src` only if Session Replay is ever enabled. | SYS3 |

## How to read the findings

**Status** — `present` = repo satisfies the system item · `partial` = an equivalent exists but a piece
is missing · `missing` = no repo counterpart · `conflict` = repo and system disagree ·
`owner-action` = only the owner can do or verify it.
**Phase** — which sprint owns the fix: `A-alignment` = SYS1 · `B-testing` = SYS2 ·
`C-error-tracking` = SYS3 · `decision` = resolved in the decision log above · `none` = informational.

---

## 1. Copy-map / file-placement audit (Website-Development-System vs repo)

The auditor's picture is substantively correct and every non-present status survived re-verification: the project-shaped governing core (CLAUDE.md, AGENTS.md, and eight docs/ files plus 45 sprint-prompt and 15 code-review records) is installed, while the root README, nine top-level guides (six missing, three partially covered by WORKFLOW sections 9-11/13/14), the entire docs/templates/ folder, both self-contained modules (testing-setup, error-tracking) with their three skills, tests/, and morning-check.yml never landed. Four evidence errors needed correcting: the system folder holds 57 files not 59; neither close skill cites docs/QA-CHECKLIST.md (only LAUNCH-CHECKLIST.md does, lines 12 and 30); the currently installed skills reference docs/templates/ zero times (only the SOP versions do — the repo sprint-prompt skill inlines its own template, which SOP sprint-prompt.md lines 37/60 explicitly forbid); and the external SOP master that memory says exists could not be located anywhere under the 86400 tree, so the recommended delete-after-install disposition needs a verify-first caveat. One mapped file the auditor missed entirely: docs/POST-LAUNCH-BACKLOG.md (00-SYSTEM-MAP.md line 75, template says "copy once per project"), whose function ROADMAP.md section A currently serves.

### [missing → SYS1] README-TEMPLATE.md → root README.md

Verified. Copy map row (development/00-START-HERE.md line 20) maps README-TEMPLATE.md → README.md; the template's own usage note says 'copy this file to the repo root as README.md and fill every [PLACEHOLDER]'. Repo root has only AGENTS.md and CLAUDE.md. docs/README.md exists but is the 'Palestine House — Website Build System' docs-pack operating manual (a filled ancestor of the SOP start file), not a root project README.

*Evidence:* ls *.md at repo root → AGENTS.md, CLAUDE.md only; docs/Website-Development-System/development/00-START-HERE.md line 20; development/README-TEMPLATE.md lines 1-9 (usage note + stack/domain skeleton); docs/README.md line 1: '# Palestine House — Website Build System'

**Fix:** Fill development/README-TEMPLATE.md with the PH facts (stack, domain, run commands, doc links — all already recorded in TECH-ARCHITECTURE.md/CLAUDE.md, no invention needed) and commit as root README.md.

### [missing → SYS1] BROWSER-TOOLS.md → docs/

Verified missing from docs/, and the auditor's caveat 'verify the global installs actually exist' is already answered: they demonstrably do — the repo's own .gitignore carries a PP8 block ignoring .playwright-mcp/ snapshots ('the Playwright MCP writes snapshots... into the working directory'), and this machine has the agent-browser skill installed. Also stronger than the auditor stated: the SOP close.md skill (line 74) depends on docs/BROWSER-TOOLS.md by path, so any future skill refresh dangles without it.

*Evidence:* docs/ listing has no BROWSER-TOOLS.md; system file at development/BROWSER-TOOLS.md (head: 'Playwright MCP & Agent Browser (the verification layer)'); .gitignore PP8 comment block for .playwright-mcp/ and *-1440.png; development/templates/close.md line 74 cites docs/BROWSER-TOOLS.md

**Fix:** Copy BROWSER-TOOLS.md to docs/BROWSER-TOOLS.md — no machine verification needed, the PP8 gitignore block proves the Playwright MCP is already in use in this repo.

### [missing → SYS1] CODEX-REVIEW-PROMPT.md → docs/ (prompt guide 1 of 2)

Verified. Head reads '# Codex Review Guide'; it names templates/CODEX-REVIEW-PROMPT-TEMPLATE.md as its skeleton. Copy map row (00-START-HERE.md line 23: 'including both prompt guides' → docs/). Not in docs/ under any name; docs/code-reviews/ has exactly 15 filled records, so the practice runs without its governing guide.

*Evidence:* development/CODEX-REVIEW-PROMPT.md lines 1-4; 00-START-HERE.md line 23; ls docs/code-reviews | wc -l → 15

**Fix:** Copy CODEX-REVIEW-PROMPT.md to docs/ and fill placeholders; land in the same commit as docs/templates/CODEX-REVIEW-PROMPT-TEMPLATE.md so the guide's skeleton reference resolves.

### [partial → SYS1] ENV-VARS-SAFETY.md → docs/

Verified. development/ENV-VARS-SAFETY.md ('Environment Variables, In Plain English', [PROJECT_NAME] placeholders) has no docs/ counterpart. Operative rules do exist: docs/WORKFLOW.md §14 'Supabase & environment-variable safety' and CLAUDE.md 'Protect env vars and Supabase secrets'. The standalone owner-readable doc the map requires is the only missing piece.

*Evidence:* grep '^## ' docs/WORKFLOW.md → line 248 '## 14. Supabase & environment-variable safety'; docs/ listing lacks ENV-VARS-SAFETY.md; development/ENV-VARS-SAFETY.md head confirmed

**Fix:** Copy ENV-VARS-SAFETY.md to docs/, fill [PROJECT_NAME], and cross-link WORKFLOW §14 rather than duplicating rules that could drift.

### [missing → SYS1] HANDOFF.md → docs/

Verified. development/HANDOFF.md is the accounts-and-access inventory ('Fill this table first. Every row must end up owned by the client'). Nothing in docs/ or docs/notes/ covers handoff (notes/ holds only cleanup-before-launch.md and decisions.md).

*Evidence:* development/HANDOFF.md lines 1-12 (accounts table with GitHub row); docs/ and docs/notes/ listings

**Fix:** Copy HANDOFF.md to docs/ and fill the accounts table with the actual services (GitHub, Vercel, Supabase test + prod, Resend, Mailchimp, Upstash, Turnstile, domain — the integrations CLAUDE.md names; names only, never values).

### [missing → SYS1] LAUNCH-CHECKLIST.md → docs/

Verified, including the exact line citation. testing-setup/00-START-HERE.md line 19 reads 'launch through docs/LAUNCH-CHECKLIST.md as usual'. docs/PRODUCTION-CUTOVER-RUNBOOK.md line 1 is '# Production cutover runbook — PP7' — the migration-0030→0034 content cutover, not a general launch gate. The SOP LAUNCH-CHECKLIST is the three-phase gate whose Phase 1 embeds the Launch Gate ('docs/testing-setup/ ... GO verdict recorded in the latest docs/test-reports/'), so it is also the exit doc for the B-testing phase.

*Evidence:* sed -n 19p testing-setup/00-START-HERE.md; head docs/PRODUCTION-CUTOVER-RUNBOOK.md; development/LAUNCH-CHECKLIST.md lines 1-14 (three phases, Launch Gate row line 13)

**Fix:** Copy LAUNCH-CHECKLIST.md to docs/, filled; mark already-satisfied items Done with dates (site launched 2026-06-19 per ROADMAP S7), keeping it as the Launch-Gate exit reference.

### [partial → SYS1] QA-CHECKLIST.md → docs/

Status verified but the auditor's evidence is half wrong: neither the SOP close.md nor the repo close SKILL.md cites docs/QA-CHECKLIST.md by name (grep → zero matches in both) — only LAUNCH-CHECKLIST.md does, at lines 12 ('docs/QA-CHECKLIST.md passed in full') and 30 (performance budget). The gap itself is real: the two-part gate doc (Part 1 local / Part 2 deployed Preview, recorded per-PR with head SHA) is absent, with equivalent checks spread across WORKFLOW §9 'Local test checklist', §10 'PR checklist', §11 'Vercel Preview checklist'.

*Evidence:* grep -n QA-CHECKLIST development/templates/close.md → no matches; grep -n QA-CHECKLIST .claude/skills/close/SKILL.md → no matches; grep -n QA-CHECKLIST development/LAUNCH-CHECKLIST.md → lines 12, 30; docs/WORKFLOW.md lines 181/194/207 (§9/§10/§11); development/QA-CHECKLIST.md head confirms the two-part structure

**Fix:** Copy QA-CHECKLIST.md to docs/ filled for PH, or (smaller) add a docs/QA-CHECKLIST.md that points to WORKFLOW §9-§11 so LAUNCH-CHECKLIST's two cross-references resolve — close.md needs no change either way.

### [partial → SYS1] ROLLBACK.md → docs/

Verified. development/ROLLBACK.md opens with the decision-tree table ('Revert the PR on main — the default fix' / '[HOST_ROLLBACK_ACTION] (Vercel example: promote previous deployment)'). docs/ROLLBACK-RUNBOOK.md line 1 is '# Rollback runbook — undoing migration 0030' — exclusively the 0030 undo. The general tree exists only inside WORKFLOW §13 'Rollback process' (line 234), not at the mapped docs/ROLLBACK.md location.

*Evidence:* head docs/ROLLBACK-RUNBOOK.md; development/ROLLBACK.md lines 1-14; docs/WORKFLOW.md line 234

**Fix:** Copy ROLLBACK.md to docs/ filled with the Vercel promote-previous action, linking ROLLBACK-RUNBOOK.md as the DB-specific appendix and WORKFLOW §13 as the process home.

### [partial → SYS1] SPRINT-PROMPT-TEMPLATE.md → docs/ (prompt guide 2 of 2)

Status verified but the final clause is wrong: the auditor said 'the skill's canonical template reference has no target in-repo' — the INSTALLED sprint-prompt skill makes no such reference; it carries its own inline 'Implementation prompt template' (SKILL.md line 35) and 'Codex review prompt template' (line 93) and mentions docs/templates/ zero times. It is the SOP-version skill that mandates filling docs/templates/CLAUDE-SPRINT-PROMPT-TEMPLATE.md. The guide itself ('# Sprint Prompt Guide', pointing at templates/CLAUDE-SPRINT-PROMPT-TEMPLATE.md) is genuinely absent from docs/; the practice is covered by the installed skill plus 45 records in docs/sprint-prompts/.

*Evidence:* grep -n 'docs/templates' .claude/skills/sprint-prompt/SKILL.md → no matches; .claude/skills/sprint-prompt/SKILL.md lines 35, 93 (inline templates); development/SPRINT-PROMPT-TEMPLATE.md lines 1-4; ls docs/sprint-prompts | wc -l → 45

**Fix:** Copy SPRINT-PROMPT-TEMPLATE.md to docs/ alongside docs/templates/CLAUDE-SPRINT-PROMPT-TEMPLATE.md in the same commit; note it will describe a fill-the-skeleton flow the installed skill does not yet follow (see the skills finding).

### [missing → SYS1] TECHNICAL-INTEGRITY.md → docs/

Verified. development/TECHNICAL-INTEGRITY.md is the one-page 'four walls' table. Not in docs/ under any name. The repo's actual CI is a single job 'verify' (Install · Typecheck · Lint · Build) plus a 'Secret scan (gitleaks)' step in .github/workflows/ci.yml — the concrete facts to fill the wall-2 references with.

*Evidence:* development/TECHNICAL-INTEGRITY.md lines 1-10 ('The four walls' table); .github/workflows/ci.yml lines 21-22 (job 'verify', name 'Install · Typecheck · Lint · Build') and line 34 ('Secret scan (gitleaks)')

**Fix:** Copy TECHNICAL-INTEGRITY.md to docs/ and fill wall references with the actual ci.yml job ('verify': install/typecheck/lint/build + gitleaks).

### [missing → SYS1] Entire templates/ folder (except the 3 skills) → docs/templates/

Verified: docs/templates/ does not exist and all 10 non-skill skeletons are absent (BUG-FIX-PROMPT, CLAUDE-SPRINT-PROMPT, CODEX-REVIEW-PROMPT, NEW-WEBSITE-SETUP-CHECKLIST, POST-LAUNCH-BACKLOG, PR-DESCRIPTION, SPRINT-PLAN, SUPABASE-CHANGE, UI-SPRINT-PROMPT, VERCEL-PREVIEW-TEST — 13 files in development/templates/ minus the 3 skills). But the auditor's consequence claim is wrong: the currently INSTALLED skills reference docs/templates/ zero times (they are self-contained, with inline templates), so nothing installed is dangling today. It is the SOP-version skills that fill these skeletons (SOP close.md: 1 reference; SOP sprint-prompt.md: 5, including 'never inline a competing template'). Ordering consequence: docs/templates/ must land before or with any skill refresh to the SOP versions.

*Evidence:* ls docs/templates → No such file or directory; find development/templates → 13 files; grep -c 'docs/templates' → repo skills 0+0, SOP close.md 1, SOP sprint-prompt.md 5; 00-START-HERE.md line 24 (map row)

**Fix:** Copy the 10 skeleton files to docs/templates/ verbatim (fill-per-use skeletons; placeholders stay), sequenced before or with the skill refresh decision.

### [partial → SYS1] templates/sprint-prompt.md + close.md + browser-qa.md → .claude/skills/*/SKILL.md

Verified in full, byte counts and description deltas exact: repo close/SKILL.md 6,360 B vs SOP close.md 12,862 B (SOP adds 'the sprint + review records are saved' vs repo's 'the sprint record is saved'; SOP also adds /browser-qa self-capture citing docs/BROWSER-TOOLS.md and docs/templates/VERCEL-PREVIEW-TEST-TEMPLATE.md at line 74); repo sprint-prompt/SKILL.md 9,931 B vs SOP 9,199 B (SOP description: 'filling the repo's canonical sprint template'). Sharper than the auditor stated: the repo sprint-prompt skill IS the inline-template fork the SOP version explicitly forbids — SOP sprint-prompt.md line 37 'never inline a divergent one' and line 60 'Never inline a competing sprint-prompt template'. browser-qa (4,977 B) is entirely uninstalled: .claude/skills/ holds only close and sprint-prompt.

*Evidence:* wc -c on all five files → 6360/9931 repo, 12862/9199/4977 SOP; frontmatter diffs read directly; SOP sprint-prompt.md lines 17, 37, 60; SOP close.md line 74; ls .claude/skills/ → close, sprint-prompt

**Fix:** Install templates/browser-qa.md as .claude/skills/browser-qa/SKILL.md (fill [PROJECT_NAME]) — safe now since it depends only on the already-working global tools plus docs/BROWSER-TOOLS.md. For close/sprint-prompt the owner decides: refresh to SOP versions (requires docs/templates/ + docs/BROWSER-TOOLS.md landed first, per their internal references) or keep the battle-tested PH versions; flag the review-records and inline-template deltas either way.

### [missing → SYS2] testing-setup/ module (entire folder except skill) → docs/testing-setup/

Verified: docs/testing-setup/ does not exist; the module source has exactly 7 files (00-START-HERE, SETUP-CHECKLIST, TESTING-GUIDE, activate-testing, 3 templates). The retrofit path is real: its 00-START-HERE says 'Drop it into a brand-new build (the SOP path) or into any existing website repo (the retrofit path)'.

*Evidence:* ls docs/testing-setup → No such file or directory; find development/testing-setup → 7 files; testing-setup/00-START-HERE.md line 5 (retrofit sentence)

**Fix:** Copy the folder (minus activate-testing.md) to docs/testing-setup/ per its own copy map, then run SETUP-CHECKLIST.md.

### [missing → SYS2] testing-setup/activate-testing.md → .claude/skills/activate-testing/SKILL.md

Verified: no .claude/skills/activate-testing/ directory; the skill that runs Launch-Gate steps 2-5 is uninstalled.

*Evidence:* ls .claude/skills/ → close, sprint-prompt only; development/testing-setup/activate-testing.md exists

**Fix:** Copy testing-setup/activate-testing.md to .claude/skills/activate-testing/SKILL.md (renamed).

### [missing → SYS2] Generated feature list → docs/FEATURE-LIST.md

Verified: no docs/FEATURE-LIST.md; 00-SYSTEM-MAP.md line 57 maps 'The feature list' → docs/FEATURE-LIST.md. Generated output of /activate-testing step 2 — absent because the module was never run.

*Evidence:* docs/ listing lacks FEATURE-LIST.md; 00-SYSTEM-MAP.md line 57

**Fix:** Produced by running /activate-testing after module install; not hand-authored.

### [missing → SYS2] Generated test reports → docs/test-reports/

Verified: no docs/test-reports/ directory; 00-SYSTEM-MAP.md line 58 maps the launch-gate GO to 'latest report in docs/test-reports/'.

*Evidence:* ls docs/test-reports → No such file or directory; 00-SYSTEM-MAP.md line 58

**Fix:** Produced by the first full test run; folder is created with its first report.

### [missing → SYS2] Generated tests → tests/e2e/

Verified: no tests/ directory at root; package.json defines no test script; @playwright/test is not installed — the lockfile's only two 'playwright' matches (lines 2835, 2843) are peer-dependency metadata of another package, not an installed dependency. Target path confirmed in the module: activate-testing.md line 39 ('One spec per feature line ... in tests/e2e/') and SETUP-CHECKLIST.md line 18 (Playwright config, tests/e2e/, PLAYWRIGHT_BASE_URL). Zero automated e2e coverage on a live production site with an approval gate — the largest functional gap in this dimension.

*Evidence:* ls tests → No such file or directory; grep '"test' package.json → no matches; grep -n -i playwright pnpm-lock.yaml → lines 2835/2843 (peer-dep entries only); activate-testing.md line 39; SETUP-CHECKLIST.md line 18

**Fix:** Generated by /activate-testing step 3 (one Playwright test per approved feature-list line, including negative access-gate tests); Playwright arrives as a dev dependency via the module's SETUP-CHECKLIST — the one new dependency is the module's own requirement.

### [missing → SYS2] Morning check workflow → .github/workflows/morning-check.yml

Verified: .github/workflows/ contains only ci.yml. Target path confirmed at MORNING-CHECK-TEMPLATE.md line 12 ('## The workflow file → .github/workflows/morning-check.yml').

*Evidence:* ls .github/workflows/ → ci.yml only; development/testing-setup/templates/MORNING-CHECK-TEMPLATE.md line 12

**Fix:** Installed at Launch-Gate completion from templates/MORNING-CHECK-TEMPLATE.md, after the owner approves the morning-check test list.

### [missing → SYS3] error-tracking/ module (entire folder except skill) → docs/error-tracking/

Verified: docs/error-tracking/ does not exist; module source has 6 files. Sentry: zero matches in package.json and pnpm-lock.yaml — Door A (Sentry alert email, ERROR-TRACKING-GUIDE.md line 15) does not exist for a live site. Note for the fix's repo-rule fit: CLAUDE.md already lists Sentry as an in-scope optional integration that no-ops when env vars are absent, and already names SENTRY_AUTH_TOKEN as a server-only secret — so installing the SDK conforms to existing repo rules, no new invention.

*Evidence:* ls docs/error-tracking → No such file or directory; grep -c -i sentry package.json pnpm-lock.yaml → 0, 0; ERROR-TRACKING-GUIDE.md lines 15/17 (Door A / Door B); error-tracking/SETUP-CHECKLIST.md → 9 sentry mentions; CLAUDE.md 'PostHog/Sentry optional' + SENTRY_AUTH_TOKEN in server-only secrets list

**Fix:** Copy the folder (minus handle-error.md) to docs/error-tracking/, then run its SETUP-CHECKLIST.md (Sentry account + SDK + deliberate test error); env var names only, owner adds values in Vercel.

### [missing → SYS3] error-tracking/handle-error.md → .claude/skills/handle-error/SKILL.md

Verified: no .claude/skills/handle-error/ directory; map row confirmed at error-tracking/00-START-HERE.md line 26.

*Evidence:* ls .claude/skills/ → close, sprint-prompt only; error-tracking/00-START-HERE.md line 26

**Fix:** Copy error-tracking/handle-error.md to .claude/skills/handle-error/SKILL.md (renamed).

### [missing → info] Incident register → docs/INCIDENT-LOG.md

Verified compliantly absent: error-tracking/00-START-HERE.md line 27 maps it as 'Incident register (created at first incident)' — nothing is owed until an incident occurs after the module lands. Phase corrected from C-error-tracking to none: no action belongs to any sprint phase; the enabling template is already counted in the error-tracking module finding.

*Evidence:* docs/ listing lacks INCIDENT-LOG.md; error-tracking/00-START-HERE.md line 27

**Fix:** No action; created from INCIDENT-LOG-TEMPLATE.md at the first real incident after module install.

### [partial → SYS1] Overlooked mapped file: docs/POST-LAUNCH-BACKLOG.md (backlog of record)

Gap the auditor missed. 00-SYSTEM-MAP.md line 75 answers 'Where do new ideas go mid-project?' with 'docs/POST-LAUNCH-BACKLOG.md — never the open sprint', and POST-LAUNCH-BACKLOG-TEMPLATE.md instructs 'Copy once per project and keep it living — this file is the project's single backlog of record'. No docs/POST-LAUNCH-BACKLOG.md exists (no file matching 'backlog' in docs/). The function is currently served by docs/ROADMAP.md §A 'Post-MVP backlog (do not build during MVP)' (line 48, with retired S13/S14 items folded in at line 99) — so the practice exists at a different address than the map requires.

*Evidence:* 00-SYSTEM-MAP.md line 75; development/templates/POST-LAUNCH-BACKLOG-TEMPLATE.md lines 1-3; ls docs | grep -i backlog → no matches; docs/ROADMAP.md lines 48-49, 99

**Fix:** Either create docs/POST-LAUNCH-BACKLOG.md from the template seeded with ROADMAP §A's current rows (cross-linking, not duplicating ownership — ROADMAP still owns scope/order per the SOP's own rule), or record an owner decision that ROADMAP §A is this repo's backlog of record; do not leave two backlog homes undeclared.

### [owner-action → decision] Disposition of docs/Website-Development-System/ (untracked SOP source)

Verified with two corrections. (1) Count: the folder holds 57 files, not 59 (find and git status -uall both → 57): 00-SYSTEM-MAP.md + 46 under development/ + 9 under predevelopment/. It is untracked ('?? docs/Website-Development-System/') and NOT gitignored (git check-ignore exit 1), so the memory rule 'never git add -A here' is the only thing between it and a silent 57-file commit. (2) The recommendation 'delete after install — SOP master is external' rests on a memory claim I could not confirm on disk: no SOP folder or zip was found searching the 86400 root, '9. Websites', '2. Palestine House', or '5. Website Templates' — the external master may live elsewhere (or have moved), so its existence must be verified before deleting. Additional argument against option (c) commit: predevelopment/ (9 files) and 00-SYSTEM-MAP.md are SOP-level artifacts mapped to no repo location by any copy map — committing the folder wholesale would import files the system itself never places in a project repo, plus duplicate CLAUDE.md/close.md shadows.

*Evidence:* git status --porcelain docs/Website-Development-System → '?? docs/Website-Development-System/'; git check-ignore → exit 1 (not ignored); git status --porcelain -uall | wc -l → 57; find 86400 tree (maxdepth 3) for *website*development*/*SOP* → only an unrelated .md in '2. Go To Market Agency'; MEMORY.md 'lives at sibling folder + zip OUTSIDE the […]

**Fix:** Owner decision required. Recommended: first CONFIRM the external SOP master (sibling folder + zip) still exists — it was not locatable from this machine's visible tree — then (a) delete the in-repo copy once Phase A/B/C installs are committed; if the external master cannot be found, re-zip this folder to the external location first. Record the choice in PROJECT-STATUS.md.

---

## 2. Governing-docs conformance (repo CLAUDE.md / AGENTS.md / docs/WORKFLOW.md vs docs/Website-Development-System/development/{CLAUDE,AGENTS,WORKFLOW}.md)

All thirteen of the auditor's claims check out against the actual files, with line citations verified; the core diagnosis stands — the system makes independent review a mandatory, SHA-pinned merge gate with saved records, Blocking/Should-fix verdicts, approval invalidation, and Commit:YES/Push:YES tokens, none of which the repo's governing docs carry, where review is explicitly optional and committing (and, per a recorded 2026-06-12 standing authorization in .claude/skills/sprint-prompt/SKILL.md, pushing per sub-step) is the default. Two claims needed correction: the destructive-migration protocol is 'partial' not 'missing' (docs/PRODUCTION-CUTOVER-RUNBOOK.md, docs/ROLLBACK-RUNBOOK.md §4 and docs/content-migration-map.md contain real cold-backup, rehearsed-restore, and down-SQL-limitation statements — the gap is only that docs/WORKFLOW.md §14 never codifies them), and only one of ROADMAP's two BUILT strings is stale (PP8 line 152; PP1.1 line 143 sits inside a merged ✅ row, PR #75). One overlooked gap added: repo CLAUDE.md and AGENTS.md still assert pre-PP6/PP7 database state in the present tense (0029 'still owed', retired tables 'still in the database', a reviewer check for the dropped programming_sessions table) even though production is on 0034 — a currency defect the system's own verify-on-disk-truth rule forbids.

### [conflict → decision] Independent review: optional in repo, mandatory merge gate in system

VERIFIED. System WORKFLOW.md line 5 puts 'Codex review' in the fixed delivery chain; line 79 states 'The independent verdict is a gate, not a suggestion... a Blocking finding is never merged'; line 115 requires 'Current-head independent verdict is Approve' in the definition of done. The repo says optional four ways: docs/WORKFLOW.md:57 ('(optional) review done'), :170 (§8 titled 'Optional Codex / agent review workflow'), :172 ('optional but valuable on risky changes'), :224 ('review (if any)'), :333 ('(Optional) Review agent pass complete'); repo CLAUDE.md Git rules require only 'CI + Vercel Preview pass' for merge. The repo's own sprint-prompt skill entrenches the optional stance: .claude/skills/sprint-prompt/SKILL.md:31 — 'Optional Codex review prompt — only for risky sprints... Otherwise say review is optional and skip it.' Practice leans mandatory-for-risky (15 records in docs/code-reviews/), but no doc requires it.

*Evidence:* docs/Website-Development-System/development/WORKFLOW.md:5,79,115; docs/WORKFLOW.md:57,170,172,224,333; CLAUDE.md 'Git rules'; .claude/skills/sprint-prompt/SKILL.md:31; Glob docs/code-reviews/** = 15 files

**Fix:** Owner chooses canon: either upgrade repo docs/WORKFLOW.md §8 + §17 (and sprint-prompt SKILL.md line 31) to make independent review mandatory at least for auth/gate/RLS/schema/env/header-touching PRs and add 'no Blocking finding remains' to §17, or record in the system's usage notes that this project deliberately runs review as risky-sprints-only.

### [missing → SYS1] Immutable review range (merge-base..head SHA), approval invalidation, Preview-refresh-after-change

VERIFIED. System AGENTS.md:17-23 pins review to [MERGE_BASE_SHA]..[HEAD_SHA] ('A branch name is context, not an exact range'), :70 requires Preview/CI evidence to correspond to the reviewed head, :99-102 invalidates approval on any substantive post-review change; system WORKFLOW.md:67 computes the immutable range, :73 requires re-review at a new head after any substantive change, :81 confirms reviewed head == PR head before merge. The repo has none of it: repo AGENTS.md:41 reviews 'the PR / branch diff' by name, its only 'IMMUTABLE' is migrations 0027/0028 (line 13); repo docs/WORKFLOW.md's only SHA mentions are 'git revert <commit-sha>' (lines 240, 316) and its only 'refresh' is the threat model (line 262).

*Evidence:* development/AGENTS.md:17-23,70,99-102; development/WORKFLOW.md:67,73,81; repo AGENTS.md:13,41; docs/WORKFLOW.md:240,262,316 (no other SHA/invalidation/retest language)

**Fix:** Add to repo docs/WORKFLOW.md §8 and AGENTS.md review rules: reviews target a recorded merge-base..head SHA range; Preview/CI evidence must match the reviewed head; any substantive post-review change invalidates approval (re-run checks, retest Preview, re-review at the new head); confirm reviewed head == PR head before merge.

### [partial → SYS1] Review record: saved file at docs/code-reviews/, verdict format, no bare approvals

VERIFIED. System AGENTS.md:97 names the save path docs/code-reviews/[SPRINT_ID]-[SLUG]-review.md, :89-94 requires exactly one verdict (APPROVE / REQUEST CHANGES) restating both SHAs, :84-85 forbids bare approvals ('say No findings and list what was inspected'). The repo practices the path (15 files in docs/code-reviews/, incl. pp8-security-verification.md) but no governing doc mandates it: 'code-reviews' appears in neither repo AGENTS.md nor docs/WORKFLOW.md, and repo AGENTS.md:129 asks only for 'a clear merge recommendation (approve / request changes / blocking issues)' with no record-file, SHA-restating, or no-bare-approval rule.

*Evidence:* development/AGENTS.md:84-97; Glob docs/code-reviews/** = 15 files; Grep 'code-reviews' in AGENTS.md and docs/WORKFLOW.md = 0 matches; AGENTS.md:129

**Fix:** Add two lines to repo AGENTS.md 'How to report findings': review records are saved at docs/code-reviews/<sprint>-<slug>-review.md (codifies existing practice), and a no-findings review must list what was inspected — never a bare approval.

### [partial → SYS1] Blocking/Should-fix severities and logged owner decision for deferred Should-fix items

VERIFIED. System AGENTS.md:42-45 restricts severities to Blocking and Should-fix; system WORKFLOW.md:79 allows deferring a Should-fix 'only with a logged owner + reason (PROJECT-STATUS §8)'. Repo AGENTS.md:127 uses Critical/High/Medium/Low; :129's only blocking notion is 'any §"gating checks" failure is blocking'. No deferral-logging rule exists anywhere in repo AGENTS.md or docs/WORKFLOW.md ('Should-fix' and 'defer' have zero matches in both).

*Evidence:* development/AGENTS.md:42-45; development/WORKFLOW.md:79; repo AGENTS.md:127,129; Grep 'Should-fix|defer' in AGENTS.md + docs/WORKFLOW.md = 0 matches

**Fix:** Add one rule to repo AGENTS.md (or docs/WORKFLOW.md §12): any non-blocking finding the owner chooses not to fix before merge gets a dated deferral note (owner + reason) in PROJECT-STATUS.md. Keep the four-level scale with the mapping 'Critical/High = blocking' — vocabulary difference, not a coverage gap, once deferral logging exists.

### [conflict → decision] Commit: YES / Push: YES explicit authorization gating

VERIFIED, with one addition the auditor missed. System CLAUDE.md:101-102 makes commit and push each require an explicit 'Commit: YES' / 'Push: YES' in the filled task prompt (omitted = NO); system WORKFLOW.md:43 adds 'do not commit or push unless the owner explicitly authorized that action'. Repo CLAUDE.md gates push only ('Do not push at all unless the owner explicitly asks') while its default chain includes 'clear commit'. The token strings appear nowhere in the repo outside the system folder itself (repo-wide grep hits only development/CLAUDE.md and development/SPRINT-PROMPT-TEMPLATE.md). Crucially, the repo runs the OPPOSITE convention on purpose: .claude/skills/sprint-prompt/SKILL.md:61 ('Commit AND push to the task branch — every sub-step') and :90 ('commit + push after every gated sub-step (standing authorization, 2026-06-12)') — a recorded owner authorization, matching his push-per-step working style.

*Evidence:* development/CLAUDE.md:101-102; development/WORKFLOW.md:43; repo CLAUDE.md 'Git rules'; Grep 'Commit: YES|Push: YES' repo-wide = only the 2 system files; .claude/skills/sprint-prompt/SKILL.md:61,90

**Fix:** This is an owner decision, not a mechanical alignment: either adopt the YES-token convention in repo CLAUDE.md Git rules (revoking or scoping the standing authorization), or record in the system's usage notes that this project deliberately substitutes the documented 2026-06-12 standing commit+push-per-substep authorization for per-task tokens. Do not silently add the tokens — they would contradict the skill the sprints actually run on.

### [missing → SYS1] Preview test evidence recording (provider, URL, branch, tested head SHA)

VERIFIED. System WORKFLOW.md:57 requires recording provider, Preview URL, branch, and tested head SHA in docs/templates/VERCEL-PREVIEW-TEST-TEMPLATE.md or equivalent (the template exists in the system at development/templates/VERCEL-PREVIEW-TEST-TEMPLATE.md); :63 forbids marking Preview tested without opening the deployed build. Repo docs/WORKFLOW.md §11 (lines 207-218) is a good checklist but has no recording step; repo docs/templates/ does not exist (Glob = no matches). The close skill only asks the owner to CONFIRM Preview was tested (.claude/skills/close/SKILL.md:59-60) — it records no URL or SHA either.

*Evidence:* development/WORKFLOW.md:57,63; docs/WORKFLOW.md:207-218; Glob docs/templates/** = no matches; Glob shows the template only at docs/Website-Development-System/development/templates/VERCEL-PREVIEW-TEST-TEMPLATE.md; .claude/skills/close/SKILL.md:59-60

**Fix:** Add one checklist line to repo docs/WORKFLOW.md §11: 'Record the Preview URL and the tested commit SHA (in the PR description or the sprint record) before review/merge.' A dedicated template file is unnecessary for this repo's PR-description practice.

### [partial → SYS1] Destructive-migration protocol: classification, owner approval, backup/PITR evidence, rehearsed restore

STATUS CORRECTED from the auditor's 'missing'. The governing gap is real: docs/WORKFLOW.md §14 (lines 248-272) has up+down SQL, RLS in PR, non-prod first, expand→migrate→contract, prefer-forward-fix — but no additive/reversible/destructive classification and no backup/PITR/rehearsed-restore requirement, versus system WORKFLOW.md:102 (classify) and :106-107 (owner approval + backup/PITR evidence + restore rehearsed on a non-production copy with result recorded + 'down-SQL cannot recreate deleted data'). BUT the repo is not missing the substance — it lives in non-governing docs built for the one destructive event (PP7's 0030): docs/content-migration-map.md:42 states verbatim that a .down.sql restores rows but 'cannot restore deleted Storage objects' and makes the cold backup 'a hard exit-gate item'; docs/PRODUCTION-CUTOVER-RUNBOOK.md:11 records the sequence 'REHEARSED END TO END ON TEST (2026-08-16)' with §1 'Verify the cold backup'; docs/ROLLBACK-RUNBOOK.md:196-225 documents exactly what was rehearsed. The protocol was executed but never codified, so the NEXT destructive migration is […]

*Evidence:* development/WORKFLOW.md:100-108; docs/WORKFLOW.md:248-272 (grep 'backup|PITR|classif|rehears' in that file = 0 matches); docs/content-migration-map.md:42; docs/PRODUCTION-CUTOVER-RUNBOOK.md:11,70; docs/ROLLBACK-RUNBOOK.md:196-225

**Fix:** Add three bullets to repo docs/WORKFLOW.md §14, codifying what PP6c/PP7 already proved: classify each migration additive/reversible/destructive; destructive work requires explicit owner approval plus backup/PITR evidence and a restore rehearsed on the non-production project with its result recorded; state that down-SQL cannot restore deleted data or Storage objects.

### [missing → SYS1] Preserve user work: never reset/discard/overwrite to get a clean tree

VERIFIED. System CLAUDE.md:54 ('Preserve existing user changes. Never reset, discard, or overwrite work to obtain a clean tree') and system WORKFLOW.md:43 ('Never... reset user work') plus :13 ('Sync from the latest main without discarding user work') have no repo counterpart: repo CLAUDE.md's 'Preserve current behavior' is about app behavior, and 'reset|discard|overwrite' have zero matches in it; repo docs/WORKFLOW.md's closest is the anti-'git add -A' caution at line 110. High-value here given the OneDrive tree-mutation history (memory: 'never git add -A here — tree mutates').

*Evidence:* development/CLAUDE.md:54; development/WORKFLOW.md:13,43; Grep 'reset|discard|overwrite' in repo CLAUDE.md = 0 matches; docs/WORKFLOW.md:110

**Fix:** Add one line to repo CLAUDE.md 'When making changes': 'Preserve existing user changes — never reset, discard, stash-drop, or checkout-over uncommitted work to obtain a clean tree.'

### [partial → SYS1] Primary agent forbidden to open/read .env.local; leak-report protocol

VERIFIED, line numbers exact. System CLAUDE.md:65-68 forbids the build agent to open/read/copy/print any live env file and defines the leak protocol (report file, line, secret type only; owner rotates). Repo AGENTS.md:105 covers non-primary agents ('Never read, echo, copy, or commit .env.local'), but repo CLAUDE.md — which governs the primary agent — only says 'Never commit .env.local' (line 101) and 'not staged' (line 119), and line 141 affirmatively instructs copying .env.example to .env.local; it never forbids reading it and has no rotation protocol (repo AGENTS.md:62's 'flagged for rotation' is reviewer-side only).

*Evidence:* development/CLAUDE.md:65-68; repo CLAUDE.md:101,119,141 (grep 'env.local' = exactly those three lines); repo AGENTS.md:62,105

**Fix:** Add to repo CLAUDE.md 'Protect env vars and Supabase secrets': 'Never open, read, or print .env.local or any file of live env values; if a leak is suspected, report only file, line, and secret type and tell the owner to rotate it.' (The cp instruction can stay — it describes the owner's manual setup step.)

### [missing → SYS1] Allowed-files guard (task names the files allowed to change)

VERIFIED, with one hedge removed. System CLAUDE.md:25 ('Confirm the task names the files allowed to change. If another file is needed, stop and explain why'), system WORKFLOW.md:21 ('State the goal, allowed files, explicit exclusions...') and :112 ('allowed-path guard pass' in the definition of done) have no repo counterpart: 'allowed' has zero matches in both repo CLAUDE.md and docs/WORKFLOW.md, and — correcting the auditor's speculation — the sprint-prompt skill has no allowed-files concept either (zero matches in .claude/skills/). Repo scope control is only sprint-level ('work only inside the active sprint's scope').

*Evidence:* development/CLAUDE.md:25; development/WORKFLOW.md:21,112; Grep -i 'allowed' in repo CLAUDE.md = 0, docs/WORKFLOW.md = 0, .claude/skills/** = 0

**Fix:** Add one line to repo CLAUDE.md 'Before making changes': 'If the sprint prompt lists allowed files, stay inside that list; needing another file means stop and explain why before touching it.'

### [missing → SYS1] Common status lifecycle (Not Started → In Progress → Blocked/Ready for Review → Approved → Done)

VERIFIED with one detail corrected. The lifecycle is defined at development/00-START-HERE.md:64, development/PROJECT-STATUS.md:12,30, development/templates/SPRINT-PLAN-TEMPLATE.md:50 (and used in development/ROADMAP.md:34-46) — not in the system's CLAUDE/AGENTS/WORKFLOW. No repo governing doc adopts any status vocabulary: docs/WORKFLOW.md §0.3 (line 11) mandates updating PROJECT-STATUS.md without defining statuses, and docs/ROADMAP.md uses ad-hoc labels (verified tally: ✅ ×37, 'MERGED' ×13, 'BUILT' ×2). CORRECTION: only ONE of the two BUILT strings is stale — line 152's PP8 row ('🔵 BUILT 2026-08-20', while PP8 merged to main that day, the known loose end); line 143's PP1.1 'BUILT + VERIFIED ON TEST 2026-08-12' is a dated historical annotation inside a completed ✅ row (PR #75 merged, commit 3e3a1d2).

*Evidence:* grep -o tallies on docs/ROADMAP.md: ✅=37, MERGED=13, BUILT=2 (lines 143, 152); git log: 3e3a1d2 'Merge pull request #75 ... claude/pp1-1-card-model'; system hits: 00-START-HERE.md:64, development/PROJECT-STATUS.md:12,30, templates/SPRINT-PLAN-TEMPLATE.md:50, development/ROADMAP.md:34-46; docs/WORKFLOW.md:11

**Fix:** Add one line to repo docs/WORKFLOW.md §0.3 defining the allowed statuses (adopt the system lifecycle or bless the existing ✅/MERGED vocabulary), and flip the single stale PP8 row (docs/ROADMAP.md:152) plus its PROJECT-STATUS counterpart to merged. Overlaps the tracker-state audit — coordinate so the flip happens once.

### [conflict → SYS1] Git-hook skipping: absolute ban vs recorded-reason escape hatch

VERIFIED; evidence attribution corrected. Repo docs/WORKFLOW.md:286 reads 'Never skip Git hooks or CI checks (--no-verify) without an explicit, recorded reason' — an escape hatch that contradicts repo CLAUDE.md's absolute 'Do not skip Git hooks (--no-verify)' and system CLAUDE.md:103, whose actual wording is 'Never push to main, push another branch, merge a PR, force-push, or skip hooks' (the auditor attributed the repo's phrasing to the system; the substance — an absolute ban — is right). Since repo CLAUDE.md declares itself overriding, the WORKFLOW qualifier is an internal inconsistency as well as a system deviation.

*Evidence:* docs/WORKFLOW.md:286; repo CLAUDE.md 'Git rules' ('Do not skip Git hooks (--no-verify)'); development/CLAUDE.md:103

**Fix:** Delete 'without an explicit, recorded reason' from docs/WORKFLOW.md:286 so all three docs carry the same absolute rule.

### [conflict → decision] New-string mechanism: copy-file addition vs inline strings under voice rules

VERIFIED. System CLAUDE.md:42: a needed string with no approved source is 'add[ed] via the copy file (following the voice rules) rather than inventing it inline' — the system also assumes an in-repo frozen copy set at docs/content/page-copy/. Repo CLAUDE.md ('Locked content & design inputs', first bullet) instead permits new strings (error states, aria labels, empty states) directly under the brand-voice rules in /docs/page-copy/00-global/brand-voice.md with no copy-file routing — and this repo's copy canon is gitignored/OneDrive-resident (ground fact), so the system's in-repo copy-file mechanism does not physically fit this project as-is.

*Evidence:* development/CLAUDE.md:42; repo CLAUDE.md 'Locked content & design inputs' bullet 1; ground fact + .gitignore: docs/page-copy is gitignored, OneDrive is canon

**Fix:** Owner decides canon. Pragmatic resolution: keep the repo's voice-rule-governed inline mechanism and add a usage note to the system that a project whose copy canon lives outside the repo may substitute it; the alternative (routing every new string through the OneDrive copy files) needs an owner-defined process the docs don't have today.

### [partial → SYS1] OVERLOOKED GAP — repo governing docs assert pre-PP6/PP7 database state in the present tense

Added by verification; the auditor missed it. The system requires governing docs to track on-disk/production truth (development/CLAUDE.md:36-38 'Verify the on-disk implementation... If code and documentation disagree, report the mismatch'; development/WORKFLOW.md:96 'PROJECT-STATUS.md owns current state'). Production is on migration 0034 (ground fact), meaning PP6's 0029 and PP7's 0030 are applied — yet repo AGENTS.md:11 still says the storage_bucket half of the templates predicate 'is not yet enforced in SQL — it is owed by PP6's 0029', AGENTS.md:12 is headed 'Retired surfaces still have live tables' ('remain in the database until PP7's 0030'), and AGENTS.md:86 instructs reviewers to check 'programming_sessions: public read anon-safe' — a table 0030 removed. Repo CLAUDE.md carries the same stale present tense ('are still in the database and are dropped by PP7's migration 0030', 'still owed by PP6's 0029 (D-PP-i)'). AGENTS.md was edited during PP8 (line 66 cites 'PP8 8-k'), so these lines were left stale through the most recent update.

*Evidence:* repo AGENTS.md:11,12,66,86; repo CLAUDE.md 'Palestine House access rules' + 'History' paragraphs; ground fact: prod on 0034; development/CLAUDE.md:36-38; development/WORKFLOW.md:96

**Fix:** In the same tracker-flip PR the loose end already owes: retense the 0029/0030 lines in repo CLAUDE.md and AGENTS.md to past ('applied; tables dropped; bucket predicate now enforced in SQL') and delete or retire the AGENTS.md:86 programming_sessions reviewer check. Coordinate with the tracker-state audit area so state is corrected once, consistently.

---

## 3. Technical integrity / the Code Check

The repo genuinely enforces the core of Wall 2 — tsconfig.json has strict:true, eslint.config.mjs extends next/core-web-vitals + next/typescript with no rules disabled, and .github/workflows/ci.yml runs typecheck, lint, and build on every PR to main plus a gitleaks secret scan the system never asked for — but three of the system's six mandated checks (Prettier format:check, the --if-present test step, pnpm audit) are absent, and the workflow's every name (ci.yml / "CI" / job "verify") differs from the system's hard-coded code-check.yml / "Code Check". Nine of the auditor's ten claims verified exactly, with one refuted: the lone "unexplained" eslint-disable at focus-areas-admin.tsx:509 in fact carries a three-line reason comment directly above it (lines 506-508), so the line-level suppression rule is fully satisfied; conversely the Wall 3 conflict is even sharper than claimed, since docs/code-reviews/ holds 15 saved review files proving practice followed the system's mandatory regime while docs/WORKFLOW.md §8 still calls review optional. Walls 4a/4b are confirmed entirely unbuilt (zero test files/deps/scripts, zero sentry/posthog references anywhere in code) — exactly phases B and C — and one small overlooked delta was found: ci.yml lacks the system template's timeout-minutes guard.

### [missing → decision] Code Check 3 — Prettier formatting (`format:check`) on every PR

Verified in full. System (docs/Website-Development-System/development/TECHNICAL-INTEGRITY.md line 22 "Formatted — Prettier, default config, committed to the repo", lines 53-54 CI step, line 63 contract) demands prettier + format:check script + CI step. Repo has none: no prettier in package.json devDependencies (lines 34-48), no "prettier" key in package.json either (config-in-package.json also absent), Glob '.prettier*' and 'prettier.config.*' at repo root → no files, no format:check in scripts (lines 6-12), no format step in .github/workflows/ci.yml. Retrofit implies one whole-repo reformat commit on merged, stable main.

*Evidence:* package.json lines 6-12 and 34-48 (read whole file — no prettier dep, script, or config key); Glob '.prettier*' → none; Glob 'prettier.config.*' → none; .github/workflows/ci.yml steps = gitleaks, corepack, node, install, typecheck, lint, build only; TECHNICAL-INTEGRITY.md lines 22, 53-54, 63, 67

**Fix:** Owner chooses: (a) adopt — one PR adding prettier devDep + default config + `format:check` script (`prettier --check .`) + CI step, preceded by a single `prettier --write .` commit; or (b) waive for this already-built site, record the deviation in the site docs, keep Prettier for the next fresh build. Do not half-adopt (config without CI step). Auditor's fix is correct as written.

### [missing → SYS2] Code Check 5 — tests run when present, and CI auto-pickup of a future test step

Verified in full. System workflow template (TECHNICAL-INTEGRITY.md lines 55-56) has `pnpm run --if-present test:unit`; repo ci.yml has no test step of any kind (steps at lines 26-59: checkout, gitleaks, corepack, setup-node, install, typecheck, lint, build). So a future test script added in phase B would silently not run in CI until ci.yml itself is edited — the auditor's core claim is correct. Also confirmed zero test infrastructure: no *.test/*.spec files under src (Glob), no tests/test/e2e/__tests__ directories (Glob), no vitest/jest/playwright in devDependencies, no test/test:unit script.

*Evidence:* .github/workflows/ci.yml lines 20-59; package.json scripts lines 6-12 (dev/build/start/lint/typecheck only); Glob 'src/**/*.{test,spec}.{ts,tsx,js,jsx}' → none; Glob '{tests,test,e2e,__tests__}/**/*' → none; TECHNICAL-INTEGRITY.md lines 55-56, 63

**Fix:** In phase B, add the test script(s) to package.json AND the CI step to ci.yml in the same PR. Adding `- run: pnpm run --if-present test:unit` now, ahead of phase B, is also safe (`--if-present` exits 0 when the script is absent) and makes ci.yml match the system template. Auditor's fix is correct.

### [missing → SYS1] Code Check 6 — no known-critical vulnerabilities (`pnpm audit`) on every PR

Verified. TECHNICAL-INTEGRITY.md lines 59-60 mandate a blocking `pnpm audit --prod --audit-level=critical` step; ci.yml contains no audit step anywhere and package.json needs no change for it. Nothing currently blocks a merge on a critical published advisory. The fix is CI-only and zero-risk to app behavior.

*Evidence:* .github/workflows/ci.yml (full file read — no audit step); TECHNICAL-INTEGRITY.md lines 59-60; package.json (no audit script needed)

**Fix:** Add one step to ci.yml after the install step: `- name: No critical known vulnerabilities` / `run: pnpm audit --prod --audit-level=critical`. No package.json change. Auditor's fix is correct and smallest-safe.

### [conflict → decision] Workflow identity — ci.yml "CI" vs the system's code-check.yml "Code Check"

Verified. System hard-codes `.github/workflows/code-check.yml` (TECHNICAL-INTEGRITY.md line 29 heading, line 12), workflow name "Code Check" (line 34), and tells the owner to select the status check "Code Check" in branch protection (line 68). Repo reality: only workflow file is .github/workflows/ci.yml (Glob confirmed), name "CI" (line 1), job id `verify` displayed "Install · Typecheck · Lint · Build" (lines 21-22) — so GitHub's required-check would appear as that job name, not "Code Check". Also verified minor template deltas: system pins actions/checkout@v4 + pnpm/action-setup@v4 + Node 20 (lines 42-47); repo uses checkout@v6 + corepack + setup-node@v7 Node 22 (ci.yml lines 27-47) — newer, functionally fine.

*Evidence:* .github/workflows/ci.yml lines 1, 21-22, 27-47; TECHNICAL-INTEGRITY.md lines 12, 29, 34, 42-47, 68; Glob '.github/workflows/*' → ci.yml only

**Fix:** Owner decides: (a) keep ci.yml/"CI" and record a site-level deviation note that the required check here is the CI `verify` job; or (b) rename to code-check.yml/"Code Check" in a config-only PR AND re-point the branch-protection required-check name in GitHub in the same sitting — never rename without re-pointing, since the old check name would leave the merge button permanently locked or the gate silently absent.

### [partial → SYS1] Code Check runs on *every* pull request

Verified. System template triggers on bare `pull_request:` (TECHNICAL-INTEGRITY.md lines 35-36 — every PR, any base). Repo ci.yml lines 3-7 filter both push and pull_request to `branches: [main]`, so a PR targeting any non-main base (e.g. a stacked phase branch) gets no CI run. Low practical risk given the repo's one-sprint-one-branch-to-main habit, but a real delta from the system's version.

*Evidence:* .github/workflows/ci.yml lines 3-7 (`pull_request:\n    branches: [main]`); TECHNICAL-INTEGRITY.md lines 35-36

**Fix:** Drop the `branches: [main]` filter under `pull_request:` in ci.yml (keep it under `push:`), so every PR runs the check regardless of base. Auditor's fix is correct and minimal.

### [owner-action → SYS1] Branch protection on main + one verified locked-merge PR

Verified as far as disk allows. The setting lives in GitHub, not the repo; gh CLI is confirmed absent on this machine (`command -v gh` → exit 1), so it cannot be queried from here. docs/WORKFLOW.md line 56 instructs setting branch protection (PR required, CI green, Preview successful, no direct/force pushes) and the PP series merged via PRs, consistent with it being on — but nothing on disk proves the required-status-check is enrolled, or enrolled under the check name ci.yml actually emits (the `verify` job, displayed "Install · Typecheck · Lint · Build", NOT "Code Check"). TECHNICAL-INTEGRITY.md line 69: "An unverified gate is the same as no gate."

*Evidence:* docs/WORKFLOW.md line 56; TECHNICAL-INTEGRITY.md lines 68-69; Bash `command -v gh` → exit 1; .github/workflows/ci.yml lines 21-22 (the actual emitted check name)

**Fix:** Owner: GitHub → Settings → Branches → main rule → confirm (1) require PR before merging, (2) required status checks list the check ci.yml actually emits, (3) on the next PR the merge button stays locked until green. Do during phase A so any workflow rename is coordinated with the required-check re-point.

### [present → info] Line-level suppression rule (no `any`, no @ts-ignore, no unexplained eslint-disable) — auditor's finding REFUTED

The auditor's one alleged violation does not hold up. Confirmed clean sweep: zero `: any`/`as any`/`<any>`/`any[]` matches in src, zero @ts-ignore/@ts-expect-error/@ts-nocheck, eslint.config.mjs disables no rules (only ignores .next/node_modules/next-env.d.ts/docs), and all 11 eslint-disable-next-line occurrences are the benign @next/next/no-img-element. The auditor called src/app/admin/content/focus-areas/focus-areas-admin.tsx:509 "a bare disable with no reason" — but lines 506-508, immediately above the disable, are a three-line comment giving the exact reason ("Plain <img>: next/image optimises, which is right for the partner pages and pointless for a 120px admin thumbnail…"). The suppression is explained, merely in block-comment-above style instead of the trailing `--` style the other 10 use. The system's rule (TECHNICAL-INTEGRITY.md line 27) actually locates the reason in the PR description, not inline, so the repo's inline documentation exceeds the requirement in all 11 cases.

*Evidence:* src/app/admin/content/focus-areas/focus-areas-admin.tsx lines 505-511 (reason comment at 506-508, disable at 509); Grep 'eslint-disable' in src → 11 matches, all @next/next/no-img-element; Grep ': any\b|as any\b|<any>|any\[\]' in src → none; Grep '@ts-ignore|@ts-expect-error|@ts-nocheck' in src → none; eslint.config.mjs (full read); […]

**Fix:** None needed — drop the auditor's proposed one-line edit; the rule is satisfied. Harmonizing the comment style at line 509 to trailing `--` would be purely cosmetic and fails the smallest-safe-change bar on a merged codebase.

### [conflict → decision] Wall 3 — independent review as a hard gate

Verified, and the evidence is stronger than the auditor stated. System side confirmed: TECHNICAL-INTEGRITY.md line 13 ("Blocking findings never merge") and docs/Website-Development-System/development/WORKFLOW.md line 5 (Codex review in the mandatory chain), §6 lines 65-73 (approval never carries forward), line 79 ("a gate, not a suggestion… a Blocking finding is never merged"), line 115 (Definition of done requires current-head Approve). Repo side confirmed: docs/WORKFLOW.md line 115 "(Optional) Ask Codex", lines 170-172 "optional but valuable on risky changes", line 224 "review (if any)", line 333 "(Optional) Review agent pass complete". ADDED EVIDENCE the auditor missed: docs/code-reviews/ contains 15 saved review files (pp1, pp7, pp8, s3, s5, s6, s7×2, fa11×2, lh1, e1, plus three small-PR reviews) — actual practice largely followed the system's mandatory regime and its docs/code-reviews/ save-path convention, while the repo's own WORKFLOW.md still labels review optional. The contradiction is doc-vs-doc, with practice siding with the system.

*Evidence:* docs/Website-Development-System/development/WORKFLOW.md lines 5, 65-73, 77-79, 115; docs/WORKFLOW.md lines 115, 170-172, 224, 333; Glob 'docs/code-reviews/*' → 15 files including pp8-security-verification.md, pp7-round-3-ledger.md, pp1-platform-foundations.md

**Fix:** Owner decides the regime going forward and edits ONE of the two WORKFLOW.md files to match, recording the choice. Given that practice already followed the mandatory regime for every major sprint, the smallest honest fix is likely updating repo docs/WORKFLOW.md §8/§12/§17 to codify it (optionally keeping trivial-PR exemptions explicit). Do not leave the contradiction standing.

### [missing → SYS2] Wall 4a — behavior proof: tests (Launch Gate suite + unit tests)

Verified in full. Repo has zero test infrastructure: no test/spec files under src or anywhere (Glob for src/**/*.{test,spec}.* and tests/test/e2e/__tests__ dirs → none), no vitest/jest/playwright in package.json (full file read), no test script, no CI test step. The system playbook is present but unactivated: docs/Website-Development-System/development/testing-setup/ holds exactly 7 files (00-START-HERE.md, TESTING-GUIDE.md, activate-testing.md, SETUP-CHECKLIST.md + templates/ MORNING-CHECK-TEMPLATE.md, TEST-REPORT-TEMPLATE.md, FEATURE-LIST-TEMPLATE.md). This is precisely phase B's scope.

*Evidence:* package.json (full read — no test deps/scripts); Glob results → no test files or dirs; .github/workflows/ci.yml (no test step); Glob 'docs/Website-Development-System/**/*' → the 7 testing-setup files; TECHNICAL-INTEGRITY.md lines 14, 24

**Fix:** Phase B: follow testing-setup/activate-testing.md — add the runner + first suite, wire the CI step into ci.yml in the same PR (see the Code Check 5 finding), and stand up the Launch-Gate/morning-check routine from the templates. Auditor's fix is correct.

### [missing → SYS3] Wall 4b — behavior proof: error tracking

Verified in full. No @sentry/* or posthog packages in package.json dependencies (lines 13-33) or devDependencies (lines 34-48); case-insensitive grep for 'sentry|posthog' across all *.ts/tsx/js/mjs/json/example code files repo-wide → no files (the only textual mentions live in docs, which are the SOP/instructions themselves — CLAUDE.md lists PostHog/Sentry as optional no-op integrations and names SENTRY_AUTH_TOKEN as a server-only secret, but nothing was ever wired). The system playbook is present but unactivated: docs/Website-Development-System/development/error-tracking/ holds exactly 6 files (00-START-HERE.md, ERROR-TRACKING-GUIDE.md, handle-error.md, SETUP-CHECKLIST.md + templates/ INCIDENT-LOG-TEMPLATE.md, USER-UPDATE-TEMPLATE.md). Production is live on 0034 with real partners and no runtime error capture. Precisely phase C's scope.

*Evidence:* package.json lines 13-48; Grep -i 'sentry|posthog' in src → no files; Grep -i repo-wide over code globs → no files; Glob → the 6 error-tracking files; TECHNICAL-INTEGRITY.md line 14; CLAUDE.md integrations + secrets lists

**Fix:** Phase C: follow error-tracking/SETUP-CHECKLIST.md — add the tracker (Sentry per the system), env vars named-only for the owner to set in Vercel, no-op when absent matching the existing integration pattern, and adopt the incident templates. Consistent with CLAUDE.md's env-name-only and no-op-when-absent rules.

### [partial → SYS1] CI job has no timeout guard (overlooked by the auditor)

The system's workflow template sets `timeout-minutes: 10` on the job (TECHNICAL-INTEGRITY.md line 40); repo ci.yml's verify job has no timeout, so a hung install/build would run to GitHub's 6-hour default, burning runner minutes and blocking the concurrency group. Small, but it is a genuine line of the system template the repo does not carry; the repo's concurrency-cancel block (ci.yml lines 15-18) mitigates repeat pushes but not a single hung run.

*Evidence:* .github/workflows/ci.yml lines 20-25 (job definition, no timeout-minutes); TECHNICAL-INTEGRITY.md line 40 (`timeout-minutes: 10`)

**Fix:** Add `timeout-minutes: 10` under the `verify:` job in ci.yml (one line; consider 15 if real build times warrant headroom). Zero behavior risk; bundle with the other phase-A ci.yml touches (audit step, PR-trigger filter) as one small PR.

---

## 4. Testing-setup (Launch Gate) readiness — sprint phase B

The auditor's core account is correct and verified line-by-line: the Launch Gate module exists only inside the untracked docs/Website-Development-System folder (git status '??', check-ignore exit 1), and zero of it is installed — no @playwright/test or any test script in package.json, no playwright.config.*, no tests/ dir, no .claude/skills/activate-testing or browser-qa (skills dir holds only close and sprint-prompt), no morning-check workflow (.github/workflows has only ci.yml, which runs gitleaks + typecheck/lint/build and no tests), and no qa-evidence//test-results//playwright-report/ entries in .gitignore. Two of the auditor's citations were wrong and are corrected below: the repo SECURITY-CHECKLIST's abuse controls live in §8 (lines 77-80), §13 (117) and §15 (145) — not §9, which is the zod-validation section — and the repo rule making the live production test an owner-by-hand step is WORKFLOW.md §12 (Production merge checklist), not §8 (which is the optional Codex review section); also docs/error-tracking/ dangles via MORNING-CHECK-TEMPLATE lines 10/54 rather than the skill's read list, and the §5 mis-citation additionally appears in FEATURE-LIST-TEMPLATE §E line 50, so fixing the SKILL.md alone is not enough. Two additions the auditor missed: PLAYWRIGHT_BASE_URL (and the bypass-secret name) belong in the existing .env.example per TECH-ARCHITECTURE's names-only rule, and Phase 1's docs-vs-code cross-check will collide with the parked D-PP-a divergence (public proof numbers 11·33·200+·297 in WORKFLOW.md line 12 vs production content 4 sections/22 focus areas/88 templates on 0034) unless it is pre-marked as a known parked decision.

### [missing → SYS1] Part 1 box 1 — copy folder into repo per copy map

VERIFIED. Copy map (docs/Website-Development-System/development/testing-setup/00-START-HERE.md lines 32-41) targets docs/testing-setup/, .claude/skills/activate-testing/SKILL.md, docs/FEATURE-LIST.md, docs/test-reports/, tests/e2e/, .github/workflows/morning-check.yml. None exist: docs/ root has no testing-setup/, FEATURE-LIST.md or test-reports/; the whole Website-Development-System folder is untracked ('?? docs/Website-Development-System/' in git status --porcelain; git check-ignore exits 1 = not ignored). Owner clones fresh per sprint, so a fresh clone loses the module entirely.

*Evidence:* git status --porcelain; git check-ignore -v exit 1; docs/ listing; 00-START-HERE.md lines 32-41 (copy map), module files confirmed: 00-START-HERE.md, SETUP-CHECKLIST.md, TESTING-GUIDE.md, activate-testing.md, templates/{FEATURE-LIST,TEST-REPORT,MORNING-CHECK}-TEMPLATE.md

**Fix:** Copy the 7 module files to docs/testing-setup/ (keeping templates/) and commit in the phase-B setup PR; whether the rest of Website-Development-System gets committed is a separate owner decision (the retrofit rule says it need not be).

### [missing → SYS2] Part 1 box 2 — install activate-testing skill

VERIFIED. .claude/skills/ contains only close/ and sprint-prompt/. activate-testing.md must be installed at .claude/skills/activate-testing/SKILL.md per copy map line 37, with [PROJECT_NAME] (appears at lines 3 and 6) substituted, and its doc references corrected per the conflict findings or they dangle.

*Evidence:* ls .claude/skills → close, sprint-prompt; activate-testing.md lines 3, 6 ([PROJECT_NAME]); 00-START-HERE.md line 37

**Fix:** Create .claude/skills/activate-testing/SKILL.md from activate-testing.md, substitute Palestine House, and fix the doc references per the conflict findings.

### [missing → SYS2] Part 2 box 1 — install Playwright dev dependency

VERIFIED. package.json scripts (lines 6-12) are dev/build/start/lint/typecheck only — no test script; devDependencies (lines 34-48) have no @playwright/test or any test runner. CLAUDE.md's 'run test only if the repo defines one' currently means no tests ever run. The auditor's test:e2e naming choice is sound: a script named 'test' would be auto-invoked by CLAUDE.md's after-changes ritual and the close skill, and the suite needs a deployed Preview URL to run.

*Evidence:* package.json lines 6-12, 34-48; CLAUDE.md 'After making changes' step 1

**Fix:** pnpm add -D @playwright/test in the setup PR; add script test:e2e (not test) and flag the naming choice in the PR.

### [missing → SYS2] Part 2 box 2 — Playwright config

VERIFIED. No playwright.config.* and no tests/ or e2e/ dir anywhere in the repo root. SETUP-CHECKLIST.md line 18 requires: tests in tests/e2e/, PLAYWRIGHT_BASE_URL env var, desktop + mobile (390px) profiles, one auth-setup step per role. Roles per CLAUDE.md access rules: anonymous (no auth), pending partner (is_approved=false), approved partner, HQ admin (approved + admins-table row) — 3 storage-state setup projects + anonymous. ADDITION the auditor missed: the repo already commits .env.example (confirmed at root), and TECH-ARCHITECTURE.md says commit names + safe placeholders only — PLAYWRIGHT_BASE_URL (and the bypass-secret name if Part 3 applies) should be added there, names only.

*Evidence:* ls root + glob → no playwright.config.*, no tests/, no e2e/; SETUP-CHECKLIST.md line 18; .env.example exists at repo root; docs/TECH-ARCHITECTURE.md line ~222 ('Commit .env.example (names + safe placeholders) only')

**Fix:** Create playwright.config.ts (tests/e2e/, PLAYWRIGHT_BASE_URL, chromium desktop + 390px mobile, three auth-setup projects saving storage state) and add PLAYWRIGHT_BASE_URL to .env.example with a placeholder value.

### [missing → SYS2] Part 2 box 3 — create test users (non-production only)

VERIFIED with a fix tweak. No test-user fixtures exist. SUPABASE-MCP-SAFETY.md confirms supabase-test is read+write on a genuinely separate project (line 24, project_ref sdszcralogcrujtyghig) vs supabase-prod-readonly (line 25, jwogtqizqujwhbvpoziu, read_only=true) — hard evidence a non-production project exists. Needed: pending partner (proves the pending gate returns no guide/template/topic data), approved partner, HQ admin (approved + admins row). SETUP-CHECKLIST line 19: obviously-fake emails, record emails (never passwords) in docs/FEATURE-LIST.md. Fix tweak: create the accounts through the app's own /apply flow against the test project (Apply = sign-up is the only account-creation door per SECURITY-CHECKLIST §15 line 140) or the Supabase dashboard — raw SQL inserts into auth.users are fragile; then flip is_approved and insert the admins row via recorded SQL on supabase-test.

*Evidence:* docs/SUPABASE-MCP-SAFETY.md lines 11-12, 24-25; SETUP-CHECKLIST.md line 19; docs/SECURITY-CHECKLIST.md line 140 (Apply = sign-up invariant)

**Fix:** Create the three fake accounts via the apply flow (or dashboard) on the test project; flip is_approved / insert admins row via recorded SQL through supabase-test; note emails in the generated FEATURE-LIST.

### [owner-action → decision] Part 2 box 4 — confirm environment separation (Preview = test keys)

VERIFIED. Preview env values are unreadable from the repo — only the owner can check Vercel. Repo mandates separation: TECH-ARCHITECTURE.md line 285 ('never copy the Production NEXT_PUBLIC_SITE_URL or production Supabase credentials into Preview') and WORKFLOW.md line 263 (separate non-production Supabase project). Stripe half of the box is N/A: no stripe dependency in package.json; the single conversion is /apply. The box's cited docs/ENV-VARS-SAFETY.md does not exist at repo docs/ root (only in the SOP dev folder) — covered by the doc-references conflict.

*Evidence:* package.json dependencies lines 13-33 (no stripe); docs/TECH-ARCHITECTURE.md line 285, env block lines ~226-258 (NEXT_PUBLIC_TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY / RESEND_* names); docs/WORKFLOW.md line 263; docs/ listing (no ENV-VARS-SAFETY.md); SETUP-CHECKLIST.md line 20

**Fix:** Owner verifies in Vercel → Settings → Environment Variables that Preview scope uses the test Supabase project's NEXT_PUBLIC_SUPABASE_URL/PUBLISHABLE_KEY and Turnstile's always-pass test key pair (names only). A live key in Preview is a blocker.

### [missing → SYS2] Part 2 box 5 — morning-check workflow file (disabled)

VERIFIED including the drift. .github/workflows/ contains only ci.yml. Template yaml (MORNING-CHECK-TEMPLATE.md lines 14-39) uses actions/checkout@v4 + pnpm/action-setup@v4 + setup-node@v4 node 20; repo ci.yml uses checkout@v6 + corepack enable + setup-node@v7 node 22 (lines 27-47). Template references vars.PRODUCTION_URL and secrets MORNING_TEST_EMAIL/MORNING_TEST_PASSWORD (lines 36-38).

*Evidence:* .github/workflows/ listing; ci.yml lines 27-47; MORNING-CHECK-TEMPLATE.md lines 14-39

**Fix:** Add .github/workflows/morning-check.yml in the setup PR using the repo's checkout@v6/corepack/node-22 pattern, cron disabled (commented or job guarded) until GO; reference PRODUCTION_URL / MORNING_TEST_EMAIL / MORNING_TEST_PASSWORD by name only.

### [owner-action → decision] Part 3 — Vercel Preview protection bypass

VERIFIED. Protection state is not derivable from the repo (no vercel.json exists at root — confirmed by listing). SETUP-CHECKLIST Part 3 (lines 25-29): owner enables Protection Bypass for Automation, puts the secret in Vercel Preview env + GitHub Actions secrets; Claude references it by name only in the config; skip entirely if protection is off. VERCEL_AUTOMATION_BYPASS_SECRET / x-vercel-protection-bypass are the correct standard names (the checklist itself says 'Claude Code will tell you the exact variable name').

*Evidence:* SETUP-CHECKLIST.md lines 25-29; repo root listing (no vercel.json)

**Fix:** Owner reports Preview protection on/off. If on: follow Part 3 with VERCEL_AUTOMATION_BYPASS_SECRET — value only in the two dashboards, never in chat or files; add the name (empty) to .env.example.

### [missing → SYS2] Part 4 box 1 — smoke test proves the pipeline

VERIFIED. No tests exist anywhere. activate-testing.md line 26 (Phase 0): 'Do not proceed to Phase 1 until the smoke test has passed against a deployed Preview.' SETUP-CHECKLIST line 33 defines it: homepage loads with no errors, run against a deployed Preview.

*Evidence:* no tests/ dir; activate-testing.md line 26; SETUP-CHECKLIST.md line 33

**Fix:** Write tests/e2e/smoke.spec.ts (homepage renders, zero console errors) and run once against the setup branch's Preview via PLAYWRIGHT_BASE_URL before closing phase B.

### [owner-action → decision] Part 4 boxes 2-3 — owner merges setup PR + dated confirmation

VERIFIED. SETUP-CHECKLIST lines 34-35 assign both boxes to the owner; repo git rules (CLAUDE.md) forbid Claude merging, and the owner merges PRs himself per working style.

*Evidence:* SETUP-CHECKLIST.md lines 34-35; CLAUDE.md Git rules

**Fix:** After the setup PR is green with the smoke test passed, owner merges and writes the one-line dated confirmation in the PR or PROJECT-STATUS.

### [conflict → SYS1] CONFLICT — skill's doc references vs this repo's actual docs

VERIFIED with one correction. Dangling references in activate-testing.md: read list lines 12-18 (docs/testing-setup/TESTING-GUIDE.md + SETUP-CHECKLIST.md — fixed by the Part 1 copy; docs/ENV-VARS-SAFETY.md; docs/QA-CHECKLIST.md), line 10 + 41 (docs/BROWSER-TOOLS.md), line 53 (docs/templates/BUG-FIX-PROMPT-TEMPLATE.md), line 56 (docs/LAUNCH-CHECKLIST.md). CORRECTION: docs/error-tracking/ is NOT cited by the skill's read list — it dangles via MORNING-CHECK-TEMPLATE.md lines 10 and 54 (docs/error-tracking/ERROR-TRACKING-GUIDE.md) and via the /handle-error skill named at activate-testing line 64. Four references DO resolve at repo docs/ root and need no change: TECH-ARCHITECTURE.md, SECURITY-CHECKLIST.md (section numbers aside), SUPABASE-MCP-SAFETY.md, WORKFLOW.md. Retrofit-rule contradiction confirmed: 00-START-HERE.md lines 43-45 says an existing site needs nothing else from the system, yet the skill hard-references five system docs the repo lacks.

*Evidence:* activate-testing.md lines 10, 12-18, 41, 53, 56, 64; MORNING-CHECK-TEMPLATE.md lines 10, 54; docs/ root listing; 00-START-HERE.md lines 43-45

**Fix:** At install time rewrite the SKILL.md (and copied morning-check template) references to paths this repo will actually have: commit the needed companions to docs/ in phase A, or point at repo equivalents (WORKFLOW.md sprint loop, /sprint-prompt for fix sprints). Owner picks depth; leave no dangling reference.

### [conflict → SYS1] CONFLICT — SECURITY-CHECKLIST section-number mismatch (§5)

VERIFIED with corrected section mapping. Repo docs/SECURITY-CHECKLIST.md §5 (line 46) is 'Row Level Security (RLS) checklist'; the SOP generic checklist's §5 (line 39) is 'Public forms & writes'. CORRECTION to the auditor's mapping: the repo's abuse controls live in §8 'API route (Route Handler) checklist' — rate-limit line 77, CAPTCHA line 78, Production fail-closed line 80 — plus §13 line 117 (rate limiter + CAPTCHA actually enforced) and §15 line 145 (public writes fail closed). §9 (line 82) is server-side zod validation, adjacent but not where lines 77-80 sit. ADDITION: the mis-citation also appears in FEATURE-LIST-TEMPLATE.md §E line 50 ('per SECURITY-CHECKLIST §5') and activate-testing.md lines 16 and 41 — all three copies need the fix, not just the SKILL.md.

*Evidence:* docs/SECURITY-CHECKLIST.md headings (46: §5 RLS, 73: §8, 82: §9), lines 77/78/80/117/145; SOP SECURITY-CHECKLIST.md line 39; activate-testing.md lines 16, 41; FEATURE-LIST-TEMPLATE.md line 50

**Fix:** In the installed SKILL.md and copied FEATURE-LIST template, cite the repo's real sections (§8, §13, §15) or make the reference semantic ('the public forms & abuse-controls sections').

### [conflict → decision] CONFLICT/DECISION — morning check's automated production login + production test account

VERIFIED with corrected citations. The template logs into production daily with a dedicated production test account (MORNING-CHECK-TEMPLATE.md lines 37-38 secrets, line 42 'dedicated, obviously-fake production login'). Tensions: (1) the SOP's own BROWSER-TOOLS.md line 46 — 'On Production, browser tools are read-only... Never submit forms... create accounts' — though activate-testing line 10 explicitly scopes that rule to the exploratory MCP/CLI tools, not the repo suite, and Phase 5 line 60 explicitly carves out 'read-only + test-account-login against production'; the module is internally consistent, so the genuine collisions are (2) activate-testing line 68 'never create test users... in production' — someone must hand-create AND hand-approve the prod account (owner via the apply→/admin/approvals flow), and an approved account holds real access to all gated content while a pending one cannot prove members get in; and (3) CORRECTION: the repo rule making the live-site test an owner-by-hand step is WORKFLOW.md §12 'Production merge checklist' line ~228 ('Test the live site for the […]

*Evidence:* MORNING-CHECK-TEMPLATE.md lines 36-42; SOP BROWSER-TOOLS.md line 46 (§5); activate-testing.md lines 10, 60, 68; docs/WORKFLOW.md §12 lines 222-232 vs §8 line 170; CLAUDE.md approval-gate rules

**Fix:** Owner decision at Phase 5 (post-GO, not phase-B blocking): (a) accept the module's carve-out and hand-create one obviously-fake approved account via apply→approve, (b) run the morning check logged-out only (render + visitor-denied checks), or (c) skip it. Record in PROJECT-STATUS.

### [partial → SYS2] N/A adaptation — payments/Stripe throughout the module

VERIFIED. FEATURE-LIST-TEMPLATE §D (line 41) is 'Payments (Stripe test mode only)'; TESTING-GUIDE line 25 and activate-testing line 42 assume Stripe test cards; SETUP-CHECKLIST line 20 names Stripe test mode. package.json has no stripe dependency and no purchase flow exists — single conversion is /apply (zod + Upstash + Turnstile, fail closed). activate-testing line 43's email rule (provider test hooks or capture inbox, never a real inbox) applies to Resend; Preview's RESEND_TO_EMAIL needs a capture/owner-inbox arrangement (env names RESEND_API_KEY / RESEND_TO_EMAIL confirmed in TECH-ARCHITECTURE's env block, lines ~249-253).

*Evidence:* FEATURE-LIST-TEMPLATE.md line 41; TESTING-GUIDE.md line 25; activate-testing.md lines 42-43; SETUP-CHECKLIST.md line 20; package.json lines 13-33; docs/TECH-ARCHITECTURE.md env block

**Fix:** Mark section D N/A in the generated FEATURE-LIST (template already uses skip-if-absent notation for section B — mirror it); confirm with the owner where Preview's RESEND_TO_EMAIL points so email assertions have a test hook.

### [missing → SYS2] gitignore lacks qa-evidence/ entry

VERIFIED. .gitignore (59 lines, read in full) covers /coverage (line 28), .playwright-mcp/ (line 50), *-1440.png / *-320.png (lines 51-52), docs/page-copy//page-designs//source-assets (lines 39-41) — but not qa-evidence/ (required gitignored by activate-testing lines 49 and 72) nor Playwright's default test-results/ and playwright-report/ output dirs.

*Evidence:* .gitignore full read; activate-testing.md lines 49, 72

**Fix:** Add qa-evidence/, test-results/, playwright-report/ to .gitignore in the phase-B setup PR.

### [partial → SYS1] WORKFLOW.md + CLAUDE.md testing description is manual-only

VERIFIED. WORKFLOW.md line 12 (sprint exit gate: typecheck/lint/build + CI green + Preview desktop/mobile — all manual verification) and §9 'Local test checklist' lines 181-192 (manual click-through); CLAUDE.md 'run test only if the repo defines one' — none defined; ci.yml runs gitleaks + typecheck/lint/build only. No tracker mentions a launch gate, Playwright, feature list, or test reports. The module indeed never requires e2e inside ci.yml (gate runs target a deployed Preview on demand; morning check is its own workflow), so leaving ci.yml unchanged is valid but should be a recorded choice.

*Evidence:* docs/WORKFLOW.md lines 12, 181-192; CLAUDE.md 'After making changes' step 1; .github/workflows/ci.yml lines 20-59

**Fix:** Phase A: one pointer line in WORKFLOW.md (optionally CLAUDE.md) referencing docs/testing-setup/ + /activate-testing as the whole-site Launch Gate layered on the per-sprint manual QA; record the no-e2e-in-ci.yml choice in the same PR.

### [missing → SYS1] browser-qa skill referenced but not installed

VERIFIED. SOP BROWSER-TOOLS.md line 3: 'The browser-qa skill (.claude/skills/browser-qa/) operationalizes this per repo' — no such skill installed (only close, sprint-prompt); the template exists at docs/Website-Development-System/development/templates/browser-qa.md; BROWSER-TOOLS.md is not at repo docs/ root. Cross-referenced from activate-testing lines 10 and 41. Not a phase-B blocker.

*Evidence:* SOP BROWSER-TOOLS.md line 3; ls development/templates/ (browser-qa.md present); ls .claude/skills; docs/ root listing

**Fix:** Either install browser-qa + commit BROWSER-TOOLS.md to docs/ in phase A, or strip those cross-references from the installed SKILL.md. Owner picks scope.

### [partial → SYS2] /activate-testing day-one needs (consolidated)

VERIFIED. All components confirmed absent (skill, docs, Playwright, config, test users, gitignore entries, workflow); owner clones fresh per sprint so everything must be committed — the current module copy is untracked and vanishes from a fresh clone. Phase 1's docs-vs-code cross-check (activate-testing lines 32-34) reads predevelopment docs, and docs/page-copy//page-designs//source-assets are gitignored (.gitignore lines 39-41, OneDrive canon) — that half of the scan must run on this machine or degrades to code-only. Three owner answers needed pre-invocation: Preview protection state, Preview env keys, Resend capture path.

*Evidence:* activate-testing.md phases 0-3 (lines 25-50); .gitignore lines 39-41; git status ?? Website-Development-System; memory: fresh clone per sprint

**Fix:** One phase-B PR: skill + docs/testing-setup + @playwright/test + config + .env.example names + gitignore entries + disabled morning-check + smoke test; test users via supabase-test; collect the three owner answers before invoking /activate-testing.

### [owner-action → SYS1] ADDED — Phase 1 cross-check will trip on the parked D-PP-a numbers divergence

Overlooked by the auditor. activate-testing line 33 requires 'promised but missing in code → report to the owner immediately as a pre-test finding'. The public proof numbers are locked at 11 · 33 · 200+ · 297 · 120-day (WORKFLOW.md line 12; CLAUDE.md), while production content on migration 0034 is 4 sections / 22 focus areas / 88 templates (ground fact), and reconciling public vocabulary with the private model is already parked as decision D-PP-a; the Stage-4 tracker flip is also still owed (memory: trackers still say PP8 BUILT). Without pre-marking, the feature-list scan will re-litigate a decision the owner already parked and could stall the gate on a known divergence.

*Evidence:* activate-testing.md lines 32-34; docs/WORKFLOW.md line 12 (proof numbers); CLAUDE.md D-PP-a paragraph; ground facts (0034 = 4/22/88); memory ph-build-state (tracker flip never made)

**Fix:** Before Phase 1 runs, record one line in the feature-list PR (or PROJECT-STATUS): the public-numbers vs private-content divergence is known and parked as D-PP-a — the scan reports it once as a pre-existing parked decision, not a new blocker; complete the owed Stage-4 tracker flip in phase A so the docs the scan reads are current.

---

## 5. Error-tracking readiness (sprint phase C)

The auditor's core picture is verified correct: the error-tracking module is 0% wired — no @sentry/nextjs in package.json, no sentry config or instrumentation files anywhere outside node_modules, zero 'sentry' matches in src/, no Sentry names in the committed .env.example, no docs/error-tracking/, no .claude/skills/handle-error, and both error boundaries (src/app/global-error.tsx, src/app/error.tsx) destructure only reset and report nothing — while the CSP conflict is real and exactly as quoted (next.config.ts lines 12-30 ship connect-src 'self' with a lines 5-11 comment and CLAUDE.md Hosting note both locking the allow-list to the YouTube embed origin, and src/middleware.ts's matcher would intercept a /monitoring tunnel route). Two auditor errors were found and corrected: the repo DOES have a rollback doc — docs/ROLLBACK-RUNBOOK.md — but it is migration-0030-specific, so the dependency-docs finding drops from missing to partial with a reconcile-not-copy fix; and /browser-qa is a development-module (phase-A) skill per the SOP's own copy map (development/00-START-HERE.md lines 25/33 map templates/browser-qa.md to .claude/skills/browser-qa/SKILL.md), not a testing-module phase-B deliverable. One overlooked gap was added: the Stripe/payment content that needs Palestine-House adaptation is not confined to handle-error.md — ERROR-TRACKING-GUIDE.md sections 4-5 and USER-UPDATE-TEMPLATE.md's payment-helper message also assume a Stripe checkout this no-payments site does not have.

### [missing → SYS3] Sentry SDK installed (SETUP-CHECKLIST Part 2, box 1)

VERIFIED. package.json (read in full) has no @sentry/nextjs — and also no posthog and no @upstash package, as the auditor noted. Glob '**/sentry.*.config.*' = no files; Glob 'instrumentation*.*' matches only node_modules/next internals; Glob 'src/instrumentation*.*' = nothing; case-insensitive grep for 'sentry' across src/ = zero files. docs/TECH-ARCHITECTURE.md line 141 lists @sentry/nextjs under 'Optional integrations (add only when used)' (header line 139) and line 83 annotates global-error.tsx '(Sentry, if used)' — the architecture doc anticipates exactly this install. docs/Website-Development-System/development/error-tracking/SETUP-CHECKLIST.md Part 2 line 16 requires the SDK with DSN 'by name only'.

*Evidence:* package.json lines 13-48 (full dep list, no @sentry/posthog/upstash entries); Glob + Grep results as stated; docs/TECH-ARCHITECTURE.md lines 83, 139-141; SETUP-CHECKLIST.md lines 14-20

**Fix:** One phase-C PR: pnpm add @sentry/nextjs; create instrumentation.ts (register + onRequestError), instrumentation-client.ts, and sentry.server/edge config reading NEXT_PUBLIC_SENTRY_DSN (the exact name TECH-ARCHITECTURE.md line 237 reserves), each init guarded so a blank DSN genuinely no-ops; default scrubbing on, user context set after Supabase session load, environment tagged from VERCEL_ENV so Production alerts separate from Preview noise. Reading the DSN in instrumentation.ts is explicitly sanctioned by docs/WORKFLOW.md line 255.

### [conflict → decision] CSP vs Sentry ingest — allow-list rule conflict (CRITICAL decision)

VERIFIED VERBATIM. next.config.ts lines 12-30: default-src 'self'; script-src 'self' 'unsafe-inline' (+ 'unsafe-eval' dev-only, line 14); style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src https://www.youtube-nocookie.com; frame-ancestors 'none'; no worker-src. Sentry browser events POST to the DSN's ingest origin, which connect-src 'self' silently blocks. The lines 5-11 comment ('The only planned extension is the YouTube embed origin… connect-src/form-action stay self'), CLAUDE.md's Hosting note ('the CSP allow-list is extended only for the YouTube embed origin — resolved decision D1'), and docs/TECH-ARCHITECTURE.md line 29 ('CSP extended for the youtube-nocookie origin only') all lock this. ADDITIONALLY VERIFIED: the auditor's Option-B middleware caveat is real — src/middleware.ts's matcher (line 20) excludes only static assets/metadata files, so a /monitoring tunnel route WOULD run updateSession on every browser error event.

*Evidence:* next.config.ts lines 5-30; CLAUDE.md Hosting note; docs/TECH-ARCHITECTURE.md line 29; src/middleware.ts lines 12-22 (matcher)

**Fix:** Owner decision recorded in PROJECT-STATUS.md Open decisions before phase C ships browser reporting, superseding the YouTube-only phrasing. Option A: add the DSN's ingest origin to connect-src and update CLAUDE.md's Hosting note + the next.config.ts comment in the same PR (worker-src 'self' blob: only if Session Replay is ever enabled). Option B: zero CSP change via withSentryConfig tunnelRoute — but then either exclude the tunnel path from the middleware matcher or verify updateSession passes it through harmlessly, and accept the extra Vercel […]

### [missing → SYS3] next.config.ts Sentry wrapping / source maps (SETUP-CHECKLIST Part 2, 'readable error reports')

VERIFIED. next.config.ts line 47 'const nextConfig: NextConfig = {' and line 132 'export default nextConfig' — bare export, no withSentryConfig, so no source-map upload; production traces would be minified, failing SETUP-CHECKLIST.md Part 2 line 19. The build-time vars are already reserved: TECH-ARCHITECTURE.md lines 238-240 (SENTRY_AUTH_TOKEN 'server/build-time only (source maps)', SENTRY_ORG, SENTRY_PROJECT), SUPABASE-VERCEL-SETUP.md line 92 (table row: SENTRY_AUTH_TOKEN/ORG/PROJECT, 'Source-map upload', server/build-time), WORKFLOW.md line 255 (SENTRY_AUTH_TOKEN among server-only secrets). CLAUDE.md's Hosting note requires calling out any next.config.ts change.

*Evidence:* next.config.ts lines 47, 132; SETUP-CHECKLIST.md line 19; docs/TECH-ARCHITECTURE.md lines 238-240; docs/SUPABASE-VERCEL-SETUP.md line 92; docs/WORKFLOW.md line 255

**Fix:** In the phase-C install PR: wrap the export with withSentryConfig so source maps upload only when SENTRY_AUTH_TOKEN is present (CI at .github/workflows/ci.yml runs pnpm run build with no such secret — the build must still pass without it), keep securityHeaders/headers() byte-identical unless the CSP decision resolves to Option A, and call the config change out per CLAUDE.md's Hosting note.

### [partial → SYS3] Sentry env vars in .env.example + Vercel (SETUP-CHECKLIST Part 2 last box)

VERIFIED, evidence tightened. git show HEAD:.env.example (names only) contains NEXT_PUBLIC_SITE_URL plus commented Supabase/Turnstile/Resend/Mailchimp/Upstash names and zero SENTRY names (grep -ci sentry = 0). The docs reserve the names: TECH-ARCHITECTURE.md lines 237-240 (NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT — the auditor's '235-240' included the two PostHog lines) and SUPABASE-VERCEL-SETUP.md line 63 (NEXT_PUBLIC_SENTRY_DSN in the env block; the auditor's '62' is PostHog) + table rows 92-93 ('Sentry no-ops when blank'). The auditor's workspace note is CONFIRMED: a direct Read of .env.example returns 'directory denied by permission settings' — it must be inspected/edited via git-aware tooling or with a permission prompt expected.

*Evidence:* git show HEAD:.env.example — 0 sentry matches; docs/TECH-ARCHITECTURE.md lines 237-240; docs/SUPABASE-VERCEL-SETUP.md lines 63, 92-93; Read of .env.example = permission denied (reproduced)

**Fix:** Phase C adds the four names (commented, names only, no values) to .env.example under an '# Error tracking — Sentry' block matching TECH-ARCHITECTURE.md's naming exactly; owner pastes the DSN value into Vercel (Production + Preview) per SUPABASE-VERCEL-SETUP.md's table and redeploys — per SETUP-CHECKLIST.md Part 2 line 20.

### [owner-action → SYS3] Sentry account + project + DSN handover (SETUP-CHECKLIST Part 1, all 4 boxes)

VERIFIED with one correction: docs/Website-Development-System/predevelopment/9. Account Creations.md line 21 lists '6. Sentry' in a plain numbered list of manual accounts — there are no checkboxes in that file, so 'unticked' was a mischaracterization; the substance stands (no evidence anywhere in the repo that a Sentry account or project exists). SETUP-CHECKLIST.md Part 1 (lines 9-12) is four owner boxes totaling ~5 minutes, and the DSN determines the exact ingest origin the CSP decision (separate finding) needs to name.

*Evidence:* docs/Website-Development-System/development/error-tracking/SETUP-CHECKLIST.md lines 7-12; docs/Website-Development-System/predevelopment/9. Account Creations.md line 21 ('6. Sentry', no checkbox syntax in file)

**Fix:** Owner: sentry.io → free account → Create Project → platform Next.js → name it palestine-house → copy DSN → hand over per the checklist's own script ('Set up error tracking from docs/error-tracking — here's the Sentry DSN'). Do it BEFORE the phase-C sprint so the CSP decision can name the real ingest origin.

### [owner-action → SYS3] Production alert rule + inbox confirmation (SETUP-CHECKLIST Part 3, both boxes)

VERIFIED. SETUP-CHECKLIST.md Part 3 (lines 22-25): create the Sentry alert rule 'new issue in Production → email me immediately' and confirm the account email is a daily-read inbox. Pure Sentry-side configuration, no repo state to check. The dependency the auditor noted is real: Part 2 line 18 says environments must be tagged first so 'alerts (below) fire on Production only'.

*Evidence:* docs/Website-Development-System/development/error-tracking/SETUP-CHECKLIST.md lines 18, 22-25

**Fix:** Owner clicks it in Sentry after the install PR merges; Claude Code supplies the exact click path in the phase-C close-out; sequence after environment tagging is verified on a Preview deploy.

### [missing → SYS3] Deliberate test error fired and removed (SETUP-CHECKLIST Part 4, all 3 boxes)

VERIFIED. SETUP-CHECKLIST.md Part 4 (lines 27-31): deliberate test error behind a hidden path, triggered once, removed in the same sprint, owner confirms the alert email and dates the confirmation — 'An unverified alert channel is the same as no alert channel' is the checklist's own line 31. The repo-rules framing checks out: CLAUDE.md Git rules forbid pushing to main and reserve merges for the owner, so the probe rides branch → PR → Preview → merge twice (install+route, then removal); the PP8 probe-then-remove precedent is real (commit ea471ea 'probes committed'). Keeping the probe on a public hidden path (not behind the approval gate) is sound guidance — it keeps the test independent of auth state and adds no gated surface.

*Evidence:* SETUP-CHECKLIST.md lines 27-31; CLAUDE.md Git rules; git log: ea471ea 'PP8 8-k round 2: … probes committed, 0034 live on prod'

**Fix:** Phase C plans a throwaway route (e.g. /api/sentry-check throwing only when hit with a nonce query param) in the install PR, an owner step to hit it once on Production and confirm the email, and a same-sprint removal PR — exit checklist not tickable until the removal is merged and the owner's dated 'alert received' lands in PROJECT-STATUS.md.

### [missing → SYS3] Copy map: docs/error-tracking/ folder in repo (+ overlooked: Stripe content in the guide and user-update template too)

VERIFIED, with one addition the auditor under-scoped. The copy map (error-tracking/00-START-HERE.md lines 21-27) sends the folder minus the skill to docs/error-tracking/ and says docs/INCIDENT-LOG.md is 'created at first incident' — so its absence today is correct, as claimed. Glob docs/error-tracking/** and docs/INCIDENT-LOG.md = nothing; content exists only in the untracked system folder. ADDED: the Stripe/payment adaptation is NOT only a handle-error.md problem — ERROR-TRACKING-GUIDE.md line 39 (checks 'the Stripe dashboard (payments)'), lines 41-45 (whole section 5, ''Payment failed' — read this before ever panicking'), line 56 (Stripe/card-number scrubbing), and USER-UPDATE-TEMPLATE.md's payment-helper message all assume a Stripe checkout; Palestine House takes no payments (no stripe dependency, conversion is the Apply form). Placeholders verified present: [PROJECT_NAME] (handle-error.md 3/6, INCIDENT-LOG-TEMPLATE.md 1), [OWNER_NAME]/[SITE_NAME] (USER-UPDATE-TEMPLATE.md 19/33/37/45).

*Evidence:* error-tracking/00-START-HERE.md lines 21-27; Glob results (no docs/error-tracking, no docs/INCIDENT-LOG.md); ERROR-TRACKING-GUIDE.md lines 39, 41-45, 56; USER-UPDATE-TEMPLATE.md placeholder grep; package.json (no stripe)

**Fix:** Phase C copies ERROR-TRACKING-GUIDE.md, SETUP-CHECKLIST.md and templates/ to docs/error-tracking/ with placeholders filled AND the payment/Stripe passages in the guide and the payment-helper message in USER-UPDATE-TEMPLATE.md replaced with this site's real silent-failure surfaces (Resend contact/Ask-HQ, Mailchimp lead magnets, approval-gate denials); commits them to git; leaves INCIDENT-LOG.md uncreated per the SOP.

### [missing → SYS3] Copy map: .claude/skills/handle-error/SKILL.md

VERIFIED with one correction. .claude/skills/ contains only close/SKILL.md and sprint-prompt/SKILL.md; the copy map (00-START-HERE.md line 26) requires handle-error.md → .claude/skills/handle-error/SKILL.md. The needed adaptations check out: [PROJECT_NAME] at lines 3/6; Stripe hardcoded in the description (line 3) and Investigate step 2 (line 28); 'production is read-only to you' (line 16) matches the existing supabase-prod-readonly MCP rule. CORRECTION: the auditor called /browser-qa (referenced at line 32) a 'testing-module deliverable, phase B' — wrong. The SOP's development copy map (development/00-START-HERE.md lines 25 and 33) maps templates/browser-qa.md → .claude/skills/browser-qa/SKILL.md as one of the THREE core development-module skills (sprint-prompt, close, browser-qa); this repo adopted two of the three. The testing module's skill is activate-testing. So the dangling /browser-qa reference is a base-module (phase A) adoption gap, and the underlying tool (Playwright MCP / Agent Browser per BROWSER-TOOLS.md) is already available in this environment as the global […]

*Evidence:* Glob .claude/skills/** = close, sprint-prompt only; error-tracking/handle-error.md lines 3, 6, 16, 28, 32; development/00-START-HERE.md lines 25, 33; development/templates/browser-qa.md exists in system folder; package.json (no stripe)

**Fix:** Phase C writes .claude/skills/handle-error/SKILL.md adapted to Palestine House: drop Stripe, name the real log surfaces (Sentry, Resend, Mailchimp, Vercel, Supabase test-mirror; correct-denial logic maps to the is_approved gate), keep the two closure rules verbatim. The /browser-qa reference resolves by phase A copying templates/browser-qa.md → .claude/skills/browser-qa/SKILL.md per the SOP's own copy map (not by stubbing).

### [partial → SYS1] handle-error's dependency docs absent from repo docs/

CORRECTED from 'missing' — the auditor missed a file. The skill's 'Read, don't restate' list (handle-error.md lines 10-16) binds six docs. Present in repo: docs/WORKFLOW.md, docs/SUPABASE-MCP-SAFETY.md (both confirmed via Glob docs/*.md). Absent at the exact cited paths: docs/ROLLBACK.md, docs/ENV-VARS-SAFETY.md, docs/templates/BUG-FIX-PROMPT-TEMPLATE.md, docs/templates/POST-LAUNCH-BACKLOG-TEMPLATE.md (docs/templates/ does not exist). BUT the repo HAS docs/ROLLBACK-RUNBOOK.md — a rollback doc the auditor never mentioned. It is migration-0030-specific ('Rollback runbook — undoing migration 0030', written at PP7 step 7-f), not the general production-rollback decision tree the system's development/ROLLBACK.md provides (revert-the-PR / instant-restore / DB caveat), so the gap is real but the fix must reconcile, not blind-copy: two unlinked docs both named 'rollback' would be worse. Similarly, ENV-VARS-SAFETY content substantially exists in repo canon (WORKFLOW.md section 14, lines 248-262, plus SUPABASE-VERCEL-SETUP.md) — CLAUDE.md's smallest-safe-change rule argues for repointing or […]

*Evidence:* handle-error.md lines 10-16; Glob docs/*.md — includes ROLLBACK-RUNBOOK.md, WORKFLOW.md, SUPABASE-MCP-SAFETY.md; excludes ROLLBACK.md, ENV-VARS-SAFETY.md; Glob docs/templates/** = none; docs/ROLLBACK-RUNBOOK.md lines 1-11 (0030-specific scope); docs/WORKFLOW.md lines 248-262; system folder: development/ROLLBACK.md, ENV-VARS-SAFETY.md, […]

**Fix:** Phase A copies the two templates to docs/templates/ (placeholders filled, Vercel specifics verified). For ROLLBACK: copy system ROLLBACK.md to docs/ROLLBACK.md WITH a cross-link to the existing ROLLBACK-RUNBOOK.md (0030-specific) so there is one general entry point — or, smaller, adapt the handle-error skill to cite ROLLBACK-RUNBOOK.md plus the general revert-the-PR flow; owner picks. For ENV-VARS-SAFETY: either copy it or repoint the skill at WORKFLOW.md section 14, which already carries the same rules. If phase A does not own doc adoption, […]

### [missing → SYS2] Regression-test rule depends on phase-B artifacts

VERIFIED. handle-error.md line 48 requires the fix's regression test in tests/e2e/ with a matching docs/FEATURE-LIST.md line and optional @morning tagging; INCIDENT-LOG-TEMPLATE.md lines 5-7 make 'no Closed without a regression test' an enforced closure rule. None of the substrate exists: Glob tests/** = nothing, no docs/FEATURE-LIST.md, package.json scripts are only dev/build/start/lint/typecheck, and .github/workflows/ci.yml runs install + gitleaks + typecheck + lint + build — no test step. Door A (Sentry install) works standalone; the lane's regression step cannot until the testing module lands.

*Evidence:* handle-error.md line 48; INCIDENT-LOG-TEMPLATE.md lines 5-7; Glob tests/** = none; package.json lines 6-12; .github/workflows/ci.yml step list (no test run)

**Fix:** Sequence phase B before C, or document an interim rule that incidents log 'regression test owed — testing module pending' instead of Closed; the owner should not consider the full incident lane live until phase B ships tests/e2e + FEATURE-LIST + the @morning set.

### [partial → SYS3] Error boundaries exist but report nothing (user-context hook point)

VERIFIED. src/app/global-error.tsx lines 6-11 and src/app/error.tsx lines 7-12 both type the error prop but destructure only reset — no captureException, no console.error; a root-layout crash renders politely and is recorded nowhere. TECH-ARCHITECTURE.md line 83 anticipates 'global-error.tsx — root error boundary (Sentry, if used)'. Both files carry brand-voice new-string copy ('That didn't work.' etc.) that must not change. One softening of the auditor's fix: their claim that route-level errors are 'auto-captured by the client instrumentation' is not guaranteed across SDK setups — Sentry's own Next.js scaffold adds Sentry.captureException(error) in a useEffect in BOTH boundaries; doing both is the safe minimal change.

*Evidence:* src/app/global-error.tsx lines 6-11; src/app/error.tsx lines 7-12; docs/TECH-ARCHITECTURE.md line 83

**Fix:** In the phase-C install PR, add Sentry.captureException(error) inside a useEffect in global-error.tsx AND error.tsx (imports only, zero rendered-copy changes) — behavior-preserving when the DSN is blank.

### [partial → SYS3] CLAUDE.md claim 'PostHog/Sentry optional, no-ops when env vars absent'

VERIFIED. CLAUDE.md's integrations bullet, docs/README.md line 56 ('PostHog + Sentry (optional)' among integrations that 'no-op when env vars are absent'), and TECH-ARCHITECTURE.md lines 29 and 56 all describe Sentry as an optional in-scope integration — but no Sentry code exists to no-op (and no posthog package either), so those lines are aspiration, not evidence of wiring; correctly not a conflict. docs/SECURITY-CHECKLIST.md line 88 confirmed: unticked box under section 9 — 'PII is minimized in logs; Sentry scrubs request bodies; analytics masks sensitive fields' — which phase C's scrubbing config would make tickable.

*Evidence:* CLAUDE.md 'Integrations (in scope…)' bullet; docs/README.md line 56; docs/TECH-ARCHITECTURE.md lines 29, 56, 60; docs/SECURITY-CHECKLIST.md line 88; package.json (no sentry/posthog)

**Fix:** Phase C makes the sentence true for Sentry (guarded init = genuine no-op when DSN blank) and ticks the SECURITY-CHECKLIST section-9 scrubbing box with a dated note; PostHog stays unwired unless the owner separately asks.

---

## 6. Tracker truth — PROJECT-STATUS.md and ROADMAP.md vs reality

Every contested claim survives verification: PROJECT-STATUS.md §1 (lines 11–13, 15) still narrates PP7-BUILT / prod-on-0033 / three-owner-tasks while the same file's line 148 (D-PP-s signed off LIVE 2026-08-20), line 190 (0034 APPLIED TO PRODUCTION 2026-08-20) and line 191 (RESOLVED in PP8) record the later events, and ROADMAP.md line 152 is frozen at '🔵 BUILT 2026-08-20 … two independent review rounds' although three 8-k rounds ran (commits b7d7f4e, ea471ea, c7d8333) and the row's own exit gate demands 'trackers flipped and Stage 4 closed'. The auditor's line citations needed four corrections (exit-gate rows are lines 36/40 not 37/43; the PR-#82 record is line 75 not 74; ROADMAP's merged PP5 row is line 147 not 144; the D-PP-k supersession is line 136), and one premise was wrong: the testing/error-tracking scope is not an open framework choice — the SOP being audited against already prescribes Playwright (docs/Website-Development-System/development/testing-setup/SETUP-CHECKLIST.md: @playwright/test via pnpm, tests/e2e/, PLAYWRIGHT_BASE_URL) and Sentry (development/error-tracking/), while the repo trackers and package.json genuinely contain zero mention of either. One overlooked gap added: §2 carries a duplicate un-struck 'PP6 — CMS v2 ⬜' row (line 73) directly above the struck RETIRED row (line 74), so a status scan shows a phantom not-started sprint; the PP8 merge PR number remains unfillable locally until a git fetch (origin/main is at dda9c0f, the PR #87 pp7-close merge).

### [conflict → SYS1] §1 'Right now' Current-stage cell is stale and self-contradictory

VERIFIED. docs/PROJECT-STATUS.md line 11 (4,776 chars) says 'Production is on migration `0033`' and ends '🚀 LAUNCHED · Stage 4 is at PP7 BUILT, awaiting review + the owner's production run'. The same file's line 190 (§7 issue #2) says '✅ RESOLVED AND APPLIED TO PRODUCTION (2026-08-20) — migration `0034`. The owner ran supabase/sql/bundles/PP8_apply_prod.sql; re-verified independently through the [read-only MCP]'. Ground fact: PP8 merged 2026-08-20, prod on 0034 (4·22·88).

*Evidence:* awk NR==11 docs/PROJECT-STATUS.md: 'Production is on migration `0033`' + 'Stage 4 is at PP7 BUILT, awaiting review'; awk NR==190 grep -o: 'RESOLVED AND APPLIED TO PRODUCTION (2026-08-20) — migration `0034`'

**Fix:** Rewrite the Current-stage cell: Stage 4 COMPLETE — PP8 merged 2026-08-20 (PR # to be read from origin/main after a fetch — origin/main is stale at dda9c0f, the PR #87 pp7-close merge); production on 0034; 4 · 22 · 88 live; no active sprint. Keep the PP7 narration as a '(Prior:)' block per the file's own convention.

### [missing → SYS1] §1 'Active sprint' cell still narrates PP7 review round 4

VERIFIED. docs/PROJECT-STATUS.md line 12 (~36KB) opens 'ROUND 4 (2026-08-16, same day): the independent review returned BLOCKING again — 5 blocking + 3 medium — and all 8 are FIXED and PROVEN' — that is PP7's round 4; PP8 never even became the lead of this cell. PP7 merged 2026-08-17 (PR #86, main=1d1f80a per line 78) and PP8 merged 2026-08-20; no sprint is active.

*Evidence:* awk NR==12 docs/PROJECT-STATUS.md head -c 900: 'ROUND 4 (2026-08-16, same day): the independent review returned BLOCKING again'

**Fix:** Replace the cell's lead with 'None — Stage 4 closed 2026-08-20; next sprint to be planned (system-alignment + testing + error-tracking)', pushing the current text into the '(Prior:)' chain the cell already uses.

### [conflict → SYS1] §1 'Next action' still assigns the owner two tasks that are done

VERIFIED. Line 13: 'PP8 is BUILT (2026-08-20) — three things are the owner's: ① apply 0034 to production ② sign off the public copy on the LIVE site (D-PP-s) ③ place the off-machine copy of the 297-file cold archive'. ① done: line 190 '0034 APPLIED TO PRODUCTION (2026-08-20)'. ② done: line 148 '✅ SIGNED OFF BY THE OWNER 2026-08-20, on the LIVE site … Verified at PP8 8-f'. ③ remains (no record of completion anywhere; MEMORY concurs). The '8-k is not optional' clause is also satisfied: rounds 1–3 = commits b7d7f4e ('step 8-k: the review was right for the sixth time'), ea471ea ('8-k round 2 … 0034 live on prod'), c7d8333 ('8-k round 3: the defect class is now PREVENTED').

*Evidence:* docs/PROJECT-STATUS.md lines 13, 148, 190; git log on claude/sprint-pp8-final-verification: b7d7f4e, ea471ea, 3d7abf7, c7d8333; docs/ROLLBACK-RUNBOOK.md exists at docs/ROLLBACK-RUNBOOK.md

**Fix:** Rewrite Next action to: ① owner places the off-machine archive copy (ROLLBACK-RUNBOOK §1, copy 3 — the one remaining PP8 item) · ② plan the next sprint. Move the current text into '(Prior:)'.

### [missing → SYS1] §1 'Last updated' frozen at 2026-08-17

VERIFIED. Line 15 leads '2026-08-17 — PP7 MERGED (PR #86) and PRODUCTION CUT OVER. Prod on `0033`', yet the file's last commit is 3d7abf7, 2026-08-20 20:30 +0530 ('PP8: owner signed off the public focus-area copy'), and PP8 merged that day.

*Evidence:* awk NR==15 docs/PROJECT-STATUS.md; git log -1 --format='%h %ad %s' -- docs/PROJECT-STATUS.md → '3d7abf7 2026-08-20 20:30:40 +0530'

**Fix:** Prepend '2026-08-20 — PP8 MERGED (PR # after fetch), Stage 4 CLOSED; prod on 0034; D-PP-s signed off live; 8-k rounds 1–3 complete' to the Last-updated cell, keeping the existing text as the next '(Prior:)' entry.

### [missing → SYS1] §2 sprint-board PP8 row: status 🔵, no PR, 'production is the owner's to apply', 'Still owed: 8-k, live sign-off, archive'

VERIFIED (one evidence correction: the row is 2,161 chars, not 3.2KB). Line 79: status 🔵, PR column empty, date 2026-08-20, notes contain '`0034` is applied to TEST, and production is the owner's to apply' and 'Still owed: the independent review (8-k), the owner's live copy sign-off, and the off-machine archive copy'. All three 'owed' items except the archive copy have since happened (lines 148, 190; commits b7d7f4e/ea471ea/c7d8333).

*Evidence:* awk NR==79 docs/PROJECT-STATUS.md (2,161 chars): '| 🔵 | | 2026-08-20 |' + grep -o 'Still owed…' verbatim match

**Fix:** Flip to ✅, fill Merged-PR # and date 2026-08-20, and rewrite the stale tail: 0034 on PROD (owner-applied, independently re-verified via read-only MCP per line 190), 8-k ran three rounds (round 3 = defect class PREVENTED, c7d8333), D-PP-s signed off live; only the off-machine archive copy outstanding.

### [partial → SYS1] §2 Stage 4 header row says 'PP1–PP7'

VERIFIED with corrected citations and a weakened second half. Line 66: '**Stage 4 — Private Platform Revamp (PP1–PP7 · owner-directed 2026-08-10)**' — the stage ran through PP8, so PP1–PP8 is right. But the exit-gate-row precedent is thinner than claimed: the rows are '| **Stage 0 exit gate**' at line 36 and '| **Stage 1 exit gate — barebones site LIVE**' at line 40 (NOT lines 37/43, which are the '1.1 GitHub' and 'S3 Auth complete' sprint rows), and Stages 2 and 3 have NO exit-gate rows at all — so a Stage 4 exit-gate row is optional, not pattern-mandated.

*Evidence:* grep -n '^| \*\*Stage' docs/PROJECT-STATUS.md → lines 36, 40, 66 only; awk NR==37 = '1.1 GitHub (protection + CI)', NR==43 = 'S3 Auth complete'

**Fix:** Smallest safe change: edit line 66 to 'PP1–PP8'. The 'Stage 4 exit gate — CLOSED 2026-08-20' row is a nice-to-have, not required by the board's pattern (Stages 2–3 closed without one); the closure fact belongs in the flipped PP8 row either way.

### [partial → SYS1] §2 PP5 row never flipped to merged (and uses an off-legend symbol)

VERIFIED with two citation corrections. Line 72: PP5 row status 🔶 with empty PR column and 'Built + pushed' notes — 🔶 is not in the line-26 legend (⬜ 🔵 ✅ ⏸ only). The merge IS recorded elsewhere: PROJECT-STATUS line 75 (PP6a row, NOT 74 — line 74 is the struck '~~PP6~~ RETIRED' row): 'PR #82, merged 2026-08-15', line 12 '(Prior:) PP6a — ✅ MERGED 2026-08-15 as PR #82 (main = 81f1707; PP5 and docs/pp6-replan landed in the same PR…', and change-log line 220; ROADMAP.md's merged PP5 row is line 147 ('✅ MERGED 2026-08-15 inside PR #82 — stacked under PP6a'), NOT line 144 (which is PP2's row).

*Evidence:* docs/PROJECT-STATUS.md lines 26, 72, 75, 220; docs/ROADMAP.md line 147 (grep -n 'PP5' → 147 carries the MERGED text)

**Fix:** Flip line 72's PP5 status to ✅ and put 'inside PR #82 (stacked under PP6a), 2026-08-15' in the PR column — mirroring ROADMAP line 147's wording exactly, inventing nothing.

### [partial → SYS1] §2 duplicate un-struck PP6 row above the RETIRED one (auditor missed this)

ADDED. docs/PROJECT-STATUS.md carries the PP6 sprint twice: line 73 '| PP6 — CMS v2 (+ migration 0029) | ⬜ | | | Per topic: one guide slot + full management…' (un-struck, reads as a not-started sprint) directly above line 74 '| ~~PP6 — CMS v2 (+ migration 0029)~~ **RETIRED 2026-08-14 (D-PP-k)** | ⬜ | …'. A status scan of the board shows a phantom ⬜ sprint in a closed stage.

*Evidence:* awk NR==73 and NR==74 docs/PROJECT-STATUS.md — both rows begin '| PP6 — CMS v2 (+ migration 0029)'; only line 74 is struck through

**Fix:** Delete the duplicate un-struck row at line 73 (its scope text survives verbatim in the retired row's split note); one-line removal, no copy invented.

### [missing → SYS1] §8 change log has no PP8-merge entry; top entry's 'Still owed' list is stale

VERIFIED. Top entry line 199 (2026-08-20, 'PP8 BUILT') ends 'Still owed: the independent review (8-k), the owner's production apply of `0034`, the live copy sign-off, and the off-machine archive copy.' — three of four have since happened. grep for 'PP8 MERGED' across the file returns nothing; no entries exist for 8-k rounds 2–3 (ea471ea, c7d8333), the 0034 prod apply, the D-PP-s live sign-off (3d7abf7), the admin-gate revert-the-revert (ad74bec), or the merge.

*Evidence:* awk NR==199 tail -c 600 docs/PROJECT-STATUS.md; grep -n 'PP8 MERGED' docs/PROJECT-STATUS.md → 0 hits; git log: b7d7f4e, ea471ea, 30647fc, 3d7abf7, ad74bec, c7d8333

**Fix:** Add one new top change-log row: '2026-08-20 — PP8 MERGED (PR # after fetch) — STAGE 4 CLOSED. 8-k rounds 1–3 (round 2 verification hardening + 0034 live on prod; round 3 admin-gate revert-the-revert ad74bec + prevention c7d8333), D-PP-s signed off live. Owed: off-machine archive copy.' Leave the BUILT entry untouched as history.

### [missing → SYS1] ROADMAP Stage 4 PP8 row: '🔵 BUILT', 'two independent review rounds', exit gate 'trackers flipped and Stage 4 closed' unmet

VERIFIED. docs/ROADMAP.md line 152 (2,728 chars): '**PP8 — Final verification** 🔵 **BUILT 2026-08-20** on claude/sprint-pp8-final-verification (8-a…8-k, incl. two independent review rounds)'. Three rounds actually ran (b7d7f4e, ea471ea, c7d8333). The row's exit-gate cell ends '…the independent review returns approve (or its findings are fixed and re-reviewed); trackers flipped and Stage 4 closed.' — the flip is Stage 4's last unmet exit clause. git diff origin/main confirms this header phrase is the only ROADMAP change the PP8 branch made.

*Evidence:* awk NR==152 docs/ROADMAP.md (head + tail); git diff origin/main -- docs/ROADMAP.md shows the single-row change; PP7 row line 151 shows the flipped format '✅ MERGED PR #86 + PRODUCTION RUN COMPLETE 2026-08-17'

**Fix:** Flip the row header to '✅ MERGED PR # (after fetch) 2026-08-20 — Stage 4 CLOSED; prod on 0034; three independent review rounds', mirroring line 151's PP7 format; leave the scope/exit-gate cells as written history.

### [conflict → SYS1] ROADMAP parked note under the Stage 4 table still quotes the pre-reconciliation public numbers

VERIFIED. Line 154 blockquote still says the public proof band 'still says "11 focus areas · 33 topics · 200+ · 297 · 120"' and defers reconciliation to a later public sprint. PP7 already did it: line 151's notes say 'Public pages rebuilt to the real 4 · 22 · 88 with the copy rule enforced by a checker (D-PP-a/D-PP-s)', PROJECT-STATUS line 148 records the numbers moving 11·33·297 → 4·22·88 with '200+ checklist items removed outright', and the owner signed the copy off on the LIVE site 2026-08-20 (3d7abf7). Note the blockquote's last clause — stale OneDrive workspace page-copy docs — is NOT discharged and must survive any edit.

*Evidence:* awk NR==154 docs/ROADMAP.md (head + tail, 696 chars); docs/ROADMAP.md line 151; docs/PROJECT-STATUS.md line 148; commit 3d7abf7

**Fix:** Prefix the blockquote 'RESOLVED via D-PP-s in PP7; owner signed off live 2026-08-20' while keeping the OneDrive-staleness clause as the surviving owner follow-up; pair with the D-PP-a owner decision below.

### [owner-action → decision] Open decision D-PP-a still 'OPEN (parked 2026-08-10)' though its substance was discharged by D-PP-s

VERIFIED. Line 158: D-PP-a status '**OPEN (parked 2026-08-10)** — also: the OneDrive page-copy docs for the workspace pages are stale against the mockup (owner follow-up)'. The terminology/numbers half is done (line 148 D-PP-s; ROADMAP line 151), but the row carries a second, undischarged half — the stale OneDrive page-copy canon — so a silent flip would lose it. CLAUDE.md's 'Proof numbers' paragraph still teaches 11 · 33 · 200+ · 297 · 120 and says 'parked as D-PP-a', now contradicting the live site.

*Evidence:* docs/PROJECT-STATUS.md lines 148, 158 (both read in full via head/tail); CLAUDE.md 'Proof numbers: 11 focus areas · 33 topics · 200+ checklist items · 297 templates · a 120-day launch … parked as D-PP-a'; docs/ROADMAP.md line 154 tail

**Fix:** Owner confirms D-PP-a is discharged by D-PP-s or re-scopes it to the surviving OneDrive page-copy staleness; then the alignment sprint flips the row and updates CLAUDE.md's proof-numbers paragraph to 4 · 22 · 88 (a factual correction, not invented copy).

### [owner-action → decision] Open decision D-FA11-b still 'OPEN 2026-07-17' but its subject matter was deleted

VERIFIED (citation tightened). Line 157: D-FA11-b (add K rows to OneDrive canon; bump full-ingest guards 30→33 / 267→297 / 1–10→1–11) status '**OPEN 2026-07-17**'. The PP series then replaced the whole model: ROADMAP line 136 (Stage 4 supersession block, not '~130') — 'D-PP-k the 22 replace the 33; old topics/groups/elements/297 templates + Storage objects are deleted in 0030' — and prod now holds 4·22·88, so the guards and canon rows D-FA11-b wants to fix describe a deleted schema. ROADMAP line 148 also records that scripts/ingest-content.ts (the script carrying those guards) was rewritten for the new content tree in PP6b.

*Evidence:* docs/PROJECT-STATUS.md line 157 (read in full); docs/ROADMAP.md line 136

**Fix:** Owner closes D-FA11-b as 'superseded by D-PP-k / the 0030 cutover' or re-scopes it to whatever OneDrive-canon work survives; engine flips the row only after that call.

### [partial → decision] Known issues §7: #1 and #4 remain Open; #1 is the hardening hook for the new sprint

VERIFIED. Line 189 (#1, Medium): public writes live without Upstash/Turnstile, status 'Open — fix in the backlog hardening pass (ex-S14)'; ROADMAP line 45 marks that hardening 'required before scale' and line 52 gives the ex-S14 brief (docs/sprint-prompts/s14-final-hardening-relaunch.md). Line 193 (#4, Low): .docx upload refusal, 'Open — self-diagnosing; close it when the owner next uploads by hand and reports what the message says'. Lines 190 (#2) and 191 (#3) are correctly RESOLVED 2026-08-20 / in PP8. §6 line ~181 also still lists Upstash/Turnstile as 'TBD — backlog', consistently.

*Evidence:* docs/PROJECT-STATUS.md lines 189, 190, 191, 193 (heads + tails read); docs/ROADMAP.md lines 45, 52, 53

**Fix:** Owner decides whether the ex-S14 hardening (issue #1) rides inside the new sprint or stays backlogged — ROADMAP's own 'required before scale' argues for including it; schedule a hand-upload retest for #4 inside the B-testing phase either way.

### [missing → SYS3] Error tracking and automated testing absent from trackers and codebase — but NOT an open framework choice: the SOP already prescribes Playwright + Sentry

Absence VERIFIED: grep -iE 'sentry|posthog|error.track|observab|monitor' over docs/ROADMAP.md → 0 hits; 0 'sentry' and 0 'posthog' hits in docs/PROJECT-STATUS.md; package.json scripts are dev/build/start/lint/typecheck only (no test script) and no @sentry/posthog/vitest/playwright/jest dependency exists; ROADMAP's QA vocabulary is manual multi-hat passes (line 53 ex-S13; PP8 scope). But the auditor's fix rested on 'no precedent exists in the repo' — WRONG for this audit: the system folder prescribes both. docs/Website-Development-System/development/testing-setup/SETUP-CHECKLIST.md: 'install Playwright in the repo as a dev dependency (@playwright/test, via pnpm)', tests in tests/e2e/, PLAYWRIGHT_BASE_URL, secrets referenced by name only; development/error-tracking/ (00-START-HERE.md, ERROR-TRACKING-GUIDE.md, SETUP-CHECKLIST.md, handle-error.md) is built entirely around Sentry, including PII scrubbing and a /handle-error flow; testing-setup/templates/MORNING-CHECK-TEMPLATE.md ships a pnpm-based CI morning check.

*Evidence:* grep runs above (all rc=1 / count 0); package.json lines 6–12; docs/Website-Development-System/development/testing-setup/SETUP-CHECKLIST.md lines 17–18, 29; activate-testing.md line 10; error-tracking/00-START-HERE.md line 9; templates/MORNING-CHECK-TEMPLATE.md lines 32–36

**Fix:** The new Stage 5 rows adopt the SOP's prescriptions rather than opening a choice: B-testing = Playwright per testing-setup/SETUP-CHECKLIST.md (@playwright/test dev dependency via pnpm, tests/e2e/, PLAYWRIGHT_BASE_URL named-only); C-error-tracking = Sentry per error-tracking/SETUP-CHECKLIST.md (SENTRY_AUTH_TOKEN is already a named server-only secret in CLAUDE.md — names only, owner adds values in Vercel). Any deviation from the SOP's picks is an owner decision, not a sprint-time improvisation.

### [missing → SYS1] PP8 merge PR number is not recoverable from the local repo

VERIFIED, but re-statused: this needs a git fetch, not an owner decision (fetch is read-only and within repo rules; only push/merge require the owner). origin/main is at dda9c0f 'Merge pull request #87 from 86400websites/docs/pp7-close' — the PP8 merge commit exists in no local ref (the PP8 commits live only on claude/sprint-pp8-final-verification and its origin twin). git diff --stat origin/main -- docs/PROJECT-STATUS.md docs/ROADMAP.md → 11 and 2 lines, confirming the on-disk trackers are origin/main plus exactly the PP8-branch edits. gh CLI is absent on this machine (per environment memory), so the PR number comes from the fetched merge-commit subject, not from gh.

*Evidence:* git log --oneline -5 origin/main → dda9c0f / f7a62cd / 1d1f80a; git diff --stat output; git branch -a --contains c7d8333 → only the sprint branch and its remote

**Fix:** Alignment sprint step 1: git fetch origin, read the PP8 merge commit subject on origin/main for the PR number, then use it at all five flip sites (§1 Current-stage, §1 Last-updated, §2 PP8 row, §8 new change-log row, ROADMAP line 152) — never guess it.

---

## 7. Delivery-workflow practice + launch/after-launch posture

The auditor's six claims are substantively correct and all verified against real files, but three need corrections: the "no standing review-prompt doc" assertion in claim 5 is false (.claude/skills/sprint-prompt/SKILL.md embeds a Codex review prompt template and codifies the risky-sprints-only rule at lines 31 and 93, meaning the selective-review regime lives in TWO repo places that any adoption decision must change together), the custom-domain move in claim 2 is further along than stated (the code side shipped in pre-S13 2026-06-30 with owner switch-on steps already recorded in PROJECT-STATUS §4 and a relaunch-verification row parked in ROADMAP §A), and claim 6's fix should use the Sentry env-var names and @sentry/nextjs slot already reserved in docs/TECH-ARCHITECTURE.md rather than inventing new ones. One gap the auditor missed entirely: the system's TECHNICAL-INTEGRITY.md Code Check requires six PR checks and the repo's ci.yml implements only four of them (typecheck/lint/build + a gitleaks scan the system's own YAML lacks) — no format check, no test step, no critical-vulnerability audit, with dependabot.yml as only partial cover. The regime-level picture stands: review-gate wording is a genuine repo-vs-system conflict (though practice reviews far more sprints than the 15 saved records suggest), and the QA/Launch-Gate testing and error-tracking layers have no repo counterpart at all, which by the system's own blocking rule means this auth+DB site currently fails QA-CHECKLIST Part 1.

### [conflict → SYS1] System WORKFLOW.md vs repo docs/WORKFLOW.md — review gate

VERIFIED, with one addition. Repo docs/WORKFLOW.md covers the full branch → PR → Preview → merge chain, rollback (§13), env/DB safety (§14) and never-do-this rules (§15), but §8 (line 170) is titled 'Optional Codex / agent review workflow' ('optional but valuable on risky changes', line 172) and §12 line 224 reads 'After Preview passes and review (if any) is done'. The system's WORKFLOW.md §6–7 makes review a hard gate on every PR: immutable [MERGE_BASE_SHA]..[HEAD_SHA] (line 67), saved record at docs/code-reviews/[SPRINT_ID]-[SLUG]-review.md (line 71), re-review after any substantive change (line 73), and 'a gate, not a suggestion — a Blocking finding is never merged' (line 79). Its §8 (lines 86–91) formalizes a Production smoke test that repo §12 covers in one line (line 228). ADDITION the auditor missed: the selective regime is codified in a SECOND repo location — .claude/skills/sprint-prompt/SKILL.md section F (line 31: Codex review 'only for risky sprints (auth, approval gate, RLS/schema, env, headers, CSP); otherwise say review is optional and skip it') plus its embedded […]

*Evidence:* docs/WORKFLOW.md lines 170–177, 224, 228; docs/Website-Development-System/development/WORKFLOW.md lines 65–91 (§6 mandatory review, §7 gate language, §8 smoke test); .claude/skills/sprint-prompt/SKILL.md lines 31, 93–98; docs/PRODUCTION-CUTOVER-RUNBOOK.md lines 11–20

**Fix:** Owner decision folded into alignment: choose the regime. If adopting the SOP gate, rewrite docs/WORKFLOW.md §8 to the mandatory language (immutable SHA range, saved record at the system naming, re-review after substantive change, no merge over Blocking) AND update .claude/skills/sprint-prompt/SKILL.md section F to match, plus add the Production smoke-test checklist to §12. If keeping selective-by-risk, record the divergence deliberately in the system's project notes — the skill's section F already states the selective rule precisely and can be […]

### [missing → SYS1] System LAUNCH-CHECKLIST.md — net-new install, partially applicable

VERIFIED with one material tightening. No docs/LAUNCH-CHECKLIST.md exists (full docs/ listing checked); nearest artifacts are the S7 launch sprint (docs/sprint-prompts/s7-final-review-launch.md, docs/code-reviews/s7-qa-findings.md — both exist) and PRODUCTION-CUTOVER-RUNBOOK.md (a PP7 DB cutover doc). Site launched 2026-06-19 (ROADMAP.md line 96, S7 'LAUNCHED 2026-06-19, PR #29') on the Vercel domain per D3 (SUPABASE-VERCEL-SETUP.md line 9). Phase-1 monitoring gaps confirmed live today: no docs/testing-setup/, docs/test-reports/ or tests/ (all absent), .github/workflows/ holds only ci.yml, no error tracking (no sentry/posthog in package.json or src/), no uptime/domain-expiry monitoring recorded anywhere (grep across docs/ and src/ finds only a Lighthouse line in TECH-ARCHITECTURE.md line 364); the DB-restore-rehearsal box is the one item already satisfied (2026-08-16). TIGHTENING the auditor understated: the custom-domain move is NOT greenfield — the pre-S13 sprint (2026-06-30) already shipped the code side (www.palestine-house.com + palestine-house.com in PRODUCTION_HOSTS, […]

*Evidence:* docs/Website-Development-System/development/LAUNCH-CHECKLIST.md lines 13, 42–46, 60–72; testing-setup/00-START-HERE.md lines 43–45 (retrofit rule verbatim); docs/SUPABASE-VERCEL-SETUP.md line 9; docs/ROADMAP.md lines 54, 96; docs/sprint-prompts/pre-s13-ui-polish-and-domain.md lines 20, 76; PROJECT-STATUS.md grep 'Still pending (owner dashboard): […]

**Fix:** Install LAUNCH-CHECKLIST.md as the runbook for the future custom-domain switch-on, merging Phases 2–3 with the owner steps already recorded in PROJECT-STATUS §4 and the pre-S13 record (env var flip + Supabase auth URLs + redeploy + relaunch verification) rather than duplicating them; treat the Phase-1 monitoring block as the retrofit backlog (Launch-Gate testing → phase B; error tracking + morning check + uptime/expiry monitors → phase C); mark the restore-rehearsal box satisfied with the PP7 2026-08-16 evidence and the sending-domain SPF/DKIM […]

### [partial → SYS1] System ROLLBACK.md — mostly covered; three small additions

VERIFIED. Repo docs/WORKFLOW.md §13 (lines 234–244) carries the same decision tree as the system doc's core (revert PR default, Vercel Promote-to-Production for emergencies, fix main afterward, 'A Vercel rollback restores code, not the database'), and docs/ROLLBACK-RUNBOOK.md (231 lines) is a far stronger production-specific rollback doc than the SOP's generic one — rows+bytes model (lines 15–26), three-step 0033→0030 order (lines 29–50), archive fingerprint verification (lines 54–91), rehearsed end-to-end 2026-08-16 (§4, lines 196–230). The system ROLLBACK.md steps with no repo equivalent are exactly as claimed: Step 5 post-rollback smoke test incl. primary conversion (lines 51–55), Step 6 root-cause + feed the missed check back into QA/SECURITY checklists (lines 57–62), Step 7 mandatory incident note in the decision log, 'an unrecorded incident is a scheduled repeat' (lines 64–68). Repo §13 ends at the force-push warning with none of these. Note for the fix: the repo's decision-log locations already exist (docs/notes/decisions.md and PROJECT-STATUS §4/§5), and until a QA-CHECKLIST […]

*Evidence:* docs/WORKFLOW.md lines 234–244; docs/ROLLBACK-RUNBOOK.md lines 15–26, 29–50, 196–230; docs/Website-Development-System/development/ROLLBACK.md lines 51–68; docs/notes/decisions.md exists

**Fix:** Smallest change confirmed correct: append the three missing steps to docs/WORKFLOW.md §13 — post-rollback smoke test (broken flow + primary conversion), add the check that would have caught it to docs/SECURITY-CHECKLIST.md (or docs/QA-CHECKLIST.md once installed), and an incident note in docs/notes/decisions.md / PROJECT-STATUS decision log. Do not install a duplicate generic ROLLBACK.md beside the superior migration-specific runbook.

### [missing → SYS2] System QA-CHECKLIST.md — net-new install; automated-suite blocking gate currently violated

VERIFIED in full. No docs/QA-CHECKLIST.md exists. Repo WORKFLOW §9/§11 cover the thin subset claimed. Net-new items all confirmed at the cited lines: blocking automated-suite gate for auth/gated/DB sites (line 21, 'this is a blocking gate, not a preference'), denied-state auth-test rule (line 24, 'at least one denied-state assertion per protected boundary'), default performance budget mobile Lighthouse ≥90 / LCP ≤2.5s / CLS ≤0.1 / ~300KB JS (line 47), visual QA evidence at 320/768/1440 (lines 76–79), verbatim content fidelity (lines 50–53), regression spot-check (lines 99–100). The gate is violated today: package.json scripts (lines 6–12) are dev/build/start/lint/typecheck only — no test script; no tests/ dir; no docs/test-reports/. Dangling references all confirmed absent from the repo: docs/TECHNICAL-INTEGRITY.md, docs/BROWSER-TOOLS.md, /browser-qa skill (.claude/skills holds only close + sprint-prompt), docs/testing-setup/, docs/templates/VERCEL-PREVIEW-TEST-TEMPLATE.md (no docs/templates/ at all). docs/sprint-prompts/0d-vercel-preview-test.md is exactly 5 lines — a plumbing […]

*Evidence:* docs/Website-Development-System/development/QA-CHECKLIST.md lines 21, 24, 47, 50–53, 76–79, 99–100; package.json lines 6–12; docs/TECH-ARCHITECTURE.md line 364; .claude/skills/ = close, sprint-prompt; docs/sprint-prompts/0d-vercel-preview-test.md (5 lines); no docs/templates/, docs/testing-setup/, docs/test-reports/, tests/

**Fix:** Install as docs/QA-CHECKLIST.md with commands filled (pnpm run typecheck / lint / build; test = the phase-B e2e suite once it exists; performance budget = the repo's already-recorded Lighthouse 95+ rather than the system default 90), install or trim the referenced companions (VERCEL-PREVIEW-TEST-TEMPLATE at minimum; strike the BROWSER-TOOLS//browser-qa references until those exist), and close the blocking gate via the testing-setup retrofit in phase B — the doc's own line 21 means this auth+DB site does not pass its Part 1 until the suite […]

### [partial → decision] System CODEX-REVIEW-PROMPT.md — practice exists but recording is unstandardized (auditor's 'no standing prompt' claim corrected)

PARTIALLY CORRECTED. True: docs/code-reviews/ holds 15 files, none matching the system's [SPRINT_ID]-[SLUG]-review.md pattern (e.g. pp7-round-3-ledger.md, pp8-security-verification.md, s7-qa-findings.md); the system's record+SHA discipline (CODEX-REVIEW-PROMPT.md lines 8–10: record file, immutable MERGE_BASE..HEAD, 'a branch name or main..branch is not an exact range'; line 26: one APPROVE/REQUEST CHANGES verdict) has no repo equivalent; root AGENTS.md exists as claimed. TWO CORRECTIONS: (1) docs/sprint-prompts/ holds 45 files, not 47 — and two are not sprint records (README.md, 0d-vercel-preview-test.md), so ~43 records. (2) 'No standing review-prompt doc exists in the repo' is FALSE — .claude/skills/sprint-prompt/SKILL.md line 93 carries a standing 'Codex review prompt template (Mode A, section F — risky sprints only)' with the full template body, and line 31 codifies when it applies. Also the auditor's framing overstates the review gap: ROADMAP.md rows record independent Codex verdicts inline for many sprints with no saved file in docs/code-reviews/ (S8 'Codex review = approve', […]

*Evidence:* ls docs/code-reviews/ = 15 files (none *-review.md); ls docs/sprint-prompts/ = 45 files; .claude/skills/sprint-prompt/SKILL.md lines 31, 93–98; docs/Website-Development-System/development/CODEX-REVIEW-PROMPT.md lines 8–10, 26; AGENTS.md at repo root; docs/ROADMAP.md lines 96–113 (inline Codex verdicts per sprint row)

**Fix:** Same owner decision as the WORKFLOW review-gate conflict. If mandatory: install CODEX-REVIEW-PROMPT.md + templates/CODEX-REVIEW-PROMPT-TEMPLATE.md, adopt the [SPRINT_ID]-[SLUG]-review.md naming, and save one record per sprint. If selective-by-risk stays: the rule is ALREADY written in .claude/skills/sprint-prompt/SKILL.md section F — the smaller fix is to align the installed system doc to cite that section and to standardize where inline ROADMAP verdicts get saved, so review evidence stops living only inside sprint-row prose.

### [missing → SYS3] Error tracking + post-launch monitoring absent (LAUNCH-CHECKLIST monitoring block, error-tracking pack)

VERIFIED with one tightening. Requirements confirmed in the system: error-tracking/SETUP-CHECKLIST.md Parts 1–4 (Sentry free tier, DSN as env var by name only, Production-only alert rule, deliberate test error fired and confirmed — 'an unverified alert channel is the same as no alert channel'); morning check via testing-setup/templates/MORNING-CHECK-TEMPLATE.md → .github/workflows/morning-check.yml (copy map, 00-START-HERE.md line 41); uptime/conversion canary + domain/SSL expiry alerts (LAUNCH-CHECKLIST.md lines 43–46). Repo side confirmed empty: no @sentry/* or posthog in package.json or src/, .github/workflows/ holds only ci.yml, no incident-log or monitoring config anywhere; live since 2026-06-19 with real partner accounts and only Vercel logs. TIGHTENING: the repo has already reserved the integration slot — docs/TECH-ARCHITECTURE.md line 56 names Sentry as the optional error tracker, line 141 lists @sentry/nextjs among optional deps, and lines 234–240 name the env vars (NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT); CLAUDE.md lists SENTRY_AUTH_TOKEN […]

*Evidence:* package.json (no sentry/posthog); grep src/ + next.config.ts = no matches; .github/workflows/ = ci.yml only; docs/Website-Development-System/development/error-tracking/SETUP-CHECKLIST.md lines 3–31; testing-setup/00-START-HERE.md line 41; LAUNCH-CHECKLIST.md lines 43–46; docs/TECH-ARCHITECTURE.md lines 56, 141, 234–240

**Fix:** Phase C installs the error-tracking pack per its SETUP-CHECKLIST using the env-var names already documented in TECH-ARCHITECTURE.md lines 234–240 (owner adds values in Vercel), fires and owner-confirms the deliberate Production test error, and enables the morning-check workflow once phase B's e2e suite provides taggable tests; uptime/SSL/domain-expiry monitors are owner-configured with alerts to a named inbox and recorded in PROJECT-STATUS.

### [partial → SYS1] System TECHNICAL-INTEGRITY.md Code Check vs repo ci.yml — three of six checks missing (overlooked by the auditor)

ADDED — the auditor treated docs/TECHNICAL-INTEGRITY.md only as a dangling link from QA-CHECKLIST, but it defines this dimension's CI contract and the repo diverges from it measurably. The system's Code Check (TECHNICAL-INTEGRITY.md lines 33–61) requires six PR checks: typecheck, lint, format:check (prettier --check), unit tests when present, build, and pnpm audit --prod --audit-level=critical, plus once-per-repo verified branch protection (lines 66–69). Repo .github/workflows/ci.yml implements typecheck, lint, build and install, and EXCEEDS the system with a gitleaks secret scan over full history (lines 34–37; the system's own YAML has no secret-scan step, though its WORKFLOW §4 line 51 requires one) — but has NO format check (prettier is not in package.json at all), NO test step, and NO audit step. .github/dependabot.yml (weekly npm + actions update PRs) partially covers the vulnerability wall but is not a merge-blocking audit. No docs/TECHNICAL-INTEGRITY.md exists, yet system WORKFLOW §7, QA-CHECKLIST line 18, and the templates all cross-reference it.

*Evidence:* docs/Website-Development-System/development/TECHNICAL-INTEGRITY.md lines 33–61, 63, 66–69; .github/workflows/ci.yml lines 34–37, 52–59; package.json devDependencies (no prettier); .github/dependabot.yml; system WORKFLOW.md line 77 ('the Code Check, docs/TECHNICAL-INTEGRITY.md')

**Fix:** Smallest safe alignment: add one step to ci.yml — pnpm audit --prod --audit-level=critical — and wire the test step when phase B's suite lands (pnpm run --if-present pattern). Do NOT adopt Prettier now: introducing format:check forces a repo-wide reformat, which violates the smallest-safe-change rule — record it as a deliberate divergence instead. Install a short filled TECHNICAL-INTEGRITY.md that names the existing ci.yml (including its gitleaks step, which the repo should keep as an addition to the system) as this repo's Code Check, so the […]

---

*Audit run 2026-08-21 in-session (workflow `wf_3ebbcc83-eba`, 14 agents). Saved as SYS1 sub-step 1a.*
