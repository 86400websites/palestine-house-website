import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { LoginForm } from "@/components/sections/auth-forms";

/* Login (/login) — UI shell; Supabase sign-in arrives in Sprint 3a. Copy
   verbatim from docs/page-copy/02-auth-pages/login.md; layout from
   docs/page-designs/auth/Login.app.jsx (warm side panel, PH-SIGNUP-01). */

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Palestine House.",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <section className="auth-section">
      <div className="ph-container auth-inner">
        <Reveal className="auth-card has-art">
          <div className="auth-card-main">
            <LoginForm />
          </div>
          <div className="auth-art" aria-hidden="true">
            <Image
              src="/assets/art/PH-SIGNUP-01.png"
              alt=""
              fill
              sizes="(max-width: 760px) 0px, 40vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
