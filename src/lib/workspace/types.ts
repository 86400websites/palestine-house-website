/* Typed shapes for the S5 content RPCs (S6 data layer). One source of truth
   for src/lib/workspace/content.ts and the pages that consume it. Columns
   mirror the RPC return tables in supabase/sql/migrations/0011–0015.

   PP5 pruned this to the three shapes the platform still reads. The checklist,
   academy and /build progress types went with the routes that used them; their
   TABLES are still there and PP7's 0030 is what drops those. The admin screens
   are unaffected — /admin/content/academy and /admin/content/resources declare
   their own row types locally and never imported these. */

/* Still exported as the base of ElementFull rather than for its own sake: the
   list read it was written for (get_elements) went with the legacy routes. */
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

/* get_resources() was widened in place by 0027 (columns appended, none removed
   or reordered) — `code` is the template badge ("T01"), `doc_key` is 'guide' on
   the one downloadable Simple-guide file per topic and NULL on everything else.
   Both are read-only projections of existing columns, so the S6 consumers that
   predate them are unaffected. Nothing constructs this type; it only ever
   describes rows coming back from the RPC. */
export type ResourceRow = {
  id: string;
  title: string;
  type: string;
  focus_area_code: string | null;
  element_id: string | null;
  version: string | null;
  is_public: boolean;
  sort_order: number;
  code: string | null;
  doc_key: string | null;
};
