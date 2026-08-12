import type { Metadata } from "next";
import { getMyProfile } from "@/lib/auth/profile";
import {
  PwSectionShell,
  PwSectionPending,
  sectionMetadata,
} from "@/components/workspace-v2/pw-section-page";

/* /program — a toolkit section in the workspace v2 shell (PP2 2i). Hero only;
   PP3 builds the accordion of focus areas here. Moved from (workspace) so it
   picks up the new chrome; the path is unchanged. */

export const metadata: Metadata = sectionMetadata("program");

export default async function ProgramPage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PwSectionPending />;
  return <PwSectionShell page="program" />;
}
