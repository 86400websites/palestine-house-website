"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/* Approve / decline a partner application (S4 4b). The authoritative
   authorization lives in the SECURITY DEFINER RPC admin_set_application_status,
   which checks is_admin() server-side and flips profiles.is_approved to match —
   this action re-checks the session + admin server-side too (defence in depth)
   and turns any failure into neutral copy instead of a raw DB error. */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DecideState = { ok: boolean; message: string | null };

export async function decideApplicationAction(
  _prev: DecideState,
  formData: FormData,
): Promise<DecideState> {
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (
    !UUID_RE.test(id) ||
    (decision !== "approved" && decision !== "declined")
  ) {
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Your session expired — sign in again." };
  }
  const { data: admin } = await supabase.rpc("is_admin");
  if (admin !== true) {
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  const { error } = await supabase.rpc("admin_set_application_status", {
    p_application_id: id,
    p_status: decision,
  });
  if (error) {
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  revalidatePath("/admin/approvals");
  return {
    ok: true,
    message:
      decision === "approved" ? "Approved — platform unlocked." : "Declined.",
  };
}
