import Image from "next/image";
import { cn } from "@/lib/utils";

/* v3 photography (DR1) — the owner's 2026-07-02 photo set, optimized by
   scripts/optimize-photos.ts into public/assets/photos/. Straight-edged
   cover crops (.v3-photo in v3.css); the legacy Artwork component keeps its
   radial dissolve for the illustration pages and is untouched. */

export const PHOTO_SOURCES = {
  "ph-photo-hero-tatreez": "/assets/photos/ph-photo-hero-tatreez.jpg",
  "ph-photo-arch-cafe": "/assets/photos/ph-photo-arch-cafe.jpg",
  "ph-photo-oud-night": "/assets/photos/ph-photo-oud-night.jpg",
  "ph-photo-tatreez-workshop": "/assets/photos/ph-photo-tatreez-workshop.jpg",
  "ph-photo-supper-club": "/assets/photos/ph-photo-supper-club.jpg",
  "ph-photo-film-screening": "/assets/photos/ph-photo-film-screening.jpg",
  "ph-photo-book-talk": "/assets/photos/ph-photo-book-talk.jpg",
  "ph-photo-market-day": "/assets/photos/ph-photo-market-day.jpg",
  /* DR1-9 — page-hero photos */
  "ph-photo-model": "/assets/photos/ph-photo-model.jpg",
  "ph-photo-experience": "/assets/photos/ph-photo-experience.jpg",
  "ph-photo-bring-house": "/assets/photos/ph-photo-bring-house.jpg",
  "ph-photo-our-support": "/assets/photos/ph-photo-our-support.jpg",
  "ph-photo-apply": "/assets/photos/ph-photo-apply.jpg",
  /* DR2 — "One path, three stages" card photos */
  "ph-photo-stage-plan": "/assets/photos/ph-photo-stage-plan.jpg",
  "ph-photo-stage-build": "/assets/photos/ph-photo-stage-build.jpg",
  "ph-photo-stage-cafe": "/assets/photos/ph-photo-stage-cafe.jpg",
  /* DR3.1 — /model body. §1 "cultural embassy" collage: 4 photos per category
     (café · venue · community) that rotate through big + thumb slots; plus the
     tatreez side-strip, the closing-band invite, and the "what this is" still-life. */
  "ph-photo-embassy-cafe-1": "/assets/photos/ph-photo-embassy-cafe-1.jpg",
  "ph-photo-embassy-cafe-2": "/assets/photos/ph-photo-embassy-cafe-2.jpg",
  "ph-photo-embassy-cafe-3": "/assets/photos/ph-photo-embassy-cafe-3.jpg",
  "ph-photo-embassy-cafe-4": "/assets/photos/ph-photo-embassy-cafe-4.jpg",
  "ph-photo-embassy-venue-1": "/assets/photos/ph-photo-embassy-venue-1.jpg",
  "ph-photo-embassy-venue-2": "/assets/photos/ph-photo-embassy-venue-2.jpg",
  "ph-photo-embassy-venue-3": "/assets/photos/ph-photo-embassy-venue-3.jpg",
  "ph-photo-embassy-venue-4": "/assets/photos/ph-photo-embassy-venue-4.jpg",
  "ph-photo-embassy-community-1": "/assets/photos/ph-photo-embassy-community-1.jpg",
  "ph-photo-embassy-community-2": "/assets/photos/ph-photo-embassy-community-2.jpg",
  "ph-photo-embassy-community-3": "/assets/photos/ph-photo-embassy-community-3.jpg",
  "ph-photo-embassy-community-4": "/assets/photos/ph-photo-embassy-community-4.jpg",
  "ph-photo-embassy-tatreez": "/assets/photos/ph-photo-embassy-tatreez.jpg",
  "ph-photo-model-invite": "/assets/photos/ph-photo-model-invite.jpg",
  "ph-photo-model-still": "/assets/photos/ph-photo-model-still.jpg",
  /* LH1 — /experience body: the §2 day/night pair + the §5 "A home, not a
     moment" permanence split photo. */
  "ph-photo-exp-cafe-day": "/assets/photos/ph-photo-exp-cafe-day.jpg",
  "ph-photo-exp-stage-night": "/assets/photos/ph-photo-exp-stage-night.jpg",
  "ph-photo-exp-home": "/assets/photos/ph-photo-exp-home.jpg",
  /* Bring-a-House redesign — the §7 "Ready to apply" arch photo */
  "ph-photo-ready-apply": "/assets/photos/ph-photo-ready-apply.jpg",
  /* DR3.3 — /our-support body: the split-hero flag photo · the three "Standard"
     arch photos · the three Aswātna column photos · the "you bring" doorway. */
  "ph-photo-support-hero": "/assets/photos/ph-photo-support-hero.jpg",
  "ph-photo-support-standard-1": "/assets/photos/ph-photo-support-standard-1.jpg",
  "ph-photo-support-standard-2": "/assets/photos/ph-photo-support-standard-2.jpg",
  "ph-photo-support-standard-3": "/assets/photos/ph-photo-support-standard-3.jpg",
  "ph-photo-support-aswatna-1": "/assets/photos/ph-photo-support-aswatna-1.jpg",
  "ph-photo-support-aswatna-2": "/assets/photos/ph-photo-support-aswatna-2.jpg",
  "ph-photo-support-aswatna-3": "/assets/photos/ph-photo-support-aswatna-3.jpg",
  "ph-photo-support-responsibility": "/assets/photos/ph-photo-support-responsibility.jpg",
} as const;

