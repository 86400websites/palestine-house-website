"use client";

import * as React from "react";
import {
  Calendar,
  ChevronDown,
  Compass,
  House,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import type { PwGroup, PwSectionSlug } from "@/lib/workspace-v2/types";
import { PwTopicCard } from "@/components/workspace-v2/pw-topic-card";

/* The toolkit explorer (PP3) — the accordion of groups that fills a section
   page under its hero.

   Client-side because the groups open and close; the content itself is
   server-rendered and passed in, so nothing about a topic is fetched from the
   browser and no gated read happens here.

   Group state follows the mockup exactly: the first group starts open and each
   toggle is independent, so a partner can have several open at once. The
   disclosure is a real <button aria-expanded> inside a heading (the ARIA
   accordion pattern), and the panel is hidden with the `hidden` attribute
   rather than a CSS class — the accessibility tree and the visual state cannot
   drift apart that way, and the chevron rotates off the same aria-expanded.

   Deliberately absent: the per-page search box. The mockup keeps CSS and a
   localSearch() function for one, but no render function emits its markup, so
   it never shipped — search arrives once, as PP4's global overlay (D-PP-g). */

/* The mockup gives every group in a section the section's own icon. */
const SECTION_ICON: Record<PwSectionSlug, LucideIcon> = {
  setup: Compass,
  operate: House,
  program: Calendar,
  support: LifeBuoy,
};

export function PwSectionExplorer({
  section,
  groups,
}: {
  section: PwSectionSlug;
  groups: PwGroup[];
}) {
  const [openGroups, setOpenGroups] = React.useState<ReadonlySet<string>>(
    () => new Set(groups.length > 0 ? [groups[0].id] : []),
  );

  const toggleGroup = React.useCallback((id: string) => {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  const GroupIcon = SECTION_ICON[section];

  return (
    <section className="pw-toolkit">
      <div className="pw-container">
        <div className="pw-toolkit-shell">
          <div className="pw-toolkit-body">
            {groups.map((group) => {
              const open = openGroups.has(group.id);
              const panelId = `pw-group-${group.slug}`;
              const count = group.topics.length;

              return (
                <section className="pw-group" key={group.id}>
                  <h2 className="pw-group-heading">
                    <button
                      type="button"
                      className="pw-group-toggle"
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => toggleGroup(group.id)}
                    >
                      <span className="pw-group-icon">
                        <GroupIcon className="pw-icon" aria-hidden="true" />
                      </span>
                      <span className="pw-group-copy">
                        <span className="pw-group-title">{group.name}</span>
                        {group.description ? (
                          <span className="pw-group-desc">
                            {group.description}
                          </span>
                        ) : null}
                      </span>
                      <span className="pw-group-meta">
                        <span>
                          {count} Focus Area{count === 1 ? "" : "s"}
                        </span>
                        <ChevronDown
                          className="pw-icon pw-chevron"
                          aria-hidden="true"
                        />
                      </span>
                    </button>
                  </h2>

                  <div className="pw-group-content" id={panelId} hidden={!open}>
                    <div className="pw-topics">
                      {group.topics.map((topic) => (
                        <PwTopicCard key={topic.id} topic={topic} />
                      ))}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
