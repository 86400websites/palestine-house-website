"use client";

import * as React from "react";
import { ChevronDown, Download } from "lucide-react";
import { getResourceDownloadUrl } from "@/lib/resources/actions";
import { usePwToast } from "@/components/workspace-v2/pw-toast";
import { DOWNLOAD_LABEL, type PwFileKind } from "@/lib/workspace-v2/shared-resources";
import type { PwSharedTemplate, PwTemplate } from "@/lib/workspace-v2/types";

/* A topic's downloads (PP3, widened at CR1) — the mockup's grid, restored by D-PP-f,
   now holding the supplied Word documents, the logo and the editable layouts.

   These rows are selected by the D-PP-i predicate in the data layer. Downloads reuse
   the S6 server action unchanged: the storage path and bucket never reach the
   browser, the RPC behind the action re-checks is_approved, and the signed URL is
   minted AT CLICK TIME because it lives for 60 seconds — a URL minted at render
   would be dead by the time anyone pressed the button.

   The mockup's row also carried a "Preview file details" button; there is no
   preview modal in the new model, so the row's one control is the download and
   its screen-reader name carries the file title. */

const VISIBLE = 6;

const COPY = {
  title: "Templates",
  note: "Download the working files your team needs.",
  showFewer: "Show fewer templates",
  overview: "Overview",
  shared: "Shared resources from other focus areas",
} as const;

function PwResourceRow({
  id,
  badge,
  title,
  kind,
  context,
}: {
  id: string;
  badge: string;
  title: string;
  kind: PwFileKind;
  /* Said to a screen reader after the title: where a shared file lives. */
  context?: string;
}) {
  const [pending, startTransition] = React.useTransition();
  const { showToast } = usePwToast();
  const label = DOWNLOAD_LABEL[kind];

  /* aria-disabled, not disabled: a `disabled` button drops out of the a11y tree
     the instant it is pressed, so a keyboard user gets dumped back to the top of
     the document mid-download. This keeps focus where it was and guards the
     handler instead. */
  const onDownload = () => {
    if (pending) return;
    startTransition(async () => {
      const result = await getResourceDownloadUrl(id);
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
      <span className="pw-template-code">{badge}</span>
      <span className="pw-template-title">
        {title}
        <span className="pw-template-kind">{label}</span>
      </span>
      <button
        type="button"
        className="pw-template-download"
        onClick={onDownload}
        aria-disabled={pending}
        aria-label={`${label}: ${title}${context ? ` (${context})` : ""}`}
      >
        <Download className="pw-icon" aria-hidden="true" />
      </button>
    </article>
  );
}

/* The focus area's Overview document. A download, deliberately not a card: D-PP-f's
   single Simple Guide card stays the one card on the panel. */
export function PwOverviewFile({
  overview,
}: {
  overview: { id: string; title: string };
}) {
  return (
    <section className="pw-overview-file">
      <div className="pw-subhead">
        <h4 className="pw-subhead-title">{COPY.overview}</h4>
      </div>
      <div className="pw-template-grid">
        <PwResourceRow
          id={overview.id}
          badge="OV"
          title={overview.title}
          kind="word"
        />
      </div>
    </section>
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
        <span className="pw-meta-pill">
          {templates.length} {templates.length === 1 ? "file" : "files"}
        </span>
      </div>

      <div className="pw-template-grid" id={gridId}>
        {shown.map((template) => (
          <PwResourceRow
            key={template.id}
            id={template.id}
            badge={template.code}
            title={template.title}
            kind={template.kind}
          />
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

/* Files that live on another focus area's card. The badge is that focus area's own
   number, as the documents refer to it ("Program 3.2"); the row is the same file. */
export function PwSharedTemplates({
  templates,
}: {
  templates: PwSharedTemplate[];
}) {
  return (
    <section className="pw-templates">
      <div className="pw-subhead">
        <h4 className="pw-subhead-title">{COPY.shared}</h4>
      </div>
      <div className="pw-template-grid">
        {templates.map((template) => (
          <PwResourceRow
            key={template.id}
            id={template.id}
            badge={template.homeNumber}
            title={template.title}
            kind={template.kind}
            context={template.homeTitle}
          />
        ))}
      </div>
    </section>
  );
}
