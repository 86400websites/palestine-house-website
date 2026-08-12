import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/auth/profile";
import { PwHero } from "@/components/workspace-v2/pw-hero";
import { PwJourneyCards } from "@/components/workspace-v2/pw-journey-cards";
import { PwPendingState } from "@/components/workspace-v2/pw-pending-state";

/* /dashboard — the About landing (PP2 2h).

   Replaces the legacy six-card dashboard. The path is deliberately unchanged:
   it is hardcoded in the public header, the login and apply redirects, and in
   outbound email, so /dashboard must keep resolving (ROADMAP Stage 4).

   Three states, all decided server-side:
     - approved: the About hero + the four journey cards;
     - declined: the declined notice with its /contact route out;
     - pending:  the under-review notice.
   Approval is read live, so an HQ approval unlocks on the next navigation with
   no re-login. */

export const metadata: Metadata = { title: "Welcome" };

export default async function DashboardPage() {
  const profile = await getMyProfile();

  if (!profile?.is_approved) {
    /* Distinguish declined from pending. The caller reads only their OWN
       application row (owner-scoped RLS); a declined account keeps
       is_approved = false just like a pending one, so status drives the copy. */
    const supabase = await createClient();
    const { data: app } = await supabase
      .from("applications")
      .select("status")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return (
      <PwPendingState variant="landing" declined={app?.status === "declined"} />
    );
  }

  return (
    <>
      <PwHero page="about" />
      <section className="pw-about-section">
        <div className="pw-container">
          <PwJourneyCards />
        </div>
      </section>
    </>
  );
}
