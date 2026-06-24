import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { LiveSession } from "./types";

/* A partner's OWN sessions for the gated /programming tool (S9 9f). Reads the
   programming_sessions table directly under the owner-scoped select_own RLS
   policy (0013) — that policy exists precisely for this publishing dashboard, so
   an authenticated partner sees only its own rows; everyone else's stay hidden.
   React-cached, fail-closed to []. server-only keeps it off the client. */
export const getMySessions = cache(async (): Promise<LiveSession[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programming_sessions")
    .select(
      "id,title,summary,mode,status,venue,stream_url,recording_url,starts_at,cover_path",
    )
    .order("starts_at", { ascending: false, nullsFirst: false });
  if (error || !data) return [];
  return data as LiveSession[];
});
