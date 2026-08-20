import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/profile";
import { AdminsAdmin, type AdminRow } from "./admins-admin";

/* /admin/content/admins (S11 11-9) — see / add / remove HQ admins (the old-S10
   admin-management UI folds in here). is_admin()-gated by the /admin layout and
   inside every 0024 RPC. The roster shows email + when they were added; add is
   by email; remove guards against removing yourself or the last admin. Dates are
   formatted server-side to avoid a hydration mismatch. */

export const metadata: Metadata = { title: "Admins — Content admin" };

const ADDED_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function AdminsAdminPage() {
  /* PP8 8-k: gate before producing any JSX. Awaiting a server round-trip does
     NOT stop this segment streaming ahead of the layout's redirect() — this
     page awaited one and still leaked its own heading and intro to anonymous
     callers. Only throwing before the JSX exists closes it. */
  if (!(await isAdmin())) notFound();

  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_admins");
  const raw =
    (data as { user_id: string; email: string; created_at: string }[] | null) ??
    [];

  const rows: AdminRow[] = raw.map((r) => ({
    user_id: r.user_id,
    email: r.email,
    added: ADDED_FMT.format(new Date(r.created_at)),
  }));

  return (
    <div>
      <h1 className="adm-h1">Admins.</h1>
      <p className="adm-intro">
        The HQ team members who can manage applications and content. Add someone
        by the email they signed up with.
      </p>
      <AdminsAdmin rows={rows} />
    </div>
  );
}
