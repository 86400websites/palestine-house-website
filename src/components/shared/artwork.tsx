import Image from "next/image";
import { cn } from "@/lib/utils";

type ArtworkProps = {
  /** Asset ID, e.g. "PH-HOME-01" — file at /public/assets/art/<id>.(jpg|png). */
  assetId: ArtworkAssetId;
  alt: string;
  /** Fixed height in px (block thumbnails); otherwise size via className. */
  height?: number;
  /** CSS aspect-ratio, e.g. "16 / 9" — the mockups size art by ratio. */
  ratio?: string;
  /** Use contain only where cropping would harm a composed/diagram image. */
  fit?: "cover" | "contain";
  objectPosition?: string;
  /** Tighter mask for small block-print thumbnails. */
  block?: boolean;
  rounded?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

const ARTWORK_SOURCES = {
  "PH-ABOUT-01": "/assets/art/PH-ABOUT-01.jpg",
  "PH-APPLY-01": "/assets/art/PH-APPLY-01.png",
  "PH-BRING-01": "/assets/art/PH-BRING-01.png",
  "PH-BRING-02": "/assets/art/PH-BRING-02.jpg",
  "PH-EXP-01": "/assets/art/PH-EXP-01.png",
  "PH-EXP-02a": "/assets/art/PH-EXP-02a.jpg",
  "PH-EXP-02b": "/assets/art/PH-EXP-02b.jpg",
  "PH-EXP-03a": "/assets/art/PH-EXP-03a.jpg",
  "PH-EXP-03b": "/assets/art/PH-EXP-03b.jpg",
  "PH-EXP-03c": "/assets/art/PH-EXP-03c.jpg",
  "PH-EXP-03d": "/assets/art/PH-EXP-03d.jpg",
  "PH-EXP-03e": "/assets/art/PH-EXP-03e.jpg",
  "PH-FOOD-01": "/assets/art/PH-FOOD-01.jpg",
  "PH-FOOD-02": "/assets/art/PH-FOOD-02.png",
  /* PH-HIW-01..03 retired with the bring-ph triptych (DR2.1-4) — the stages
     render Home's shared StageCards photo cards now. */
  "PH-HOME-01": "/assets/art/PH-HOME-01.png",
  "PH-LIVE-01": "/assets/art/PH-LIVE-01.png",
  "PH-LIVE-02": "/assets/art/PH-LIVE-02.png",
  "PH-MODEL-01": "/assets/art/PH-MODEL-01.png",
  "PH-MODEL-02": "/assets/art/PH-MODEL-02.png",
  "PH-SIGNUP-01": "/assets/art/PH-SIGNUP-01.jpg",
  "PH-SUPPORT-01": "/assets/art/PH-SUPPORT-01.png",
} as const;

export type ArtworkAssetId = keyof typeof ARTWORK_SOURCES;

export function getArtworkSrc(assetId: ArtworkAssetId) {
  return ARTWORK_SOURCES[assetId];
}

/* Original artwork in the house frame: dissolves to the page at the edges,
   never a hard box (design-system/base.css `.ph-art`). */
export function Artwork({
  assetId,
  alt,
  height,
  ratio,
  fit = "cover",
  objectPosition,
  block = false,
  rounded = false,
  sizes = "(max-width: 920px) 100vw, 33vw",
  priority = false,
  className,
}: ArtworkProps) {
  return (
    <div
      className={cn("ph-art ph-art--photo", block && "ph-art--block", className)}
      aria-hidden={alt === "" ? true : undefined}
      style={{
        ...(height ? { height } : undefined),
        ...(ratio ? { aspectRatio: ratio, width: "100%" } : undefined),
        ...(rounded ? { borderRadius: "var(--radius-md)" } : undefined),
      }}
    >
      <Image
        src={getArtworkSrc(assetId)}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        style={{ objectFit: fit, objectPosition }}
      />
    </div>
  );
}
