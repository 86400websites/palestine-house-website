"use client";

import { BookOpen } from "lucide-react";
import { usePwToast } from "@/components/workspace-v2/pw-toast";
import { PwGuideDownload } from "@/components/workspace-v2/pw-guide-download";
import { RESOURCE_KINDS } from "@/lib/workspace-v2/spec";
import type { PwGuideFile } from "@/lib/workspace-v2/types";

/* The one "Start here" card (PP3) — under D-PP-f a topic has a single Simple
   guide, not the mockup's row of four.

   Card title and description come from the generated spec (mockup verbatim);
   the two button labels are the mockup's own.

   Both actions are inert in this sprint, and say so rather than failing
   silently:
     - Read Now needs the reader route. PP4 4c builds it and 4d wires this
       button to it; until then the card must not link to a URL that 404s.
     - Download Now needs a resources row with doc_key='guide'. There are none
       until the owner uploads them through PP6's CMS, so the card falls back to
       the same coming-soon shape. That control and its string now live in
       PwGuideDownload, shared with the reader's own download. */

const GUIDE = RESOURCE_KINDS[0];

const COPY = {
  subhead: "Start here",
  note: "One simple guide explains this focus area from beginning to end.",
  read: "Read Now",
  readSoon: "Reading coming soon.",
} as const;

/* The mockup's own `i-guide` symbol, inline rather than approximated with a
   lucide lookalike — it is one path, and RESOURCE_KINDS names this icon
   explicitly, so the card carries the glyph the design specifies. */
function GuideGlyph() {
  return (
    <svg className="pw-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4" />
    </svg>
  );
}

export function PwStartCard({ guide }: { guide: PwGuideFile | null }) {
  const { showToast } = usePwToast();

  return (
    <section>
      <div className="pw-subhead">
        <div>
          <h4 className="pw-subhead-title">{COPY.subhead}</h4>
          <p className="pw-subhead-note">{COPY.note}</p>
        </div>
      </div>

      {/* The mockup's resource grid, so the card is exactly the width it draws
          at every breakpoint. D-PP-f fills one cell of four. */}
      <div className="pw-start-grid">
        <article className="pw-start-card">
          <span className="pw-start-icon">
            <GuideGlyph />
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
            <PwGuideDownload guide={guide} />
          </div>
        </article>
      </div>
    </section>
  );
}
