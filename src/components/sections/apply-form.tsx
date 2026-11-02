"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { applyAction, type ApplyState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/* The application form (CR1 copy, section 7.4) — Apply = sign-up. Live as of
   Sprint 3 (3c): a Server Action creates a pending account (signUp, instant
   session) + the application record, then shows the approved confirmation.
   Single "Your name" field (resolved decision D5); the Password field was
   added when Apply went live (owner-approved 2026-06-16 — see apply-partner.md
   + PROJECT-STATUS §4) because /login is password-based. */
export function ApplyForm() {
  const [state, formAction, pending] = React.useActionState<
    ApplyState,
    FormData
  >(applyAction, { ok: false, error: null });
  const confirmRef = React.useRef<HTMLDivElement>(null);

  /* The confirmation replaces the form (and the focused submit button) —
     move focus to it so keyboard/AT users land on the message. */
  React.useEffect(() => {
    if (state.ok) confirmRef.current?.focus();
  }, [state.ok]);

  if (state.ok) {
    return (
      <div className="apply-confirm" role="status" ref={confirmRef} tabIndex={-1}>
        <span className="apply-confirm-mark" aria-hidden="true">
          <svg viewBox="0 0 60 68" width="34" height="38" fill="none">
            <path
              d="M8 66 L8 30 Q8 6 30 3 Q52 6 52 30 L52 66"
              stroke="currentColor"
              strokeWidth="3"
            />
          </svg>
        </span>
        <h3>Thank you. Your application has been received.</h3>
        <p>
          Your account has been created and your community access is pending.
          Use the same account to sign in for your access update.
        </p>
      </div>
    );
  }

  return (
    <form className="apply-form" action={formAction}>
      <div className="apply-field">
        <Label htmlFor="a-name">Your name</Label>
        <Input
          id="a-name"
          name="name"
          autoComplete="name"
          required
          className="bg-white"
        />
      </div>
      <div className="apply-field">
        <Label htmlFor="a-email">Email address</Label>
        <Input
          id="a-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="bg-white"
        />
      </div>
      <div className="apply-field">
        <Label htmlFor="a-password">
          Password <span className="apply-field-hint">At least 8 characters</span>
        </Label>
        <Input
          id="a-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="bg-white"
        />
      </div>
      <div className="apply-form-row">
        {/* justify-end keeps the two inputs level when the longer label beside
            this one wraps. */}
        <div className="apply-field justify-end">
          <Label htmlFor="a-city">City</Label>
          <Input id="a-city" name="city" required className="bg-white" />
        </div>
        <div className="apply-field">
          <Label htmlFor="a-org">
            <span>
              Organization or group name{" "}
              <span className="apply-field-hint">(optional)</span>
            </span>
          </Label>
          <Input id="a-org" name="organisation" className="bg-white" />
        </div>
      </div>
      <div className="apply-field">
        <Label htmlFor="a-why">What interests you about Palestine House?</Label>
        <p className="apply-micro" id="a-why-hint">
          A few sentences about yourself, your city and your idea are enough.
        </p>
        <Textarea
          id="a-why"
          name="why"
          rows={6}
          required
          aria-describedby="a-why-hint"
          className="bg-white"
        />
      </div>
      {state.error ? (
        <p className="auth-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button size="lg" type="submit" disabled={pending}>
        {pending ? "Sending your application..." : "Send Application"}
        <ArrowRight aria-hidden="true" />
      </Button>
      <p className="apply-micro">
        Submitting creates your account and requests community access. Your
        details will be used to handle your application and account. Please do
        not include sensitive personal information.{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
      </p>
    </form>
  );
}
