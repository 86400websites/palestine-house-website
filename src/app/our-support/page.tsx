import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bookmark,
  CalendarDays,
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

/* The Community (/our-support) — copy verbatim from the owner's Public Website
   Copy §6 (CR1); layout from docs/page-designs/public/OurSupport.app.jsx
   (approved mockup). */

export const metadata: Metadata = {
  title: { absolute: "The Community - Palestine House" },
  description:
    "Guides, templates, practical tools and voluntary peer connections for people building their own Palestine Houses.",
};

/* Hero proof row — the canonical numbers, shown under the lead (mockup).
   Labels per the owner's Public Website Copy §6.1 (CR1).

   The fourth position is a phrase, not a figure: the doc's one string is split
   at its own comma across the existing number and label slots. */
const SUP_PROOF = [
  { icon: LayoutGrid, n: "4", label: "resource sections" },
  { icon: BookOpen, n: "22", label: "focus areas" },
  { icon: FileText, n: "83", label: "templates and practical tools" },
  { icon: CalendarDays, n: "Your pace,", label: "your local opening plan." },
] as const;

/* Aswātna — the optional programming provider, in the before-opening, launch and
   after-launch positions (mockup). */
const SUP_ASWATNA = [
  {
    assetId: "ph-photo-support-aswatna-1",
    alt: "A singer and guitarist performing together at a House.",
    label: "Before opening",
    text: "If you choose Aswātna, discuss ideas for your first calendar and launch events.",
  },
  {
    assetId: "ph-photo-support-aswatna-2",
    alt: "A packed audience filming a candlelit night of live music.",
    label: "At launch",
    text: "Request artist introductions or event support for the activities you agree together.",
  },
  {
    assetId: "ph-photo-support-aswatna-3",
    alt: "Guests dancing at a House celebration beside a keyboard player.",
    label: "After launch",
    text: "Arrange further programming or event support when useful to your House.",
  },
] as const;

/* The first links on the red band: the base link colour and focus outline are olive
   and unreadable here, so both take the band's cream text instead. */
const SUP_ASWATNA_LINK =
  "text-inherit underline underline-offset-2 focus-visible:outline-current";

/* "Keep using the resources after opening" — the four after-opening topics. (The
   who-brings-what split that used to close this page was removed in the
   2026-07-17 copy overhaul: it already lives on Bring a House.) */
const SUP_ONGOING = [
  {
    icon: CalendarDays,
    title: "Programming",
    text: "Use calendar and event tools to develop activities that fit your audience and capacity.",
  },
  {
    icon: UtensilsCrossed,
    title: "Food and Hospitality",
    text: "Use relevant routines and checklists where your House offers food and drinks, alongside applicable local requirements.",
  },
  {
    icon: InfinityIcon,
    title: "Members and Visitors",
    text: "Welcome people, listen to feedback and develop relationships around your local House.",
  },
  {
    icon: BarChart3,
    title: "Finance and Operations",
    text: "Keep the local records and practical checks your own team needs. Routine reporting to the community is not required.",
  },
] as const;

/* One simple route into the community — three steps as a numbered timeline. */
const SUP_STAGES = [
  {
    n: "01",
    name: "Apply to join",
    text: "Share a few basic details and a short introduction to your interest or idea. Your venue, team and plan can still be developing.",
  },
  {
    n: "02",
    name: "Receive your access update",
    text: "Your application is used to arrange community access. Once access is confirmed, sign in to the private platform.",
  },
  {
    n: "03",
    name: "Use what helps",
    text: "Choose relevant guides and templates, ask a peer question when useful and develop your own local plan.",
  },
] as const;

/* The four resource types in a focus area — shown as documents, not icons.
   PP7 / D-PP-a: this was six. "A step-by-step checklist" and "What to watch for"
   are removed because neither exists any more — checklists were dropped at
   D-PP-b (and its text promised "progress saved as you work", which went with
   them), and the watch-out body is rendered on no surface. What a partner
   actually opens per focus area is the D-PP-f model: a summary, one Simple
   guide, a video where one has been published, and the templates. */
const SUP_ARTEFACTS = [
  {
    icon: Info,
    name: "A clear overview",
    text: "Understand the topic and the decisions it covers.",
  },
  {
    icon: Bookmark,
    name: "A simple guide",
    text: "Work through practical steps at a pace that suits your local House.",
  },
  {
    icon: Play,
    name: "A video walkthrough",
    text: "Watch a clear explanation where the video has been published. More walkthroughs can be added to the existing video locations as they are produced.",
  },
  {
    icon: Download,
    name: "Templates and practical tools",
    text: "Adapt useful checklists, plans, forms, samples and reference documents instead of starting from a blank page.",
  },
] as const;

