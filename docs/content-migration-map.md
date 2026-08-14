# Content Migration Map — the 22 real focus areas

> **Status: agreed with the owner 2026-08-14, pending pilot sign-off.** This file is the single source of truth for *what the private platform becomes*. It is the input to the PP6c ingest and seed migration `0030`. Sprint plan: [`ROADMAP.md`](./ROADMAP.md) Stage 4. Decisions: [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) §5 (D-PP-k … D-PP-o).
>
> **Source of the content:** `docs/source-assets/Resource/Palestine House Website Content - Complet and Formatted/` (gitignored — OneDrive is canon). 132 `.docx`, 23.3 MB: 22 Overviews + 22 Simple Guides + 88 templates.

---

## 1. Why this file exists

The private platform live in production is **4 sections → 10 groups → 33 focus areas → 297 templates**, seeded from the mockup's placeholder curriculum. The owner's real, finished content is **4 sections → 22 focus areas → 88 templates**, and it overlaps the live model by **zero**.

Verified 2026-08-14, read-only against PROD:

| Test | Result |
|---|---|
| Focus-area names in common | **0 of 22** |
| Template names in common | **2 of 88** (*Event Run Sheet*, *Monthly Content Calendar*) — and both are different files (19,809 B live vs 186,726 B new) |
| Template file-size ranges | **disjoint** — live 10,513–57,535 B · new 183,352–187,957 B |
| Simple-guide length | live 10,609–34,653 chars · new 1,960–4,019 chars — disjoint, and a different voice |
| Any repo file already mapping 22→33 | **none** — zero search hits |
| Any ROADMAP/PROJECT-STATUS decision anticipating it | **none** |

Five independent attempts to refute "this is a replacement, not an upload" all failed. It is a replacement.

**Owner confirmation (2026-08-14):** *"we have simplified the content hence the new topics — this is the final version (the final focus areas and content that we have)."*

---

## 2. The four decisions this file encodes

| # | Decision | Owner call, 2026-08-14 |
|---|---|---|
| **D-PP-k** | The 22 replace the 33. The old 33 focus areas, their 33 guide bodies and the 297 template rows + Storage objects are **deleted in the rollout migration `0030`** — not archived. | **Delete in the rollout** |
| **D-PP-l** | Files are served from our own private Supabase Storage bucket via server-issued signed URLs. **Not** Google Drive. Templates stay `.docx`. | **Direct upload, .docx** |
| **D-PP-m** | Each Overview's **opening sentence** becomes the focus-area card summary; the **rest of the Overview** (bullets + the closing bold goal line) becomes the **first section of the Simple Guide**. No Overview card returns. | **Split** |
| **D-PP-n** | **One group per section.** A section with exactly one group renders its focus areas as a flat list — no accordion header. | **One group per section** |
| **D-PP-o** | Reuse the existing 33 topic photographs, remapped onto the 22 by subject. No new photography required. | **Reuse and remap** |

### D-PP-k carries one irreversible edge — mitigated

A `.down.sql` restores deleted **rows**. It cannot restore deleted **Storage objects**. Before `0030` deletes the 297 template files from the private bucket, PP6c **must** export all 297 objects to a cold backup folder in the owner's OneDrive (`docs/source-assets/_archive-297-templates/`, gitignored) and record the object count + total bytes in the sprint record. ~5 MB. This is a hard exit-gate item, not a nice-to-have.

The same applies to the 33 `simple_guide_md` bodies (~1.6 MB of finished prose) and the 33 `overview_md` / `watch_out_for_md` bodies: `0030`'s down-migration must carry them as literal inserts, or they are gone.

---

## 3. The target information architecture

**4 sections → 4 groups (one each) → 22 focus areas → 22 guides → 88 templates.**

The `about` section (`num` 0, the `/dashboard` landing) is unchanged and carries no focus areas.

| Section | Group slug | Focus areas | Templates |
|---|---|---|---|
| `setup` — Setup | `setup-focus-areas` | 5 | 20 |
| `operate` — Operate | `operate-focus-areas` | 6 | 29 |
| `program` — Program | `program-focus-areas` | 6 | 23 |
| `support` — Support | `support-focus-areas` | 5 | 16 |
| **Total** | **4** | **22** | **88** |

> **Slug + title rule:** the focus-area **title is read from inside the document**, never from the folder name. Four folders disagree with their documents (`3.5 Learn the Event` → *Learn from the Event*; `4.5 Learn from other Palestine House` → *Learn from Other Palestine Houses*; and two more), and the folder names carry typos (`Responsiblity`, `House-toHouse`, `Complet`). Slugs below are **provisional** — PP6b re-derives them from the extracted document titles and this table is corrected in the same PR if any differ.

