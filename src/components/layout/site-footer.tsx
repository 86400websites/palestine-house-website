import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";

/* Locked public footer (docs/page-designs/shared/site-chrome.jsx; copy
   verbatim from docs/page-copy/00-global/footer-copy.md). Identical on
   every page — never redesigned per page. */
export function SiteFooter() {
  return (
    <footer className="phx-footer">
      <div className="phx-footer-apply">
        <div className="ph-container phx-footer-apply-inner">
          <div>
            <h2>Ready to open a House in your city?</h2>
            <p>Every application is reviewed by HQ.</p>
          </div>
          {/* Same uppercase grammar as the photo-hero CTAs (DR1-10) — the
              in-flow body CTAs keep sentence case + arrow. */}
          <Button asChild size="lg" className="v3-cta">
            <Link href="/apply">Apply to bring a House</Link>
          </Button>
        </div>
      </div>

      <div className="ph-container phx-footer-grid">
        <div className="phx-footer-col phx-footer-brand">
          <BrandLogo height={30} />
          <p>A fixed address for Palestinian culture, in every city.</p>
        </div>
        <div className="phx-footer-col">
          <span className="phx-footer-col-title">Explore</span>
          <Link href="/model">The Model</Link>
          <Link href="/experience">Experience</Link>
          <Link href="/live">Live Programming</Link>
        </div>
        <div className="phx-footer-col">
          <span className="phx-footer-col-title">Bring a House</span>
          <Link href="/bring-ph">Why bring one</Link>
          <Link href="/our-support">Our support</Link>
        </div>
        <div className="phx-footer-col">
          <span className="phx-footer-col-title">Account</span>
          <Link href="/login">Sign in</Link>
        </div>
        <div className="phx-footer-col">
          <span className="phx-footer-col-title">Legal</span>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>

      <div className="phx-footer-bottom">
        <div className="ph-container phx-footer-bottom-inner">
          <span className="phx-footer-tagline">
            Passion inspires. Discipline delivers.
          </span>
          <span className="phx-footer-copyright">© Palestine House.</span>
        </div>
      </div>
    </footer>
  );
}
