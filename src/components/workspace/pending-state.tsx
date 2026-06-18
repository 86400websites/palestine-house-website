import { Clock, Info } from "lucide-react";

/* The gated "under review" state, shared by every workspace page so a pending
   partner sees the same notice everywhere (copy verbatim from
   docs/page-copy/03-member-workspace/dashboard.md, mirroring /dashboard). A
   Server Component — no interactivity. */

export function PendingState() {
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
