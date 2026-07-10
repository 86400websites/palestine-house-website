import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getMyProfile } from "@/lib/auth/profile";
import { PendingState } from "@/components/workspace/pending-state";
import { getLiveSessions } from "@/lib/live/sessions";
import { youTubeEmbedUrl } from "@/lib/live/youtube";
import { formatSessionWhen } from "@/lib/live/format";
import { StatusBadge } from "@/components/shared/session-card";
import type { LiveSession } from "@/lib/live/types";

/* Watch view (/live/[id]) — the members-only watch page for one session
   (S9 9c; gated since LH1). Reuses the cached getLiveSessions() feed
   (member_programming_sessions(), 0025) and finds the row by id; an unknown id
   404s via not-found.tsx. The approval check runs BEFORE the id lookup — a
   pending partner must see the standard PendingState, not a 404 (the RPC
   returns them zero rows, so every id would otherwise "not exist"). The video
   is a privacy-enhanced youtube-nocookie embed rebuilt from a validated
   11-char id (youTubeEmbedUrl) — the single origin the CSP frame-src allows. A
   missing or non-YouTube link degrades to a graceful state, never a
   broken/blocked frame. New strings follow brand voice. */

async function findSession(id: string): Promise<LiveSession | null> {
  const sessions = await getLiveSessions();
  return sessions.find((s) => s.id === id) ?? null;
}

/* Past sessions watch the recording; live/upcoming watch the stream link. Fall
   back to whichever URL is present. youTubeEmbedUrl validates the result. */
function videoUrl(session: LiveSession): string | null {
  const primary =
    session.status === "past" ? session.recording_url : session.stream_url;
  return primary ?? session.stream_url ?? session.recording_url;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const session = await findSession(id);
  if (!session) return { title: "Live Programming" };
  return {
    title: session.title,
    description: session.summary ?? undefined,
  };
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PendingState contactFallback />;

  const { id } = await params;
  const session = await findSession(id);
  if (!session) notFound();

  const embed = youTubeEmbedUrl(videoUrl(session));
  const when = formatSessionWhen(session.starts_at);
  const meta = [session.venue, when].filter(Boolean).join(" · ");

  return (
    <div className="live-watch">
      <Link href="/live" className="live-watch-back">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Live Programming
      </Link>

      <div className="live-watch-head">
        <div className="live-card-tags">
          <StatusBadge status={session.status} />
          {session.mode ? (
            <span className="live-tag">{session.mode}</span>
          ) : null}
          {session.is_mine ? <span className="live-tag">Yours</span> : null}
        </div>
        <h1 className="ws-h1">{session.title}</h1>
        {meta ? <p className="live-watch-meta">{meta}</p> : null}
      </div>

      {embed ? (
        <div className="live-watch-frame">
          <iframe
            src={embed}
            title={session.title}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <p className="live-watch-empty">
          No video to watch here yet — check back soon.
        </p>
      )}

      {session.summary ? (
        <p className="live-watch-summary">{session.summary}</p>
      ) : null}
    </div>
  );
}
