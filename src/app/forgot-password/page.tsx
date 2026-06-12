import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { ForgotPasswordForm } from "@/components/sections/auth-forms";

/* Forgot password (/forgot-password) — UI shell; the real reset flow arrives
   in Sprint 3b. Copy verbatim from docs/page-copy/02-auth-pages/
   forgot-password.md; layout from docs/page-designs/auth/ForgotPassword.app.jsx. */

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link for Palestine House.",
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <section className="auth-section">
      <div className="ph-container auth-inner">
        <Reveal className="auth-card">
          <ForgotPasswordForm />
        </Reveal>
      </div>
    </section>
  );
}
