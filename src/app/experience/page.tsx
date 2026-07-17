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
    text: "Keeping stories alive through food, music, craft, oral history, and collective remembrance. Recipes are shared. Songs are carried forward. Personal histories become part of a larger cultural memory.",
    alt: "Speakers in conversation over a low table at a House talk.",
    objectPosition: "50% 54%",
  },
  {
    id: "PH-EXP-03b",
    name: "Contemporary Creativity",
    text: "Music, visual art, film, literature, performance, comedy, and new ideas from Palestine and its diasporas.",
    alt: "A stone mosaic of the Dome of the Rock on the House wall.",
    objectPosition: "50% 50%",
  },
  {
    id: "PH-EXP-03c",
    name: "Education & Exchange",
    text: "Talks, readings, workshops, screenings, study groups, and conversations that create space for curiosity, reflection, and deeper understanding.",
    alt: "Readers sharing pages aloud in the armchairs of a House gathering.",
    objectPosition: "50% 57%",
  },
  {
    id: "PH-EXP-03d",
    name: "Community & Belonging",
    text: "The gatherings that turn a venue into a shared home. Community dinners, markets, celebrations, family activities, open tables, and regular reasons to return.",
    alt: "Red carnations gathered on a woven tray for the evening.",
    objectPosition: "50% 55%",
  },
  {
    id: "PH-EXP-03e",
    name: "Everyday Sustainability",
    text: "The café, shop, events, and partnerships that keep the House active and its doors open. A Palestine House is built to last. Its cultural work is supported by a thoughtful, responsible local economy.",
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
        title="Step inside a Palestine House."
        lead="A place that feels familiar, even on your first visit. Come for Palestinian coffee and food made from recipes carried across generations. Stay for a concert, a film, a reading, or a conversation that changes the way you see something — somewhere to meet, work, listen, eat, learn, and return to throughout the week and throughout the year."
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
            <p className="ph-eyebrow">One room. Many ways to belong.</p>
            <h2>A café by day. A cultural stage by night.</h2>
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
                By day, the House is open for everyday life. People arrive for
                coffee, lunch, conversation, reading, working, or simply a place
                to pause. Some stay for twenty minutes. Others remain for the
                afternoon.
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
                By night, the room shifts. Tables move, chairs turn towards the
                stage, and the same space becomes a home for live music, film,
                poetry, literature, talks, and shared conversation.
              </figcaption>
            </figure>
          </Reveal>
          <Reveal>
            <p className="exp-daynight-close">
              One room, continually renewed by the people and stories that pass
              through it.
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
            <h2>One living cultural programme.</h2>
            <p className="ph-lead">
              Every event at a Palestine House is part of a wider story. Across
              the year, programming moves through five connected threads —
              bringing together memory, contemporary creativity, learning,
              community, and the everyday economy that allows the House to
              remain open. The programme changes from week to week, but the
              cultural purpose remains clear.
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
            <p className="exp-pillars-close-sub">
              A concert one evening, a workshop the next morning, a quiet coffee
              in between. The programme changes, but the welcome remains.
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
              Temporary events can create powerful moments. A Palestine House
              gives those moments somewhere to continue. It is open throughout
              the year, at the same address — a place where Palestinian culture
              can be encountered not occasionally, but as part of the everyday
              life of a city.
            </p>
            <ul className="exp-perm-triad">
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
            <span className="exp-orn exp-gather-rule" aria-hidden="true">
              <span />
            </span>
            <ul className="exp-gather-triad">
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
