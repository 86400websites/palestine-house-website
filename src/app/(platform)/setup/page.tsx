import type { Metadata } from "next";
import { getMyProfile } from "@/lib/auth/profile";
import {
  PwSectionShell,
  PwSectionPending,
  sectionMetadata,
} from "@/components/workspace-v2/pw-section-page";
import { PwSectionExplorer } from "@/components/workspace-v2/pw-section-explorer";
import { getSectionContent } from "@/lib/workspace-v2/content";

/* /setup — the one genuinely new section route (PP2), filled with its focus
   areas in PP3.

   Listed in SiteChrome's GATED_PREFIXES alongside the other gated paths, so it
   renders this shell and not the public chrome on top of it.

   Two gates, in order: this page's own is_approved check decides whether to
   render the pending state at all, and get_platform_topics() re-checks
   is_approved server-side, so the read returns zero rows for anyone it should
   not serve. An empty result falls through to the shell's honest waiting
   state rather than an empty page. */

/* generateMetadata, not a static `metadata` object: since PP6a the tab title
   follows the page name the owner set in the CMS, with the generated spec as
   the fallback. */
export async function generateMetadata(): Promise<Metadata> {
  return sectionMetadata("setup");
}

export default async function SetupPage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PwSectionPending />;

  const groups = await getSectionContent("setup");

  return (
    <PwSectionShell page="setup">
      {groups.length > 0 ? (
        <PwSectionExplorer section="setup" groups={groups} />
      ) : null}
    </PwSectionShell>
  );
}
