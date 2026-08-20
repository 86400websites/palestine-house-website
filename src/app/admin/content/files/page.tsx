import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/profile";
import { FilesAdmin, type FileRow, type TopicOption } from "./files-admin";

/* /admin/content/files (PP6a, 6a-g) — the guide and templates a partner
   downloads, per focus area.

   Replaces /admin/content/resources, which could edit a row's title and type
   but could not upload, replace or delete a FILE at all: before 0029 nothing in
   the schema could insert a resources row, and storage.objects had a single
   SELECT policy for approved partners and no write policy for anyone.

   is_admin()-gated by the /admin layout and again inside every RPC. The file
   list comes from admin_list_resource_files, which deliberately does NOT return
   storage_path — a path has no business reaching a browser. */

export const metadata: Metadata = { title: "Files — Content admin" };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function FilesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string | string[] }>;
}) {
  /* PP8 8-k: gate before producing any JSX. Awaiting a server round-trip does
     NOT stop this segment streaming ahead of the layout's redirect() — this
     page awaited one and still leaked its own heading and intro to anonymous
     callers. Only throwing before the JSX exists closes it. */
  if (!(await isAdmin())) notFound();

  const { topic } = await searchParams;
  const raw = Array.isArray(topic) ? topic[0] : topic;
  const sel = raw && UUID_RE.test(raw) ? raw : undefined;

  const supabase = await createClient();
  const { data: topicData } = await supabase.rpc("admin_list_platform_topics");
  const topics = ((topicData as TopicOption[] | null) ?? []).map((t) => ({
    id: t.id,
    element_id: t.element_id,
    title: t.title,
    section_slug: t.section_slug,
    published: t.published,
  }));

  const selected = sel ? (topics.find((t) => t.id === sel) ?? null) : null;

  let files: FileRow[] = [];
  if (selected) {
    const { data } = await supabase.rpc("admin_list_resource_files", {
      p_element_id: selected.element_id,
    });
    files = (data as FileRow[] | null) ?? [];
  }

  return (
    <div>
      <h1 className="adm-h1">Files.</h1>
      <p className="adm-intro">
        The guide and the templates people download. One guide per focus area,
        as many templates as you need. Word files and PDFs, up to 4 MB each.
      </p>
      <FilesAdmin topics={topics} selected={selected} files={files} />
    </div>
  );
}
