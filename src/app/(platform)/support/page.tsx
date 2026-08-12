import type { Metadata } from "next";
import { getMyProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import {
  PwSectionShell,
  PwSectionPending,
  PwSectionWaiting,
  sectionMetadata,
} from "@/components/workspace-v2/pw-section-page";
import { PwSectionExplorer } from "@/components/workspace-v2/pw-section-explorer";
import { PwAskHq } from "@/components/workspace-v2/pw-ask-hq";
import { getSectionContent } from "@/lib/workspace-v2/content";

/* /support — a toolkit section like the other three, plus the Ask HQ panel.

   The panel is the mockup's, wired to the Ask HQ server action that has been
   live since S6 (approved-only RPC 0019 + a Resend notification to HQ). That
   supersedes D-PP-h, which had deferred the send to PP4 on the understanding
   that it needed building: only the field shape differed, and it maps with no
   backend change. So the legacy form is replaced outright and no channel is
   lost between sprints.

   Name and email are read here, server-side, purely to prefill the panel's two
   read-only fields — the account is already who HQ replies to. Both belong to
   the signed-in partner, so neither is a secret leaving the server.

   Still approval-gated end to end: this page's own is_approved check, the
   toolkit RPC's, and submit_support_request's. */

export const metadata: Metadata = sectionMetadata("support");

export default async function SupportPage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PwSectionPending />;

  const supabase = await createClient();
  const [
    groups,
    {
      data: { user },
    },
  ] = await Promise.all([getSectionContent("support"), supabase.auth.getUser()]);

  return (
    <PwSectionShell page="support">
      {groups.length > 0 ? (
        <PwSectionExplorer section="support" groups={groups} />
      ) : (
        <PwSectionWaiting />
      )}
      <PwAskHq fullName={profile.full_name} email={user?.email ?? null} />
    </PwSectionShell>
  );
}
