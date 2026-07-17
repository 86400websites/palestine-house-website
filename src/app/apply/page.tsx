import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TatreezDivider } from "@/components/shared/tatreez-divider";
import { Photo } from "@/components/shared/photo";
import { Reveal } from "@/components/motion/reveal";
import { ApplyForm } from "@/components/sections/apply-form";
import { createClient } from "@/lib/supabase/server";

/* Apply (/apply) — the single application; apply = sign-up. Copy verbatim
   from docs/page-copy/01-public-pages/apply-partner.md; layout from
   docs/page-designs/public/Apply.app.jsx (approved mockup). An already-signed-in
   visitor is sent to their dashboard rather than the application form (their
   account already exists) — S7 fix. */

export const metadata: Metadata = {
  title: "Apply to bring a House",
  description:
    "The one step. Submitting this form creates your account and sends your application to HQ — there’s no separate sign-up.",
};

const APPLY_STEPS = [
  {
    n: "01",
    title: "You apply",
    text: "Complete one form to create your account and send your application directly to HQ.",
  },
  {
    n: "02",
    title: "HQ reviews your application",
    text: "While your application is being reviewed, your account will remain pending. When you sign in, you will see a simple update confirming that the review is in progress.",
  },
  {
    n: "03",
    title: "The full platform opens",
    text: "Once approved, you will receive access to the complete platform, including the playbook, toolkit, and Academy. There is no additional registration or second sign-up process.",
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
            Bring a Palestine House to your city.
          </h1>
          <p className="apply-hero-lead">
            Complete one application to introduce your vision, create your
            account, and send your proposal directly to HQ. There is no separate
            sign-up process — your application and account are created together
            in one simple step.
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
              <p className="ph-eyebrow">Who brings what</p>
              <p>
                You bring the venue, the team, the local relationships, and the
                daily commitment required to run a successful cultural business.
                We bring the Palestine House identity, shared standards,
                complete toolkit, and ongoing support to help you build and
                operate it well. Every House works under a clear licence that
                protects the quality, integrity, and meaning of the Palestine
                House name.
              </p>
            </div>

            <div className="apply-context-block">
              <p className="ph-eyebrow">Before you apply</p>
              <p>
                Every Palestine House shares three core commitments:{" "}
                <strong>cultural independence</strong>,{" "}
                <strong>responsible use of the brand</strong>, and{" "}
                <strong>honest, transparent reporting</strong>. If these
                principles reflect how you want to work, we would be glad to
                hear from you.
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
                      <p className="apply-step-title">{s.title}.</p>
                      <p>{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="apply-questions">
                Have a question before applying?{" "}
                <Link href="/contact">Contact us</Link>. You do not need to
                submit an application to get in touch.
              </p>
            </div>
          </Reveal>

          <Reveal className="ph-card apply-form-card">
            <h2 className="apply-form-title">The application.</h2>
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
