import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PwShell } from "@/components/workspace-v2/pw-shell";

/* Workspace v2 route group (PP2, Stage 4).

   This group was created so the two design systems never shared a shell while
   the revamp was mid-flight: the legacy (workspace) group kept its sidebar
   chrome for the old routes while everything here got the new mockup chrome,
   and routes migrated across one at a time. PP5 deleted that group and the last
   page moved in with it, so this is now the only gated shell outside /admin.

   This layout is its own authoritative server-side session gate, because file
   location is never access control
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
