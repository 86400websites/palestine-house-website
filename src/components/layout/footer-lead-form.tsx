"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

/* Footer booklet capture (footer-copy.md). Posts to the server-side
   booklet-capture route (Mailchimp tagging, S12 12-2) — the provider is never
   called from the browser. On success the approved confirmation; on failure the
   standard retry line; never a faked send. */
export function FooterLeadForm() {
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
    <form className="phx-footer-lead-row" onSubmit={onSubmit}>
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
          disabled={status === "sent"}
        />
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={status === "sending" || status === "sent"}
      >
        Send me the booklets
      </Button>
      {/* Approved micro-copy stays put; the status line only fills on submit. */}
      <p className="phx-footer-micro" style={{ flexBasis: "100%" }}>
        No spam. Unsubscribe anytime.
      </p>
      <p
        className="phx-footer-micro"
        role="status"
        style={{ flexBasis: "100%", margin: 0 }}
      >
        {status === "sent"
          ? "Thanks — the booklets are on their way."
          : status === "error"
            ? "Something went wrong. Please try again."
            : null}
      </p>
    </form>
  );
}
