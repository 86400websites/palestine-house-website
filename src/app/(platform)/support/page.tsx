import type { Metadata } from "next";
import { getMyProfile } from "@/lib/auth/profile";
import {
  PwSectionShell,
  PwSectionPending,
  PwSectionWaiting,
  sectionMetadata,
} from "@/components/workspace-v2/pw-section-page";
import { PwSectionExplorer } from "@/components/workspace-v2/pw-section-explorer";
import { PwCommunityContacts } from "@/components/workspace-v2/pw-community-contacts";
import { getSectionContent } from "@/lib/workspace-v2/content";

/* /support — a toolkit section like the other three, plus the Community Contacts
   panel (CR1). The panel is guidance and a link to the public contact form, so
   this page reads nothing extra for it.

   Still approval-gated end to end: this page's own is_approved check and the
   toolkit RPC's. */

/* generateMetadata, not a static `metadata` object: since PP6a the tab title
   follows the page name the owner set in the CMS, with the generated spec as
   the fallback. */
export async function generateMetadata(): Promise<Metadata> {
  return sectionMetadata("support");
}

export default async function SupportPage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PwSectionPending />;

  const groups = await getSectionContent("support");

  return (
    <PwSectionShell page="support">
      {groups.length > 0 ? (
        <PwSectionExplorer section="support" groups={groups} />
      ) : (
        <PwSectionWaiting />
      )}
      <PwCommunityContacts />
    </PwSectionShell>
  );
}
