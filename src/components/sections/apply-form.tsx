"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/* The application form (apply-partner.md) — single "Your name" field per the
   approved mockup (resolved decision D5). Renders fully but no-ops honestly:
   the real submit (pending account + application record, zod + rate limit +
   Turnstile) arrives in Sprint 3c, when the approved confirmation copy
   ("Thank you — your application is in…") ships with it. */
export function ApplyForm() {
  const [sent, setSent] = React.useState(false);
  const confirmRef = React.useRef<HTMLDivElement>(null);

  /* The confirmation replaces the form (and the focused submit button) —
     move focus to it so keyboard/AT users land on the message. */
  React.useEffect(() => {
    if (sent) confirmRef.current?.focus();
  }, [sent]);

  if (sent) {
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
        <h3>Applications aren’t open just yet.</h3>
        <p>
          The form goes live soon — nothing was sent, and no account was
          created. Check back shortly, or ask us anything through Contact.
        </p>
      </div>
    );
  }

  return (
    <form
      className="apply-form"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
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
        <Label htmlFor="a-email">Email</Label>
        <Input
          id="a-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="bg-white"
        />
      </div>
      <div className="apply-form-row">
        <div className="apply-field">
          <Label htmlFor="a-city">City</Label>
          <Input id="a-city" name="city" required className="bg-white" />
        </div>
        <div className="apply-field">
          <Label htmlFor="a-org">
            Organisation <span className="apply-field-hint">Optional</span>
          </Label>
          <Input id="a-org" name="organisation" className="bg-white" />
        </div>
      </div>
      <div className="apply-field">
        <Label htmlFor="a-why">
          Tell us about your city, and why a House
        </Label>
        <Textarea
          id="a-why"
          name="why"
          rows={6}
          required
          className="bg-white"
        />
      </div>
      <Button size="lg" type="submit">
        Apply to bring a House
        <ArrowRight aria-hidden="true" />
      </Button>
      <p className="apply-micro">
        Submitting creates your account and sends your application to HQ. We’ll
        only use your details to follow up.
      </p>
    </form>
  );
}
