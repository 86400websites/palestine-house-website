import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PwShell } from "@/components/workspace-v2/pw-shell";

/* Workspace v2 route group (PP2, Stage 4).

   The new platform pages live here rather than in (workspace) so the two design
   systems never share a shell: (workspace) keeps its sidebar chrome for the
   legacy routes until PP5 deletes them, while everything in this group gets the
   new mockup chrome. Routes migrate across one at a time (dashboard in 2e; the
   remaining section pages in 2f).

   This layout is its own authoritative server-side session gate — identical to
   the (workspace) one, because file location is never access control
   (SECURITY-CHECKLIST §6/§15). An anonymous visitor goes to /login; an
   authenticated one gets the shell and each page decides what it may show from
   its own approval check. Approval is read live per request, so an HQ approval
   unlocks on the next navigation with no re-login.

   Every path served here is also listed in SiteChrome's GATED_PREFIXES — a
   gated route missing from that list renders the public chrome on top of this
   one. */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  return <PwShell>{children}</PwShell>;
}
