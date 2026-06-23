import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, ChevronRight, Clock, Compass, Info, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, FadeIn } from "@/components/motion/reveal";
import { getMyProfile, firstNameOf } from "@/lib/auth/profile";
import { getChecklist, getElements } from "@/lib/workspace/content";
import {
  getChecklistProgress,
  deriveBuildModel,
  deriveProgressSnapshot,
} from "@/lib/workspace/progress";
import type { ProgressStage } from "@/lib/workspace/types";

/* /dashboard (docs/page-copy/03-member-workspace/dashboard.md) — answers one
   question: where am I, what's next? Never a wall. Three states:
   - pending: "under review" while HQ decides (S4);
   - newly approved (nothing started): the empty-state welcome (S4);
   - mid-journey (Design & Build started): the snapshot — current stage +
     Design & Build % + the next few focus areas (S6 6a). Gates are NOT shown
     (gate data all-null, Gate 2 label unapproved — D-S6-b). Approval + progress
     are read live (cached), so it flips without a re-login. */

export const metadata: Metadata = { title: "Welcome" };

const STAGE_LABEL: Record<ProgressStage, string> = {
  plan: "Plan & Prepare",
  build: "Design & Build",
  operate: "Operate & Program",
};

export default async function DashboardPage() {
  const profile = await getMyProfile();
  const approved = profile?.is_approved ?? false;

  if (!approved) {
    return (
      <div>
        <h1 className="ws-h1">Welcome.</h1>
        <FadeIn>
          <div className="ws-notice">
            <span className="ws-notice-icon">
              <Clock size={22} />
            </span>
            <div>
              <h2 className="ws-notice-h">Request received — under review.</h2>
              <p className="ws-notice-p">
                Every application is reviewed by HQ. Everything here unlocks the
                moment yours is approved.
              </p>
            </div>
          </div>
        </FadeIn>
        <p className="ws-help ws-help--mt">
          <span className="ws-help-icon">
            <Info size={17} />
          </span>
          <span>
            Stuck? <strong>Support</strong> is one click away.
          </span>
        </p>
      </div>
    );
  }

  const [checklist, elements, progress] = await Promise.all([
    getChecklist(),
    getElements(),
    getChecklistProgress(),
  ]);
  const snapshot = deriveProgressSnapshot(
    deriveBuildModel(checklist, elements, progress),
  );

  if (!snapshot.started) {
    return (
      <div>
        <h1 className="ws-h1">You’re approved — welcome.</h1>
        <Reveal>
          <p className="ws-lead">
            Start in Plan &amp; Prepare: understand the model and your city before
            you build a thing.
          </p>
          <div className="ws-cta-row">
            <Button asChild>
              <Link href="/plan">Start in Plan &amp; Prepare</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/focus-areas">Explore the focus areas</Link>
            </Button>
          </div>
        </Reveal>
        <p className="ws-help ws-help--mt-lg">
          <span className="ws-help-icon">
            <Info size={17} />
          </span>
          <span>
            Stuck? <strong>Support</strong> is one click away.
          </span>
        </p>
        <p className="ws-help ws-help--mt-sm">
          <span className="ws-help-icon">
            <Calendar size={17} />
          </span>
          <span>
            <em>Take a break — catch a live event or a recording</em> →{" "}
            <Link href="/live">Live Programming</Link>.
          </span>
        </p>
      </div>
    );
  }

  // Mid-journey snapshot (S6 6a). Gate column suppressed (D-S6-b).
  const firstName = firstNameOf(profile?.full_name);
  return (
    <div>
      <h1 className="ws-h1">
        {firstName ? `Welcome back, ${firstName}.` : "Welcome back."} Here’s your
        next move.
      </h1>

      <div className="dash-grid" style={{ marginTop: "var(--space-8)" }}>
        <Reveal className="ws-card">
          <p className="ph-eyebrow">Progress snapshot</p>
          <div className="dash-stats">
            <div className="ws-stat">
              <span className="ws-stat-label">
                <span className="ws-stat-ico">
                  <Compass size={14} aria-hidden="true" />
                </span>
                Current stage
              </span>
              <span className="ws-stat-value">{STAGE_LABEL[snapshot.stage]}</span>
            </div>
            <div className="ws-stat">
              <span className="ws-stat-label">
                <span className="ws-stat-ico">
                  <TrendingUp size={14} aria-hidden="true" />
                </span>
                Design &amp; Build
              </span>
              <span className="ws-stat-value">{snapshot.pct}%</span>
            </div>
          </div>
          <div
            className="dash-progress"
            role="progressbar"
            aria-valuenow={snapshot.pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Design and Build progress"
          >
            <span style={{ width: `${snapshot.pct}%` }} />
          </div>
        </Reveal>

        {snapshot.nextAreas.length > 0 && (
          <Reveal className="ws-card" delay={0.08}>
            <p className="ph-eyebrow">Next steps</p>
            <div className="dash-next" style={{ marginTop: "var(--space-4)" }}>
              {snapshot.nextAreas.map((area, i) => (
                <Link className="dash-next-row" href="/build" key={area.code}>
                  <span className="dash-next-num">{i + 1}</span>
                  <span style={{ flex: 1 }}>
                    {area.name} — {area.done} of {area.items} done
                  </span>
                  <span
                    style={{ display: "inline-flex", color: "var(--stone-400)" }}
                  >
                    <ChevronRight size={16} aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
        )}
      </div>

      <Reveal delay={0.16}>
        <div className="ws-cta-row" style={{ marginTop: "var(--space-8)" }}>
          <Button asChild>
            <Link href="/build">Resume where you left off</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/build">Continue in Design &amp; Build</Link>
          </Button>
        </div>
      </Reveal>

      <p className="ws-help ws-help--mt-lg">
        <span className="ws-help-icon">
          <Info size={17} />
        </span>
        <span>
          Stuck? <strong>Support</strong> is one click away.
        </span>
      </p>
      <p className="ws-help ws-help--mt-sm">
        <span className="ws-help-icon">
          <Calendar size={17} />
        </span>
        <span>
          <em>Take a break — catch a live event or a recording</em> →{" "}
          <Link href="/live">Live Programming</Link>.
        </span>
      </p>
    </div>
  );
}
