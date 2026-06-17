import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { signOutAction } from "@/lib/auth/actions";

/* Internal HQ admin chrome (docs/page-designs/shared/admin-chrome.jsx) —
   function over polish, no artwork. Only Approvals is in scope for MVP
   (Content + Partner interest are post-MVP), so the nav carries one
   destination. Gating lives in the admin layout. */

const NAV = [{ key: "approvals", label: "Approvals", href: "/admin/approvals" }];

export function AdminShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="adm">
      <a className="ph-skip-link" href="#adm-main">
        Skip to content
      </a>
      <header className="adm-topbar">
        <div className="adm-brand">
          <Logo href="/dashboard" size={20} />
          <span className="adm-badge">HQ Admin</span>
        </div>
        <nav className="adm-nav" aria-label="Admin">
          {NAV.map((n) => (
            <Link
              key={n.key}
              href={n.href}
              className={active === n.key ? "is-active" : undefined}
              aria-current={active === n.key ? "page" : undefined}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="adm-topbar-right">
          <Link href="/dashboard">Partner workspace</Link>
          <form action={signOutAction}>
            <button type="submit" className="adm-signout">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main id="adm-main" className="adm-content">
        {children}
      </main>
    </div>
  );
}
