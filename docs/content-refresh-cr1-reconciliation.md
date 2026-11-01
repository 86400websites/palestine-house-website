# CR1 content reconciliation (sanitized)

> **Public-safe by construction.** This file holds counts, frozen focus-area numbers,
> and names that are already public (the previous release's titles live in
> `docs/content-v2-spec.json`; the canonical resource names are in the public copy).
> The per-file manifest, the identity map, database ids, Storage keys, this release's
> guide documents and the expanded topic copy are not tracked: they live in the gitignored
> `docs/source-assets/content-refresh-cr1/_private/`. That does not make all their wording
> private. `docs/content-v2-spec.json` still holds the previous release's 22 guide bodies
> and intros, public since PP6b and declassified by the owner on 2026-08-16, and the new
> guides carry many of those sentences forward unchanged.

## The delivery

Verified on disk by `scripts/cr1-extract.ts` against a hash manifest taken when the
delivery was moved out of `public/`.

| What | Count |
|---|---|
| All files | 156 |
| Learner downloads | **127** |
| — Overview documents | 22 |
| — Simple Guide documents | 22 |
| — Practical resources in topic Templates folders | **83** (80 DOCX · 1 PNG · 2 SVG) |
| Video Script documents (production files, never published) | 26 (22 topic · 4 section) |
| Website-copy documents | 3 |

## The result

Old release: 22 guides + 88 templates = 110 private files. New release: 127.

| Movement | Count | Identity |
|---|---|---|
| Guides replaced | 22 | same row id, new bytes |
| Templates replaced | 76 | same row id, new bytes |
| Templates added | 7 | new ids |
| Overviews added | 22 | new ids |
| Templates retired | 12 | rows removed after verification, bytes archived |
| Cross-links | 13 | one row each; no duplicate rows or uploads |

`76 + 12 = 88` old templates. `76 + 7 = 83` new. `22 + 22 + 83 = 127`.

## By focus area

| # | Focus area (final title) | Replaced | Added | Retired | Cross-links in |
|---|---|---:|---:|---:|---:|
| 1.1 | Get Legally Ready | 0 | 1 | 2 | 1 |
| 1.2 | Plan the Finances | 5 | 1 | 0 | 0 |
| 1.3 | Find and Prepare the Space | 3 | 0 | 1 | 1 |
| 1.4 | Build a Small Team | 5 | 0 | 0 | 0 |
| 1.5 | Get Ready to Open | 2 | 0 | 2 | 0 |
| 2.1 | Manage the Finances | 4 | 0 | 1 | 1 |
| 2.2 | Manage Daily House Operations | 6 | 0 | 0 | 0 |
| 2.3 | Manage Food and Beverage | 6 | 0 | 0 | 0 |
| 2.4 | Manage Members and Visitors | 4 | 0 | 1 | 1 |
| 2.5 | Manage the Team | 4 | 0 | 0 | 0 |
| 2.6 | Conduct a Monthly Check-Up | 1 | 0 | 2 | 0 |
| 3.1 | Plan the Programming Calendar | 2 | 2 | 1 | 1 |
| 3.2 | Plan an Event | 4 | 0 | 1 | 2 |
| 3.3 | Work with Artists and Speakers | 5 | 0 | 0 | 0 |
| 3.4 | Promote the Event | 4 | 2 | 0 | 0 |
| 3.5 | Learn from the Event | 2 | 0 | 0 | 0 |
| 3.6 | Connect with the Wider Palestine House Network | 4 | 0 | 0 | 1 |
| 4.1 | Manage Marketing | 5 | 0 | 0 | 3 |
| 4.2 | Manage Sponsorship and Fundraising | 4 | 0 | 1 | 1 |
| 4.3 | Build Partnerships | 3 | 0 | 0 | 0 |
| 4.4 | Ask the Community for Help | 1 | 1 | 0 | 0 |
| 4.5 | Learn from Other Palestine Houses | 2 | 0 | 0 | 1 |
| | **Total** | **76** | **7** | **12** | **13** |

Topic ids, slugs, photographs, card order and reader routes are unchanged on all 22. A
title changes on the card; the web address stays what it was.

## The canonical resources

Each is one row and one object, offered from the other focus areas by cross-link.

| Canonical resource | Home | Superseded family (previous release's titles) | Linked from |
|---|---|---|---|
| Simple Guide, Step 6, plus the logo file | 1.1 | Palestine House Brand Guide | — |
| Master Opening Checklist | 1.5 | Palestine House Setup Checklist · Pre-Opening Venue Checklist · 90-Day and 30-Day Opening Checklists · Opening Week Checklist | 1.1 · 1.3 |
| Monthly House Review | 2.6 | Monthly Finance Summary · Monthly Action List · One-Page Monthly House Report · Simple KPI Sheet | 2.1 |
| Simple Event Budget | 3.2 | Event Budget Template | 3.1 |
| The combined feedback form | 3.5 | Audience Feedback Form · Visitor Feedback Form · Event Feedback Form | 2.4 · 3.2 |
| Partnership Agreement | 4.3 | Simple MOU · Simple Partnership Agreement | 4.2 |

Retired by purpose, checked by reading the old documents, not by title similarity.
Distinct daily logs, cost worksheets, artist and speaker agreements, calendars and run
sheets were kept, whatever words their names share with a canonical resource.

Three further cross-links carry no retirement: One-Page Event Review (3.5 → 3.2),
the 4.4 contacts resource (4.4 → 3.6 · 4.5), and the Social Media Post with its two
editable layouts (3.4 → 4.1).

## How the schema carries this (no migration)

| Need | Representation |
|---|---|
| Overview download, kept apart from the 83 | ordinary private `resources` row, reserved `code = 'OV'`; the grid predicate excludes it |
| Exact download filename, versioned key | `<element-slug>/cr1-<fingerprint>/<supplied filename>`; the download action names the file after the key's last segment |
| Download label by file type | the code: `LOGO`, `SVG-n`, otherwise a Word file (`shared-resources.ts`) |
| Cross-links without duplicate rows | `SHARED_RESOURCES` maps topic slug → home slug + code; title and id come from the same gated read |
| PNG and SVG | the private bucket has no MIME or size restriction; only the CMS allow-list and the loader needed widening |

## Videos

26 placements stay truthful and unavailable: 4 section cards on `/dashboard` and 1 on
each focus area. `youtube_url` is empty on all of them, and Watch Video says "Video coming
soon." The 26 scripts are mapped to their placements privately for later production. None
is uploaded as a learner resource or used as a link. When a finished video exists, its link
goes in through the CMS with no code change, and the release leaves any link it finds alone.
