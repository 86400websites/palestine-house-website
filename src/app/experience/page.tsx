import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Artwork } from "@/components/shared/artwork";
import { Photo } from "@/components/shared/photo";
import { PageDivider } from "@/components/shared/page-divider";
import { ApplyCta } from "@/components/sections/apply-cta";
import { PageHero } from "@/components/sections/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { SessionCard } from "@/components/shared/session-card";
import { getLiveSessions, groupSessions } from "@/lib/live/sessions";

/* Experience (/experience) — the decision page. Copy verbatim from
   docs/page-copy/01-public-pages/experience.md; layout from
   docs/page-designs/public/Experience.app.jsx (approved mockup).
   S9 9d wires the live strip to the SAME getLiveSessions() feed + the SAME
   shared SessionCard as /live (≤3, prefer live→upcoming→past), keeping its
   approved empty state when nothing is on. */

export const metadata: Metadata = {
  title: "Experience",
  description:
    "What a Palestine House feels like — a café by day, a stage by night, five threads of programming, and the culture live in Houses around the world.",
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

export default async function ExperiencePage() {
  const { live, upcoming, past } = groupSessions(await getLiveSessions());
  const strip = [...live, ...upcoming, ...past].slice(0, 3);

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
        <Button asChild variant="outline" size="lg" className="v3-cta">
          <a href="#whats-on">
            <Play aria-hidden="true" />
            Watch what’s on
          </a>
        </Button>
      </PageHero>

      {/* 2 — A café by day. A stage by night. */}
      <section className="ph-section-lg">
        <div className="ph-container">
          <Reveal className="sec-head is-center">
            <p className="ph-eyebrow">One room, two moods</p>
            <h2>A café by day. A stage by night.</h2>
          </Reveal>
          <Reveal className="exp-daynight">
            <figure className="exp-mood">
              {/* Day figure: a genuine daytime café scene (DR1-10 design QA —
                  the file behind PH-EXP-02a is a night-performance photo that
                  contradicted this caption). */}
              <Photo
                assetId="ph-photo-arch-cafe"
                alt="The café room in daylight — wooden tables behind an arched stone doorway."
                className="exp-mood-photo"
                sizes="(max-width: 760px) 100vw, 40vw"
              />
              <figcaption className="exp-mood-cap">
                By day, it’s where people read, work, and meet.
              </figcaption>
            </figure>
            <figure className="exp-mood is-night">
              <Artwork
                assetId="PH-EXP-02b"
                alt="The same room by night — the crowd on its feet, dancing together at a House celebration."
                ratio="4 / 5"
                sizes="(max-width: 760px) 100vw, 40vw"
              />
              <figcaption className="exp-mood-cap">
                By night, the chairs face the stage — a performance, a
                screening, a conversation.
              </figcaption>
            </figure>
          </Reveal>
          <Reveal>
            <p className="exp-daynight-close statement-line">
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

      {/* 4 — Live strip (wired to getLiveSessions() in S9 9d; falls back to the
          approved empty state when nothing is on) */}
      <section className="ph-section-lg ph-section-dark" id="whats-on">
        <div className="ph-container">
          <Reveal className="exp-live-head">
            <div className="sec-head">
              <p className="ph-eyebrow">The culture, live</p>
              <h2>See what’s on right now.</h2>
              <p className="ph-lead">
                Not a render — what’s actually happening, in Houses around the
                world.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/live">
                See everything that’s on
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </Reveal>
          {strip.length > 0 ? (
            <Reveal>
              <div className="live-grid">
                {strip.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            </Reveal>
          ) : (
            <Reveal>
              <p className="live-empty">
                Quiet right now — here’s a recent night while the calendar fills.
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {/* 5 — A home, not a moment */}
      <section className="ph-section-lg">
        <Reveal className="ph-container statement">
          <p className="ph-eyebrow">Permanence</p>
          <h2 className="statement-line exp-statement-h">
            A home, not a moment.
          </h2>
          <p className="statement-sub">
            Pop-ups close. A House stays — open every day, at the same address.
            Not a protest, not a campaign. A place where the culture lives in
            the open.
          </p>
        </Reveal>
      </section>

      <PageDivider />

      {/* 6 — Closing */}
      <section className="ph-section-lg">
        <Reveal className="ph-container statement">
          <p className="ph-eyebrow">The first step</p>
          <h2 className="statement-line exp-statement-h">
            Every House started with one person.
          </h2>
          <p className="statement-sub">
            Someone who knew their city was ready, and was willing to do the
            work to open the door.
          </p>
          <p className="statement-sub">
            If that sounds like you, apply — every application is reviewed by
            HQ.
          </p>
          <ApplyCta secondaryHref="/bring-ph" secondaryLabel="See what it takes" />
        </Reveal>
      </section>
    </>
  );
}
