"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type LucideIcon,
  ArrowRight,
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Info,
  Lock,
  Menu,
  Play,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { signOutAction } from "@/lib/auth/actions";

/* Gated workspace shell (docs/page-designs/shared/workspace-chrome.jsx) —
   one sidebar + top bar reused on every gated page. Pre-approval, everything
   except the always-on items is Locked. The 30 topics never sit in the sidebar.

   S4 reality: only /dashboard (and the public /live) are built. The remaining
   destinations land in S6, so they render INERT here (present, muted, not
   clickable) rather than as dead 404 links. The workspace search targets the
   V1 /search route, so it is omitted until that ships. */

type SidebarItem = {
  key: string;
  label: string;
  Icon: LucideIcon;
  /** Set only when the route exists in S4. */
  href?: string;
  /** Opens the public site. */
  external?: boolean;
  /** Reachable before approval. */
  always?: boolean;
  /** A second nav entry pointing at a route another item owns — it links, but
   *  never claims the active state ("Operate & Program" -> /operate, which
   *  "Managing & Operating" owns per the mockup). */
  alias?: boolean;
};

type SidebarGroup = { label?: string; items: SidebarItem[] };

const GROUPS: SidebarGroup[] = [
  {
    items: [
      { key: "dashboard", label: "Welcome", Icon: User, href: "/dashboard", always: true },
    ],
  },
  {
    label: "Stages",
    items: [
      { key: "plan", label: "Plan & Prepare", Icon: Bookmark, href: "/plan" },
      { key: "build", label: "Design & Build", Icon: CheckCircle2, href: "/build" },
      { key: "operate", label: "Operate & Program", Icon: Clock, href: "/operate", alias: true },
    ],
  },
  {
    label: "Your House",
    items: [
      { key: "managing", label: "Managing & Operating", Icon: Menu, href: "/operate" },
      { key: "live", label: "Live Programming", Icon: Calendar, href: "/live", external: true, always: true },
    ],
  },
  {
    label: "Library",
    items: [
      { key: "academy", label: "Academy", Icon: Play, href: "/academy" },
      { key: "resources", label: "Resources", Icon: Download, href: "/resources" },
      { key: "tools", label: "House Applications", Icon: SlidersHorizontal, href: "/tools" },
    ],
  },
  {
    label: "You",
    items: [
      { key: "account", label: "Account", Icon: User, href: "/account", always: true },
    ],
  },
];

function SidebarLink({
  item,
  approved,
  pathname,
}: {
  item: SidebarItem;
  approved: boolean;
  pathname: string;
}) {
  const { Icon } = item;
  const locked = !approved && !item.always;

  // Pre-approval: locked (per the design).
  if (locked) {
    return (
      <span
        className="ws-item is-locked"
        aria-disabled={true}
        title="Locked until your application is approved"
      >
        <span className="ws-item-icon">
          <Lock size={17} />
        </span>
        <span className="ws-item-label">{item.label}</span>
        <span className="ws-item-locktext">Locked</span>
      </span>
    );
  }

  // Built route → real link.
  if (item.href) {
    const isActive = !item.alias && pathname === item.href;
    return (
      <Link
        className={`ws-item${isActive ? " is-active" : ""}`}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="ws-item-icon">
          <Icon size={17} />
        </span>
        <span className="ws-item-label">{item.label}</span>
        {item.external && (
          <span className="ws-item-out" title="Opens the public site">
            <ExternalLink size={13} />
          </span>
        )}
      </Link>
    );
  }

  // Approved, but the destination arrives in S6 → inert (no dead link).
  return (
    <span className="ws-item is-locked" aria-disabled={true} title="Coming soon">
      <span className="ws-item-icon">
        <Icon size={17} />
      </span>
      <span className="ws-item-label">{item.label}</span>
    </span>
  );
}

export function WorkspaceShell({
  approved,
  firstName,
  children,
}: {
  approved: boolean;
  firstName: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [navOpen, setNavOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Close the mobile sidebar on navigation.
  React.useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Close the account menu on any outside click / Escape.
  React.useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const stageLabel = approved ? "Plan & Prepare" : "Awaiting approval";
  const initial = (firstName?.trim()?.[0] ?? "P").toUpperCase();

  return (
    <div className="ws">
      <a className="ph-skip-link" href="#ws-main">
        Skip to content
      </a>

      {navOpen && (
        <div className="ws-scrim" onClick={() => setNavOpen(false)} />
      )}
      <aside
        className={`ws-sidebar${navOpen ? " is-open" : ""}`}
        aria-label="Workspace"
      >
        <div className="ws-side-head">
          <Logo href="/dashboard" size={22} />
        </div>
        <nav className="ws-nav" aria-label="Workspace navigation">
          {!approved && (
            <p className="ws-locked-note">
              <span
                style={{ display: "inline-flex", color: "var(--stone-400)", flexShrink: 0 }}
              >
                <Lock size={14} />
              </span>
              <span>
                Your application is under review. Everything unlocks on approval.
              </span>
            </p>
          )}
          {GROUPS.map((group, gi) => (
            <div className="ws-group" key={group.label ?? gi}>
              {group.label && <p className="ws-group-label">{group.label}</p>}
              <div className="ws-group-items">
                {group.items.map((item) => (
                  <SidebarLink
                    key={item.key}
                    item={item}
                    approved={approved}
                    pathname={pathname}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="ws-side-foot">
          {/* Support page arrives in S6 — inert until then. */}
          <span className="ws-item is-locked" aria-disabled={true} title="Coming soon">
            <span className="ws-item-icon">
              <Info size={17} />
            </span>
            <span className="ws-item-label">Support</span>
          </span>
        </div>
      </aside>

      <div className="ws-main">
        <header className="ws-topbar">
          <button
            type="button"
            className="ws-menu-btn"
            aria-label="Open navigation"
            onClick={() => setNavOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div className="ws-topbar-right">
            <span className="ws-stage">
              <span className="ws-stage-dot" aria-hidden="true" />
              Stage · {stageLabel}
            </span>
            <button
              type="button"
              className="ws-avatar-btn"
              aria-label="Account menu"
              aria-expanded={menuOpen}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
            >
              <span className="ws-avatar" aria-hidden="true">
                {initial}
              </span>
            </button>
          </div>
          {menuOpen && (
            /* Stop clicks inside the menu from reaching the window
               close-listener, which would unmount this form before the
               sign-out submit fires. */
            <nav
              className="ws-menu"
              aria-label="Account"
              onClick={(e) => e.stopPropagation()}
            >
              <form action={signOutAction}>
                <button type="submit" className="ws-menu-signout">
                  <ArrowRight size={16} aria-hidden="true" />
                  Sign out
                </button>
              </form>
            </nav>
          )}
        </header>

        <main id="ws-main" className="ws-content">
          {children}
        </main>

        <footer className="ws-footer">
          <span>© Palestine House</span>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </footer>
      </div>
    </div>
  );
}
