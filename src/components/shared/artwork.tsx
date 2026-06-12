import Image from "next/image";
import { cn } from "@/lib/utils";

type ArtworkProps = {
  /** Asset ID, e.g. "PH-HOME-01" — file at /public/assets/art/<id>.png */
  assetId: string;
  alt: string;
  /** Fixed height in px (block thumbnails); otherwise size via className. */
  height?: number;
  /** CSS aspect-ratio, e.g. "16 / 9" — the mockups size art by ratio. */
  ratio?: string;
  /** Tighter mask for small block-print thumbnails. */
  block?: boolean;
  rounded?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/* Original artwork in the house frame: dissolves to the page at the edges,
   never a hard box (design-system/base.css `.ph-art`). */
export function Artwork({
  assetId,
  alt,
  height,
  ratio,
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
        src={`/assets/art/${assetId}.png`}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}
