import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, ChevronRight, Info } from "lucide-react";
import { getMyProfile } from "@/lib/auth/profile";
import { getResources, getElements } from "@/lib/workspace/content";
import { PendingState } from "@/components/workspace/pending-state";
import { Stagger } from "@/components/motion/reveal";
import { HUB_TYPE_CHIPS, toResourceVM } from "@/lib/resources/view";
import { ResourceLibrary, DownloadButton } from "./resource-library";

/* /resources — the Resources hub (docs/page-copy/03-member-workspace/resources.md).
   One library for everything: the 2 featured booklets (public), focus-area
   cards that open each /resources/[category] slice (the copy's "Browse by focus
   area: Cards A–J"; the approved mockup used a dropdown — cards are chosen so
   the category route has a real entry point), and the full template list with a
   client-side type filter. Gated before any fetch (pending -> PendingState).
   Downloads are minted on demand by the Server Action (DownloadButton) — raw
   storage paths never reach the client. */

export const metadata: Metadata = { title: "Resources" };

// The two featured booklets — display title + description verbatim from
// resources.md (the DB titles read "Booklet A — …"); matched to the DB row by
// title so the real id drives the download.
const BOOKLET_COPY = [
  {
    match: "House Promise",
    title: "The House Promise",
    desc: "The idea and the model, in brief.",
  },
  {
    match: "Operating Model",
    title: "Operating Model & Governance",
    desc: "How a House is run and held to account.",
  },
];

export default async function ResourcesPage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PendingState />;

  const [resources, elements] = await Promise.all([
    getResources(),
    getElements(),
  ]);

  // Focus-area names (A–J) from the canonical element catalog.
  const areaName = new Map<string, string>();
  for (const e of elements) areaName.set(e.focus_area_code, e.focus_area_name);
  const areaCodes = Array.from(areaName.keys()).sort();

  const countByArea = new Map<string, number>();
  for (const r of resources) {
    if (r.focus_area_code) {
      countByArea.set(
        r.focus_area_code,
        (countByArea.get(r.focus_area_code) ?? 0) + 1,
      );
    }
  }

  // Featured booklets, matched to the locked display copy.
  const dbBooklets = resources.filter((r) => r.type === "booklet");
  const featured = BOOKLET_COPY.map((b) => {
    const row = dbBooklets.find((r) => r.title.includes(b.match));
    return row ? { id: row.id, title: b.title, desc: b.desc } : null;
  }).filter((b): b is { id: string; title: string; desc: string } => b !== null);

  const vms = resources.map((r) =>
    toResourceVM(r, r.focus_area_code ? areaName.get(r.focus_area_code) : null),
  );

  return (
    <div>
      <header className="ws-pagehead">
        <p className="ph-eyebrow">Resources</p>
        <h1 className="ws-h1">Everything, in one place.</h1>
        <p className="ws-lead">
          Every guide, template, and tool you need to build and run a House —
          sorted by focus area and type, ready to download.
        </p>
      </header>

      {featured.length > 0 && (
        <div style={{ marginTop: "var(--space-10)" }}>
          <Stagger className="res-booklets">
            {featured.map((b) => (
              <div className="res-booklet" key={b.id}>
                <span className="res-booklet-cover" aria-hidden="true">
                  <Bookmark size={22} />
                </span>
                <div className="res-booklet-body">
                  <div className="res-booklet-head">
                    <h2 className="res-booklet-title">{b.title}</h2>
                    <span className="res-booklet-badge">Booklet</span>
                  </div>
                  <p className="res-booklet-desc">{b.desc}</p>
                </div>
                <DownloadButton resourceId={b.id} />
              </div>
            ))}
          </Stagger>
        </div>
      )}

      <section style={{ marginTop: "var(--space-12)" }}>
        <h2 className="ws-section-h">Browse by focus area</h2>
        <div style={{ marginTop: "var(--space-4)" }}>
          <Stagger className="res-areas">
            {areaCodes.map((code) => (
              <Link
                className="res-area ws-lift"
                href={`/resources/${code.toLowerCase()}`}
                key={code}
              >
                <span className="topic-code">{code}</span>
                <span className="res-area-body">
                  <span className="res-area-name">{areaName.get(code)}</span>
                  <span className="res-area-count">
                    {countByArea.get(code) ?? 0} templates
                  </span>
                </span>
                <span className="topic-row-chev">
                  <ChevronRight size={16} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </Stagger>
        </div>
      </section>

      <section style={{ marginTop: "var(--space-12)" }}>
        <h2 className="ws-section-h" style={{ marginBottom: "var(--space-4)" }}>
          Browse by type
        </h2>
        <ResourceLibrary resources={vms} chips={HUB_TYPE_CHIPS} />
      </section>

      <p className="ws-help ws-help--mt-lg">
        <span className="ws-help-icon">
          <Info size={17} />
        </span>
        <span>
          Replace anything in [square brackets] with your House&rsquo;s details.
        </span>
      </p>
    </div>
  );
}
