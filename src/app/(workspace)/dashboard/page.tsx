import Link from "next/link";
import { Calendar, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyProfile } from "@/lib/auth/profile";

/* /dashboard (docs/page-copy/03-member-workspace/dashboard.md) — answers one
   question: where am I, what's next? Never a wall. S4 ships two states:
   - pending: "under review" while HQ decides;
   - newly approved: the empty-state welcome.
   The full snapshot (stage %, gates, next steps) needs the content schema and
   lands in S6. Approval comes from get_my_profile() (cached, shared with the
   layout) — read live, so it flips without a re-login. */

export default async function DashboardPage() {
  const profile = await getMyProfile();
  const approved = profile?.is_approved ?? false;

  if (!approved) {
    return (
      <div>
        <h1 className="ws-h1">Welcome.</h1>
        <div className="ws-notice">
          <span className="ws-notice-icon">
            <Clock size={22} />
          </span>
          <div>
            <h2 className="ws-notice-h">Request received — under review.</h2>
            <p className="ws-notice-p">
              Every application is reviewed by HQ. Everything here unlocks the
              moment yours is approved.
            </p>
          </div>
        </div>
        <p className="ws-help ws-help--mt">
          <span className="ws-help-icon">
            <Info size={17} />
          </span>
          <span>
            Stuck? <strong>Support</strong> is one click away.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="ws-h1">You’re approved — welcome.</h1>
      <p className="ws-lead">
        Start in Plan &amp; Prepare: understand the model and your city before
        you build a thing.
      </p>
      <div className="ws-cta-row">
        <Button asChild>
          <Link href="/focus-areas">Explore the focus areas</Link>
        </Button>
      </div>
      <p className="ws-help ws-help--mt-lg">
        <span className="ws-help-icon">
          <Info size={17} />
        </span>
        <span>
          Stuck? <strong>Support</strong> is one click away.
        </span>
      </p>
      <p className="ws-help ws-help--mt-sm">
        <span className="ws-help-icon">
          <Calendar size={17} />
        </span>
        <span>
          <em>Take a break — catch a live event or a recording</em> →{" "}
          <Link href="/live">Live Programming</Link>.
        </span>
      </p>
    </div>
  );
}
