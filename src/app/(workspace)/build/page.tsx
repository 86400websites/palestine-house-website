import type { Metadata } from "next";
import { getMyProfile } from "@/lib/auth/profile";
import { getChecklist, getElements } from "@/lib/workspace/content";
import {
  getChecklistProgress,
  deriveBuildModel,
} from "@/lib/workspace/progress";
import { PendingState } from "@/components/workspace/pending-state";
import { BuildTracker } from "./build-tracker";

/* /build — Design & Build, the launch checklist tracker (S6 6c). The only
   per-user-interactive page: approved partners save per-item progress via
   set_checklist_progress (the BuildTracker client shell). Gated before any
   fetch (pending -> PendingState). Gates are NOT rendered — gate data is all
   null and Gate 2's label is unapproved (D-S6-b); the focus-area grouping is
   the view until HQ supplies the gate->item mapping. */

export const metadata: Metadata = { title: "Design & Build" };

export default async function BuildPage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PendingState />;

  const [checklist, elements, progress] = await Promise.all([
    getChecklist(),
    getElements(),
    getChecklistProgress(),
  ]);
  const model = deriveBuildModel(checklist, elements, progress);

  return (
    <div>
      <h1 className="ws-h1">Design &amp; Build your House.</h1>
      <p className="ws-lead">
        Your 120-day plan, tracked. One focus area at a time — we hold your place
        and show you what&rsquo;s next. No wall of tasks.
      </p>

      {model.totalItems === 0 ? (
        <div className="ws-empty" style={{ marginTop: "var(--space-10)" }}>
          <p
            style={{
              font: "var(--weight-semibold) var(--text-lg)/1.3 var(--font-display)",
              color: "var(--foreground)",
              margin: 0,
            }}
          >
            Nothing checked off yet.
          </p>
          <p style={{ margin: 0 }}>
            Start with your first focus area — or let us point you to the right
            first step.
          </p>
        </div>
      ) : (
        <div style={{ marginTop: "var(--space-8)" }}>
          <BuildTracker model={model} />
        </div>
      )}
    </div>
  );
}
