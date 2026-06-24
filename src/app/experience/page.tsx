import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Artwork } from "@/components/shared/artwork";
import { PageDivider } from "@/components/shared/page-divider";
import { ApplyCta } from "@/components/sections/apply-cta";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/sections/lead-form";
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
    alt: "A block-print illustration of a dallah pouring coffee into a small cup on a tatreez-edged cloth.",
  },
  {
    id: "PH-EXP-03b",
    name: "Contemporary Creativity",
    text: "new work from artists making it now.",
    alt: "A block-print illustration of a musician on the low stage of a House.",
  },
  {
    id: "PH-EXP-03c",
    name: "Education & Exchange",
    text: "talks, workshops, and learning out loud.",
    alt: "A block-print illustration of a study circle around a green table, notebooks open.",
  },
  {
    id: "PH-EXP-03d",
    name: "Community Activation",
    text: "the dinners, the markets, the reasons to return.",
    alt: "An illustration of friends passing a shared plate down a long dinner table.",
  },
  {
    id: "PH-EXP-03e",
    name: "Commercial Sustainability",
    text: "the small economy that keeps the doors open.",
    alt: "A block-print illustration of a café counter — a barista, a guest paying, shelves of goods.",
  },
] as const;

export default async function ExperiencePage() {
  const { live, upcoming, past } = groupSessions(await getLiveSessions());
  const strip = [...live, ...upcoming, ...past].slice(0, 3);

  return (
    <>
      {/* 1 — Hero */}
      <section className="art-hero">
        <div className="ph-container art-hero-grid">
          <Reveal className="art-hero-copy">
            <p className="ph-eyebrow">Experience</p>
            <h1>What a Palestine House feels like.</h1>
            <p className="ph-lead">
              A café where the coffee is good and the food is cooked from real
              recipes. A stage that turns the same room into a concert, a film
              night, a reading. A place your city can come back to, any day of
              the week.
            </p>
            <div className="page-hero-ctas">
              <Button asChild size="lg">
                <Link href="/apply">
                  Apply to bring a House
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#whats-on">
                  <Play aria-hidden="true" />
                  Watch what’s on
                </a>
              </Button>
            </div>
            <p className="page-hero-support">
              Every application is reviewed by HQ.
            </p>
          </Reveal>
          <Reveal className="art-hero-art">
            <Artwork
              assetId="PH-EXP-01"
              alt="An ink-wash illustration of the main room of a House — café tables in the warm light of tall pointed-arch windows."
              ratio="16 / 10"
              sizes="(max-width: 900px) 100vw, 55vw"
              priority
            />
          </Reveal>
        </div>
      </section>

      {/* 2 — A café by day. A stage by night. */}
      <section className="ph-section-lg">
        <div className="ph-container">
          <Reveal className="sec-head is-center">
            <p className="ph-eyebrow">One room, two moods</p>
            <h2>A café by day. A stage by night.</h2>
          </Reveal>
          <Reveal className="exp-daynight">
            <figure className="exp-mood">
              <Artwork
                assetId="PH-EXP-02a"
                alt="An ink-wash illustration of the room by day — people reading, working, and meeting over coffee."
                ratio="4 / 5"
                sizes="(max-width: 760px) 100vw, 40vw"
              />
              <figcaption className="exp-mood-cap">
                By day, it’s where people read, work, and meet.
              </figcaption>
            </figure>
            <figure className="exp-mood is-night">
              <Artwork
                assetId="PH-EXP-02b"
                alt="The same room by night — chairs turned to the low stage for a performance, lamps low."
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

      {/* 4 — Live strip (designed empty state until S7 wires the feed) */}
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

      {/* 7 — Lead magnet */}
      <section className="ph-section bg-hero">
        <Reveal className="ph-container leadmagnet">
          <p className="ph-eyebrow">Free read</p>
          <h2>Start with a free read.</h2>
          <p className="leadmagnet-books">
            <strong>The House Promise</strong> — what a House is, and why it
            matters.
          </p>
          <LeadForm single idPrefix="exp-lead" />
        </Reveal>
      </section>
    </>
  );
}
