"use server";

import { z } from "zod";
import { cookies } from "next/headers";
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
  // after a partial first attempt left them signed in), reuse it. Otherwise
  // sign up; if the email already exists, fall back to signing in with the
  // supplied credentials so a stranded prior attempt (account created,
  // application not) can recover instead of dead-ending on "already registered".
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
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      userId = signInData?.user?.id ?? null;
      if (!userId) {
        return {
          ok: false,
          error: "That email already has an account — try signing in instead.",
        };
      }
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
    return { ok: true, error: null };
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

  return { ok: true, error: null };
}
