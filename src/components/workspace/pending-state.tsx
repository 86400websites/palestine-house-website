import Link from "next/link";
import { Clock, Info, Mail } from "lucide-react";

/* The gated "under review" state, shared by every workspace page so a pending
   partner sees the same notice everywhere (copy verbatim from
   docs/page-copy/03-member-workspace/dashboard.md, mirroring /dashboard). A
   Server Component — no interactivity.

   contactFallback adds a public /contact link for pages that are themselves
   approval-gated (e.g. /support): without it a pending partner who follows the
   "Support is one click away" prompt lands here with no way to reach anyone
   (S7 fix). /support's own copy already directs pending users to /contact. */

export function PendingState({
  contactFallback = false,
}: {
  contactFallback?: boolean;
}) {
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
      {contactFallback && (
        <p className="ws-help ws-help--mt-sm">
          <span className="ws-help-icon">
            <Mail size={17} />
          </span>
          <span>
            Need to reach us before then? Use the{" "}
            <Link href="/contact">contact form</Link>.
          </span>
        </p>
      )}
    </div>
  );
}
