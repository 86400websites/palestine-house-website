"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

/* Shared booklet lead-magnet form (shared-ctas.md). Posts to the server-side
   booklet-capture route (Mailchimp tagging, S12 12-2) — the provider is never
   called from the browser. On success the approved confirmation; on failure the
   standard retry line; never a faked send. */
export function LeadForm({
  single = false,
  idPrefix = "lead",
}: {
  /** true → "Send me the booklet" (one booklet); false → "…booklets". */
  single?: boolean;
  /** Unique prefix when two forms share a page (footer + body). */
  idPrefix?: string;
}) {
  const [status, setStatus] = React.useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending" || status === "sent") return;
    const email =
      new FormData(e.currentTarget).get("email")?.toString().trim() ?? "";
    setStatus("sending");
    try {
      // Both booklets are tagged regardless of context (owner decision, S12) —
      // the `single` prop is only a label nicety.
      const res = await fetch("/api/mailchimp/booklet-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, booklet: "both" }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="lead-row" onSubmit={onSubmit}>
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
          disabled={status === "sent"}
        />
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={status === "sending" || status === "sent"}
      >
        {single ? "Send me the booklet" : "Send me the booklets"}
      </Button>
      <p className="lead-micro">No spam. Unsubscribe anytime.</p>
      <p className="lead-micro" role="status" style={{ marginTop: 0 }}>
        {status === "sent"
          ? single
            ? "Thanks — the booklet is on its way."
            : "Thanks — the booklets are on their way."
          : status === "error"
            ? "Something went wrong. Please try again."
            : null}
      </p>
    </form>
  );
}
