"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { usePwSearch } from "@/components/workspace-v2/pw-search";

/* The footer's two CTAs and its action-style links (PP2 2d).

   Ask HQ is a real link: /support already carries a working Ask HQ form, so it
   needs no placeholder.

   The two search actions toasted "Search coming soon." until PP4 4g built the
   overlay; they now open it. These are the mockup's ONLY search entry points
   besides Ctrl/⌘+K — it puts none in the header — so on a phone the footer is
   the way in, which is why the CTA band repeats on every page.

   Client islands so the Server-Component footer never needs "use client". */

export function PwSearchCta({ label }: { label: string }) {
  const { openSearch } = usePwSearch();
  return (
    <button type="button" className="pw-btn pw-btn--copper" onClick={openSearch}>
      {label}
      <ArrowRight className="pw-icon" aria-hidden="true" />
    </button>
  );
}

export function PwAskHqCta({ label }: { label: string }) {
  return (
    <Link href="/support" className="pw-btn pw-btn--outline">
      {label}
      <ArrowRight className="pw-icon" aria-hidden="true" />
    </Link>
  );
}

/* Footer-column links. "Ask HQ" resolves to /support; "Search everything" opens
   the same overlay as the CTA above it. */
export function PwFooterAction({ label }: { label: string }) {
  const { openSearch } = usePwSearch();

  if (label === "Ask HQ") {
    return (
      <Link href="/support" className="pw-footer-link">
        {label}
      </Link>
    );
  }

  return (
    <button type="button" className="pw-footer-link" onClick={openSearch}>
      {label}
    </button>
  );
}
