import Link from "next/link";
import { Clock, Info, Mail, MessageCircle } from "lucide-react";

/* The gated "under review" / "not moving forward" states, in the workspace v2
   shell (PP2 2h).

   Every string here is carried over VERBATIM from the approved copy the legacy
   workspace rendered (docs/page-copy/03-member-workspace/dashboard.md, via the
   old dashboard page and components/workspace/pending-state.tsx — both deleted
   at PP5, which is why this file is now the only home for these words).
   The revamp restyled these states; it did not rewrite them. There are two
   approved variants and they differ, so both are preserved:

     variant="landing"  — the /dashboard wording ("Your application is under
                          review." / "HQ reads every one by hand…"), plus the
                          declined branch.
     variant="page"     — the shared wording every other gated page shows
                          ("Request received — under review." …), plus the
                          Support prompt and the optional /contact fallback
                          that keeps an approval-gated page from stranding a
                          pending partner (the S7 fix).

   A Server Component: no interactivity. */

export function PwPendingState({
  variant = "page",
  declined = false,
  contactFallback = false,
}: {
  variant?: "landing" | "page";
  declined?: boolean;
  contactFallback?: boolean;
}) {
  return (
    <section className="pw-page">
      <div className="pw-container pw-narrow">
        <h1 className="pw-page-title">Welcome.</h1>

        <div className="pw-notice">
          <span className="pw-notice-icon">
            {declined ? (
              <MessageCircle size={22} aria-hidden="true" />
            ) : (
              <Clock size={22} aria-hidden="true" />
            )}
          </span>
          <div>
            {declined ? (
              <>
                <h2 className="pw-notice-h">We’re not moving forward right now.</h2>
                <p className="pw-notice-p">
                  After careful review, HQ isn’t taking your application further at
                  this time. If you have questions, we’d like to hear from you —{" "}
                  <Link className="pw-notice-link" href="/contact">
                    contact us
                  </Link>
                  .
                </p>
              </>
            ) : variant === "landing" ? (
              <>
                <h2 className="pw-notice-h">Your application is under review.</h2>
                <p className="pw-notice-p">
                  HQ reads every one by hand. The moment yours is approved,
                  everything here opens up — check back any time.
                </p>
              </>
            ) : (
              <>
                <h2 className="pw-notice-h">Request received — under review.</h2>
                <p className="pw-notice-p">
                  Every application is reviewed by HQ. Everything here unlocks the
                  moment yours is approved.
                </p>
              </>
            )}
          </div>
        </div>

        {variant === "page" && !declined && (
          <>
            <p className="pw-help">
              <span className="pw-help-icon">
                <Info size={17} aria-hidden="true" />
              </span>
              <span>
                Stuck? <strong>Support</strong> is one click away.
              </span>
            </p>
            {contactFallback && (
              <p className="pw-help">
                <span className="pw-help-icon">
                  <Mail size={17} aria-hidden="true" />
                </span>
                <span>
                  Need to reach us before then? Use the{" "}
                  <Link href="/contact">contact form</Link>.
                </span>
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
