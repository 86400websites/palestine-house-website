import Link from "next/link";
import { Button } from "@/components/ui/button";

/* Branded 404 — renders inside the locked chrome. New strings follow
   docs/page-copy/00-global/brand-voice.md: warm, short, concrete. */
export default function NotFound() {
  return (
    <section className="ph-section-lg">
      <div className="ph-container ph-center-stack">
        <p className="ph-eyebrow">404</p>
        <h1>This page isn’t here.</h1>
        <p className="ph-lead">
          The address may have changed, or the page hasn’t been built yet.
          Everything starts from home.
        </p>
        <Button asChild size="lg">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </section>
  );
}
