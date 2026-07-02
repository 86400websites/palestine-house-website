import Link from "next/link";
import Image from "next/image";

/* v3 public-chrome brand lockup (DR1, owner logo 2026-07-02): the copper arch
   mark (public/assets/logo/ph-logo-mark.png) + the wordmark as REAL TEXT.
   The source PNG's charcoal wordmark disappears on dark/photo surfaces and
   softens on retina — HTML text stays crisp at any DPI and recolors with the
   chrome state through .phx-brand-word (v3.css). The "Our Culture Embassy"
   tagline lives in the owner's logo master + the OG image, not the chrome.
   Public shell only — the gated workspace/admin shells keep layout/logo.tsx. */

const MARK_RATIO = 289 / 303; // ph-logo-mark.png intrinsic aspect

type BrandLogoProps = {
  href?: string;
  /** Mark height in px; the wordmark scales through .phx-brand-word. */
  height?: number;
  /** Only the header instance is above the fold — the footer one must not
   *  issue an eager high-priority fetch that competes with hero LCP. */
  priority?: boolean;
};

export function BrandLogo({ href, height = 34, priority }: BrandLogoProps) {
  const content = (
    <>
      <Image
        src="/assets/logo/ph-logo-mark.png"
        alt=""
        aria-hidden="true"
        width={Math.round(height * MARK_RATIO)}
        height={height}
        priority={priority}
      />
      <span className="phx-brand-word">Palestine House</span>
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
