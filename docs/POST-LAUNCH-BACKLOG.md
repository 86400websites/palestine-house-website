# Post-Launch Backlog — Palestine House

**This file is a pointer, not a backlog.** It holds no priorities and decides nothing.

The backlog of record for this project is **[`ROADMAP.md`](./ROADMAP.md) §A → "Post-MVP backlog (do not
build during MVP)"**, together with the **"Absorbed from the retired S13/S14 sprints"** block directly
under it. That is where an item lives, where it is worded, and where its order is decided.

Nothing anywhere — including everything indexed below — is committed work until it appears as a **sprint
row in `ROADMAP.md` §B**. Until then it is an idea that has been written down so it stops arguing for
attention.

> **Why this file exists at all.** The `Website-Development-System` copy map expects a
> `docs/POST-LAUNCH-BACKLOG.md`, and this repo has always kept its backlog in `ROADMAP.md` instead. The
> [compliance audit](./notes/system-compliance-audit-2026-08-21.md) surfaced the mismatch and its fix was
> the one taken here: cross-link, never duplicate ownership. Two backlog homes would be worse than none,
> because the second one is always the stale one.

---

## The one rule this file is here to enforce

**A new idea that arrives mid-sprint goes to the backlog. It never goes into the open sprint.**

The sprint's scope is closed the moment the sprint starts ([`WORKFLOW.md` §0](./WORKFLOW.md#0-palestine-house-sprint-discipline):
one sprint at a time, one sprint = one focused branch/PR; [`CLAUDE.md`](../CLAUDE.md): smallest safe
change, never bundle sprints). So:

