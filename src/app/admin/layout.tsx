import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/profile";
import { AdminShell } from "@/components/admin/admin-shell";

/* Admin gate (SECURITY-CHECKLIST §15): every /admin/* request verifies the
   admins table server-side via is_admin(). is_approved alone is NOT admin.
   Anonymous → login; an authenticated non-admin → 404 (notFound), so the route
   never reveals that it exists. */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/admin/approvals");
  }
  if (!(await isAdmin())) {
    notFound();
  }

  return <AdminShell active="approvals">{children}</AdminShell>;
}
