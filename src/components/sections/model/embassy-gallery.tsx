import { PHOTO_SOURCES, type PhotoId } from "@/components/shared/photo";

/* DR3.1 — the /model "cultural embassy" collage. Three columns — café, venue,
   community — each a big image over a row of three thumbnails.

   DR3.1.1 (owner, 2026-07-08): the auto-rotating cross-fade was removed — this is
   now a STATIC collage (the first photo is the hero, the other three are the
   thumbnails), so the D-DR3.1 auto-motion exception no longer applies and the
   images sit at fixed cover-crops. Purely decorative — the captions carry the
   meaning — so alt is empty and the group is labelled instead. */

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
    // portrait shot first so the hero fills the 4/5 frame like café/community
    photos: [
      "ph-photo-embassy-venue-3",
      "ph-photo-embassy-venue-1",
      "ph-photo-embassy-venue-2",
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

/** A tatreez-flower rosette (copper), purely decorative — matches the owner's
    section reference (DR3.1.1): eight petals around a center. */
function Ornament({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g fill="currentColor">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path
            key={a}
            d="M12 12 C 10.2 8.6, 10.2 4.9, 12 3.4 C 13.8 4.9, 13.8 8.6, 12 12 Z"
            transform={`rotate(${a} 12 12)`}
          />
        ))}
        <circle cx="12" cy="12" r="1.5" />
      </g>
    </svg>
  );
}

export function EmbassyGallery() {
  return (
    <div
      className="embassy"
      role="group"
      aria-label="Scenes from inside a Palestine House: a real café, a real venue, a real community anchor"
    >
      {COLUMNS.map((col) => (
        <div className="embassy-col" key={col.key}>
          <div className="embassy-big">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative collage */}
            <img src={PHOTO_SOURCES[col.photos[0]]} alt="" loading="lazy" decoding="async" />
          </div>
          <div className="embassy-thumbs">
            {col.photos.slice(1).map((p) => (
              <div className="embassy-thumb" key={p}>
                {/* eslint-disable-next-line @next/next/no-img-element -- decorative collage */}
                <img src={PHOTO_SOURCES[p]} alt="" loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
          <Ornament className="embassy-orn" />
          <h3 className="embassy-col-title">{col.title}</h3>
          <p className="embassy-col-sub">{col.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
