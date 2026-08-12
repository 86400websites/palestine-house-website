"use client";

import * as React from "react";
import { ChevronDown, Download } from "lucide-react";
import { getResourceDownloadUrl } from "@/lib/resources/actions";
import { usePwToast } from "@/components/workspace-v2/pw-toast";
import type { PwTemplate } from "@/lib/workspace-v2/types";

/* A topic's templates grid (PP3) — the mockup's grid, restored by D-PP-f.

   These rows are the 297 coded files already in the DB and Storage, selected by
   the D-PP-i predicate in the data layer, so this is the one surface that is
   fully live from day one.

   Downloads reuse the S6 server action unchanged: the storage path and bucket
   never reach the browser, the RPC behind the action re-checks is_approved, and
   the signed URL is minted AT CLICK TIME because it lives for 60 seconds — a
   URL minted at render would be dead by the time anyone pressed the button.

   The mockup's row also carried a "Preview file details" button; there is no
   preview modal in the new model, so the row's one control is the download and
   its screen-reader name carries the file title. */

const VISIBLE = 6;

const COPY = {
  title: "Templates",
  note: "Download the working files your team needs.",
  showFewer: "Show fewer templates",
} as const;

function PwTemplateRow({ template }: { template: PwTemplate }) {
  const [pending, startTransition] = React.useTransition();
  const { showToast } = usePwToast();

  /* aria-disabled, not disabled: a `disabled` button drops out of the a11y tree
     the instant it is pressed, so a keyboard user gets dumped back to the top of
     the document mid-download. This keeps focus where it was and guards the
     handler instead. */
  const onDownload = () => {
    if (pending) return;
    startTransition(async () => {
      const result = await getResourceDownloadUrl(template.id);
      if ("url" in result) {
        // The action asks for attachment disposition, so this downloads
        // without navigating away from the topic.
        window.location.assign(result.url);
      } else {
        showToast(result.error);
      }
    });
  };

  return (
    <article className="pw-template-row">
      <span className="pw-template-code">{template.code}</span>
      <span className="pw-template-title">{template.title}</span>
      <button
        type="button"
        className="pw-template-download"
        onClick={onDownload}
        aria-disabled={pending}
        aria-label={`Download ${template.title}`}
      >
        <Download className="pw-icon" aria-hidden="true" />
      </button>
    </article>
  );
}

export function PwTemplateGrid({
  topicSlug,
  templates,
}: {
  topicSlug: string;
  templates: PwTemplate[];
}) {
  const [expanded, setExpanded] = React.useState(false);

  const hasMore = templates.length > VISIBLE;
  const shown = hasMore && !expanded ? templates.slice(0, VISIBLE) : templates;
  const gridId = `templates-${topicSlug}`;

  return (
    <section className="pw-templates">
      <div className="pw-subhead">
        <div>
          <h4 className="pw-subhead-title">{COPY.title}</h4>
          <p className="pw-subhead-note">{COPY.note}</p>
        </div>
        <span className="pw-meta-pill">{templates.length} files</span>
      </div>

      <div className="pw-template-grid" id={gridId}>
        {shown.map((template) => (
          <PwTemplateRow key={template.id} template={template} />
        ))}
      </div>

      {hasMore ? (
        <button
          type="button"
          className="pw-action pw-action--secondary pw-show-more"
          aria-expanded={expanded}
          aria-controls={gridId}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded
            ? COPY.showFewer
            : `Show all ${templates.length} templates`}
          <ChevronDown className="pw-icon pw-chevron" aria-hidden="true" />
        </button>
      ) : null}
    </section>
  );
}
