import Link from "next/link";
import { Button } from "@/components/ui/button";

/* Not-found for an unknown /live/[id] session (S9 9c). Renders inside the public
   chrome; new strings follow docs/page-copy/00-global/brand-voice.md: warm,
   short, concrete. */
export default function WatchNotFound() {
  return (
    <section className="ph-section-lg">
      <div className="ph-container ph-center-stack">
        <p className="ph-eyebrow">Live programming</p>
        <h1>This session isn’t here.</h1>
        <p className="ph-lead">
          It may have ended and moved on, or the link is wrong. See what else is
          on.
        </p>
        <Button asChild size="lg">
          <Link href="/live">Back to live programming</Link>
        </Button>
      </div>
    </section>
  );
}
