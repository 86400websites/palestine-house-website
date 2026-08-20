import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth/profile";

/* /admin/content — the content-management hub (S11 11-2). The heading is the
   approved canon string (docs/page-copy/04-admin/admin-content.md).

   ⚠️ PP8 8-c — this page used to say "the admin layout already gated this
   request, so no extra gate is needed here", and that reasoning was wrong in a
   way worth keeping written down (PROJECT-STATUS.md §7 issue #3).

   The layout's gate IS correct and does redirect. But Next renders a page
   segment in PARALLEL with its layout, so a segment that awaits nothing can
   have its flight data in the streamed response before the layout's redirect()
   resolves. This page was a synchronous component over a hardcoded array, so an
   ANONYMOUS request got a 200 carrying all four card labels and their
   /admin/content/* paths — in the HTML and in the RSC payload. Reproduced
   against live production during PP8's security pass; structure only, never
   data, because every data-bearing admin screen awaits a gated read and so
   fails closed.

   The fix is the same rule CLAUDE.md states for routes: file location is never
   access control, so the page checks for itself. Awaiting isAdmin() also makes
   the render depend on a server round-trip, which is what actually stops the
   segment streaming ahead of the gate. isAdmin() is request-cached, so this
   costs no second query.

   Canon-vs-scope reconciliation (PROJECT-STATUS D-S11-f): the copy canon lists a
   "Live Programming sessions" section, but programming was self-managed in the
   gated /programming tool (S9), which PP5 deleted along with the rest of the
   legacy workspace — so it is not here either.

   PP6a restructured this hub to the platform that now exists: Pages · Focus
   areas · Files · Admins. The Videos card and its screen are gone — the Academy
   was retired at D-PP-b, PP5 deleted its partner-facing surface, and PP5 left
   this screen for PP6 to remove. Its four RPCs and the academy_modules table
   follow in PP7's 0033. */

export const metadata: Metadata = { title: "Content admin" };

const SECTIONS = [
  {
    href: "/admin/content/pages",
    title: "Pages",
    desc: "The heading, intro and photo at the top of each page.",
  },
  {
    href: "/admin/content/focus-areas",
    title: "Focus areas",
    desc: "Each focus area's summary and its Simple guide.",
  },
  {
    href: "/admin/content/files",
    title: "Files",
    desc: "The guide and templates a partner downloads.",
  },
  {
    href: "/admin/content/admins",
    title: "Admins",
    desc: "Add or remove the HQ team members who manage this.",
  },
];

export default async function ContentAdminPage() {
  if (!(await isAdmin())) notFound();

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