export default function OurSupportPage() {
  return (
    <>
      {/* 1 — v3 split hero (DR3.3): cream copy + proof row · flag photo right */}
      <section className="support-hero">
        <Reveal className="support-hero-copy">
          <p className="ph-eyebrow">The Community</p>
          <h1 className="support-hero-h1">
            Shared resources. Useful connections. Local ownership.
          </h1>
          <p className="support-hero-lead">
            The Palestine House community helps people learn, plan and connect
            as they develop their own Houses. It brings practical tools together
            in one place and makes room for people to share experience when they
            can.
          </p>
          <p className="support-hero-lead">
            Apply to join for access to the private resources and community
            connections. Your local House remains yours to build and run.
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

      {/* 2 — The toolkit */}
      <section className="ph-section-lg">
        <div className="ph-container">
          <Reveal className="sec-head">
            <p className="ph-eyebrow">The toolkit</p>
            <h2>Find the resource for the question in front of you.</h2>
            <p className="ph-lead">
              Four sections and 22 focus areas bring practical resources together
              for preparing and running a local House. Begin with one question
              rather than the entire library.
            </p>
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
              The toolkit contains{" "}
              <strong>83 templates and practical tools</strong>. Use what helps
              your next step; you do not need to complete every document or
              submit it to the community.
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

      {/* 3 — Shared identity: copy · three arched photos · PH lockup (DR3.3) */}
      <section className="ph-section-lg support-standard">
        <div className="ph-container support-standard-grid">
          <Reveal className="support-standard-copy">
            <p className="ph-eyebrow">SHARED CULTURAL PURPOSE</p>
            <h2 className="support-standard-h">
              A shared spirit. A House shaped by its city.
            </h2>
            <span className="support-orn" aria-hidden="true" />
            <p className="support-standard-body">
              Different cities will have different buildings, people, artists and
              ways of coming together. Each local team develops the House that
              fits its own community.
            </p>
            <p className="support-standard-body mt-4">
              What connects the Houses is a commitment to Palestinian culture,
              thoughtful hospitality, respect and responsible local practice.
              Shared learning supports that commitment; it is not a central
              inspection or management process.
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
              alt="Palestine House - Our Culture Embassy"
            />
            <p className="support-standard-tagline">
              Shared cultural purpose.
              <br />
              Local expression.
              <br />
              Useful help when it matters.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 4 — Aswātna: muted-red band · three captioned photos (DR3.3). The gold
          seal left at CR1: the doc allows the logo only with permission, and none
          is on record. */}
      <section className="ph-section-lg support-aswatna">
        <div className="ph-container support-aswatna-grid">
          <Reveal className="support-aswatna-intro">
            <p className="ph-eyebrow">OPTIONAL PROGRAMMING PROVIDER</p>
            <h2 className="support-aswatna-name">Aswātna</h2>
            <p className="support-aswatna-tag">
              Programming support when you choose it.
            </p>
            <p className="support-aswatna-body">
              Aswātna is an optional provider of cultural programming and events.
              Each House chooses its own programme and may work with its own
              team, independent artists, Aswātna or other providers. If engaged,
              Aswātna can help develop events and connect the House with
              Palestinian artists and cultural practitioners. Agree the scope,
              fees and availability directly.
            </p>
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
              Your local team chooses the programme, collaborators and level of
              support.
            </p>
            <p className="support-aswatna-col-text text-center">
              <a
                className={SUP_ASWATNA_LINK}
                href="https://aswatnastudio.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                aswatnastudio.com
              </a>
              {" · "}
              <a
                className={SUP_ASWATNA_LINK}
                href="mailto:nour@aswatnastudio.com"
              >
                nour@aswatnastudio.com
              </a>
              .
            </p>
            <p className="support-aswatna-col-text text-center">
              If you would like to explore Aswātna’s services, send your city,
              audience, dates, idea and budget. Confirm scope, fees, availability
              and responsibilities directly.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 5 — Join the community: copy + button · horizontal numbered timeline (DR3.3) */}
      <section className="ph-section-lg support-backing">
        <div className="ph-container support-backing-grid">
          <Reveal className="support-backing-copy">
            <p className="ph-eyebrow">JOIN THE COMMUNITY</p>
            <h2 className="support-backing-h">
              One simple route into the community.
            </h2>
            <span className="support-orn" aria-hidden="true" />
            <Button
              asChild
              variant="outline"
              className="support-backing-cta"
            >
              <Link href="/bring-ph#checkpoints">
                Explore Local Opening Guidance
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
              This is a route into the community, not a staged approval process
              for opening a venue.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 6 — After opening: the resources band (DR3.3) */}
      <section className="support-duties">
        <div className="support-duties-band">
          <div className="ph-container support-duties-band-grid">
            <Reveal className="support-duties-intro">
              <h2 className="support-duties-h">
                Keep using the resources after opening.
              </h2>
              <p className="support-duties-sub">
                The questions change as your House develops. You may return to a
                finance template, improve a daily routine, adjust the program or
                share a lesson with another team.
              </p>
              <p className="support-duties-sub">
                The community remains a place for resources and exchange. Your
                local House remains yours to run.
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
