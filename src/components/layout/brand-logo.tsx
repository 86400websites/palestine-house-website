import Link from "next/link";
import Image from "next/image";

/* v3 public-chrome brand lockup — two renderings of the owner's logo, switched
   purely by chrome state in v3.css (DR2.1-2, owner decision 2026-07-06):
   - Light chrome (solid warm header): the full lockup PNG exactly as supplied
     (copper arch + "PALESTINE HOUSE" + "OUR CULTURE EMBASSY" + ™).
   - Dark chrome (charcoal/moss footer + the [data-overlay] photo header): the
     PNG's charcoal text would disappear there, so the same lockup renders as
     the arch mark PNG + REAL TEXT (wordmark + tagline) that recolors to cream
     through .phx-brand-word / .phx-brand-tagline and stays crisp at any DPI.
   Both variants are always in the DOM; .phx-brand-lockup / .phx-brand-text
   pick one per surface (plus the header's noscript fallback and the ≤420px
   mark-only rule — DR1-10). The ™ lives only in the PNG, not the text variant.
   Public shell only — the gated workspace/admin shells keep layout/logo.tsx. */

const MARK_RATIO = 289 / 303; // ph-logo-mark.png intrinsic aspect
const LOCKUP_RATIO = 900 / 422; // ph-logo-lockup.png intrinsic aspect

type BrandLogoProps = {
  href?: string;
  /** Mark height in px (text variant); the wordmark scales through CSS. */
  height?: number;
  /** Lockup height in px (light-chrome variant). */
  lockupHeight?: number;
  /** Only the header instance is above the fold — the footer one must not
   *  issue an eager high-priority fetch that competes with hero LCP. */
  priority?: boolean;
};

export function BrandLogo({
  href,
  height = 34,
  lockupHeight = 54,
  priority,
}: BrandLogoProps) {
  const content = (
    <>
      <Image
        src="/assets/logo/ph-logo-lockup.png"
        alt=""
        aria-hidden="true"
        className="phx-brand-lockup"
        width={Math.round(lockupHeight * LOCKUP_RATIO)}
        height={lockupHeight}
        priority={priority}
      />
      <span className="phx-brand-text">
        <Image
          src="/assets/logo/ph-logo-mark.png"
          alt=""
          aria-hidden="true"
          width={Math.round(height * MARK_RATIO)}
          height={height}
          priority={priority}
        />
        <span className="phx-brand-col">
          <span className="phx-brand-word">Palestine House</span>
          <span className="phx-brand-tagline">Our Culture Embassy</span>
        </span>
      </span>
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
