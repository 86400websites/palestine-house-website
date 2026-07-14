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

/* Aswātna — how the cultural partner shows up across the launch (mockup). */
const SUP_ASWATNA = [
  {
    assetId: "ph-photo-support-aswatna-1",
    alt: "A singer and guitarist performing together at a House.",
    label: "Before opening",
    text: "We help shape your launch programming and cultural direction.",
  },
  {
    assetId: "ph-photo-support-aswatna-2",
    alt: "A packed audience filming a candlelit night of live music.",
    label: "At launch",
    text: "We provide artists, events, partnerships, and opening-week support.",
  },
  {
    assetId: "ph-photo-support-aswatna-3",
    alt: "Guests dancing at a House celebration beside a keyboard player.",
    label: "After launch",
    text: "We continue curating and supporting creative quality over time.",
  },
] as const;

/* The Backing — the three-stage, 120-day launch path as a numbered timeline. */
const SUP_STAGES = [
  { n: "01", name: "Plan & Prepare", text: "Venue, company, governance, budget." },
  { n: "02", name: "Design & Build", text: "Fit-out, suppliers, systems, permissions." },
  { n: "03", name: "Operate & Program", text: "Team, launch, programming, daily operations." },
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

      {/* 3 — The Standard: copy · three arched photos · PH lockup (DR3.3) */}
      <section className="ph-section-lg support-standard">
        <div className="ph-container support-standard-grid">
          <Reveal className="support-standard-copy">
            <h2 className="support-standard-h">
              Standards that make the name mean something.
            </h2>
            <span className="support-orn" aria-hidden="true" />
            <p className="support-standard-body">
              Wherever a guest walks in, they feel the same level of care,
              quality, and professionalism. Local character, shared standard.
            </p>
          </Reveal>
          <Reveal className="support-standard-arches">
            <div className="support-standard-arch">
              <Photo
                assetId="ph-photo-support-standard-1"
                alt="A candlelit café table set with red carnations."
                sizes="(max-width: 980px) 30vw, 200px"
              />
            </div>
            <span className="support-standard-star" aria-hidden="true" />
            <div className="support-standard-arch">
              <Photo
                assetId="ph-photo-support-standard-2"
                alt="A stage set with instruments and woven rugs before a performance."
                sizes="(max-width: 980px) 30vw, 200px"
              />
            </div>
            <span className="support-standard-star" aria-hidden="true" />
            <div className="support-standard-arch">
              <Photo
                assetId="ph-photo-support-standard-3"
                alt="A guest listening intently during a House gathering."
                sizes="(max-width: 980px) 30vw, 200px"
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
              Local character.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 4 — Aswātna: muted-red band + gold seal · three captioned photos (DR3.3) */}
      <section className="ph-section-lg support-aswatna">
        <div className="ph-container support-aswatna-grid">
          <Reveal className="support-aswatna-intro">
            <h2 className="support-aswatna-name">Aswātna</h2>
            <p className="support-aswatna-tag">
              A cultural partner. Not just a brand.
            </p>
            <p className="support-aswatna-body">
              Aswātna helps curate your launch and supports ongoing programming
              so your House starts strong and stays culturally alive.
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
        </div>
      </section>

      {/* 5 — The Backing: copy + button · horizontal numbered timeline (DR3.3) */}
      <section className="ph-section-lg support-backing">
        <div className="ph-container support-backing-grid">
          <Reveal className="support-backing-copy">
            <h2 className="support-backing-h">
              Support from first decision to open doors.
            </h2>
            <span className="support-orn" aria-hidden="true" />
            <p className="support-backing-body">
              A 120-day path with clear milestones and constant guidance.
            </p>
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
