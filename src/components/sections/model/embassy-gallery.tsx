"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { PHOTO_SOURCES, type PhotoId } from "@/components/shared/photo";

/* DR3.1 — the /model "cultural embassy" collage. Three columns — café, venue,
   community — each a big image over a row of three thumbnails. Within every
   column the four photos slowly rotate through the slots (the featured photo
   eases to a thumbnail, the next rises to the feature spot), so the section
   feels alive (owner direction, 2026-07-07). Columns are phase-staggered so
   they don't move in lockstep.

   Second sanctioned exception to DESIGN.md §8 "no auto-carousels" (after the
   Home marquee, D-DR1) — recorded as D-DR3.1. Slow, cross-faded, pauses on
   hover / focus / hidden tab, and freezes to a static collage under
   prefers-reduced-motion (the global CSS kill-switch also stops the fades). */

type Column = {
  key: string;
  title: string;
  subtitle: string;
  photos: [PhotoId, PhotoId, PhotoId, PhotoId];
};

const COLUMNS: Column[] = [
  {
    key: "cafe",
    title: "A real café.",
    subtitle: "Rooted in Palestinian hospitality, food, and daily life.",
    photos: [
      "ph-photo-embassy-cafe-1",
      "ph-photo-embassy-cafe-2",
      "ph-photo-embassy-cafe-3",
      "ph-photo-embassy-cafe-4",
    ],
  },
  {
    key: "venue",
    title: "A real venue.",
    subtitle: "For art, music, film, literature, ideas, and gatherings.",
    photos: [
      "ph-photo-embassy-venue-1",
      "ph-photo-embassy-venue-2",
      "ph-photo-embassy-venue-3",
      "ph-photo-embassy-venue-4",
    ],
  },
  {
    key: "community",
    title: "A real community anchor.",
    subtitle: "Built for connection, reflection, and belonging.",
    photos: [
      "ph-photo-embassy-community-1",
      "ph-photo-embassy-community-2",
      "ph-photo-embassy-community-3",
      "ph-photo-embassy-community-4",
    ],
  },
];

const DWELL_MS = 3600;

/** A tatreez-flower flourish (copper), purely decorative. */
function Ornament({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 1.5l1.9 6.3 6.3-1.9-4.5 4.6 4.5 4.6-6.3-1.9L12 22.5l-1.9-6.3-6.3 1.9 4.5-4.6-4.5-4.6 6.3 1.9z"
        fill="currentColor"
      />
    </svg>
  );
}

/** One image slot: the four category photos stacked, only the active one shown
    (cross-fade via CSS opacity). Photos are decorative — the caption carries the
    meaning — so alt is empty and the group is labelled instead. */
function Slot({ photos, active, className }: { photos: PhotoId[]; active: number; className: string }) {
  return (
    <div className={className}>
      {photos.map((p, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={p}
          src={PHOTO_SOURCES[p]}
          alt=""
          loading="lazy"
          decoding="async"
          className={i === active ? "is-active" : undefined}
        />
      ))}
    </div>
  );
}

export function EmbassyGallery() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || reduced || paused) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setTick((t) => t + 1);
    }, DWELL_MS);
    return () => window.clearInterval(id);
  }, [mounted, reduced, paused]);

  const moving = mounted && !reduced;

  return (
    <div
      className="embassy"
      role="group"
      aria-label="Scenes from inside a Palestine House: a real café, a real venue, a real community anchor"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {COLUMNS.map((col, ci) => {
        // phase-stagger the columns so they don't rotate in lockstep
        const offset = moving ? (tick + ci) % 4 : 0;
        const big = offset % 4;
        const thumbs = [1, 2, 3].map((k) => (offset + k) % 4);
        return (
          <div className="embassy-col" key={col.key}>
            <Slot photos={col.photos} active={big} className="embassy-big" />
            <div className="embassy-thumbs">
              {thumbs.map((t, k) => (
                <Slot key={k} photos={col.photos} active={t} className="embassy-thumb" />
              ))}
            </div>
            <Ornament className="embassy-orn" />
            <h3 className="embassy-col-title">{col.title}</h3>
            <p className="embassy-col-sub">{col.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
