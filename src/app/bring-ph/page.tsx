import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Artwork } from "@/components/shared/artwork";
import { PageDivider } from "@/components/shared/page-divider";
import { ApplyCta } from "@/components/sections/apply-cta";
import { PageHero } from "@/components/sections/page-hero";
import { StageCards } from "@/components/sections/stage-cards";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

/* Bring a House (/bring-ph) — absorbs the old How It Works (stage triptych +
   gates timeline). Copy verbatim from docs/page-copy/01-public-pages/
   bring-a-house.md; layout from docs/page-designs/public/BringAHouse.app.jsx. */

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
    <>
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

      {/* 2 — Why bring one */}
      <section className="ph-section-lg">
        <Reveal className="ph-container statement">
          <p className="ph-eyebrow">Why bring one</p>
          <p className="statement-line">
            Your city has the people, the culture, and the appetite. What it
            doesn’t have yet is the address — a fixed place where all of it
            lives, year-round, instead of in scattered moments.
          </p>
          <p className="statement-sub">
            A House gives the culture a permanent home, and gives you a serious
            thing to build and run.
          </p>
        </Reveal>
      </section>

      {/* 3 — Who brings what (artwork section — white per owner scheme) */}
      <section className="ph-section-lg">
        <div className="ph-container">
          <Reveal className="sec-head is-center">
            <p className="ph-eyebrow">The partnership</p>
            <h2>Who brings what.</h2>
            <p className="ph-lead">
              This is a partnership, set down in a license. The split is clear
              from the start.
            </p>
          </Reveal>
          <Reveal className="bring-split-art">
            <Artwork
              assetId="PH-BRING-02"
              alt="A performer opens the night to a full room at a House."
              ratio="16 / 7"
              /* 10%: the performer's head sits near the frame top — the old
                 32% cropped it in the 16:7 window (DR1 final polish) */
              objectPosition="50% 10%"
              sizes="(max-width: 992px) 100vw, 992px"
            />
          </Reveal>
          <Reveal className="bring-split">
            <div className="ph-card bring-panel">
              <h3>You bring</h3>
              <ul className="bring-list">
                {BRING_YOU.map((t) => (
                  <li key={t}>
                    <span className="bring-li-icon">
                      <Check size={18} aria-hidden="true" />
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="ph-card bring-panel">
              <h3>We bring</h3>
              <ul className="bring-list">
                {BRING_WE.map((t) => (
                  <li key={t}>
                    <span className="bring-li-icon">
                      <Check size={18} aria-hidden="true" />
                    </span>
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

      <PageDivider />

      {/* 5 — The 120-day launch: milestone timeline */}
      <section className="ph-section-lg" id="checkpoints">
        <div className="ph-container">
          <Reveal className="sec-head">
            <p className="ph-eyebrow">The 120-day launch</p>
            <h2>No guesswork about whether you’re ready.</h2>
            <p className="ph-lead">A clear path, milestone by milestone.</p>
          </Reveal>
          <Reveal>
            <ol className="bring-gates">
              {BRING_GATES.map((g) => (
                <li key={g.day} className="bring-gate">
                  <span className="bring-gate-node" aria-hidden="true">
                    <Check size={14} />
                  </span>
                  <span className="bring-gate-day">{g.day}</span>
                  <h3>{g.name}.</h3>
                  <p>{g.text}</p>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal>
            <p className="bring-gates-note">
              The soft opening sits at Day 108, leaving the rest of the 120 days
              as a deliberate buffer before your full public launch.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 6 — Three rules, no exceptions */}
      <section className="ph-section-lg ph-section-dark">
        <div className="ph-container">
          <Reveal className="sec-head">
            <p className="ph-eyebrow">The commitments</p>
            <h2>Three rules, no exceptions.</h2>
            <p className="ph-lead">Every House holds the same three commitments:</p>
          </Reveal>
          <Reveal className="editorial-cols">
            {BRING_RULES.map((r) => (
              <div key={r.n} className="editorial-col">
                <span className="editorial-index">{r.n}</span>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </div>
            ))}
          </Reveal>
          <Reveal>
            <p className="bring-rules-close">
              If that’s how you want to work, we’d like to hear from you.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 7 — Ready to apply? */}
      <section className="ph-section-lg">
        <Reveal className="ph-container statement">
          <p className="ph-eyebrow">The next step</p>
          <h2 className="statement-line bring-statement-h">Ready to apply?</h2>
          <p className="statement-sub">
            If you’re serious about opening a House, apply. Every application is
            reviewed by HQ — not to rank you against others, but to make sure a
            House will work where you are, and that we can support it well.
            Questions first?{" "}
            <Link className="bring-contact-link" href="/contact">
              Contact
            </Link>{" "}
            us.
          </p>
          <ApplyCta secondaryHref="/our-support" secondaryLabel="See our support" />
        </Reveal>
      </section>
    </>
  );
}
