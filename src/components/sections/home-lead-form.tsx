"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

/* Home lead-magnet capture (home.md). Renders fully but no-ops cleanly —
   Mailchimp wiring arrives in Sprint 8a; until then submitting tells the
   truth instead of silently dropping the address. */
export function HomeLeadForm() {
  const [submitted, setSubmitted] = React.useState(false);

  return (
    <form
      className="home-lead-row"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <div style={{ flex: "1 1 240px" }}>
        <label className="home-lead-label" htmlFor="lead-email">
          Email
        </label>
        <input
          className="home-lead-input"
          id="lead-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <Button type="submit" size="lg">
        Send me the booklet
      </Button>
      <p className="home-lead-micro">No spam. Unsubscribe anytime.</p>
      <p className="home-lead-micro" role="status" style={{ marginTop: 0 }}>
        {submitted
          ? "The booklet isn’t ready to send just yet — check back soon."
          : null}
      </p>
    </form>
  );
}
