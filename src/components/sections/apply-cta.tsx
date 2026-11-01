import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/* The centered closing Apply CTA pair + community-access support line, exactly
   as repeated on the public statement closers (copy locked — never reworded
   here). Markup must stay byte-identical to the inline blocks it replaced
   (S1). */

export function ApplyCta({
  secondaryHref,
  secondaryLabel,
}: {
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <>
      <div className="page-hero-ctas" style={{ justifyContent: "center" }}>
        <Button asChild size="lg">
          <Link href="/apply">
            Apply to Join
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        {secondaryHref && secondaryLabel && (
          <Button asChild variant="outline" size="lg">
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        )}
      </div>
      <p className="page-hero-support" style={{ textAlign: "center" }}>
        Apply for community access, not permission to operate a House.
      </p>
    </>
  );
}
