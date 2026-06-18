"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/* Account self-management write (S6 6g). The authoritative authorization is in
   the set_my_account RPC (0018): it is scoped to auth.uid() (never an argument)
   and can only ever set full_name + marketing_opt_in — never is_approved — so a
   pending user may manage their own account but cannot escalate. This action
   does a session check + cheap shape validation, maps failure to neutral copy,
   and revalidates /account and /dashboard (the greeting uses full_name). */

export type AccountState = { ok: boolean; message: string | null };

export async function setMyAccountAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const displayName = String(formData.get("displayName") ?? "")
    .trim()
    .slice(0, 120);
  const optIn = formData.get("optIn") === "on";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Your session expired — sign in again." };
  }

  const { error } = await supabase.rpc("set_my_account", {
    p_display_name: displayName,
    p_marketing_opt_in: optIn,
  });
  if (error) {
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  revalidatePath("/account");
  revalidatePath("/dashboard");
  return { ok: true, message: "Saved." };
}
