import type { Metadata } from "next";
import { Lock, LockOpen } from "lucide-react";
import { Photo } from "@/components/shared/photo";
import { ApplyCta } from "@/components/sections/apply-cta";
import { Reveal } from "@/components/motion/reveal";

/* Focus Areas (/focus-areas) — the public, anon-safe map of the playbook:
   titles + one-line summaries only; full depth opens to approved partners.
   Layout from docs/page-designs/public/FocusAreas.app.jsx (approved mockup) —
   unchanged by PP7; only the content model beneath it moved.

   ---------------------------------------------------------------------------
   REWRITTEN AT PP7 (D-PP-a), AND WHY IT COULD NOT WAIT
   ---------------------------------------------------------------------------
   D-PP-a was recorded as "public proof numbers". Grepped at PP6c's exit gate it
   was much more: this page was a FULL PUBLIC MAP OF THE RETIRED IA BY NAME — 11
   focus areas and 33 topics, every one of which migration 0030 deletes. Nothing
   was broken for a visitor (these are static strings, no database read), but the
   site advertised 33 topics by name that exist nowhere.

   The real model is four sections → 22 focus areas → 88 templates (D-PP-k).

   COPY PROVENANCE (D-PP-s, resolved 2026-08-16). CLAUDE.md holds copy verbatim
   from docs/page-copy/ and never invents it. The owner granted a deliberate,
   scoped exception here — "You can write your own copy please based on the
   overview etc you already have for the new focus areas" — with a rule that
   keeps it honest: **each focus area's public one-liner is its own Overview's
   opening sentence**, the owner's wording, and already the private card summary.
   Public and private therefore cannot drift. The only text written for this page
   is the four section lines below, and each of those is a plain list of the
   focus areas it contains — connective tissue, per
   docs/page-copy/00-global/brand-voice.md.

   The owner reviews this page on Preview before PP7 closes. */

export const metadata: Metadata = {
  title: "Focus Areas",
  description:
    "The full map of the playbook — four sections, twenty-two focus areas, 88 templates. Every title and summary is public; the full depth opens to approved partners.",
};

/* 200+ checklist items is GONE, not updated: checklists were dropped at D-PP-b
   and 0030 deletes the last 818 rows, so the number now describes nothing. */
const FA_STATS = [
  { n: "4", label: "sections" },
  { n: "22", label: "focus areas" },
  { n: "88", label: "real templates" },
  { n: "120", label: "day launch" },
] as const;

/* The 22, in the owner's order, with his own opening sentences.
   Source: docs/content-v2-spec.json — `summary` per focus area, which is also
   what platform_topics.description holds for approved partners. */
const FA_SECTIONS = [
  {
    n: "1",
    title: "Setup",
    blurb:
      "Getting legally ready, planning the money, finding the space, building a team, and opening the doors.",
    areas: [
      [
        "Get Legally Ready",
        "Before we open our Palestine House, we need to make sure the basic legal and business setup is in place.",
      ],
      ["Plan the Money", "Before we open our Palestine House, we need a simple plan for the money."],
      [
        "Find and Prepare the Space",
        "Once we are legally ready, we need to find a venue that will work well for our Palestine House.",
      ],
      [
        "Build a Small Team",
        "As we get ready to open, we need to think about who will run our Palestine House day to day.",
      ],
      [
        "Get Ready To Open",
        "Once the space, team and money are in place, we need a simple countdown to opening day.",
      ],
    ],
  },
  {
    n: "2",
    title: "Operate",
    blurb:
      "Money, daily routines, food and drink, members and visitors, your team, and a monthly check-up.",
    areas: [
      ["Money", "Once we are open, we need a simple way to stay on top of our money."],
      [
        "Daily House Operations",
        "Running our Palestine House day to day comes down to a few simple routines.",
      ],
      ["Food & Beverages", "If our Palestine House has a café or simple F&B offer, we keep it lean."],
      [
        "Members and Visitors",
        "Our members and visitors are at the heart of our Palestine House, so we look after them well.",
      ],
      ["Team", "Once we are open, we need a simple way to look after our small team."],
      [
        "Monthly Check-Up",
        "Instead of complex performance management, we have one monthly “How are we doing?” review.",
      ],
    ],
  },
  {
    n: "3",
    title: "Program",
    blurb:
      "Planning the calendar, running each event, working with artists, promoting it, and learning from it.",
    areas: [
      [
        "Plan the Calendar",
        "Before we plan any single event, we start with the calendar as a whole — a simple picture of what is coming up.",
      ],
      [
        "Plan an Event",
        "Once we know what’s on the calendar, we plan each event the same simple way, every time.",
      ],
      [
        "Work with Artists and Speakers",
        "When we bring in artists or speakers, we treat them professionally while keeping things simple.",
      ],
      [
        "Promote the Event",
        "Once an event is planned, we let people know about it the same simple way every time.",
      ],
      ["Learn the Event", "After every event, we take a few minutes to look back and learn."],
      ["Connect to the Wider Palestine House Network", "We don’t have to do everything alone."],
    ],
  },
  {
    n: "4",
    title: "Support",
    blurb:
      "Marketing, sponsorship and fundraising, partnerships, and the help of the wider network.",
    areas: [
      ["Marketing", "We need basic help to make people aware of our house and its programs."],
      [
        "Sponsorship & Fundraising",
        "Sponsorship and fundraising help us grow, and we keep the process simple enough for a small team to run.",
      ],
      [
        "Partnerships",
        "Partnerships help us do more than we could alone, so we build simple, useful relationships with others in our city.",
      ],
      /* ⚠️ FOR THE OWNER'S PREVIEW REVIEW. This one reads as an internal note
         about the website rather than a description of the focus area, and in
         public it lands oddly — "our site" is the partner's House site, but a
         visitor will read it as this one. It is reproduced verbatim anyway,
         because D-PP-s's rule is the owner's own opening sentence and silently
         rewriting his words is exactly what that rule exists to prevent. If he
         wants it changed, the fix belongs in the Overview document, so public
         and private move together. */
      [
        "Ask Community Support for Help",
        "This should be one of the easiest and most visible things to do on our site.",
      ],
      [
        "Learn from Other Palestine Houses",
        "We’re part of a network of houses, and we can learn a lot from each other.",
      ],
    ],
  },
] as const;

