# Codex review brief — Copy overhaul ("TEXT EDITS"), 2026-07-17

> **Independent review request.** You are the second pair of eyes on an owner-directed copy overhaul of the
> Palestine House **public** site. Claude built it; you review it. Give a clear verdict and only findings you can
> substantiate from the code.

---

## 0. SCOPE — read this first, it is the most important section

⚠️ **Other branches are in flight in parallel (another session + two Dependabot branches). Reviewing the wrong
range has happened before on this repo (a Codex run once reviewed the DR1 range by mistake and its verdict had to
be discarded). Pin yourself to this range and nothing else.**

- **Branch:** `claude/public-copy-overhaul`
- **Merge base (`main` tip):** `1c8191c7403fe6764345de87ae4169b7c7bd91da`
- **End of the CODE range:** `ee3c601bb9b28af206e009d1e5f8cfc7981982ab`
- **The code review range is exactly:** `git diff 1c8191c...ee3c601` — **8 commits, 20 files**

```bash
git fetch origin
git log --oneline 1c8191c..ee3c601          # must show exactly the 8 commits listed in §2
git diff --stat 1c8191c...ee3c601           # must show exactly 20 files
```

**On the branch tip vs. the code range:** the branch tip is **ahead of `ee3c601` by docs-only commits** — this brief
itself (`docs/code-reviews/`), and any tracker touch-ups. That is expected and self-referential: reviewing
`1c8191c...ee3c601` gives you every code and copy change. You may skim the docs-only commits
(`git log --oneline ee3c601..origin/claude/public-copy-overhaul`) but they need no review. **All eight code commits
end at `ee3c601`; if you see code changes after it, flag that — it would mean someone pushed to this branch.**

**Do NOT review:** `origin/main`, `origin/dependabot/*`, or any other `claude/*` branch that may appear. If the
commit list or file count does not match the above, **stop and say so** rather than reviewing something else.

**Out of scope entirely** (unchanged by this branch — do not audit or comment on): the gated workspace
(`src/app/(workspace)/`), `src/app/admin/`, `src/app/api/`, `supabase/`, `middleware.ts`, `next.config.ts`,
auth, RLS, the approval gate, CSP, env handling. Confirming they are untouched **is** in scope (§5.1); auditing
their contents is not.

---

## 1. What this sprint is

The owner dropped seven Word documents (one per public page) plus six images into `public/assets/TEXT EDITS/` —
revised, approved marketing copy, interleaved with editorial instructions. This branch applies that copy to **all
seven public pages on top of the existing v3 layouts**, plus the shared footer CTA, plus three design pieces built
to owner reference images. **Frontend copy + two photos only.**

**Owner decisions (given at planning, not open for re-litigation — review execution, not the decision):**
1. Apply **all** the new copy across all 7 pages; **keep the existing v3 layouts**, nudging spacing where the
   fuller copy needs room. (Explicitly *not* "marked edits only"; *not* "restructure freely".)
2. Update the **shared footer CTA** site-wide to the doc's "8. The bottom header" copy. This is a deliberate
   locked-chrome edit and is authorised.
3. Rebuild the `/bring-ph` 120-day timeline to the owner's arched-card reference image.

---

## 2. The 8 commits under review

```
8217a46  Overhaul Home + Model copy; add two photos; update footer CTA
441785f  Overhaul Experience copy; add "More than somewhere to visit" section
54fdd64  Overhaul Bring a House copy; rebuild 120-day timeline as arched cards
060e65d  Overhaul Our Support copy; remove the You-bring/We-make-sure split
8ca4a52  Overhaul Apply + Focus Areas copy
7c8ff2b  Fix six copy-fidelity defects found by the verification pass
9714c4c  Fix five more copy defects found by the re-verification pass
ee3c601  Retire the Our Support §5 stutter line; update trackers + save record
```

The last three commits exist because Claude ran its own adversarial verification and found **11 real defects in its
own work**. Do not assume that pass was exhaustive — it is exactly the kind of self-check that can share the
author's blind spots. **§4 (copy accuracy) is your highest-value contribution.**

---

## 3. What shipped (orientation)

**Three design pieces** built to owner reference images (the images are gitignored — see §4.0):
- `/bring-ph` §5 — the 3-item star-medallion timeline → **four arched DAY cards** (30 · 60 · 108 · **120, new**),
  alternating moss/terracotta circles on a copper connector, closing on a ribbon
  ("The goal is not simply to open on time. It is to open well."). Old `.bring-mile*` markup + CSS removed.
