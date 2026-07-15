"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* Public header — identical on every page, never redesigned per page.
   Logo → Home · four plain labels with hover one-liners (the mega-menu
   panels were removed at DR1-8, owner decision 2026-07-02 — the labels link
   directly and explain themselves via the tooltip) · Sign in · Apply. */

/* tipShort = the short sub-label (owner-approved set, 2026-06-12) — used by
   BOTH the mobile menu and, since the owner fix of 2026-07-06 (DR2), the
   desktop hover tooltip: one simple line everywhere (the long
   navigation-copy.md one-liners were retired from the hover). */
const NAV_LINKS = [
  {
    key: "model",
    label: "The Model",
    tipShort: "How it works.",
    href: "/model",
  },
  {
    key: "experience",
    label: "Experience",
    tipShort: "Step inside a House.",
    href: "/experience",
  },
  {
    key: "bring",
    label: "Bring a House",
    tipShort: "What it takes.",
    href: "/bring-ph",
  },
  {
    key: "support",
    label: "Our Support",
    tipShort: "Behind every House.",
    href: "/our-support",
  },
] as const;

/* Routes whose hero pulls under a TRANSPARENT header (v3 photo heroes:
   the Home hero + the PageHero pages, DR1-9). The header solidifies on
   scroll or when the mobile menu opens. (/apply left the list on 2026-07-15
   when its hero became a cream split — like /our-support and /focus-areas,
   the cream-bar header sits above it.) */
const OVERLAY_ROUTES: string[] = [
  "/",
  "/model",
  "/experience",
  "/bring-ph",
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [authed, setAuthed] = React.useState<boolean | null>(null);
  const [scrolled, setScrolled] = React.useState(false);

  /* Transparent-over-photo header (v3): only on OVERLAY_ROUTES, and only
     while at the top with the mobile sheet closed — scrolling or opening it
     solidifies the bar so content never floats on glass. React bails out on
     same-value setState, so no throttle is needed; the cleanup resets the
     flag so stale scroll state never leaks across route changes. */
  const overlayRoute = OVERLAY_ROUTES.includes(pathname);
  React.useEffect(() => {
    if (!overlayRoute) return;
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      setScrolled(false);
    };
  }, [overlayRoute]);
  const overlay = overlayRoute && !scrolled && !mobileOpen;

  /* Reflect auth state in the locked chrome (Sign in ↔ Sign out, and the green
     Apply CTA ↔ My Dashboard) WITHOUT making any page dynamic: a same-origin
     probe (CSP connect-src 'self' allows /api/*, not supabase.co). Re-checked
     on navigation so it updates right after the sign-in / sign-out redirects.
     Defaults to "Sign in" / "Apply" until known, so anonymous visitors (the
     common case) never see a swap. */
  React.useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { authed: false }))
      .then((d: { authed?: boolean }) => {
        if (active) setAuthed(!!d.authed);
      })
      .catch(() => {
        if (active) setAuthed(false);
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  return (
    <header className="phx-header" data-overlay={overlay ? "" : undefined}>
      {/* The overlay state is JS-driven (scroll listener) — without JS the
          transparent header would float unreadably over the page below the
          hero, so no-script clients get the solid warm chrome instead. */}
      {overlayRoute && (
        <noscript>
          <style>{`.phx-header[data-overlay]{background:rgba(250,246,238,.92);border-bottom-color:var(--line-warm);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}.phx-header[data-overlay] .phx-nav-link,.phx-header[data-overlay] .phx-signin{color:var(--char-900)}.phx-header[data-overlay] img.phx-brand-lockup{display:block}.phx-header[data-overlay] img.phx-brand-lockup--dark{display:none}@container page (max-width:420px){.phx-header[data-overlay] img.phx-brand-lockup{display:none}}`}</style>
        </noscript>
      )}
      <div className="ph-container phx-header-inner">
        <BrandLogo href="/" />

        <nav className="phx-nav" aria-label="Main">
          {NAV_LINKS.map((l) => (
            /* Every label shows the same short sub-label the mobile menu uses,
               as a styled tooltip (never a raw title attribute) — one simple
               line on hover, identical wording on every device (owner fix,
               2026-07-06). */
            <Tooltip key={l.key} delayDuration={150}>
              <TooltipTrigger asChild>
                <Link
                  className="phx-nav-link"
                  href={l.href}
                  aria-current={pathname === l.href ? "page" : undefined}
                  aria-describedby={`nav-tip-${l.key}`}
                >
                  {l.label}
                  {/* Sub-label for assistive tech — aria-describedby has broad
                      screen-reader support (aria-description alone does not). */}
                  <span id={`nav-tip-${l.key}`} className="sr-only">
                    {l.tipShort}
                  </span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-64 text-sm">
                {l.tipShort}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>

        <div className="phx-actions">
          {authed ? (
            <form action={signOutAction} className="phx-signout-form">
              <button type="submit" className="phx-signin phx-signout">
                Sign out
              </button>
            </form>
          ) : (
            <Link className="phx-signin" href="/login">
              Sign in
            </Link>
          )}
          {/* Once signed in (any state), the conversion CTA becomes the way
              back into the platform — a pending partner reaches /dashboard to
              see status, an approved one to work. Logged-out keeps Apply.
              Defaults to Apply until the probe resolves (anonymous = common). */}
          <Button asChild size="sm">
            <Link
              href={authed ? "/dashboard" : "/apply"}
              aria-label={authed ? "Go to your dashboard" : "Apply to bring a House"}
            >
              {authed ? "My Dashboard" : "Apply"}
            </Link>
          </Button>

          {/* Mobile menu — shadcn Sheet; each label carries its one-liner */}
          <span className="phx-menu-btn">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu">
                  <Menu aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="top"
                className="gap-0 px-6 pb-6"
                showCloseButton={false}
              >
                {/* The built-in close is a 16px hit area — this one meets the
                    44px tap target (DR1-10; ui/sheet.tsx stays untouched). */}
                <SheetClose className="phx-sheet-close" aria-label="Close menu">
                  <X aria-hidden="true" />
                </SheetClose>
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <nav aria-label="Main, mobile" className="pt-10">
                  <div className="phx-mobile-links">
                    {NAV_LINKS.map((l) => (
                      <Link
                        key={l.key}
                        className="phx-mobile-link"
                        href={l.href}
                        onClick={() => setMobileOpen(false)}
                      >
                        <span className="phx-mobile-label">{l.label}</span>
                        <span className="phx-mobile-sub">{l.tipShort}</span>
                      </Link>
                    ))}
                    {authed ? (
                      <form
                        action={signOutAction}
                        className="phx-signout-form"
                      >
                        <button
                          type="submit"
                          className="phx-mobile-link phx-signout"
                          onClick={() => setMobileOpen(false)}
                        >
                          <span className="phx-mobile-label">Sign out</span>
                        </button>
                      </form>
                    ) : (
                      <Link
                        className="phx-mobile-link"
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                      >
                        <span className="phx-mobile-label">Sign in</span>
                      </Link>
                    )}
                  </div>
                  <div className="pt-4">
                    <Button asChild className="w-full">
                      <Link
                        href={authed ? "/dashboard" : "/apply"}
                        onClick={() => setMobileOpen(false)}
                      >
                        {authed ? "My Dashboard" : "Apply to bring a House"}
                      </Link>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </span>
        </div>
      </div>

    </header>
  );
}
