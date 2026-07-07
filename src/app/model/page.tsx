import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
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

/* The Model (/model) — copy verbatim from docs/page-copy/01-public-pages/model.md;
   layout from docs/page-designs/public/TheModel.app.jsx (approved mockup). */

export const metadata: Metadata = {
  title: "The Model",
  description:
    "One name. Many Houses. One standard. How Palestine House fits together — three layers, one license, three rules that never bend.",
};

const MODEL_NEVER = [
  {
    n: "01",
    title: "Neutral cultural space",
    text: "No party. No endorsement. A home for culture and community.",
    tone: "olive",
  },
  {
    n: "02",
    title: "Brand protection",
    text: "The Palestine House name is approved and protected by HQ.",
    tone: "terra",
  },
  {
    n: "03",
    title: "Shared accountability",
    text: "Reporting, audit access, and basic KPIs keep every House aligned.",
    tone: "terra",
  },
] as const;

const MODEL_IS = [
  "A sustainable cultural business",
  "A real venue",
  "A community anchor",
  "A shared standard",
  "A long-term home",
] as const;

const MODEL_ISNOT = [
  "Not charity",
  "Not a campaign",
  "Not a one-off event",
  "Not a franchise without responsibility",
  "Not culture as decoration",
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
        title="One name. Many Houses. One standard."
        lead="Every Palestine House is owned and run by people who know their own city. What holds the network together is a shared way of working — here’s how it fits."
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
        <div className="model-embassy-strip" aria-hidden="true" />
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
              Every bite, artwork, story, concert, every exhibition, we carry
              connection into a welcoming part of a permanent cultural presence.
            </p>
          </Reveal>
          <FadeIn className="model-embassy-gallery">
            <EmbassyGallery />
          </FadeIn>
        </div>
      </section>

      {/* 3 — Three layers, one team (the network arches) */}
      <section className="ph-section-lg">
        <div className="ph-container">
          <Reveal className="sec-head">
            <p className="ph-eyebrow">How the network works</p>
            <h2>Three layers, one team.</h2>
          </Reveal>
          <Reveal className="model-arches">
            <div className="model-arch model-arch--green">
              <Key className="model-arch-icon" aria-hidden="true" />
              <h3 className="model-arch-title">Global HQ</h3>
              <p className="model-arch-text">
                Protects the name, standards, platform, and toolkit.
              </p>
            </div>
            <ArrowRight className="model-arch-arrow" aria-hidden="true" />
            <div className="model-arch model-arch--cream">
              <House className="model-arch-icon" aria-hidden="true" />
              <h3 className="model-arch-title">The Local Partner</h3>
              <p className="model-arch-text">
                Runs the House, team, venue, and daily business.
              </p>
            </div>
            <ArrowRight className="model-arch-arrow" aria-hidden="true" />
            <div className="model-arch model-arch--terra">
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative partner seal */}
              <img
                className="model-arch-seal"
                src="/assets/partners/aswatna-mark.png"
                alt=""
                aria-hidden="true"
              />
              <h3 className="model-arch-title">Aswātna</h3>
              <p className="model-arch-text">
                Curates culture, launch programming, artists, and community.
              </p>
            </div>
          </Reveal>
          <Reveal className="model-arch-note">
            <p>
              The agreement connects all three: one name, one standard, local
              ownership.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 4 — The shared promise (dark moss band) */}
      <section className="model-promise">
        <div className="ph-container model-promise-grid">
          <Reveal className="model-promise-head">
            <p className="ph-eyebrow">The agreement</p>
            <h2 className="model-promise-h">The shared promise.</h2>
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
              <p>You run your House.</p>
            </div>
            <div className="model-promise-col">
              <span className="model-promise-icon">
                <ShieldCheck aria-hidden="true" />
              </span>
              <p>HQ protects the name.</p>
            </div>
            <div className="model-promise-col">
              <span className="model-promise-icon">
                <Users aria-hidden="true" />
              </span>
              <p>Together, every House meets the same standard.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <PageDivider />

      {/* 5 — Three things, never negotiable + what this is */}
      <section className="ph-section-lg">
        <Reveal className="ph-container">
          <p className="ph-eyebrow">Three things, never negotiable</p>
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

      {/* 6 — What this is (what it is / what it isn't) */}
      <section className="ph-section-lg bg-muted model-plainly">
        <Reveal className="ph-container">
          <p className="ph-eyebrow">What this is</p>
          <div className="model-plainly-grid">
            <div className="model-plainly-col">
              <p className="model-plainly-head is-olive">What it is</p>
              <ul className="model-is">
                {MODEL_IS.map((t) => (
                  <li key={t}>
                    <CircleCheck aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <Photo
              assetId="ph-photo-model-still"
              alt="An olive bonsai and prayer beads on a woven mat."
              sizes="(max-width: 760px) 60vw, 300px"
              className="model-plainly-photo"
            />
            <div className="model-plainly-col">
              <p className="model-plainly-head is-terra">What it is not</p>
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
          <p className="model-leads">Culture leads.</p>
        </Reveal>
      </section>
    </>
  );
}
