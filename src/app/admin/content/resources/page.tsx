import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  ResourcesAdmin,
  type ResourceRow,
  type ResourceDetail,
  type ElementOption,
} from "./resources-admin";

/* /admin/content/resources (S11 11-8) — edit template / booklet METADATA only.
   is_admin()-gated by the /admin layout and inside admin_list_resources() /
   admin_get_resource(). The raw storage path is NEVER returned to the browser
   (the RPCs omit it); is_public is bound to the file's bucket and shown
   read-only. File replacement is out of scope (re-ingest path), so there is no
   create / delete / upload here — selection is server-driven via ?id=. */

export const metadata: Metadata = { title: "Resources — Content admin" };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ResourcesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const { id } = await searchParams;
  const raw = Array.isArray(id) ? id[0] : id;
  const sel = raw && UUID_RE.test(raw) ? raw : undefined;

  const supabase = await createClient();
  const [listRes, elemRes] = await Promise.all([
    supabase.rpc("admin_list_resources"),
    supabase.rpc("admin_list_elements"),
  ]);
  const rows = (listRes.data as ResourceRow[] | null) ?? [];
  const elements: ElementOption[] = (
    (elemRes.data as { id: string; code: string; title: string }[] | null) ?? []
  ).map((e) => ({ id: e.id, code: e.code, title: e.title }));

  let selected: ResourceDetail | null = null;
  if (sel) {
    const { data } = await supabase.rpc("admin_get_resource", { p_id: sel });
    selected = ((data as ResourceDetail[] | null) ?? [])[0] ?? null;
  }

  return (
    <div>
      <h1 className="adm-h1">Resources.</h1>
      <p className="adm-intro">
        The 297 templates and 2 booklets. Edit a resource’s details — the file
        itself is managed through the content ingest, not here.
      </p>
      <ResourcesAdmin rows={rows} elements={elements} selected={selected} />
    </div>
  );
}
