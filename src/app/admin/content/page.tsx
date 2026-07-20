import type { Metadata } from "next";
import Link from "next/link";

/* /admin/content — the content-management hub (S11 11-2). The admin layout
   already gated this request via is_admin() (anon -> /login, authenticated
   non-admin -> 404 notFound), so no extra gate is needed here. The heading is
   the approved canon string (docs/page-copy/04-admin/admin-content.md).

   Canon-vs-scope reconciliation (PROJECT-STATUS D-S11-f): the copy canon lists a
   "Live Programming sessions" section, but programming is already self-managed
   in the gated /programming tool (S9), so it is NOT duplicated here. This hub
   carries four sections — Focus Areas (elements), Videos (academy), Templates
   (resources), Admins; display labels renamed for consistency per the owner
   (2026-07-20), routes unchanged. The section routes are built in 11-6..11-9. */

export const metadata: Metadata = { title: "Content admin" };

const SECTIONS = [
  {
    href: "/admin/content/elements",
    title: "Focus Areas",
    desc: "The 33 topic guides — overview, simple guide, and what to watch for.",
  },
  {
    href: "/admin/content/academy",
    title: "Videos",
    desc: "Each topic's video link and script.",
  },
  {
    href: "/admin/content/resources",
    title: "Templates",
    desc: "Template and booklet details — title, type, and where they appear.",
  },
  {
    href: "/admin/content/admins",
    title: "Admins",
    desc: "Add or remove the HQ team members who manage this.",
  },
];

export default function ContentAdminPage() {
  return (
    <div>
      <h1 className="adm-h1">Content admin.</h1>
      <p className="adm-intro">
        Manage the gated content partners see — topic guides, videos, and
        templates — and who at HQ has admin access.
      </p>
      <div className="adm-hub">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="adm-hub-card">
            <h2>{s.title}</h2>
            <p>{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
