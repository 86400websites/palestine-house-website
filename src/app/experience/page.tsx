import type { Metadata } from "next";
import Link from "next/link";
import { Artwork } from "@/components/shared/artwork";
import { Photo } from "@/components/shared/photo";
import { PageDivider } from "@/components/shared/page-divider";
import { PageHero } from "@/components/sections/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

/* Experience (/experience) — the decision page. Copy verbatim from
   docs/page-copy/01-public-pages/experience.md; §2 + §5 imagery/layout from the
   owner's LH1 mockups (docs/source-assets/design-refs/v3/mockups/). The S9
   live strip is gone: sessions are members-only since LH1 (0025), so the public
   page carries zero session data and renders fully static. The old closing
   "The first step" section is retired too (owner, 2026-07-10) — the footer's
   site-wide premium CTA (DR3.1) is the one closing invitation. */

export const metadata: Metadata = {
  title: "Experience",
  description:
    "What a Palestine House feels like — a café by day, a stage by night, and five threads of programming that hold a year together.",
};

const EXP_PILLARS = [
  {
    id: "PH-EXP-03a",
    name: "Heritage & Memory",
    text: "the recipes, the songs, the stories worth keeping.",
    alt: "Speakers in conversation over a low table at a House talk.",
    objectPosition: "50% 54%",
  },
  {
    id: "PH-EXP-03b",
    name: "Contemporary Creativity",
    text: "new work from artists making it now.",
    alt: "A stone mosaic of the Dome of the Rock on the House wall.",
    objectPosition: "50% 50%",
  },
  {
    id: "PH-EXP-03c",
    name: "Education & Exchange",
    text: "talks, workshops, and learning out loud.",
    alt: "Readers sharing pages aloud in the armchairs of a House gathering.",
    objectPosition: "50% 57%",
  },
  {
    id: "PH-EXP-03d",
    name: "Community Activation",
    text: "the dinners, the markets, the reasons to return.",
    alt: "Red carnations gathered on a woven tray for the evening.",
    objectPosition: "50% 55%",
  },
  {
    id: "PH-EXP-03e",
    name: "Commercial Sustainability",
    text: "the small economy that keeps the doors open.",
    alt: "The café room set for the evening — cushioned seating, a balustrade, a projector ready.",
    objectPosition: "50% 54%",
  },
] as const;

export default function ExperiencePage() {
  return (
    <>
      {/* 1 — v3 photo hero (DR1-9) */}
      <PageHero
        photo="ph-photo-experience"
        alt="An oud player performing to a seated audience in a candlelit stone room."
        position="50% 32%"
        eyebrow="Experience"
        title="What a Palestine House feels like."
        lead="A café where the coffee is good and the food is cooked from real recipes. A stage that turns the same room into a concert, a film night, a reading. A place your city can come back to, any day of the week."
        support="Every application is reviewed by HQ."
      >
        <Button asChild size="lg" className="v3-cta">
          <Link href="/apply">Apply to bring a House</Link>
        </Button>
      </PageHero>

      {/* 2 — A café by day. A stage by night. */}
      <section className="ph-section-lg">
        <div className="ph-container">
          <Reveal className="sec-head is-center">
            <p className="ph-eyebrow">One room, two moods</p>
            <h2>A café by day. A stage by night.</h2>
            {/* the mockup's line-and-diamond mark under the heading (LH1) */}
            <span className="exp-orn" aria-hidden="true">
              <span />
            </span>
          </Reveal>
          <Reveal className="exp-daynight">
            {/* LH1 — both moods are owner photos of the same room (landscape
                pair per the mockup); the night Artwork is retired here. */}
            <figure className="exp-mood">
              <Photo
                assetId="ph-photo-exp-cafe-day"
                alt="The café room by day — guests at wooden tables under the arches, listening in."
                className="exp-mood-photo"
                sizes="(max-width: 760px) 100vw, 45vw"
              />
              <figcaption className="exp-mood-cap">
                By day, it’s where people read, work, and meet.
              </figcaption>
            </figure>
            <figure className="exp-mood">
              <Photo
                assetId="ph-photo-exp-stage-night"
                alt="The same room by night — a musician on stage, the audience gathered on the rugs."
                className="exp-mood-photo"
                sizes="(max-width: 760px) 100vw, 45vw"
              />
              <figcaption className="exp-mood-cap">
                By night, the chairs face the stage — a performance, a
                screening, a conversation.
              </figcaption>
            </figure>
          </Reveal>
          <Reveal>
            <p className="exp-daynight-close">
              One room, doing the work of a dozen places.
            </p>
          </Reveal>
        </div>
      </section>

      <PageDivider />

      {/* 3 — Five kinds of programming */}
      <section className="ph-section-lg" id="programming">
        <div className="ph-container">
          <Reveal className="sec-head">
            <p className="ph-eyebrow">The five threads</p>
            <h2>Five kinds of programming.</h2>
            <p className="ph-lead">
              A House doesn’t run random events. Every one belongs to one of
              five threads, so a year of programming holds together instead of
              feeling like a noticeboard.
            </p>
          </Reveal>
          <Reveal className="exp-pillars">
            {EXP_PILLARS.map((p) => (
              <div key={p.id} className="exp-pillar">
                <div className="exp-pillar-art">
                  <Artwork
                    assetId={p.id}
                    alt={p.alt}
                    ratio="4 / 5"
                    rounded
                    block
                    sizes="(max-width: 700px) 50vw, 20vw"
                    objectPosition={p.objectPosition}
                  />
                </div>
                <h3>{p.name}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </Reveal>
          <Reveal>
            <p className="exp-pillars-close">
              Different every week. Familiar every time.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 5 — A home, not a moment (LH1: the statement band becomes a cream /
          photo split per the owner mockup; copy verbatim). The S9 live strip
          that sat before it is retired — sessions are members-only now. */}
      <section className="v3-split exp-home-split">
        <div className="v3-split-panel">
          <Reveal>
            <p className="ph-eyebrow">Permanence</p>
            {/* the mockup's small hairline-and-diamond mark under the eyebrow */}
            <span className="exp-orn exp-orn--eyebrow" aria-hidden="true">
              <span />
            </span>
            <h2>A home, not a moment.</h2>
            <p className="ph-lead">
              Pop-ups close. A House stays — open every day, at the same
              address. Not a protest, not a campaign. A place where the culture
              lives in the open.
            </p>
          </Reveal>
        </div>
        <div className="v3-split-photo">
          <Photo
            assetId="ph-photo-exp-home"
            alt="A bonsai and prayer beads on a woven table, a candle burning behind."
            sizes="(max-width: 880px) 100vw, 60vw"
          />
        </div>
      </section>
    </>
  );
}
