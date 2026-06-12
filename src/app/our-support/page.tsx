import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Download,
  Info,
  Play,
} from "lucide-react";
import { Artwork } from "@/components/shared/artwork";
import { PageDivider } from "@/components/shared/page-divider";
import { ApplyCta } from "@/components/sections/apply-cta";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/sections/lead-form";

/* Our Support (/our-support) — copy verbatim from docs/page-copy/
   01-public-pages/our-support.md; layout from docs/page-designs/public/
   OurSupport.app.jsx (approved mockup). */

export const metadata: Metadata = {
  title: "Our Support",
  description:
    "What HQ gives every partner — the full playbook (10 focus areas, 30 topics, 267 templates), the standards, Aswātna, and support from first decision to open doors.",
};

/* Every topic ships the same six artefacts — shown as documents, not icons. */
const SUP_ARTEFACTS = [
  {
    icon: Info,
    name: "Overview",
    text: "What this topic covers, in one page.",
  },
  {
    icon: Bookmark,
    name: "Plain-language guide",
    text: "The how, written for a tired person on a phone.",
  },
  {
    icon: CheckCircle2,
    name: "Checklist",
    text: "Every step, tickable, in order.",
  },
  {
    icon: AlertTriangle,
    name: "Watch out for",
    text: "The mistakes others made, so you don’t.",
  },
  {
    icon: Play,
    name: "Short video",
    text: "The topic, walked through on screen.",
  },
  {
    icon: Download,
    name: "Templates",
    text: "Proven documents, ready to adapt.",
  },
] as const;

