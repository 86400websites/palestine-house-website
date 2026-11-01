import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Photo, ART_SOURCES } from "@/components/shared/photo";
import {
  OliveBranch,
  SparkMark,
  StarLogo,
} from "@/components/shared/ornament";
import { PageHero } from "@/components/sections/page-hero";
import { StageCards, type StageCopy } from "@/components/sections/stage-cards";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

/* Bring a House (/bring-ph) — absorbs the old How It Works (stage triptych +
   gates timeline). Copy verbatim from the owner's Public Website Copy §5 (CR1);
   §2/3/5/6/7 layout matches the owner's editorial mockups
   (public/assets/Bring a House/), built on the shared ornament marks. */

export const metadata: Metadata = {
  title: { absolute: "Bring a House - Palestine House" },
  description:
    "Explore the practical work of building a local Palestine House and apply to join the community.",
};

const BRING_YOU = [
  "A suitable space and a realistic opening plan.",
  "A manageable team with clear responsibilities.",
  "Relationships with local artists, audiences and organizations.",
  "Finances, permissions and routines that fit the actual House.",
] as const;

const BRING_WE = [
  "Practical overviews and simple guides.",
  "Editable templates, samples and working tools.",
  "Opportunities to ask peers for ideas and useful examples.",
  "Connections and collaborations when others are interested and available.",
] as const;

const BRING_STAGES: readonly StageCopy[] = [
  {
    name: "Plan and Prepare",
    text: "Understand your audience, check local requirements, plan the money and compare suitable spaces. Use the guides and templates to build a realistic local plan.",
    photo: "ph-photo-stage-plan",
    alt: "A planning studio wall of maps, sketches and tile samples for a new Palestine House.",
  },
  {
    name: "Design and Build",
    text: "Prepare a welcoming and workable space. Your local team handles the venue, suppliers, permissions, fit-out and practical arrangements, using the resources that help.",
    photo: "ph-photo-stage-build",
    alt: "A workshop of patterned tiles, timber and lanterns mid-build.",
  },
  {
    name: "Operate and Program",
    text: "Build manageable routines, welcome people, shape a cultural calendar and learn from daily experience. Collaborate directly with other people when useful.",
    photo: "ph-photo-stage-cafe",
    alt: "A candlelit café room set for an evening performance.",
  },
];

/* Proof-band values and labels are verbatim from the owner's Public Website
   Copy §5.5 (CR1). The band moved here from Home §4 (owner, 2026-07-21) to sit
   below the three stages.

   PP7 / D-PP-a: 11 · 33 · 297 -> 4 · 22 · 88, and "200+ Checklist actions" is
   REMOVED rather than restated. Checklists were dropped at D-PP-b and migration
   0030 deletes the last 818 rows, so the number describes nothing a partner can
   reach. Five figures become four. CR1: the template count is now 83 and the
   fourth slot is "Your pace", not a fixed day count. */
const BRING_PROOF = [
  { n: "4", label: "Resource sections" },
  { n: "22", label: "Focus areas" },
  { n: "83", label: "Templates and practical tools" },
  { n: "Your pace", label: "Local opening plan" },
] as const;

const BRING_GATES = [
  {
    name: "Around 90 days before opening",
    text: "Use the early-planning section of the Master Opening Checklist for local requirements, venue work, money and people. Prepare the separate 90-Day Programming Calendar for the first three months after launch.",
  },
  {
    name: "Around 30 days before opening",
    text: "Continue in the detailed-preparation section of the same Master Opening Checklist. Test the practical arrangements, team readiness and first activities.",
  },
  {
    name: "Opening week",
    text: "Use the Master Opening Checklist to test the space, equipment, visitor journey and responsibilities, and resolve important gaps.",
  },
  {
    name: "Opening day",
    text: "Use the Opening Day Run Sheet to give the local team a clear schedule and named responsibilities.",
  },
] as const;

const BRING_RULES = [
  {
    n: "01",
    title: "Cultural independence",
    text: "Make room for Palestinian voices, creativity, heritage and contemporary life with dignity and care. Welcome conversation, learning and artistic expression without turning the House into an endorsement platform for political parties or electoral candidates.",
  },
  {
    n: "02",
    title: "Respectful identity",
    text: "Use names, logos, artwork and other shared materials within the permissions that apply. Present your local House clearly and do not imply authority to speak for every House.",
  },
  {
    n: "03",
    title: "Responsible local practice",
    text: "Look after people, meet local commitments and keep the records your own operation needs. Shared learning is voluntary; local accountability remains real. Your own funders, contracts and local authorities may have requirements separate from community participation.",
  },
] as const;

