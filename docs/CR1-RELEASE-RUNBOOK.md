# CR1 release runbook: production content replacement

> **Every production step here is run by the owner.** This engine writes to production
> through no channel: `scripts/cr1-content.ts` demands a typed confirmation of the
> production project ref at a real terminal for every mutating step, refuses outright
> when stdin is not a terminal, and the Supabase MCP this engine can reach is read-only
> on production. Claude verifies production read-only afterwards, on request.
>
> **Rehearsed on TEST first.** See "What the rehearsal proved" below. The production
> path is the same code with the production credentials and the typed confirmation.

---

## Before you start

**1. Keep this working folder until the release is closed.** Do not do the usual
fresh-clone reset yet. `docs/source-assets/content-refresh-cr1/` is gitignored and holds
the delivery, the private spec, the identity map, and (after step 2) the production
snapshot and archive. A fresh clone has none of them, and a rollback cannot run without
them.

**2. Four names in `.env.local`** (values from your password manager, never pasted
anywhere else): `PROD_SUPABASE_URL`, `PROD_SUPABASE_PUBLISHABLE_KEY`, `PROD_ADMIN_EMAIL`,
`PROD_ADMIN_PASSWORD`. The account must be an admin **and** approved. `.env.local` itself
is never committed.

**3. Run commands from the repo root in the VS Code terminal.** A pipe or a background job
is refused on purpose.

**4. The two pull requests.** #103 (the dependency update and the lost-click fix) goes
first and on its own. Merge it with **Create a merge commit**, not squash or rebase, and wait
for its Production deployment to reach Ready. A squash or rebase makes #104 conflict, which
needs a new push and so a new review. It changes no content and does not start the release.

#104 (this release) is ready and not yet merged: CI green, which you confirm by eye, because
GitHub does not require it on `main`; the Vercel Preview tested against TEST at desktop and
320px; `pnpm run test:e2e` green against it; the independent review approved at the head you
are about to merge. One thing only you can see: the marked-TEST email from that run's contact
journey arrived in the inbox.

**5. Leave `/admin/content` alone from step 2 until the release is closed,** and tell anyone
else who holds an admin login. The tool helps, but only so far. Before it has started,
`switch` refuses if content has changed since the snapshot; once it has started, it compares
nothing, and a text edit made while it is stopped part-way is simply overwritten. `rollback`
refuses if a file was added in the CMS, or if a file CR1 added was replaced there. If a file
CR1 replaced was replaced again, it names it and lets you stop and download it first, because
the rollback will leave that file attached to nothing. And any words edited after step 2 go
back to their step 2 version on a rollback, without a message.

**Video links: wait until the release closes,** then add any of the 26 with no code change.
Production holds none today, so nothing is lost by waiting.

- **Before step 6: don't.** The live Focus areas screen stays the old one until #104 deploys, and
  a refused link there can blank that card's photo on the next Save. Nothing later would catch
  that, because the snapshot would record the blank as the original. The 4 `/dashboard` links have
  no field yet at all, and a link added between steps 2 and 4 makes `switch` refuse.
- **From step 6 until the release closes:** a new link stops nothing and `verify` only notes it,
  but a rollback takes it off again. Reload the page first: a form left open from before still
  holds the old words, and its Save would write them back.

**6. An approved account that is not an admin, for step 7.** Your admin login downloads through a
different Storage policy, so it cannot show a partner's view. If you do not have one, apply at
`/apply` with a second address of yours and approve it at `/admin/approvals`, any time before
step 4. Without it, the partner's download path on production rests on the rehearsal and on the
read-only comparison under "What the rehearsal proved", and you should say so when you close.

---

## The order, and why

```
 1  extract      offline       rebuild the private spec, verify every file
 2  snapshot     read-only     rows and original bytes, into the private archive
 3  upload       additive      127 new objects at new keys; no partner can reach them
 4  switch       LIVE          rows repointed, new rows added, words rewritten
 5  verify       read-only     --phase switched
 6  merge        LIVE          the PR deploys the new pages
 7  smoke        read-only     the site, as a partner
 8  retire       LIVE          the 12 superseded rows go; their files stay
 9  verify       read-only     --phase retired
10  hold         -             at least 48 hours
11  cleanup      DESTRUCTIVE   superseded objects removed; the archive keeps them
12  verify       read-only     --phase retired, once more
```

**Database before code, deliberately.** The site must not advertise 83 resources while
still serving the old release, so the content moves first. For the few minutes between
steps 4 and 6 the old pages show the new content, with one cosmetic oddity: each Overview
appears as an extra row in the old templates grid. From step 4 until step 8 the 12 rows
still to be retired appear with an `OLD-` badge. Nothing is broken in either window, and
every download works throughout.

