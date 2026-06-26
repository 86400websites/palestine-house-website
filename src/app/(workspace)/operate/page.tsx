import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stagger } from "@/components/motion/reveal";
import { getMyProfile } from "@/lib/auth/profile";
import { getElements } from "@/lib/workspace/content";
import { PendingState } from "@/components/workspace/pending-state";
import type { ElementListItem } from "@/lib/workspace/types";

/* /operate — Operate & Program / Managing & Operating
   (docs/page-copy/03-member-workspace/operate.md). The same 30 elements as
   /plan and /build, reframed as daily operating routines — read-only, NO
   tracker. Gated before any fetch: a pending session sees the under-review
   notice, never content.

   The group -> topic-code curation AND the per-group routine cadences are
   locked from the approved Operate mockup (workspace-data.jsx ->
   WS_OPERATE_GROUPS); group names are verbatim copy. Topic titles + one-lines
   are resolved live from the DB elements — never restated here. */

export const metadata: Metadata = { title: "Operate & Program" };

// Operating groupings + recurring routines, verbatim from the approved Operate
// mockup (WS_OPERATE_GROUPS). All 30 topics appear once across the groups — a
// locked curation decision, not invented here. S10 (10-2) reviewed the
// operate-vs-program split and intentionally kept all 30 here: focus area D
// (Programming & Aswātna — D1/D2/D3) already leads the page, so program reads
// distinct from the operating routines below it (owner decision, D-S10-b).
const OPERATE_GROUPS: { name: string; routine: string; codes: string[] }[] = [
  {
    name: "Programming & Aswātna",
    routine: "Run-of-show before every event",
    codes: ["D1", "D2", "D3"],
  },
  {
    name: "Membership & Service",
    routine: "Shift briefing, every guest-facing shift",
    codes: ["A1", "A2", "E1", "E2", "E3"],
  },
  {
    name: "Operations & F&B",
    routine: "Open & close checklists, daily",
    codes: ["C1", "C2", "C3", "F1", "F2", "F3"],
  },
  {
    name: "Marketing & Retail",
    routine: "Weekly content and shop review",
    codes: ["A3", "G1", "G2", "G3"],
  },
  {
    name: "Finance & KPIs",
    routine: "Monthly actuals-vs-forecast",
    codes: ["H1", "H2", "H3"],
  },
  {
    name: "Quality & Tech",
    routine: "Quarterly standards review",
    codes: ["B1", "B2", "I1", "I2", "J1", "J2"],
  },
  {
    name: "Crisis & Sustainability",
    routine: "Twice-yearly readiness drill",
    codes: ["B3", "I3", "J3"],
  },
];

export default async function OperatePage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PendingState />;

  const elements = await getElements();
  const byCode = new Map(elements.map((e) => [e.code, e] as const));

  // Resolve each group's codes to DB elements, dropping any that aren't found
  // (defensive — all 30 are ingested, but the data layer fails closed to []).
  const groups = OPERATE_GROUPS.map((g) => ({
    name: g.name,
    routine: g.routine,
    topics: g.codes
      .map((code) => byCode.get(code))
      .filter((e): e is ElementListItem => Boolean(e)),
  })).filter((g) => g.topics.length > 0);

  // "Open today's checklists" opens the first operating topic.
  const firstTopic = groups[0]?.topics[0] ?? null;

  return (
    <div>
      <p className="ph-eyebrow">Stage 3 · Managing &amp; Operating</p>
      <h1 className="ws-h1" style={{ marginTop: "var(--space-2)" }}>
        Run your House.
      </h1>
      <p className="ws-lead">
        Open for business? Here are your daily routines — the same thirty
        topics, now built for the everyday.
      </p>

      <div className="ws-cta-row">
        {firstTopic && (
          <Button asChild>
            <Link href={`/elements/${firstTopic.slug}`}>
              Open today&rsquo;s checklists
            </Link>
          </Button>
        )}
        <Button asChild variant="secondary">
          <Link href="/resources">Pull a template</Link>
        </Button>
      </div>

      {groups.map((g) => (
        <section key={g.name} style={{ marginTop: "var(--space-12)" }}>
          <div className="ws-section-head">
            <h2 className="ws-section-h">{g.name}</h2>
            <span className="ws-section-meta">
              <Clock size={14} aria-hidden="true" /> {g.routine}
            </span>
          </div>
          <div style={{ marginTop: "var(--space-4)" }}>
            <Stagger className="ws-rows">
              {g.topics.map((t) => (
                <Link
                  className="topic-row ws-lift"
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
                  <span className="topic-row-meta">Checklist · Templates</span>
                  <span className="topic-row-chev">
                    <ChevronRight size={16} aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </Stagger>
          </div>
        </section>
      ))}
    </div>
  );
}