export default function BringAHousePage() {
  return (
    <div className="bring-page">
      {/* One shared arch clip for the framed photos (§7). */}
      <svg width="0" height="0" aria-hidden="true" className="bring-defs">
        <clipPath id="phArch" clipPathUnits="objectBoundingBox">
          <path d="M0.04 1 V0.42 C0.04 0.17 0.25 0 0.5 0 C0.75 0 0.96 0.17 0.96 0.42 V1 Z" />
        </clipPath>
      </svg>

      {/* 1 — v3 photo hero (DR1-9). The master is framed chest-down on the
          pour by composition — the crop centers the dallah + cups so it reads
          as an intentional detail shot. */}
      <PageHero
        photo="ph-photo-bring-house"
        alt="Arabic coffee being poured from a brass dallah into a small cup."
        position="62% 58%"
        eyebrow="Bring a House"
        title="Bring your own Palestine House to life."
        lead={[
          "You bring the local knowledge, cultural commitment and willingness to build. The community offers practical resources and opportunities to learn from other people working toward the same purpose.",
          "You do not need a finished business plan, secured venue or complete team just to apply for community access.",
        ]}
        support="Apply for community access, not permission to operate a House."
      >
        <Button asChild size="lg" className="v3-cta">
          <Link href="/apply">Apply to Join</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="v3-cta">
          <Link href="/our-support">Explore the Community</Link>
        </Button>
      </PageHero>

      {/* 2 — Why bring one (statement · arch illustration) */}
      <section className="ph-section-lg bring-why-section">
        <Reveal className="ph-container bring-why">
          <div className="bring-why-copy">
            <div className="bring-eyebrow">
              <OliveBranch className="bring-eyebrow-olive" />
              <span className="ph-eyebrow">Why bring one</span>
              <span className="bring-eyebrow-line" />
              <SparkMark className="bring-eyebrow-spark" />
            </div>
            <h2 className="statement-line bring-why-line">
              Start with the people around you
            </h2>
            <p className="statement-sub bring-why-sub">
              Who would the House serve? Which artists, audiences, organizers
              and neighbors could become part of its life? What cultural
              experiences would give them a reason to return?
            </p>
            <p className="statement-sub bring-why-sub">
              Those questions help you develop a House with a local purpose, not
              simply find a building and hope a community appears around it.
            </p>
            <span className="exp-orn bring-why-rule">
              <span />
            </span>
            <ul className="bring-why-triad">
              <li>
                <strong>For the city:</strong> a lasting place to experience
                Palestinian culture.
              </li>
              <li>
                <strong>For the people around it:</strong> a welcoming place to
                gather and belong.
              </li>
              <li>
                <strong>For the local team:</strong> a meaningful House to build
                and run responsibly.
              </li>
            </ul>
          </div>
          <div className="bring-why-visual">
            <Image
              src={ART_SOURCES["ph-art-why-bring-arch"]}
              alt=""
              aria-hidden="true"
              width={702}
              height={941}
              className="bring-why-illus"
              sizes="(max-width: 860px) 78vw, 420px"
            />
          </div>
        </Reveal>
      </section>

      {/* 3 — Who brings what (one bordered split card) */}
      <section className="ph-section-lg">
        <div className="ph-container">
          <Reveal className="sec-head is-center bring-head">
            <StarLogo className="bring-head-orn" />
            <p className="ph-eyebrow bring-eyebrow-ink">LOCAL OWNERSHIP</p>
            <h2>
              You build locally. <br />
              The community helps you learn.
            </h2>
            <span className="exp-orn">
              <span />
            </span>
            <p className="ph-lead">
              Your House is your local team’s responsibility. Community
              resources and peer connections can help you prepare and improve,
              without creating a central management relationship.
            </p>
          </Reveal>
          <Reveal className="bring-who-card">
            <div className="bring-who-half">
              <OliveBranch className="bring-half-olive" />
              <span className="bring-half-rule" />
              <h3>What your local team develops</h3>
              <ul className="bring-who-list">
                {BRING_YOU.map((t) => (
                  <li key={t}>
                    <SparkMark className="bring-spark" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bring-who-half">
              <StarLogo className="bring-half-orn bring-half-orn--star" />
              <span className="bring-half-rule" />
              <h3>What the community offers</h3>
              <ul className="bring-who-list">
                {BRING_WE.map((t) => (
                  <li key={t}>
                    <SparkMark className="bring-spark" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal>
            <p className="bring-who-note">
              You can join while your idea is still developing. The community
              does not provide operational approval, funding, a guaranteed
              collaborator or an assigned support team.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 4 — What it takes: the three stages (DR2.1-4: the v3 stage
          photo-cards via the shared StageCards — replacing the PH-HIW
          artwork triptych). The Al-Aqsa line-art beside the grid moved here
          from Home when its stages section was removed (owner dedupe,
          2026-07-20); it hides ≤1100px like on Home. */}
      <section className="ph-section-lg" id="what-it-takes">
        <div className="ph-container">
          <Reveal className="sec-head">
            <p className="ph-eyebrow">What it takes</p>
            <h2>Practical help for the stage you are working on.</h2>
            <p className="ph-lead">
              You do not need to solve everything at once. Use the relevant
              resources to understand the decision in front of you and build
              your own local plan. These are areas of work, not community
              approval gates.
            </p>
          </Reveal>
          <div className="v3-stages-layout">
            <StageCards
              sizes="(max-width: 880px) 100vw, (max-width: 1100px) 33vw, 24vw"
              stages={BRING_STAGES}
            />
            <div className="v3-stages-art" aria-hidden="true">
              <Image
                src={ART_SOURCES["ph-art-line-alaqsa"]}
                alt=""
                width={1095}
                height={1309}
                sizes="(max-width: 1100px) 0px, 30vw"
              />
            </div>
          </div>
          <Reveal>
            <p className="bring-stages-close">
              Choose the guide for the decision you are working on. Your local
              team sets the priorities and timing; you do not need to complete
              every document to move forward.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 5 — Resource statistics (DR2-4: olive proof band —
          stats over the centered caption, olive-branch ornaments clipped at
          the band edges, per the owner's proof-band mockup). Moved here from
          Home §4 (owner, 2026-07-21). */}
      {/* aria-labelledby: the caption h2 sits AFTER the stats in the DOM
          (mockup layout) — naming the section keeps screen-reader users
          oriented before the bare numbers (DR2-7 exit-gate review). */}
      <section
        className="ph-section-lg ph-section-dark ph-section-olive bring-proof"
        aria-labelledby="bring-proof-title"
      >
        <Image
          src={ART_SOURCES["ph-art-branch-4"]}
          alt=""
          aria-hidden="true"
          width={792}
          height={1200}
          sizes="190px"
          className="bring-proof-branch bring-proof-branch--left"
        />
        <Image
          src={ART_SOURCES["ph-art-branch-1"]}
          alt=""
          aria-hidden="true"
          width={1200}
          height={914}
          sizes="270px"
          className="bring-proof-branch bring-proof-branch--right"
        />
        {/* Mobile-only bookends (owner, 2026-07-06): the small olive sprig
            sits once at the top of the band and once, mirrored, at the very
            bottom — the desktop corner branches are hidden on mobile. */}
        <Image
          src={ART_SOURCES["ph-art-branch-3"]}
          alt=""
          aria-hidden="true"
          width={1200}
          height={317}
          sizes="240px"
          className="bring-proof-branch bring-proof-branch--m-top"
        />
        <Image
          src={ART_SOURCES["ph-art-branch-3"]}
          alt=""
          aria-hidden="true"
          width={1200}
          height={317}
          sizes="240px"
          className="bring-proof-branch bring-proof-branch--m-bottom"
        />
        <Reveal className="ph-container bring-proof-inner">
          <dl className="bring-proof-strip">
            {BRING_PROOF.map((p) => (
              <div key={p.label} className="bring-proof-item">
                <dt>{p.label}</dt>
                <dd>{p.n}</dd>
              </div>
            ))}
          </dl>
          {/* The caption stays centered serif (owner, 2026-07-06 — the desktop
              flanking sprigs were removed). CR1: §5.5 is a heading and two
              paragraphs, and pages.css sets the h2 and .ph-lead inline, so each
              paragraph sits in a block wrapper to start its own line. */}
          <div className="bring-proof-caption">
            <div className="bring-proof-caption-text">
              <h2 id="bring-proof-title">
                Practical resources, organized around your House.
              </h2>
              <div style={{ marginTop: "var(--space-3)" }}>
                <p className="ph-lead">
                  Find an overview, a simple guide and relevant working
                  documents within each focus area. Explore Setup, Operate,
                  Program and Support as questions arise.
                </p>
              </div>
              <div style={{ marginTop: "var(--space-3)" }}>
                <p className="ph-lead">
                  Use only what helps your next step. Video walkthroughs can be
                  watched where they have been published.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 6 — Your opening plan: arched-card timeline (copy overhaul
          2026-07-17, rebuilt to the owner's "Redesign Example" mockup —
          four milestone cards + a ribbon closing line). CR1 dropped the day
          countdown, so each circle carries its position only. The id stays:
          /our-support links to #checkpoints. */}
      <section className="ph-section-lg" id="checkpoints">
        <div className="ph-container">
          <Reveal className="sec-head is-center bring-head">
            <StarLogo className="bring-head-orn" />
            <p className="ph-eyebrow">YOUR OPENING PLAN</p>
            <h2>A timeline that fits your House.</h2>
            <span className="exp-orn">
              <span />
            </span>
            <p className="ph-lead">
              There is no compulsory community launch deadline. Your timing
              depends on the space, funding, local requirements and the work
              needed before opening.
            </p>
            <p className="ph-lead">
              The tools below are adaptable planning aids. The day labels are
              planning prompts, not fixed promises or approval stages.
            </p>
          </Reveal>
          <Reveal>
            <ol className="bring-timeline">
              {BRING_GATES.map((g, i) => (
                <li key={g.name} className="bring-arch-card">
                  <span
                    className={`bring-arch-day ${
                      i % 2 === 0 ? "is-green" : "is-terra"
                    }`}
                  >
                    <span className="bring-arch-day-num">{i + 1}</span>
                  </span>
                  <div className="bring-arch-body">
                    <h3 className="bring-arch-title">{g.name}</h3>
                    <p>{g.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal>
            <p className="bring-timeline-ribbon">
              Open when the important arrangements are ready, not simply because
              a template names a date. Local permissions and essential safety
              checks still apply.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 7 — Shared principles (light cream, per the mockup) */}
      <section className="ph-section-lg">
        <div className="ph-container">
          <Reveal className="sec-head is-center bring-head">
            <StarLogo className="bring-head-orn" />
            <p className="ph-eyebrow bring-eyebrow-flank">
              <OliveBranch flip className="bring-flank-olive" />
              SHARED PRINCIPLES
              <OliveBranch className="bring-flank-olive" />
            </p>
            <h2>Shared principles</h2>
            <span className="exp-orn">
              <span />
            </span>
          </Reveal>
          <Reveal className="bring-rules-grid">
            {BRING_RULES.map((r) => (
              <div key={r.n} className="bring-rule-card">
                <span className="bring-rule-medallion">{r.n}</span>
                <SparkMark className="bring-rule-spark" />
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </div>
            ))}
          </Reveal>
          <Reveal className="bring-rules-outro">
            <span className="bring-sprig-divider">
              <OliveBranch className="bring-divider-olive" />
            </span>
            <p className="bring-rules-close">
              A shared cultural purpose leaves room for local character and
              responsible local decisions.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 8 — The next step (CTA · arch photo) */}
      <section className="ph-section-lg">
        <Reveal className="ph-container bring-apply">
          <div className="bring-apply-copy">
            <div className="bring-wordmark">
              <StarLogo className="bring-wordmark-seal" />
              <span className="bring-wordmark-text">
                Palestine
                <br />
                House
              </span>
            </div>
            <div className="bring-eyebrow">
              <OliveBranch className="bring-eyebrow-olive" />
              <span className="ph-eyebrow">The next step</span>
              <span className="bring-eyebrow-line" />
              <SparkMark className="bring-eyebrow-spark" />
            </div>
            <h2 className="statement-line bring-apply-h">
              Ready to explore your next step?
            </h2>
            <span className="exp-orn bring-apply-rule">
              <span />
            </span>
            <p className="bring-apply-body">
              Apply to join the community and use the resources as your idea
              develops. Share a few basic details and a short introduction to
              your interest in Palestine House.
            </p>
            <p className="bring-apply-body">
              The application is for community access, not approval of your
              venue, funding or business plan. A question about joining can go
              through the existing Contact page.
            </p>
            <p className="bring-apply-body">
              <Link className="bring-contact-link" href="/contact">
                Ask a Question About Joining
              </Link>
            </p>
            <div className="bring-apply-ctas">
              <Button asChild size="lg" className="bring-cta-primary">
                <Link href="/apply">
                  Apply to Join
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bring-cta-secondary">
                <Link href="/our-support">
                  Explore the Community
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <p className="bring-apply-reassure">
              <ShieldCheck size={18} aria-hidden="true" />
              Apply for community access, not permission to operate a House.
            </p>
          </div>
          <div className="bring-apply-visual">
            <SparkMark className="bring-arch-diamond" />
            <div className="bring-arch">
              <Photo
                assetId="ph-photo-ready-apply"
                alt="The lantern-lit entrance arch of a Palestine House at dusk, opening onto a planted courtyard café."
                sizes="(max-width: 860px) 100vw, 40vw"
                className="bring-arch-photo"
              />
              <svg
                className="bring-arch-outline"
                viewBox="0 0 100 128"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M4 128 V53.8 C4 21.8 25 0 50 0 C75 0 96 21.8 96 53.8 V128 Z"
                  fill="none"
                  stroke="var(--copper-700)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
            <OliveBranch className="bring-arch-sprig" />
          </div>
        </Reveal>
      </section>
    </div>
  );
}
