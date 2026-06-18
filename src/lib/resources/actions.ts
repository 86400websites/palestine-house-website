"use server";

import { createClient } from "@/lib/supabase/server";

/* Download issuance for the Resources hub (S6 6e). The raw storage path never
   reaches the client: this action resolves it SERVER-SIDE via the
   is_approved()-gated get_resource_download RPC (0017), then returns only a
   URL. Templates (private `resources` bucket) get a short-lived signed URL
   minted with the user's OWN authenticated client — which works only because
   0017 grants approved users SELECT on that bucket; a pending/anon caller is
   denied at both the RPC and the storage layer, so this fails closed. Booklets
   (public bucket) get a public download URL. No service key, no new env var. */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIGNED_URL_TTL_SECONDS = 60;
const GENERIC_ERROR = "That download isn’t available right now. Please try again.";

export type ResourceDownload = { url: string } | { error: string };

type DownloadRow = {
  storage_bucket: string;
  storage_path: string;
  is_public: boolean;
};

export async function getResourceDownloadUrl(
  resourceId: string,
): Promise<ResourceDownload> {
  if (!UUID_RE.test(resourceId)) {
    return { error: GENERIC_ERROR };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session expired — sign in again." };
  }

  const { data, error } = await supabase.rpc("get_resource_download", {
    p_id: resourceId,
  });
  const rows = (data ?? []) as DownloadRow[];
  if (error || rows.length === 0) {
    // Unapproved sessions and unknown ids both land here (the RPC returns zero
    // rows when is_approved() is false) — never reveal which.
    return { error: GENERIC_ERROR };
  }

  const { storage_bucket, storage_path, is_public } = rows[0];
  const filename = storage_path.split("/").pop() || "download";

  if (is_public) {
    const { data: pub } = supabase.storage
      .from(storage_bucket)
      .getPublicUrl(storage_path, { download: filename });
    return { url: pub.publicUrl };
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(storage_bucket)
    .createSignedUrl(storage_path, SIGNED_URL_TTL_SECONDS, {
      download: filename,
    });
  if (signErr || !signed?.signedUrl) {
    return { error: GENERIC_ERROR };
  }
  return { url: signed.signedUrl };
}
