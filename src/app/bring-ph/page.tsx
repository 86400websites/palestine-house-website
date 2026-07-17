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
   gates timeline). Copy verbatim from docs/page-copy/01-public-pages/
   bring-a-house.md; §2/3/5/6/7 layout matches the owner's editorial mockups
   (public/assets/Bring a House/), built on the shared ornament marks. */

export const metadata: Metadata = {
  title: "Bring a House",
  description:
    "Why bring Palestine House to your city, and what it takes — the partnership, the three stages, the 120-day launch, and the three commitments every House shares.",
};

const BRING_YOU = [
  "A suitable venue and the local knowledge to choose it well.",
  "A committed team with the experience and discipline to run the House.",
  "Relationships with local communities, artists, organisations, and audiences.",
  "The daily leadership required to build a trusted and sustainable institution.",
] as const;

const BRING_WE = [
  "The Palestine House identity and the shared standards that protect it.",
  "A complete operating system — the playbook, templates, training, and partner platform.",
  "Guidance across planning, design, launch, programming, finance, hospitality, and daily operations.",
  "Continued support after opening, so you are not left to manage the journey alone.",
] as const;

const BRING_STAGES: readonly StageCopy[] = [
  {
    name: "Plan & Prepare",
    lead: "Build the foundation.",
    text: "We help you assess the opportunity, establish the organisation, shape the budget, identify the right venue, and create a realistic plan for launch and long-term operation.",
    photo: "ph-photo-stage-plan",
    alt: "A planning studio wall of maps, sketches and tile samples for a new Palestine House.",
  },
  {
    name: "Design & Build",
    lead: "Create a space people want to return to.",
    text: "We guide the development of a welcoming, functional, and culturally grounded House — from layout and atmosphere to suppliers, permissions, systems, and fit-out.",
    photo: "ph-photo-stage-build",
    alt: "A workshop of patterned tiles, timber and lanterns mid-build.",
  },
  {
    name: "Operate & Program",
    lead: "Bring the House to life.",
    text: "We support you in building the team, opening the café and venue, launching the cultural programme, strengthening community relationships, and running the House sustainably.",
    photo: "ph-photo-stage-cafe",
    alt: "A candlelit café room set for an evening performance.",
  },
];

const BRING_GATES = [
  {
    day: "30",
    name: "The foundation is in place",
    text: "Governance established, early budget approved, local team forming, and venue options under review.",
  },
  {
    day: "60",
    name: "The House is taking shape",
    text: "Venue secured, legal structure active, brand agreement in place, suppliers confirmed, and fit-out underway.",
  },
  {
    day: "108",
    name: "Ready to welcome people",
    text: "Permits secured, team trained, operating systems active, cultural programme prepared, and soft opening completed.",
  },
  {
    day: "120",
    name: "Public launch",
    text: "The final twelve days create a deliberate buffer to resolve issues, strengthen the guest experience, and open with confidence.",
  },
] as const;