- `/model` §6 — rebuilt: "A cultural institution built to last." + "A Palestine House is:" / "It is not:" columns +
  an aside with "Culture leads. / The structure helps it last." + the doc's closing reciprocity pair + a **new
  coffee still-life photo** (replacing the centre bonsai `ph-photo-model-still`).
- `/experience` §6 — **new** closing section "More than somewhere to visit." + a **new gathering photo**, sitting
  above the site-wide footer CTA.

**Two owner-instructed removals:** Home's "It isn't charity. It isn't a franchise you buy and forget." line; the
whole Our Support "You bring / We make sure" split (markup + `SUP_YOU_BRING`/`SUP_WE_ENSURE` + its CSS).

**Two owner-instructed renames:** "Three rules, no exceptions." (`/bring-ph` §6) and "Three things, never
negotiable" (`/model` §5 eyebrow) → **"Three commitments every House shares."**; "The agreement" → **"The
Partnership"** (`/model` §4).

**One shared-component change:** `StageCards` gained an optional `stages` prop (default = Home's copy) + an
optional bold lead line, because the docs now give Home and `/bring-ph` **different** stage copy. Content
parametrisation; card layout unchanged.

**Assets:** two new photos via `scripts/optimize-photos.ts` → `ph-photo-model-culture.jpg`, `ph-photo-exp-gather.jpg`,
keyed in `PHOTO_SOURCES`. `public/assets/TEXT EDITS/` was **removed from the served `public/` tree** and never
committed (it would otherwise have been publicly downloadable).

---

## 4. PRIORITY ONE — copy accuracy (the owner explicitly asked for this)

The owner's ask: *"double check the accuracy of our copy so we ensure we covered everything."*

### 4.0 Why the ground truth is embedded below

`docs/source-assets/` is **gitignored** (`.gitignore:41`) — the owner's `.docx` files and reference images are
**not in the repo**, so you cannot open them from a clone. **§7 of this brief contains the verbatim text of all
seven documents, machine-extracted from the owner's originals** (Python `zipfile` → `word/document.xml` → tag
strip), *not* retyped by the author. Treat §7 as the source of truth.

> The three reference **images** (`model-what-it-is-ref.png`, `exp-more-than-visit-ref.png`, `bring-120day-ref.png`)
> are also gitignored and unavailable to you. **Do not attempt to judge visual fidelity to them** — that is the
> owner's Preview check. Judge copy, code, and structure.

### 4.1 What to do

For **each** of the seven pages: read the shipped file(s) and diff against its document in §7, section by section.
Report:

- **`missed`** — copy in the doc that should be on the page but is not (the page still shows old text, or the copy
  is simply absent). *This was the single most common real defect found so far — including the Model doc's closing
  two sentences being dropped entirely and three Our Support section labels never being applied. Hunt specifically
  for **tails and labels**: the last lines of a document, and short section labels that precede a heading.*
- **`wrong`** — the page's text differs from the doc's intent: a dropped clause or word, altered meaning, a
  flattened rhetorical device, or wrong British spelling (**programme / organisation / licence / diasporas**).
- **`stray`** — text changed on the page that the doc did **not** ask to change.
- **`note`** — a defensible deviation worth flagging for the owner.

### 4.2 Accepted decisions — do NOT report these as defects

These are deliberate and owner-visible. Flag at most as `note`:

1. **The brand-locked support line stays exactly `Every application is reviewed by HQ.` site-wide.** The docs'
   casual variants — "personally reviewed" (Home §7), "carefully reviewed" (Focus Areas) — were **deliberately not
   adopted**. This line is locked in `DESIGN.md` §1 and `apply-cta.tsx` ("copy locked — never reworded here").
2. **Proof numbers are fixed and must never move: 10 focus areas · 30 topics · 200+ checklist items · 267
   templates · 120-day launch.** Only the *labels* changed. Where the Our Support doc says "over 200 templates",
   the page deliberately renders the exact **267**. The 120 stat carries its unit in the **label**
   ("Day guided launch plan" / "day guided launch plan") so it reads as *a 120-day launch plan* — singular "Day" is
   the correct compound-modifier form.
