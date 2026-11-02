import type { Metadata } from "next";
import { getMyProfile } from "@/lib/auth/profile";
import { getPlatformPages } from "@/lib/workspace-v2/content";
import { PwHero } from "@/components/workspace-v2/pw-hero";
import { PwJourneyCards } from "@/components/workspace-v2/pw-journey-cards";
import { PwPendingState } from "@/components/workspace-v2/pw-pending-state";

/* /dashboard — the Overview landing (PP2 2h).

   Replaces the legacy six-card dashboard. The path is deliberately unchanged:
   it is hardcoded in the public header, the login and apply redirects, and in
   outbound email, so /dashboard must keep resolving (ROADMAP Stage 4).

   Three states, all decided server-side:
     - approved: the Overview hero + the four journey cards;
     - declined: the access-not-offered notice with its /contact route out;
     - pending:  the pending-access notice.
   Approval is read live, so an admin's approval unlocks on the next navigation
   with no re-login. */

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const profile = await getMyProfile();

  if (!profile?.is_approved) {
    return <PwPendingState variant="landing" />;
  }

  const pages = await getPlatformPages();

  return (
    <>
      <PwHero page="about" />
      <section className="pw-about-section">
        <div className="pw-container">
          <PwJourneyCards
            videoUrls={{
              setup: pages.setup.videoUrl,
              operate: pages.operate.videoUrl,
              program: pages.program.videoUrl,
              support: pages.support.videoUrl,
            }}
          />
        </div>
      </section>
    </>
  );
}
