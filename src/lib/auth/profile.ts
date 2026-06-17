import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/* Server-side approval/admin reads for the gated layouts (S4). Both wrap the
   hardened S2/S4 RPCs (get_my_profile, is_admin) and are React-cached so the
   layout and the page in one request share a single DB round-trip. The RPCs
   resolve the CALLER's own status only (auth.uid() inside) — file location is
   never the access control. */

export type MyProfile = {
  id: string;
  is_approved: boolean;
  full_name: string | null;
};

export const getMyProfile = cache(async (): Promise<MyProfile | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_profile");
  if (error || !data) return null;
  const rows = data as MyProfile[];
  return rows.length > 0 ? rows[0] : null;
});

export const isAdmin = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
});

/* First name for the dashboard greeting / avatar — null when no name on file
   (greet simply, per dashboard.md). */
export function firstNameOf(fullName: string | null | undefined): string | null {
  const first = (fullName ?? "").trim().split(/\s+/)[0];
  return first || null;
}
