"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/* Contact form (contact.md). Renders fully but no-ops cleanly — Resend
   wiring arrives in Sprint 8b. Until then submitting tells the truth; the
   approved confirmation ("Thanks — your message is on its way.") ships with
   the real send in S8. */
export function ContactForm() {
  const [sent, setSent] = React.useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <div className="contact-row">
        <div className="contact-field">
          <Label htmlFor="c-name">Name</Label>
          <Input
            id="c-name"
            name="name"
            placeholder="Your name"
            autoComplete="name"
            required
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
          className="bg-white"
        />
      </div>
      <div className="contact-actions">
        <Button size="lg" type="submit">
          Send message
          <ArrowRight aria-hidden="true" />
        </Button>
        <span className="contact-help" role="status">
          {sent
            ? "Messages aren’t being delivered just yet — check back soon."
            : "We’ll get back to you."}
        </span>
      </div>
    </form>
  );
}
