"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  saveFocusAreaAction,
  setFocusAreaPublishedAction,
  deleteFocusAreaAction,
  reorderFocusAreasAction,
  createGroupAction,
  type AdminContentState,
} from "@/lib/admin/content-actions";
import { TOPIC_PHOTOS } from "@/lib/workspace-v2/topic-photos";

/* Focus areas admin (PP6a) — the screen the owner actually lives in.

   THE EIGHT RULES that make it hard to break, and where each one is enforced:
     1. Draft by default            — the RPC never publishes on create.
     2. Delete only on Draft        — the DB refuses; the UI also hides Delete.
     3. Delete asks you to type it  — checked in the server action, not here.
     4. The web address never moves — the RPC ignores the slug on update.
     5. You never pick a file's home — Files screen; nothing here mentions one.
     6. Type + size checked first   — Files screen.
     7. Save is off until it changes — this file, plus a "Saved" stamp.
     8. Never the last admin        — the DB, since 0024.
   Rules 1-4 and 8 are database rules. What is in this file is convenience; what
   protects the platform is underneath it.

   Nothing on screen is a path, an id, a bucket name or JSON. */

export type GroupRow = {
  id: string;
  section_slug: string;
  slug: string;
  name: string;
  sort_order: number;
  published: boolean;
  topic_count: number;
};

export type TopicRow = {
  id: string;
  group_id: string;
  group_name: string;
  section_slug: string;
  slug: string;
  title: string;
  description: string | null;
  intro: string | null;
  icon: string | null;
  image_path: string | null;
  image_position: string | null;
  youtube_url: string | null;
  sort_order: number;
  published: boolean;
  element_id: string;
  element_slug: string;
  element_code: string;
  has_guide_text: boolean;
  template_count: number;
  guide_file_count: number;
};

export type GuideBody = { element_id: string; simple_guide_md: string | null };

const SECTIONS = [
  { slug: "setup", label: "Setup" },
  { slug: "operate", label: "Operate" },
  { slug: "program", label: "Program" },
  { slug: "support", label: "Support" },
] as const;

const INITIAL: AdminContentState = { ok: false, message: null };

/* The card is typeset for a length. A counter is kinder than truncating the
   owner's words after the fact, and it never blocks a save. */
function Counter({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span
      className="adm-field-hint"
      style={over ? { color: "var(--status-error)" } : undefined}
    >
      {value.length} / {max}
      {over ? " — long, this may wrap awkwardly on a phone" : ""}
    </span>
  );
}

function StatePill({ live }: { live: boolean }) {
  return (
    <span
      className="adm-field-hint"
      style={{
        color: live ? "var(--green-700)" : "var(--status-warning)",
        fontWeight: 600,
      }}
    >
      {live ? "Live" : "Draft"}
    </span>
  );
}

