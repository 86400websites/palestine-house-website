import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Photo, ART_SOURCES } from "@/components/shared/photo";
import {
  OliveBranch,
  SparkMark,
  StarLogo,
  StarMark,
} from "@/components/shared/ornament";
import { PageHero } from "@/components/sections/page-hero";
import { StageCards } from "@/components/sections/stage-cards";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

/* Bring a House (/bring-ph) — absorbs the old How It Works (stage triptych +
   gates timeline). Copy verbatim from docs/page-copy/01-public-pages/
   bring-a-house.md; §2/3/5/6/7 layout matches the owner's editorial mockups
   (public/assets/Bring a House/), built on the shared ornament marks. */

export const metadata: Metadata = {
  title: "Bring a House",
  description:
    "Why bring Palestine House to your city, and what it honestly takes — the partnership, the three stages, the 120-day launch, and the three rules.",
};

const BRING_YOU = [
  "The venue, and the city knowledge to choose it well.",
  "The team, and the daily commitment to run a real business.",
  "The local relationships that make a House belong.",
] as const;

const BRING_WE = [
  "The brand, and the standards every House is held to.",
  "The full toolkit — the playbook, the templates, the training.",
  "The support to open and operate, from first decision to launch and beyond.",
] as const;

const BRING_GATES = [
  {
    day: "Day 30",
    name: "Foundation",
    text: "Governance live, venue shortlisted, budget approved.",
  },
  {
    day: "Day 60",
    name: "Engine working",
    text: "Lease signed, entity set up, brand license active, fit-out underway.",
  },
  {
    day: "Day 108",
    name: "Ready to host",
    text: "Permits secured, staff hired, systems live, soft opening passed.",
  },
] as const;

const BRING_RULES = [
  {
    n: "01",
    title: "No politics",
    text: "culture leads; the House is not a campaign.",
  },
  {
    n: "02",
    title: "HQ-approved brand use",
    text: "one standard, everywhere.",
  },
  {
    n: "03",
    title: "Honest reporting",
    text: "open books, on time.",
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
        lead="A House is a real business with real cultural weight — a café, a venue, and a home for the community, open every day. Here’s why people open one, and what it takes to do it well."
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
            <p className="statement-line bring-why-line">
              Your city has the people, the culture, and the appetite. What it
              doesn’t have yet is the address — a fixed place where all of it
              lives, year-round, instead of in scattered moments.
            </p>
            <span className="exp-orn bring-why-rule">
              <span />
            </span>
            <p className="statement-sub bring-why-sub">
              A House gives the culture a permanent home, and gives you a serious
              thing to build and run.
            </p>
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
            <h2>Who brings what.</h2>
            <span className="exp-orn">
              <span />
            </span>
            <p className="ph-lead">
              This is a partnership, set down in a license. The split is clear
              from the start.
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
        </div>
      </section>

      {/* 4 — What it takes: the three stages (DR2.1-4: Home's v3 stage
          photo-cards via the shared StageCards — replacing the PH-HIW
          artwork triptych; cards only, no side art, per the owner) */}
      <section className="ph-section-lg" id="what-it-takes">
        <div className="ph-container">
          <Reveal className="sec-head">
            <p className="ph-eyebrow">What it takes</p>
            <h2>One path, three stages.</h2>
            <p className="ph-lead">
              Opening a House is a hundred decisions. The platform puts them in
              order — three stages across a 120-day plan.
            </p>
          </Reveal>
          <div className="bring-stages-cards">
            <StageCards sizes="(max-width: 860px) 100vw, 33vw" />
          </div>
          <Reveal>
            <p className="bring-stages-close">
              You won’t face it all at once. You see your current stage and the
              next few moves — nothing more.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 5 — The 120-day launch: milestone timeline */}
      <section className="ph-section-lg" id="checkpoints">
        <div className="ph-container">
          <Reveal className="sec-head is-center bring-head">
            <StarLogo className="bring-head-orn" />
            <p className="ph-eyebrow">The 120-day launch</p>
            <h2>No guesswork about whether you’re ready.</h2>
            <span className="exp-orn">
              <span />
            </span>
            <p className="ph-lead">A clear path, milestone by milestone.</p>
          </Reveal>
          <Reveal>
            <ol className="bring-miles">
              {BRING_GATES.map((g, i) => (
                <li key={g.day} className="bring-mile">
                  <span className="bring-mile-medallion">
                    <StarMark className="bring-mile-star" />
                    <span className="bring-mile-num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <span className="bring-mile-day">{g.day}</span>
                  <h3 className="bring-mile-title">{g.name}.</h3>
                  <p>{g.text}</p>
                </li>
              ))}
              <span className="bring-mile-spark bring-mile-spark--a" aria-hidden="true" />
              <span className="bring-mile-spark bring-mile-spark--b" aria-hidden="true" />
            </ol>
          </Reveal>
          <Reveal>
            <p className="bring-miles-note">
              The soft opening sits at Day 108, leaving the rest of the 120 days
              as a deliberate buffer before your full public launch.
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
            <h2>Three rules, no exceptions.</h2>
            <span className="exp-orn">
              <span />
            </span>
            <p className="ph-lead">
              Every House holds the same three commitments:
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
              If that’s how you want to work, we’d like to hear from you.
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
            <h2 className="statement-line bring-apply-h">Ready to apply?</h2>
            <span className="exp-orn bring-apply-rule">
              <span />
            </span>
            <p className="bring-apply-body">
              If you’re serious about opening a House, apply. Every application is
              reviewed by HQ — not to rank you against others, but to make sure a
              House will work where you are, and that we can support it well.
              Questions first?{" "}
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
                  See our support
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
