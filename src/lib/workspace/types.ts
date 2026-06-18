/* Typed shapes for the S5 content RPCs (S6 data layer). One source of truth
   for src/lib/workspace/content.ts and the pages that consume it. Columns
   mirror the RPC return tables in supabase/sql/migrations/0011–0015. */

export type ElementListItem = {
  id: string;
  slug: string;
  code: string;
  focus_area_code: string;
  focus_area_name: string;
  title: string;
  one_line: string | null;
  sort_order: number;
};

export type ElementFull = ElementListItem & {
  overview_md: string | null;
  simple_guide_md: string | null;
  watch_out_for_md: string | null;
};

export type ChecklistRow = {
  id: string;
  element_id: string;
  element_code: string;
  element_title: string;
  focus_area_code: string;
  group_label: string | null;
  gate: number | null;
  item_text: string;
  required_document: string | null;
  sort_order: number;
};

export type ResourceRow = {
  id: string;
  title: string;
  type: string;
  focus_area_code: string | null;
  element_id: string | null;
  version: string | null;
  is_public: boolean;
  sort_order: number;
};

export type AcademyRow = {
  id: string;
  element_id: string;
  element_slug: string;
  element_code: string;
  element_title: string;
  title: string;
  one_line: string | null;
  length: string | null;
  youtube_url: string | null;
  sort_order: number;
};

/* /build checklist tracker (S6 6c). Statuses match the checklist_progress
   CHECK constraint + set_checklist_progress (underscore form, NOT the mockup's
   hyphen form). */
export type ProgressStatus =
  | "not_started"
  | "in_progress"
  | "complete"
  | "blocked";

export type ProgressRow = {
  checklist_item_id: string;
  status: ProgressStatus;
  blocked_note: string | null;
};

export type BuildItemVM = {
  id: string; // checklist_items.id — the key for set_checklist_progress
  text: string; // item_text (DB-sourced, never edited)
  slug: string | null; // element slug for "Open this topic" (null -> inert)
  requiredDocument: string | null;
  status: ProgressStatus;
  note: string | null; // blocked_note, only when status === "blocked"
};

export type BuildAreaVM = {
  code: string; // "A".."J"
  name: string; // focus_area_name
  items: number;
  done: number; // status === "complete"
  vmItems: BuildItemVM[];
};

export type BuildModel = {
  areas: BuildAreaVM[];
  totalItems: number;
  doneItems: number;
};
