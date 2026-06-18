import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMyProfile } from "@/lib/auth/profile";
import {
  getElement,
  getElements,
  getChecklist,
  getResources,
  getAcademyModules,
} from "@/lib/workspace/content";
import { renderMarkdown } from "@/lib/workspace/markdown";
import { PendingState } from "@/components/workspace/pending-state";
import { ElementTabs, type ElementTabsData } from "./element-tabs";

/* /elements/[slug] — the canonical element page, one template for all 30 topics
   (S6 6d). Approval-gated TWO ways: a pending session sees the under-review
   notice (never content, never a 404); an approved session with an unknown slug
   gets a workspace 404 (not-found.tsx). Bodies are DB Markdown rendered +
   sanitized on the SERVER; the client tab shell only switches panels. The
   interactive checklist tracker and the "Add to Design & Build" action arrive
   with /build (S6 6c, Step 2) — there is no get_checklist_progress read RPC
   yet, so the checklist tab is read-only here. */

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getMyProfile();
  if (!profile?.is_approved) return { title: "Topic" };
  const el = await getElement(slug);
  if (!el) return { title: "Topic not found" };
  return { title: el.title, description: el.one_line ?? undefined };
}

export default async function ElementPage({ params }: Params) {
  const { slug } = await params;

  // Gate BEFORE any content fetch: a pending session never reaches a 404 or any
  // element data — it sees the same "under review" notice as /dashboard.
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PendingState />;

  const el = await getElement(slug);
  if (!el) notFound();

  const [allChecklist, allAcademy, allResources, allElements] =
    await Promise.all([
      getChecklist(),
      getAcademyModules(),
      getResources(),
      getElements(),
    ]);

  // No per-element RPC exists — filter the gated catalogs by element id.
  const checklist = allChecklist
    .filter((r) => r.element_id === el.id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const academy = allAcademy.find((r) => r.element_id === el.id) ?? null;
  const templates = allResources
    .filter((r) => r.element_id === el.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  // Next topic in catalog order (already sorted by focus area + sort_order).
  const idx = allElements.findIndex((e) => e.id === el.id);
  const next =
    idx >= 0 && idx < allElements.length - 1 ? allElements[idx + 1] : null;

  // Group the checklist by its source group_label, preserving order.
  const groups: ElementTabsData["checklistGroups"] = [];
  for (const item of checklist) {
    const label = item.group_label ?? "Checklist";
    let group = groups.find((g) => g.label === label);
    if (!group) {
      group = { label, items: [] };
      groups.push(group);
    }
    group.items.push({
      id: item.id,
      text: item.item_text,
      requiredDocument: item.required_document,
    });
  }

  const data: ElementTabsData = {
    overviewHtml: renderMarkdown(el.overview_md),
    simpleGuideHtml: renderMarkdown(el.simple_guide_md),
    watchOutHtml: renderMarkdown(el.watch_out_for_md),
    checklistGroups: groups,
    checklistCount: checklist.length,
    templates: templates.map((t) => ({
      id: t.id,
      title: t.title,
      type: t.type,
      version: t.version,
    })),
    templatesCount: templates.length,
    video: academy
      ? { length: academy.length, youtubeUrl: academy.youtube_url }
      : null,
    focusAreaCode: el.focus_area_code,
    focusAreaName: el.focus_area_name,
    nextSlug: next?.slug ?? null,
    nextTitle: next?.title ?? null,
  };

  return (
    <article>
      {/* Breadcrumb labels are inert until /plan ships (Step 4) — no dead links. */}
      <nav className="ws-breadcrumb" aria-label="Breadcrumb">
        <span>Plan &amp; Prepare</span>
        <span className="ws-breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <span>
          Focus Area {el.focus_area_code} — {el.focus_area_name}
        </span>
        <span className="ws-breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <span aria-current="page">{el.title}</span>
      </nav>

      <div className="ws-element-head">
        <p className="ph-eyebrow">Topic {el.code}</p>
        <h1 className="ws-h1">{el.title}</h1>
        {el.one_line && <p className="ws-lead">{el.one_line}</p>}
      </div>

      <ElementTabs data={data} />
    </article>
  );
}
