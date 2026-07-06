import Link from "next/link";
import Image from "next/image";

/* v3 public-chrome brand lockup — the owner's actual logo PNGs on every
   surface, switched purely by chrome state in v3.css (DR2.1-2 + owner fix
   2026-07-06: "use the actual logo instead of texts"):
   - Light chrome (solid warm header): the color lockup (charcoal wordmark).
   - Dark chrome (moss footer + the [data-overlay] photo header): the
     white-text lockup (copper arch kept), derived pixel-registered from the
     same master — see scripts/optimize-photos.ts.
   - ≤420px: both header states fall back to the copper arch mark alone —
     the full lockup + Apply + hamburger don't fit (DR1-10).
   All images are decorative (aria-hidden): the header link names itself via
   aria-label; the linkless footer instance renders an sr-only brand line.
   Public shell only — the gated workspace/admin shells keep layout/logo.tsx.

   No `priority`: all three render lazily (next/image default). Only one is
   ever display:block per surface, and a display:none lazy <img> is never
   fetched until it's shown — so the two hidden variants don't download on
   load and none of them issue a high-priority preload that would race the
   hero photo's LCP (DR2.1-6 exit-gate review). The visible variant is in the
   top viewport, so its lazy fetch still fires immediately. */

const MARK_RATIO = 289 / 303; // ph-logo-mark.png intrinsic aspect
const LOCKUP_RATIO = 900 / 422; // ph-logo-lockup(-dark).png intrinsic aspect

type BrandLogoProps = {
  href?: string;
  /** Arch-mark height in px (the ≤420px fallback). */
  height?: number;
  /** Lockup height in px (both PNG variants). */
  lockupHeight?: number;
};

export function BrandLogo({ href, height = 34, lockupHeight = 54 }: BrandLogoProps) {
  const lockupWidth = Math.round(lockupHeight * LOCKUP_RATIO);
  const content = (
    <>
      <Image
        src="/assets/logo/ph-logo-lockup.png"
        alt=""
        aria-hidden="true"
        className="phx-brand-lockup"
        width={lockupWidth}
        height={lockupHeight}
      />
      <Image
        src="/assets/logo/ph-logo-lockup-dark.png"
        alt=""
        aria-hidden="true"
        className="phx-brand-lockup phx-brand-lockup--dark"
        width={lockupWidth}
        height={lockupHeight}
      />
      <Image
        src="/assets/logo/ph-logo-mark.png"
        alt=""
        aria-hidden="true"
        className="phx-brand-mark"
        width={Math.round(height * MARK_RATIO)}
        height={height}
      />
      {!href && <span className="sr-only">Palestine House — Our Culture Embassy</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="phx-brand" aria-label="Palestine House — Home">
        {content}
      </Link>
    );
  }
  return <span className="phx-brand">{content}</span>;
}
