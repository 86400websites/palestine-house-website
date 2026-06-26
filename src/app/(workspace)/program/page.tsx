import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stagger } from "@/components/motion/reveal";
import { getMyProfile } from "@/lib/auth/profile";
import { getElements } from "@/lib/workspace/content";
import { PendingState } from "@/components/workspace/pending-state";
import type { ElementListItem } from "@/lib/workspace/types";

/* /program — Program (S10 10-9, owner direction D-S10-b). The guest-facing side
   of the House: cultural programming + the Aswātna collaboration, and the
   membership/service that shapes every visit. These two groups moved out of
   /operate; the same elements, the same approved Operate curation + routine
   cadences — never invented here. Gated before any fetch (pending -> notice).
   Read-only, NO tracker. All 30 topics still appear once, split /program +
   /operate. Topic titles + one-lines are resolved live from the DB elements. */

export const metadata: Metadata = { title: "Program" };

const PROGRAM_GROUPS: { name: string; routine: string; codes: string[] }[] = [
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
];

export default async function ProgramPage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PendingState />;

  const elements = await getElements();
  const byCode = new Map(elements.map((e) => [e.code, e] as const));

  // Resolve each group's codes to DB elements, dropping any not found
  // (defensive — all are ingested, but the data layer fails closed to []).
  const groups = PROGRAM_GROUPS.map((g) => ({
    name: g.name,
    routine: g.routine,
    topics: g.codes
      .map((code) => byCode.get(code))
      .filter((e): e is ElementListItem => Boolean(e)),
  })).filter((g) => g.topics.length > 0);

  const firstTopic = groups[0]?.topics[0] ?? null;

  return (
    <div>
      <p className="ph-eyebrow">Program</p>
      <h1 className="ws-h1" style={{ marginTop: "var(--space-2)" }}>
        Programming &amp; guests.
      </h1>
      <p className="ws-lead">
        What the people who walk in actually experience — your cultural
        programming and the Aswātna collaboration, plus the membership and
        service that shape every visit.
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
