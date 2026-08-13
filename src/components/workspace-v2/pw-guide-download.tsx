"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { getResourceDownloadUrl } from "@/lib/resources/actions";
import { usePwToast } from "@/components/workspace-v2/pw-toast";
import type { PwGuideFile } from "@/lib/workspace-v2/types";

/* The Download Now control for a topic's Simple guide (PP4).

   Lifted out of PwStartCard so the focus-area card and the reader page offer
   the same download rather than two implementations of it — one server action,
   one coming-soon string, one set of accessibility decisions. The two surfaces
   differ only in which button class the design system gives them.

   There are no doc_key='guide' files uploaded yet (PP6's CMS adds them), so
   `guide` is null on all 33 topics today and this always toasts. The string
   mirrors the mockup's own approved "Video coming soon." so every waiting state
   in the workspace reads in one voice (owner-approved 2026-08-12).

   When a file does exist the download runs through the same S6 signed-URL
   server action as the templates grid: the storage path is resolved server-side
   and only a short-lived URL comes back. */

export const DOWNLOAD_LABEL = "Download Now";
const DOWNLOAD_SOON = "Download coming soon.";

export function PwGuideDownload({
  guide,
  className = "pw-action",
}: {
  guide: PwGuideFile | null;
  className?: string;
}) {
  const { showToast } = usePwToast();
  const [pending, startTransition] = React.useTransition();

  const onDownload = () => {
    if (pending) return;
    if (!guide) {
      showToast(DOWNLOAD_SOON);
      return;
    }
    startTransition(async () => {
      const result = await getResourceDownloadUrl(guide.id);
      if ("url" in result) {
        window.location.assign(result.url);
      } else {
        showToast(result.error);
      }
    });
  };

  return (
    <button
      type="button"
      className={className}
      onClick={onDownload}
      /* aria-disabled rather than disabled — see pw-template-grid.tsx: a
         disabled button leaves the accessibility tree the moment it is pressed,
         which drops keyboard focus to the top of the document mid-download. */
      aria-disabled={pending}
      /* Names the actual file on hover, as the mockup's download controls do.
         Not aria-label: that would replace the visible "Download Now" with text
         the label does not contain (WCAG 2.5.3). */
      title={guide ? `Download ${guide.title}` : undefined}
    >
      {DOWNLOAD_LABEL}
      <Download className="pw-icon" aria-hidden="true" />
    </button>
  );
}
