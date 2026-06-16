import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { UpdatePasswordForm } from "@/components/sections/auth-forms";

/* Update password (/update-password, reached from a reset link) — UI shell;
   the real flow arrives in Sprint 3b. Copy verbatim from docs/page-copy/
   02-auth-pages/update-password.md; layout from docs/page-designs/auth/
   UpdatePassword.app.jsx. */

export const metadata: Metadata = {
  title: "Update password",
  description: "Set a new Palestine House password.",
  robots: { index: false, follow: false },
};

export default function UpdatePasswordPage() {
  return (
    <section className="auth-section">
      <div className="ph-container auth-inner">
        <Reveal className="auth-card">
          <UpdatePasswordForm />
        </Reveal>
      </div>
    </section>
  );
}
