import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { getMyProfile } from "@/lib/auth/profile";
import { PendingState } from "@/components/workspace/pending-state";
import { SessionCard, StatusBadge } from "@/components/shared/session-card";
import {
  getLiveSessions,
  groupSessions,
  filterByMode,
} from "@/lib/live/sessions";
import { LIVE_FILTERS } from "@/lib/live/types";
import { formatSessionWhen } from "@/lib/live/format";
import { ProgrammingForm } from "./programming-form";
import { DeleteSessionButton } from "./delete-session-button";

/* /live — the members-only Live hub (LH1). One gated page for the whole
   feature: an approved partner watches what other Houses are streaming and
   recording (play a session in your own House on a quiet night) AND publishes
   its own sessions from the same place (the old /programming tool folded in).

   Gating: the (workspace) layout redirects signed-out visitors; this page then
   requires approval — a pending partner sees the standard PendingState, and the
   member_programming_sessions() RPC (0025) independently returns them zero rows
   even if called directly. Nothing here is reachable or indexable publicly.

   Structure: page head + "Publish a session" anchor → Live now (rendered only
   when something is on air — absence IS the empty state) → Browse chips
   (?mode=, filters Upcoming + Recordings) → Upcoming → Recordings → the
   "Your sessions" publish/manage area (#publish). New strings follow brand
   voice; the Upcoming heading + the filter-empty line carry over from the
   retired public page. */

export const metadata: Metadata = { title: "Live Programming" };

type ActiveFilter = (typeof LIVE_FILTERS)[number];

/* Resolve the ?mode= chip to a known filter (case-insensitive), else "All". */
function resolveFilter(raw: string | string[] | undefined): ActiveFilter {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "All";
  return LIVE_FILTERS.find((f) => f.toLowerCase() === value.toLowerCase()) ?? "All";
}

export default async function LiveHubPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string | string[]; edit?: string | string[] }>;
}) {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PendingState contactFallback />;

  const { mode, edit } = await searchParams;
  const filter = resolveFilter(mode);
  const sessions = await getLiveSessions();

  // What's on air is on air — the Live now row ignores the category filter.
  const liveNow = groupSessions(sessions).live;
  const { upcoming, past } = groupSessions(filterByMode(sessions, filter));
  const noneForFilter =
    filter !== "All" && upcoming.length + past.length === 0;

  const mine = sessions.filter((s) => s.is_mine);
  const editId = Array.isArray(edit) ? edit[0] : edit;
  const editing = editId ? (mine.find((s) => s.id === editId) ?? null) : null;

  return (
    <div className="live-hub">
      <header className="ws-pagehead">
        <p className="ph-eyebrow">The network, live</p>
        <h1 className="ws-h1">Live Programming</h1>
        <p className="ws-lead">
          What Houses around the world are streaming and recording — and where
          you publish your own.
        </p>
      </header>
      <div className="live-hub-actions">
        <Button asChild>
          <a href="#publish">Publish a session</a>
        </Button>
      </div>

      {/* Live now — only when something's on air; absence IS the state. */}
      {liveNow.length > 0 && (
        <section className="live-hub-sec" aria-label="Live now">
          <Reveal className="live-sec-head">
            <div>
              <p className="ph-eyebrow">On air</p>
              <h2 className="live-hub-h2">Live now.</h2>
            </div>
          </Reveal>
          <Reveal>
            <div className="live-grid">
              {liveNow.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* Browse chips — filter Upcoming + Recordings via ?mode= */}
      <div className="live-hub-browse" aria-label="Browse by category">
        <span className="live-filter-label">
          <SlidersHorizontal size={16} aria-hidden="true" /> Browse
        </span>
        <div className="live-filter-tags">
          {LIVE_FILTERS.map((f) => {
            const isActive = f === filter;
            return (
              <Link
                key={f}
                href={
                  f === "All" ? "/live" : `/live?mode=${encodeURIComponent(f)}`
                }
                className={"live-filter-tag" + (isActive ? " is-active" : "")}
                aria-current={isActive ? "page" : undefined}
              >
                {f}
              </Link>
            );
          })}
        </div>
      </div>

      {noneForFilter ? (
        <Reveal>
          <p className="live-empty">
            Nothing in {filter} right now —{" "}
            <Link href="/live">see everything that’s on</Link>.
          </p>
        </Reveal>
      ) : (
        <>
          {/* Upcoming */}
          <section className="live-hub-sec" aria-label="Upcoming">
            <Reveal className="live-sec-head">
              <div>
                <p className="ph-eyebrow">On the calendar</p>
                <h2 className="live-hub-h2">Upcoming.</h2>
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
                  Nothing on the calendar yet. When a House schedules a
                  session, it lands here.
                </p>
              </Reveal>
            )}
          </section>

          {/* Recordings */}
          <section className="live-hub-sec" aria-label="Recordings">
            <Reveal className="live-sec-head">
              <div>
                <p className="ph-eyebrow">Watch any time</p>
                <h2 className="live-hub-h2">Recordings.</h2>
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
                  No recordings yet — the first House to publish opens the
                  library.
                </p>
              </Reveal>
            )}
          </section>
        </>
      )}

      {/* Your sessions — publish + manage (the old /programming tool) */}
      <section id="publish" className="live-hub-sec live-hub-publish">
        <Reveal className="live-sec-head">
          <div>
            <p className="ph-eyebrow">Your House</p>
            <h2 className="live-hub-h2">Your sessions.</h2>
          </div>
        </Reveal>

        <div className="live-hub-form">
          <h3 className="live-hub-form-h">
            {editing ? "Edit session" : "Publish a session"}
          </h3>
          <ProgrammingForm key={editing?.id ?? "new"} initial={editing} />
        </div>

        {mine.length === 0 ? (
          <p className="live-empty">
            You haven’t published anything yet. Paste a YouTube link above — it
            takes about a minute.
          </p>
        ) : (
          <div className="live-mine-list">
            {mine.map((s) => {
              const meta = [s.venue, formatSessionWhen(s.starts_at)]
                .filter(Boolean)
                .join(" · ");
              return (
                <div key={s.id} className="ws-card live-mine-row">
                  <div className="live-mine-row-main">
                    <div className="live-mine-row-tags">
                      <StatusBadge status={s.status} />
                      {s.mode ? <span className="live-tag">{s.mode}</span> : null}
                    </div>
                    <h4 className="live-mine-row-h">{s.title}</h4>
                    {meta ? (
                      <p className="live-card-meta live-mine-row-meta">{meta}</p>
                    ) : null}
                  </div>
                  <div className="live-mine-row-actions">
                    <Button asChild variant="secondary" size="sm">
                      <Link
                        href={`/live?edit=${s.id}#publish`}
                        aria-label={`Edit ${s.title}`}
                      >
                        Edit
                      </Link>
                    </Button>
                    <DeleteSessionButton id={s.id} title={s.title} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
