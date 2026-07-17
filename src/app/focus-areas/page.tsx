import type { Metadata } from "next";
import { Lock, LockOpen } from "lucide-react";
import { Photo } from "@/components/shared/photo";
import { ApplyCta } from "@/components/sections/apply-cta";
import { Reveal } from "@/components/motion/reveal";

/* Focus Areas (/focus-areas) — the public, anon-safe map of the playbook:
   titles + overviews only; full depth opens to approved partners. Copy
   verbatim from docs/page-copy/01-public-pages/focus-areas.md; layout from
   docs/page-designs/public/FocusAreas.app.jsx (approved mockup). */

export const metadata: Metadata = {
  title: "Focus Areas",
  description:
    "The full map of the playbook — ten focus areas, thirty topics, 267 templates. Every title and overview is public; the full depth opens to approved partners.",
};

const FA_STATS = [
  { n: "10", label: "focus areas" },
  { n: "30", label: "topics" },
  { n: "200+", label: "checklist items" },
  { n: "267", label: "real templates" },
  { n: "120", label: "day launch" },
] as const;

const FA_AREAS = [
  {
    k: "A",
    title: "The House Promise",
    blurb:
      "Mission and values, the guest and member experience, and brand standards.",
    topics: [
      ["Mission, Values & Guest Promise", "Mission and values"],
      ["Guest Journey & Member Journey", "The guest and member experience"],
      ["Brand Experience Standards", "Brand standards"],
    ],
  },
  {
    k: "B",
    title: "Operating Model & Governance",
    blurb:
      "How a House runs, stays accountable, and meets its legal and ethical duties.",
    topics: [
      ["Operating Model", "How a House runs"],
      ["Governance & Ethics", "Staying accountable"],
      ["Legal, Compliance & Risk", "Legal and ethical duties"],
    ],
  },
  {
    k: "C",
    title: "People System",
    blurb:
      "Structure and roles, hiring and training, and a values-driven team culture.",
    topics: [
      ["Org Structure & Roles", "Structure and roles"],
      ["Hiring, Onboarding & Training", "Hiring and training"],
      ["Performance Management & Culture", "A values-driven team culture"],
    ],
  },
  {
    k: "D",
    title: "Programming & Cultural Quality",
    blurb:
      "The programming model, the Aswātna collaboration, and event production.",
    topics: [
      ["Programming Model & Pillars", "The programming model"],
      ["Aswātna Studio Collaboration", "The Aswātna collaboration"],
      ["Event Production SOPs", "Event production"],
    ],
  },
  {
    k: "E",
    title: "Membership, Community & Service",
    blurb:
      "Membership, customer service and recovery, and community partnerships.",
    topics: [
      ["Membership Model & Benefits", "Membership"],
      ["Customer Service & Recovery", "Customer service and recovery"],
      ["Community Partnerships", "Community partnerships"],
    ],
  },
  {
    k: "F",
    title: "Operations Engine",
    blurb: "Facility, food and beverage, and inventory and procurement.",
    topics: [
      ["Facility Operations", "Facility"],
      ["Food & Beverage Operations", "Food and beverage"],
      ["Inventory & Procurement", "Inventory and procurement"],
    ],
  },
  {
    k: "G",
    title: "Marketing, Communications & Growth",
    blurb: "Local marketing, global campaigns, and the retail shop.",
    topics: [
      ["Local Marketing Playbook", "Local marketing"],
      ["Global Campaigns", "Global campaigns"],
      ["Retail / Shop Operations", "The retail shop"],
    ],
  },
  {
    k: "H",
    title: "Finance, Reporting & Sustainability",
    blurb:
      "The business and revenue model, financial controls, and reporting and KPIs.",
    topics: [
      ["Business Model & Revenue", "The business and revenue model"],
      ["Financial Operations & Controls", "Financial controls"],
      ["Reporting, KPIs & Audits", "Reporting and KPIs"],
    ],
  },
  {
    k: "I",
    title: "Quality Control & Continuous Improvement",
    blurb:
      "Technology and data, launching a new House, and crisis management.",
    topics: [
      ["Technology Stack & Data", "Technology and data"],
      ["Launching a New House", "Launching a new House"],
      ["Crisis Management", "Crisis management"],
    ],
  },
  {
    k: "J",
    title: "Appendices & Tools Library",
    blurb:
      "Continuous improvement, the master template index, and sustainability and impact.",
    topics: [
      ["Continuous Improvement & Knowledge Sharing", "Continuous improvement"],
      ["Templates & Master Index", "The master template index"],
      ["Sustainability & Impact", "Sustainability and impact"],
    ],
  },
] as const;

const FA_CAPS = ["Overview", "Guide", "Checklist", "Video", "Templates"] as const;

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
              Each focus area (A–J) opens to its topics. On the public site you
              can see every title and a short overview. The full guides,
              checklists, videos, and templates open once you’re an approved
              partner.
            </p>
          </div>
          <div className="fa-keys">
            <p className="fa-key-line">
              <LockOpen size={17} aria-hidden="true" />
              <span>
                <strong>Open to everyone</strong> — every topic title and a
                short overview.
              </span>
            </p>
            <p className="fa-key-line">
              <Lock size={17} aria-hidden="true" />
              <span>
                <strong>Open to partners</strong> — guides, checklists, videos,
                and templates.
              </span>
            </p>
          </div>
        </Reveal>
      </section>

      {/* 4 — The full map (editorial index) */}
      <section className="ph-section-lg ph-section-dark">
        <div className="ph-container">
          <Reveal className="sec-head fa-head-wide">
            <p className="ph-eyebrow">Ten focus areas · Thirty topics</p>
            <h2>The full map of the playbook.</h2>
          </Reveal>
          <div className="fa-index">
            {FA_AREAS.map((a, i) => (
              <Reveal key={a.k} delay={(i % 2) * 0.07}>
                <article className="fa-entry">
                  <div className="fa-entry-head">
                    <span className="fa-letter">{a.k}</span>
                    <div>
                      <h3>{a.title}</h3>
                      <p className="fa-entry-blurb">{a.blurb}</p>
                    </div>
                  </div>
                  <ul className="fa-topics">
                    {a.topics.map((t) => (
                      <li key={t[0]} className="fa-topic">
                        <Lock size={14} aria-hidden="true" />
                        <span>
                          <span className="fa-topic-title">{t[0]}</span>
                          <span className="fa-topic-sub">{t[1]}</span>
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
            guides, step-by-step checklists, videos, and ready-to-use templates
            behind every topic.
          </p>
          <ApplyCta />
        </Reveal>
      </section>
    </>
  );
}
