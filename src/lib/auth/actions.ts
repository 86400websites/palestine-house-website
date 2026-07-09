"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSafeOrigin, safeNextPath } from "@/lib/safe-redirect";
import { upsertContact } from "@/lib/mailchimp/client";
import { sendEmail } from "@/lib/resend/client";
import { SITE_URL } from "@/lib/site";

/* Server Actions for auth (run server-side so the browser never calls
   supabase.co directly — CSP connect-src stays 'self'). Sign-in + sign-out
   ship in S3 sub-step 2; forgot/update password + Apply sign-up follow.
   Error copy is verbatim from docs/page-copy/02-auth-pages/login.md and never
   reveals whether an email exists (login.md Notes). */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LoginState = { error: string | null };

export async function signInAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  // Post-login lands on the gated dashboard (pending or approved state) unless
  // a safe ?next= was supplied (e.g. the gate redirect from /admin/approvals).
  const next = safeNextPath(formData.get("next")?.toString(), "/dashboard");

  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Neutral message — must not reveal whether the email is registered.
    return { error: "That email or password doesn’t match." };
  }

  redirect(next);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type ForgotState = { sent: boolean };

export async function requestPasswordResetAction(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "").trim();

  // Only send when the address is well-formed; never reveal whether it is
  // registered (forgot-password.md Notes — neutral confirmation always).
  if (EMAIL_RE.test(email)) {
    const origin = await getSafeOrigin();
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      // The link returns to /auth/confirm, which exchanges the code for a
      // recovery session and forwards to /update-password.
      redirectTo: `${origin}/auth/confirm?next=/update-password`,
    });
  }

  return { sent: true };
}

export type UpdateState = { error: string | null; done: boolean };

export async function updatePasswordAction(
  _prev: UpdateState,
  formData: FormData,
): Promise<UpdateState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  // Approved field errors, verbatim (update-password.md).
  if (password.length < 8) {
    return { error: "Pick a slightly stronger password.", done: false };
  }
  if (password !== confirm) {
    return { error: "Those passwords don’t match.", done: false };
  }

  const cookieStore = await cookies();
  const fromRecovery = cookieStore.get("ph-recovery")?.value === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !fromRecovery) {
    // Must have arrived via a recovery link (/auth/confirm sets the marker). A
    // normal authenticated session — or a missing/expired marker — cannot reset
    // the password here; send them to request a fresh link.
    redirect("/forgot-password");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Pick a slightly stronger password.", done: false };
  }

  // Consume the recovery marker and clear the session so "Done. You can sign in
  // now." is literally true — the user re-authenticates with the new password.
  cookieStore.delete("ph-recovery");
  await supabase.auth.signOut();
  return { error: null, done: true };
}

/* Apply = sign-up (SECURITY-CHECKLIST §15): the ONLY account-creation door.
   One submit creates a pending account + an application record. With email
   confirmation OFF, signUp returns a session immediately, so the just-created
   user inserts their OWN applications row under S2's owner-scoped policy
   (with check user_id = auth.uid() AND status = 'pending'; status defaults to
   'pending'). is_approved stays false (the trigger default) — approval is the
   S4 admin path only. */
const applySchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().regex(EMAIL_RE),
  password: z.string().min(8),
  city: z.string().trim().min(1),
  organisation: z.string().trim().optional(),
  why: z.string().trim().min(1),
});

export type ApplyState = { ok: boolean; error: string | null };

