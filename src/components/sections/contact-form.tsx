"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/* Contact form (contact.md). Posts to the server-side Resend route (S12 12-5) —
   the provider is never called from the browser. On success the approved
   confirmation ("Thanks — your message is on its way."); on failure the standard
   retry line; never a faked send. */
export function ContactForm() {
  const [status, setStatus] = React.useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const busy = status === "sending" || status === "sent";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const data = new FormData(e.currentTarget);
    const body = {
      name: data.get("name")?.toString() ?? "",
      email: data.get("email")?.toString() ?? "",
      subject: data.get("subject")?.toString() ?? "",
      message: data.get("message")?.toString() ?? "",
    };
    setStatus("sending");
    try {
      const res = await fetch("/api/resend/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="contact-row">
        <div className="contact-field">
          <Label htmlFor="c-name">Name</Label>
          <Input
            id="c-name"
            name="name"
            placeholder="Your name"
            autoComplete="name"
            required
            disabled={status === "sent"}
            className="bg-white"
          />
        </div>
        <div className="contact-field">
          <Label htmlFor="c-email">Email</Label>
          <Input
            id="c-email"
            name="email"
            type="email"
            placeholder="you@email.com"
            autoComplete="email"
            required
            disabled={status === "sent"}
            className="bg-white"
          />
        </div>
      </div>
      <div className="contact-field">
        <Label htmlFor="c-subject">Subject</Label>
        <Input
          id="c-subject"
          name="subject"
          placeholder="What’s this about?"
          required
          disabled={status === "sent"}
          className="bg-white"
        />
      </div>
      <div className="contact-field">
        <Label htmlFor="c-message">Message</Label>
        <Textarea
          id="c-message"
          name="message"
          rows={6}
          placeholder="Tell us a little more."
          required
          disabled={status === "sent"}
          className="bg-white"
        />
      </div>
      <div className="contact-actions">
        <Button size="lg" type="submit" disabled={busy}>
          Send message
          <ArrowRight aria-hidden="true" />
        </Button>
        {/* Approved micro-copy stays static; the live region fills on submit. */}
        {status === "sent" ? (
          <span className="contact-help" role="status">
            Thanks — your message is on its way.
          </span>
        ) : status === "error" ? (
          <span className="contact-help" role="status">
            Something went wrong. Please try again.
          </span>
        ) : (
          <span className="contact-help">We’ll get back to you.</span>
        )}
      </div>
    </form>
  );
}
