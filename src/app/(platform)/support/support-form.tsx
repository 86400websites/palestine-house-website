"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/reveal";
import {
  submitSupportRequestAction,
  type SupportState,
} from "@/lib/support/actions";

/* The /support contact form + its confirmation (S6 6g). On a successful submit
   the whole view swaps to the confirmation (matching the mockup); "Send another
   request" returns to a fresh form. The heading + lead live here so the
   confirmation can replace them cleanly. */

const INITIAL: SupportState = { ok: false, message: null };

export function SupportForm() {
  const [state, formAction, pending] = React.useActionState(
    submitSupportRequestAction,
    INITIAL,
  );
  const [sent, setSent] = React.useState(false);

  React.useEffect(() => {
    if (state.ok) setSent(true);
  }, [state]);

  if (sent) {
    return (
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          paddingTop: "var(--space-12)",
        }}
      >
        <FadeIn>
          <div className="ws-card" style={{ textAlign: "center" }}>
            <span className="sup-confirm-icon" aria-hidden="true">
              <Check size={24} />
            </span>
            <h1
              className="ws-h1"
              style={{ marginTop: "var(--space-5)", fontSize: "var(--text-xl)" }}
            >
              Got it — we&rsquo;ll be in touch.
            </h1>
            <div style={{ marginTop: "var(--space-6)" }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSent(false)}
              >
                Send another request
              </Button>
            </div>
          </div>
        </FadeIn>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 className="ws-h1">We&rsquo;ve got you.</h1>
      <p className="ws-lead">
        A question about the platform or the playbook? Send it over and
        we&rsquo;ll help.
      </p>

      <form
        action={formAction}
        className="ws-card"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-5)",
          marginTop: "var(--space-8)",
        }}
      >
        <label className="sup-field">
          <span className="acct-field-label">Subject</span>
          <input
            className="acct-input"
            name="subject"
            required
            maxLength={200}
            placeholder="What’s it about?"
          />
        </label>
        <label className="sup-field">
          <span className="acct-field-label">Message</span>
          <textarea
            className="acct-input"
            name="message"
            required
            rows={6}
            maxLength={5000}
            placeholder="Tell us what’s going on."
            style={{ resize: "vertical" }}
          />
        </label>
        <p
          style={{
            font: "var(--weight-regular) var(--text-sm)/1.5 var(--font-body)",
            color: "var(--subtle-foreground)",
            margin: 0,
          }}
        >
          We&rsquo;ll use the email on your account.
        </p>
        {!state.ok && state.message && (
          <p
            role="alert"
            style={{
              font: "var(--weight-regular) var(--text-sm)/1.5 var(--font-body)",
              color: "var(--status-error)",
              margin: 0,
            }}
          >
            {state.message}
          </p>
        )}
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
