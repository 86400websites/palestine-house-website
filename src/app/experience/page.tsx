import type { Metadata } from "next";
import Link from "next/link";
import { Artwork } from "@/components/shared/artwork";
import { Photo } from "@/components/shared/photo";
import { PageDivider } from "@/components/shared/page-divider";
import { PageHero } from "@/components/sections/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

/* Experience (/experience) — the decision page. Copy verbatim from the owner's
   Public Website Copy, section 4 (CR1); §2 + §5 imagery/layout from the
   owner's LH1 mockups (docs/source-assets/design-refs/v3/mockups/). The S9
   live strip is gone: sessions are members-only since LH1 (0025), so the public
   page carries zero session data and renders fully static. The old closing
   "The first step" section is retired too (owner, 2026-07-10) — the footer's
   site-wide premium CTA (DR3.1) is the one closing invitation. */

export const metadata: Metadata = {
  title: { absolute: "Experience - Palestine House" },
  description:
    "Explore the cultural experiences and everyday welcome a local Palestine House can create.",
};

const EXP_PILLARS = [
  {
    id: "PH-EXP-03a",
    name: "Heritage and Memory",
    text: "Create space for stories, craft, music, food traditions and knowledge shared between generations.",
    alt: "Speakers in conversation over a low table at a House talk.",
    objectPosition: "50% 54%",
  },
  {
    id: "PH-EXP-03b",
    name: "Contemporary Creativity",
    text: "Welcome the work of Palestinian artists, writers, musicians, filmmakers and creative practitioners.",
    alt: "A stone mosaic of the Dome of the Rock on the House wall.",
    objectPosition: "50% 50%",
  },
  {
    id: "PH-EXP-03c",
    name: "Learning and Exchange",
    text: "Use talks, readings, workshops and discussions to invite curiosity and thoughtful conversation.",
    alt: "Readers sharing pages aloud in the armchairs of a House gathering.",
    objectPosition: "50% 57%",
  },
  {
    id: "PH-EXP-03d",
    name: "Community and Belonging",
    text: "Build relationships through gatherings and regular reasons to participate, rather than relying only on occasional large events.",
    alt: "Red carnations gathered on a woven tray for the evening.",
    objectPosition: "50% 55%",
  },
  {
    id: "PH-EXP-03e",
    name: "A Sustainable Local Model",
    text: "Choose activities and income sources that fit the House’s capacity and help it meet its ongoing costs. Not every House needs the same offer.",
    alt: "The room set for the evening — cushioned seating, a balustrade, a projector ready.",
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
        title="A place to experience Palestinian culture together."
        lead={[
          "Picture a welcoming room, a thoughtful program and people who have a reason to return. Your Palestine House can bring Palestinian creativity, memory and everyday life into the rhythm of its city.",
          "The examples here are inspiration. Each local team chooses the experience it can create and sustain.",
        ]}
        support="Apply for community access, not permission to operate a House."
      >
        <Button asChild size="lg" className="v3-cta">
          <Link href="/apply">Apply to Join</Link>
        </Button>
      </PageHero>

      {/* 2 — Everyday connection. Cultural life throughout the year. */}
      <section className="ph-section-lg">
        <div className="ph-container">
          <Reveal className="sec-head is-center">
            <p className="ph-eyebrow">One room. Many ways to belong.</p>
            <h2>
              Everyday connection. <br />
              Cultural life throughout the year.
            </h2>
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
                alt="The room by day — guests at wooden tables under the arches, listening in."
                className="exp-mood-photo"
                sizes="(max-width: 760px) 100vw, 45vw"
              />
              <figcaption className="exp-mood-cap">
                A House might offer a quiet place to read or meet during the
                day. Where the local model includes food and drinks, Palestinian
                hospitality can be part of that daily welcome.
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
                Later, the room might host a discussion, performance or
                screening. The same space can support different activities as
                the local team develops its program.
              </figcaption>
            </figure>
          </Reveal>
          <Reveal>
            <p className="exp-daynight-close">
              What matters is that the room works for the people using it and
              feels cared for each time they return.
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
            <h2>Five ways to think about the experience</h2>
            <p className="ph-lead">
              These themes can help a local team develop its own cultural
              program. They are inspiration, not a required calendar or a
              centrally assigned set of activities.
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
                    sizes="(max-width: 460px) 320px, (max-width: 700px) 50vw, (max-width: 1020px) 33vw, 20vw"
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
              Different activities. A familiar welcome.
            </p>
            <p className="exp-pillars-close-sub">
              Someone may come for a film and return for a workshop. Another
              person may discover Palestinian writing for the first time.
              Someone else may find a connection to home.
            </p>
            <p className="exp-pillars-close-sub">
              The program can change while the welcome stays recognizable: warm,
              respectful and genuinely interested in the people who arrive.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 5 — A permanent ambition. Recomposed 2026-07-17 to match §6 below, so
          the page's two closing beats read as a deliberate pair: eyebrow + mark
          · heading · lead · body · copper rule · triad. (The LH1 dissolve-band
          treatment was tuned for a one-line lead and looked forced once the
          owner's fuller copy landed — owner call.) */}
      <section className="v3-split exp-perm-split">
        <div className="v3-split-panel">
          <Reveal>
            <p className="ph-eyebrow">Permanence</p>
            <span className="exp-orn exp-orn--eyebrow" aria-hidden="true">
              <span />
            </span>
            <h2>A permanent ambition, developed at a realistic pace</h2>
            <p className="ph-lead">
              The purpose is to create a lasting House. You do not need to have
              everything in place before you join the community and begin
              planning.
            </p>
            <p className="v3-split-body">
              Start by understanding the people, space, costs and commitments
              involved. Build toward a House that your local team can run well
              over time.
            </p>
            <span className="exp-orn exp-close-rule" aria-hidden="true">
              <span />
            </span>
            <ul className="exp-triad">
              <li>A place to return to.</li>
              <li>A place to build relationships.</li>
              <li>A place where culture is visible, lived, and shared.</li>
            </ul>
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

      {/* 6 — More than somewhere to visit (copy overhaul 2026-07-17: a closing
          emotional beat before the site-wide footer CTA, built to the owner's
          reference mockup — copy left, gathering photo right). */}
      <section className="v3-split exp-gather-split">
        <div className="v3-split-panel">
          <Reveal>
            <p className="ph-eyebrow">Experience</p>
            <span className="exp-orn exp-orn--eyebrow" aria-hidden="true">
              <span />
            </span>
            <h2>More than somewhere to visit.</h2>
            <p className="ph-lead">
              A Palestine House becomes part of the rhythm of its city.
            </p>
            <p className="v3-split-body">
              People return for the food, the programme, the conversations, and
              the feeling of being welcomed into something meaningful.
            </p>
            <span className="exp-orn exp-close-rule" aria-hidden="true">
              <span />
            </span>
            <ul className="exp-triad exp-triad--lead">
              <li>
                <strong>For some,</strong> it is a connection to home.
              </li>
              <li>
                <strong>For others,</strong> it is an introduction.
              </li>
              <li>
                <strong>For everyone,</strong> it is a place to gather.
              </li>
            </ul>
          </Reveal>
        </div>
        <div className="v3-split-photo">
          <Photo
            assetId="ph-photo-exp-gather"
            alt="Guests gathered around a raised Palestinian flag at an evening House gathering."
            sizes="(max-width: 880px) 100vw, 60vw"
          />
        </div>
      </section>
    </>
  );
}
