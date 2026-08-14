import type { Metadata } from "next";
import Link from "next/link";

/* /admin/content — the content-management hub (S11 11-2). The admin layout
   already gated this request via is_admin() (anon -> /login, authenticated
   non-admin -> 404 notFound), so no extra gate is needed here. The heading is
   the approved canon string (docs/page-copy/04-admin/admin-content.md).

   Canon-vs-scope reconciliation (PROJECT-STATUS D-S11-f): the copy canon lists a
   "Live Programming sessions" section, but programming was self-managed in the
   gated /programming tool (S9), which PP5 deleted along with the rest of the
   legacy workspace — so it is not here either.

   PP6a restructured this hub to the platform that now exists: Pages · Focus
   areas · Files · Admins. The Videos card and its screen are gone — the Academy
   was retired at D-PP-b, PP5 deleted its partner-facing surface, and PP5 left
   this screen for PP6 to remove. Its four RPCs and the academy_modules table
   follow in PP7's 0031. */

export const metadata: Metadata = { title: "Content admin" };

const SECTIONS = [
  {
    href: "/admin/content/pages",
    title: "Pages",
    desc: "The heading, intro and photo at the top of each page.",
  },
  {
    href: "/admin/content/elements",
    title: "Focus areas",
    desc: "Each focus area's summary and its Simple guide.",
  },
  {
    href: "/admin/content/resources",
    title: "Files",
    desc: "The guide and templates a partner downloads.",
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
        Everything partners see behind the gate — the pages, the focus areas and
        their files — and who at HQ can change it.
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
