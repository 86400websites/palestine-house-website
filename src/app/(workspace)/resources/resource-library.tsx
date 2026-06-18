"use client";

import * as React from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getResourceDownloadUrl } from "@/lib/resources/actions";
import type { ResourceVM } from "@/lib/resources/view";

/* Client pieces for the Resources hub + category pages (S6 6e):
   - DownloadButton: on click, asks the Server Action for a fresh URL (signed
     for templates, public for booklets) and triggers the download. The signed
     URL is short-lived, so it MUST be minted at click time, not at render.
   - ResourceLibrary: the type-filter tag rail + filtered rows. Reused by the
     hub (all templates, includes the Booklets chip) and by a category page
     (one focus area's templates). Filtering is client-side, matching the
     mockup's instant filter. */

export function DownloadButton({ resourceId }: { resourceId: string }) {
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      const res = await getResourceDownloadUrl(resourceId);
      if ("url" in res) {
        // Attachment disposition (download param) → the browser downloads
        // without navigating away from the page.
        window.location.assign(res.url);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <span className="res-download">
      <Button
        variant="secondary"
        size="sm"
        onClick={onClick}
        disabled={pending}
      >
        <Download size={16} aria-hidden="true" />
        {pending ? "Preparing…" : "Download"}
      </Button>
      {error && (
        <span className="res-download-error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}

const ALL = "All";

export function ResourceLibrary({
  resources,
  chips,
}: {
  resources: ResourceVM[];
  chips: string[];
}) {
  const [active, setActive] = React.useState<string>(ALL);

  // "All" shows every downloadable except booklets (they are featured up top on
  // the hub, and never present on a category page); a specific chip matches by
  // display label, so the "Booklets" chip surfaces the booklets in the rows.
  const rows = resources.filter((r) =>
    active === ALL ? r.type !== "booklet" : r.typeLabel === active,
  );

  return (
    <div>
      <div className="ws-tagrail" role="group" aria-label="Browse by type">
        {[ALL, ...chips].map((c) => (
          <button
            key={c}
            type="button"
            className={`ws-tag${active === c ? " is-active" : ""}`}
            aria-pressed={active === c}
            onClick={() => setActive(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {rows.length ? (
        <div className="ws-rows" style={{ marginTop: "var(--space-5)" }}>
          {rows.map((r) => (
            <div className="ws-templaterow" key={r.id}>
              <span className="ws-templaterow-icon" aria-hidden="true">
                <FileText size={18} />
              </span>
              <div className="ws-templaterow-body">
                <p className="ws-templaterow-title">{r.title}</p>
                <p className="ws-templaterow-meta">
                  {r.areaLabel ? `${r.areaLabel} · ` : ""}
                  {r.typeLabel} · {r.version}
                </p>
              </div>
              <DownloadButton resourceId={r.id} />
            </div>
          ))}
        </div>
      ) : (
        <div className="ws-empty" style={{ marginTop: "var(--space-5)" }}>
          <p style={{ margin: 0 }}>Nothing matches that filter.</p>
        </div>
      )}
    </div>
  );
}
