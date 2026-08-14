import { PwHero } from "@/components/workspace-v2/pw-hero";
import { PwPendingState } from "@/components/workspace-v2/pw-pending-state";
import { getPlatformPages } from "@/lib/workspace-v2/content";
import { type PlatformPageKey } from "@/lib/workspace-v2/spec";

/* The four toolkit section pages in PP2 (2i): real chrome, the real hero, and
   an honest "content arriving" state where PP3 will build the accordion of
   focus areas.

   The hero copy is the mockup verbatim (generated spec). The waiting state is
   NEW copy — the mockup has no such state because its content was hardcoded —
   written to the brand-voice rules: warm, short, concrete, no hype and no
   promise of a date we do not control.

   Approval is checked by each page, server-side, before this renders. */

const COMING = {
  heading: "Content is on its way.",
  body: "This section’s focus areas are being prepared. Check back shortly.",
};

/* The honest state when a section has nothing to show — an approved partner
   whose toolkit read came back empty. Since PP3 every section has content, so
   this is now a failure/edge state rather than the normal one; it stays because
   the data layer fails closed and the page must say so plainly. */
export function PwSectionWaiting() {
  return (
    <section className="pw-page">
      <div className="pw-container pw-narrow">
        <div className="pw-notice">
          <div>
            <h2 className="pw-notice-h">{COMING.heading}</h2>
            <p className="pw-notice-p">{COMING.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PwSectionShell({
  page,
  children,
}: {
  page: PlatformPageKey;
  children?: React.ReactNode;
}) {
  return (
    <>
      <PwHero page={page} />
      {children ?? <PwSectionWaiting />}
    </>
  );
}

/* Pending/declined for a section page: the shared wording plus the /contact
   fallback, matching what these routes show today. */
export function PwSectionPending() {
  return <PwPendingState variant="page" contactFallback />;
}

/* Async since PP6a: the tab title follows the page name the owner set, with the
   spec label as the fallback. The four section pages therefore export
   generateMetadata() rather than a static `metadata` object. */
export async function sectionMetadata(page: PlatformPageKey) {
  return { title: (await getPlatformPages())[page].label };
}