- Never "quickly slip in" an item because the file is already open.
- Never fix a backlog item silently inside an unrelated PR. It ends up unreviewed and undocumented.
- Never park a **bug** here. Bugs go to [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §7 with a severity.
- Never park an **unresolved choice** here. It goes to `PROJECT-STATUS.md` §5 (Open decisions) so the
  owner can settle it; once settled it moves to §4.

Say "not now, it is on the backlog" and mean it. A trusted backlog is what makes that a safe answer.

**Promotion.** A backlog item becomes work only by being scoped into a sprint — run `/sprint-prompt`,
save the brief in [`docs/sprint-prompts/`](./sprint-prompts/), add the row to `ROADMAP.md` §B, and
re-validate the item against the current repo first. Paths, routes and assumptions rot; several items
below are older than the platform they described.

**Nothing is deleted.** Parked is a status, not a fate. When an item is dropped, `ROADMAP.md` keeps the
line with a struck-through note and a reason — that is already the practice there (the removed booklet
lead magnet, the retired S13/S14 rows).

### One security clause that is not deferrable

The system's template lets hardening be parked as "required before scale". Read that narrowly here: only
**advanced** hardening (tighter limits, anomaly detection) is scale-deferrable. **Basic public-write abuse
control — a server-verified bot check and a rate limit, failing closed in Production — is launch-blocking
and may not be parked** ([`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) §8, §13, §15).

This site is the exception that proves it, deliberately and on the record: it launched at S7 with `/apply`,
contact and `/support` unthrottled, on an explicit owner decision (`PROJECT-STATUS.md` §5 D-S6-a, logged as
known issue §7 #1), on the reasoning that the HQ approval gate keeps any abuse out of gated content. That
debt sat on this backlog from 2026-07-02 to 2026-08-21, and `ROADMAP.md` §B calls it the oldest open debt in
the project — carried since S3c launched Apply unthrottled. It is now scheduled as sprint **SYS1.5** (D-SYS-9). Do not use it as a precedent; use it as the argument for the rule.

---

## Intake format

Add the item to `ROADMAP.md` §A. One bullet, one line:

```
- **<short name>** — <what it is, in one sentence> · *source: <where it came from>* · *raised <YYYY-MM-DD>*
```

- **Source matters** — "owner asked in passing", "deferred from PP6c", "found during QA" and "post-launch
  partner feedback" need very different amounts of re-validation when the item's turn comes.
- **If it needs more than one line, it is not a backlog item — it is a sprint.** Write it up with
  `/sprint-prompt` into `docs/sprint-prompts/` and link the brief from the bullet, the way the ex-S13 and
  ex-S14 items do.
- Copy is a locked input. A backlog item that changes a user-facing string carries that fact, because it
  needs the owner's sign-off before an engineer touches it, not after.

---

## What is on the backlog today — a read-only index

**Read-only mirror, accurate as of 2026-08-21. `ROADMAP.md` §A is the source of truth.** If this index and
§A disagree, §A is right and this file is stale — fix it here, never there.

### Un-built items still inside MVP scope (§A, unchecked)

| Item | Where it stands |
|---|---|
| **Hardening** — Upstash rate limiting, Turnstile, security headers + CSP, fail-closed Production forms | **SCHEDULED — sprint SYS1.5** (2026-08-21, D-SYS-9). Off the backlog. Brief: [`s14-final-hardening-relaunch.md`](./sprint-prompts/s14-final-hardening-relaunch.md). The CSP half is amended by **D-SYS-10**: SYS3 adds the Sentry ingest origin to `connect-src` |
| **CI + branch protection + Vercel Preview/Production** | Partly true already: `.github/workflows/ci.yml` (workflow **CI**, job `verify`) runs a gitleaks secret scan, typecheck, lint and build on every PR to `main`, and Preview + Production deploys are live. The rest of the box is GitHub repository settings, which cannot be read from the repo. `ROADMAP.md` owns the tick, not this file |

### Post-MVP backlog (§A — "do not build during MVP")

| Item | Note |
|---|---|
| `/search` (V1) | *Observation, not a decision:* a global Ctrl/⌘+K search across focus areas, guides and templates shipped **inside the gated platform** at PP4 (PR #78). This item is a public route, which is a different thing. Whether it is still wanted is `ROADMAP.md`'s call |
| `/admin/partner-interest` | Marked "(later)" |
| Functional House Applications tools | The `/tools` coming-soon placeholder that fronted this was deleted with the old workspace at PP5 |
| Additional languages | — |
| RSVP for in-person events | §A notes "MVP is listing-only, pending confirmation". Since then D2 resolved as **listing-only** (S9, 2026-06-25), LH1 moved the whole Live surface into the gated workspace (2026-07-10), and PP5 then deleted it outright (2026-08-14) — so there is no Live surface left to hang an RSVP on |

*(`/admin/content` graduated off this list into sprint S11 on 2026-06-26 — the worked example of promotion.)*

### Absorbed from the retired S13/S14 sprints (§A)

Retired un-started on 2026-07-02 by owner direction, preserved so the scope was not lost. Two of the three
have since been scheduled — per the 2026-08-21 annotations in §A:

| Item | Status |
|---|---|
| **Hardening (ex-S14 · required before scale)** — Upstash + Turnstile on the public writes, fail-closed verification in real Production, CSP/headers re-verified live, secret-path threat model, full `SECURITY-CHECKLIST.md` §1–§15 pass | **SCHEDULED → SYS1.5.** No longer backlog. Brief: [`s14-final-hardening-relaunch.md`](./sprint-prompts/s14-final-hardening-relaunch.md) |
| **Full-site test-and-fix pass (ex-S13)** — multi-hat end-to-end walk (copy → UX → feature → a11y → security), fix everything found, re-verify to zero known bugs | **SUPERSEDED → SYS2**, the automated launch gate: the same walk as a repeatable Playwright suite instead of a one-off manual pass. Original brief kept: [`s13-full-testing-fix-all.md`](./sprint-prompts/s13-full-testing-fix-all.md) |
| **Domain/SEO relaunch verification (ex-S14)** — after the owner's domain switch-on, re-verify canonical / OG / sitemap / robots / JSON-LD plus an auth email link on the custom domain | **STILL PARKED.** No sprint owns it. See `PROJECT-STATUS.md` §4 for what the owner has already done |

---

## Live follow-ups the trackers carry

Small, real, and currently homeless — recorded here so they stop living only inside sprint narration. Both
are verified against the repo, not copied from memory. Neither is a decision; if one deserves a sprint,
`ROADMAP.md` says so.

**1 · `.docx` upload refused at `/admin/content/files` — not reproduced.**
`PROJECT-STATUS.md` §7 issue #4 (Low, open). The owner's own upload was refused with *"That file type
isn't supported"* while working the CMS at the PP6b pilot, 2026-08-15. It has never reproduced: client and
server run the same extension test, a real `.docx` passes in a browser, and the loader uploads the same
bytes through the same RPC. Two live hypotheses — a `.doc` (indistinguishable in a picker with extensions
hidden) and a trailing space in the filename. The second is now absorbed by a `.trim()`, and the message
names the extension it actually received, so **the next occurrence diagnoses itself in one attempt**.
Nothing to build; close it when the owner next uploads by hand and reports what the message says.

**2 · The `/support` success string was never homed (PP3 follow-up #6).**
Ask HQ sends for real, and the confirmation still reads *"Your question is ready."* — live today at
`src/components/workspace-v2/pw-ask-hq.tsx` line 63. It is the mockup's own sentence, kept verbatim by an
owner note dated 2026-08-12 in that file, from a prototype that never sent anything. Named as still
unhomed in [`pp5-teardown-cutover.md`](./sprint-prompts/pp5-teardown-cutover.md) and carried in
`PROJECT-STATUS.md` §1's next-action narration ever since — carried, unhomed, since PP3. It is a
one-string edit — **and it is copy, a locked input, so it needs the owner's word, not an
engineer's judgement** (`CLAUDE.md` → Locked content). One approved sentence closes it inside any sprint
that is already editing that file.

---

## Where the other things go

| It is… | It belongs in… |
|---|---|
| A new idea, feature or improvement | `ROADMAP.md` §A — the backlog of record |
| A bug | `PROJECT-STATUS.md` §7, with a severity |
| A question only the owner can answer | `PROJECT-STATUS.md` §5 (Open decisions) → §4 once settled |
| Scope deferred out of a sprint mid-flight | `ROADMAP.md` §A, with a pointer to the sprint brief in `docs/sprint-prompts/` |
| A security gap | [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) first — §15 is blocking, and blocking is not parkable |

---

Next step → when an item's turn comes, scope it with `/sprint-prompt`, save the brief in
[`docs/sprint-prompts/`](./sprint-prompts/), and add its row to [`ROADMAP.md`](./ROADMAP.md) §B. The
docs-pack map is [`docs/README.md`](./README.md).