3. **A two-sentence doc heading may be split across an eyebrow + a heading** if every content word survives
   somewhere sensible (e.g. Our Support §5: eyebrow "The 120-day path" + h2 "Clear milestones. The right decisions
   in the right order."). Our Support §4 renders eyebrow "Cultural support from" directly above the `<h2>` Aswātna
   wordmark — together they carry the doc's label "Cultural support from Aswātna" without stuttering the name.
4. **Editorial instructions inside the docs are instructions, not copy.** Strings like "Remove:", "Change it to",
   "REMOVE THIS PART COMPLETELY AS IT IS ALREADY IN THE 'BRING A HOUSE' SECTION", "see photo in folder for
   reference", "I would rename this section because…" must **not** appear on any page. Verify the instruction was
   *carried out*; never expect the instruction text itself to render.
5. **Copy may be reflowed** across paragraphs/list items and lightly reordered to fit the existing v3 layout,
   **provided no content word is lost and no meaning changes**. Judge substance, not punctuation.
6. **Pre-existing v3 design chrome** the docs don't mention (eyebrows like Home §2's "A living place", ornaments,
   existing photos) is **not** a stray — the docs are copy, not layout specs.
7. `/model` §6's photo swap and layout, and the `/experience` §6 section, are sourced from the owner's **reference
   images**, which the `.docx` files do not contain. Their absence from the doc is not evidence they are unauthorised.

### 4.3 Known open items — confirm, don't re-litigate

Already recorded in `docs/sprint-prompts/copy-overhaul-text-edits.md` and surfaced to the owner:
- `/model` §3 renders the three partners unnumbered while §5 keeps 01/02/03; both are numbered in the docs.
- `/model` §4: the doc frames "Local ownership. Shared standards. Cultural integrity." as the **one** unifying
  principle, so the moss band now carries the two responsibilities as icon columns and **closes** on the framing
  sentence + the principle (it previously rendered as a third peer column). Confirm this reads correctly.

---

## 5. PRIORITY TWO — correctness & guardrails

### 5.1 Gating checks (report each PASS/FAIL with evidence)

```bash
pnpm install --frozen-lockfile
pnpm run typecheck        # expect clean
pnpm run lint             # expect clean
pnpm run build            # expect success, 45/45 static pages, no route added/removed
```

- **Path-guard:** `git diff --name-only 1c8191c...ee3c601` must contain **zero** files under `supabase/`,
  `src/app/api/`, `src/app/(workspace)/`, `src/app/admin/`, `middleware.ts`, `next.config.ts`, `package.json`,
  `pnpm-lock.yaml`, or any `.env*`. **Report any hit as blocking.**
- **Proof numerals unchanged vs `main`:** `HOME_PROOF` (`src/app/page.tsx`), `FA_STATS`
  (`src/app/focus-areas/page.tsx`), `SUP_PROOF` (`src/app/our-support/page.tsx`). Labels may change; **numerals may
  not**.
- **Locked line** `Every application is reviewed by HQ.` still verbatim at every call site; **no**
  "personally/carefully reviewed by HQ" variant introduced.
- **`public/assets/TEXT EDITS` is not tracked** (`git ls-files | grep -i "TEXT EDITS"` → empty) and no `.docx`,
  `.png` mockup, or master photo was committed anywhere under `public/`.
- **No secrets** in the range; `.env.local` untracked.

### 5.2 Code-quality areas worth your attention

1. **`StageCards` parametrisation** (`src/components/sections/stage-cards.tsx`) — the `stages` prop defaults to
   Home's copy and `/bring-ph` passes `BRING_STAGES`. Verify: Home renders the Home copy, `/bring-ph` renders its
   own; the optional `lead` renders only where provided; the exported `StageCopy` type is sound; no other consumer
   was broken.
2. **Dead code / dangling refs from the removals.** The old `.bring-mile*` timeline, `.support-duties-split`, and
   the `Users`/`StarMark`/`CircleCheck`/`ArrowRight` imports were removed. Check for: JSX referencing CSS classes
   that no longer exist, CSS referencing removed elements, unused imports/consts, and **orphaned assets**
   (`ph-photo-model-still.jpg` and `ph-photo-support-responsibility.jpg` are known orphans — already recorded as a
   housekeeping follow-up, report as Low at most).
3. **New CSS correctness** (`src/styles/pages.css`, `src/styles/v3.css`). Highest-risk: the new
   `.bring-timeline` arched cards — a `::before` copper connector sits behind the DAY circles at `top: 34px` and is
   hidden below 900px; the circles use `position: absolute; top: -34px` against `padding-top: 34px` on the list.
   Check the geometry holds, the z-index layering is sound, and the 4→2→1 column responsive steps work.
   **Note the cascade trap documented in this repo:** `globals.css` `@import`s `pages.css` **before** `v3.css`, so a
   `pages.css` rule that ties on specificity with a `v3.css` rule **loses**. A past sprint shipped a dead rule this
   way (`.exp-home-split` needed a `.v3-split.exp-home-split` bump). The new `/experience` §6 section uses the
   **default** `.v3-split` deliberately — verify nothing is silently dead.
