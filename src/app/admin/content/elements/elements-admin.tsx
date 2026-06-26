"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  saveElementAction,
  type AdminContentState,
} from "@/lib/admin/content-actions";

/* Elements admin (S11 11-6) — table list + detail edit form, reusing the
   approvals-queue architecture (.adm-split / .adm-table / .adm-detail). Row
   selection is server-driven via ?slug= so the heavy markdown bodies load only
   for the open topic. The form round-trips the structural fields (code / focus
   area / sort order) as hidden inputs so the upsert is lossless; only the title,
   one-line and the three guide bodies are editable. */

export type ElementRow = {
  id: string;
  slug: string;
  code: string;
  focus_area_code: string;
  focus_area_name: string;
  title: string;
  one_line: string | null;
  sort_order: number;
  has_overview: boolean;
  has_simple_guide: boolean;
  has_watch_out_for: boolean;
};

export type ElementDetail = {
  id: string;
  slug: string;
  code: string;
  focus_area_code: string;
  focus_area_name: string;
  title: string;
  one_line: string | null;
  overview_md: string | null;
  simple_guide_md: string | null;
  watch_out_for_md: string | null;
  sort_order: number;
};

const INITIAL: AdminContentState = { ok: false, message: null };

function BodyDot({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      aria-label={`${label}: ${on ? "filled" : "empty"}`}
      style={{
        color: on ? "var(--green-700)" : "var(--subtle-foreground)",
        fontWeight: on ? 600 : 400,
      }}
    >
      {label[0]}
    </span>
  );
}

export function ElementsAdmin({
  rows,
  selected,
}: {
  rows: ElementRow[];
  selected: ElementDetail | null;
}) {
  const router = useRouter();
  const select = (slug: string) =>
    router.push(`/admin/content/elements?slug=${slug}`, { scroll: false });

  return (
    <div className="adm-split">
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th scope="col">Topic</th>
              <th scope="col">Focus area</th>
              <th scope="col" title="Overview · Simple guide · Watch-out-for">
                Guide
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.slug}
                className={r.slug === selected?.slug ? "is-selected" : undefined}
                tabIndex={0}
                aria-selected={r.slug === selected?.slug}
                onClick={() => select(r.slug)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    select(r.slug);
                  }
                }}
              >
                <td className="adm-td-strong">
                  {r.code} · {r.title}
                </td>
                <td className="adm-td-muted">
                  {r.focus_area_code} — {r.focus_area_name}
                </td>
                <td className="adm-td-muted" style={{ whiteSpace: "nowrap" }}>
                  <BodyDot on={r.has_overview} label="Overview" />{" "}
                  <BodyDot on={r.has_simple_guide} label="Simple guide" />{" "}
                  <BodyDot on={r.has_watch_out_for} label="Watch-out-for" />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="adm-td-muted">
                  No topics found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected ? (
        <ElementForm key={selected.slug} element={selected} />
      ) : (
        <div className="adm-detail-empty">
          Select a topic to edit its guide.
        </div>
      )}
    </div>
  );
}

function ElementForm({ element }: { element: ElementDetail }) {
  const [state, formAction, pending] = React.useActionState(
    saveElementAction,
    INITIAL,
  );

  return (
    <aside className="adm-detail" aria-label="Edit topic">
      <h2>
        {element.code} · {element.title}
      </h2>

      <form action={formAction} className="adm-form">
        <input type="hidden" name="slug" value={element.slug} />
        <input type="hidden" name="code" value={element.code} />
        <input type="hidden" name="focusAreaCode" value={element.focus_area_code} />
        <input type="hidden" name="focusAreaName" value={element.focus_area_name} />
        <input type="hidden" name="sortOrder" value={element.sort_order} />

        <div className="adm-field">
          <span className="adm-field-label">Focus area</span>
          <span className="adm-field-value">
            {element.focus_area_code} — {element.focus_area_name}
          </span>
        </div>

        <label className="adm-form-field">
          <span className="adm-field-label">Title</span>
          <input
            className="adm-input"
            name="title"
            required
            maxLength={200}
            defaultValue={element.title}
          />
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">One-line</span>
          <input
            className="adm-input"
            name="oneLine"
            maxLength={500}
            defaultValue={element.one_line ?? ""}
          />
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Overview (markdown)</span>
          <textarea
            className="adm-textarea"
            name="overviewMd"
            rows={10}
            defaultValue={element.overview_md ?? ""}
          />
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Simple guide (markdown)</span>
          <textarea
            className="adm-textarea"
            name="simpleGuideMd"
            rows={10}
            defaultValue={element.simple_guide_md ?? ""}
          />
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">What to watch for (markdown)</span>
          <textarea
            className="adm-textarea"
            name="watchOutForMd"
            rows={8}
            defaultValue={element.watch_out_for_md ?? ""}
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
