import Link from "next/link";
import Image from "next/image";
import { WORKSPACE_CHROME } from "@/lib/workspace-v2/spec";
import { PwSearchCta, PwAskHqCta, PwFooterAction } from "@/components/workspace-v2/pw-footer-actions";

/* Workspace v2 footer (PP2 2d) — the mockup's closing band, rebuilt.

   Copy is the generated WORKSPACE_CHROME, which is the mockup verbatim plus the
   two owner-approved edits recorded in the generator: the blurb no longer names
   the removed checklist surface, and the Help column's prototype scaffolding
   line is gone.

   A Server Component; only the two CTAs that need a toast are client islands.
   The global search overlay ships in PP4, so the Search CTA honestly toasts
   until then rather than pretending to open something. */

const PAGE_HREF: Record<string, string> = {
  About: "/dashboard",
  Setup: "/setup",
  Operate: "/operate",
  Program: "/program",
  Support: "/support",
};

const LOCKUP_RATIO = 900 / 422;
const LOCKUP_W = 136;

const CHROME = WORKSPACE_CHROME;

export function PwFooter() {
  return (
    <footer className="pw-footer">
      <div className="pw-footer-cta">
        <Image
          className="pw-footer-photo"
          src="/assets/workspace/misc/footer-photo.jpg"
          alt={CHROME.footer.cta.photoAlt}
          width={900}
          height={700}
        />
        <div className="pw-footer-cta-content">
          <h2>{CHROME.footer.cta.heading}</h2>
          <span className="pw-footer-rule" aria-hidden="true" />
          <div className="pw-footer-cta-row">
            <p>{CHROME.footer.cta.lead}</p>
            <div className="pw-footer-buttons">
              <PwSearchCta label={CHROME.footer.cta.searchAction} />
              <PwAskHqCta label={CHROME.footer.cta.askAction} />
            </div>
          </div>
        </div>
        <Image
          className="pw-footer-branch"
          src="/assets/workspace/misc/branch.png"
          alt=""
          aria-hidden="true"
          width={540}
          height={540}
        />
      </div>

      <div className="pw-tatreez-band" aria-hidden="true" />

      <div className="pw-container pw-footer-grid">
        <div className="pw-footer-col pw-footer-brand">
          <Image
            className="pw-footer-brand-logo"
            src="/assets/logo/ph-logo-lockup-dark.png"
            alt=""
            aria-hidden="true"
            width={LOCKUP_W}
            height={Math.round(LOCKUP_W / LOCKUP_RATIO)}
          />
          <span className="pw-sr-only">{CHROME.footer.brand.logoAlt}</span>
          <p>{CHROME.footer.brand.blurb}</p>
          <p className="pw-footer-arabic" lang="ar" dir="rtl">
            {CHROME.footer.brand.arabic}
          </p>
        </div>

        {CHROME.footer.columns.map((column) => (
          <div className="pw-footer-col" key={column.title}>
            <span className="pw-footer-title">{column.title}</span>
            {column.links.map((label) => {
              if (PAGE_HREF[label]) {
                return (
                  <Link key={label} href={PAGE_HREF[label]} className="pw-footer-link">
                    {label}
                  </Link>
                );
              }
              if (label === "Partner Platform") {
                return (
                  <Link key={label} href="/account" className="pw-footer-link">
                    {label}
                  </Link>
                );
              }
              // "Search everything" and "Ask HQ" have no destination until PP4.
              return <PwFooterAction key={label} label={label} />;
            })}
            {column.context.map((line) => (
              <span className="pw-footer-context" key={line}>
                {line}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="pw-footer-bottom">
        <div className="pw-container pw-footer-bottom-inner">
          <span className="pw-footer-tagline">{CHROME.footer.bottom.tagline}</span>
          <span className="pw-footer-copy">{CHROME.footer.bottom.copyright}</span>
        </div>
        <Image
          className="pw-footer-sprig"
          src="/assets/workspace/misc/sprig.png"
          alt=""
          aria-hidden="true"
          width={148}
          height={148}
        />
      </div>
    </footer>
  );
}
