import type { Metadata } from "next";
import { getMyProfile } from "@/lib/auth/profile";
import {
  PwSectionShell,
  PwSectionPending,
  sectionMetadata,
} from "@/components/workspace-v2/pw-section-page";

/* /setup — the one genuinely new section route (PP2). Hero only; PP3 builds the
   accordion of focus areas here.

   Listed in SiteChrome's GATED_PREFIXES alongside the other gated paths, so it
   renders this shell and not the public chrome on top of it. */

export const metadata: Metadata = sectionMetadata("setup");

export default async function SetupPage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PwSectionPending />;
  return <PwSectionShell page="setup" />;
}
