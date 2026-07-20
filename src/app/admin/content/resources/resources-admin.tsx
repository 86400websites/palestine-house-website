"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  saveResourceAction,
  type AdminContentState,
} from "@/lib/admin/content-actions";

/* Resources admin (S11 11-8) — a filterable table of all 269 resources + a
   metadata-only detail edit form. The raw storage path never reaches this
   component (the RPCs omit it); is_public is read-only context. Selection is
   server-driven via ?id=. */

export type ResourceRow = {
  id: string;
  title: string;
  type: string;
  focus_area_code: string | null;
  element_id: string | null;
  element_code: string | null;
  element_title: string | null;
  version: string;
  is_public: boolean;
  sort_order: number;
};

export type ResourceDetail = {
  id: string;
  title: string;
  type: string;
  focus_area_code: string | null;
  element_id: string | null;
  version: string;
  is_public: boolean;
  sort_order: number;
};

export type ElementOption = { id: string; code: string; title: string };

const TYPES = ["form", "script", "log", "report", "approval", "guide", "booklet"];
const FOCUS_AREAS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

const INITIAL: AdminContentState = { ok: false, message: null };

export function ResourcesAdmin({
  rows,
  elements,
  selected,
}: {
  rows: ResourceRow[];
  elements: ElementOption[];
  selected: ResourceDetail | null;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [r.title, r.type, r.focus_area_code, r.element_code, r.element_title]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(needle)),
    );
  }, [q, rows]);

  const select = (id: string) =>
    router.push(`/admin/content/resources?id=${id}`, { scroll: false });

  return (
    <>
      <div className="adm-toolbar">
        <input
          className="adm-input"
          style={{ maxWidth: 360 }}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by title, type, focus area or topic"
          aria-label="Filter templates"
        />
        <span className="adm-count">
          {filtered.length} of {rows.length}
        </span>
      </div>

      <div className="adm-split">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Type</th>
                <th scope="col">Focus</th>
                <th scope="col">Topic</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className={r.id === selected?.id ? "is-selected" : undefined}
                  tabIndex={0}
                  aria-selected={r.id === selected?.id}
                  onClick={() => select(r.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      select(r.id);
                    }
                  }}
                >
                  <td className="adm-td-strong">{r.title}</td>
                  <td className="adm-td-muted">{r.type}</td>
                  <td className="adm-td-muted">{r.focus_area_code ?? "—"}</td>
                  <td className="adm-td-trunc">
                    {r.element_code ? `${r.element_code} · ${r.element_title}` : "—"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="adm-td-muted">
                    No templates match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selected ? (
          <ResourceForm key={selected.id} resource={selected} elements={elements} />
        ) : (
          <div className="adm-detail-empty">
            Select a template to edit its details.
          </div>
        )}
      </div>
    </>
  );
}

function ResourceForm({
  resource: r,
  elements,
}: {
  resource: ResourceDetail;
  elements: ElementOption[];
}) {
  const [state, formAction, pending] = React.useActionState(
    saveResourceAction,
    INITIAL,
  );

  return (
    <aside className="adm-detail" aria-label="Edit template">
      <h2>{r.title}</h2>

      <form action={formAction} className="adm-form">
        <input type="hidden" name="id" value={r.id} />

        <div className="adm-field">
          <span className="adm-field-label">Visibility</span>
          <span className="adm-field-value">
            {r.is_public ? "Public (booklet)" : "Private (template)"}
          </span>
        </div>

        <label className="adm-form-field">
          <span className="adm-field-label">Title</span>
          <input
            className="adm-input"
            name="title"
            required
            maxLength={300}
            defaultValue={r.title}
          />
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Type</span>
          <select className="adm-select" name="type" defaultValue={r.type}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Focus area</span>
          <select
            className="adm-select"
            name="focusAreaCode"
            defaultValue={r.focus_area_code ?? ""}
          >
            <option value="">None</option>
            {FOCUS_AREAS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Topic</span>
          <select
            className="adm-select"
            name="elementId"
            defaultValue={r.element_id ?? ""}
          >
            <option value="">None</option>
            {elements.map((e) => (
              <option key={e.id} value={e.id}>
                {e.code} · {e.title}
              </option>
            ))}
          </select>
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Version</span>
          <input
            className="adm-input"
            name="version"
            maxLength={40}
            defaultValue={r.version}
          />
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Sort order</span>
          <input
            className="adm-input"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={r.sort_order}
          />
        </label>

        {state.message ? (
          <p
            role={state.ok ? "status" : "alert"}
            className={`adm-form-msg ${state.ok ? "is-ok" : "is-err"}`}
          >
            {state.message}
          </p>
        ) : null}

        <div className="adm-detail-actions">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </aside>
  );
}
