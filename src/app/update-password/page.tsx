import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { UpdatePasswordForm } from "@/components/sections/auth-forms";

/* Update password (/update-password, reached from a reset link). Copy verbatim
   from docs/page-copy/02-auth-pages/update-password.md; layout from
   docs/page-designs/auth/UpdatePassword.app.jsx.

   updatePasswordAction only proceeds with the short-lived ph-recovery marker
   that /auth/confirm sets when the user arrives from a recovery email. Without
   it, the action redirects to /forgot-password — so if we rendered the form
   anyway, a direct visitor (or one whose 10-minute marker has expired) would
   fill it in and be silently bounced with their input lost. Reading the marker
   here lets us show a fresh-link prompt instead of a form guaranteed to fail
   (S7 fix). Reading the cookie makes this route dynamic — fine for an auth page,
   no CSP impact. */

export const metadata: Metadata = {
  title: "Update password",
  description: "Set a new Palestine House password.",
  robots: { index: false, follow: false },
};

export default async function UpdatePasswordPage() {
  const cookieStore = await cookies();
  const fromRecovery = cookieStore.get("ph-recovery")?.value === "1";

  return (
    <section className="auth-section">
      <div className="ph-container auth-inner">
        <Reveal className="auth-card">
          {fromRecovery ? (
            <UpdatePasswordForm />
          ) : (
            <div>
              <h1>Set a new password.</h1>
              <p className="auth-sub">
                Open the reset link from your email to set a new password, or
                request a fresh one.
              </p>
              <p className="auth-foot">
                <Link href="/forgot-password">Send a reset link</Link>
              </p>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
