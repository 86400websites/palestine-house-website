import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  ChecklistRow,
  ElementListItem,
  ProgressRow,
  ProgressStatus,
  ProgressStage,
  ProgressSnapshot,
  BuildAreaVM,
  BuildModel,
} from "./types";

/* /build data layer (S6 6c). The owner's saved progress is read DIRECTLY under
   RLS — checklist_progress has a client-usable SELECT policy
   (user_id = auth.uid() AND is_approved()), so no read RPC/migration is needed.
   Writes still go through the set_checklist_progress RPC (see src/lib/build).
   deriveBuildModel is a pure transform reused by /dashboard (Step 3). */

export const getChecklistProgress = cache(async (): Promise<ProgressRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checklist_progress")
    .select("checklist_item_id, status, blocked_note");
  if (error || !data) return [];
  return data as ProgressRow[];
});

/* Group the gated checklist by focus area, join element slug/name, and overlay
   the caller's saved progress. Pure (no I/O) so /dashboard can reuse it. */
export function deriveBuildModel(
  checklist: ChecklistRow[],
  elements: ElementListItem[],
  progress: ProgressRow[],
): BuildModel {
  const elementById = new Map(elements.map((e) => [e.id, e]));
  const areaNameByCode = new Map<string, string>();
  for (const e of elements) {
    if (!areaNameByCode.has(e.focus_area_code)) {
      areaNameByCode.set(e.focus_area_code, e.focus_area_name);
    }
  }
  const progressById = new Map(progress.map((p) => [p.checklist_item_id, p]));

  const order: string[] = [];
  const byCode = new Map<string, BuildAreaVM>();
  for (const row of checklist) {
    let area = byCode.get(row.focus_area_code);
    if (!area) {
      area = {
        code: row.focus_area_code,
        name: areaNameByCode.get(row.focus_area_code) ?? row.focus_area_code,
        items: 0,
        done: 0,
        vmItems: [],
      };
      byCode.set(row.focus_area_code, area);
      order.push(row.focus_area_code);
    }
    const pr = progressById.get(row.id);
    const status: ProgressStatus = pr?.status ?? "not_started";
    area.vmItems.push({
      id: row.id,
      text: row.item_text,
      slug: elementById.get(row.element_id)?.slug ?? null,
      requiredDocument: row.required_document,
      status,
      note: status === "blocked" ? (pr?.blocked_note ?? null) : null,
    });
    area.items += 1;
    if (status === "complete") area.done += 1;
  }

  order.sort();
  const areas = order.map((code) => byCode.get(code)!);
  const totalItems = areas.reduce((n, a) => n + a.items, 0);
  const doneItems = areas.reduce((n, a) => n + a.done, 0);
  return { areas, totalItems, doneItems };
}

/* Compact snapshot for /dashboard (S6 6a) — pure transform over BuildModel.
   stage: operate only when there is work and it is all complete; build once any
   item has moved off "not_started"; otherwise plan. No gate data (D-S6-b). */
export function deriveProgressSnapshot(model: BuildModel): ProgressSnapshot {
  const { areas, totalItems, doneItems } = model;

  const started = areas.some((a) =>
    a.vmItems.some((it) => it.status !== "not_started"),
  );
  const stage: ProgressStage =
    totalItems > 0 && doneItems === totalItems
      ? "operate"
      : started
        ? "build"
        : "plan";
  const pct = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100);
  const nextAreas = areas
    .filter((a) => a.done < a.items)
    .slice(0, 3)
    .map((a) => ({ code: a.code, name: a.name, done: a.done, items: a.items }));

  return { stage, started, pct, nextAreas };
}
