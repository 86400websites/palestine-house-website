import type { Metadata } from "next";
import Link from "next/link";
import {
  CircleCheck,
  CircleX,
  Handshake,
  House,
  Key,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ART_SOURCES, Photo } from "@/components/shared/photo";
import { PageDivider } from "@/components/shared/page-divider";
import { PageHero } from "@/components/sections/page-hero";
import { EmbassyGallery } from "@/components/sections/model/embassy-gallery";
import { FadeIn, Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

/* The Model (/model) — copy overhaul 2026-07-17 (owner docs + the §6 "what it
   is" reference mockup); v3 layout retained from the DR3.1 rebuild. */

export const metadata: Metadata = {
  title: "The Model",
  description:
    "One name. Many Houses. A shared standard. How Palestine House fits together — three partners, one agreement, and three commitments every House shares.",
};

const MODEL_NEVER = [
  {
    n: "01",
    title: "Cultural independence",
    text: "A Palestine House does not endorse political parties, electoral candidates, or partisan organisations. It remains a space for Palestinian culture, critical thought, artistic expression, learning, and community.",
    tone: "olive",
  },
  {
    n: "02",
    title: "Respect for the Palestine House name",
    text: "The Palestine House identity is used consistently and with care. HQ approves major uses of the brand so that every House protects the trust, meaning, and reputation carried by the name. Should a partnership end, the Palestine House branding and licensed materials are removed.",
    tone: "terra",
  },
  {
    n: "03",
    title: "Honest and transparent operation",
    text: "Every House agrees to clear reporting, shared performance measures, and appropriate financial and operational transparency. These systems help identify problems early, protect the network, and give partners the support they need to operate sustainably.",
    tone: "terra",
  },
] as const;

const MODEL_IS = [
  "A professionally run cultural business.",
  "A café and gathering place rooted in Palestinian hospitality.",
  "A year-round venue for music, art, film, literature, food, and conversation.",
  "A platform for Palestinian artists, makers, thinkers, and cultural workers.",
  "A permanent community anchor with local ownership and global support.",
] as const;

const MODEL_ISNOT = [
  "A temporary pop-up.",
  "A decorative interpretation of Palestinian culture.",
  "A passive franchise purchased without responsibility.",
  "A one-off campaign or seasonal project.",
  "A venue that uses the name without meeting the shared standard.",
] as const;

export default function ModelPage() {
  return (
    <>
      {/* 1 — v3 photo hero (DR1-9) */}
      <PageHero
        photo="ph-photo-model"
        alt="Hands embroidering red tatreez patterns at a workshop table."
        position="50% 55%"
        eyebrow="The Model"
        title="One name. Many Houses. A shared standard."
        lead="Every Palestine House is locally owned and shaped by the people who understand their city best. What connects every House is a shared commitment to cultural integrity, Palestinian hospitality, professional practice, and long-term community care."
        support="Every application is reviewed by HQ."
      >
        <Button asChild size="lg" className="v3-cta">
          <Link href="/apply">Apply to bring a House</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="v3-cta">
          <Link href="/our-support">See our support</Link>
        </Button>
      </PageHero>

      {/* 2 — A cultural embassy (café · venue · community collage) */}
      <section className="ph-section-lg model-embassy">
        <div className="ph-container model-embassy-grid">
          <Reveal className="model-embassy-copy">
            <p className="ph-eyebrow">What a House carries</p>
            <svg
              className="model-embassy-star"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M12 1.5l1.9 6.3 6.3-1.9-4.5 4.6 4.5 4.6-6.3-1.9L12 22.5l-1.9-6.3-6.3 1.9 4.5-4.6-4.5-4.6 6.3 1.9z"
                fill="currentColor"
              />
            </svg>
            <h2 className="model-h2">
              A cultural embassy, <em>not a themed café.</em>
            </h2>
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative fixed-size flourish */}
            <img
              className="model-embassy-sprig"
              src={ART_SOURCES["ph-art-model-branch"]}
              alt=""
              aria-hidden="true"
            />
            <p className="model-embassy-lead">
              A Palestine House is a real café, a cultural venue, and a
              community home under one roof. It carries the responsibility of
              representing Palestinian culture with depth, care, and integrity —
              and the joy of sharing it generously.
            </p>
            <p className="model-embassy-lead">
              Every meal served, every concert, workshop, film, and conversation
              contributes to a permanent Palestinian cultural presence. Culture
              is not decoration here. It shapes the food, the programme, the
              atmosphere, and the way people are welcomed.
            </p>
          </Reveal>
          <FadeIn className="model-embassy-gallery">
            <EmbassyGallery />
          </FadeIn>
        </div>
      </section>

      {/* 3 — Three layers, one team (the network arches) */}
      <section className="ph-section-lg model-network">
        <div className="ph-container">
          <Reveal className="sec-head">
            <p className="ph-eyebrow">How the network works</p>
            <h2>Three partners. One shared purpose.</h2>
            <p className="ph-lead">
              Every Palestine House is built through a clear partnership between
              Global HQ, the local operator, and Aswātna. Each partner brings a
              distinct area of expertise. Together, they protect the culture,
              strengthen the business, and help every House grow with
              consistency and local character.
            </p>
          </Reveal>
          <Reveal className="model-arches">
            <div className="model-arch model-arch--green">
              <Key className="model-arch-icon" aria-hidden="true" />
              <h3 className="model-arch-title">Global HQ</h3>
              <p className="model-arch-role">Brand steward and operating partner</p>
              <p className="model-arch-text">
                Global HQ protects the Palestine House name and identity, sets
                the shared standards, develops the operating system and partner
                platform, and supports every House from application through
                launch and long-term operation. It ensures that every location
                meets the same level of cultural care, professionalism, and
                quality.
              </p>
            </div>
            <div className="model-arch model-arch--cream">
              <House className="model-arch-icon" aria-hidden="true" />
              <h3 className="model-arch-title">The Local Partner</h3>
              <p className="model-arch-role">Owner and operator</p>
              <p className="model-arch-text">
                The local partner brings the venue, the team, local knowledge,
                community relationships, and the daily commitment required to
                run a sustainable cultural business. You lead your House, make
                it meaningful in your city, and bring the shared Palestine House
                standard to life locally.
              </p>
            </div>
            <div className="model-arch model-arch--terra">
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative partner seal */}
              <img
                className="model-arch-seal"
                src="/assets/partners/aswatna-mark.png"
                alt=""
                aria-hidden="true"
              />
              <h3 className="model-arch-title">Aswātna</h3>
              <p className="model-arch-role">Cultural programming partner</p>
              <p className="model-arch-text">
                Aswātna shapes the cultural direction of each House. It supports
                launch programming, connects Houses with Palestinian artists and
                cultural practitioners, develops meaningful events and
                partnerships, and helps ensure that the creative programme
                remains thoughtful, relevant, and culturally grounded over time.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4 — The Partnership (dark moss band) */}
      <section className="model-promise">
        <div className="ph-container model-promise-grid">
          <Reveal className="model-promise-head">
            <p className="ph-eyebrow">The Partnership</p>
            <h2 className="model-promise-h">One agreement. Clear responsibilities.</h2>
            <p className="model-promise-lead">
              Palestine House HQ licenses the name and operating system to
              carefully selected local partners.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative branch */}
            <img
              className="model-promise-branch"
              src={ART_SOURCES["ph-art-model-branch"]}
              alt=""
              aria-hidden="true"
            />
          </Reveal>
          <Reveal className="model-promise-cols">
            <div className="model-promise-col">
              <span className="model-promise-icon">
                <Handshake aria-hidden="true" />
              </span>
              <p>You own and operate your House.</p>
            </div>
            <div className="model-promise-col">
              <span className="model-promise-icon">
                <ShieldCheck aria-hidden="true" />
              </span>
              <p>HQ gives you the tools, standards, guidance, and ongoing support to build it well.</p>
            </div>
            <div className="model-promise-col">
              <span className="model-promise-icon">
                <Users aria-hidden="true" />
              </span>
              <p>Local ownership. Shared standards. Cultural integrity.</p>
            </div>
          </Reveal>
        </div>
        <Reveal className="ph-container">
          <p className="model-promise-note">
            Each House has its own personality and responds to its own city, but
            the quality of care, hospitality, cultural representation, and
            professional practice remains consistent across the network.
          </p>
        </Reveal>
      </section>

      <PageDivider />

      {/* 5 — Three commitments every House shares */}
      <section className="ph-section-lg">
        <Reveal className="ph-container">
          <p className="ph-eyebrow">Three commitments every House shares</p>
          <div className="model-never-cards">
            {MODEL_NEVER.map((r) => (
              <div key={r.n} className="model-never-card">
                <span className="model-never-num">{r.n}</span>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
                <span className={`model-never-rule is-${r.tone}`} aria-hidden="true" />
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* 6 — A cultural institution built to last (what it is / what it is
          not) + "Culture leads" and the closing still life (copy overhaul
          2026-07-17, built to the owner's reference mockup) */}
      <section className="ph-section-lg bg-muted model-plainly">
        <Reveal className="ph-container model-plainly-layout">
          <div className="model-plainly-main">
            <p className="ph-eyebrow">What it is</p>
            <h2 className="model-plainly-title">
              A cultural institution built to last.
            </h2>
            <div className="model-plainly-grid">
              <div className="model-plainly-col">
                <p className="model-plainly-head is-olive">A Palestine House is:</p>
                <ul className="model-is">
                  {MODEL_IS.map((t) => (
                    <li key={t}>
                      <CircleCheck aria-hidden="true" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="model-plainly-col">
                <p className="model-plainly-head is-terra">It is not:</p>
                <ul className="model-isnot">
                  {MODEL_ISNOT.map((t) => (
                    <li key={t}>
                      <CircleX aria-hidden="true" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <aside className="model-plainly-aside">
            <p className="model-leads">
              <span className="model-leads-a">Culture leads.</span>
              <span className="model-leads-b">The structure helps it last.</span>
            </p>
            <p className="model-plainly-aside-text">
              Palestine House brings together local ownership, cultural
              expertise and a shared operating system so that Palestinian
              culture can have a permanent home in cities around the world.
            </p>
            <ul className="model-reciprocity">
              <li>
                <strong>You bring</strong> the commitment, the local
                relationships, and the daily leadership.
              </li>
              <li>
                <strong>We bring</strong> the name, the system, the guidance,
                and the cultural partnership to help you build something
                meaningful and sustain it.
              </li>
            </ul>
            <Photo
              assetId="ph-photo-model-culture"
              alt="A cup of Palestinian coffee and a decorated vase on an embroidered tatreez cloth."
              sizes="(max-width: 880px) 100vw, 32vw"
              className="model-plainly-photo"
            />
          </aside>
        </Reveal>
      </section>
    </>
  );
}