**Rows before bytes, always.** An object no row points at is inert and retryable. A live
row pointing at a deleted object is a broken download.

---

## The steps

Every command is the same shape. `--dry-run` on any step prints the plan without creating
a client, so it cannot touch a row, an object or a session.

### 1. Extract (offline)

```powershell
pnpm exec tsx scripts/cr1-extract.ts
```

Expect: `delivery verified against its manifest: 156 files`, `22 focus areas, 127 learner
files`, `replaced templates 76 · added 7 · retired 12 · cross-links 13`, and `guide words
verified against their documents: 22/22`. Anything else: stop.

### 2. Snapshot and archive (read-only)

```powershell
pnpm exec tsx scripts/cr1-content.ts --step snapshot --target prod
```

Expect: `22 focus areas · 110 private rows · 5 sections` and `110 objects verified on
disk`. Any other count: stop and ask. It refuses if a live title differs from what CR1 was
built against, or if a focus area holds a file more or fewer than expected; if that happens,
stop and ask, because someone has edited content in the CMS since. On `CR1 STEP FAILED` for
any other reason, run the same command again, and do not go on until it passes.

**Then copy the whole `docs/source-assets/content-refresh-cr1/` folder, not only
`_private/prod/`, to a second place off this machine.** With `E:\cr1-backup` standing for
wherever that is:

```powershell
robocopy docs\source-assets\content-refresh-cr1 E:\cr1-backup\content-refresh-cr1 /E
```

Robocopy's exit code 1 means files were copied. Check that `_private\prod\backup` in the
copy holds 110 files (after a retaken snapshot, one more for each file replaced in between;
the printed `110 objects verified on disk` is what counts). A rollback also needs
`_private\cr1-spec.json`, and going forward again needs the delivery. The historical 297-file
archive is not a backup of this release.

### 3. Upload (additive, invisible)

```powershell
pnpm exec tsx scripts/cr1-content.ts --step upload --target prod
```

Type the production project ref when asked. Expect: `127 uploaded and read back`. Safe to
repeat; a repeat reports `already present and matching`. Steps 2, 3 and 4 are best run in
one sitting: on TEST the upload took about six minutes and the switch under two.

Ask Claude to verify read-only here if you want a second pair of eyes: object count and
every checksum against the delivery.

### 4. Switch (partners see new content from here)

Pick a quiet time. Have the PR open in another tab.

```powershell
pnpm exec tsx scripts/cr1-content.ts --step switch --target prod
```

Type the project ref. Expect `created 29 · repointed 98`, focus areas rewritten 22,
sections rewritten 5. If it stops part-way for any reason, run the same command again: it
looks before it writes.

If it refuses with `The live content has changed since the snapshot`, nothing was written.
Someone edited content after step 2, and the message names the first difference. Find out
what and why, then:

- `a row not in the snapshot`: a file was added. Download it if you need it, delete it at
  Admin, Content, Files, and run this step again. Do not retake the snapshot for this: step 2
  would refuse, because CR1 was built without that file.
- Anything else: move `docs\source-assets\content-refresh-cr1\_private\prod\snapshot.json`
  aside, run step 2 again, and come back here.
- If you got here from an interrupted rollback, run `--step rollback` again instead. If you
  already moved the snapshot aside, step 2 refuses, so put it back first.

### 5. Verify

```powershell
pnpm exec tsx scripts/cr1-content.ts --step verify --phase switched --target prod
```

Expect `127 downloads byte-checked` and `ALL CHECKS PASSED`.

**If it fails, run the same command again a minute later.** It is read-only, asks for no
confirmation and changes nothing. If that run passes, carry on. On the second run:

- Any line naming an `HTTP` status or `no signed URL`, or a `CR1 STEP FAILED` message, alone
  or mixed with other lines: stop and ask, and do not roll back. Usually that is the
  connection, Storage or the credentials, and a rollback needs the same services. It can
  also be a missing file, so it does need someone to look.
