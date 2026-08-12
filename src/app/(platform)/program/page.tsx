import type { Metadata } from "next";
import { getMyProfile } from "@/lib/auth/profile";
import {
  PwSectionShell,
  PwSectionPending,
  sectionMetadata,
} from "@/components/workspace-v2/pw-section-page";
import { PwSectionExplorer } from "@/components/workspace-v2/pw-section-explorer";
import { getSectionContent } from "@/lib/workspace-v2/content";

/* /program — a toolkit section in the workspace v2 shell (PP2 2i), filled with
   its focus areas in PP3. Moved from (workspace) so it picks up the new
   chrome; the path is unchanged. Gating as in /setup: the page's own
   is_approved check, then the RPC's. */

export const metadata: Metadata = sectionMetadata("program");

export default async function ProgramPage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PwSectionPending />;

  const groups = await getSectionContent("program");

  return (
    <PwSectionShell page="program">
      {groups.length > 0 ? (
        <PwSectionExplorer section="program" groups={groups} />
      ) : null}
    </PwSectionShell>
  );
}
