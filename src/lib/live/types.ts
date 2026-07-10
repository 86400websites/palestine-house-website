/* Typed shapes for the Live Programming feed (S9 9a; members-only since LH1).
   Mirrors the columns returned by member_programming_sessions() (0025) — the
   anon-safe projection plus a derived is_mine flag, never created_by or internal
   timestamps. One source of truth for src/lib/live/sessions.ts and the shared
   SessionCard, the way src/lib/workspace/types.ts is for the content RPCs. */

/* The publishable categories. mode is free-text in the DB until the 0020 CHECK
   constraint lands (S9 9e); these are the values the filter chips + publish form
   use. */
export const LIVE_MODES = ["Music", "Talks", "Performance", "Food"] as const;
export type LiveMode = (typeof LIVE_MODES)[number];

/* The /live hub filter chips: "All" plus the four modes. */
export const LIVE_FILTERS = ["All", ...LIVE_MODES] as const;
export type LiveFilter = (typeof LIVE_FILTERS)[number];

/* status drives the badges (scheduled = "Upcoming", live = "Live now",
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
  /* Derived server-side by member_programming_sessions() (0025): true when the
     caller published this session. Marks "Yours" in the hub + feeds the manage
     list — the raw created_by never leaves the database. */
  is_mine: boolean;
};

/* The three hub sections, bucketed by status (see groupSessions). */
export type GroupedSessions = {
  live: LiveSession[];
  upcoming: LiveSession[];
  past: LiveSession[];
};
