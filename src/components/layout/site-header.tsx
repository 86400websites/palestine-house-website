"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/auth/actions";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* Locked public header (docs/page-designs/shared/site-chrome.jsx) — identical
   on every page, never redesigned per page. Logo → Home · four labels (hover
   one-liners from navigation-copy.md; mega-menus on The Model + Experience,
   approved via mockup — PROJECT-STATUS §4) · Sign in · green Apply. */

/* tip = desktop hover one-liner (navigation-copy.md, verbatim);
   tipShort = mobile menu sub-label (owner-approved short set, 2026-06-12). */
const NAV_LINKS = [
  {
    key: "model",
    label: "The Model",
    tip: "Who the players are, and how it works.",
    tipShort: "How it works.",
    href: "/model",
  },
  {
    key: "experience",
    label: "Experience",
    tip: "Step inside a House — the feeling, the programs, the people.",
    tipShort: "Step inside a House.",
    href: "/experience",
  },
  {
    key: "bring",
    label: "Bring a House",
    tip: "Why bring Palestine House to your city, and what it takes.",
    tipShort: "What it takes.",
    href: "/bring-ph",
  },
  {
    key: "support",
    label: "Our Support",
    tip: "What HQ gives every partner, behind every House.",
    tipShort: "Behind every House.",
    href: "/our-support",
  },
] as const;

type NavKey = (typeof NAV_LINKS)[number]["key"];

/* Routes whose hero pulls under a TRANSPARENT header (v3 photo heroes).
   The header solidifies on scroll or whenever a menu opens. */
const OVERLAY_ROUTES: string[] = ["/"];

/* Mega-menu content — verbatim from the approved mockup chrome. */
const MEGA_MENUS: Partial<
  Record<
    NavKey,
    {
      cols: {
        head: string;
        items: { label: string; sub: string; href: string }[];
      }[];
    }
  >
> = {
  model: {
    cols: [
      {
        head: "Who’s who",
        items: [
          { label: "Partners", sub: "The people who open a House", href: "/model" },
          { label: "HQ", sub: "The team behind every House", href: "/model" },
          { label: "The network", sub: "One House in every city", href: "/model" },
        ],
      },
      {
        head: "How it works",
        items: [
          { label: "Plan & Prepare", sub: "Learn before you build", href: "/bring-ph#what-it-takes" },
          { label: "Design & Build", sub: "The 120-day launch", href: "/bring-ph#what-it-takes" },
          { label: "Operate & Program", sub: "Open, and keep it alive", href: "/bring-ph#what-it-takes" },
        ],
      },
    ],
  },
  experience: {
    cols: [
      {
        head: "The rooms",
        items: [
          { label: "The café", sub: "Coffee, plates, all-day welcome", href: "/experience" },
          { label: "The stage", sub: "Music, readings, film", href: "/experience" },
          { label: "The workspace", sub: "A quiet place to belong", href: "/experience" },
        ],
      },
      {
        head: "More to find",
        items: [
          { label: "The workshops", sub: "Heritage as living practice", href: "/experience#programming" },
          { label: "The community", sub: "A city’s fixed address", href: "/experience#programming" },
          { label: "Live programming", sub: "What’s on across the network", href: "/live" },
        ],
      },
    ],
  },
};

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState<NavKey | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [authed, setAuthed] = React.useState<boolean | null>(null);
  const [scrolled, setScrolled] = React.useState(false);
  const panel = open ? MEGA_MENUS[open] : undefined;

  /* Transparent-over-photo header (v3): only on OVERLAY_ROUTES, and only
     while at the top with every menu closed — scrolling or opening the mega
     panel / mobile sheet solidifies it so content never floats on glass. */
  const overlayRoute = OVERLAY_ROUTES.includes(pathname);
  React.useEffect(() => {
    if (!overlayRoute) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > 32);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [overlayRoute]);
  const overlay = overlayRoute && !scrolled && !open && !mobileOpen;

  /* Close the mega panel on Escape (keyboard parity with mouseleave). */
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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
    <header
      className="phx-header"
      data-overlay={overlay ? "" : undefined}
      onMouseLeave={() => setOpen(null)}
    >
      <div className="ph-container phx-header-inner">
        <BrandLogo href="/" />

        <nav className="phx-nav" aria-label="Main">
          {NAV_LINKS.map((l) => {
            const hasMenu = !!MEGA_MENUS[l.key];
            const isOpen = open === l.key;
            const isActive = pathname === l.href;
            const link = (
              <Link
                key={l.key}
                className={cn("phx-nav-link", isOpen && "is-open")}
                href={l.href}
                aria-current={isActive ? "page" : undefined}
                aria-expanded={hasMenu ? isOpen : undefined}
                aria-describedby={`nav-tip-${l.key}`}
                onMouseEnter={() => setOpen(hasMenu ? l.key : null)}
                onFocus={() => setOpen(hasMenu ? l.key : null)}
              >
                {l.label}
                {hasMenu && (
                  <span className="phx-nav-chev">
                    <ChevronDown size={15} aria-hidden="true" />
                  </span>
                )}
                {/* One-liner for assistive tech — aria-describedby has broad
                    screen-reader support (aria-description alone does not). */}
                <span id={`nav-tip-${l.key}`} className="sr-only">
                  {l.tip}
                </span>
              </Link>
            );
            /* Labels without a mega panel show their one-liner as a styled
               tooltip (never a raw title attribute); mega labels explain
               themselves through the open panel. */
            if (hasMenu) return link;
            return (
              <Tooltip key={l.key} delayDuration={150}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-64 text-sm">
                  {l.tip}
                </TooltipContent>
              </Tooltip>
            );
          })}
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
              <SheetContent side="top" className="gap-0 px-6 pb-6">
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

      {/* Mega-menu panel */}
      {panel && (
        <div className="phx-mega">
          <div className="ph-container phx-mega-inner">
            {panel.cols.map((col) => (
              <div key={col.head} className="phx-mega-col">
                <span className="phx-mega-head">{col.head}</span>
                <div className="phx-mega-links">
                  {col.items.map((it) => (
                    <Link
                      key={it.label}
                      className="phx-mega-link"
                      href={it.href}
                      onClick={() => setOpen(null)}
                    >
                      <span className="phx-mega-link-label">{it.label}</span>
                      <span className="phx-mega-link-sub">{it.sub}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
