import Link from "next/link";
import { Button } from "@/components/ui/button";

/* Not-found for an unknown /live/[id] session (S9 9c; workspace-styled since
   LH1 — it now renders inside the WorkspaceShell, not the public chrome). New
   strings follow docs/page-copy/00-global/brand-voice.md: warm, short,
   concrete. */
export default function WatchNotFound() {
  return (
    <div>
      <p className="ph-eyebrow">Live programming</p>
      <h1 className="ws-h1">This session isn’t here.</h1>
      <p className="ws-lead">
        It may have ended and moved on, or the link is wrong. See what else is
        on.
      </p>
      <div className="live-hub-actions">
        <Button asChild size="lg">
          <Link href="/live">Back to Live Programming</Link>
        </Button>
      </div>
    </div>
  );
}
