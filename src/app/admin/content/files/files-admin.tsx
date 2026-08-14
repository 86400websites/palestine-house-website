"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { AdminContentState } from "@/lib/admin/content-actions";
import {
  uploadFileAction,
  replaceFileAction,
  renameFileAction,
  deleteFileAction,
  reorderFilesAction,
} from "@/lib/admin/file-actions";

/* Files admin (PP6a, 6a-g) — one Guide slot and a Templates list, per focus
   area. Two things and nothing else.

   The owner never sees where a file lives. There is no path on this screen, no
   bucket, no id: the server computes the storage key from the focus area and
   the file's name, and 0029 re-validates its shape. Rules 5 and 6 of the eight.

   File type and size are checked HERE first, so the answer is immediate and in
   plain words — and again in the server action, which is the one that counts. */

export type FileRow = {
  id: string;
  title: string;
  code: string | null;
  doc_key: string | null;
  type: string;
  version: string | null;
  sort_order: number;
  is_public: boolean;
};

export type TopicOption = {
  id: string;
  element_id: string;
  title: string;
  section_slug: string;
  published: boolean;
};

const INITIAL: AdminContentState = { ok: false, message: null };
const MAX_MB = 4; // must match MAX_BYTES in src/lib/admin/file-actions.ts
const ALLOWED_EXT = ["docx", "pdf"];

function extOf(name: string) {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot + 1).toLowerCase();
}

/* Refuses the file before it is sent anywhere, and says why in one sentence. */
function FilePicker({ onProblem }: { onProblem: (m: string | null) => void }) {
  return (
    <input
      className="adm-input"
      type="file"
      name="file"
      required
      accept=".docx,.pdf"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (!f) return onProblem(null);
        if (!ALLOWED_EXT.includes(extOf(f.name))) {
          e.target.value = "";
          return onProblem(
            "That file type isn’t supported — please use a Word file or a PDF.",
          );
        }
        if (f.size > MAX_MB * 1024 * 1024) {
          e.target.value = "";
          return onProblem(
            `That file is over ${MAX_MB} MB. Please save a smaller version.`,
          );
        }
        onProblem(null);
      }}
    />
  );
}

function Msg({ state }: { state: AdminContentState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`adm-form-msg ${state.ok ? "is-ok" : "is-err"}`}
    >
      {state.message}
    </p>
  );
}

export function FilesAdmin({
  topics,
  selected,
  files,
}: {
  topics: TopicOption[];
  selected: TopicOption | null;
  files: FileRow[];
}) {
  const router = useRouter();
  const guide = files.find((f) => f.doc_key === "guide") ?? null;
  const templates = files
    .filter((f) => f.doc_key === null)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="adm-split">
      <div>
        <label className="adm-form-field">
          <span className="adm-field-label">Focus area</span>
          <select
            className="adm-select"
            value={selected?.id ?? ""}
            onChange={(e) =>
              router.push(`/admin/content/files?topic=${e.target.value}`, {
                scroll: false,
              })
            }
          >
            <option value="">Choose a focus area…</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
                {t.published ? "" : " (Draft)"}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selected ? (
        <div className="adm-detail">
          <h2>{selected.title}</h2>

          <GuideSlot topic={selected} guide={guide} />
          <TemplateList topic={selected} templates={templates} />
        </div>
      ) : (
        <p className="adm-intro">
          Choose a focus area to see its guide and templates.
        </p>
      )}
    </div>
  );
}

/* One guide per focus area — the database enforces it, so this is a slot, not a
   list. Upload when empty; Replace when full. */