4. **Contrast/AA on changed surfaces.** The Our Support §4 eyebrow is new on the muted-red band `#9b361e` and is
   forced cream (`.support-aswatna .ph-eyebrow`) because the default copper would be unreadable — verify it clears
   AA. Also check the new `.bring-arch-day` circles (moss `#424528` / terracotta `#9c5230` with `--cream-50` text)
   and `.model-promise-principle` (cream on moss).
5. **Longer copy vs. tuned layouts.** The v3 layouts were tuned for much shorter copy. Flag anywhere the fuller
   copy plausibly overflows, clips, or badly unbalances a component — especially `/model` §3's arch cards (which
   now hold a role sub-label + a 4-sentence paragraph inside an arch shape) and `/experience` §3's five-column
   pillar grid (now multi-sentence per column). Code-level reasoning is enough; you can't screenshot.
6. **A11y/semantics:** the `/bring-ph` timeline is an `<ol>`; new `<ul>` triads on `/experience`, `/bring-ph`,
   `/model`; heading order not broken by the `/bring-ph` §2 `<p>`→`<h2>` promotion or the `/model` §6 new `<h2>`.

---

## 6. Output format

Give a single verdict — **APPROVE** / **APPROVE WITH NON-BLOCKING** / **REQUEST CHANGES** — then:

- **Gating checks:** each PASS/FAIL with the command output or file:line evidence.
- **Copy findings (§4):** a table — page · severity (`missed`/`wrong`/`stray`/`note`) · expected (quote the doc) ·
  actual (quote the page, with `file:line`). **If you find nothing, say so explicitly** — a clean copy verdict is a
  valuable result, and inventing findings to look thorough is worse than none.
- **Code findings (§5):** severity (Blocking / Medium / Low) · `file:line` · why it's wrong · suggested fix.
- Anything you checked and found **fine** — say that too, so the owner knows the coverage.

Be concrete and cite `file:line`. Do not restate the plan back. Do not fix anything — report only.

---

## 7. GROUND TRUTH — the owner's seven documents, verbatim

> Machine-extracted from the owner's original `.docx` files (`zipfile` → `word/document.xml` → tag strip, entities
> unescaped). These files are gitignored and live only in the owner's OneDrive / the author's working copy, which is
> why they are reproduced here. **This is the source of truth for §4.**
>
> Remember §4.2 item 4: lines like *"Remove: …"*, *"(Change it to 'The Partnership')"*, *"REMOVE THIS PART
> COMPLETELY…"*, *"see photo in folder for reference"*, and *"I would rename this section because…"* are the owner's
> **instructions to the engineer**, not copy to render.

### Home (`/`)

**Owner document:** `Hero section_.docx`
**Shipped in:** src/app/page.tsx · src/components/sections/home/home-hero.tsx · src/components/sections/home/inside-strip.tsx · src/components/sections/stage-cards.tsx (default STAGES = Home copy) · src/components/layout/site-footer.tsx (doc section 8 'The bottom header' = the SHARED footer CTA)

```text
Hero Section:
A home for Palestinian culture, in every city. Palestine House helps local communities create permanent cultural homes where Palestinian food, music, art, memory, and everyday life can be experienced, shared, and kept alive.
Apply to bring a HouseExplore how it works
Supporting labels
A café by dayMeet, work, eat, and stay awhile.
A cultural stage by nightMusic, film, poetry, talks, and storytelling.
A community every dayWorkshops, markets, gatherings, and conversation.

Culture deserves more than a moment.
Palestinian culture is too rich to exist only through occasional events, temporary pop-ups, or moments of attention.
We are building a global network of permanent Palestine Houses: living cultural homes that nourish identity, support creativity, and bring communities together.
A pop-up ends. A post disappears. A Palestine House stays.
It is a real place, open throughout the year: a café, a venue, and a home for culture and community under one roof.

Inside a Palestine House
Friday oud night- Live music, shared closely, in a room that feels like home.
Tatreez workshop- Hands, stories, and knowledge passed from one generation to another.
Palestinian supper club- Long tables, generous food, and conversations that continue into the evening.
Film screening- Cinema from Palestine and its diaspora, followed by space to reflect and respond.
Book talk- Writers, readers, ideas, and conversations that deepen how we understand Palestine.
Market day- Palestinian makers, independent products, local food, and community under one roof.

One path. Three clear stages.
The Palestine House system guides you from your first idea to opening day and supports you as the House grows.
01 — Plan & Prepare Understand the model, assess your city, build your team, and prepare a viable plan.
02 — Design & Build Shape the space, secure suppliers and permissions, and follow a clear 120-day launch programme.
03 — Operate & Program Run the café, venue, team, finances, and cultural programme to the shared Palestine House standard.

Everything you need, in one connected system.
From planning and permissions to staffing, programming, finance, and launch, everything is organised in one place with your progress saved as you build.
10 Focus areas
30 Core topics
200+ Checklist actions
267 Ready-to-use templates
120 days A guided launch plan
The work is real. So is the welcome.
Every House must be financially responsible, professionally run, and rooted in the same shared standards.
But a Palestine House should never feel corporate or distant. It should carry the warmth, generosity, and hospitality of a Palestinian home.
A serious cultural business. A welcoming community space. A permanent home built to last.
Remove: It isn’t charity. It isn’t a franchise you buy and forget.

7. The full system opens to approved partners.
You can explore the Palestine House model freely and learn what it takes to bring one to your city.
When you are ready, submit an application. Every application is reviewed by HQ to make sure the model, location, and partnership are a strong fit.
Once approved, you receive access to the complete playbook, toolkit, templates, training, and partner platform.
Apply to bring a HouseExplore the model
Every application is personally reviewed by HQ.

8. The bottom header
Ready to bring Palestine House to your city?
Explore the model, understand what it takes, and apply when you are ready to build a permanent home for Palestinian culture in your community.
```

