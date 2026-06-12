import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";
import { Artwork } from "@/components/shared/artwork";
import { Reveal } from "@/components/motion/reveal";

/* Live Programming (/live) — public listing. Copy verbatim from
   docs/page-copy/01-public-pages/live-programming.md; layout from
   docs/page-designs/public/Live.app.jsx (approved mockup).

   Stage 0 renders the designed structure with the three approved empty
   states — session data (programming_sessions) and the watch view arrive
   in S7; the mockup's session cards are fictional demo data and are
   deliberately not shipped. The filter chips become interactive with
   real data in S7. */

export const metadata: Metadata = {
  title: "Live Programming",
  description:
    "The culture, live — and any time you like. Music, talks, performance, and food from Palestine Houses around the world. No account needed.",
};

const LIVE_FILTERS = ["All", "Music", "Talks", "Performance", "Food"] as const;

export default function LivePage() {
  return (
    <>
      {/* 1 — Art-led hero */}
      <section className="art-hero live-hero">
        <div className="ph-container art-hero-grid">
          <Reveal className="art-hero-copy">
            <p className="ph-eyebrow">Live programming</p>
            <h1>The culture, live — and any time you like.</h1>
            <p className="ph-lead">
              Music, talks, performance, and food from Palestine Houses around
              the world. Watch as it happens, or catch the recording later. No
              account needed.
            </p>
          </Reveal>
          <Reveal className="art-hero-art">
            <Artwork
              assetId="PH-LIVE-02"
              alt="An ink-wash illustration of a poet reading to a seated audience under the vaulted arches of a House."
              ratio="16 / 11"
              sizes="(max-width: 900px) 100vw, 55vw"
              priority
            />
          </Reveal>
        </div>
      </section>

      {/* Filter bar — interactive with real data in S7 */}
      <section className="live-filterbar" aria-label="Browse by category">
        <div className="ph-container live-filter-inner">
          <span className="live-filter-label">
            <SlidersHorizontal size={16} aria-hidden="true" /> Browse
          </span>
          <div className="live-filter-tags">
            {LIVE_FILTERS.map((f) => (
              <span
                key={f}
                className={
                  "live-filter-tag" + (f === "All" ? " is-active" : "")
                }
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Live now — section appears only when something's on (copy rule);
          until then, the approved nothing-live line. */}
      <section className="ph-section">
        <div className="ph-container">
          <Reveal>
            <p className="live-empty" style={{ marginTop: 0 }}>
              Nothing on right now — here’s what’s coming up.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Upcoming */}
      <section className="ph-section ph-section-dark">
        <div className="ph-container">
          <Reveal className="live-sec-head">
            <div>
              <p className="ph-eyebrow">On the calendar</p>
              <h2>Upcoming.</h2>
            </div>
          </Reveal>
          <Reveal>
            <p className="live-empty">
              No events scheduled yet. Watch a past recording while you wait.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Past recordings */}
      <section className="ph-section-lg">
        <div className="ph-container">
          <Reveal className="live-sec-head">
            <div>
              <p className="ph-eyebrow">Watch any time</p>
              <h2>Past recordings.</h2>
            </div>
          </Reveal>
          <Reveal>
            <p className="live-empty">
              Recordings will land here after our first events.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