- Lines naming only a focus area's own fields (`N: title`, `summary`, `expanded copy`, `guide
  body`, `photograph changed`, `card order changed`, `video link changed`): do not roll back. The
  tool writes back what it reads for most of these, so someone has saved that card in the CMS
  during the release. Stop and ask: re-running `switch` usually repairs just that card.
- Only other lines in the `FAILED` list (a file's bytes or title, counts, a wrong object): stop,
  and go to Rollback.

A `note:` line is not a failure. `video link added since the snapshot` means a finished video
went in through the CMS, which is fine.

**Failure lines can name private files.** Paste them only into this private session with Claude,
never into a pull request or a tracked document. The repository is public.

### 6. Merge the PR

Merge #104 on GitHub with **Create a merge commit**. Wait for Vercel: Deployments, latest Production, status **Ready**. If the
build fails or never reaches Ready, do not go on to step 7: stop and ask.

### 7. Smoke, as a partner

Signed in on the live site as the approved non-admin account (item 6 above), desktop and phone:

- `/dashboard` says "Practical resources for your own Palestine House."
- `/setup`: open Get Legally Ready. Overview, Simple Guide card, Templates (the logo, plus
  until step 8 the two rows badged `OLD-`, which is expected), and under Shared resources the
  Master Opening Checklist. Download each one once.
- Read Now on any guide. Press Ctrl+K and search "Master Opening": one template result.
- `/support#community-contacts` lands on the contact block; its button opens `/contact`.
- `/terms` shows the site's 404. `/privacy` shows the new policy.
- Watch Video is greyed out on every card, and pressing it says "Video coming soon."
- Every menu link answers the first click.

Anything wrong here: stop before step 8 and ask. Steps 8 to 12 check the database and Storage
as the admin, not these pages, so nothing later will catch it.

### 8. Retire

```powershell
pnpm exec tsx scripts/cr1-content.ts --step retire --target prod
```

It re-verifies the replacements first and refuses if anything is off. Type the project
ref. Expect `12 rows removed`.

If it refuses, run it once more a minute later. Still refused: stop and ask. Do not roll back,
and do not go on to step 9, which would list the rows still there as failures and point you at
Rollback. Only a message saying `Nothing retired` means no row changed. After any other
message earlier rows may already be gone, and a re-run handles that.

### 9. Verify

```powershell
pnpm exec tsx scripts/cr1-content.ts --step verify --phase retired --target prod
```

Expect `ALL CHECKS PASSED`. If it fails, treat it as at step 5. The content is now fully
released. Ask Claude to confirm read-only.

### 10. Hold

Wait at least 48 hours. Until step 11, rollback needs no restore.

### 11. Cleanup (the one destructive step)

```powershell
pnpm exec tsx scripts/cr1-content.ts --step cleanup --target prod
```

It removes only objects named in this target's own snapshot, only those with a verified
archived copy, and asks the database again immediately before each batch whether anything
references them. It lists nothing and matches no pattern. Type the project ref. Expect
`110 superseded objects removed · bucket now holds 127`.

If it refuses or fails, run it once more a minute later. Still refused: stop and ask, and do
not close the release. Only a message saying `No object removed` means nothing changed. After
any other message earlier batches may already be gone, which is safe, because each is archived
and no row points at it. A re-run counts only what was left, so its first figure is lower than
110, and `bucket now holds 127` is what counts. This happened on the rehearsal: a real
`fetch failed` stopped it after 40, and the re-run finished the job.

### 12. Final verify

```powershell
pnpm exec tsx scripts/cr1-content.ts --step verify --phase retired --target prod
```

Expect `ALL CHECKS PASSED`. If it fails, treat it as at step 5; a rollback from here starts
with `restore-objects`.

Only when it passes may you close the release and return to your usual clone routine. Keep
the whole folder you copied at step 2: the archive alone cannot run a rollback. To roll back from a
fresh clone, first put it back with
`robocopy E:\cr1-backup\content-refresh-cr1 docs\source-assets\content-refresh-cr1 /E`. Use
robocopy for this, because File Explorer can leave out delivery files on the way back.

---

## Rollback

**Code and content roll back separately.** If the PR has been merged, do code first: it is
instant, and the previous pages tolerate either content state for a few minutes. If it has
not (a failed step 5), skip Code: the live pages are already the previous ones.

**Code.** Vercel, Deployments, the deployment before #104's merge, **Promote to Production**.
That is the #103 deployment, so the dependency update and the lost-click fix stay live. If the
merge itself must go, revert #104's merge commit through a PR afterwards, and not #103's.

**Content.**

```powershell
# Only if step 11 has run:
pnpm exec tsx scripts/cr1-content.ts --step restore-objects --target prod

# Rows, focus-area text, guide bodies and section copy. It refuses, changing nothing, if a
# file was added in the CMS since CR1 or a file CR1 added was replaced there, and says which
# focus area to deal with. If a file CR1 replaced was replaced again, it names it before you
# confirm: stop there and download it if you need it, because it ends up attached to nothing.
pnpm exec tsx scripts/cr1-content.ts --step rollback --target prod

# The retired rows, which need their ORIGINAL ids, so this is SQL you run by hand:
pnpm exec tsx scripts/cr1-content.ts --step rollback-sql --target prod
#   -> open docs/source-assets/content-refresh-cr1/_private/prod/rollback-retired-rows.sql,
#      paste it into the production Supabase SQL Editor, and run it once.
#      Skip this if step 8 never ran: the rows are still there and it changes nothing.
#      It prints a note that the restored rows take today's date as created_at. That is
#      expected here, and nothing reads that date on these rows.

# Field by field against the snapshot, must say MATCHES THE SNAPSHOT EXACTLY. If it does not,
# stop and ask:
pnpm exec tsx scripts/cr1-content.ts --step verify-rollback --target prod

# Only after that, the CR1 objects no row references any more. A file replaced in the CMS
# since CR1 shows here as `already absent`, and that replacement stays in the private bucket,
# reachable only in the Supabase Storage browser:
pnpm exec tsx scripts/cr1-content.ts --step remove-new-objects --target prod
```