export async function applyAction(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const parsed = applySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    city: formData.get("city"),
    organisation: formData.get("organisation") || undefined,
    why: formData.get("why"),
  });

  if (!parsed.success) {
    const where = parsed.error.issues.map((i) => i.path[0]);
    if (where.includes("email")) {
      return { ok: false, error: "Please enter a valid email." };
    }
    if (where.includes("password")) {
      return {
        ok: false,
        error: "Choose a password with at least 8 characters.",
      };
    }
    return { ok: false, error: "Please fill in all the required fields." };
  }

  const { name, email, password, city, organisation, why } = parsed.data;

  const supabase = await createClient();

  // Resolve the applicant's user id. If already authenticated (e.g. a retry
  // after a partial first attempt left them signed in), reuse that session and
  // let the existing-application check below recover a stranded prior attempt.
  // Otherwise sign up. We deliberately do NOT sign in with the supplied
  // credentials when the email already exists: that would turn this anonymous
  // form into an unthrottled login oracle whose response differs by password
  // correctness (account-existence disclosure). Return the same neutral
  // "already has an account" message regardless, and send them to sign in (S7
  // fix).
  let userId: string | null = null;
  const {
    data: { user: current },
  } = await supabase.auth.getUser();
  if (current) {
    userId = current.id;
  } else {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (signUpData?.user && !signUpError) {
      userId = signUpData.user.id;
    } else if (/already/i.test(signUpError?.message ?? "")) {
      return {
        ok: false,
        error: "That email already has an account — try signing in instead.",
      };
    } else {
      return {
        ok: false,
        error: "Something went wrong creating your account. Please try again.",
      };
    }
  }

  if (!userId) {
    return {
      ok: false,
      error: "Something went wrong creating your account. Please try again.",
    };
  }

  // One application per user. If this user already has one (an idempotent
  // retry), treat the submit as success — their application is in.
  const { data: existingApps } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  if (existingApps && existingApps.length > 0) {
    // Already applied (idempotent retry) — they have a session; take them
    // straight to the dashboard to see their status (S6 Step 3.5).
    redirect("/dashboard");
  }

  // The authenticated user writes its own application (status defaults to
  // 'pending' per the column + RLS check).
  const { error: insertError } = await supabase.from("applications").insert({
    user_id: userId,
    name,
    email,
    city,
    organisation: organisation ?? null,
    why,
  });

  if (insertError) {
    console.error("applications insert failed:", insertError.message);
    return {
      ok: false,
      error: "Something went wrong sending your application. Please try again.",
    };
  }

  // Best-effort marketing tag (S12 12-3). The account + application are already
  // saved, so a Mailchimp failure must NEVER block sign-up. The helper already
  // no-throws + no-ops when unconfigured; the guard is belt-and-suspenders so
  // nothing here can reject the action before the redirect. Kept off the
  // idempotent-retry path above (that applicant was tagged on their first apply).
  try {
    await upsertContact({ email, tags: ["applicant"] });
  } catch (tagError) {
    console.error(
      "[mailchimp] apply tag failed (continuing):",
      tagError instanceof Error ? tagError.message : tagError,
    );
  }

  // Best-effort application-received emails (E1) — same posture as the tag
  // above: the account + application are already saved, so an email failure
  // must NEVER block sign-up. Skipped on the idempotent-retry path above (that
  // applicant was emailed on their first apply). The HQ notification needs
  // RESEND_TO_EMAIL; the applicant confirmation needs only the sending pair.
  // Both copy bodies are owner-approved (E1-1 gate, 2026-07-09).
  try {
    const hq = process.env.RESEND_TO_EMAIL;
    if (hq) {
      await sendEmail({
        to: hq,
        replyTo: email,
        subject: `New application: ${name} — ${city}`,
        text: `A new partner application just arrived.\n\nName: ${name}\nEmail: ${email}\nCity: ${city}\nOrganisation: ${organisation || "—"}\n\nWhy they want to bring a Palestine House:\n${why}\n\nReview and decide here:\n${SITE_URL}/admin/approvals\n\n— Palestine House website`,
      });
    }
    await sendEmail({
      to: email,
      replyTo: process.env.RESEND_TO_EMAIL,
      subject: "We received your application — Palestine House",
      text: `Hello ${name},\n\nThank you for applying to bring a Palestine House. Your application is in, and it is now under review.\n\nYou can check its status any time by signing in:\n\n${SITE_URL}/dashboard\n\nWe read every application with care, and we will email you as soon as there is a decision. If you would like to add anything in the meantime, reach us here:\n\n${SITE_URL}/contact\n\n— Palestine House HQ`,
    });
  } catch (mailError) {
    console.error(
      "[resend] apply emails failed (continuing):",
      mailError instanceof Error ? mailError.message : mailError,
    );
  }

  // Account + application created and the user is signed in (instant session,
  // email confirmation OFF) — land them on the dashboard's pending "under
  // review" state instead of asking them to sign in (S6 Step 3.5). The apply
  // form's confirmation branch is kept as a defensive fallback only.
  redirect("/dashboard");
}
