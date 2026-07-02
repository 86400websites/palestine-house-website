import { Photo, type PhotoId } from "@/components/shared/photo";
import { Reveal } from "@/components/motion/reveal";

/* "Inside a Palestine House" (DR1-5) — six photography cards in a CSS
   scroll-snap strip, per the owner's reference (docs/source-assets/design-refs/
   v3/examples/culture-deserves-more-page-example.png). Native scrolling only —
   no JS carousel, no autoplay (DESIGN motion register); the scroller is a
   focusable region so keyboard users can arrow through it. Card labels are the
   owner-approved copy from that reference (DR1-5 gate). */

const INSIDE_CARDS: {
  id: PhotoId;
  title: string;
  sub: string;
  alt: string;
}[] = [
  {
    id: "ph-photo-oud-night",
    title: "Friday oud night",
    sub: "Live music that brings us together.",
    alt: "Two musicians playing the oud on a candlelit stage.",
  },
  {
    id: "ph-photo-tatreez-workshop",
    title: "Tatreez workshop",
    sub: "Learning, sharing, keeping traditions alive.",
    alt: "Hands stitching red tatreez embroidery at a workshop table.",
  },
  {
    id: "ph-photo-supper-club",
    title: "Palestinian supper club",
    sub: "Food, stories and long tables.",
    alt: "Guests sharing a candlelit dinner at a long supper-club table.",
  },
  {
    id: "ph-photo-film-screening",
    title: "Film screening",
    sub: "Stories from our land and people.",
    alt: "An audience watching a film projected onto a screen.",
  },
  {
    id: "ph-photo-book-talk",
    title: "Book talk",
    sub: "Ideas, literature and important conversations.",
    alt: "Three speakers in conversation at a book talk.",
  },
  {
    id: "ph-photo-market-day",
    title: "Market day",
    sub: "Local makers, Palestinian products, community vibes.",
    alt: "Visitors browsing clothing and crafts at a market day.",
  },
];

export function InsideStrip() {
  return (
    <section className="ph-section-lg v3-inside">
      <div className="ph-container">
        <Reveal>
          <h2 className="v3-rule-head">Inside a Palestine House</h2>
        </Reveal>
        <Reveal delay={0.08}>
          <div
            className="v3-strip-scroller"
            role="region"
            aria-label="Scenes from inside a Palestine House — scrolls sideways"
            tabIndex={0}
          >
            <ul className="v3-strip">
              {INSIDE_CARDS.map((c) => (
                <li key={c.title} className="v3-strip-card">
                  <Photo
                    assetId={c.id}
                    alt={c.alt}
                    rounded
                    className="v3-strip-photo"
                    sizes="(max-width: 720px) 76vw, 280px"
                  />
                  <h3 className="v3-strip-title">{c.title}</h3>
                  <p className="v3-strip-sub">{c.sub}</p>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
