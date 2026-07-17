import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stagger } from "@/components/motion/reveal";
import { getMyProfile } from "@/lib/auth/profile";
import { getElements } from "@/lib/workspace/content";
import { PendingState } from "@/components/workspace/pending-state";
import type { ElementListItem } from "@/lib/workspace/types";

/* /food — Food (FA11, owner direction 2026-07-17). The culinary side of the
   House: Focus Area K "Café & Culinary Experience" — the menu and its verified
   stories, the qahwa/coffee ritual, and catering + culinary programming. Same
   read-only curated-section pattern as /operate and /program (approved copy at
   the FA11-1 gate — never invented here). Gated before any fetch (pending ->
   notice). Read-only, NO tracker. Topic titles + one-lines are resolved live
   from the DB elements; K1..K3 render only once the Food ingest has run. */

export const metadata: Metadata = { title: "Food" };

const FOOD_GROUPS: { name: string; routine: string; codes: string[] }[] = [
  {
    name: "Café & Culinary Experience",
    routine: "Daily calibration, quarterly menu review",
    codes: ["K1", "K2", "K3"],
  },
];

export default async function FoodPage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PendingState />;

  const elements = await getElements();
  const byCode = new Map(elements.map((e) => [e.code, e] as const));

  // Resolve each group's codes to DB elements, dropping any not found
  // (defensive — the data layer fails closed to [], and K1..K3 exist only
  // after the Food ingest has run on this database).
  const groups = FOOD_GROUPS.map((g) => ({
    name: g.name,
    routine: g.routine,
    topics: g.codes
      .map((code) => byCode.get(code))
      .filter((e): e is ElementListItem => Boolean(e)),
  })).filter((g) => g.topics.length > 0);

  const firstTopic = groups[0]?.topics[0] ?? null;

  return (
    <div>
      <p className="ph-eyebrow">Food</p>
      <h1 className="ws-h1" style={{ marginTop: "var(--space-2)" }}>
        The café &amp; culinary experience.
      </h1>
      <p className="ws-lead">
        What the House serves and how it serves it — the menu and its stories,
        the qahwa and coffee ritual, and the catering that takes the table
        beyond the counter.
      </p>

      <div className="ws-cta-row">
        {firstTopic && (
          <Button asChild>
            <Link href={`/elements/${firstTopic.slug}`}>
              Open the first topic
            </Link>
          </Button>
        )}
        <Button asChild variant="secondary">
          <Link href="/operate">Go to Operate</Link>
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
