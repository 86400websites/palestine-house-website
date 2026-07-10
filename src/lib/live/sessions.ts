import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { GroupedSessions, LiveFilter, LiveSession } from "./types";

/* Server data layer for the members-only Live hub (S9 9a; gated since LH1).
   Same shape as src/lib/workspace/content.ts: React-cached (one round-trip per
   request), run under the caller's session on the server client, and fail-closed
   to [] so a transient error — or a database that hasn't received 0025 yet —
   degrades to the empty states, never a crash. member_programming_sessions()
   (0025) is approved-members-only: anon can't execute it and a pending caller
   gets zero rows; it strips created_by + internal timestamps and derives
   is_mine. `server-only` makes an accidental client import a build error. */

export const getLiveSessions = cache(async (): Promise<LiveSession[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("member_programming_sessions");
  if (error || !data) return [];
  return data as LiveSession[];
});

/* Pure: bucket the feed into the three hub sections by status. The RPC orders
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
