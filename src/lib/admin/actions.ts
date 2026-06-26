"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend/client";
import { SITE_URL } from "@/lib/site";

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

  // Best-effort applicant email (S12 12-7) — graceful-degrade. The status flip
  // above is authoritative; an email failure is logged and ignored so the admin
  // toast is unchanged. The applicant email is not in hand inside this action
  // (admin_set_application_status returns only a boolean and applications RLS is
  // owner-scoped), so it is read from the admin-only admin_list_applications()
  // RPC by id — typed loosely, like the approvals page.
  try {
    const { data } = await supabase.rpc("admin_list_applications");
    const row = (
      data as { id: string; name: string; email: string }[] | null
    )?.find((a) => a.id === id);
    if (row?.email) {
      const body =
        decision === "approved"
          ? {
              subject: "You're approved — welcome to Palestine House",
              text: `Hello ${row.name},\n\nYour application to bring a Palestine House has been approved.\n\nThe full partner platform is now open to you. Sign in with the email and password you used to apply:\n\n${SITE_URL}/login\n\nWe're glad you're here.\n\n— Palestine House HQ`,
            }
          : {
              subject: "An update on your Palestine House application",
              text: `Hello ${row.name},\n\nThank you for applying to bring a Palestine House. After careful review, we're not moving forward with your application at this time.\n\nThis isn't the end of the conversation. If you have questions or would like to tell us more, we'd like to hear from you:\n\n${SITE_URL}/contact\n\nWith respect,\nPalestine House HQ`,
            };
      await sendEmail({ to: row.email, subject: body.subject, text: body.text });
    }
  } catch (mailError) {
    console.error(
      "[resend] decision email failed (continuing):",
      mailError instanceof Error ? mailError.message : mailError,
    );
  }

  revalidatePath("/admin/approvals");
  return {
    ok: true,
    message:
      decision === "approved" ? "Approved — platform unlocked." : "Declined.",
  };
}
