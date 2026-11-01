"use client";

import { ArrowRight } from "lucide-react";
import { usePwSearch } from "@/components/workspace-v2/pw-search";

/* The footer's two CTAs and its action-style links (PP2 2d).

   Community Contacts is a real link: /support carries the contact guidance in
   its #community-contacts block, so it needs no placeholder. A plain anchor, not
   next/link, on purpose: on /support itself Link would change the fragment with
   pushState, which fires no hashchange, so the explorer would never hear of it.
   From any other page it is a full load, and the explorer lands it on arrival.

   The two search actions toasted "Search coming soon." until PP4 4g built the
   overlay; they now open it. These are the mockup's ONLY search entry points
   besides Ctrl/⌘+K — it puts none in the header — so on a phone the footer is
   the way in, which is why the CTA band repeats on every page.

   Client islands so the Server-Component footer never needs "use client". */

const COMMUNITY_CONTACTS_HREF = "/support#community-contacts";

export function PwSearchCta({ label }: { label: string }) {
  const { openSearch } = usePwSearch();
  return (
    <button type="button" className="pw-btn pw-btn--copper" onClick={openSearch}>
      {label}
      <ArrowRight className="pw-icon" aria-hidden="true" />
    </button>
  );
}

export function PwCommunityContactsCta({ label }: { label: string }) {
  return (
    <a href={COMMUNITY_CONTACTS_HREF} className="pw-btn pw-btn--outline">
      {label}
      <ArrowRight className="pw-icon" aria-hidden="true" />
    </a>
  );
}

/* Footer-column links. "Community Contacts" resolves to the /support block;
   "Search Resources" opens the same overlay as the CTA above it. */
export function PwFooterAction({ label }: { label: string }) {
  const { openSearch } = usePwSearch();

  if (label === "Community Contacts") {
    return (
      <a href={COMMUNITY_CONTACTS_HREF} className="pw-footer-link">
        {label}
      </a>
    );
  }

  return (
    <button type="button" className="pw-footer-link" onClick={openSearch}>
      {label}
    </button>
  );
}
