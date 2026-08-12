import type { Metadata } from "next";
import { getMyProfile } from "@/lib/auth/profile";
import {
  PwSectionShell,
  PwSectionPending,
  PwSectionWaiting,
  sectionMetadata,
} from "@/components/workspace-v2/pw-section-page";
import { PwSectionExplorer } from "@/components/workspace-v2/pw-section-explorer";
import { getSectionContent } from "@/lib/workspace-v2/content";
import { SupportForm } from "./support-form";

/* /support — a toolkit section in the workspace v2 shell (PP2 2i), filled with
   its focus areas in PP3, and the one section page that carries a form.

   The EXISTING Ask HQ form still sits below the toolkit (D-PP-e), so partners
   keep a working in-account channel while the toolkit is built. Step 3h
   replaces it with the mockup's Ask HQ panel, which under D-PP-h is UI only —
   the send lands in PP4.

   Still approval-gated: submit_support_request is approved-only (D-S6-a), so a
   pending session gets the notice and the public /contact route. */

export const metadata: Metadata = sectionMetadata("support");

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
      <section className="pw-page">
        <div className="pw-container pw-narrow pw-legacy-form">
          <SupportForm />
        </div>
      </section>
    </PwSectionShell>
  );
}
