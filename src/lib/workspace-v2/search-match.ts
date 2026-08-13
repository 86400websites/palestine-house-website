import type { PwSearchItem, PwSearchKind } from "./types";

/* Matching for the global search overlay (PP4).

   Pure and dependency-free on purpose: this is the behaviour D-PP-j actually
   decides, so it is kept out of the component where it can be run against real
   index entries outside the app.

   The rule is the mockup's `renderSearch()`: lowercase the query, split it on
   whitespace, and require EVERY word to appear somewhere in the item's match
   text — so "budget template" narrows rather than widens. D-PP-j (owner,
   2026-08-13) adds one thing the mockup did not have: a focus area's own
   description and intro, which is what lets a partner find a focus area by what
   it is about instead of only by its title.

   Substring matching, not tokens: "insur" finds "insurance", which is what a
   search field is expected to do. */

export type PwSearchFilter = "all" | "topics" | "guides" | "templates";

export const FILTER_OF: Record<PwSearchKind, PwSearchFilter> = {
  TOPIC: "topics",
  GUIDE: "guides",
  TEMPLATE: "templates",
};

/* The mockup's own cap. Kept because it bounds the work AND the DOM: an empty
   query already renders the start panel, so the widest real query is one common
   letter across 363 entries. */
export const MAX_RESULTS = 80;

export type PwIndexedItem = { item: PwSearchItem; haystack: string };

/* Built once per index rather than once per keystroke — with 363 entries the
   difference is 363 lowercase operations per typed character or none at all. */
export function indexForSearch(items: PwSearchItem[]): PwIndexedItem[] {
  return items.map((item) => ({
    item,
    haystack: [item.title, item.path, item.kind, item.summary ?? ""]
      .join(" ")
      .toLowerCase(),
  }));
}

export function searchIndexed(
  index: PwIndexedItem[],
  query: string,
  filter: PwSearchFilter,
): PwSearchItem[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const out: PwSearchItem[] = [];
  for (const entry of index) {
    if (filter !== "all" && FILTER_OF[entry.item.kind] !== filter) continue;
    if (!words.every((word) => entry.haystack.includes(word))) continue;
    out.push(entry.item);
    if (out.length === MAX_RESULTS) break;
  }
  return out;
}

/* The mockup's <mark> highlight, expressed as ranges so the caller can build
   elements instead of an HTML string. Deliberately no regex: a query is
   arbitrary user text, and compiling it into a pattern invites both escaping
   bugs and catastrophic backtracking. */
export function highlightRanges(
  text: string,
  query: string,
): { start: number; end: number }[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const haystack = text.toLowerCase();
  const ranges: { start: number; end: number }[] = [];
  let from = 0;

  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) break;
    ranges.push({ start: at, end: at + needle.length });
    from = at + needle.length;
  }

  return ranges;
}
