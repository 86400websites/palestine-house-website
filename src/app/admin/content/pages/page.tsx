import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/profile";
import { PagesAdmin, type PageRow } from "./pages-admin";

/* /admin/content/pages (PP6a) — the hero copy for the About landing and the
   four toolkit pages.

   is_admin()-gated twice, as everywhere under /admin: once by the layout
   (anon -> /login, authenticated non-admin -> 404) and again inside
   admin_list_platform_sections() / admin_update_platform_section().

   Five rows, fixed. platform_sections_slug_shape constrains the slug set in the
   database, so this screen edits and never adds or deletes — a typo cannot
   create a page that the router does not serve.

   Selection is server-driven via ?page=<slug>, matching the other admin
   screens. */

export const metadata: Metadata = { title: "Pages — Content admin" };

const PAGE_SLUGS = ["about", "setup", "operate", "program", "support"];

export default async function PagesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  /* PP8 8-k: gate before producing any JSX. Awaiting a server round-trip does
     NOT stop this segment streaming ahead of the layout's redirect() — this
     page awaited one and still leaked its own heading and intro to anonymous
     callers. Only throwing before the JSX exists closes it. */
  if (!(await isAdmin())) notFound();

  const { page } = await searchParams;
  const raw = Array.isArray(page) ? page[0] : page;
  const sel = raw && PAGE_SLUGS.includes(raw) ? raw : undefined;

  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_platform_sections");
  const rows = (data as PageRow[] | null) ?? [];
  const selected = sel ? (rows.find((r) => r.slug === sel) ?? null) : null;

  return (
    <div>
      <h1 className="adm-h1">Pages.</h1>
      <p className="adm-intro">
        The heading, intro and photo at the top of each page partners see. The
        five pages are fixed — you can change what they say, not how many there
        are.
      </p>
      <PagesAdmin rows={rows} selected={selected} />
    </div>
  );
}
