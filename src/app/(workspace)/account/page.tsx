import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountForm } from "./account-form";

/* /account — manage profile, email, password (docs/page-copy/03-member-workspace/account.md).
   Unlike the other workspace pages this is reachable BEFORE approval (the
   sidebar Account item is always on), so it is session-gated only — a pending
   partner can set their name, email preference, and password while they wait.
   The profile row is read directly under the owner-only RLS SELECT policy
   (0001); writes go through set_my_account (0018). The Delete account section
   is intentionally hidden at launch (D-S6-c). */

export const metadata: Metadata = { title: "Your account" };

type AccountProfile = {
  full_name: string | null;
  marketing_opt_in: boolean | null;
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const { data } = await supabase
    .from("profiles")
    .select("full_name, marketing_opt_in")
    .eq("id", user.id)
    .maybeSingle();
  const profile = data as AccountProfile | null;

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 className="ws-h1">Your account.</h1>
      <AccountForm
        initialName={profile?.full_name ?? ""}
        initialOptIn={profile?.marketing_opt_in ?? false}
      />
    </div>
  );
}
