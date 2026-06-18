import type { ResourceRow } from "@/lib/workspace/types";

/* Shared view-model helpers for the Resources hub + category pages (S6 6e).
   Environment-agnostic (types + pure functions), so both the server pages and
   the client ResourceLibrary import from here. */

export type ResourceVM = {
  id: string;
  title: string;
  type: string; // DB type (form|script|log|report|approval|guide|booklet)
  typeLabel: string; // display category
  version: string;
  areaLabel: string | null; // "Focus Area B — …" on the hub; null on a category page
};

// DB type -> display category. 'log' and 'report' both surface as the single
// "Logs & Reports" category (resources.md "Browse by type").
export const TYPE_LABEL: Record<string, string> = {
  form: "Forms",
  script: "Scripts",
  log: "Logs & Reports",
  report: "Logs & Reports",
  approval: "Approvals",
  guide: "Guides",
  booklet: "Booklets",
};

// Browse-by-type chips, in the order from resources.md. The category view drops
// Booklets (booklets carry no focus area, so they never appear in a slice).
export const HUB_TYPE_CHIPS = [
  "Forms",
  "Scripts",
  "Logs & Reports",
  "Approvals",
  "Guides",
  "Booklets",
];
export const CATEGORY_TYPE_CHIPS = [
  "Forms",
  "Scripts",
  "Logs & Reports",
  "Approvals",
  "Guides",
];

export function toResourceVM(
  r: ResourceRow,
  areaName?: string | null,
): ResourceVM {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    typeLabel: TYPE_LABEL[r.type] ?? r.type,
    version: r.version ?? "v1",
    areaLabel:
      r.focus_area_code && areaName
        ? `Focus Area ${r.focus_area_code} — ${areaName}`
        : null,
  };
}
