import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getResources, safeHttpUrl } from "@/lib/workspace/content";
import type { ResourceRow } from "@/lib/workspace/types";
import type {
  PwGroup,
  PwGuideFile,
  PwSectionSlug,
  PwTemplate,
} from "./types";

/* The PP3 data layer for the four toolkit pages.

   Same shape as src/lib/workspace/content.ts: "server-only" so an accidental
   client import is a build error, React-cached so a page that reads the tree
   and the resources makes one round-trip each, and never throwing — every read
   fails closed to an empty result.

   get_platform_topics() (0027) is is_approved()-gated server-side, so a pending
   or anonymous caller gets zero rows rather than an error. That is the gate;
   the page's own profile check only decides which state to render.

   Not wrapped here: get_platform_sections(). The toolkit hero copy comes from
   the generated spec (PLATFORM_PAGES) exactly as PP2 built it, and no other PP3
   surface reads section rows — so wrapping it now would ship an unused round
   trip. PP6 makes that copy owner-editable and is where the wrapper belongs. */

/* One flat row per topic, joined across sections/groups/elements by the RPC.
   Column names mirror the get_platform_topics() return table verbatim. */
type PlatformTopicRow = {
  id: string;
  element_id: string;
  element_slug: string;
  element_code: string;
  section_slug: string;
  group_id: string;
  group_slug: string;
  group_name: string;
  group_desc: string | null;
  group_sort: number;
  slug: string;
  title: string;
  description: string | null;
  intro: string | null;
  icon: string | null;
  image_path: string | null;
  image_position: string | null;
  youtube_url: string | null;
  sort_order: number;
};

const getPlatformTopics = cache(async (): Promise<PlatformTopicRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_platform_topics");
  if (error || !data) return [];
  return data as PlatformTopicRow[];
});

/* D-PP-i (2026-08-12) — the templates-grid predicate, and the only place it is
   written. A topic's templates are simply the resources rows carrying its
   element_id, so there is no per-row flag to set and nothing to re-upload: the
   297 coded files already in the DB and Storage are the grid.

   Four conditions, each load-bearing:
     element_id  — which topic the file belongs to.
     is_public   — false keeps the two public booklets out of a partner-only
                   surface (SECURITY-CHECKLIST §15).
     doc_key     — NULL excludes the one 'guide' file per topic, which has its
                   own card above the grid and would otherwise appear twice.
     code        — NOT NULL is what makes it a coded template rather than an
                   unbadged upload.

   §15 also requires storage_bucket = 'resources', which get_resources() does
   not return and 0027 can no longer be edited (it has run on production). That
   half is enforced by PP6's 0029 RPC guard: no shipped admin RPC can set
   storage_bucket today (admin_update_resource cannot touch code/doc_key/
   storage_path — 0023/0026), so no wrong-bucket row can exist until PP6 ships
   the upload path, and production is verified at 297 private / 0 public-in-grid
   / 0 wrong-bucket. PP6 must close it in the same sprint that opens it. */
function isTemplateRow(row: ResourceRow): boolean {
  return (
    row.element_id !== null &&
    row.is_public === false &&
    row.doc_key === null &&
    row.code !== null
  );
}

/* The guide file is the same private population, distinguished only by
   doc_key='guide'; the 0027 partial-unique index guarantees at most one per
   element. */
function isGuideRow(row: ResourceRow): boolean {
  return (
    row.element_id !== null && row.is_public === false && row.doc_key === "guide"
  );
}

type FilesByElement = {
  templates: Map<string, PwTemplate[]>;
  guides: Map<string, PwGuideFile>;
};

function indexFilesByElement(rows: ResourceRow[]): FilesByElement {
  const templates = new Map<string, PwTemplate[]>();
  const guides = new Map<string, PwGuideFile>();

  /* Order once, up front, so bucket insertion order is already grid order and
     no per-topic re-sort is needed. sort_order is the owner's ordering — today
     a real 1–10 sequence that agrees with the codes on all 297 rows (verified
     on TEST), and the column PP6's reorder control will write. The code is the
     tiebreak, so a future reorder that leaves two rows equal still renders
     deterministically instead of in whatever order Postgres returned. */
  const ordered = [...rows].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      (a.code ?? "").localeCompare(b.code ?? "", "en"),
  );

  for (const row of ordered) {
    if (!row.element_id) continue;

    if (isTemplateRow(row)) {
      const list = templates.get(row.element_id) ?? [];
      list.push({ id: row.id, title: row.title, code: row.code as string });
      templates.set(row.element_id, list);
      continue;
    }

    /* First writer wins. The unique index makes a second guide impossible, but
       reading defensively costs nothing and keeps a future data repair from
       silently changing which file the card offers. */
    if (isGuideRow(row) && !guides.has(row.element_id)) {
      guides.set(row.element_id, { id: row.id, title: row.title });
    }
  }

  return { templates, guides };
}

/* The whole content payload for one toolkit page: its groups in mockup order,
   each with its topics and their files. Returns [] — never throws — when the
   caller is not approved, when the slug has no rows, or when a read fails. */
export const getSectionContent = cache(
  async (section: PwSectionSlug): Promise<PwGroup[]> => {
    const [topicRows, resourceRows] = await Promise.all([
      getPlatformTopics(),
      getResources(),
    ]);

    if (topicRows.length === 0) return [];

    const { templates, guides } = indexFilesByElement(resourceRows);
    const groups: PwGroup[] = [];
    const byGroupId = new Map<string, PwGroup>();

    /* The RPC orders by section_slug, group_sort, topic sort_order, slug — so
       first-seen order is mockup order and nothing needs re-sorting here. */
    for (const row of topicRows) {
      if (row.section_slug !== section) continue;

      let group = byGroupId.get(row.group_id);
      if (!group) {
        group = {
          id: row.group_id,
          slug: row.group_slug,
          name: row.group_name,
          description: row.group_desc,
          topics: [],
        };
        byGroupId.set(row.group_id, group);
        groups.push(group);
      }

      group.topics.push({
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        intro: row.intro,
        icon: row.icon,
        imagePath: row.image_path,
        imagePosition: row.image_position,
        youtubeUrl: safeHttpUrl(row.youtube_url),
        guide: guides.get(row.element_id) ?? null,
        templates: templates.get(row.element_id) ?? [],
      });
    }

    return groups;
  },
);
