"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend/client";

/* Support request submission (S6 6g). zod-validated (subject + message
   required, length-capped), then written through the submit_support_request
   RPC (0019), which is the authoritative gate: APPROVED-only insert with
   user_id forced from auth.uid() (the launch anti-abuse posture, PROJECT-STATUS
   §7). Email delivery is DEFERRED to the post-launch email sprint — the request
   is stored, not lost; the owner reads the table meanwhile. Failures map to
   neutral brand-voice copy. */

const schema = z.object({
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
});

export type SupportState = { ok: boolean; message: string | null };

export async function submitSupportRequestAction(
  _prev: SupportState,
  formData: FormData,
): Promise<SupportState> {
  const parsed = schema.safeParse({
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please add a subject and a message." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Your session expired — sign in again." };
  }

  const { error } = await supabase.rpc("submit_support_request", {
    p_subject: parsed.data.subject,
    p_message: parsed.data.message,
  });
  if (error) {
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  // Best-effort owner notification (S12 12-6). The request is already stored by
  // the RPC (0019), so an email failure must NEVER change the outcome — it is
  // logged and ignored. reply-to is the submitter's account email from the auth
  // session (profiles does not store email); RESEND_TO_EMAIL is the destination.
  const to = process.env.RESEND_TO_EMAIL;
  if (to) {
    try {
      await sendEmail({
        to,
        replyTo: user.email,
        subject: `Support request: ${parsed.data.subject}`,
        text: `From: ${user.email ?? "unknown"}\nSubject: ${parsed.data.subject}\n\n${parsed.data.message}`,
      });
    } catch (mailError) {
      console.error(
        "[resend] support email failed (continuing):",
        mailError instanceof Error ? mailError.message : mailError,
      );
    }
  }

  return { ok: true, message: "Got it — we’ll be in touch." };
}
