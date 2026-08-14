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
   its focus areas in PP3. Moved out of the legacy group at PP2 so it picked up
   the new chrome; the path never changed. Gating as in /setup: the page's own
   is_approved check, then the RPC's. */

/* generateMetadata, not a static `metadata` object: since PP6a the tab title
   follows the page name the owner set in the CMS, with the generated spec as
   the fallback. */
export async function generateMetadata(): Promise<Metadata> {
  return sectionMetadata("operate");
}

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
