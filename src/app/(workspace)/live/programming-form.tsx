"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { publishSessionAction, type PublishState } from "@/lib/live/actions";
import type { LiveSession } from "@/lib/live/types";

/* Publish/edit form for the members-only Live hub (S9 9f; lives on /live since
   LH1). One form for both: `initial` null = create, non-null = edit (a hidden
   sessionId routes the RPC to an owner-scoped update). Times are kept in UTC
   end-to-end (the field is labelled UTC and the hub displays UTC), so there's
   no timezone conversion. New strings follow brand voice. */

const INITIAL: PublishState = { ok: false, message: null };

const ERR_STYLE: React.CSSProperties = {
  font: "var(--weight-regular) var(--text-sm)/1.5 var(--font-body)",
  margin: 0,
};

/* UTC ISO -> 'YYYY-MM-DDTHH:mm' for a datetime-local input (UTC wall-clock). */
function toUtcInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

export function ProgrammingForm({ initial }: { initial: LiveSession | null }) {
  const [state, formAction, pending] = React.useActionState(
    publishSessionAction,
    INITIAL,
  );
  const formRef = React.useRef<HTMLFormElement>(null);
  const editing = initial !== null;

  // Clear the form after a successful create (edit keeps the saved values).
  React.useEffect(() => {
    if (state.ok && !editing) formRef.current?.reset();
  }, [state, editing]);

  const youtube = initial?.recording_url ?? initial?.stream_url ?? "";

  return (
    <form
      ref={formRef}
      action={formAction}
      className="ws-card"
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}
    >
      {initial ? (
        <input type="hidden" name="sessionId" value={initial.id} />
      ) : null}

      <label className="sup-field">
        <span className="acct-field-label">Title</span>
        <input
          className="acct-input"
          name="title"
          required
          maxLength={200}
          defaultValue={initial?.title ?? ""}
          placeholder="An Evening of Oud"
        />
      </label>

      <div className="programming-2col">
        <label className="sup-field">
          <span className="acct-field-label">Status</span>
          <select
            className="acct-input"
            name="status"
            defaultValue={initial?.status ?? "scheduled"}
          >
            <option value="scheduled">Upcoming</option>
            <option value="live">Live now</option>
            <option value="past">Recording</option>
          </select>
        </label>
        <label className="sup-field">
          <span className="acct-field-label">Category</span>
          <select
            className="acct-input"
            name="mode"
            defaultValue={initial?.mode ?? ""}
          >
            <option value="">No category</option>
            <option value="Music">Music</option>
            <option value="Talks">Talks</option>
            <option value="Performance">Performance</option>
            <option value="Food">Food</option>
          </select>
        </label>
      </div>

      <label className="sup-field">
        <span className="acct-field-label">YouTube link</span>
        <input
          className="acct-input"
          name="youtubeUrl"
          type="url"
          inputMode="url"
          defaultValue={youtube}
          placeholder="https://www.youtube.com/watch?v=…"
        />
        <span
          style={{
            display: "block",
            marginTop: "var(--space-2)",
            font: "var(--weight-regular) var(--text-sm)/1.5 var(--font-body)",
            color: "var(--subtle-foreground)",
          }}
        >
          Add this once the stream or recording is ready.
        </span>
      </label>

      <div className="programming-2col">
        <label className="sup-field">
          <span className="acct-field-label">Venue</span>
          <input
            className="acct-input"
            name="venue"
            maxLength={200}
            defaultValue={initial?.venue ?? ""}
            placeholder="Palestine House Berlin"
          />
        </label>
        <label className="sup-field">
          <span className="acct-field-label">Starts (UTC)</span>
          <input
            className="acct-input"
            name="startsAt"
            type="datetime-local"
            defaultValue={toUtcInput(initial?.starts_at ?? null)}
          />
        </label>
      </div>

      <label className="sup-field">
        <span className="acct-field-label">About this session</span>
        <textarea
          className="acct-input"
          name="summary"
          rows={4}
          maxLength={1000}
          defaultValue={initial?.summary ?? ""}
          placeholder="A short line about what’s on."
          style={{ resize: "vertical" }}
        />
      </label>

      {!state.ok && state.message ? (
        <p role="alert" style={{ ...ERR_STYLE, color: "var(--status-error)" }}>
          {state.message}
        </p>
      ) : null}
      {state.ok && state.message ? (
        <p role="status" style={{ ...ERR_STYLE, color: "var(--brand-primary)" }}>
          {state.message}
        </p>
      ) : null}

      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : "Publish session"}
        </Button>
        {editing ? (
          <Button asChild variant="ghost">
            <Link href="/live#publish">Cancel</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
