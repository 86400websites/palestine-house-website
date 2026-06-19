import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  ElementFull,
  ElementListItem,
  ChecklistRow,
  ResourceRow,
  AcademyRow,
} from "./types";

/* Typed server wrappers around the S5 content RPCs — S6 is their first
   consumer. Same shape as src/lib/auth/profile.ts: React-cached (one round-trip
   per request even when called from several places) and run under the user
   session + RLS via the publishable-key server client — never the secret key.
   Every RPC is is_approved()-gated server-side, so an unapproved caller gets
   zero rows. These never throw; they fail closed to null / [].
   `server-only` makes an accidental client import a build error. */

export const getElement = cache(
  async (slug: string): Promise<ElementFull | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_element", { p_slug: slug });
    if (error || !data) return null;
    const rows = data as ElementFull[];
    return rows[0] ?? null;
  },
);

export const getElements = cache(async (): Promise<ElementListItem[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_elements");
  if (error || !data) return [];
  return data as ElementListItem[];
});

export const getChecklist = cache(async (): Promise<ChecklistRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_checklist");
  if (error || !data) return [];
  return data as ChecklistRow[];
});

export const getResources = cache(async (): Promise<ResourceRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_resources");
  if (error || !data) return [];
  return data as ResourceRow[];
});

/* DB-sourced youtube_url is rendered into an <a href> (academy cards + the
   element Video tab). React does not strip javascript:/data: URLs and the CSP's
   'unsafe-inline' script-src does not block javascript: navigation, so validate
   the scheme at the data layer — mirroring the http/https/mailto allow-list
   markdown.ts already enforces for body links. Anything that isn't http(s)
   becomes null; both consumers already fall back to the "video coming" empty
   state on null (S7 fix). */
function safeHttpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}

export const getAcademyModules = cache(async (): Promise<AcademyRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_academy_modules");
  if (error || !data) return [];
  return (data as AcademyRow[]).map((r) => ({
    ...r,
    youtube_url: safeHttpUrl(r.youtube_url),
  }));
});