Every step can be repeated if it stops part-way. To go forward again after a rollback,
start from step 3, and if you promoted an older deployment on Vercel, promote the CR1 one
again at step 6. If you reverted #104's merge, promoting is not enough, because `main` no longer
holds the code: at step 6, revert that revert through a PR and wait for its Production deployment
to reach Ready.

---

## What the rehearsal proved

The whole release ran on the non-production project forward and back seven times: from the
released state, and from straight after step 5, which is where a failed verify would send you.
The last run, with this version of the tool on the final packages, went back from the released
state with no hand fix and then forward again with no retry. Full figures are in the sprint
record, [`sprint-prompts/cr1-content-refresh.md`](./sprint-prompts/cr1-content-refresh.md).

- **Stopping is safe.** `upload` and `switch` were each stopped on purpose part-way, a real
  `Bad Gateway` hit mid-upload, and a real `fetch failed` hit mid-cleanup. Re-running the same
  command finished the job each time, and a further re-run of every step changed nothing.
- **Bytes are what they should be.** 127 downloads were byte-checked against the delivery, as
  a plain approved partner, after `switch`, after `retire` and after `cleanup`. Anonymous and
  pending callers were refused each time.
- **Nothing is removed on trust.** `retire` and `cleanup` each byte-check all 127 downloads
  themselves before removing anything, so neither depends on someone having read the earlier
  output.
- **Rollback is exact, from either state.** From the released state, with this tool
  (`restore-objects`, `rollback`, the SQL, `verify-rollback`, `remove-new-objects`), independent
  read-only fingerprints of the rows, focus areas, guide bodies, sections, groups and Storage
  objects all equalled the pre-CR1 baseline. From straight after `switch`, where the restore and
  the SQL have nothing to do, all six matched on an earlier tool, and the four compared matched
  again with the rollback code as it is now. "Exact" leaves out bookkeeping: rows' `updated_at`
  and restored objects' dates are new. On production the 12 restored rows also take today's date
  as `created_at`, which nothing reads. And a section saved with a blank link box holds a "no
  video" marker where there was nothing, which every reader, `verify-rollback` included, treats
  as no link.
- **The fingerprints earned their place.** One rollback wrote that marker onto all five
  sections, `verify-rollback` said it matched, and only the fingerprints caught it. It was fixed
  before the run above.
- **Video links are left alone.** On an earlier version of the tool, with a link already on a
  focus area and on a section, `switch` kept both, `verify` passed, and a rollback put both back
  exactly. A link added after the snapshot came off on rollback, on those rows only. With this
  version, `verify` notes such a link and passes, and it fails when a link the snapshot held has
  gone: both seen on the non-production project.
- **Production's rules match, read-only, on 2026-11-01.** Its 8 row and Storage policies, 100
  columns, 37 constraints, 2 buckets, and 46 functions with their grants equal the non-production
  project's, whitespace and comments aside. One function differs, `admin_cutover_focus_areas`, a
  one-off from an earlier sprint that nothing here calls. Ask Claude to repeat this before step 2
  if time has passed.
- **The refusals work.** No target, a misspelled target, missing credentials, a rollback before
  the old objects are restored, a `switch` or `snapshot` after someone edited content, and a
  `switch`, `snapshot` or `rollback` with a file added in the CMS were all refused, and the
  ledger shows no write from any of them.

**Proven only in a simulator** that runs the real tool on a fake backend, not on the
non-production project: a rollback interrupted part-way and the refusals that follow it, a
failed retake of the snapshot, a file replaced in the CMS after step 4, and the `verify` lines
for a `429`, a `404`, a stalled download and a deleted object.

**What it could not prove, because it has not happened.** This has never run on production.
The production path differs in four ways: the credentials, the typed confirmation, the rollback
SQL's `created_at` noted above, and the download proof, which the approved admin carries there
rather than a plain partner, because
production has no disposable accounts, and the tool ignores any test-account names it finds. So
on production `verify` prints `as the approved admin` and `denied checks: anonymous`; step 7 is
where a real partner's view gets checked.
Production's private rows were compared read-only with TEST's before the rehearsal and match
by checksum and size.
