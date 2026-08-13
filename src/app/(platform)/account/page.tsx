import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PwAccountForm } from "./account-form";

/* /account — manage profile, email, password.

   Moved here from (workspace) at PP5 and restyled in the .pw- register: it is
   the one legacy page the new chrome links to (header ×2, footer ×1), so it had
   to survive the teardown, and restyling it rather than keeping its .acct-*
   block is what lets PP5 delete the legacy CSS in full. Every visible string is
   the approved S6 copy (docs/page-copy/03-member-workspace/account.md) — this
   sprint changed the markup and the styling, not a word of it.

   Unlike every other page in this group, /account is reachable BEFORE approval:
   a pending partner sets their name, email preference and password while they
   wait, and the header links here from every page. So it is session-gated only,
   with no is_approved check — deliberately, not by omission.

   The session check below is this page's own. The group layout gates the route
   first and would catch an anonymous visitor before this runs, but file
   location is never access control (SECURITY-CHECKLIST §6/§15) and the check
   costs one cached call. One known consequence of the move: the layout's
   redirect carries ?next=/dashboard, so an anonymous visitor who deep-links
   here lands on the About page after signing in rather than back on this one.

   The profile row is read directly under the owner-only RLS SELECT policy
   (0001); writes go through set_my_account (0018). The Delete account section
   is intentionally hidden at launch (D-S6-c) — deletion requests route through
   /support meanwhile. */

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
    <section className="pw-account">
      <div className="pw-container">
        <div className="pw-account-shell">
          <h1 className="pw-account-title">Your account.</h1>
          <PwAccountForm
            initialName={profile?.full_name ?? ""}
            initialOptIn={profile?.marketing_opt_in ?? false}
          />
        </div>
      </div>
    </section>
  );
}
