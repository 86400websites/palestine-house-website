import type { Metadata } from "next";
import { getMyProfile } from "@/lib/auth/profile";
import { PendingState } from "@/components/workspace/pending-state";
import { PLATFORM_PAGES } from "@/lib/workspace-v2/spec";

/* /setup — the one genuinely new section route, stood up in PP2 2c so the new
   header has a real page to live on. Hero copy only: the section's own title
   and lead, verbatim from the mockup extraction. The "content arriving" state
   (new copy, owner-approved) and the hero photo treatment land in 2f; the real
   accordion of topics lands in PP3.

   Approval is checked here, server-side, exactly like every other gated page:
   a pending or declined account gets the notice and nothing else. */

const PAGE = PLATFORM_PAGES.setup;

export const metadata: Metadata = { title: PAGE.label };

export default async function SetupPage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) {
    return <PendingState />;
  }

  return (
    <section className="pw-page">
      <div className="pw-container">
        <h1 className="pw-page-title">{PAGE.title}</h1>
        <p className="pw-page-lead">{PAGE.lead}</p>
      </div>
    </section>
  );
}
