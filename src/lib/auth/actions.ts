"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-redirect";

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