### The Model (`/model`)

**Owner document:** `The Model page.docx`
**Shipped in:** src/app/model/page.tsx

```text
One name. Many Houses. A shared standard.
Every Palestine House is locally owned and shaped by the people who understand their city best.
What connects every House is a shared commitment to cultural integrity, Palestinian hospitality, professional practice, and long-term community care.
Apply to bring a HouseSee our support

What a House carries
A cultural embassy, not a themed café.
A Palestine House is a real café, a cultural venue, and a community home under one roof.
It carries the responsibility of representing Palestinian culture with depth, care, and integrity and the joy of sharing it generously.
Every meal served, every concert, every workshop, every film, and every conversation contributes to a permanent Palestinian cultural presence.
Culture is not decoration here. It shapes the food, the programme, the atmosphere, and the way people are welcomed.

How the network works
Three partners. One shared purpose.
Every Palestine House is built through a clear partnership between Global HQ, the local operator, and Aswātna. Each partner brings a distinct area of expertise. Together, they protect the culture, strengthen the business, and help every House grow with consistency and local character.
01 — Global HQ
Brand steward and operating partner
Global HQ protects the Palestine House name and identity, sets the shared standards, develops the operating system and partner platform, and supports every House from application through launch and long-term operation.It ensures that every location meets the same level of cultural care, professionalism, and quality.

02 — The Local Partner
Owner and operator
The local partner brings the venue, the team, local knowledge, community relationships, and the daily commitment required to run a sustainable cultural business. You lead your House, make it meaningful in your city, and bring the shared Palestine House standard to life locally.

03 — Aswātna
Cultural programming partner
Aswātna shapes the cultural direction of each House.It supports launch programming, connects Houses with Palestinian artists and cultural practitioners, develops meaningful events and partnerships, and helps ensure that the creative programme remains thoughtful, relevant, and culturally grounded over time.

The agreement (Change it to “The Partnership”)
One agreement. Clear responsibilities.
Palestine House HQ licenses the name and operating system to carefully selected local partners.
You own and operate your House. HQ gives you the tools, standards, guidance, and ongoing support to build it well.
The agreement connects all partners around one principle:
Local ownership. Shared standards. Cultural integrity.
Each House has its own personality and responds to its own city, but the quality of care, hospitality, cultural representation, and professional practice remains consistent across the network.

Replace “Three things, never negotiable” with “Three commitments every House shares.”
01 — Cultural independence
A Palestine House does not endorse political parties, electoral candidates, or partisan organisations.It remains a space for Palestinian culture, critical thought, artistic expression, learning, and community.

02 — Respect for the Palestine House name
The Palestine House identity is used consistently and with care. HQ approves major uses of the brand so that every House protects the trust, meaning, and reputation carried by the name. Should a partnership end, the Palestine House branding and licensed materials are removed.

03 — Honest and transparent operation
Every House agrees to clear reporting, shared performance measures, and appropriate financial and operational transparency. These systems help identify problems early, protect the network, and give partners the support they need to operate sustainably.

What it is : A cultural institution built to last.
A Palestine House is:
A professionally run cultural business.
A café and gathering place rooted in Palestinian hospitality.
A year round venue for music, art, film, literature, food, and conversation.
A platform for Palestinian artists, makers, thinkers, and cultural workers.
A permanent community anchor with local ownership and global support.
It is not:
A temporary pop up.
A decorative interpretation of Palestinian culture.
A passive franchise purchased without responsibility.
A one off campaign or seasonal project.
A venue that uses the name without meeting the shared standard.

Culture leads. The structure helps it last.
Palestine House brings together local ownership, cultural expertise, and a shared operating system so that Palestinian culture can have a permanent home in cities around the world.
You bring the commitment, the local relationships, and the daily leadership.
We bring the name, the system, the guidance, and the cultural partnership to help you build something meaningful and sustain it.
```

