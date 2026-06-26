import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Clock,
  MessageCircle,
  Users,
} from "lucide-react";
import { FadeIn, Stagger } from "@/components/motion/reveal";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile, firstNameOf } from "@/lib/auth/profile";
import { getChecklist, getElements } from "@/lib/workspace/content";
import {
  getChecklistProgress,
  deriveBuildModel,
  deriveProgressSnapshot,
} from "@/lib/workspace/progress";

/* /dashboard (docs/page-copy/03-member-workspace/dashboard.md) — the Welcome
   page. Two states:
   - pending: the calm "under review" notice (S10 10-3);
   - approved: a minimal premium dashboard of four nav cards (Plan · Build ·
     Operate · Program) — each an icon (an image can drop into the art slot
     later), a one-liner, and a link to that page, with the live Design & Build
     % on the Build card (S10 10-10).
   Approval is read live (cached), so it flips without a re-login. */

export const metadata: Metadata = { title: "Welcome" };

export default async function DashboardPage() {
  const profile = await getMyProfile();
  const approved = profile?.is_approved ?? false;

  if (!approved) {
    // Distinguish a declined applicant from a pending one. The caller reads only
    // their OWN application row (owner-scoped RLS); a declined account keeps
    // is_approved = false just like a pending one, so the status drives the copy.
    const supabase = await createClient();
    const { data: app } = await supabase
      .from("applications")
      .select("status")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const declined = app?.status === "declined";

    return (
      <div>
        <h1 className="ws-h1">Welcome.</h1>
        <FadeIn>
          {declined ? (
            <div className="ws-notice">
              <span className="ws-notice-icon">
                <MessageCircle size={22} />
              </span>
              <div>
                <h2 className="ws-notice-h">
                  We’re not moving forward right now.
                </h2>
                <p className="ws-notice-p">
                  After careful review, HQ isn’t taking your application further
                  at this time. If you have questions, we’d like to hear from
                  you —{" "}
                  <Link className="ws-notice-link" href="/contact">
                    contact us
                  </Link>
                  .
                </p>
              </div>
            </div>
          ) : (
            <div className="ws-notice">
              <span className="ws-notice-icon">
                <Clock size={22} />
              </span>
              <div>
                <h2 className="ws-notice-h">
                  Your application is under review.
                </h2>
                <p className="ws-notice-p">
                  HQ reads every one by hand. The moment yours is approved,
                  everything here opens up — check back any time.
                </p>
              </div>
            </div>
          )}
        </FadeIn>
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
  const firstName = firstNameOf(profile?.full_name);

  const cards = [
    {
      key: "plan",
      title: "Plan",
      Icon: Bookmark,
      line: "Get the ground right before you build — the model, your city, your space.",
      href: "/plan",
      cta: "Open Plan",
    },
    {
      key: "build",
      title: "Build",
      Icon: CheckCircle2,
      line: "Your 120-day launch, tracked one focus area at a time.",
      href: "/build",
      cta: snapshot.started ? "Resume Build" : "Start Build",
    },
    {
      key: "operate",
      title: "Operate",
      Icon: Clock,
      line: "The day-to-day routines that keep an open House running.",
      href: "/operate",
      cta: "Open Operate",
    },
    {
      key: "program",
      title: "Program",
      Icon: Users,
      line: "Your cultural programming and the guests who walk in.",
      href: "/program",
      cta: "Open Program",
    },
  ];

  return (
    <div>
      <h1 className="ws-h1">
        {firstName ? `Welcome, ${firstName}.` : "Welcome."}
      </h1>
      <p className="ws-lead">
        Start in Plan, then move through Build, Operate, and Program.
      </p>

      <Stagger className="dash-cards">
        {cards.map((c) => (
          <Link key={c.key} className="dash-card" href={c.href}>
            <span className="dash-card-art" aria-hidden="true">
              <c.Icon size={24} />
            </span>
            <span className="dash-card-title">{c.title}</span>
            <span className="dash-card-line">{c.line}</span>
            {c.key === "build" && (
              <span className="dash-card-progress">
                <span
                  className="dash-card-bar"
                  role="progressbar"
                  aria-valuenow={snapshot.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Design and Build progress"
                >
                  <span style={{ width: `${snapshot.pct}%` }} />
                </span>
                <span className="dash-card-meta">
                  {snapshot.started
                    ? `${snapshot.pct}% complete`
                    : "Not started yet"}
                </span>
              </span>
            )}
            <span className="dash-card-cta">
              {c.cta}
              <ArrowRight size={16} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </Stagger>
    </div>
  );
}
