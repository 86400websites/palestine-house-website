import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ART_SOURCES, Photo } from "@/components/shared/photo";
import { TatreezBand } from "@/components/shared/tatreez-band";
import { Button } from "@/components/ui/button";

/* Locked public footer — v3 refresh (DR2-5: owner footer mockup + the
   owner-approved copy table, 2026-07-06): moss inset card, Arabic brand
   line, updated column labels, centered tagline + olive sprig. Identical
   on every page — never redesigned per page. */
export function SiteFooter() {
  return (
    <footer className="phx-footer">
      {/* Closing CTA — the rich invite band, identical on every public page
          (DR3.1: promoted from the /model design so there is one premium
          call-to-action site-wide instead of a plain strip). */}
      <div className="phx-footer-apply">
        <div className="phx-footer-cta">
          <Photo
            assetId="ph-photo-model-invite"
            alt="Guests gathered at the lantern-lit, ivy-framed doorway of a Palestine House in the evening."
            sizes="(max-width: 880px) 100vw, 40vw"
            className="phx-footer-cta-photo"
          />
          <div className="phx-footer-cta-content">
            <h2>Ready to bring Palestine House to your city?</h2>
            <span className="phx-footer-cta-rule" aria-hidden="true" />
            <div className="phx-footer-cta-row">
              <p className="phx-footer-cta-lead">
                Explore the model, understand what it takes, and apply when
                you’re ready to build a permanent home for Palestinian culture
                in your community.
              </p>
              <div className="phx-footer-cta-buttons">
                <Button asChild size="lg" className="v3-cta phx-footer-cta-apply">
                  <Link href="/apply">
                    Apply to bring a House
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="v3-cta phx-footer-cta-support"
                >
                  <Link href="/our-support">
                    See our support
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative branch */}
          <img
            className="phx-footer-cta-branch"
            src={ART_SOURCES["ph-art-model-branch"]}
            alt=""
            aria-hidden="true"
          />
        </div>
        {/* horizontal tatreez band anchoring the base of the CTA (DR3.1.1) */}
        <TatreezBand />
      </div>

      <div className="ph-container phx-footer-grid">
        <div className="phx-footer-col phx-footer-brand">
          {/* DR2.1-2: the white-text lockup PNG — taller than the old 30px
              mark+word row because the lockup stacks arch/word/tagline. */}
          <BrandLogo height={30} lockupHeight={64} />
          <p>A fixed address for Palestinian culture, in every city.</p>
          <p className="phx-footer-arabic" lang="ar" dir="rtl">
            بيت فلسطين في كل مدينة
          </p>
        </div>
        <div className="phx-footer-col">
          <span className="phx-footer-col-title">Explore</span>
          <Link href="/model">The Model</Link>
          <Link href="/experience">Experience</Link>
          {/* The Live Programming link retired in LH1 (owner-authorized chrome
              edit): /live is members-only now — a public link would promise
              content the public can never see. */}
        </div>
        <div className="phx-footer-col">
          <span className="phx-footer-col-title">Bring a House</span>
          <Link href="/our-support">Our Support</Link>
          <Link href="/bring-ph">Why bring one.</Link>
        </div>
        <div className="phx-footer-col">
          <span className="phx-footer-col-title">Account</span>
          <Link href="/login">Sign In</Link>
        </div>
        <div className="phx-footer-col">
          <span className="phx-footer-col-title">Legal</span>
          <Link href="/terms">Terms of Use</Link>
          <Link href="/privacy">Privacy Policy</Link>
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
        <Image
          src={ART_SOURCES["ph-art-branch-2"]}
          alt=""
          aria-hidden="true"
          width={1106}
          height={1131}
          sizes="72px"
          className="phx-footer-sprig"
        />
      </div>
    </footer>
  );
}