---

## 4. Focus areas, photos and templates

**Photo column** = the existing file in `public/assets/workspace/topics/<slug>.jpg`, **copied** (not renamed) to the new slug in PP6c. Copying keeps the live 33 rendering until cutover; the 33 originals and the 11 unused ones are deleted in PP7's cleanup.

### Setup — 5 focus areas · 20 templates

| # | Focus area | Provisional slug | Photo reused from | Templates |
|---|---|---|---|---|
| 1.1 | Get Legally Ready | `get-legally-ready` | `legal-compliance-and-risk` | 2 — Palestine House Brand Guide · Palestine House Setup Checklist |
| 1.2 | Plan the Money | `plan-the-money` | `business-model-and-revenue` | 5 — 12-Month Budget Template · Cash Flow Template · Opening Cost Checklist · Revenue Ideas · Startup Budget |
| 1.3 | Find and Prepare the Space | `find-and-prepare-the-space` | `facility-operations` | 4 — Basic Furniture & Equipment List · Pre-Opening Venue Checklist · Venue Comparison Sheet · Venue Selection Checklist |
| 1.4 | Build the Small Team | `build-the-small-team` | `org-structure-and-roles` | 5 — New Team Member Checklist · Role Description House Lead · Role Description Operations & Admin · Role Description Programming/Community · Simple Team Structure |
| 1.5 | Get Ready to Open | `get-ready-to-open` | `launching-a-new-house` | 4 — 30-Day Opening Checklist · 90-Day Opening Checklist · Opening Day Run Sheet · Opening Week Checklist |

### Operate — 6 focus areas · 29 templates

| # | Focus area | Provisional slug | Photo reused from | Templates |
|---|---|---|---|---|
| 2.1 | Money | `money` | `financial-operations-and-controls` | 5 — Cash Flow Sheet · Expense Form · Monthly Finance Summary · Simple Financial Policy · Supplier Payment Tracker |
| 2.2 | Daily House Operations | `daily-house-operations` | `operating-model` | 6 — Cleaning Checklist · Daily Closing Checklist · Daily Opening Checklist · Incident Form · Maintenance Log · Weekly House Checklist |
| 2.3 | Food and Beverage | `food-and-beverage` | `food-and-beverage-operations` | 6 — Daily F&B Sales Sheet · F&B Stock Sheet · Food Safety Checklist · Kitchen Opening and Closing Checklist · Menu Costing Sheet · Simple Menu Template |
| 2.4 | Members and Visitors | `members-and-visitors` | `membership-model-and-benefits` | 5 — Membership Form · Membership Renewal Message · New Member Welcome Template · Simple Member List · Visitor Feedback Form |
| 2.5 | Team | `team` | `hiring-onboarding-and-training` | 4 — Leave Request Form · Monthly Team Check-In Form · Simple Role and Responsibility Sheet · Weekly Staff Schedule |
| 2.6 | Monthly Check Up | `monthly-check-up` | `reporting-kpis-and-audits` | 3 — Monthly Action List · One-Page Monthly House Report · Simple KPI Sheet |

### Program — 6 focus areas · 23 templates

| # | Focus area | Provisional slug | Photo reused from | Templates |
|---|---|---|---|---|
| 3.1 | Plan the Calendar | `plan-the-calendar` | `programming-model-and-pillars` | 3 — Event Budget Template · Monthly Programming Calendar · Simple Event Idea Form |
| 3.2 | Plan an Event | `plan-an-event` | `event-production-sops` | 5 — Event Checklist · Event Feedback Form · Event Run Sheet · Guest List · Simple Event Budget |
| 3.3 | Work with Artists and Speakers | `work-with-artists-and-speakers` | `aswatna-studio-collaboration` | 5 — Artist Hospitality Checklist · Artist Information Form · Artist Payment Form · Simple Artist Agreement · Simple Speaker Agreement |
| 3.4 | Promote the Event | `promote-the-event` | `local-marketing-playbook` | 4 — Email Invitation Template · Event Invitation Template · Event Marketing Checklist · Social Media Post Template |
| 3.5 | Learn from the Event | `learn-from-the-event` | `customer-service-and-recovery` | 2 — Audience Feedback Form · One-Page Event Review |
| 3.6 | Connect to the Wider Palestine House Network | `connect-to-the-wider-palestine-house-network` | `global-campaigns` | 4 — Artist Request Form · Community Program Participation Form · House-to-House Collaboration Request · Programming Support Request |

### Support — 5 focus areas · 16 templates

