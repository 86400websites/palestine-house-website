/* Typed shapes for the Live Programming feed (S9 9a). Mirrors the anon-safe
   columns returned by public_programming_sessions() (0013) — never created_by or
   internal timestamps. One source of truth for src/lib/live/sessions.ts and the
   shared SessionCard, the way src/lib/workspace/types.ts is for the content RPCs. */

/* The publishable categories. mode is free-text in the DB until the 0020 CHECK
   constraint lands (S9 9e); these are the values the filter chips + publish form
   use. */
export const LIVE_MODES = ["Music", "Talks", "Performance", "Food"] as const;
export type LiveMode = (typeof LIVE_MODES)[number];

/* The /live + Experience filter chips: "All" plus the four modes. */
export const LIVE_FILTERS = ["All", ...LIVE_MODES] as const;
export type LiveFilter = (typeof LIVE_FILTERS)[number];

/* status drives the public badges (scheduled = "Upcoming", live = "Live now",
   past = "Recording"). Constrained by the table CHECK in 0013. */
export type LiveStatus = "scheduled" | "live" | "past";

export type LiveSession = {
  id: string;
  title: string;
  summary: string | null;
  /* Free-text in the DB until the 0020 CHECK (S9 9e); kept permissive here. */
  mode: string | null;
  status: LiveStatus;
  venue: string | null;
  stream_url: string | null;
  recording_url: string | null;
  starts_at: string | null; // ISO timestamptz
  cover_path: string | null;
};

/* The three /live sections, bucketed by status (see groupSessions). */
export type GroupedSessions = {
  live: LiveSession[];
  upcoming: LiveSession[];
  past: LiveSession[];
};
