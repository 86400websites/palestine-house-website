import Link from "next/link";
import { Button } from "@/components/ui/button";

/* Workspace-scoped not-found for an approved partner who hits an unknown topic
   slug. It renders inside the (workspace) shell (the global not-found.tsx uses
   the public chrome, which would look wrong here). */

export default function ElementNotFound() {
  return (
    <div>
      <h1 className="ws-h1">Topic not found.</h1>
      <p className="ws-lead">
        That topic doesn&rsquo;t exist. Head back to your dashboard to find your
        way.
      </p>
      <div className="ws-cta-row">
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
