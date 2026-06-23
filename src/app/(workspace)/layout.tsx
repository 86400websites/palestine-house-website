import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile, firstNameOf } from "@/lib/auth/profile";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { SiteHeader } from "@/components/layout/site-header";

/* Gated workspace layout (SECURITY-CHECKLIST §6/§15): the authoritative,
   server-side session gate for every page in this route group. An anonymous
   visitor is sent to /login; an authenticated one (approved or pending) gets
   the shell, and each page decides what it may show from get_my_profile().
   Approval is read live every request, so an HQ approval unlocks on the
   partner's next navigation with no re-login. Gated pages read cookies and so
   render dynamically — public pages stay static, the CSP is untouched. */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const profile = await getMyProfile();

  /* The locked public navigation rides above the workspace shell so partners can
     jump back to the marketing pages from inside the dashboard. The header is
     rendered here (not via the root SiteChrome, which returns bare children for
     gated routes), so there is exactly one header. */
  return (
    <div className="ws-frame">
      <SiteHeader />
      <WorkspaceShell
        approved={profile?.is_approved ?? false}
        firstName={firstNameOf(profile?.full_name)}
      >
        {children}
      </WorkspaceShell>
    </div>
  );
}
