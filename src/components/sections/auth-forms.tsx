"use client";

import * as React from "react";
import Link from "next/link";
import {
  signInAction,
  requestPasswordResetAction,
  updatePasswordAction,
  type LoginState,
  type ForgotState,
  type UpdateState,
} from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* Auth UI (login.md / forgot-password.md / update-password.md). Fields,
   labels, links, confirmations, and error copy are approved copy, verbatim.
   All three flows are live via Server Actions (Sprint 3): login (3a-ii),
   forgot + update password (3b). */

function AuthField({
  id,
  label,
  error,
  ...input
}: { id: string; label: string; error?: string | null } & React.ComponentProps<
  typeof Input
>) {
  return (
    <div className="contact-field">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className="bg-white"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...input}
      />
      {error ? (
        <p className="auth-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = React.useActionState<
    LoginState,
    FormData
  >(signInAction, { error: null });

  /* The email-format error renders under the field; the neutral auth error
     ("…doesn't match") renders as a form-level note. */
  const isEmailError = state.error === "Please enter a valid email.";

  return (
    <>
      <h1>Welcome back.</h1>
      <form className="auth-form" action={formAction} noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <AuthField
          id="l-email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          error={isEmailError ? state.error : null}
        />
        <AuthField
          id="l-password"
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
        />
        <div className="auth-row-between">
          <Link className="auth-quiet-link" href="/forgot-password">
            Forgot your password?
          </Link>
        </div>
        {state.error && !isEmailError ? (
          <p className="auth-note" role="alert">
            {state.error}
          </p>
        ) : null}
        <Button size="lg" type="submit" disabled={pending}>
          Sign in
        </Button>
      </form>
      <p className="auth-foot">
        New here? <Link href="/apply">Apply to bring a House</Link>
      </p>
    </>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction, pending] = React.useActionState<
    ForgotState,
    FormData
  >(requestPasswordResetAction, { sent: false });

  return (
    <>
      <h1>Let’s get you back in.</h1>
      <p className="auth-sub">Enter your email and we’ll send a reset link.</p>
      <form className="auth-form" action={formAction}>
        <AuthField
          id="f-email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
        />
        {state.sent ? (
          <p className="auth-note" role="status">
            If that email’s registered, a reset link is on its way. Check your
            inbox.
          </p>
        ) : null}
        <Button size="lg" type="submit" disabled={pending}>
          Send reset link
        </Button>
      </form>
      <p className="auth-foot">
        <Link href="/login">Back to sign in</Link>
      </p>
    </>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction, pending] = React.useActionState<
    UpdateState,
    FormData
  >(updatePasswordAction, { error: null, done: false });
  const doneRef = React.useRef<HTMLDivElement>(null);

  /* One server `error` string, placed under the field it concerns. */
  const isWeak = state.error === "Pick a slightly stronger password.";
  const isMismatch = state.error === "Those passwords don’t match.";

  /* On success the form is replaced — move focus to the confirmation so
     keyboard/AT users land on it. */
  React.useEffect(() => {
    if (state.done) doneRef.current?.focus();
  }, [state.done]);

  if (state.done) {
    return (
      <div role="status" ref={doneRef} tabIndex={-1}>
        <h1>Set a new password.</h1>
        <p className="auth-note">Done. You can sign in now.</p>
        <p className="auth-foot">
          <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <h1>Set a new password.</h1>
      <form className="auth-form" action={formAction} noValidate>
        <AuthField
          id="u-pw"
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          error={isWeak ? state.error : null}
        />
        <AuthField
          id="u-confirm"
          name="confirm"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          error={isMismatch ? state.error : null}
        />
        <Button size="lg" type="submit" disabled={pending}>
          Update password
        </Button>
      </form>
    </>
  );
}
