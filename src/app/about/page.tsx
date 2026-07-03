import type { Metadata } from "next";
import { Artwork } from "@/components/shared/artwork";
import { TatreezDivider } from "@/components/shared/tatreez-divider";
import { ApplyCta } from "@/components/sections/apply-cta";
import { Reveal } from "@/components/motion/reveal";

/* About (/about) — short, human manifesto. Copy verbatim from
   docs/page-copy/01-public-pages/about.md; layout from
   docs/page-designs/public/About.app.jsx (approved mockup). */

export const metadata: Metadata = {
  title: "About",
  description:
    "Most people meet Palestine in a headline. We’d rather they meet it at the table — a permanent home for Palestinian food, art, music, and community.",
};

export default function AboutPage() {
  return (
    <>
      {/* 1 — Art-led hero */}
      <section className="art-hero">
        <div className="ph-container art-hero-grid is-portrait">
          <Reveal className="art-hero-copy">
            <p className="ph-eyebrow">About</p>
            <h1>
              Most people meet Palestine in a headline. We’d rather they meet it
              at the table.
            </h1>
          </Reveal>
          <Reveal className="art-hero-art about-hero-art">
            <Artwork
              assetId="PH-ABOUT-01"
              alt="An arched hallway into the House, a kilim runner leading to the open door."
              ratio="4 / 5"
              sizes="(max-width: 900px) 100vw, 40vw"
              priority
            />
          </Reveal>
        </div>
      </section>

      {/* 2 — Why this exists */}
      <section className="ph-section-lg">
        <Reveal className="ph-container about-why">
          <div className="about-why-head">
            <p className="ph-eyebrow">Why this exists</p>
          </div>
          <div className="about-why-body">
            <p className="about-why-lead">
              Walk into a Palestine House and the first thing you get isn’t an
              argument. It’s a plate of musakhan, the smell of olive oil pressed
              from trees older than any of us, music that pulls people up to
              dance.
            </p>
            <p>
              The hard reality isn’t hidden. It’s simply answered — by a culture
              that keeps existing, proudly and in public.
            </p>
            <p>
              We’re building that, one House at a time: a permanent home for
              Palestinian food, art, music, and community, in cities around the
              world.
            </p>
          </div>
        </Reveal>
      </section>

      {/* 3 — A permanent home (full-bleed art moment) */}
      <section className="about-artband">
        <div className="ph-container">
          <Reveal className="about-artband-art">
            <Artwork
              assetId="PH-EXP-02a"
              alt="Dancers in embroidered thobes take their bow before a full House room."
              ratio="16 / 10"
              objectPosition="50% 54%"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </Reveal>
        </div>
      </section>

      {/* 4 — Tagline statement band */}
      <section className="ph-section-lg bg-muted about-tagline">
        <Reveal className="ph-container about-tagline-inner">
          <TatreezDivider width="200px" opacity={0.7} palette="v3" />
          <p className="about-tagline-line">
            Passion inspires.
            <br />
            Discipline delivers.
          </p>
          <ApplyCta secondaryHref="/contact" secondaryLabel="Contact" />
        </Reveal>
      </section>
    </>
  );
}
