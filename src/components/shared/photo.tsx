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
} as const;

export type PhotoId = keyof typeof PHOTO_SOURCES;

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
