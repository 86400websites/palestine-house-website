# Test Report — Palestine House — 2026-11-17

The Launch Gate for **L1, the domain launch**: the release that puts the site on
`https://www.palestine-house.com`, adds the in-site video player and fixes the Reduce Motion
defect. One row of evidence per feature in [`docs/FEATURE-LIST.md`](../FEATURE-LIST.md); every
result in plain words. The newest report is the current truth: this one supersedes
[`2026-08-22-test-report.md`](./2026-08-22-test-report.md) and CR1's runs of 2026-11-02.

---

## Run header

- **Run type:** **FULL**. All 159 tests ran, on one worker, in 41.2 minutes (17:34–18:15 UTC):
  **all 159 passed at the first attempt**, with no retry, no flake and nothing skipped. This is the run
  the GO stands on. The runs before it are recorded under "The work behind this run".
- **Environment:** the deployed Vercel **Preview** of `5825a0d`, the commit that fixed the Codex
  review's finding, reached through the sanctioned protection bypass. `5825a0d` is the last commit
  with site code; `307b6ff` is the last with test code (AD-006's refined path, plus the review record),
  and every later commit is docs only, so the site code under test is the final head's, byte for byte.
  Preview URL recorded in the session log.
- **Data separation confirmed:** the three robot accounts exist **only** in the non-production
  Supabase project and signed in through the real `/login` form; a Preview wired to production
  could not have let them in.
- **Viewports:** desktop (1440) **and 320px**, both run.
- **Roles exercised:** anonymous ✅ · pending partner ✅ · approved partner ✅ · HQ admin ✅, plus
  the two disposable robot applicants of the apply journeys.
- **Feature list version:** approved by the owner 2026-08-22, CR1's changes accepted under the
  owner's hand-over (D-CR1-3), and two L1 changes: **AD-006** reworded (the video plays on the page),
  approved by the owner with the L1 plan, then given one added clause for the Codex review's
  regression check; **PG-012** added (Reduce Motion). Both changes are flagged for the owner's
  re-approval in the list's change log.
- **Totals:** 159 automated tests (3 robot sign-ins · 57 desktop · 57 at 320px · 16 + 16 morning ·
  10 journeys) → **159 PASS, all at the first attempt** · **0 FAIL** · manual lines:
  MN-001 PASS (standing), MN-002 and MN-003's last step due at launch · PR-001 to PR-003 **pending
  SYS1.5** (the controls do not exist yet, so they are not tested, not passed).
- **Real emails sent during this run:** 3 to the HQ inbox, all marked as robot tests (1 contact
  message and 2 new-application notifications), plus the applicant-side emails to the robots'
  undeliverable `.invalid` addresses, which arrive nowhere. Three complete runs reached the journeys
  on 2026-11-17 (`bb38c0c`, `07d08ed` and this one), so **9 robot emails** reached the HQ inbox in all;
  the targeted runs and the network-failed attempt sent none.

## Results

**A — the public shell: all PASS.** Every public page renders clean at both sizes with no console
error (PG-001); every same-origin link resolves (PG-002); a wrong URL gets the branded 404
(PG-003); header and footer are identical everywhere (PG-004); the retired workspace paths 307 to
`/dashboard` (PG-005); the numbers read 4 · 22 · 83 and no retired figure survives (PG-006); Apply
to Join is reachable from every page (PG-007); sitemap, robots and manifest expose only the public
shell, and the sign-in, gated and admin pages say noindex (PG-008); the header knows signed-in from
signed-out (PG-009); `/terms` is gone (PG-010); `/privacy` is the owner's policy (PG-011).
**PG-012 (new): with Reduce Motion on, every public heading and the sign-in, reset, Apply and
Contact forms can be seen**, at both viewports.

**B — the approval gate: all PASS.** The section that matters most. Anonymous visitors are held out
of all 28 gated routes and all six admin routes, with nothing gated in the raw response (AC-001,
AC-002, AC-009); a pending partner sees the pending notice and nothing else, in the page and in the
raw responses, and an empty search (AC-003, AC-004); a pending partner can reach `/account` and only
their own row (AC-005); an approved partner is never an admin (AC-006); the approved partner reaches
everything (AC-007) and the admin every admin screen (AC-008); login, logout, the signed-in redirect,
the wrong password and the reset request all behave (AC-010 to AC-013); Apply is sign-up end to end,
and HQ approval is the only unlock while a decline keeps the door shut (AC-014, AC-015).

**C — gated content: all PASS.** 5 · 6 · 6 · 5 focus areas holding 83 templates (CT-001); each card
shows exactly the private model (CT-002); all 22 guides open (CT-003); a template really downloads
through a signed URL and is refused to pending and anonymous callers at the issuer itself (CT-004,
CT-005); search works and leaks nothing (CT-006); a Draft focus area vanishes everywhere and returns
(CT-007); shared resources appear where they are borrowed (CT-008); with no video set, all 26 Watch
Video placements say "Video coming soon." and go nowhere (CT-009); Community Contacts links land on
the block (CT-010, see the observation below); the private chrome carries the community wording
(CT-011); a link to a gated page answers the first click, and React's fix is present (CT-012).

**D — forms and email: all PASS.** The contact and apply forms refuse bad input in the browser and on
the server (FM-001, FM-003), contact delivers (FM-002), a second application cannot be created
(FM-004), Community Contacts writes and sends nothing (FM-006), `/account` saves (FM-007). FM-005 and
FM-008 rest on MN-001, the owner's inbox check, as before.

**E — HQ admin: all PASS.** Approvals (AD-001), the pages editor (AD-002), the focus-areas editor
(AD-003), the files manager and its refusals (AD-004), admin management and its refusal to remove
yourself (AD-005). **AD-006: a YouTube link pasted in the CMS goes live with no code change and now
plays on the page.** On a dashboard card and on a focus-area card: nothing is framed before the
press; the press opens a player named for its card, framing exactly the privacy-enhanced embed
rebuilt from the pasted id; Escape on one and Close video on the other remove the frame and return
focus to Watch Video; the page never changes; nothing links out to YouTube; and clearing the link
brings the placeholder back. It also drives the Codex review's path (the search opened over the
player, then Back): the page stays locked while the search is open and scrolls again once both close.

