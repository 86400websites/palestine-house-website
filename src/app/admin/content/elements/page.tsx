import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ElementsAdmin, type ElementRow, type ElementDetail } from "./elements-admin";

/* /admin/content/elements (S11 11-6) — edit the 30 topic guides. The /admin
   layout already gated this via is_admin(); admin_list_elements() /
   admin_get_element() are themselves is_admin()-gated, so a non-admin gets zero
   rows even if the layout were bypassed. Edit-only: the table loads metadata,
   selecting a topic (?slug=) loads its full bodies for the form. No create /
   delete (the 30 topics are locked content). */

export const metadata: Metadata = { title: "Elements — Content admin" };

export default async function ElementsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string | string[] }>;
}) {
  const { slug } = await searchParams;
  const sel = Array.isArray(slug) ? slug[0] : slug;

  const supabase = await createClient();
  const { data: listData } = await supabase.rpc("admin_list_elements");
  const rows = (listData as ElementRow[] | null) ?? [];

  let selected: ElementDetail | null = null;
  if (sel) {
    const { data } = await supabase.rpc("admin_get_element", { p_slug: sel });
    selected = ((data as ElementDetail[] | null) ?? [])[0] ?? null;
  }

  return (
    <div>
      <h1 className="adm-h1">Elements.</h1>
      <p className="adm-intro">
        The 30 topic guides. Select a topic to edit its overview, simple guide,
        and what to watch for.
      </p>
      <ElementsAdmin rows={rows} selected={selected} />
    </div>
  );
}
