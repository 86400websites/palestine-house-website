import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ElementFull, ResourceRow } from "./types";

/* Typed server wrappers around the S5 content RPCs — S6 is their first
   consumer. Same shape as src/lib/auth/profile.ts: React-cached (one round-trip
   per request even when called from several places) and run under the user
   session + RLS via the publishable-key server client — never the secret key.
   Every RPC is is_approved()-gated server-side, so an unapproved caller gets
   zero rows. These never throw; they fail closed to null / [].
   `server-only` makes an accidental client import a build error.

   PP5 cut this file down to what the platform actually reads. getElements(),
   getChecklist() and getAcademyModules() went with the routes that called them:
   the v2 surface reads a topic through get_platform_topics() and only ever
   fetches one element at a time, by slug, for the guide reader. Their RPCs are
   still in the database and PP7's 0030 drops the checklist and academy ones —
   this is the deletion that stops that migration breaking a live caller. */

export const getElement = cache(
  async (slug: string): Promise<ElementFull | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_element", { p_slug: slug });
    if (error || !data) return null;
    const rows = data as ElementFull[];
    return rows[0] ?? null;
  },
);

export const getResources = cache(async (): Promise<ResourceRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_resources");
  if (error || !data) return [];
  return data as ResourceRow[];
});

/* DB-sourced youtube_url is rendered into an <a href> — the workspace v2 topic
   cards' Watch Video, and before PP5 the academy cards and the element Video
   tab. React does not strip javascript:/data: URLs and the CSP's
   'unsafe-inline' script-src does not block javascript: navigation, so validate
   the scheme at the data layer — mirroring the http/https/mailto allow-list
   markdown.ts already enforces for body links. Anything that isn't http(s)
   becomes null; every consumer falls back to a "video coming" empty state on
   null (S7 fix). Exported since PP3 so the workspace v2 topic cards run their
   DB-sourced youtube_url through the SAME check rather than a second copy of
   it — one security control, one place to fix. */
export function safeHttpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}

