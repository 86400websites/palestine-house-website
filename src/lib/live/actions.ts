"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseYouTubeId } from "./youtube";

/* Partner publishing write path (S9 9f). Both actions run under the user
   session; the authoritative authorization is server-side, never trusted to the
   client:
   - publishSessionAction -> publish_programming_session RPC (0020): APPROVED +
     ownership enforced in-function, created_by forced from auth.uid().
   - deleteSessionAction -> a direct delete under the owner-scoped delete_own RLS
     policy (0013), so a partner can only remove its OWN rows.
   Both do cheap shape validation, map failures to neutral brand-voice copy, and
   revalidate the public feed (/live + /experience) plus the tool (/programming). */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  status: z.enum(["scheduled", "live", "past"]),
  youtubeUrl: z.string().trim().max(500).optional(),
  summary: z.string().trim().max(1000).optional(),
  mode: z.enum(["Music", "Talks", "Performance", "Food"]).optional(),
  venue: z.string().trim().max(200).optional(),
  startsAt: z.string().trim().max(40).optional(),
  sessionId: z.string().regex(UUID_RE).optional(),
});

export type PublishState = { ok: boolean; message: string | null };

/* Empty/whitespace form fields -> undefined, so zod optionals don't see "". */
function field(formData: FormData, name: string): string | undefined {
  const v = formData.get(name);
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

/* A datetime-local value is UTC wall-clock here (the field is labelled "Starts
   (UTC)" and the public pages display UTC). Normalise to an ISO instant. */
function toIsoUtc(value: string): string | null {
  const zoned = /[zZ]|[+-]\d\d:?\d\d$/.test(value)
    ? value
    : value.length === 16
      ? `${value}:00Z`
      : `${value}Z`;
  const d = new Date(zoned);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function publishSessionAction(
  _prev: PublishState,
  formData: FormData,
): Promise<PublishState> {
  const parsed = schema.safeParse({
    title: formData.get("title"),
    status: formData.get("status"),
    youtubeUrl: field(formData, "youtubeUrl"),
    summary: field(formData, "summary"),
    mode: field(formData, "mode"),
    venue: field(formData, "venue"),
    startsAt: field(formData, "startsAt"),
    sessionId: field(formData, "sessionId"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please add a title and pick a status." };
  }

  if (parsed.data.youtubeUrl && !parseYouTubeId(parsed.data.youtubeUrl)) {
    return {
      ok: false,
      message:
        "That doesn’t look like a YouTube link — paste a youtube.com or youtu.be URL.",
    };
  }

  let startsAt: string | null = null;
  if (parsed.data.startsAt) {
    startsAt = toIsoUtc(parsed.data.startsAt);
    if (!startsAt) {
      return { ok: false, message: "That start time doesn’t look right." };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Your session expired — sign in again." };
  }

  const { error } = await supabase.rpc("publish_programming_session", {
    p_title: parsed.data.title,
    p_status: parsed.data.status,
    p_id: parsed.data.sessionId ?? null,
    p_youtube_url: parsed.data.youtubeUrl ?? null,
    p_summary: parsed.data.summary ?? null,
    p_mode: parsed.data.mode ?? null,
    p_venue: parsed.data.venue ?? null,
    p_starts_at: startsAt,
  });
  if (error) {
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  revalidatePath("/live");
  revalidatePath("/experience");
  revalidatePath("/programming");
  return {
    ok: true,
    message: parsed.data.sessionId
      ? "Saved."
      : "Published — it’s on the public Live page.",
  };
}

export async function deleteSessionAction(formData: FormData): Promise<void> {
  const id = field(formData, "sessionId");
  if (!id || !UUID_RE.test(id)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Owner-scoped under the delete_own RLS policy (0013) — only the caller's row.
  await supabase.from("programming_sessions").delete().eq("id", id);

  revalidatePath("/live");
  revalidatePath("/experience");
  revalidatePath("/programming");
}
