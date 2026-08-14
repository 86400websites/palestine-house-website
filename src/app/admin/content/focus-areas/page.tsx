import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  FocusAreasAdmin,
  type GroupRow,
  type TopicRow,
  type GuideBody,
} from "./focus-areas-admin";

/* /admin/content/focus-areas (PP6a) — the main CMS screen.

   Replaces /admin/content/elements, which edited two bodies that no longer
   reach a partner: overview_md (the Overview card was removed at D-PP-f, and
   the column is dropped by PP7's 0031) and watch_out_for_md (no consumer since
   PP3). The guide body moves here, alongside the summary and the card fields.

   is_admin()-gated twice: by the /admin layout, and again inside every
   admin_list_platform_* / admin_*_platform_topic RPC.

   admin_list_platform_topics returns DRAFTS as well as Live rows — the
   member-facing get_platform_topics deliberately does not. The guide body is
   fetched only for the row being edited, so a list of 33 does not carry 33
   long documents into the page. */

export const metadata: Metadata = { title: "Focus areas — Content admin" };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function FocusAreasAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const { id } = await searchParams;
  const raw = Array.isArray(id) ? id[0] : id;
  const sel = raw && UUID_RE.test(raw) ? raw : undefined;

  const supabase = await createClient();
  const [{ data: groupData }, { data: topicData }] = await Promise.all([
    supabase.rpc("admin_list_platform_groups"),
    supabase.rpc("admin_list_platform_topics"),
  ]);

  const groups = (groupData as GroupRow[] | null) ?? [];
  const topics = (topicData as TopicRow[] | null) ?? [];
  const selected = sel ? (topics.find((t) => t.id === sel) ?? null) : null;

  let guide: GuideBody | null = null;
  if (selected) {
    const { data } = await supabase.rpc("admin_get_element", {
      p_slug: selected.element_slug,
    });
    const row = ((data as { simple_guide_md: string | null }[] | null) ?? [])[0];
    guide = {
      element_id: selected.element_id,
      simple_guide_md: row?.simple_guide_md ?? null,
    };
  }

  return (
    <div>
      <h1 className="adm-h1">Focus areas.</h1>
      <p className="adm-intro">
        Everything a partner opens inside a section — its summary, its guide, and
        the files that go with it. New ones start as a Draft, so nobody sees them
        until you say so.
      </p>
      <FocusAreasAdmin
        groups={groups}
        topics={topics}
        selected={selected}
        guide={guide}
      />
    </div>
  );
}
