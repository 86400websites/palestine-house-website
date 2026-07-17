import { Photo, type PhotoId } from "@/components/shared/photo";
import { Reveal } from "@/components/motion/reveal";

/* "Inside a Palestine House" (DR1-5, auto-marquee at DR1-8) — six photography
   cards drifting in a continuous CSS marquee (owner decision 2026-07-02,
   recorded §4 D-DR1: a sanctioned exception to the no-auto-carousel motion
   rule for this one section). Pure CSS: the track holds the card list twice
   (the copy aria-hidden) and translates -50% on a linear loop; it pauses on
   hover, and under prefers-reduced-motion the animation is off and the strip
   falls back to a manual scroller with the duplicate hidden. Card labels are
   the owner-approved copy from the reference (DR1-5 gate). */

const INSIDE_CARDS: {
  id: PhotoId;
  title: string;
  sub: string;
  alt: string;
}[] = [
  {
    id: "ph-photo-oud-night",
    title: "Friday oud night",
    sub: "Live music, shared closely, in a room that feels like home.",
    alt: "Two musicians playing the oud on a candlelit stage.",
  },
  {
    id: "ph-photo-tatreez-workshop",
    title: "Tatreez workshop",
    sub: "Hands, stories, and knowledge passed from one generation to another.",
    alt: "Hands stitching red tatreez embroidery at a workshop table.",
  },
  {
    id: "ph-photo-supper-club",
    title: "Palestinian supper club",
    sub: "Long tables, generous food, and conversations that continue into the evening.",
    alt: "Guests sharing a candlelit dinner at a long supper-club table.",
  },
  {
    id: "ph-photo-film-screening",
    title: "Film screening",
    sub: "Cinema from Palestine and its diaspora, followed by space to reflect and respond.",
    alt: "An audience watching a film projected onto a screen.",
  },
  {
    id: "ph-photo-book-talk",
    title: "Book talk",
    sub: "Writers, readers, ideas, and conversations that deepen how we understand Palestine.",
    alt: "Three speakers in conversation at a book talk.",
  },
  {
    id: "ph-photo-market-day",
    title: "Market day",
    sub: "Palestinian makers, independent products, local food, and community under one roof.",
    alt: "Visitors browsing clothing and crafts at a market day.",
  },
];

function CardList({ hidden }: { hidden?: boolean }) {
  return (
    <ul className="v3-strip" aria-hidden={hidden || undefined}>
      {INSIDE_CARDS.map((c) => (
        <li key={c.title} className="v3-strip-card">
          <Photo
            assetId={c.id}
            alt={hidden ? "" : c.alt}
            rounded
            className="v3-strip-photo"
            sizes="(max-width: 720px) 100vw, 280px"
          />
          <h3 className="v3-strip-title">{c.title}</h3>
          <p className="v3-strip-sub">{c.sub}</p>
        </li>
      ))}
    </ul>
  );
}

export function InsideStrip() {
  return (
    <section className="ph-section-lg v3-inside">
      <div className="ph-container">
        <Reveal>
          <h2 className="v3-rule-head">Inside a Palestine House</h2>
        </Reveal>
      </div>
      <Reveal delay={0.08}>
        <div
          className="v3-marquee"
          role="region"
          aria-label="Scenes from inside a Palestine House"
          /* focusable so the reduced-motion scroller works by keyboard;
             harmless in the animated state (DR1-10) */
          tabIndex={0}
        >
          <div className="v3-marquee-track">
            <CardList />
            <CardList hidden />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
