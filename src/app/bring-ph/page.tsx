import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Artwork } from "@/components/shared/artwork";
import { PageDivider } from "@/components/shared/page-divider";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/sections/lead-form";

/* Bring a House (/bring-ph) — absorbs the old How It Works (stage triptych +
   gates timeline). Copy verbatim from docs/page-copy/01-public-pages/
   bring-a-house.md; layout from docs/page-designs/public/BringAHouse.app.jsx. */

export const metadata: Metadata = {
  title: "Bring a House",
  description:
    "Why bring Palestine House to your city, and what it honestly takes — the partnership, the three stages, the three gates, and the three rules.",
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

/* The repointed triptych — one room, three moments of becoming. */
const BRING_STAGES = [
  {
    id: "PH-HIW-01",
    name: "Plan & Prepare",
    text: "governance, your city, your venue.",
    alt: "An ink-wash illustration of an empty room being measured and planned — the House before it begins.",
  },
  {
    id: "PH-HIW-02",
    name: "Design & Build",
    text: "the launch itself, tracked task by task.",
    alt: "An ink-wash illustration of hands at work — the same room mid-build, taking shape.",
  },
  {
    id: "PH-HIW-03",
    name: "Operate & Program",
    text: "running the House to the standard every House shares.",
    alt: "An ink-wash illustration of the finished room, open and hosting — the House alive.",
  },
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
      {/* 1 — Hero */}
      <section className="art-hero">
        <div className="ph-container art-hero-grid">
          <Reveal className="art-hero-copy">
            <p className="ph-eyebrow">Bring a House</p>
            <h1>Bring Palestine House to your city.</h1>
            <p className="ph-lead">
              A House is a real business with real cultural weight — a café, a
              venue, and a home for the community, open every day. Here’s why
              people open one, and what it takes to do it well.
            </p>
            <div className="page-hero-ctas">
              <Button asChild size="lg">
                <Link href="/apply">
                  Apply to bring a House
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/our-support">See our support</Link>
              </Button>
            </div>
            <p className="page-hero-support">
              Every application is reviewed by HQ.
            </p>
          </Reveal>
          <Reveal className="art-hero-art">
            <Artwork
              assetId="PH-BRING-01"
              alt="An ink-wash illustration of a House threshold — a tall pointed-arch doorway opening onto the street, a new address."
              ratio="16 / 10"
              sizes="(max-width: 900px) 100vw, 55vw"
              priority
            />
          </Reveal>
        </div>
      </section>

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
              alt="A balanced two-panel ink-wash illustration — on one side a partner's keys and venue, on the other the toolkit HQ brings."
              ratio="16 / 7"
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

      {/* 4 — What it takes: the three stages */}
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
          <Reveal className="bring-triptych">
            {BRING_STAGES.map((s, i) => (
              <figure key={s.id} className="bring-stage">
                <Artwork
                  assetId={s.id}
                  alt={s.alt}
                  ratio="4 / 5"
                  rounded
                  sizes="(max-width: 860px) 100vw, 33vw"
                />
                <figcaption>
                  <span className="bring-stage-n">{"0" + (i + 1)}</span>
                  <h3>{s.name}</h3>
                  <p>{s.text}</p>
                </figcaption>
              </figure>
            ))}
          </Reveal>
          <Reveal>
            <p className="bring-stages-close">
              You won’t face it all at once. You see your current stage and the
              next few moves — nothing more.
            </p>
          </Reveal>
        </div>
      </section>

      <PageDivider />

      {/* 5 — Three checkpoints: the gates timeline */}
      <section className="ph-section-lg" id="checkpoints">
        <div className="ph-container">
          <Reveal className="sec-head">
            <p className="ph-eyebrow">Three checkpoints</p>
            <h2>No guesswork about whether you’re ready.</h2>
            <p className="ph-lead">Three gates mark the way.</p>
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
          <div className="page-hero-ctas" style={{ justifyContent: "center" }}>
            <Button asChild size="lg">
              <Link href="/apply">
                Apply to bring a House
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/our-support">See our support</Link>
            </Button>
          </div>
          <p className="page-hero-support" style={{ textAlign: "center" }}>
            Every application is reviewed by HQ.
          </p>
        </Reveal>
      </section>

      {/* 8 — Lead magnet */}
      <section className="ph-section bg-hero">
        <Reveal className="ph-container leadmagnet">
          <p className="ph-eyebrow">Free reads</p>
          <h2>Two free reads before you decide.</h2>
          <p className="leadmagnet-books">
            <strong>The House Promise</strong> — what a House is, and why it
            matters.
            <br />
            <strong>Operating Model &amp; Governance</strong> — how a House
            actually runs.
          </p>
          <LeadForm idPrefix="bring-lead" />
        </Reveal>
      </section>
    </>
  );
}
