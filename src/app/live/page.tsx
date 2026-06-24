import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Artwork } from "@/components/shared/artwork";
import { Reveal } from "@/components/motion/reveal";
import { SessionCard } from "@/components/shared/session-card";
import {
  getLiveSessions,
  groupSessions,
  filterByMode,
} from "@/lib/live/sessions";
import { LIVE_FILTERS } from "@/lib/live/types";

/* Live Programming (/live) — public listing. Copy verbatim from
   docs/page-copy/01-public-pages/live-programming.md; layout from
   docs/page-designs/public/Live.app.jsx (approved mockup, inspiration only).

   S9 9b wires the designed structure to real session data from
   public_programming_sessions() (the one anon-callable RPC, 0013) through the
   shared SessionCard, and makes the filter chips interactive via ?mode=. Each
   section renders its grid when populated and falls back to its approved empty
   state otherwise — so a feed with zero rows looks identical to Stage 0. The
   watch view (/live/[id]) arrives in 9c. */

export const metadata: Metadata = {
  title: "Live Programming",
  description:
    "The culture, live — and any time you like. Music, talks, performance, and food from Palestine Houses around the world. No account needed.",
};

type ActiveFilter = (typeof LIVE_FILTERS)[number];

/* Resolve the ?mode= chip to a known filter (case-insensitive), else "All". */
function resolveFilter(raw: string | string[] | undefined): ActiveFilter {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "All";
  return LIVE_FILTERS.find((f) => f.toLowerCase() === value.toLowerCase()) ?? "All";
}

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string | string[] }>;
}) {
  const { mode } = await searchParams;
  const filter = resolveFilter(mode);
  const { live, upcoming, past } = groupSessions(
    filterByMode(await getLiveSessions(), filter),
  );

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

      {/* Filter bar — links that filter the feed by category via ?mode= */}
      <section className="live-filterbar" aria-label="Browse by category">
        <div className="ph-container live-filter-inner">
          <span className="live-filter-label">
            <SlidersHorizontal size={16} aria-hidden="true" /> Browse
          </span>
          <div className="live-filter-tags">
            {LIVE_FILTERS.map((f) => {
              const isActive = f === filter;
              return (
                <Link
                  key={f}
                  href={f === "All" ? "/live" : `/live?mode=${f}`}
                  className={"live-filter-tag" + (isActive ? " is-active" : "")}
                  aria-current={isActive ? "page" : undefined}
                >
                  {f}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live now — section shows the grid only when something's on (copy rule);
          until then, the approved nothing-live line. */}
      <section className="ph-section">
        <div className="ph-container">
          {live.length > 0 ? (
            <Reveal>
              <div className="live-grid">
                {live.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            </Reveal>
          ) : (
            <Reveal>
              <p className="live-empty" style={{ marginTop: 0 }}>
                Nothing on right now — here’s what’s coming up.
              </p>
            </Reveal>
          )}
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
          {upcoming.length > 0 ? (
            <Reveal>
              <div className="live-grid">
                {upcoming.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            </Reveal>
          ) : (
            <Reveal>
              <p className="live-empty">
                No events scheduled yet. Watch a past recording while you wait.
              </p>
            </Reveal>
          )}
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
          {past.length > 0 ? (
            <Reveal>
              <div className="live-grid">
                {past.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            </Reveal>
          ) : (
            <Reveal>
              <p className="live-empty">
                Recordings will land here after our first events.
              </p>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}
