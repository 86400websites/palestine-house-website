"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

/* Shared booklet lead-magnet form (shared-ctas.md). Renders fully but no-ops
   cleanly — Mailchimp wiring arrives in Sprint 8a; until then submitting
   tells the truth instead of silently dropping the address. */
export function LeadForm({
  single = false,
  idPrefix = "lead",
}: {
  /** true → "Send me the booklet" (one booklet); false → "…booklets". */
  single?: boolean;
  /** Unique prefix when two forms share a page (footer + body). */
  idPrefix?: string;
}) {
  const [submitted, setSubmitted] = React.useState(false);
  const noun = single ? "booklet" : "booklets";

  return (
    <form
      className="lead-row"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <div style={{ flex: "1 1 240px" }}>
        <label className="lead-label" htmlFor={`${idPrefix}-email`}>
          Email
        </label>
        <input
          className="lead-input"
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <Button type="submit" size="lg">
        {single ? "Send me the booklet" : "Send me the booklets"}
      </Button>
      <p className="lead-micro">No spam. Unsubscribe anytime.</p>
      <p className="lead-micro" role="status" style={{ marginTop: 0 }}>
        {submitted
          ? `The ${noun} ${single ? "isn’t" : "aren’t"} ready to send just yet — check back soon.`
          : null}
      </p>
    </form>
  );
}
