import type { Metadata } from "next";
import { getMyProfile } from "@/lib/auth/profile";
import {
  PwSectionShell,
  PwSectionPending,
  sectionMetadata,
} from "@/components/workspace-v2/pw-section-page";
import { SupportForm } from "./support-form";

/* /support — a toolkit section in the workspace v2 shell (PP2 2i), and the one
   section page that is NOT a bare stub.

   Owner decision D-PP-e (PROJECT-STATUS §5): this page keeps its EXISTING,
   already-approved Ask HQ form underneath the new hero until PP3 replaces it,
   so an approved partner always has an in-account way to reach HQ during the
   PP2→PP3 content gap. The form, its server action and the
   submit_support_request write are untouched — only the chrome around them
   changed. The legacy styling of the form itself is accepted for one sprint.

   Still approval-gated: submit_support_request is approved-only (D-S6-a), so a
   pending session gets the notice and the public /contact route. */

export const metadata: Metadata = sectionMetadata("support");

export default async function SupportPage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PwSectionPending />;

  return (
    <PwSectionShell page="support">
      <section className="pw-page">
        <div className="pw-container pw-narrow pw-legacy-form">
          <SupportForm />
        </div>
      </section>
    </PwSectionShell>
  );
}