export function FocusAreasAdmin({
  groups,
  topics,
  selected,
  guide,
}: {
  groups: GroupRow[];
  topics: TopicRow[];
  selected: TopicRow | null;
  guide: GuideBody | null;
}) {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);
  const [notice, setNotice] = React.useState<AdminContentState>(INITIAL);
  const [busy, startTransition] = React.useTransition();

  const select = (id: string) =>
    router.push(`/admin/content/focus-areas?id=${id}`, { scroll: false });

  /* Reorder is arrows, never a number to fat-finger. The whole ordered list of
     that group's focus areas is sent and positions are assigned from array
     order, so two rows can never end up sharing a position. */
  const move = (row: TopicRow, delta: number) => {
    const siblings = topics
      .filter((t) => t.group_id === row.group_id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const from = siblings.findIndex((t) => t.id === row.id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= siblings.length) return;
    const next = [...siblings];
    [next[from], next[to]] = [next[to], next[from]];
    startTransition(async () => {
      setNotice(await reorderFocusAreasAction(next.map((t) => t.id)));
      router.refresh();
    });
  };

  return (
    <div className="adm-split">
      <div>
        {notice.message ? (
          <p
            role={notice.ok ? "status" : "alert"}
            className={`adm-form-msg ${notice.ok ? "is-ok" : "is-err"}`}
          >
            {notice.message}
          </p>
        ) : null}

        <div className="adm-detail-actions" style={{ marginBottom: "1rem" }}>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setCreating(true);
              router.push("/admin/content/focus-areas", { scroll: false });
            }}
          >
            + New focus area
          </Button>
        </div>

        {SECTIONS.map((section) => {
          const rows = topics
            .filter((t) => t.section_slug === section.slug)
            .sort((a, b) => a.sort_order - b.sort_order);
          return (
            <section key={section.slug} style={{ marginBottom: "1.5rem" }}>
              <h2>{section.label}</h2>
              {rows.length === 0 ? (
                <p className="adm-field-hint">
                  Nothing here yet. Add the first focus area for {section.label}.
                </p>
              ) : (
                <table className="adm-table">
                  <tbody>
                    {rows.map((r, i) => (
                      <tr
                        key={r.id}
                        className={
                          selected?.id === r.id ? "is-selected" : undefined
                        }
                      >
                        <td className="adm-td-strong">{r.title}</td>
                        <td>
                          <StatePill live={r.published} />
                        </td>
                        <td className="adm-td-muted">
                          {r.template_count} file
                          {r.template_count === 1 ? "" : "s"}
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            aria-label={`Move ${r.title} up`}
                            disabled={i === 0 || busy}
                            onClick={() => move(r, -1)}
                          >
                            ↑
                          </Button>{" "}
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            aria-label={`Move ${r.title} down`}
                            disabled={i === rows.length - 1 || busy}
                            onClick={() => move(r, 1)}
                          >
                            ↓
                          </Button>{" "}
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setCreating(false);
                              select(r.id);
                            }}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          );
        })}
      </div>

      {creating ? (
        <FocusAreaForm key="new" groups={groups} topic={null} guide={null} />
      ) : selected ? (
        <FocusAreaForm
          key={selected.id}
          groups={groups}
          topic={selected}
          guide={guide}
        />
      ) : (
        <p className="adm-intro">
          Choose a focus area to edit it, or add a new one.
        </p>
      )}
    </div>
  );
}

function FocusAreaForm({
  groups,
  topic,
  guide,
}: {
  groups: GroupRow[];
  topic: TopicRow | null;
  guide: GuideBody | null;
}) {
  /* No useRouter here: the two children below refresh themselves. Passing an
     inline `onDone={() => router.refresh()}` from this component is what caused
     the refresh loop the exit-gate review found — a new function identity every
     render, in an effect's dependency list. */
  const [state, formAction, pending] = React.useActionState(
    saveFocusAreaAction,
    INITIAL,
  );

  const [section, setSection] = React.useState(
    topic?.section_slug ?? SECTIONS[0].slug,
  );
  const [title, setTitle] = React.useState(topic?.title ?? "");
  const [description, setDescription] = React.useState(topic?.description ?? "");
  const [intro, setIntro] = React.useState(topic?.intro ?? "");
  const [imagePath, setImagePath] = React.useState(topic?.image_path ?? "");
  const [imagePosition, setImagePosition] = React.useState(
    topic?.image_position ?? "",
  );

  /* The photo list, plus WHATEVER THIS ROW ALREADY USES if that is not in it.
     Without the second half, opening a focus area whose photograph is not in
     the pool would show the first option selected and Save would quietly change
     the picture — the same class of defect as PP6a's Pages screen, which nulled
     five columns it could not display. A select can only ever offer what it
     lists, so it has to list what it found. */
  const photoOptions = React.useMemo(() => {
    const current = topic?.image_path?.trim();
    if (!current || TOPIC_PHOTOS.some((p) => p.path === current)) {
      return TOPIC_PHOTOS;
    }
    return [
      { file: current, label: `${current.split("/").pop()} (in use)`, path: current },
      ...TOPIC_PHOTOS,
    ];
  }, [topic?.image_path]);
  /* Rule 7: Save stays off until something actually changes, so an accidental
     click cannot rewrite a row with what it already said. */
  const [dirty, setDirty] = React.useState(false);
  const touch = () => setDirty(true);

  React.useEffect(() => {
    if (state.ok) setDirty(false);
  }, [state.ok]);

  const sectionGroups = groups.filter((g) => g.section_slug === section);

  return (
    <div className="adm-detail">
      <h2>{topic ? topic.title : "New focus area"}</h2>
      {topic ? (
        <p className="adm-intro">
          <StatePill live={topic.published} /> · {topic.template_count} template
          {topic.template_count === 1 ? "" : "s"} ·{" "}
          {topic.guide_file_count > 0
            ? "guide file uploaded"
            : "no guide file yet"}
        </p>
      ) : (
        <p className="adm-intro">
          It starts as a Draft — nobody sees it until you press Live.
        </p>
      )}

      <form action={formAction} className="adm-form">
        {topic ? <input type="hidden" name="id" value={topic.id} /> : null}

        <label className="adm-form-field">
          <span className="adm-field-label">Section</span>
          <select
            className="adm-select"
            value={section}
            onChange={(e) => {
              setSection(e.target.value);
              touch();
            }}
          >
            {SECTIONS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.label}
              </option>
            ))}
          </select>
          <span className="adm-field-hint">
            The four sections are fixed — you choose which one this sits in.
          </span>
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Group</span>
          <select
            className="adm-select"
            name="groupId"
            required
            defaultValue={topic?.group_id ?? sectionGroups[0]?.id ?? ""}
            onChange={touch}
          >
            {sectionGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          {sectionGroups.length === 0 ? (
            <span className="adm-field-hint" style={{ color: "var(--status-error)" }}>
              This section has no group yet — add one below before saving.
            </span>
          ) : null}
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Title</span>
          <input
            className="adm-input"
            name="title"
            required
            maxLength={200}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              touch();
            }}
          />
          <Counter value={title} max={80} />
          {topic ? (
            <span className="adm-field-hint">
              Renaming is safe — the web address stays as it is, so existing
              links keep working.
            </span>
          ) : null}
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Short code</span>
          <input
            className="adm-input"
            name="code"
            required
            maxLength={16}
            defaultValue={topic?.element_code ?? ""}
            placeholder="1.1"
            onChange={touch}
          />
          <span className="adm-field-hint">
            A short reference for your own use, like 1.1. Partners never see it.
          </span>
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Short line</span>
          <input
            className="adm-input"
            name="description"
            maxLength={500}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              touch();
            }}
          />
          <Counter value={description} max={90} />
          <span className="adm-field-hint">
            The first line on the card. One sentence.
          </span>
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Intro</span>
          <textarea
            className="adm-textarea"
            name="intro"
            rows={3}
            maxLength={1000}
            value={intro}
            onChange={(e) => {
              setIntro(e.target.value);
              touch();
            }}
          />
          <Counter value={intro} max={220} />
        </label>

        {/* A live preview of the card exactly as a partner reads it, so the two
            length limits above mean something concrete rather than abstract. */}
        <div className="adm-form-field">
          <span className="adm-field-label">How the card will read</span>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "var(--space-4)",
              background: "var(--surface-card)",
            }}
          >
            <strong>{title || "Your title"}</strong>
            <p style={{ margin: "0.25rem 0 0", color: "var(--muted-foreground)" }}>
              {description || "Your short line."}
            </p>
            {intro ? (
              <p style={{ margin: "0.5rem 0 0" }}>{intro}</p>
            ) : null}
          </div>
        </div>

        {/* PP6b: a chooser, not a text box. This field used to ask the owner to
            type "/assets/workspace/topics/legal-compliance-and-risk.jpg", which
            contradicted rule 5 above and the sprint whose gate is that he can
            work the CMS without help. The photographs are the ones already in
            the product (D-PP-o reuses them), so this is a list, not an upload. */}
        <label className="adm-form-field">
          <span className="adm-field-label">Photo</span>
          <select
            className="adm-select"
            name="imagePath"
            value={imagePath}
            onChange={(e) => {
              setImagePath(e.target.value);
              touch();
            }}
          >
            <option value="">No photo — plain panel</option>
            {photoOptions.map((p) => (
              <option key={p.path} value={p.path}>
                {p.label}
              </option>
            ))}
          </select>
          <span className="adm-field-hint">
            {imagePath
              ? "Shown across the top of the card."
              : "Leave blank and the card shows a plain panel."}
          </span>
          {imagePath ? (
            /* Plain <img>: next/image optimises, which is right for the partner
               pages and pointless for a 120px admin thumbnail — and it would put
               a loader between the owner and the thing he is choosing. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePath}
              alt=""
              style={{
                marginTop: "0.5rem",
                width: "100%",
                maxWidth: "260px",
                aspectRatio: "16 / 10",
                objectFit: "cover",
                objectPosition: imagePosition || "50% 50%",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
              }}
            />
          ) : null}
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Photo focal point</span>
          <input
            className="adm-input"
            name="imagePosition"
            maxLength={60}
            value={imagePosition}
            placeholder="50% 50%"
            onChange={(e) => {
              setImagePosition(e.target.value);
              touch();
            }}
          />
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Video link</span>
          <input
            className="adm-input"
            name="youtubeUrl"
            maxLength={500}
            defaultValue={topic?.youtube_url ?? ""}
            placeholder="https://www.youtube.com/watch?v=…"
            onChange={touch}
          />
          <span className="adm-field-hint">
            Optional. Blank is fine — the button says “Video coming soon.”
          </span>
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Guide text</span>
          <textarea
            className="adm-textarea"
            name="simpleGuideMd"
            rows={14}
            defaultValue={guide?.simple_guide_md ?? ""}
            onChange={touch}
          />
          <span className="adm-field-hint">
            What a partner reads when they press Read Now. Plain text is fine; a
            line starting with # becomes a heading.
          </span>
        </label>

        {topic ? (
          <div className="adm-form-field">
            <span className="adm-field-label">Files</span>
            <p className="adm-field-hint">
              The guide and templates people download live on the Files screen.{" "}
              <Link href="/admin/content/files">Open Files</Link>
            </p>
          </div>
        ) : null}

        {state.message ? (
          <p
            role={state.ok ? "status" : "alert"}
            className={`adm-form-msg ${state.ok ? "is-ok" : "is-err"}`}
          >
            {state.message}
          </p>
        ) : null}

        <div className="adm-detail-actions">
          <Button type="submit" size="sm" disabled={pending || !dirty}>
            {pending ? "Saving…" : dirty ? "Save" : "Saved"}
          </Button>
        </div>
      </form>

      {topic ? (
        <TopicDangerZone topic={topic} />
      ) : (
        <NewGroup section={section} />
      )}
    </div>
  );
}

/* Publish / unpublish and delete, kept apart from the edit form so a Save can
   never publish something by accident and vice versa. */
function TopicDangerZone({ topic }: { topic: TopicRow }) {
  const router = useRouter();
  const [pubState, pubAction, pubPending] = React.useActionState(
    setFocusAreaPublishedAction,
    INITIAL,
  );
  const [delState, delAction, delPending] = React.useActionState(
    deleteFocusAreaAction,
    INITIAL,
  );
  const [confirming, setConfirming] = React.useState(false);

  React.useEffect(() => {
    if (pubState.ok || delState.ok) router.refresh();
    /* router is stable across renders; an inline onDone prop was NOT, so this
       effect re-ran on every render and, once ok stayed true, refreshed in a
       loop. Found by the PP6a exit-gate review, 2026-08-14. */
  }, [pubState.ok, delState.ok, router]);

  return (
    <div style={{ marginTop: "var(--space-8)" }}>
      <form action={pubAction} className="adm-form">
        <input type="hidden" name="id" value={topic.id} />
        <input
          type="hidden"
          name="published"
          value={topic.published ? "false" : "true"}
        />
        <div className="adm-detail-actions">
          <Button type="submit" size="sm" variant="secondary" disabled={pubPending}>
            {pubPending
              ? "Working…"
              : topic.published
                ? "Move back to Draft"
                : "Make it Live"}
          </Button>
        </div>
        {pubState.message ? (
          <p
            role={pubState.ok ? "status" : "alert"}
            className={`adm-form-msg ${pubState.ok ? "is-ok" : "is-err"}`}
          >
            {pubState.message}
          </p>
        ) : null}
      </form>

      {/* Rule 2: Delete is not offered at all while the focus area is Live. The
          database refuses it too — this only saves a wasted click. */}
      {topic.published ? (
        <p className="adm-field-hint">
          To delete this, move it back to Draft first.
        </p>
      ) : !confirming ? (
        <div className="adm-detail-actions">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setConfirming(true)}
          >
            Delete…
          </Button>
        </div>
      ) : (
        <form action={delAction} className="adm-form">
          <input type="hidden" name="id" value={topic.id} />
          <input type="hidden" name="title" value={topic.title} />
          <label className="adm-form-field">
            <span className="adm-field-label">
              Type “{topic.title}” to delete it
            </span>
            <input className="adm-input" name="confirm" required maxLength={200} />
            <span className="adm-field-hint">
              This removes the focus area and its guide text. Its files must be
              removed first.
            </span>
          </label>
          <div className="adm-detail-actions">
            <Button type="submit" size="sm" disabled={delPending}>
              {delPending ? "Deleting…" : "Delete for good"}
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
          {delState.message ? (
            <p role="alert" className="adm-form-msg is-err">
              {delState.message}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}

/* Adding a group is rare — under D-PP-n each section has exactly one and the
   page renders it as a flat list. It exists so a section can be split later
   without a developer. */
function NewGroup({ section }: { section: string }) {
  const router = useRouter();
  const [state, action, pending] = React.useActionState(
    createGroupAction,
    INITIAL,
  );
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  if (!open) {
    return (
      <div className="adm-detail-actions" style={{ marginTop: "var(--space-8)" }}>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setOpen(true)}
        >
          Add a group to this section
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="adm-form" style={{ marginTop: "var(--space-8)" }}>
      <input type="hidden" name="sectionSlug" value={section} />
      <label className="adm-form-field">
        <span className="adm-field-label">New group name</span>
        <input className="adm-input" name="name" required maxLength={200} />
        <span className="adm-field-hint">
          A heading that groups focus areas inside a section.
        </span>
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
          {pending ? "Adding…" : "Add group"}
        </Button>
      </div>
    </form>
  );
}
