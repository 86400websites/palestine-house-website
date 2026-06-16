"use client";

import * as React from "react";
import Link from "next/link";
import { signInAction, type LoginState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* Auth UI (login.md / forgot-password.md / update-password.md). Fields,
   labels, links, and error copy are approved copy, verbatim. Login is live as
   of Sprint 3 (sub-step 2) via a Server Action; forgot/update password are
   wired in 3b — until then those two submit honestly no-op. */

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
  const [status, setStatus] = React.useState<string | null>(null);

  return (
    <>
      <h1>Let’s get you back in.</h1>
      <p className="auth-sub">Enter your email and we’ll send a reset link.</p>
      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          setStatus(
            "Password reset isn’t switched on just yet — check back soon.",
          );
        }}
      >
        <AuthField
          id="f-email"
          label="Email"
          type="email"
          autoComplete="email"
          required
        />
        {status ? (
          <p className="auth-note" role="status">
            {status}
          </p>
        ) : null}
        <Button size="lg" type="submit">
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
  const [pw, setPw] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [pwError, setPwError] = React.useState<string | null>(null);
  const [confirmError, setConfirmError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const weak = pw.length < 8;
    const mismatch = pw !== confirm;
    setPwError(weak ? "Pick a slightly stronger password." : null);
    setConfirmError(!weak && mismatch ? "Those passwords don’t match." : null);
    setStatus(
      !weak && !mismatch
        ? "Password updates aren’t switched on just yet — check back soon."
        : null,
    );
  };

  return (
    <>
      <h1>Set a new password.</h1>
      <form className="auth-form" onSubmit={submit} noValidate>
        <AuthField
          id="u-pw"
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          error={pwError}
        />
        <AuthField
          id="u-confirm"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={confirmError}
        />
        {status ? (
          <p className="auth-note" role="status">
            {status}
          </p>
        ) : null}
        <Button size="lg" type="submit">
          Update password
        </Button>
      </form>
    </>
  );
}
