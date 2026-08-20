import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/profile";
import {
  ApprovalsQueue,
  type ApplicationRow,
} from "@/components/admin/approvals-queue";

/* /admin/approvals — the HQ approval queue. The admin layout already gated this
   request; admin_list_applications() is itself is_admin()-gated, so a
   non-admin would get zero rows even if the layout were bypassed. */

type RpcRow = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  city: string;
  organisation: string | null;
  why: string;
  status: ApplicationRow["status"];
  created_at: string;
};

const APPLIED_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function ApprovalsPage() {
  /* PP8 8-k: gate before producing any JSX. See the note in
     src/app/admin/content/page.tsx — awaiting a server round-trip does NOT stop
     this segment streaming ahead of the layout's redirect(); only throwing
     before the JSX exists does. This page awaited an RPC and still leaked its
     own heading and intro to anonymous callers. */
  if (!(await isAdmin())) notFound();

  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_applications");
  const raw = (data as RpcRow[] | null) ?? [];

  const rows: ApplicationRow[] = raw.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    city: r.city,
    organisation: r.organisation,
    why: r.why,
    status: r.status,
    applied: APPLIED_FMT.format(new Date(r.created_at)),
  }));

  return (
    <div>
      <h1 className="adm-h1">Approvals.</h1>
      <p className="adm-intro">
        Applications waiting on a decision. Approving unlocks the full platform
        for the partner — no second sign-up.
      </p>
      <ApprovalsQueue rows={rows} />
    </div>
  );
}
