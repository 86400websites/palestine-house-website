import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { LoginForm } from "@/components/sections/auth-forms";
import { getArtworkSrc } from "@/components/shared/artwork";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-redirect";

/* Login (/login). Copy verbatim from docs/page-copy/02-auth-pages/login.md;
   layout from docs/page-designs/auth/Login.app.jsx (warm side panel,
   PH-SIGNUP-01). An already-signed-in visitor (bookmark/back-button) is sent on
   to their destination instead of seeing the sign-in form (S7 fix). */

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Palestine House.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(safeNextPath(next, "/dashboard"));
  }

  return (
    <section className="auth-section">
      <div className="ph-container auth-inner">
        <Reveal className="auth-card has-art">
          <div className="auth-card-main">
            <LoginForm next={next} />
          </div>
          <div className="auth-art" aria-hidden="true">
            <Image
              src={getArtworkSrc("PH-SIGNUP-01")}
              alt=""
              fill
              sizes="(max-width: 760px) 0px, 40vw"
              style={{ objectFit: "cover", objectPosition: "50% 58%" }}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
