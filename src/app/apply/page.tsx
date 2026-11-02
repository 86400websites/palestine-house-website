import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TatreezDivider } from "@/components/shared/tatreez-divider";
import { Photo } from "@/components/shared/photo";
import { Reveal } from "@/components/motion/reveal";
import { ApplyForm } from "@/components/sections/apply-form";
import { createClient } from "@/lib/supabase/server";

/* Apply (/apply) — the single application; apply = sign-up. Copy verbatim
   from the CR1 public copy, section 7; layout from
   docs/page-designs/public/Apply.app.jsx (approved mockup). An already-signed-in
   visitor is sent to their dashboard rather than the application form (their
   account already exists) — S7 fix. */

export const metadata: Metadata = {
  title: { absolute: "Apply to Join - Palestine House" },
  description:
    "Request access to the Palestine House community’s private resources and connections.",
};

const APPLY_STEPS = [
  {
    n: "01",
    title: "Send your application",
    text: "Use the form below to create your account and request community access in one step.",
  },
  {
    n: "02",
    title: "Receive an access update",
    text: "While your community access is being arranged, your account remains pending. Sign in to see the current access update.",
  },
  {
    n: "03",
    title: "Explore the resources",
    text: "Once community access is confirmed, use the same account to explore the guides, templates and connections. No second registration is needed.",
  },
] as const;

export default async function ApplyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    // Already applied → dashboard. But a stranded session (signed up, then the
    // application insert failed) has no application row; let those users reach
    // the form so applyAction's idempotent recovery can finish, rather than
    // trapping them on the pending dashboard with nothing in HQ's queue
    // (S7 exit-gate fix).
    const { data: apps } = await supabase
      .from("applications")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);
    if (apps && apps.length > 0) {
      redirect("/dashboard");
    }
  }

  return (
    <>
      {/* 1 — v3 split hero (owner mockup, 2026-07-15): cream copy + short copper
          rule · the House-entrance photo bleeding to the right edge. /apply left
          OVERLAY_ROUTES so the cream-bar header sits above it. Copy verbatim. */}
      <section className="apply-hero">
        <Reveal className="apply-hero-copy">
          <p className="ph-eyebrow">Apply</p>
          <h1 className="apply-hero-h1 v3-rule-head">
            Apply to join the Palestine House community.
          </h1>
          <p className="apply-hero-lead">
            Tell us a little about yourself, your city and your interest in
            developing a Palestine House. Your idea can still be at an early
            stage.
          </p>
          <p className="apply-hero-lead">
            This application is for access to the community’s guides, templates
            and connections. It is not an application for permission to open or
            operate a local House.
          </p>
        </Reveal>
        <div className="apply-hero-photo">
          <Photo
            assetId="ph-photo-apply-hero"
            alt="A House entrance hall — an arched doorway, framed tatreez, and a bench dressed in embroidered cushions."
            sizes="(max-width: 880px) 100vw, 52vw"
            priority
          />
        </div>
      </section>

      {/* 2–5 — Context + the form */}
      <section className="ph-section-lg">
        <div className="ph-container apply-grid">
          <Reveal className="apply-context">
            <div className="apply-context-block">
              <p className="ph-eyebrow">What you are joining</p>
              <p>
                A community for people developing their own Palestine Houses,
                with practical resources and opportunities to learn from others.
                You build and run your House locally; the community does not
                operate it for you.
              </p>
            </div>

            <div className="apply-context-block">
              <p className="ph-eyebrow">Your idea can still be developing</p>
              <p>
                You do not need a secured venue, complete team, finished
                business plan or supporting documents to request community
                access. A short introduction is enough to explain your interest.
              </p>
            </div>

            <div className="apply-context-block">
              <p className="ph-eyebrow">What happens next</p>
              <ol className="apply-steps">
                {APPLY_STEPS.map((s) => (
                  <li key={s.n}>
                    <span className="apply-step-n">{s.n}</span>
                    <div>
                      {/* Not a heading: these precede the page's first h2, and
                          h1 → h3 → h2 breaks the outline (DR1-10 design QA).
                          Styled identically via the widened .apply-steps
                          selector in pages.css. */}
                      <p className="apply-step-title">{s.title}</p>
                      <p>{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="apply-questions">
                A question about joining?{" "}
                <Link href="/contact">Contact us</Link> before applying if you
                need clarification.
              </p>
            </div>
          </Reveal>

          <Reveal className="ph-card apply-form-card">
            <h2 className="apply-form-title">Your community application</h2>
            <div className="apply-form-divider">
              <TatreezDivider width="120px" opacity={0.7} palette="v3" />
            </div>
            <ApplyForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
