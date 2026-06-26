import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AcademyAdmin, type AcademyRow, type AcademyDetail } from "./academy-admin";

/* /admin/content/academy (S11 11-7) — edit each topic's optional video module
   (youtube_url + body_md script + metadata). is_admin()-gated by the /admin
   layout and again inside admin_list_academy_modules() / admin_get_academy_
   module(). Edit-only (one module per topic, 1:1) — selection is server-driven
   via ?element=<element_id> so the script loads only for the open module. */

export const metadata: Metadata = { title: "Academy — Content admin" };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AcademyAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ element?: string | string[] }>;
}) {
  const { element } = await searchParams;
  const raw = Array.isArray(element) ? element[0] : element;
  const sel = raw && UUID_RE.test(raw) ? raw : undefined;

  const supabase = await createClient();
  const { data: listData } = await supabase.rpc("admin_list_academy_modules");
  const rows = (listData as AcademyRow[] | null) ?? [];

  let selected: AcademyDetail | null = null;
  if (sel) {
    const { data } = await supabase.rpc("admin_get_academy_module", {
      p_element_id: sel,
    });
    selected = ((data as AcademyDetail[] | null) ?? [])[0] ?? null;
  }

  return (
    <div>
      <h1 className="adm-h1">Academy.</h1>
      <p className="adm-intro">
        One optional video module per topic. Select a topic to edit its video
        link and script — leave the link blank for the “video coming” state.
      </p>
      <AcademyAdmin rows={rows} selected={selected} />
    </div>
  );
}
