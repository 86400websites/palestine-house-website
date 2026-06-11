"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* Auth UI shells (login.md / forgot-password.md / update-password.md).
   Fields, labels, links, and client-side validation errors are approved copy,
   verbatim. Submits no-op honestly — Supabase auth arrives in Sprint 3, when
   the approved confirmations ("…a reset link is on its way", "Done. You can
   sign in now.") ship with the real flows. */

const NOT_LIVE = "Sign-in isn’t switched on just yet — check back soon.";

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

export function LoginForm() {
  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!validEmail) {
      setEmailError("Please enter a valid email.");
      setStatus(null);
      return;
    }
    setEmailError(null);
    setStatus(NOT_LIVE);
  };

  return (
    <>
      <h1>Welcome back.</h1>
      <form className="auth-form" onSubmit={submit} noValidate>
        <AuthField
          id="l-email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
        />
        <AuthField
          id="l-password"
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
        {status ? (
          <p className="auth-error" role="status">
            {status}
          </p>
        ) : null}
        <Button size="lg" type="submit">
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
          <p className="auth-error" role="status">
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
          <p className="auth-error" role="status">
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
