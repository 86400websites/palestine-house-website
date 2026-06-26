"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* The HQ admin top-nav. Route-aware so each destination highlights from the
   current path (no hardcoded `active` prop): Approvals matches /admin/approvals,
   Content matches /admin/content and every section under it
   (/admin/content/elements, …) without affecting the Approvals highlight.
   Gating still lives in the admin layout — this is presentation only. */

const NAV = [
  { label: "Approvals", href: "/admin/approvals" },
  { label: "Content", href: "/admin/content" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="adm-nav" aria-label="Admin">
      {NAV.map((n) => {
        const active = pathname === n.href || pathname.startsWith(n.href + "/");
        return (
          <Link
            key={n.href}
            href={n.href}
            className={active ? "is-active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
