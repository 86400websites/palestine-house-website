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
} as const;

export type ArtId = keyof typeof ART_SOURCES;

type PhotoProps = {
  assetId: PhotoId;
  alt: string;
  /** Required — responsive hint for next/image (fill mode). */
  sizes: string;
  className?: string;
  rounded?: boolean;
};

/** Fills its own positioned frame — the parent (or className) sets the
 *  aspect-ratio / dimensions. (All current uses are below the fold — add a
 *  priority prop only when an above-the-fold caller actually needs it.) */
export function Photo({ assetId, alt, sizes, className, rounded }: PhotoProps) {
  return (
    <div className={cn("v3-photo", rounded && "v3-photo--rounded", className)}>
      <Image src={PHOTO_SOURCES[assetId]} alt={alt} fill sizes={sizes} />
    </div>
  );
}
