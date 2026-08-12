"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { WORKSPACE_CHROME } from "@/lib/workspace-v2/spec";

/* Workspace v2 header (PP2 2c) — the owner's final mockup, rebuilt.

   Copy comes from the generated WORKSPACE_CHROME (extracted verbatim from the
   mockup, never hand-typed). Behaviour matches the prototype: transparent over
   the hero photo, solid once scrolled past 28px or while the mobile panel is
   open; five nav links with hover/focus tooltips; a mobile panel below 1080px.

   The brand lockup reuses the canonical public PNGs in public/assets/logo/
   (the mockup's own logo_dark is deliberately not extracted) — the white-text
   lockup over the photo, the colour one on the solid header, mirroring the
   mockup's brand-logo--overlay / --solid pair.

   The account button is a real link to /account (the mockup could only toast).
   Its label is the mockup's own "Partner Platform" wording, kept verbatim. */

const LOCKUP_RATIO = 900 / 422;
const LOCKUP_H = 46;
const LOCKUP_W = Math.round(LOCKUP_H * LOCKUP_RATIO);

const NAV_HREF: Record<string, string> = {
  about: "/dashboard",
  setup: "/setup",
  operate: "/operate",
  program: "/program",
  support: "/support",
};

export function PwHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on route change so a nav tap never leaves the panel hanging open.
  React.useEffect(() => setMenuOpen(false), [pathname]);

  // While the panel is open: lock body scroll, close on Escape, and keep focus
  // inside the panel (the mockup's own trap, rebuilt).
  React.useEffect(() => {
    if (!menuOpen) return;
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const firstLink = panelRef.current?.querySelector<HTMLElement>("a[href]");
    const focusTimer = window.setTimeout(() => firstLink?.focus(), 20);

    return () => {
      body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const solid = scrolled || menuOpen;

  return (
    <>
      <header className={`pw-header${solid ? " is-solid" : ""}`} id="pw-header">
        <div className="pw-container pw-header-inner">
          <Link
            href={WORKSPACE_CHROME.brand.href}
            className="pw-brand"
            aria-label={WORKSPACE_CHROME.brand.ariaLabel}
          >
            <Image
              src="/assets/logo/ph-logo-lockup-dark.png"
              alt=""
              aria-hidden="true"
              className="pw-brand-logo pw-brand-logo--overlay"
              width={LOCKUP_W}
              height={LOCKUP_H}
            />
            <Image
              src="/assets/logo/ph-logo-lockup.png"
              alt=""
              aria-hidden="true"
              className="pw-brand-logo pw-brand-logo--solid"
              width={LOCKUP_W}
              height={LOCKUP_H}
            />
            <span className="pw-sr-only">{WORKSPACE_CHROME.brand.logoAlt}</span>
          </Link>

          <nav className="pw-nav" aria-label={WORKSPACE_CHROME.nav.ariaLabel}>
            {WORKSPACE_CHROME.nav.items.map((item) => {
              const href = NAV_HREF[item.page];
              return (
                <span className="pw-nav-wrap" key={item.page}>
                  <Link
                    href={href}
                    className={`pw-nav-link${isActive(href) ? " is-active" : ""}`}
                    aria-current={isActive(href) ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                  <span className="pw-nav-tip" role="tooltip">
                    {item.tip}
                  </span>
                </span>
              );
            })}
          </nav>

          <div className="pw-header-actions">
            <Link
              href="/account"
              className="pw-header-action pw-header-action--account"
              aria-label={WORKSPACE_CHROME.account.ariaLabel}
            >
              {WORKSPACE_CHROME.account.label}
            </Link>
            <button
              ref={menuButtonRef}
              className="pw-header-action pw-header-action--icon pw-menu-button"
              type="button"
              aria-label={menuOpen ? "Close menu" : WORKSPACE_CHROME.menuButton.ariaLabel}
              aria-expanded={menuOpen}
              aria-controls="pw-mobile-panel"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <X className="pw-icon" aria-hidden="true" />
              ) : (
                <Menu className="pw-icon" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`pw-mobile-backdrop${menuOpen ? " is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <div
        className={`pw-mobile-panel${menuOpen ? " is-open" : ""}`}
        id="pw-mobile-panel"
        ref={panelRef}
        aria-hidden={!menuOpen}
        {...(menuOpen ? {} : { inert: "" as unknown as boolean })}
      >
        <nav aria-label={WORKSPACE_CHROME.nav.mobileAriaLabel}>
          {WORKSPACE_CHROME.nav.items.map((item) => {
            const href = NAV_HREF[item.page];
            return (
              <Link
                key={item.page}
                href={href}
                className={`pw-mobile-nav-link${isActive(href) ? " is-active" : ""}`}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <span className="pw-mobile-nav-copy">
                  <strong>{item.label}</strong>
                  <small>{item.tip}</small>
                </span>
                <ArrowRight className="pw-icon" aria-hidden="true" />
              </Link>
            );
          })}
        </nav>
        <Link href="/account" className="pw-mobile-panel-account">
          <span>{WORKSPACE_CHROME.account.label}</span>
          <ArrowRight className="pw-icon" aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}