const BRING_RULES = [
  {
    n: "01",
    title: "Cultural independence",
    text: "A Palestine House does not endorse political parties, electoral candidates, or partisan organisations. It remains a space for Palestinian culture, artistic expression, learning, memory, conversation, and community.",
  },
  {
    n: "02",
    title: "Responsible use of the Palestine House name",
    text: "The brand is used consistently and with care. Major public uses are approved by HQ so that every House protects the meaning, quality, and trust carried by the name.",
  },
  {
    n: "03",
    title: "Honest and transparent operation",
    text: "Every House agrees to clear reporting, shared performance measures, and appropriate financial and operational transparency. These systems help identify challenges early and allow the network to support each House effectively.",
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
        title="Bring Palestine House to your city."
        lead="A Palestine House is a permanent home for Palestinian culture: a café, a cultural venue, and a community gathering place under one roof. You bring the local knowledge, leadership, and commitment. We bring the model, tools, standards, and support to help you build something culturally grounded, professionally run, and made to last."
        support="Every application is reviewed by HQ."
      >
        <Button asChild size="lg" className="v3-cta">
          <Link href="/apply">Apply to bring a House</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="v3-cta">
          <Link href="/our-support">See our support</Link>
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
              Give Palestinian culture a permanent address.
            </h2>
            <p className="statement-sub bring-why-sub">
              Your city may already have the artists, audiences, organisers,
              food, stories, and desire for connection. What it may not yet have
              is one permanent place where all of that can live together,
              throughout the year. A Palestine House turns scattered cultural
              moments into a lasting presence — somewhere people can gather,
              create, celebrate, learn, eat, listen, and return to.
            </p>
            <span className="exp-orn bring-why-rule">
              <span />
            </span>
            <ul className="bring-why-triad">
              <li>
                <strong>For the city,</strong> it becomes a cultural landmark.
              </li>
              <li>
                <strong>For the community,</strong> it becomes a shared home.
              </li>
              <li>
                <strong>For the local partner,</strong> it becomes a meaningful
                institution to build and lead.
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
            <p className="ph-eyebrow bring-eyebrow-ink">The partnership</p>
            <h2>Local leadership. Shared support.</h2>
            <span className="exp-orn">
              <span />
            </span>
            <p className="ph-lead">
              Every Palestine House is locally owned and operated, with the
              backing of a wider cultural and operational network. The
              partnership is defined clearly from the beginning so that everyone
              understands their role, responsibility, and contribution.
            </p>
          </Reveal>
          <Reveal className="bring-who-card">
            <div className="bring-who-half">
              <OliveBranch className="bring-half-olive" />
              <span className="bring-half-rule" />
              <h3>You bring</h3>
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
              <h3>We bring</h3>
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
              <strong>Shared responsibility.</strong> You shape the House around
              your city. We help ensure it carries the same level of cultural
              care, hospitality, quality, and professionalism as every House in
              the network.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 4 — What it takes: the three stages (DR2.1-4: Home's v3 stage
          photo-cards via the shared StageCards — replacing the PH-HIW
          artwork triptych; cards only, no side art, per the owner) */}
      <section className="ph-section-lg" id="what-it-takes">
        <div className="ph-container">
          <Reveal className="sec-head">
            <p className="ph-eyebrow">What it takes</p>
            <h2>One clear path. Three stages.</h2>
            <p className="ph-lead">
              Opening a House involves hundreds of decisions. The Palestine House
              system places them in the right order, giving you a clear view of
              what matters now, what comes next, and what can wait. The journey
              is organised across three stages within a guided 120-day launch
              plan.
            </p>
          </Reveal>
          <div className="bring-stages-cards">
            <StageCards
              sizes="(max-width: 860px) 100vw, 33vw"
              stages={BRING_STAGES}
            />
          </div>
          <Reveal>
            <p className="bring-stages-close">
              You do not face every decision at once. The platform shows you the
              stage you are in, the tasks that matter now, and the next clear
              steps.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 5 — The 120-day launch: arched-card timeline (copy overhaul
          2026-07-17, rebuilt to the owner's "Redesign Example" mockup —
          four DAY cards + a ribbon closing line). */}
      <section className="ph-section-lg" id="checkpoints">
        <div className="ph-container">
          <Reveal className="sec-head is-center bring-head">
            <StarLogo className="bring-head-orn" />
            <p className="ph-eyebrow">The 120-day launch</p>
            <h2>A launch plan built around readiness, not pressure.</h2>
            <span className="exp-orn">
              <span />
            </span>
            <p className="ph-lead">
              The 120-day plan gives you clear milestones while leaving room for
              the realities of opening a physical cultural space.
            </p>
          </Reveal>
          <Reveal>
            <ol className="bring-timeline">
              {BRING_GATES.map((g, i) => (
                <li key={g.day} className="bring-arch-card">
                  <span
                    className={`bring-arch-day ${
                      i % 2 === 0 ? "is-green" : "is-terra"
                    }`}
                  >
                    <span className="bring-arch-day-label">Day</span>
                    <span className="bring-arch-day-num">{g.day}</span>
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
              The goal is not simply to open on time. It is to open well.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 6 — Three rules, no exceptions (light cream, per the mockup) */}
      <section className="ph-section-lg">
        <div className="ph-container">
          <Reveal className="sec-head is-center bring-head">
            <StarLogo className="bring-head-orn" />
            <p className="ph-eyebrow bring-eyebrow-flank">
              <OliveBranch flip className="bring-flank-olive" />
              The commitments
              <OliveBranch className="bring-flank-olive" />
            </p>
            <h2>Three commitments every House shares.</h2>
            <span className="exp-orn">
              <span />
            </span>
            <p className="ph-lead">
              These commitments protect the meaning of the Palestine House name
              and create trust across the network.
            </p>
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
              Shared standards do not erase local character. They help every
              House earn trust.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 7 — Ready to apply? (CTA · arch photo) */}
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
              Ready to build a permanent home for Palestinian culture?
            </h2>
            <span className="exp-orn bring-apply-rule">
              <span />
            </span>
            <p className="bring-apply-body">
              Opening a Palestine House is a serious commitment, but you will not
              make the journey alone. Every application is reviewed to understand
              your city, your team, your venue, and your vision — and to make
              sure we can support the project responsibly. If there is a strong
              fit, we will guide you through the next steps. Questions before
              applying?{" "}
              <Link className="bring-contact-link" href="/contact">
                Contact
              </Link>{" "}
              us.
            </p>
            <div className="bring-apply-ctas">
              <Button asChild size="lg" className="bring-cta-primary">
                <Link href="/apply">
                  Apply to bring a House
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bring-cta-secondary">
                <Link href="/our-support">
                  Explore our support
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <p className="bring-apply-reassure">
              <ShieldCheck size={18} aria-hidden="true" />
              Every application is reviewed by HQ.
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
