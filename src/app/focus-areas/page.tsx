import type { Metadata } from "next";
import { Lock, LockOpen } from "lucide-react";
import { Photo } from "@/components/shared/photo";
import { ApplyCta } from "@/components/sections/apply-cta";
import { Reveal } from "@/components/motion/reveal";

/* Focus Areas (/focus-areas) — the public, anon-safe map of the toolkit:
   titles + one-line summaries only; full depth stays behind the approval gate.
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

   The real model is four sections → 22 focus areas → 83 templates and practical
   tools (restated at CR1).

   COPY PROVENANCE (D-PP-s, resolved 2026-08-16; restated at CR1). CLAUDE.md holds
   copy verbatim from docs/page-copy/ and never invents it. The owner granted a
   deliberate, scoped exception here — "You can write your own copy please based
   on the overview etc you already have for the new focus areas" — with a rule
   that keeps it honest: **each focus area's public title and one-liner are the
   owner's own card title and summary** (at CR1, the Private Website Copy's
   "Replacement title" and "Summary"; never its expanded body), and the private
   card shows the same summary. Public and private therefore cannot drift.
   Supplied word for word by the owner's Public Website Copy §6: the H1, the lead,
   the stats, the resource labels, the closing eyebrow and heading, and the "Apply
   to join…", "Once access is confirmed…" and "Your application…" sentences.
   Carried over from before CR1, not supplied: the other eyebrows, the map heading
   and the rest of the map paragraph ("toolkit", the doc's noun, replaced "playbook"
   at CR1), "Open to everyone…" and "You have seen the map." Written for this page:
   the "Private resources" label, the "where published" on the video label, and the
   four section lines below, each a plain list of the focus areas it contains —
   connective tissue, per docs/page-copy/00-global/brand-voice.md.

   The owner reviews this page on Preview before PP7 closes. */

export const metadata: Metadata = {
  title: "Focus Areas",
  description:
    "Four sections and 22 focus areas bring practical resources together for preparing and running a local House. The toolkit contains 83 templates and practical tools.",
};

/* 200+ checklist items is GONE, not updated: checklists were dropped at D-PP-b
   and 0030 deletes the last 818 rows, so the number now describes nothing.
   CR1: labels per Public Website Copy §6.1. The fourth position is a phrase, not a
   figure — the doc's one string, split at its own comma, as on /our-support. Unlike
   there, the label comes first in the DOM (a <dt> must precede its <dd>, and
   .stat-item's column-reverse lifts the figure above it), so assistive tech and
   no-CSS readers get the two halves of that phrase in reverse order. */
const FA_STATS = [
  { n: "4", label: "resource sections" },
  { n: "22", label: "focus areas" },
  { n: "83", label: "templates and practical tools" },
  { n: "Your pace,", label: "your local opening plan." },
] as const;

/* The 22, in the owner's order, with his own titles and one-line summaries.
   Source: the Private Website Copy (CR1) — "Replacement title" and "Summary" per
   focus area, the same summary platform_topics.description holds behind the gate. */
const FA_SECTIONS = [
  {
    n: "1",
    title: "Setup",
    blurb:
      "Prepare your House: local requirements, finances, a suitable space, a small team and a realistic opening plan.",
    areas: [
      [
        "Get Legally Ready",
        "Get local requirements, identity materials and contributed-content permissions clear before opening.",
      ],
      [
        "Plan the Finances",
        "Understand opening costs, running costs, income and working cash with a worked example.",
      ],
      ["Find and Prepare the Space", "Compare spaces that fit your community, program and budget."],
      ["Build a Small Team", "Give the essential work clear owners without building a large team."],
      [
        "Get Ready to Open",
        "Track opening preparation in one master checklist and use a run sheet on the day.",
      ],
    ],
  },
  {
    n: "2",
    title: "Operate",
    blurb:
      "Keep daily life manageable: money, the venue, food and drinks where offered, members and visitors, the team and local reviews.",
    areas: [
      [
        "Manage the Finances",
        "Keep daily money records and use the shared Monthly House Review once at month-end.",
      ],
      [
        "Manage Daily House Operations",
        "Use simple routines to keep the House ready and cared for.",
      ],
      [
        "Manage Food and Beverage",
        "Keep your food and drink offer manageable, where your House has one.",
      ],
      ["Manage Members and Visitors", "Welcome people well and make it easy to stay connected."],
      ["Manage the Team", "Support a small team with clear schedules and responsibilities."],
      [
        "Conduct a Monthly Check-Up",
        "Use one monthly form for House activity, money, issues and next actions.",
      ],
    ],
  },
  {
    n: "3",
    title: "Program",
    blurb:
      "Create a cultural calendar, plan events, work with contributors, promote activities and learn from what happens.",
    areas: [
      [
        "Plan the Programming Calendar",
        "Build a Palestinian cultural calendar that the team can deliver.",
      ],
      ["Plan an Event", "Separate preparation, event-day delivery and follow-up."],
      [
        "Work with Artists and Speakers",
        "Make arrangements clear and treat contributors with care.",
      ],
      [
        "Promote the Event",
        "Prepare an accurate invitation using the copy template and editable social layouts.",
      ],
      ["Learn from the Event", "Use a short review to make the next event better."],
      [
        "Connect with the Wider Palestine House Network",
        "Find artists, optional programming providers and possible House-to-House collaborations.",
      ],
    ],
  },
  {
    n: "4",
    title: "Support",
    blurb:
      "Find tools for marketing, funding and partnerships. Request community contacts and explore ways to learn from other Houses.",
    areas: [
      [
        "Manage Marketing",
        "Help people discover your House and understand what makes it worth returning to.",
      ],
      [
        "Manage Sponsorship and Fundraising",
        "Explore relevant funding opportunities and keep commitments clear.",
      ],
      ["Build Partnerships", "Build a few practical relationships that help both sides."],
      ["Ask the Community for Help", "Choose a real contact route and ask one clear question."],
      [
        "Learn from Other Palestine Houses",
        "Exchange useful experience through a known contact or confirmed community channel.",
      ],
    ],
  },
] as const;

/* What opens behind the gate, per focus area: Public Website Copy §6.2's four
   resource types, in its own words, with the video qualified because a video
   exists only where one has been published (CR1). "Checklist" is gone with the
   checklists themselves. */
const FA_CAPS = [
  "A clear overview",
  "A simple guide",
  "A video walkthrough where published",
  "Templates and practical tools",
] as const;

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
            Find the resource for the question in front of you.
          </h1>
          <p className="fa-hero-lead">
            Four sections and 22 focus areas bring practical resources together
            for preparing and running a local House. Begin with one question
            rather than the entire library.
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
              The toolkit is organized into four sections — Setup, Operate,
              Program and Support — and each section opens to its focus areas. On
              the public site you can see every focus area and a short summary.
              Once access is confirmed, sign in to the private platform.
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
                <strong>Apply to join</strong> for access to the private
                resources and community connections.
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
            <h2>The full map of the toolkit.</h2>
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
                    <span className="fa-caps-label">Private resources</span>
                    {FA_CAPS.map((c) => (
                      <span key={c} className="fa-cap">
                        {c}
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
          <p className="ph-eyebrow">JOIN THE COMMUNITY</p>
          <h2 className="fa-close-h">One simple route into the community.</h2>
          <p className="statement-sub">
            You have seen the map. Your application is used to arrange community
            access.
          </p>
          <ApplyCta />
        </Reveal>
      </section>
    </>
  );
}
