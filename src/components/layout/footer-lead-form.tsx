"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

/* Footer booklet capture (footer-copy.md). Renders fully but no-ops cleanly —
   Mailchimp wiring arrives in Sprint 8a. Until then, submitting tells the
   truth instead of silently dropping the address. */
export function FooterLeadForm() {
  const [submitted, setSubmitted] = React.useState(false);

  return (
    <form
      className="phx-footer-lead-row"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <div style={{ flex: "1 1 180px", minWidth: 160 }}>
        <label className="phx-footer-lead-label" htmlFor="footer-email">
          Email
        </label>
        <input
          className="phx-footer-lead-input"
          id="footer-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <Button type="submit" size="lg">
        Send me the booklets
      </Button>
      {/* Approved micro-copy stays put; the status line only fills on submit. */}
      <p className="phx-footer-micro" style={{ flexBasis: "100%" }}>
        No spam. Unsubscribe anytime.
      </p>
      <p className="phx-footer-micro" role="status" style={{ flexBasis: "100%", margin: 0 }}>
        {submitted
          ? "The booklets aren’t ready to send just yet — check back soon."
          : null}
      </p>
    </form>
  );
}