/* What opens behind the gate, per focus area (D-PP-f). "Checklist" is gone with
   the checklists themselves; "Overview" is gone because there is no Overview
   card — the summary above IS the overview. */
const FA_CAPS = ["Summary", "Simple guide", "Video", "Templates"] as const;

export default function FocusAreasPage() {
  return (
    <>
      {/* 1 — Split hero (owner mockup, 2026-07-15): cream copy · eyebrow hairline
          · the folded dark stats card · the green-door courtyard photo in a
          rounded panel. The former standalone dark proof band is now this card. */}
      <section className="fa-hero">
        <Reveal className="fa-hero-copy">
          <p className="ph-eyebrow fa-hero-eyebrow">The full map</p>
          <h1 className="fa-hero-h1">
            Everything you need to build and run a House.
          </h1>
          <p className="fa-hero-lead">
            A practical, step-by-step playbook designed to help you plan, launch,
            operate, and grow with confidence — built from real experience and
            ready to use.
          </p>
          <dl className="fa-hero-stats stat-strip">
            {FA_STATS.map((s) => (
              <div key={s.label} className="stat-item">
                <dt>{s.label}</dt>
                <dd>{s.n}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
        <div className="fa-hero-photo">
          <Photo
            assetId="ph-photo-focus-hero"
            alt="The green door of a Palestine House, open to a sunlit courtyard café."
            sizes="(max-width: 880px) 100vw, 55vw"
            priority
          />
        </div>
      </section>

      {/* 3 — How to read this map */}
      <section className="ph-section">
        <Reveal className="ph-container fa-read">
          <div className="fa-read-copy">
            <p className="ph-eyebrow">How to read this map</p>
            <p className="fa-read-text">
              The playbook is organised into four sections — Setup, Operate,
              Program and Support — and each section opens to its focus areas. On
              the public site you can see every focus area and a short summary.
              The full guides, videos, and templates open once you’re an approved
              partner.
            </p>
          </div>
          <div className="fa-keys">
            <p className="fa-key-line">
              <LockOpen size={17} aria-hidden="true" />
              <span>
                <strong>Open to everyone</strong> — every focus area and a short
                summary.
              </span>
            </p>
            <p className="fa-key-line">
              <Lock size={17} aria-hidden="true" />
              <span>
                <strong>Open to partners</strong> — guides, videos, and
                templates.
              </span>
            </p>
          </div>
        </Reveal>
      </section>

      {/* 4 — The full map (editorial index) */}
      <section className="ph-section-lg ph-section-dark">
        <div className="ph-container">
          <Reveal className="sec-head fa-head-wide">
            <p className="ph-eyebrow">Four sections · Twenty-two focus areas</p>
            <h2>The full map of the playbook.</h2>
          </Reveal>
          <div className="fa-index">
            {FA_SECTIONS.map((s, i) => (
              <Reveal key={s.n} delay={(i % 2) * 0.07}>
                <article className="fa-entry">
                  <div className="fa-entry-head">
                    <span className="fa-letter">{s.n}</span>
                    <div>
                      <h3>{s.title}</h3>
                      <p className="fa-entry-blurb">{s.blurb}</p>
                    </div>
                  </div>
                  <ul className="fa-topics">
                    {s.areas.map((a) => (
                      <li key={a[0]} className="fa-topic">
                        <Lock size={14} aria-hidden="true" />
                        <span>
                          <span className="fa-topic-title">{a[0]}</span>
                          <span className="fa-topic-sub">{a[1]}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="fa-caps">
                    <span className="fa-caps-label">Partner-gated</span>
                    {FA_CAPS.map((c, j) => (
                      <span key={c} className="fa-cap">
                        {c}
                        {j < FA_CAPS.length - 1 ? " ·" : ""}
                      </span>
                    ))}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5 — Closing */}
      <section className="ph-section-lg">
        <Reveal className="ph-container statement">
          <p className="ph-eyebrow">Access the full playbook</p>
          <h2 className="fa-close-h">
            The full playbook becomes available once your application is approved
            by HQ.
          </h2>
          <p className="statement-sub">
            You have seen the map. Approved partners gain access to the practical
            guides, videos, and ready-to-use templates behind every focus area.
          </p>
          <ApplyCta />
        </Reveal>
      </section>
    </>
  );
}
