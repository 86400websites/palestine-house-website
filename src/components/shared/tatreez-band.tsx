import { cn } from "@/lib/utils";
import { TatreezDivider } from "@/components/shared/tatreez-divider";

/* A horizontal ornamental tatreez band (DR3.1.1). Reuses the ornate green/gold
   motif that used to run as a vertical side-strip on /model, reworked into a
   full-bleed horizontal band — used as a section divider on /model and at the
   base of the footer CTA (matching the owner's reference).

   `variant="ornate"` (default) paints the derived seamless tile
   (ph-photo-embassy-tatreez-band.jpg, made by scripts/make-tatreez-band.ts) as a
   repeat-x background. `variant="frieze"` falls back to the lighter vector
   TatreezDivider. Purely decorative — aria-hidden; server-safe (no hooks), so the
   server-rendered footer can use it. */
export function TatreezBand({
  variant = "ornate",
  className,
}: {
  variant?: "ornate" | "frieze";
  className?: string;
}) {
  if (variant === "frieze") {
    return (
      <div className={cn("tatreez-band tatreez-band--frieze", className)} aria-hidden="true">
        <TatreezDivider palette="v3" width="100%" opacity={0.7} />
      </div>
    );
  }
  return <div className={cn("tatreez-band", className)} aria-hidden="true" />;
}
