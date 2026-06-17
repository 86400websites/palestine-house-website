"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/* Chooses the chrome by route. Public marketing/auth routes keep the locked
   site header + footer; gated routes (/dashboard, /admin) bring their OWN shell
   (workspace sidebar / admin top bar), so here they render bare children.
   Uses usePathname (client) the same way the header's session probe does — it
   does NOT opt routes out of static rendering, so public pages stay static and
   the CSP is untouched. The header/footer are passed in as elements (props) so
   this client component never has to import server components. */

const GATED_PREFIXES = ["/dashboard", "/admin"];

function isGated(pathname: string): boolean {
  return GATED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function SiteChrome({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  if (isGated(pathname)) return <>{children}</>;

  return (
    <div className="ph-page">
      <a className="ph-skip-link" href="#main-content">
        Skip to content
      </a>
      {header}
      {/* tabIndex moves focus (not just scroll) when the skip link fires */}
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      {footer}
    </div>
  );
}
