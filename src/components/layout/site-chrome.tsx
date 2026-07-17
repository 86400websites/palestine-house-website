"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/* Chooses the chrome by route. Public marketing/auth routes keep the locked
   site header + footer; gated routes bring their OWN shell (the (workspace)
   group's WorkspaceShell / the admin top bar), so here they render bare
   children. Without this, a gated page would render the public header+footer
   AND its own shell — double chrome, plus the public Apply CTA leaking into the
   authenticated area.
   Uses usePathname (client) the same way the header's session probe does — it
   does NOT opt routes out of static rendering, so public pages stay static and
   the CSP is untouched. The header/footer are passed in as elements (props) so
   this client component never has to import server components.

   GATED_PREFIXES must list every top-level segment of the gated surface: the
   whole src/app/(workspace) route group (pathless, so each page resolves to a
   top-level path) plus /admin. Keep this in sync when a gated route is added.
   (Post-launch follow-up: move the public chrome into a (public) route-group
   layout so this decision becomes structural rather than a path list.) */

const GATED_PREFIXES = [
  // src/app/(workspace) route group
  "/dashboard",
  "/plan",
  "/operate",
  "/food",
  "/program",
  "/programming",
  "/live",
  "/build",
  "/elements",
  "/resources",
  "/academy",
  "/tools",
  "/account",
  "/support",
  // admin
  "/admin",
];

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
