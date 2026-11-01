import Link from "next/link";
import { Clock, Mail, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/* The gated pending-access / access-not-offered states, in the workspace v2
   shell (PP2 2h).

   The notice wording is verbatim from the CR1 public copy, section 7.5. The
   caller's OWN application row (owner-scoped RLS) decides which notice shows,
   and it is read here so a declined account gets the same truthful answer on
   the section pages and guide readers, not just /dashboard. A declined account keeps
   is_approved = false just like a pending one, so status drives the copy; this
   changes the words only, and no page's access.

   The variants differ only in what can follow a pending notice:

     variant="landing"  — /dashboard: nothing.
     variant="page"     — every other gated page: the optional /contact fallback
                          that keeps an approval-gated page from stranding a
                          pending partner (the S7 fix).

   A Server Component: no interactivity. */

export async function PwPendingState({
  variant = "page",
  contactFallback = false,
}: {
  variant?: "landing" | "page";
  contactFallback?: boolean;
}) {
  const supabase = await createClient();
  const { data: app } = await supabase
    .from("applications")
    .select("status")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isDeclined = app?.status === "declined";

  return (
    <section className="pw-page">
      <div className="pw-container pw-narrow">
        <h1 className="pw-page-title">Welcome.</h1>

        <div className="pw-notice">
          <span className="pw-notice-icon">
            {isDeclined ? (
              <MessageCircle size={22} aria-hidden="true" />
            ) : (
              <Clock size={22} aria-hidden="true" />
            )}
          </span>
          <div>
            {isDeclined ? (
              <>
                <h2 className="pw-notice-h">
                  We cannot offer community access at the moment.
                </h2>
                <p className="pw-notice-p">
                  You can continue exploring the public information about
                  Palestine House.{" "}
                  <Link className="pw-notice-link" href="/contact">
                    Contact us
                  </Link>{" "}
                  with a question about this access decision.
                </p>
              </>
            ) : (
              <>
                <h2 className="pw-notice-h">
                  Your community access is being arranged.
                </h2>
                <p className="pw-notice-p">
                  Your application has been received. This update is about access
                  to the community resources, not approval of a venue or business
                  plan.
                </p>
              </>
            )}
          </div>
        </div>

        {variant === "page" && !isDeclined && contactFallback && (
          <p className="pw-help">
            <span className="pw-help-icon">
              <Mail size={17} aria-hidden="true" />
            </span>
            <span>
              Need to reach us? Use the{" "}
              <Link href="/contact">contact form</Link>.
            </span>
          </p>
        )}
      </div>
    </section>
  );
}
