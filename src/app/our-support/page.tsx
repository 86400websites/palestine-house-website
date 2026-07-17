import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Info,
  Infinity as InfinityIcon,
  LayoutGrid,
  Play,
  UtensilsCrossed,
} from "lucide-react";
import { Photo } from "@/components/shared/photo";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

/* Our Support (/our-support) — copy verbatim from docs/page-copy/
   01-public-pages/our-support.md; layout from docs/page-designs/public/
   OurSupport.app.jsx (approved mockup). */

export const metadata: Metadata = {
  title: "Our Support",
  description:
    "What HQ gives every partner — the full playbook (11 focus areas, 33 topics, 297 templates), the standards, Aswātna, and support from first decision to open doors.",
};

/* Hero proof row — the canonical numbers, shown under the lead (mockup).
   Labels per the owner copy overhaul (2026-07-17); counts updated to 11 · 33 ·
   297 with Focus Area 11 (FA11, 2026-07-18, decision D-FA11-a). */
const SUP_PROOF = [
  { icon: BookOpen, n: "11", label: "focus areas" },
  { icon: LayoutGrid, n: "33", label: "core topics" },
  { icon: FileText, n: "297", label: "ready-to-use templates" },
  { icon: CalendarDays, n: "120", label: "day guided launch plan" },
] as const;

/* Aswātna — how the cultural partner shows up across the launch (mockup). */
const SUP_ASWATNA = [
  {
    assetId: "ph-photo-support-aswatna-1",
    alt: "A singer and guitarist performing together at a House.",
    label: "Before opening",
    text: "We help define the programme, identify the right creative partners, and shape a launch that introduces the House with clarity and purpose.",
  },
  {
    assetId: "ph-photo-support-aswatna-2",
    alt: "A packed audience filming a candlelit night of live music.",
    label: "At launch",
    text: "We support opening-week programming through artists, performances, conversations, cultural partnerships, and event development.",
  },
  {
    assetId: "ph-photo-support-aswatna-3",
    alt: "Guests dancing at a House celebration beside a keyboard player.",
    label: "After launch",
    text: "We continue supporting the programme over time — helping the House maintain creative quality, cultural depth, and a coherent identity throughout the year.",
  },
] as const;

/* "Support does not end on opening day" — the ongoing-support topics. (The
   who-brings-what split that used to close this page was removed in the
   2026-07-17 copy overhaul: it already lives on Bring a House.) */
const SUP_ONGOING = [
  {
    icon: CalendarDays,
    title: "Programming",
    text: "Build a coherent cultural calendar that gives people regular reasons to return.",
  },
  {
    icon: UtensilsCrossed,
    title: "Food & Hospitality",
    text: "Maintain consistency, quality, warmth, and a guest experience rooted in Palestinian hospitality.",
  },
  {
    icon: InfinityIcon,
    title: "Membership & Community",
    text: "Turn first-time visitors into lasting relationships and build a community around the House.",
  },
  {
    icon: BarChart3,
    title: "Finance & Operations",
    text: "Use clear systems, reporting, and practical tools to keep the House stable and sustainable.",
  },
] as const;

/* The Backing — the three-stage, 120-day launch path as a numbered timeline. */
const SUP_STAGES = [
  {
    n: "01",
    name: "Plan & Prepare",
    lead: "Build the foundation.",
    text: "Venue assessment, company structure, governance, early budgets, local partnerships, and launch planning.",
  },
  {
    n: "02",
    name: "Design & Build",
    lead: "Turn the plan into a functioning House.",
    text: "Fit-out, suppliers, permissions, brand implementation, operating systems, and guest experience.",
  },
  {
    n: "03",
    name: "Operate & Program",
    lead: "Prepare the House to open and grow.",
    text: "Team training, cultural programming, hospitality, daily operations, soft opening, and public launch.",
  },
] as const;

/* Every topic ships the same six artefacts — shown as documents, not icons. */
const SUP_ARTEFACTS = [
  {
    icon: Info,
    name: "A clear overview",
    text: "Understand what the topic covers and why it matters.",
  },
  {
    icon: Bookmark,
    name: "A practical guide",
    text: "Plain-language advice designed to be useful in real working conditions.",
  },
  {
    icon: CheckCircle2,
    name: "A step-by-step checklist",
    text: "Every action placed in a clear order, with progress saved as you work.",
  },
  {
    icon: AlertTriangle,
    name: "What to watch for",
    text: "Common mistakes, risks, and decisions that need extra attention.",
  },
  {
    icon: Play,
    name: "A short walkthrough",
    text: "A visual explanation you can return to whenever you need it.",
  },
  {
    icon: Download,
    name: "Ready-to-use templates",
    text: "Contracts, plans, rotas, budgets, policies, and working documents ready to adapt.",
  },
] as const;

