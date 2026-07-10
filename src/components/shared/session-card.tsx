import Link from "next/link";
import { ArrowRight, CalendarClock, Play, Radio } from "lucide-react";
import type { LiveSession, LiveStatus } from "@/lib/live/types";
import { formatSessionWhen } from "@/lib/live/format";
import { youTubeEmbedUrl } from "@/lib/live/youtube";

/* The ONE shared session card (DESIGN §6) — used across the members-only Live
   hub grids (LH1); never a second implementation. It renders a LiveSession
   (S9 9a) into the Stage-0 `.live-card` recipe and links to the /live/[id]
   watch view. A "Yours" tag marks the caller's own sessions (is_mine, derived
   server-side by the 0025 RPC). A Server Component: no interactivity, so date
   formatting stays server-side and hydration-safe.

   Covers are deferred in S9 (no partner Storage bucket yet — D-S9-a follow-up),
   so cards render text-first; the cover-thumb slot lands when uploads ship. */

const STATUS_BADGE: Record<
  LiveStatus,
  { label: string; className: string; Icon: typeof Radio }
> = {
  live: { label: "Live now", className: "live-chip-live", Icon: Radio },
  scheduled: { label: "Upcoming", className: "live-pill", Icon: CalendarClock },
  past: { label: "Recording", className: "live-tag", Icon: Play },
};

/* Status as colour AND text AND icon — never colour alone (DESIGN §6/§11). */
export function StatusBadge({ status }: { status: LiveStatus }) {
  const { label, className, Icon } = STATUS_BADGE[status] ?? STATUS_BADGE.scheduled;
  return (
    <span className={className}>
      <Icon size={12} aria-hidden="true" />
      {label}
    </span>
  );
}

export function SessionCard({ session }: { session: LiveSession }) {
  const when = formatSessionWhen(session.starts_at);
  const meta = [session.venue, when].filter(Boolean).join(" · ");
  // Only promise "Watch" when there's a playable video; an upcoming session
  // without a link yet leads to its details, not a dead player.
  const hasVideo =
    youTubeEmbedUrl(session.recording_url ?? session.stream_url) !== null;
  return (
    <Link href={`/live/${session.id}`} className="live-card">
      <div className="live-card-body">
        <div className="live-card-tags">
          <StatusBadge status={session.status} />
          {session.mode ? <span className="live-tag">{session.mode}</span> : null}
          {session.is_mine ? <span className="live-tag">Yours</span> : null}
        </div>
        <h3>{session.title}</h3>
        {session.summary ? <p>{session.summary}</p> : null}
        <div className="live-card-foot">
          <span className="live-card-meta">
            {meta || "Time to be announced"}
          </span>
          <span className="live-card-go" aria-hidden="true">
            {hasVideo ? (
              <>
                <Play size={14} />
                Watch
              </>
            ) : (
              <>
                Details
                <ArrowRight size={14} />
              </>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
