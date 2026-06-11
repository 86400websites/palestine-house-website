"use client";

import { Button } from "@/components/ui/button";

/* Route-level error boundary — keeps the locked chrome, offers a calm retry.
   New strings follow brand-voice.md: warm, short, concrete. */
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="ph-section-lg">
      <div className="ph-container ph-center-stack">
        <p className="ph-eyebrow">Something went wrong</p>
        <h1>That didn’t work.</h1>
        <p className="ph-lead">
          Something broke on our side, not yours. Try again — if it keeps
          happening, come back a little later.
        </p>
        <Button size="lg" type="button" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </section>
  );
}
