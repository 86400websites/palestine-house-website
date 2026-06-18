"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/* Save one checklist item's progress (S6 6c) — the only per-user write in the
   app. The authoritative authorization lives in the SECURITY DEFINER RPC
   set_checklist_progress: it gates is_approved(), forces ownership from
   auth.uid() (never from args), validates the status, and nulls blocked_note
   off-"blocked". This action does cheap shape validation + a session check,
   turns any failure into neutral copy, and revalidates /build and /dashboard
   (the dashboard snapshot derives from progress). */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = new Set([
  "not_started",
  "in_progress",
  "complete",
  "blocked",
]);

export type ChecklistProgressState = { ok: boolean; message: string | null };

export async function setChecklistProgressAction(
  _prev: ChecklistProgressState,
  formData: FormData,
): Promise<ChecklistProgressState> {
  const itemId = String(formData.get("itemId") ?? "");
  const status = String(formData.get("status") ?? "");
  const noteRaw = formData.get("note");
  const note =
    status === "blocked" && typeof noteRaw === "string" && noteRaw.trim()
      ? noteRaw.trim().slice(0, 500)
      : null;

  if (!UUID_RE.test(itemId) || !STATUSES.has(status)) {
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Your session expired — sign in again." };
  }

  const { error } = await supabase.rpc("set_checklist_progress", {
    p_item_id: itemId,
    p_status: status,
    p_note: note,
  });
  if (error) {
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  revalidatePath("/build");
  revalidatePath("/dashboard");
  return { ok: true, message: "Progress saved." };
}