### Experience (`/experience`)

**Owner document:** `The Expiernce_.docx`
**Shipped in:** src/app/experience/page.tsx

```text
Step inside a Palestine House.
A place that feels familiar, even on your first visit.
Come for Palestinian coffee and food made from recipes carried across generations. Stay for a concert, a film, a reading, or a conversation that changes the way you see something.
A Palestine House is somewhere to meet, work, listen, eat, learn, and return to throughout the week and throughout the year.

One room. Many ways to belong.
A café by day. A cultural stage by night.
By day The House is open for everyday life. People arrive for coffee, lunch, conversation, reading, working, or simply a place to pause. Some stay for twenty minutes. Others remain for the afternoon.
By night The room shifts. Tables move, chairs turn towards the stage, and the same space becomes a home for live music, film, poetry, literature, talks, and shared conversation.
One room, continually renewed by the people and stories that pass through it.

Five threads. One living cultural programme.
Every event at a Palestine House is part of a wider story.
Across the year, programming moves through five connected threads bringing together memory, contemporary creativity, learning, community, and the everyday economy that allows the House to remain open. The programme changes from week to week, but the cultural purpose remains clear.
Heritage & Memory
Keeping stories alive through food, music, craft, oral history, and collective remembrance. Recipes are shared. Songs are carried forward. Personal histories become part of a larger cultural memory.

Contemporary Creativity
Music, visual art, film, literature, performance, comedy, and new ideas from Palestine and its diasporas.

Education & Exchange
Talks, readings, workshops, screenings, study groups, and conversations that create space for curiosity, reflection, and deeper understanding.

Community & Belonging
The gatherings that turn a venue into a shared home. Community dinners, markets, celebrations, family activities, open tables, and regular reasons to return.

Everyday Sustainability
The café, shop, events, and partnerships that keep the House active and its doors open. A Palestine House is built to last. Its cultural work is supported by a thoughtful, responsible local economy.
Different every week. Familiar every time.A concert one evening. A workshop the next morning. A quiet coffee in between.The programme changes, but the welcome remains.

Permanence
A home, not a moment.
Temporary events can create powerful moments. A Palestine House gives those moments somewhere to continue.
It is open throughout the year, at the same address a place where Palestinian culture can be encountered not occasionally, but as part of the everyday life of a city.
A place to return to.A place to build relationships.A place where culture is visible, lived, and shared.

The current page moves quickly from the permanence statement into the final call to action. I would add a short emotional close before it. See photo in drive titled The Experience section pic. Add this before the call to action page:
More than somewhere to visit.
A Palestine House becomes part of the rhythm of its city.
People return for the food, the programme, the conversations, and the feeling of being welcomed into something meaningful.
For some, it is a connection to home.For others, it is an introduction.For everyone, it is a place to gather.
```

### Bring a House (`/bring-ph`)

**Owner document:** `Bring a House_.docx`
**Shipped in:** src/app/bring-ph/page.tsx (stage-card copy lives in its BRING_STAGES const)