function GuideSlot({
  topic,
  guide,
}: {
  topic: TopicOption;
  guide: FileRow | null;
}) {
  const router = useRouter();
  const [problem, setProblem] = React.useState<string | null>(null);
  const [upState, upAction, upPending] = React.useActionState(
    uploadFileAction,
    INITIAL,
  );
  const [repState, repAction, repPending] = React.useActionState(
    replaceFileAction,
    INITIAL,
  );

  React.useEffect(() => {
    if (upState.ok || repState.ok) router.refresh();
  }, [upState.ok, repState.ok, router]);

  return (
    <section style={{ marginBottom: "var(--space-10)" }}>
      <h3>Guide</h3>
      {guide ? (
        <>
          <p className="adm-intro">
            <strong>{guide.title}</strong> — this is what Download Now gives a
            partner.
          </p>
          <form action={repAction} className="adm-form">
            <input type="hidden" name="id" value={guide.id} />
            <input type="hidden" name="elementId" value={topic.element_id} />
            <input type="hidden" name="title" value={guide.title} />
            <input type="hidden" name="prefix" value="guide" />
            <label className="adm-form-field">
              <span className="adm-field-label">Replace it</span>
              <FilePicker onProblem={setProblem} />
              <span className="adm-field-hint">
                Word or PDF, up to {MAX_MB} MB. The old file is removed once the
                new one is safely in place.
              </span>
            </label>
            {problem ? (
              <p role="alert" className="adm-form-msg is-err">
                {problem}
              </p>
            ) : null}
            <Msg state={repState} />
            <div className="adm-detail-actions">
              <Button type="submit" size="sm" disabled={repPending}>
                {repPending ? "Replacing…" : "Replace"}
              </Button>
            </div>
          </form>
          <FileRowActions file={guide} />
        </>
      ) : (
        <form action={upAction} className="adm-form">
          <input type="hidden" name="elementId" value={topic.element_id} />
          <input type="hidden" name="kind" value="guide" />
          <p className="adm-intro">
            No guide file yet. Until one is here, Download Now tells partners it
            is coming.
          </p>
          <label className="adm-form-field">
            <span className="adm-field-label">Name</span>
            <input
              className="adm-input"
              name="title"
              required
              maxLength={300}
              defaultValue={`${topic.title} — Simple Guide`}
            />
          </label>
          <label className="adm-form-field">
            <span className="adm-field-label">File</span>
            <FilePicker onProblem={setProblem} />
            <span className="adm-field-hint">
              Word or PDF, up to {MAX_MB} MB.
            </span>
          </label>
          {problem ? (
            <p role="alert" className="adm-form-msg is-err">
              {problem}
            </p>
          ) : null}
          <Msg state={upState} />
          <div className="adm-detail-actions">
            <Button type="submit" size="sm" disabled={upPending}>
              {upPending ? "Uploading…" : "Upload guide"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

function TemplateList({
  topic,
  templates,
}: {
  topic: TopicOption;
  templates: FileRow[];
}) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<AdminContentState>(INITIAL);
  const [busy, startTransition] = React.useTransition();
  const [upState, upAction, upPending] = React.useActionState(
    uploadFileAction,
    INITIAL,
  );

  React.useEffect(() => {
    if (upState.ok) {
      setAdding(false);
      router.refresh();
    }
  }, [upState.ok, router]);

  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= templates.length) return;
    const next = [...templates];
    [next[index], next[to]] = [next[to], next[index]];
    startTransition(async () => {
      setNotice(await reorderFilesAction(next.map((t) => t.id)));
      router.refresh();
    });
  };

  return (
    <section>
      <h3>Templates</h3>
      {notice.message ? <Msg state={notice} /> : null}

      {templates.length === 0 ? (
        <p className="adm-intro">No templates on this focus area yet.</p>
      ) : (
        <table className="adm-table">
          <tbody>
            {templates.map((t, i) => (
              <tr key={t.id}>
                <td className="adm-td-muted">{t.code}</td>
                <td className="adm-td-strong">{t.title}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    aria-label={`Move ${t.title} up`}
                    disabled={i === 0 || busy}
                    onClick={() => move(i, -1)}
                  >
                    ↑
                  </Button>{" "}
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    aria-label={`Move ${t.title} down`}
                    disabled={i === templates.length - 1 || busy}
                    onClick={() => move(i, 1)}
                  >
                    ↓
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {templates.map((t) => (
        <TemplateEditor key={t.id} topic={topic} file={t} />
      ))}

      {adding ? (
        <form action={upAction} className="adm-form">
          <input type="hidden" name="elementId" value={topic.element_id} />
          <input type="hidden" name="kind" value="template" />
          <label className="adm-form-field">
            <span className="adm-field-label">Name</span>
            <input className="adm-input" name="title" required maxLength={300} />
          </label>
          <label className="adm-form-field">
            <span className="adm-field-label">Short code</span>
            <input
              className="adm-input"
              name="code"
              required
              maxLength={16}
              placeholder="T01"
            />
            <span className="adm-field-hint">
              The badge on the template card, like T01.
            </span>
          </label>
          <label className="adm-form-field">
            <span className="adm-field-label">File</span>
            <FilePicker onProblem={setProblem} />
            <span className="adm-field-hint">
              Word or PDF, up to {MAX_MB} MB.
            </span>
          </label>
          {problem ? (
            <p role="alert" className="adm-form-msg is-err">
              {problem}
            </p>
          ) : null}
          <Msg state={upState} />
          <div className="adm-detail-actions">
            <Button type="submit" size="sm" disabled={upPending}>
              {upPending ? "Uploading…" : "Add template"}
            </Button>{" "}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setAdding(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="adm-detail-actions">
          <Button type="button" size="sm" onClick={() => setAdding(true)}>
            + Add template
          </Button>
        </div>
      )}
    </section>
  );
}

function TemplateEditor({
  topic,
  file,
}: {
  topic: TopicOption;
  file: FileRow;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  const [renState, renAction, renPending] = React.useActionState(
    renameFileAction,
    INITIAL,
  );
  const [repState, repAction, repPending] = React.useActionState(
    replaceFileAction,
    INITIAL,
  );

  React.useEffect(() => {
    if (renState.ok || repState.ok) router.refresh();
  }, [renState.ok, repState.ok, router]);

  if (!open) {
    return (
      <div className="adm-detail-actions">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setOpen(true)}
        >
          Edit “{file.title}”
        </Button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "var(--space-6)" }}>
      <form action={renAction} className="adm-form">
        <input type="hidden" name="id" value={file.id} />
        <label className="adm-form-field">
          <span className="adm-field-label">Name</span>
          <input
            className="adm-input"
            name="title"
            required
            maxLength={300}
            defaultValue={file.title}
          />
        </label>
        <label className="adm-form-field">
          <span className="adm-field-label">Short code</span>
          <input
            className="adm-input"
            name="code"
            maxLength={16}
            defaultValue={file.code ?? ""}
          />
        </label>
        <Msg state={renState} />
        <div className="adm-detail-actions">
          <Button type="submit" size="sm" disabled={renPending}>
            {renPending ? "Saving…" : "Save name"}
          </Button>{" "}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </div>
      </form>

      <form action={repAction} className="adm-form">
        <input type="hidden" name="id" value={file.id} />
        <input type="hidden" name="elementId" value={topic.element_id} />
        <input type="hidden" name="title" value={file.title} />
        <input type="hidden" name="prefix" value={file.code ?? "t"} />
        <label className="adm-form-field">
          <span className="adm-field-label">Replace the file</span>
          <FilePicker onProblem={setProblem} />
        </label>
        {problem ? (
          <p role="alert" className="adm-form-msg is-err">
            {problem}
          </p>
        ) : null}
        <Msg state={repState} />
        <div className="adm-detail-actions">
          <Button type="submit" size="sm" disabled={repPending}>
            {repPending ? "Replacing…" : "Replace"}
          </Button>
        </div>
      </form>

      <FileRowActions file={file} />
    </div>
  );
}

/* Delete, behind the same type-the-name confirmation the focus areas use. The
   server re-checks the typed name; a confirmation that lives only in the
   browser is decoration. */
function FileRowActions({ file }: { file: FileRow }) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [state, action, pending] = React.useActionState(
    deleteFileAction,
    INITIAL,
  );

  React.useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  if (!confirming) {
    return (
      <div className="adm-detail-actions">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setConfirming(true)}
        >
          Delete file…
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="adm-form">
      <input type="hidden" name="id" value={file.id} />
      <input type="hidden" name="title" value={file.title} />
      <label className="adm-form-field">
        <span className="adm-field-label">Type “{file.title}” to delete it</span>
        <input className="adm-input" name="confirm" required maxLength={300} />
      </label>
      <Msg state={state} />
      <div className="adm-detail-actions">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Deleting…" : "Delete for good"}
        </Button>{" "}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setConfirming(false)}
        >
          Keep it
        </Button>
      </div>
    </form>
  );
}
