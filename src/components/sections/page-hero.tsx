import Image from "next/image";
import type { ReactNode } from "react";
import { Stagger } from "@/components/motion/reveal";
import { PHOTO_SOURCES, type PhotoId } from "@/components/shared/photo";

/* v3 photo page-hero (DR1-9, owner direction 2026-07-03) — the Home hero's
   full-bleed photo treatment for the inner public pages, in a shorter band:
   photo under the transparent header (the route must be in OVERLAY_ROUTES,
   site-header.tsx), the shared charcoal scrim, staggered copy. Page copy
   stays verbatim — this only re-frames it. `position` sets object-position
   per photo so faces stay in frame on shallow crops. */

type PageHeroProps = {
  photo: PhotoId;
  alt: string;
  position?: string;
  eyebrow: string;
  title: string;
  lead: string;
  /** CTA row (Buttons/links), rendered in the shared .v3-hero-ctas grammar. */
  children?: ReactNode;
  support?: string;
};

export function PageHero({
  photo,
  alt,
  position = "50% 50%",
  eyebrow,
  title,
  lead,
  children,
  support,
}: PageHeroProps) {
  return (
    <section className="v3-page-hero">
      <Image
        src={PHOTO_SOURCES[photo]}
        alt={alt}
        fill
        priority
        quality={74}
        sizes="100vw"
        className="v3-page-hero-img"
        style={{ objectPosition: position }}
      />
      <div className="v3-hero-scrim" aria-hidden="true" />
      <div className="ph-container v3-page-hero-inner">
        <Stagger className="v3-hero-copy v3-page-hero-copy">
          <p className="ph-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="v3-hero-sub">{lead}</p>
          {children ? <div className="v3-hero-ctas">{children}</div> : null}
          {support ? <p className="v3-page-hero-support">{support}</p> : null}
        </Stagger>
      </div>
    </section>
  );
}