```text
Bring Palestine House to your city.
A Palestine House is a permanent home for Palestinian culture: a café, a cultural venue, and a community gathering place under one roof.
You bring the local knowledge, leadership, and commitment. We bring the model, tools, standards, and support to help you build something culturally grounded, professionally run, and made to last.

Why bring one
Give Palestinian culture a permanent address.
Your city may already have the artists, audiences, organisers, food, stories, and desire for connection. What it may not yet have is one permanent place where all of that can live together, throughout the year.
A Palestine House turns scattered cultural moments into a lasting presence, somewhere people can gather, create, celebrate, learn, eat, listen, and return to.
For the city, it becomes a cultural landmark.For the community, it becomes a shared home.For the local partner, it becomes a meaningful institution to build and lead.

The partnership
Local leadership. Shared support.
Every Palestine House is locally owned and operated, with the backing of a wider cultural and operational network. The partnership is defined clearly from the beginning so that everyone understands their role, responsibility, and contribution.
You bring
A suitable venue and the local knowledge to choose it well.
A committed team with the experience and discipline to run the House.
Relationships with local communities, artists, organisations, and audiences.
The daily leadership required to build a trusted and sustainable institution.
We bring
The Palestine House identity and the shared standards that protect it.
A complete operating system, including the playbook, templates, training, and partner platform.
Guidance across planning, design, launch, programming, finance, hospitality, and daily operations.
Continued support after opening, so you are not left to manage the journey alone.
Shared responsibility
You shape the House around your city. We help ensure it carries the same level of cultural care, hospitality, quality, and professionalism as every House in the network.

What it takes
One clear path. Three stages.
Opening a House involves hundreds of decisions. The Palestine House system places them in the right order, giving you a clear view of what matters now, what comes next, and what can wait. The journey is organised across three stages within a guided 120-day launch plan.
01 — Plan & Prepare
Build the foundation.
We help you assess the opportunity, establish the organisation, shape the budget, identify the right venue, and create a realistic plan for launch and long-term operation.
02 — Design & Build
Create a space people want to return to.
We guide the development of a welcoming, functional, and culturally grounded House—from layout and atmosphere to suppliers, permissions, systems, and fit-out.
03 — Operate & Program
Bring the House to life.
We support you in building the team, opening the café and venue, launching the cultural programme, strengthening community relationships, and running the House sustainably.
Supporting line
You do not face every decision at once. The platform shows you the stage you are in, the tasks that matter now, and the next clear steps.

The 120-day launch ( see photo in folder for reference )
A launch plan built around readiness, not pressure.
The 120-day plan gives you clear milestones while leaving room for the realities of opening a physical cultural space.
Day 30 — The foundation is in place
Governance established, early budget approved, local team forming, and venue options under review.
Day 60 — The House is taking shape
Venue secured, legal structure active, brand agreement in place, suppliers confirmed, and fit-out underway.
Day 108 — Ready to welcome people
Permits secured, team trained, operating systems active, cultural programme prepared, and soft opening completed.
Day 120 — Public launch
The final twelve days create a deliberate buffer to resolve issues, strengthen the guest experience, and open with confidence.
Closing line
The goal is not simply to open on time. It is to open well.

The commitments
I would rename this section because “Three rules, no exceptions” feels unnecessarily severe.
Three commitments every House shares.
These commitments protect the meaning of the Palestine House name and create trust across the network.
01 — Cultural independence
A Palestine House does not endorse political parties, electoral candidates, or partisan organisations.
It remains a space for Palestinian culture, artistic expression, learning, memory, conversation, and community.
02 — Responsible use of the Palestine House name
The brand is used consistently and with care.
Major public uses are approved by HQ so that every House protects the meaning, quality, and trust carried by the name.
03 — Honest and transparent operation
Every House agrees to clear reporting, shared performance measures, and appropriate financial and operational transparency.
These systems help identify challenges early and allow the network to support each House effectively.
Closing line
Shared standards do not erase local character. They help every House earn trust.

The Next Step
Ready to build a permanent home for Palestinian culture?
Opening a Palestine House is a serious commitment, but you will not make the journey alone.
Every application is reviewed to understand your city, your team, your venue, and your vision and to make sure we can support the project responsibly.
If there is a strong fit, we will guide you through the next steps.
Apply to bring a HouseExplore our support
Questions before applying? Contact us.
```

### Our Support (`/our-support`)

**Owner document:** `Untitled document.docx`
**Shipped in:** src/app/our-support/page.tsx

