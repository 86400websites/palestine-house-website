import type { Metadata } from "next";
import Link from "next/link";
import { getMyProfile } from "@/lib/auth/profile";
import { PendingState } from "@/components/workspace/pending-state";
import { TatreezDivider } from "@/components/shared/tatreez-divider";

/* /tools — House Applications (docs/page-copy/03-member-workspace/tools.md).
   A dignified coming-soon placeholder at MVP: no CTA, no form, no fake feature
   cards. The page exists so the sidebar item resolves cleanly. Gated like every
   workspace page. The body links all point at routes that now exist (no dead
   links). */

export const metadata: Metadata = { title: "House Applications" };

export default async function ToolsPage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PendingState />;

  return (
    <div
      style={{
        maxWidth: 620,
        margin: "0 auto",
        paddingTop: "var(--space-12)",
        textAlign: "center",
      }}
    >
      <h1 className="ws-h1">House Applications.</h1>
      <p className="ws-lead" style={{ marginInline: "auto" }}>
        Partner tools that help you run a House — arriving in stages. We&rsquo;re
        building these carefully; nothing here yet.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          margin: "var(--space-10) 0",
        }}
      >
        <TatreezDivider width="120px" opacity={0.6} />
      </div>

      <p
        style={{
          font: "var(--weight-medium) var(--text-lg)/1.6 var(--font-body)",
          color: "var(--foreground)",
          margin: 0,
        }}
      >
        <em>Tools are on the way.</em>
      </p>
      <p
        style={{
          font: "var(--text-body)",
          color: "var(--muted-foreground)",
          margin: "var(--space-3) auto 0",
          maxWidth: "46ch",
          textWrap: "pretty",
        }}
      >
        When they&rsquo;re ready, you&rsquo;ll find them here. For now, everything
        you need is in your <Link className="ws-link" href="/plan">Stages</Link>,{" "}
        <Link className="ws-link" href="/operate">
          Managing &amp; Operating
        </Link>
        , <Link className="ws-link" href="/resources">Resources</Link>, and{" "}
        <Link className="ws-link" href="/live">Live Programming</Link>.
      </p>
    </div>
  );
}
