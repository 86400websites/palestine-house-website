import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { GroupedSessions, LiveFilter, LiveSession } from "./types";

/* Server data layer for the public Live Programming feed (S9 9a). Same shape as
   src/lib/workspace/content.ts: React-cached (one round-trip per request even
   when /live and the Experience strip both read it), run anon-safe under the
   publishable-key server client, and fail-closed to [] so a transient error
   degrades to the approved empty states — never a crash. public_programming_
   sessions() (0013) is the ONE anon-callable RPC and already strips created_by +
   internal timestamps. `server-only` makes an accidental client import a build
   error. */

export const getLiveSessions = cache(async (): Promise<LiveSession[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_programming_sessions");
  if (error || !data) return [];
  return data as LiveSession[];
});

/* Pure: bucket the feed into the three /live sections by status. The RPC orders
   newest-first (starts_at DESC nulls last); Upcoming reads better soonest-first,
   so re-sort that bucket ascending. Live + Past keep the RPC order. */
export function groupSessions(sessions: LiveSession[]): GroupedSessions {
  return {
    live: sessions.filter((s) => s.status === "live"),
    upcoming: sessions
      .filter((s) => s.status === "scheduled")
      .slice()
      .sort((a, b) => startsAtAsc(a.starts_at, b.starts_at)),
    past: sessions.filter((s) => s.status === "past"),
  };
}

/* Pure: filter by the active mode chip. "All" (or any unknown chip) returns
   everything; otherwise match case-insensitively on the free-text mode. */
export function filterByMode(
  sessions: LiveSession[],
  filter: LiveFilter | string | null | undefined,
): LiveSession[] {
  if (!filter || filter === "All") return sessions;
  const want = filter.toLowerCase();
  return sessions.filter((s) => (s.mode ?? "").toLowerCase() === want);
}

/* Ascending by starts_at with nulls (and any unparseable timestamp) sorted last
   — never return NaN, which would silently scramble the whole bucket. */
function startsAtAsc(a: string | null, b: string | null): number {
  const ta = a === null ? NaN : new Date(a).getTime();
  const tb = b === null ? NaN : new Date(b).getTime();
  const aBad = Number.isNaN(ta);
  const bBad = Number.isNaN(tb);
  if (aBad && bBad) return 0;
  if (aBad) return 1;
  if (bBad) return -1;
  return ta - tb;
}