```text
Our Support
You bring the commitment. We help you build it well.
Opening a Palestine House involves hundreds of decisions from finding the right venue and building a team to shaping the programme, managing the finances, and preparing to welcome your first guests.
You will not have to solve them alone.
Every approved partner receives a complete operating system, practical tools, cultural guidance from Aswātna, and a clear 120-day path from first decision to opening day.
10 focus areas30 core topics267 ready-to-use templatesOne guided 120-day launch plan

The toolkit
A complete operating system, ready when you need it.
Everything required to plan, open, and run a House is organised in one place.
The system is divided into ten focus areas and thirty practical topics, so you can concentrate on the decisions that matter now without losing sight of what comes next.
Every topic includes:
A clear overview
Understand what the topic covers and why it matters.
A practical guide
Plain-language advice designed to be useful in real working conditions.
A step-by-step checklist
Every action placed in a clear order, with progress saved as you work.
What to watch for
Common mistakes, risks, and decisions that need extra attention.
A short walkthrough
A visual explanation you can return to whenever you need it.
Ready-to-use templates
Contracts, plans, rotas, budgets, policies, and working documents ready to adapt.
Start with proven tools, not a blank page.
With over 200 templates across the platform, your team can spend less time creating documents from scratch and more time building the House itself.
See the full map

Shared standards
One name. A consistent level of care.
Every Palestine House responds to its own city, community, and local character. What remains consistent is the standard behind the experience: thoughtful hospitality, cultural integrity, professional operation, and attention to detail. A guest should feel the same level of care wherever they enter a Palestine House—without every location looking or feeling identical.
One name.One shared standard.A House shaped by its city.

Cultural support from Aswātna
Cultural direction that continues beyond launch.
A strong Palestine House needs more than a busy events calendar.Its programme should feel thoughtful, connected, and rooted in Palestinian culture while responding meaningfully to the city around it.Aswātna works alongside each House to shape that cultural direction.
Before opening
We help define the programme, identify the right creative partners, and shape a launch that introduces the House with clarity and purpose.
At launch
We support opening-week programming through artists, performances, conversations, cultural partnerships, and event development.
After launch
We continue supporting the programme over time helping the House maintain creative quality, cultural depth, and a coherent identity throughout the year.
Closing line
The goal is not simply to fill the calendar. It is to build a cultural programme people trust and return to.

The 120 day path Clear milestones. The right decisions in the right order.
01 — Plan & Prepare
Build the foundation.
Venue assessment, company structure, governance, early budgets, local partnerships, and launch planning.
02 — Design & Build
Turn the plan into a functioning House.
Fit-out, suppliers, permissions, brand implementation, operating systems, and guest experience.
03 — Operate & Program
Prepare the House to open and grow.
Team training, cultural programming, hospitality, daily operations, soft opening, and public launch.
You always know where you are, what comes next, and what is ready.
View the 120-day launch

Support does not end on opening day.
Opening the doors is the beginning.
The first public launch is an important milestone, but a House succeeds through what happens in the months and years that follow.
We continue supporting you across the areas that keep the House culturally meaningful, operationally strong, and financially sustainable.
Programming
Build a coherent cultural calendar that gives people regular reasons to return.
Food & Hospitality
Maintain consistency, quality, warmth, and a guest experience rooted in Palestinian hospitality.
Membership & Community
Turn first time visitors into lasting relationships and build a community around the House.
Finance & Operations
Use clear systems, reporting, and practical tools to keep the House stable and sustainable.

7. You bring- We bring ( REMOVE THIS PART COMPLETELY AS IT IS ALREADY IN THE “ BRING A HOUSE “ SECTION.
```

### Apply (`/apply`)

**Owner document:** `Apply_.docx`
**Shipped in:** src/app/apply/page.tsx

```text
Apply
Bring a Palestine House to your city.
Complete one application to introduce your vision, create your account, and send your proposal directly to HQ.
There is no separate sign up process. Your application and account are created together in one simple step.

Who brings what
You bring the venue, the team, the local relationships, and the daily commitment required to run a successful cultural business.
We bring the Palestine House identity, shared standards, complete toolkit, and ongoing support to help you build and operate it well. Every House works under a clear licence that protects the quality, integrity, and meaning of the Palestine House name.
Before you apply
Every Palestine House shares three core commitments: cultural independence, responsible use of the brand, and honest, transparent reporting.
If these principles reflect how you want to work, we would be glad to hear from you.
What happens next
01 — You apply
Complete one form to create your account and send your application directly to HQ.
02 — HQ reviews your application
While your application is being reviewed, your account will remain pending. When you sign in, you will see a simple update confirming that the review is in progress.
03 — The full platform opens
Once approved, you will receive access to the complete platform, including the playbook, toolkit, and Academy. There is no additional registration or second sign-up process.
Have a question before applying? Contact us. You do not need to submit an application to get in touch.
```

### Focus Areas (`/focus-areas`)

**Owner document:** `Focus area_.docx`
**Shipped in:** src/app/focus-areas/page.tsx

```text
The full map
Everything you need to build and run a House.
A practical, step-by-step playbook designed to help you plan, launch, operate, and grow with confidence built from real experience and ready to use.

Access the full playbook
The full playbook becomes available once your application is approved by HQ.
You have seen the map. Approved partners gain access to the practical guides, step by step checklists, videos, and ready to use templates behind every topic.
Apply to bring a House
Every application is carefully reviewed by HQ.
```
