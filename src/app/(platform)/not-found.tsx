import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WORKSPACE_CHROME } from "@/lib/workspace-v2/spec";

/* The 404 for the workspace v2 route group (PP4).

   Without this, an approved partner who follows a stale link into the platform
   falls through to the app-wide not-found, which wears the PUBLIC chrome — the
   marketing header and footer, inside the gated area. This one renders in the
   `.pw-` shell the layout already provides.

   The layout runs first, so an anonymous visitor is redirected to /login and
   never reaches this page: a 404 here is always someone who is already signed
   in. It carries no topic detail for the same reason the reader's metadata does
   not — a missing page must not become a way to probe which slugs are real.

   /dashboard is the About landing (PP2) and the one destination hardcoded
   everywhere else in the product, so it is the safe way back. */

const COPY = {
  heading: "That page doesn’t exist.",
  body: "The link may be old, or the address may have a typo.",
  back: "Back to",
} as const;

const ABOUT = WORKSPACE_CHROME.nav.items[0].label;

export default function PlatformNotFound() {
  return (
    <section className="pw-page">
      <div className="pw-container pw-narrow">
        <h1 className="pw-page-title">{COPY.heading}</h1>
        <p className="pw-page-lead">{COPY.body}</p>
        <p className="pw-page-actions">
          <Link className="pw-action" href="/dashboard">
            <ArrowLeft className="pw-icon" aria-hidden="true" />
            {COPY.back} {ABOUT}
          </Link>
        </p>
      </div>
    </section>
  );
}
