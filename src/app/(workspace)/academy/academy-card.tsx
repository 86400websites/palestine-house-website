"use client";

import * as React from "react";
import { Play } from "lucide-react";
import { youTubeEmbedUrl } from "@/lib/live/youtube";
import { sampleVideoUrl } from "@/lib/workspace/sample-videos";
import type { AcademyRow } from "@/lib/workspace/types";

/* One Videos card (S10 10-5 + 10-8). The video plays INSIDE the site — a click
   swaps the thumbnail for the privacy-enhanced youtube-nocookie embed (the only
   origin the CSP frame-src allows), no leaving the page. A real youtube_url
   wins; otherwise a clearly-marked neutral "Sample" clip fills it. */

export function AcademyCard({ module: m }: { module: AcademyRow }) {
  const [playing, setPlaying] = React.useState(false);
  // A valid real youtube_url wins; an absent OR malformed one falls back to a
  // clearly-marked sample, so a typo'd real URL never becomes a dead card.
  const realEmbed = youTubeEmbedUrl(m.youtube_url);
  const isSample = !realEmbed;
  const embed = realEmbed ?? youTubeEmbedUrl(sampleVideoUrl(m.element_code));

  return (
    <div className="vid-card">
      {playing && embed ? (
        <div className="vid-frame">
          <iframe
            src={`${embed}?autoplay=1`}
            title={m.title}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <button
          type="button"
          className="vid-thumb"
          onClick={() => setPlaying(true)}
          aria-label={`Play: ${m.title}`}
          disabled={!embed}
        >
          <span className="vid-play" aria-hidden="true">
            <Play size={20} />
          </span>
          {isSample ? (
            <span className="vid-tag">Sample</span>
          ) : (
            m.length && <span className="vid-runtime">{m.length}</span>
          )}
        </button>
      )}
      <div className="vid-body">
        <span className="vid-title">{m.title}</span>
        {m.one_line && <span className="vid-line">{m.one_line}</span>}
      </div>
    </div>
  );
}
