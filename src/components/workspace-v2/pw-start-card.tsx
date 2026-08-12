"use client";

import * as React from "react";
import { BookOpen, Download, FileText } from "lucide-react";
import { getResourceDownloadUrl } from "@/lib/resources/actions";
import { usePwToast } from "@/components/workspace-v2/pw-toast";
import { RESOURCE_KINDS } from "@/lib/workspace-v2/spec";
import type { PwGuideFile } from "@/lib/workspace-v2/types";

/* The one "Start here" card (PP3) — under D-PP-f a topic has a single Simple
   guide, not the mockup's row of four.

   Card title and description come from the generated spec (mockup verbatim);
   the two button labels are the mockup's own.

   Both actions are inert in this sprint, and say so rather than failing
   silently:
     - Read Now needs the reader route, which lands in PP4. The body it will
       render (elements.simple_guide_md) already exists for all 33 topics —
       only the route is missing — so PP3 must not link to a URL that 404s.
     - Download Now needs a resources row with doc_key='guide'. There are none
       until the owner uploads them through PP6's CMS, so the card falls back to
       the same coming-soon shape.

   Both strings mirror the mockup's approved "Video coming soon." so the three
   waiting states in the workspace read as one voice (owner-approved
   2026-08-12). When a guide file does exist the download runs through the same
   S6 signed-URL action as the templates grid — no second download path. */

const GUIDE = RESOURCE_KINDS[0];

const COPY = {
  subhead: "Start here",
  note: "One simple guide explains this focus area from beginning to end.",
  read: "Read Now",
  download: "Download Now",
  readSoon: "Reading coming soon.",
  downloadSoon: "Download coming soon.",
} as const;

export function PwStartCard({ guide }: { guide: PwGuideFile | null }) {
  const { showToast } = usePwToast();
  const [pending, startTransition] = React.useTransition();

  /* aria-disabled rather than disabled — see pw-template-grid.tsx: a disabled
     button loses focus the moment it is pressed. */
  const onDownload = () => {
    if (pending) return;
    if (!guide) {
      showToast(COPY.downloadSoon);
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
    <section>
      <div className="pw-subhead">
        <div>
          <h4 className="pw-subhead-title">{COPY.subhead}</h4>
          <p className="pw-subhead-note">{COPY.note}</p>
        </div>
      </div>

      <article className="pw-start-card">
        <span className="pw-start-icon">
          <FileText className="pw-icon" aria-hidden="true" />
        </span>
        <h5 className="pw-start-title">{GUIDE.title}</h5>
        <p className="pw-start-desc">{GUIDE.desc}</p>

        <div className="pw-start-actions">
          <button
            type="button"
            className="pw-action"
            onClick={() => showToast(COPY.readSoon)}
          >
            {COPY.read}
            <BookOpen className="pw-icon" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="pw-action"
            onClick={onDownload}
            aria-disabled={pending}
            /* Names the actual file on hover, as the mockup's download controls
               do. Not aria-label: that would replace the visible "Download Now"
               with text the label does not contain (WCAG 2.5.3). */
            title={guide ? `Download ${guide.title}` : undefined}
          >
            {COPY.download}
            <Download className="pw-icon" aria-hidden="true" />
          </button>
        </div>
      </article>
    </section>
  );
}