export default function OurSupportPage() {
  return (
    <>
      {/* 1 — v3 split hero (DR3.3): cream copy + proof row · flag photo right */}
      <section className="support-hero">
        <Reveal className="support-hero-copy">
          <p className="ph-eyebrow">Our Support</p>
          <h1 className="support-hero-h1">
            You bring the commitment. We help you build it well.
          </h1>
          <p className="support-hero-lead">
            Opening a Palestine House involves hundreds of decisions — from
            finding the right venue and building a team to shaping the
            programme, managing the finances, and preparing to welcome your
            first guests. You will not have to solve them alone. Every approved
            partner receives a complete operating system, practical tools,
            cultural guidance from Aswātna, and a clear 120-day path from first
            decision to opening day.
          </p>
          <ul className="support-hero-proof">
            {SUP_PROOF.map((s) => (
              <li key={s.label} className="support-hero-stat">
                <s.icon className="support-hero-stat-icon" aria-hidden="true" />
                <span className="support-hero-stat-n">{s.n}</span>
                <span className="support-hero-stat-l">{s.label}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <div className="support-hero-photo">
          <Photo
            assetId="ph-photo-support-hero"
            alt="A woman waving a Palestinian flag as a House gathering claps her on."
            sizes="(max-width: 880px) 100vw, 55vw"
            priority
          />
        </div>
      </section>

      {/* 2 — The full playbook */}
      <section className="ph-section-lg">
        <div className="ph-container">
          <Reveal className="sec-head">
            <p className="ph-eyebrow">The toolkit</p>
            <h2>A complete operating system, ready when you need it.</h2>
            <p className="ph-lead">
              Everything required to plan, open, and run a House is organised in
              one place. The system is divided into eleven focus areas and
              thirty-three practical topics, so you can concentrate on the
              decisions that matter now without losing sight of what comes next.
            </p>
            <p className="sup-artefacts-intro">Every topic includes:</p>
          </Reveal>
          <Reveal className="sup-artefacts">
            {SUP_ARTEFACTS.map((a) => (
              <Link
                key={a.name}
                href="/focus-areas"
                className="ph-card sup-artefact"
              >
                <span className="sup-artefact-icon">
                  <a.icon size={22} aria-hidden="true" />
                </span>
                <div>
                  <h3>{a.name}</h3>
                  <p>{a.text}</p>
                </div>
              </Link>
            ))}
          </Reveal>
          <Reveal className="sup-templates">
            <p className="sup-templates-line">
              Start with proven tools, not a blank page. With{" "}
              <strong>297 templates</strong> across the platform, your team can
              spend less time creating documents from scratch and more time
              building the House itself.
            </p>
            <Button asChild size="lg">
              <Link href="/focus-areas">
                See the full map
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* 3 — The Standard: copy · three arched photos · PH lockup (DR3.3) */}
      <section className="ph-section-lg support-standard">
        <div className="ph-container support-standard-grid">
          <Reveal className="support-standard-copy">
            <p className="ph-eyebrow">Shared standards</p>
            <h2 className="support-standard-h">
              One name. A consistent level of care.
            </h2>
            <span className="support-orn" aria-hidden="true" />
            <p className="support-standard-body">
              Every Palestine House responds to its own city, community, and
              local character. What remains consistent is the standard behind
              the experience: thoughtful hospitality, cultural integrity,
              professional operation, and attention to detail. A guest should
              feel the same level of care wherever they enter a Palestine House —
              without every location looking or feeling identical.
            </p>
          </Reveal>
          <Reveal className="support-standard-arches">
            <div className="support-standard-arch">
              <Photo
                assetId="ph-photo-support-standard-1"
                alt="A candlelit café table set with red carnations."
                sizes="(max-width: 620px) 240px, (max-width: 980px) 30vw, 200px"
              />
            </div>
            <span className="support-standard-star" aria-hidden="true" />
            <div className="support-standard-arch">
              <Photo
                assetId="ph-photo-support-standard-2"
                alt="A stage set with instruments and woven rugs before a performance."
                sizes="(max-width: 620px) 240px, (max-width: 980px) 30vw, 200px"
              />
            </div>
            <span className="support-standard-star" aria-hidden="true" />
            <div className="support-standard-arch">
              <Photo
                assetId="ph-photo-support-standard-3"
                alt="A guest listening intently during a House gathering."
                sizes="(max-width: 620px) 240px, (max-width: 980px) 30vw, 200px"
              />
            </div>
          </Reveal>
          <Reveal className="support-standard-seal">
            {/* eslint-disable-next-line @next/next/no-img-element -- brand lockup, fixed aspect */}
            <img
              className="support-standard-lockup"
              src="/assets/logo/ph-logo-lockup.png"
              alt="Palestine House — Our Culture Embassy"
            />
            <p className="support-standard-tagline">
              One name.
              <br />
              One shared standard.
              <br />
              A House shaped by its city.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 4 — Aswātna: muted-red band + gold seal · three captioned photos (DR3.3) */}
      <section className="ph-section-lg support-aswatna">
        <div className="ph-container support-aswatna-grid">
          <Reveal className="support-aswatna-intro">
            {/* the doc's section label is "Cultural support from Aswātna" — the
                "from Aswātna" half is carried by the wordmark directly below,
                so the eyebrow states the rest without stuttering the name. */}
            <p className="ph-eyebrow">Cultural support from</p>
            <h2 className="support-aswatna-name">Aswātna</h2>
            <p className="support-aswatna-tag">
              Cultural direction that continues beyond launch.
            </p>
            <p className="support-aswatna-body">
              A strong Palestine House needs more than a busy events calendar.
              Its programme should feel thoughtful, connected, and rooted in
              Palestinian culture while responding meaningfully to the city
              around it. Aswātna works alongside each House to shape that
              cultural direction.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element -- partner seal, fixed size */}
            <img
              className="support-aswatna-seal"
              src="/assets/partners/aswatna-mark-gold.png"
              alt="Aswātna Studio"
            />
          </Reveal>
          <Reveal className="support-aswatna-cols">
            {SUP_ASWATNA.map((c) => (
              <div key={c.label} className="support-aswatna-col">
                <div className="support-aswatna-photo">
                  <Photo
                    assetId={c.assetId}
                    alt={c.alt}
                    sizes="(max-width: 620px) 100vw, (max-width: 980px) 33vw, 260px"
                  />
                </div>
                <div className="support-aswatna-cap">
                  <p className="support-aswatna-col-label">{c.label}</p>
                  <p className="support-aswatna-col-text">{c.text}</p>
                </div>
              </div>
            ))}
          </Reveal>
          <Reveal>
            <p className="support-aswatna-note">
              The goal is not simply to fill the calendar. It is to build a
              cultural programme people trust and return to.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 5 — The Backing: copy + button · horizontal numbered timeline (DR3.3) */}
      <section className="ph-section-lg support-backing">
        <div className="ph-container support-backing-grid">
          <Reveal className="support-backing-copy">
            <p className="ph-eyebrow">The 120-day path</p>
            <h2 className="support-backing-h">
              Clear milestones. The right decisions in the right order.
            </h2>
            <span className="support-orn" aria-hidden="true" />
            {/* the old lead ("A 120-day path with clear milestones and constant
                guidance.") is retired: the doc promoted that information into
                the eyebrow + heading above, so it now only stutters. */}
            <Button
              asChild
              variant="outline"
              className="support-backing-cta"
            >
              <Link href="/bring-ph#checkpoints">
                View the 120-day launch
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </Reveal>
          <Reveal className="support-backing-timeline">
            <ol className="support-timeline">
              {SUP_STAGES.map((s) => (
                <li key={s.n} className="support-timeline-step">
                  <span className={`support-timeline-node is-${s.n}`}>
                    {s.n}
                  </span>
                  <div className="support-timeline-body">
                    <p className="support-timeline-name">{s.name}</p>
                    <p className="support-timeline-lead">{s.lead}</p>
                    <p className="support-timeline-text">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="support-timeline-caption">
              You always know where you are, what comes next, and what is ready.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 6 — What you're responsible for: ongoing-support band + who-brings-what
          split (DR3.3) */}
      <section className="support-duties">
        <div className="support-duties-band">
          <div className="ph-container support-duties-band-grid">
            <Reveal className="support-duties-intro">
              <h2 className="support-duties-h">
                Support does not end on opening day.
              </h2>
              <p className="support-duties-sub">
                Opening the doors is the beginning. The first public launch is an
                important milestone, but a House succeeds through what happens in
                the months and years that follow. We continue supporting you
                across the areas that keep the House culturally meaningful,
                operationally strong, and financially sustainable.
              </p>
            </Reveal>
            <Reveal className="support-duties-topics">
              {SUP_ONGOING.map((t) => (
                <div key={t.title} className="support-duties-topic">
                  <t.icon className="support-duties-topic-icon" aria-hidden="true" />
                  <p className="support-duties-topic-title">{t.title}</p>
                  <p className="support-duties-topic-text">{t.text}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
