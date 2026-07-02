import Link from "next/link";
import Image from "next/image";
import { Coffee, Music, Users } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { LeadMagnetDialog } from "@/components/sections/lead-magnet-dialog";

/* v3 Home hero (DR1-4) — full-bleed tatreez photo under the transparent
   header, per the owner's reference mockup (docs/source-assets/design-refs/
   v3/examples/home-page-hero-example.png). Headline/subline/mini-features
   are the owner-approved copy from that reference (DR1-4 gate); the Apply
   CTA + booklet dialog are the locked conversion pair, unchanged. */

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

export function HomeHero() {
  return (
    <section className="v3-hero">
      <Image
        src="/assets/photos/ph-photo-hero-tatreez.jpg"
        alt="Hands embroidering red tatreez patterns on white cloth."
        fill
        priority
        quality={78}
        sizes="100vw"
        className="v3-hero-img"
      />
      <div className="v3-hero-scrim" aria-hidden="true" />
      <div className="ph-container v3-hero-inner">
        <Reveal className="v3-hero-copy">
          <h1>A home for Palestinian culture, in every city.</h1>
          <p className="v3-hero-sub">
            Palestine House helps local partners build permanent spaces for
            food, music, art, memory, and community.
          </p>
          <div className="v3-hero-ctas">
            <Button asChild size="lg" className="v3-cta">
              <Link href="/apply">Apply to bring a House</Link>
            </Button>
            <LeadMagnetDialog />
          </div>
          <Link className="v3-hero-quiet" href="/model">
            Explore the model →
          </Link>
        </Reveal>
        <Reveal delay={0.12}>
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
        </Reveal>
      </div>
    </section>
  );
}