export default function OurSupportPage() {
  return (
    <>
      {/* 1 — Hero */}
      <section className="art-hero">
        <div className="ph-container art-hero-grid">
          <Reveal className="art-hero-copy">
            <p className="ph-eyebrow">Our Support</p>
            <h1>You’re not doing this alone.</h1>
            <p className="ph-lead">
              A House is yours to run — but the standard, the tools, and the
              people behind it are shared across the whole network. Here’s
              exactly what comes with that.
            </p>
            <div className="page-hero-ctas">
              <Button asChild size="lg">
                <Link href="/apply">
                  Apply to bring a House
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <p className="page-hero-support">
              Every application is reviewed by HQ.
            </p>
          </Reveal>
          <Reveal className="art-hero-art">
            <Artwork
              assetId="PH-SUPPORT-01"
              alt="An ink-wash illustration of the toolkit as real artefacts — a printed checklist, a template, and a screen on a House worktable."
              ratio="3 / 2"
              sizes="(max-width: 900px) 100vw, 55vw"
              priority
            />
          </Reveal>
        </div>
      </section>

      {/* 2 — The full playbook */}
      <section className="ph-section-lg">
        <div className="ph-container">
          <Reveal className="sec-head">
            <p className="ph-eyebrow">The toolkit</p>
            <h2>The full playbook, ready to use.</h2>
            <p className="ph-lead">
              Everything it takes to open and run a House is written down and
              organised — ten focus areas, thirty topics. Each one comes with an
              overview, a plain-language guide, a checklist, a “watch out for”,
              a short video, and templates you can use straight away.
            </p>
          </Reveal>
          <Reveal className="sup-artefacts">
            {SUP_ARTEFACTS.map((a) => (
              <div key={a.name} className="ph-card sup-artefact">
                <span className="sup-artefact-icon">
                  <a.icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <h3>{a.name}</h3>
                  <p>{a.text}</p>
                </div>
              </div>
            ))}
          </Reveal>
          <Reveal className="sup-templates">
            <p className="sup-templates-line">
              That’s <strong>267 templates</strong> in all — contracts, plans,
              rotas, budgets — so you’re adapting proven documents, not starting
              from a blank page.
            </p>
            <Button asChild variant="outline">
              <Link href="/focus-areas">
                See the full map
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      <PageDivider />

      {/* 3 — Standards */}
      <section className="ph-section-lg">
        <Reveal className="ph-container statement">
          <p className="ph-eyebrow">The standard</p>
          <h2 className="statement-line sup-statement-h">
            Standards that make the name mean something.
          </h2>
          <p className="statement-sub">
            A guest should feel the same care in any House, in any city. HQ sets
            that bar and keeps it — so the name you’re opening under already
            carries trust, and your House inherits it from day one.
          </p>
        </Reveal>
      </section>

      {/* 4 — Aswātna */}
      <section className="ph-section-lg ph-section-dark">
        <div className="ph-container split is-centered">
          <Reveal className="split-a sec-head">
            <p className="ph-eyebrow">Aswātna</p>
            <h2>A cultural partner, not just a brand.</h2>
          </Reveal>
          <Reveal className="split-copy">
            <p>
              Programming is what brings people back — and you don’t shape it
              alone.
            </p>
            <p>
              Aswātna, the network’s cultural-programming partner, helps curate
              your launch and keeps the creative standard high — so your
              calendar is strong from the first night, not a year in.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 5 — From first decision to open doors */}
      <section className="ph-section-lg">
        <div className="ph-container">
          <Reveal className="sec-head">
            <p className="ph-eyebrow">The backing</p>
            <h2>Support from first decision to open doors.</h2>
            <p className="ph-lead">
              The platform walks you through the launch in order, across three
              stages and a 120-day plan, with three checkpoints that confirm
              you’re ready before you move on.
            </p>
          </Reveal>
          <Reveal className="sup-stages">
            <div className="sup-stage-row">
              <span className="sup-stage">Plan &amp; Prepare</span>
              <span className="sup-stage-sep" aria-hidden="true">
                →
              </span>
              <span className="sup-stage">Design &amp; Build</span>
              <span className="sup-stage-sep" aria-hidden="true">
                →
              </span>
              <span className="sup-stage">Operate &amp; Program</span>
            </div>
            <Link className="sup-gates-link" href="/bring-ph#checkpoints">
              The three checkpoints, in detail →
            </Link>
          </Reveal>
          <Reveal>
            <p className="sup-after">
              And it doesn’t stop at opening. The same thirty topics become your
              day-to-day reference for running the House — programming, food,
              membership, finance, all of it — with every template a click away.
            </p>
          </Reveal>
        </div>
      </section>

      <PageDivider />

      {/* 6 — The honest counterweight */}
      <section className="ph-section-lg">
        <Reveal className="ph-container statement">
          <p className="ph-eyebrow">What you’re responsible for</p>
          <p className="statement-line">
            Support is real, but it isn’t a substitute for the work.
          </p>
          <p className="statement-sub">
            You bring the venue, the team, the local relationships, and the
            daily commitment to run a real business. We make sure you’re never
            guessing how.
          </p>
        </Reveal>
      </section>

      {/* 7 — Closing CTA (moved before the lead magnet so the page ends on
          the booklet block like every other page — owner decision, 2026-06-12) */}
      <section className="ph-section-lg">
        <Reveal className="ph-container statement">
          <p className="ph-eyebrow">Behind every House</p>
          <h2 className="statement-line sup-statement-h">
            This is what’s behind every House.
          </h2>
          <p className="statement-sub">
            If you’re ready to open one in your city, apply — every application
            is reviewed by HQ.
          </p>
          <ApplyCta secondaryHref="/bring-ph" secondaryLabel="See what it takes" />
        </Reveal>
      </section>

      {/* 8 — Lead magnet (page closer, consistent with Experience/Bring) */}
      <section className="ph-section bg-hero">
        <Reveal className="ph-container leadmagnet">
          <p className="ph-eyebrow">Free reads</p>
          <h2>See two of the foundations for yourself — free, no account needed.</h2>
          <p className="leadmagnet-books">
            <strong>The House Promise</strong> — what a House is, and why it
            matters.
            <br />
            <strong>Operating Model &amp; Governance</strong> — how a House
            actually runs.
          </p>
          <LeadForm idPrefix="sup-lead" />
        </Reveal>
      </section>
    </>
  );
}