**F — protection.** PR-004 PASS: the six headers, the CSP shaped as shipped, its only third-party
allowance still the YouTube embed origin. PR-001 to PR-003: **N/A, pending SYS1.5**. The rate limit
and the bot check do not exist yet (§7 #1); not tested, not passed. SYS1.5 has not merged, so this
does not block the verdict; the owner chose to launch first (D-L1-a).

**G — integrations: all PASS.** The session probe answers a yes or no and nothing else (IN-001);
Mailchimp stays a clean no-op (IN-002).

**H — manual lines, the owner's part:**

| ID | State | What remains |
|---|---|---|
| MN-001 | PASS 2026-08-22, standing | This run's ROBOT-TEST emails are in the HQ inbox if the owner wants to look again; nothing in L1 changed an email. |
| MN-002 | **Due at launch** | `DOMAIN-LAUNCH-RUNBOOK.md` step 5: one real contact message on `www`, an admin screen, a video playing, and Reduce Motion on a real phone. |
| MN-003 | **Partial, closes at launch** | The last unproven step (typing a new password and signing in with it) is `DOMAIN-LAUNCH-RUNBOOK.md` step 2's proof: a real reset of the owner's own account, on `www`. |

## The work behind this run

**The player was seen working, not only asserted.** With a real video link set on one TEST focus
area and one TEST section (and cleared afterwards), the approved robot opened the player at 1440
and 320: 960×540 and 320×180 frames (16:9), the production video playing, focus on Close video on
open, the page scroll-locked, the frame gone and focus back on Watch Video after Escape, no
horizontal overflow, and no console error or CSP violation from the site's own pages.

**PG-012 was watched failing before it was trusted.** Against the Preview of `db7421d`, which still
had the old reveal wrapper, it went red at both viewports: a heading stuck at opacity 0 for the
full 15 seconds, and the screenshot showed the home page as a photo with no heading, no text and no
buttons. Against the fixed Preview it passed at both.

**The Codex review's defect was reproduced in the real app before it was called fixed.** The
regression added to AD-006 was run against the Preview of `07d08ed` (separate scroll locks): it went
red exactly at its lock check (expected `hidden`, received empty). Against the fixed Preview it passed.

**The full runs of 2026-11-17, in order:**

| Site code | Result | What happened |
|---|---|---|
| `bb38c0c` | 158 passed · 1 flaky | CT-010's first attempt (see Observations) |
| `07d08ed` | 159 / 159 | 158 at the first attempt; AC-001 passed on retry after a dropped connection. Superseded: the Codex fix changed the site code |
| `5825a0d` | 146 passed · 1 failed (AC-003 raw, both attempts) · 2 flaky (PG-006, PG-009) · 10 did not run | **Network failure, not a site result.** AC-003 (raw) timed out with its requests hanging, then its retry hit `ECONNRESET`; PG-006 and PG-009 hit `ERR_CONNECTION_TIMED_OUT` and passed on retry. No gate assertion ever received a response to judge. The desktop project failed, so the journeys that depend on it did not run. The connection was checked healthy and the whole suite re-run |
| **`5825a0d`** | **159 / 159, all at the first attempt** | **This run: the one the GO stands on** |

One targeted run of AD-006, between those, also went red at its very end: its clean-up could not
restore the focus area (a save did not confirm in time, and the clean-up swallows its own errors), so
the test's final check correctly found the robot's video link and guide lines still in place. TEST
was put back by hand and proven byte-identical to production (the guide's checksum matches); the
next run of AD-006 passed whole.

## Observations (none is a failure of this run)

0. **Two kinds of credential appeared in local error logs during the earlier runs**, both printed by
   Playwright in a network-error call log: the Preview protection-bypass header, and a session
   cookie of the pending test robot (a non-production account that can see nothing private). Both
   were scrubbed from every local log, the local test artifacts were deleted, and the last run
   redacted them as it wrote. Neither is in this report or the repo. Rotating the bypass value is
   the owner's option.
1. **CT-010 stumbled once, in the `bb38c0c` run** (§7 #22, Low). Its first attempt on desktop clicked
   the footer's Community Contacts link and landed on `/support#community-contacts` with the block
   rendered, but the page did not scroll down to it within 15 seconds; the automatic retry passed in
   10 seconds. The links are full page loads and the explorer scrolls to the block once, when it
   mounts, so a block that streams in later is not scrolled to. L1 touched none of that path, and the
   machine was at about 450 MB free memory. Logged, with a fix ready if it recurs.
2. **`/apply` offers Google no canonical** (§7 #19, Low): Next 15 streams its metadata into the body
   for Googlebot. Its title still counts and the private pages' noindex is honoured. Fixed in SYS1.5.
3. **Memory and network.** This machine had 450 to 760 MB free throughout, below the level at which
   page loads have timed out before, so every full run used one worker. One attempt still lost to a
   failing network connection (the table above); the run after it was clean.

## Failures, grouped

**None open, and none in this run.** Every red of the day is explained above: transport failures
with no response received (AC-001, AC-003, PG-006, PG-009), a pre-existing scroll race logged as
§7 #22 (CT-010), and one test clean-up that did not finish (AD-006, TEST restored and proven). PG-012's
and AD-006's reds against the unfixed Previews were the new checks proving themselves on the old code.

## Verdict

GO requires all four: a FULL run on the current head; 100% of automated lines passing with every
manual line evidenced or scheduled; no test skipped, disabled, weakened or edited without the
feature-list change being re-approved and logged; and no line sitting at "pending" for a sprint that
has already merged.

**All four hold as of the owner's sign-off on 2026-11-18**, which re-approved both feature-list changes. This is a FULL run on the final head's site
code (`5825a0d`; later commits change only test code and docs); every automated line passed at the
first attempt; and PR-001 to PR-003 wait on SYS1.5, which has not merged. No test was skipped,
disabled or weakened, but two feature-list changes are flagged rather than yet re-approved (AD-006's
added clause and the new PG-012), so the third condition is met when the owner re-approves them with
the GO signature (given). The in-session independent review approved; **Codex round 1 asked for one change, which is
fixed and proven here, and Codex round 2 approved the fix on 2026-11-18**
([`l1-domain-launch-review.md`](../code-reviews/l1-domain-launch-review.md)).

- **Verdict:** **GO** · **Date:** 2026-11-18 · **Signed:** the owner, in session ("GO, approved both
  test lines"), re-approving FEATURE-LIST's PG-012 and AD-006's added clause · Full-run report: this file.
- **On the owner's GO:** the Launch Gate line in [`LAUNCH-CHECKLIST.md`](../LAUNCH-CHECKLIST.md)
  records this run, and the launch proceeds by [`DOMAIN-LAUNCH-RUNBOOK.md`](../DOMAIN-LAUNCH-RUNBOOK.md).

## Public-repo rule

This report contains no real person's identity, no account id, no project ref, no credential, no
gated content excerpt and no storage path. The only addresses referenced are the robots'
undeliverable `.invalid` ones and the site's public domains.
