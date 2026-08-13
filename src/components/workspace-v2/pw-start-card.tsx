"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { PwGuideDownload } from "@/components/workspace-v2/pw-guide-download";
import { RESOURCE_KINDS } from "@/lib/workspace-v2/spec";
import type { PwSectionSlug, PwTopic } from "@/lib/workspace-v2/types";

/* The one "Start here" card (PP3) — under D-PP-f a topic has a single Simple
   guide, not the mockup's row of four.

   Card title and description come from the generated spec (mockup verbatim);
   the two button labels are the mockup's own.

   Read Now became a real link in PP4 4d — the sprint's one mandatory hand-off.
   In PP3 it toasted "Reading coming soon." on all 33 focus areas, not because
   anything was missing from the data (elements.simple_guide_md exists for every
   one) but because the reader route did not exist yet and a card must never
   link at a URL that 404s. 4c built it, so the toast is gone.

   Download Now still falls back to an honest coming-soon state: it needs a
   resources row with doc_key='guide' and there are none until the owner uploads
   them through PP6's CMS. That control and its string live in PwGuideDownload,
   shared with the reader's own download. */

const GUIDE = RESOURCE_KINDS[0];

const COPY = {
  subhead: "Start here",
  note: "One simple guide explains this focus area from beginning to end.",
  read: "Read Now",
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

export function PwStartCard({
  section,
  topic,
}: {
  section: PwSectionSlug;
  topic: PwTopic;
}) {
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
            {/* The accessible name names the focus area as well as the action,
                the way PP3's Explore/Back controls do — and it OPENS with the
                visible "Read Now" so the label is contained in the name
                (WCAG 2.5.3), which is why this is not just the topic title. */}
            <Link
              className="pw-action"
              href={`/${section}/${encodeURIComponent(topic.slug)}/guide`}
              aria-label={`${COPY.read} — ${topic.title}`}
            >
              {COPY.read}
              <BookOpen className="pw-icon" aria-hidden="true" />
            </Link>
            <PwGuideDownload guide={topic.guide} />
          </div>
        </article>
      </div>
    </section>
  );
}
