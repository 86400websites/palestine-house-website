import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Info,
  LayoutGrid,
  Play,
} from "lucide-react";
import { PageDivider } from "@/components/shared/page-divider";
import { ApplyCta } from "@/components/sections/apply-cta";
import { Photo } from "@/components/shared/photo";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

/* Our Support (/our-support) — copy verbatim from docs/page-copy/
   01-public-pages/our-support.md; layout from docs/page-designs/public/
   OurSupport.app.jsx (approved mockup). */

export const metadata: Metadata = {
  title: "Our Support",
  description:
    "What HQ gives every partner — the full playbook (10 focus areas, 30 topics, 267 templates), the standards, Aswātna, and support from first decision to open doors.",
};

/* Hero proof row — the canonical numbers, shown under the lead (mockup). */
const SUP_PROOF = [
  { icon: BookOpen, n: "10", label: "focus areas" },
  { icon: LayoutGrid, n: "30", label: "topics" },
  { icon: FileText, n: "267", label: "templates" },
  { icon: CalendarDays, n: "120", label: "day launch plan" },
] as const;

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
      {/* 1 — v3 split hero (DR3.3): cream copy + proof row · flag photo right */}
      <section className="support-hero">
        <Reveal className="support-hero-copy">
          <p className="ph-eyebrow">Our Support</p>
          <h1 className="support-hero-h1">You’re not doing this alone.</h1>
          <p className="support-hero-lead">
            Every House is backed by a complete toolkit, clear standards,
            cultural guidance from Aswātna, and a 120-day launch plan. From your
            first decision to your first open doors — we’re with you.
          </p>
          <dl className="support-hero-proof">
            {SUP_PROOF.map((s) => (
              <div key={s.label} className="support-hero-stat">
                <s.icon className="support-hero-stat-icon" aria-hidden="true" />
                <dd className="support-hero-stat-n">{s.n}</dd>
                <dt className="support-hero-stat-l">{s.label}</dt>
              </div>
            ))}
          </dl>
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
              stages and a 120-day plan, so you always know what’s next and when
              you’re ready to move on.
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
              The 120-day launch, in detail →
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

      {/* 7 — Closing CTA (page closer) */}
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
    </>
  );
}
