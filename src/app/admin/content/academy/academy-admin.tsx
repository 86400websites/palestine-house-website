"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  saveAcademyModuleAction,
  type AdminContentState,
} from "@/lib/admin/content-actions";

/* Academy admin (S11 11-7) — table of the 30 video modules + detail edit form,
   keyed 1:1 to a topic. Selection is server-driven via ?element=<element_id> so
   the script body loads only for the open module. Editable: module title,
   one-line, length, the YouTube link and the script (body_md). The topic itself
   (element) is fixed context; the upsert keys on element_id (round-tripped
   hidden), and elementSlug is carried so a save can revalidate that topic's
   Video tab. */

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
  has_body: boolean;
  sort_order: number;
};

export type AcademyDetail = {
  id: string;
  element_id: string;
  element_slug: string;
  element_code: string;
  element_title: string;
  title: string;
  one_line: string | null;
  length: string | null;
  youtube_url: string | null;
  body_md: string | null;
  sort_order: number;
};

const INITIAL: AdminContentState = { ok: false, message: null };

function Flag({ on, yes, no }: { on: boolean; yes: string; no: string }) {
  return (
    <span style={{ color: on ? "var(--green-700)" : "var(--subtle-foreground)" }}>
      {on ? yes : no}
    </span>
  );
}

export function AcademyAdmin({
  rows,
  selected,
}: {
  rows: AcademyRow[];
  selected: AcademyDetail | null;
}) {
  const router = useRouter();
  const select = (elementId: string) =>
    router.push(`/admin/content/academy?element=${elementId}`, {
      scroll: false,
    });

  return (
    <div className="adm-split">
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th scope="col">Topic</th>
              <th scope="col">Video</th>
              <th scope="col">Script</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.element_id}
                className={
                  r.element_id === selected?.element_id ? "is-selected" : undefined
                }
                tabIndex={0}
                aria-selected={r.element_id === selected?.element_id}
                onClick={() => select(r.element_id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    select(r.element_id);
                  }
                }}
              >
                <td className="adm-td-strong">
                  {r.element_code} · {r.element_title}
                </td>
                <td className="adm-td-muted">
                  <Flag on={!!r.youtube_url} yes="Linked" no="—" />
                </td>
                <td className="adm-td-muted">
                  <Flag on={r.has_body} yes="Yes" no="—" />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="adm-td-muted">
                  No modules found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected ? (
        <AcademyForm key={selected.element_id} module={selected} />
      ) : (
        <div className="adm-detail-empty">
          Select a topic to edit its video module.
        </div>
      )}
    </div>
  );
}

function AcademyForm({ module: m }: { module: AcademyDetail }) {
  const [state, formAction, pending] = React.useActionState(
    saveAcademyModuleAction,
    INITIAL,
  );

  return (
    <aside className="adm-detail" aria-label="Edit video module">
      <h2>
        {m.element_code} · {m.element_title}
      </h2>

      <form action={formAction} className="adm-form">
        <input type="hidden" name="elementId" value={m.element_id} />
        <input type="hidden" name="elementSlug" value={m.element_slug} />
        <input type="hidden" name="sortOrder" value={m.sort_order} />

        <label className="adm-form-field">
          <span className="adm-field-label">Module title</span>
          <input
            className="adm-input"
            name="title"
            required
            maxLength={200}
            defaultValue={m.title}
          />
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">One-line</span>
          <input
            className="adm-input"
            name="oneLine"
            maxLength={500}
            defaultValue={m.one_line ?? ""}
          />
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Length</span>
          <input
            className="adm-input"
            name="length"
            maxLength={60}
            defaultValue={m.length ?? ""}
            placeholder="e.g. 8 min"
          />
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">YouTube link</span>
          <input
            className="adm-input"
            name="youtubeUrl"
            type="url"
            inputMode="url"
            maxLength={500}
            defaultValue={m.youtube_url ?? ""}
            placeholder="https://www.youtube.com/watch?v=…"
          />
          <span className="adm-field-hint">
            Paste a YouTube or youtu.be link. Leave blank for the “video coming”
            state.
          </span>
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Script (markdown)</span>
          <textarea
            className="adm-textarea"
            name="bodyMd"
            rows={12}
            defaultValue={m.body_md ?? ""}
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
