import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyProfile } from "@/lib/auth/profile";
import { getElements } from "@/lib/workspace/content";
import { PendingState } from "@/components/workspace/pending-state";
import type { ElementListItem } from "@/lib/workspace/types";

/* /plan — Plan & Prepare (docs/page-copy/03-member-workspace/plan.md). The
   read-and-consult orientation stage: a foundation-framed VIEW over the same
   30 elements as /build and /operate — NO tracker, no saved progress here (the
   120-day checklist toward the 3 gates lives only in /build). Gated before any
   fetch: a pending session sees the under-review notice, never content.

   The group -> topic-code curation is the locked grouping from the approved
   Plan mockup (workspace-data.jsx -> WS_PLAN_GROUPS); group names are verbatim
   copy. Topic titles + one-lines are resolved live from the DB elements (the
   canonical content) — never restated here. */

export const metadata: Metadata = { title: "Plan & Prepare" };

// Foundation groupings, verbatim from the approved Plan mockup
// (WS_PLAN_GROUPS). The codes select which of the 30 topics frame the
// foundation stage — a locked curation decision, not invented here.
const PLAN_GROUPS: { name: string; codes: string[] }[] = [
  { name: "Governance & the model", codes: ["A1", "B1", "B2", "B3", "H1"] },
  { name: "Your city & community", codes: ["A2", "E3", "G1"] },
  { name: "Your venue & space", codes: ["F1", "F2", "I2"] },
];

export default async function PlanPage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PendingState />;

  const elements = await getElements();
  const byCode = new Map(elements.map((e) => [e.code, e] as const));

  // Resolve each group's codes to DB elements, dropping any that aren't found
  // (defensive — all 30 are ingested, but the data layer fails closed to []).
  const groups = PLAN_GROUPS.map((g) => ({
    name: g.name,
    topics: g.codes
      .map((code) => byCode.get(code))
      .filter((e): e is ElementListItem => Boolean(e)),
  })).filter((g) => g.topics.length > 0);

  // "Read the foundations" opens the first foundation topic.
  const firstTopic = groups[0]?.topics[0] ?? null;

  return (
    <div>
      <p className="ph-eyebrow">Stage 1</p>
      <h1 className="ws-h1" style={{ marginTop: "var(--space-2)" }}>
        Plan &amp; Prepare.
      </h1>
      <p className="ws-lead">
        Before the launch checklist, get the ground right — the model, your
        city, and your venue. Read these, then move into Design &amp; Build when
        you&rsquo;re ready.
      </p>

      {firstTopic && (
        <div className="ws-cta-row">
          <Button asChild>
            <Link href={`/elements/${firstTopic.slug}`}>
              Read the foundations
            </Link>
          </Button>
        </div>
      )}

      {groups.map((g) => (
        <section key={g.name} style={{ marginTop: "var(--space-12)" }}>
          <h2 className="ws-section-h">{g.name}</h2>
          <div className="ws-rows" style={{ marginTop: "var(--space-4)" }}>
            {g.topics.map((t) => (
              <Link
                className="topic-row"
                href={`/elements/${t.slug}`}
                key={t.code}
              >
                <span className="topic-code">{t.code}</span>
                <span className="topic-row-body">
                  <span className="topic-row-title" style={{ display: "block" }}>
                    {t.title}
                  </span>
                  {t.one_line && (
                    <span
                      className="topic-row-line"
                      style={{ display: "block" }}
                    >
                      {t.one_line}
                    </span>
                  )}
                </span>
                <span className="topic-row-meta">Overview · Simple Guide</span>
                <span className="topic-row-chev">
                  <ChevronRight size={16} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
          <p
            style={{
              font: "var(--weight-regular) var(--text-sm)/1.5 var(--font-body)",
              color: "var(--subtle-foreground)",
              margin: "var(--space-3) 0 0",
            }}
          >
            Each topic opens with the standard and the thinking behind it —{" "}
            <Link className="ws-link" href={`/elements/${g.topics[0].slug}`}>
              Open this topic
            </Link>
            .
          </p>
        </section>
      ))}

      <p className="ws-help ws-help--mt-lg">
        <span className="ws-help-icon">
          <Info size={17} />
        </span>
        <span>
          This is the orientation stage. When you&rsquo;re ready to track the
          120-day launch, move into <Link href="/build">Design &amp; Build</Link>
          .
        </span>
      </p>
    </div>
  );
}
