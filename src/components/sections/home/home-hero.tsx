import Link from "next/link";
import Image from "next/image";
import { Coffee, Music, Users } from "lucide-react";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { PHOTO_SOURCES } from "@/components/shared/photo";

/* v3 Home hero (DR1-4, CTAs revised DR1-8) — full-bleed tatreez photo under
   the transparent header, per the owner's reference mockup (docs/source-assets/
   design-refs/v3/examples/home-page-hero-example.png). Headline/subline/
   mini-features are the owner-approved copy from that reference; the CTA pair
   matches it too — Apply + "Explore the model" (the booklet lead magnet was
   retired entirely at DR1-8, owner decision 2026-07-02). */

const HERO_FEATS = [
  {
    icon: Coffee,
    title: "Café by day",
    sub: "Gather, work, and share a meal.",
  },
  {
    icon: Music,
    title: "Stage by night",
    sub: "Live music, film, poetry, and stories.",
  },
  {
    icon: Users,
    title: "Community every day",
    sub: "Workshops, markets, and conversations.",
  },
] as const;

function HeroFeats() {
  return (
    <ul className="v3-hero-feats">
      {HERO_FEATS.map((f) => (
        <li key={f.title} className="v3-hero-feat">
          <f.icon size={26} strokeWidth={1.6} aria-hidden="true" />
          <div>
            <span className="v3-hero-feat-title">{f.title}</span>
            <span className="v3-hero-feat-sub">{f.sub}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function HomeHero() {
  return (
    <>
    <section className="v3-hero">
      <Image
        src={PHOTO_SOURCES["ph-photo-hero-tatreez"]}
        alt="Hands embroidering red tatreez patterns on white cloth."
        fill
        priority
        quality={78}
        /* cover on a min(100svh, 58rem) box: portrait viewports need ~1.5×
           the viewport HEIGHT in width; browsers without max() in sizes
           fall back to 100vw (the previous behavior) */
        sizes="max(100vw, 150svh)"
        className="v3-hero-img"
      />
      <div className="v3-hero-scrim" aria-hidden="true" />
      <div className="ph-container v3-hero-inner">
        <Stagger className="v3-hero-copy">
          <h1>A home for Palestinian culture, in every city.</h1>
          <p className="v3-hero-sub">
            Palestine House helps local partners build permanent spaces for
            food, music, art, memory, and community.
          </p>
          <div className="v3-hero-ctas">
            <Button asChild size="lg" className="v3-cta">
              <Link href="/apply">Apply to bring a House</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="v3-cta">
              <Link href="/model">Explore the model</Link>
            </Button>
          </div>
        </Stagger>
        {/* Desktop: the mini-features live in the hero's bottom band.
            On mobile this wrapper hides and the sibling band below shows
            instead (owner direction, 2026-07-03) — display:none removes the
            hidden copy from the accessibility tree, so nothing reads twice. */}
        <Reveal delay={0.24} className="v3-hero-featwrap">
          <HeroFeats />
        </Reveal>
      </div>
    </section>
    {/* Mobile: the hero ends at the buttons; the three features follow as
        their own charcoal band right after the photo. Hidden on desktop. */}
    <div className="v3-hero-feats-mobile">
      <Reveal className="ph-container">
        <HeroFeats />
      </Reveal>
    </div>
    </>
  );
}
