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

   One topic is open at a time, as in the mockup, so opening a second collapses
   the first and the page stays scannable.

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

const TOPIC_HASH = "#topic-";
const FLASH_MS = 1200;

/* An explicit `behavior: "smooth"` overrides the CSS scroll-behavior rule, so
   the reduced-motion block at the end of workspace-v2.css cannot reach this
   one — the preference has to be read here. */
function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

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
  const [openTopic, setOpenTopic] = React.useState<string | null>(null);
  const [flashTopic, setFlashTopic] = React.useState<string | null>(null);

  /* Work queued during an event and performed after the DOM has caught up with
     the new state — a card cannot be scrolled to or focused while its panel is
     still hidden. */
  const pendingScroll = React.useRef<{
    slug: string;
    block: ScrollLogicalPosition;
  } | null>(null);
  const pendingFocus = React.useRef<{ id: string } | null>(null);

  const groupIdByTopic = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const group of groups) {
      for (const topic of group.topics) map.set(topic.slug, group.id);
    }
    return map;
  }, [groups]);

  const toggleGroup = React.useCallback((id: string) => {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  /* The URL always names the open topic, so a partner can copy the address bar
     and send someone straight to it. replaceState rather than pushState: the
     link is the point, and Back should leave the section rather than unwind a
     trail of card openings. */
  const writeHash = React.useCallback((slug: string | null) => {
    const url = slug
      ? `${TOPIC_HASH}${encodeURIComponent(slug)}`
      : window.location.pathname + window.location.search;
    window.history.replaceState(null, "", url);
  }, []);

  const openTopicBySlug = React.useCallback(
    (slug: string, { flash = false } = {}) => {
      const groupId = groupIdByTopic.get(slug);
      if (!groupId) return;

      setOpenGroups((current) =>
        current.has(groupId) ? current : new Set(current).add(groupId),
      );
      setOpenTopic(slug);
      if (flash) {
        setFlashTopic(slug);
        /* Arriving from a link: the flash says "this one" visually, so focus has
           to say it too, or a keyboard user lands at the top of the page. */
        pendingFocus.current = { id: `topic-${slug}-title` };
      }
      pendingScroll.current = { slug, block: "start" };
      writeHash(slug);
    },
    [groupIdByTopic, writeHash],
  );

  const toggleTopic = React.useCallback(
    (slug: string) => {
      if (openTopic === slug) {
        setOpenTopic(null);
        /* Closing collapses a tall panel, so the card can end up off-screen and
           the control that was just pressed would be lost. Bring it back to the
           middle and hand focus to it. */
        pendingScroll.current = { slug, block: "center" };
        pendingFocus.current = { id: `explore-${slug}` };
        writeHash(null);
        return;
      }
      openTopicBySlug(slug);
    },
    [openTopic, openTopicBySlug, writeHash],
  );

  React.useEffect(() => {
    const scroll = pendingScroll.current;
    if (scroll) {
      pendingScroll.current = null;
      document
        .getElementById(`topic-${scroll.slug}`)
        ?.scrollIntoView({ behavior: scrollBehavior(), block: scroll.block });
    }

    const focus = pendingFocus.current;
    if (focus) {
      pendingFocus.current = null;
      document.getElementById(focus.id)?.focus({ preventScroll: true });
    }
  });

  /* Deep links: /setup#topic-<slug> opens the topic's group, expands the card,
     scrolls to it and flashes it once. Also runs on hashchange, so a link to
     another topic on the same page works without a reload. */
  React.useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash;
      if (!hash.startsWith(TOPIC_HASH)) return;
      const slug = decodeURIComponent(hash.slice(TOPIC_HASH.length));
      openTopicBySlug(slug, { flash: true });
    };

    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [openTopicBySlug]);

  React.useEffect(() => {
    if (!flashTopic) return;
    const timer = window.setTimeout(() => setFlashTopic(null), FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [flashTopic]);

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
                        <PwTopicCard
                          key={topic.id}
                          topic={topic}
                          open={openTopic === topic.slug}
                          flash={flashTopic === topic.slug}
                          onToggle={toggleTopic}
                        />
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
