"use client";

import Image from "next/image";
import { m, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { PHOTO_SOURCES, type PhotoId } from "@/components/shared/photo";

/* DR3.1 — the /model "cultural embassy" gallery. A living stack of three House
   scenes — café, venue, community — that slowly shuffles: the front photo eases
   back and the next rises forward, on a calm loop (owner direction, 2026-07-07).

   This is the second sanctioned exception to DESIGN.md §8 "no auto-carousels"
   (after the Home marquee, D-DR1) — recorded as D-DR3.1. It stays in the
   editorial register: slow, eased, never a spring; it pauses on hover / focus /
   when the tab is hidden; and it collapses to a plain static stack under
   prefers-reduced-motion (belt-and-suspenders with the global kill-switch).

   Animated with m.* only — the tree runs under <LazyMotion strict> (providers). */

type Scene = { photo: PhotoId; label: string; alt: string };

const SCENES: Scene[] = [
  {
    photo: "ph-photo-embassy-cafe",
    label: "Café",
    alt: "A brass coffee pot and warm bread on a candlelit café table.",
  },
  {
    photo: "ph-photo-embassy-venue",
    label: "Venue",
    alt: "Guests seated together in the warm, arched room of a Palestine House.",
  },
  {
    photo: "ph-photo-embassy-community",
    label: "Community",
    alt: "People celebrating together on a warm evening at a Palestine House.",
  },
];

/* Depth slots (0 = front). The shuffle just re-assigns each card to a slot.
   zIndex is applied via `style` (discrete), never tweened. */
const SLOTS = [
  { y: 0, scale: 1, opacity: 1, zIndex: 30 },
  { y: 26, scale: 0.93, opacity: 1, zIndex: 20 },
  { y: 50, scale: 0.86, opacity: 0.88, zIndex: 10 },
] as const;

const pose = (s: (typeof SLOTS)[number]) => ({ y: s.y, scale: s.scale, opacity: s.opacity });

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const DWELL_MS = 3400;

export function EmbassyGallery() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [front, setFront] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || reduced || paused) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setFront((f) => (f + 1) % SCENES.length);
    }, DWELL_MS);
    return () => window.clearInterval(id);
  }, [mounted, reduced, paused]);

  /* First client render must match SSR (both: static deck, front 0) — only then
     do reduced-motion users swap to the flat stack. No hydration mismatch. */
  if (mounted && reduced) {
    return (
      <div className="embassy-gallery is-static" role="group" aria-label="Inside a Palestine House: café, venue, community">
        {SCENES.map((s) => (
          <figure key={s.photo} className="embassy-card">
            <Image src={PHOTO_SOURCES[s.photo]} alt={s.alt} fill sizes="(max-width: 880px) 90vw, 360px" className="embassy-card-img" />
            <figcaption className="embassy-card-label">{s.label}</figcaption>
          </figure>
        ))}
      </div>
    );
  }

  const animating = mounted && !reduced;

  return (
    <div
      className="embassy-gallery"
      role="group"
      aria-label="Inside a Palestine House: café, venue, community"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {SCENES.map((s, i) => {
        const slot = SLOTS[(i - front + SCENES.length) % SCENES.length];
        return (
          <m.figure
            key={s.photo}
            className="embassy-card"
            initial={pose(SLOTS[i])}
            animate={pose(animating ? slot : SLOTS[i])}
            transition={{ duration: 0.85, ease: EASE_OUT }}
            style={{ zIndex: (animating ? slot : SLOTS[i]).zIndex }}
          >
            <Image src={PHOTO_SOURCES[s.photo]} alt={s.alt} fill sizes="(max-width: 880px) 90vw, 360px" className="embassy-card-img" />
            <figcaption className="embassy-card-label">{s.label}</figcaption>
          </m.figure>
        );
      })}
    </div>
  );
}
