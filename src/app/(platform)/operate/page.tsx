import type { Metadata } from "next";
import { getMyProfile } from "@/lib/auth/profile";
import {
  PwSectionShell,
  PwSectionPending,
  sectionMetadata,
} from "@/components/workspace-v2/pw-section-page";
import { PwSectionExplorer } from "@/components/workspace-v2/pw-section-explorer";
import { getSectionContent } from "@/lib/workspace-v2/content";

/* /operate — a toolkit section in the workspace v2 shell (PP2 2i), filled with
   its focus areas in PP3. Moved from (workspace) so it picks up the new
   chrome; the path is unchanged. Gating as in /setup: the page's own
   is_approved check, then the RPC's. */

export const metadata: Metadata = sectionMetadata("operate");

export default async function OperatePage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PwSectionPending />;

  const groups = await getSectionContent("operate");

  return (
    <PwSectionShell page="operate">
      {groups.length > 0 ? (
        <PwSectionExplorer section="operate" groups={groups} />
      ) : null}
    </PwSectionShell>
  );
}
