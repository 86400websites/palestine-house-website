"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSafeOrigin, safeNextPath } from "@/lib/safe-redirect";

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
  const next = safeNextPath(formData.get("next")?.toString());

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // No recovery session — the reset link was missing or expired. Send them
    // to request a fresh one rather than failing opaquely.
    redirect("/forgot-password");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Pick a slightly stronger password.", done: false };
  }

  // Clear the recovery session so "Done. You can sign in now." is literally
  // true — the user re-authenticates with the new password.
  await supabase.auth.signOut();
  return { error: null, done: true };
}
