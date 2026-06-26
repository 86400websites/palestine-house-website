import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { signOutAction } from "@/lib/auth/actions";
import { AdminNav } from "@/components/admin/admin-nav";

/* Internal HQ admin chrome (docs/page-designs/shared/admin-chrome.jsx) —
   function over polish, no artwork. The nav (Approvals · Content) is
   route-aware (AdminNav), so the active destination is derived from the path,
   not a prop. Gating lives in the admin layout. */

export function AdminShell({
  children,
}: {
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
        <AdminNav />
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