export type PhotoId = keyof typeof PHOTO_SOURCES;

/* DR2 — keyed decorative art (transparent palette PNGs from
   scripts/optimize-photos.ts): the sepia Al-Aqsa line-art illustration and
   the four olive-branch ornaments. Purely decorative — consumers render them
   as plain next/image with aria-hidden + empty alt and explicit dimensions. */
export const ART_SOURCES = {
  "ph-art-line-alaqsa": "/assets/art/ph-art-line-alaqsa.png",
  "ph-art-branch-1": "/assets/art/ph-art-branch-1.png",
  "ph-art-branch-2": "/assets/art/ph-art-branch-2.png",
  "ph-art-branch-3": "/assets/art/ph-art-branch-3.png",
  "ph-art-branch-4": "/assets/art/ph-art-branch-4.png",
  /* DR3.1 — gold line-art olive branch for the /model dark bands */
  "ph-art-model-branch": "/assets/art/ph-art-model-branch.png",
  /* Bring-a-House redesign — the §2 "Why bring one" arch illustration
     (cropped from the owner's mockup; carries its own warm-cream ground) */
  "ph-art-why-bring-arch": "/assets/art/ph-art-why-bring-arch.png",
  /* The Palestine House star-logo mark, keyed from the owner's star-logo photo
     to a transparent copper seal — the section-head / wordmark ornament. */
  "ph-art-star-logo": "/assets/art/ph-art-star-logo.png",
} as const;

export type ArtId = keyof typeof ART_SOURCES;

type PhotoProps = {
  assetId: PhotoId;
  alt: string;
  /** Required — responsive hint for next/image (fill mode). */
  sizes: string;
  className?: string;
  rounded?: boolean;
  /** Above-the-fold callers only (LCP) — e.g. the /focus-areas hero (LH1). */
  priority?: boolean;
};

/** Fills its own positioned frame — the parent (or className) sets the
 *  aspect-ratio / dimensions. */
export function Photo({
  assetId,
  alt,
  sizes,
  className,
  rounded,
  priority,
}: PhotoProps) {
  return (
    <div className={cn("v3-photo", rounded && "v3-photo--rounded", className)}>
      <Image
        src={PHOTO_SOURCES[assetId]}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
      />
    </div>
  );
}
