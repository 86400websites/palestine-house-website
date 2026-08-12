"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { usePwToast } from "@/components/workspace-v2/pw-toast";

/* The footer's two CTAs and its action-style links (PP2 2d).

   Ask HQ is a real link: /support already carries a working Ask HQ form, so it
   needs no placeholder. The global search overlay only ships in PP4, so the
   search actions toast instead of pretending — "Search coming soon." follows
   the mockup's own pattern for an unavailable surface ("Video coming soon.").

   Client islands so the Server-Component footer never needs "use client". */

const SEARCH_SOON = "Search coming soon.";

export function PwSearchCta({ label }: { label: string }) {
  const { showToast } = usePwToast();
  return (
    <button
      type="button"
      className="pw-btn pw-btn--copper"
      onClick={() => showToast(SEARCH_SOON)}
    >
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

/* Footer-column links with no destination yet. "Ask HQ" resolves to /support;
   "Search everything" toasts until PP4 builds the overlay. */
export function PwFooterAction({ label }: { label: string }) {
  const { showToast } = usePwToast();

  if (label === "Ask HQ") {
    return (
      <Link href="/support" className="pw-footer-link">
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="pw-footer-link"
      onClick={() => showToast(SEARCH_SOON)}
    >
      {label}
    </button>
  );
}
