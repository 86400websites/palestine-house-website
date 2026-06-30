"use client";

import { Download, XIcon } from "lucide-react";
import { Dialog } from "radix-ui";

import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/sections/lead-form";

/* Home hero lead-magnet entry point (owner decision, 2026-06-30): the booklet
   capture now lives ONLY here. The second hero CTA opens this dialog instead of
   scrolling to a page-bottom form. Reuses the shared LeadForm, which posts to
   the server-side /api/mailchimp/booklet-capture route (the provider is never
   called from the browser). Radix Dialog handles the focus trap, Esc/overlay
   close, and focus restore to the trigger. */
export function LeadMagnetDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="lg">
          <Download aria-hidden="true" />
          Download The House Promise (free)
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="lead-dialog-overlay" />
        <Dialog.Content
          aria-describedby={undefined}
          className="ph-card lead-dialog"
        >
          <Dialog.Close className="lead-dialog-close" aria-label="Close">
            <XIcon aria-hidden="true" />
          </Dialog.Close>
          <Dialog.Title asChild>
            <h2 className="lead-dialog-title">Get The House Promise — free.</h2>
          </Dialog.Title>
          <LeadForm single idPrefix="home-lead" />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
