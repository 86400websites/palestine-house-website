"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, ImageOff, PlayCircle } from "lucide-react";
import { usePwToast } from "@/components/workspace-v2/pw-toast";
import { PwStartCard } from "@/components/workspace-v2/pw-start-card";
import { PwTemplateGrid } from "@/components/workspace-v2/pw-template-grid";
import type { PwSectionSlug, PwTopic } from "@/lib/workspace-v2/types";

/* One focus-area card inside a toolkit group (PP3).

   The mockup's image-led card: a square photo beside the copy, with Explore and
   Watch Video beneath it, and a body that expands in place. Open state lives in
   the explorer above — only one topic is open at a time, matching the mockup —
   so this component stays presentational apart from its own toast.

   D-PP-f: the summary is the topic's own description + intro. There is no
   Overview card, no checklist card, no watch-out card and no extras block.

   Ids are the deep-link contract: `topic-<slug>` is what /setup#topic-<slug>
   resolves to, and `explore-<slug>` is what focus returns to on Back. */

const VIDEO_SOON = "Video coming soon.";

/* The photo is decorative — the h3 beside it carries the meaning — so it is
   aria-hidden with an empty alt. */
function TopicImage({ topic }: { topic: PwTopic }) {
  if (!topic.imagePath) {
    /* All 33 topics ship an image, so this is insurance against a future CMS
       gap. It stays quiet: a textured panel, no invented copy. */
    return (
      <span className="pw-topic-image is-placeholder" aria-hidden="true">
        <span className="pw-topic-placeholder-icon">
          <ImageOff className="pw-icon" />
        </span>
      </span>
    );
  }

  return (
    <span
      className="pw-topic-image"
      aria-hidden="true"
      style={
        {
          "--pw-topic-position": topic.imagePosition ?? "50% 50%",
        } as React.CSSProperties
      }
    >
      <Image
        src={topic.imagePath}
        alt=""
        fill
        sizes="(max-width: 760px) 100vw, 320px"
      />
    </span>
  );
}

export function PwTopicCard({
  section,
  topic,
  open,
  flash,
  onToggle,
}: {
  /* Carried down from the page rather than derived from the URL in the
     browser: the reader link must be right in the server-rendered HTML, and
     the page already knows which section it is (PP4 4d). */
  section: PwSectionSlug;
  topic: PwTopic;
  open: boolean;
  flash: boolean;
  onToggle: (slug: string) => void;
}) {
  const { showToast } = usePwToast();
  /* Local, and deliberately independent of the card's Explore state — See More
     discloses a few sentences of summary; Explore opens the guide and templates
     below it. */
  const [moreOpen, setMoreOpen] = useState(false);

  const titleId = `topic-${topic.slug}-title`;
  const bodyId = `topic-${topic.slug}-body`;
  const introId = `topic-${topic.slug}-intro`;

  return (
    <article
      className={`pw-topic${open ? " is-open" : ""}${flash ? " is-flash" : ""}`}
      id={`topic-${topic.slug}`}
    >
      <div className="pw-topic-head" role="group" aria-labelledby={titleId}>
        <TopicImage topic={topic} />

        <div className="pw-topic-copy">
          {/* tabIndex -1 so a deep link can move focus here: arriving at
              /setup#topic-x should land a keyboard or screen-reader user on the
              focus area they asked for, not at the top of the page. */}
          <h3 className="pw-topic-title" id={titleId} tabIndex={-1}>
            {topic.title}
          </h3>
          {topic.description ? (
            <p className="pw-topic-desc">{topic.description}</p>
          ) : null}

          {/* SEE MORE (PP7, owner request 2026-08-16). The card shows the
              Overview's opening sentence; the rest expands in place.

              `introHtml` is already sanitized server-side — it is markdown in
              the database, carrying bullet lists and a bold goal line, so it
              cannot be rendered as a string here. See PwTopic.introHtml.

              Deliberately independent of `open`: this discloses a few sentences
              of summary, while Explore opens the guide and templates below. A
              partner can read the whole summary without committing to opening
              the focus area. */}
          {topic.introHtml ? (
            <>
              <button
                type="button"
                className="pw-topic-more"
                aria-expanded={moreOpen}
                aria-controls={introId}
                onClick={() => setMoreOpen((v) => !v)}
              >
                {moreOpen ? "See less" : "See more"}
                <ChevronDown className="pw-icon" aria-hidden="true" />
              </button>
              <div
                className="pw-topic-summary"
                id={introId}
                hidden={!moreOpen}
                dangerouslySetInnerHTML={{ __html: topic.introHtml }}
              />
            </>
          ) : null}

          <div className="pw-topic-actions">
            <button
              type="button"
              id={`explore-${topic.slug}`}
              className="pw-topic-action"
              aria-expanded={open}
              aria-controls={bodyId}
              aria-label={
                open
                  ? `Back to Main Menu from ${topic.title}`
                  : `Explore ${topic.title}`
              }
              onClick={() => onToggle(topic.slug)}
            >
              {open ? (
                <>
                  <ArrowLeft className="pw-icon" aria-hidden="true" />
                  <span>Back to Main Menu</span>
                </>
              ) : (
                <>
                  <span>Explore</span>
                  <ArrowRight className="pw-icon" aria-hidden="true" />
                </>
              )}
            </button>

            {/* youtube_url is NULL on every topic until PP6's CMS adds one, so
                today this always toasts. When a URL exists it is already
                validated http(s) at the data layer. */}
            {topic.youtubeUrl ? (
              <a
                className="pw-topic-video"
                href={topic.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Watch Video
                <PlayCircle className="pw-icon" aria-hidden="true" />
              </a>
            ) : (
              <button
                type="button"
                className="pw-topic-video"
                onClick={() => showToast(VIDEO_SOON)}
              >
                Watch Video
                <PlayCircle className="pw-icon" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="pw-topic-body" id={bodyId} hidden={!open}>
        <div className="pw-topic-content">
          {/* Always rendered: every topic has a Simple guide body — PP4 4c gave
              it a page and 4d links to it here, though PP6 has yet to attach a
              downloadable file. */}
          <PwStartCard section={section} topic={topic} />
          {topic.templates.length > 0 ? (
            <PwTemplateGrid
              topicSlug={topic.slug}
              templates={topic.templates}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}