| # | Focus area | Provisional slug | Photo reused from | Templates |
|---|---|---|---|---|
| 4.1 | Marketing | `marketing` | `brand-experience-standards` | 5 — Monthly Content Calendar · Newsletter Template · Photography Brief · Press Release Template · Simple Marketing Plan |
| 4.2 | Sponsorship and Fundraising | `sponsorship-and-fundraising` | `sustainability-and-impact` | 5 — Grant Opportunity List · Simple Grant Application Template · Simple Partnership Agreement · Simple Sponsorship Proposal · Sponsor List Template |
| 4.3 | Partnerships | `partnerships` | `community-partnerships` | 3 — Partner List · Simple MOU · Simple Partnership Proposal |
| 4.4 | Ask Community Support for Help | `ask-community-support-for-help` | `crisis-management` | 1 — Simple Support Request Form |
| 4.5 | Learn from Other Palestine Houses | `learn-from-other-palestine-houses` | `continuous-improvement-and-knowledge-sharing` | 2 — Good Idea Sharing Template · Success Story Template |

### The 11 unused photographs

Available as alternates if the owner rejects any assignment above:
`catering-private-events-and-culinary-programming` · `coffee-tea-and-beverage-program` · `governance-and-ethics` · `guest-journey-and-member-journey` · `inventory-and-procurement` · `menu-and-palestinian-culinary-identity` · `mission-values-and-guest-promise` · `performance-management-and-culture` · `retail-shop-operations` · `technology-stack-and-data` · `templates-and-master-index`

> The mapping is by **subject affinity from the slug**, not by inspecting each photograph. The owner reviews 1.1's photo at the PP6b pilot and the remaining 21 before PP6c goes Live. Any swap is a one-line change to this table.

---

## 5. What the ingest script must cope with

The existing `scripts/ingest-content.ts` reads a folder layout that **no longer exists on disk** (`docs/source-assets/resources/2. Focus Areas/<1-10>. .../`) and hard-fails unless it finds exactly 30 focus areas and 267 templates. Its front half is rewritten in PP6b.

Real messiness in the delivered folder, all verified — none of it is a problem, but the script must not assume otherwise:

| Trap | Detail |
|---|---|
| Templates folder has three names | `Template-Samples` ×5 · `Template` ×13 · `Templates` ×4 |
| `_V.1` suffix is inconsistent | present on 128 of 132 files, absent on all 4 files in folder 1.1 |
| Folder name ≠ document title | 4 folders, e.g. `3.5 Learn the Event` → *Learn from the Event* |
| Typos in paths | `Responsiblity` · `House-toHouse` · root folder `Complet` |
| `&` in three paths | `Food & Beverage`, `Basic Furniture & Equipment List`, `Role Description Operations & Admin` |
| Guide/Overview naming | ` - Simple Guide` vs ` Simple Guide` · `Overview` vs `_Overview_` |
| 155 KB of every file is the same letterhead | actual content is 20–30 KB per document; do not use file size as a content signal |

**Rules:** read the title from inside the document · never from the folder name · never rewrite the owner's wording (`CLAUDE.md` — copy is verbatim).

---

## 6. Two content-shape defects to fix before ingest

Both found by reading the real files against the real code, 2026-08-14:

1. **The guide title prints twice.** `stripGuideCover` in `src/lib/workspace-v2/guide-cover.ts` was written against the current 33 files' cover banner. Run against *Get Legally Ready Simple Guide.docx*, **it does not fire** — "Palestine House: Set up" and "Get Legally Ready Simple Guide" would render above the reader's own heading. One-line fix, plus a regression test on a real new file.
2. **Template `type` mapping.** The new templates must map onto the seven values the database allows (`form / script / log / report / approval / guide / booklet`). This field is **rendered nowhere**, so it is bookkeeping only — pick sensibly and move on.

---

## 7. Open, deliberately unresolved

| Item | Where it lands |
|---|---|
| The three prose "templates" — *Setup Checklist*, *Brand Guide*, *Opening Cost Checklist* — have no tables, no tick-boxes and no blanks. They read like guides, not forms. | Ship as delivered in the pilot; owner decides at PP6b step 7. **Do not silently re-file the owner's content.** |
| Folder 1.1 *Get Legally Ready* contains two templates that are neither legal nor specific to it. | Same — owner's call at the pilot. |
| The public proof band still says "11 focus areas · 33 topics · 200+ checklist items · 297 templates · 120-day launch". After cutover those numbers describe nothing that exists. | **D-PP-a**, already parked. Public pages stay untouched until PP7, then reconciled in one go. |
| Which database Vercel Preview points at is recorded nowhere. | **UNVERIFIED.** Resolve at PP6b step 0 — it decides whether the pilot is reviewed on TEST or landed in PROD as Draft. |
| Supabase plan + Storage quota. | **UNVERIFIED**, and not blocking: 23.3 MB clears even the free tier by ~35×. |
