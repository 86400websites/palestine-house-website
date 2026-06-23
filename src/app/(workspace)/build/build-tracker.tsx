"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Info,
  Minus,
  RotateCcw,
} from "lucide-react";
import {
  setChecklistProgressAction,
  type ChecklistProgressState,
} from "@/lib/build/actions";
import type {
  BuildAreaVM,
  BuildItemVM,
  BuildModel,
  ProgressStatus,
} from "@/lib/workspace/types";

/* Client shell for /build (S6 6c). One open focus area at a time; each item
   action is its OWN <form action={formAction}> with hidden inputs (the S4
   unmount-mid-submit fix), and useActionState lives above the rows. Saving runs
   set_checklist_progress server-side then revalidates — no client Supabase, no
   optimistic state to roll back. Gates are intentionally NOT rendered: all
   checklist_items.gate are null and Gate 2's label is unapproved (D-S6-b), so
   the focus-area grouping is the whole view until HQ supplies the mapping. */

const INITIAL: ChecklistProgressState = { ok: false, message: null };

const STATUS_STYLE: Record<
  ProgressStatus,
  { label: string; Icon: typeof Clock; fg: string; bg: string }
> = {
  not_started: {
    label: "Not started",
    Icon: Circle,
    fg: "var(--stone-500)",
    bg: "var(--surface-muted)",
  },
  in_progress: {
    label: "In progress",
    Icon: Clock,
    fg: "#7A5A12",
    bg: "var(--status-warning-bg)",
  },
  complete: {
    label: "Complete",
    Icon: CheckCircle2,
    fg: "var(--green-700)",
    bg: "var(--brand-primary-tint)",
  },
  blocked: {
    label: "Blocked",
    Icon: Minus,
    fg: "var(--status-error)",
    bg: "var(--status-error-bg)",
  },
};

function StatusPill({ status }: { status: ProgressStatus }) {
  const s = STATUS_STYLE[status];
  const { Icon } = s;
  return (
    <span
      className="adm-status"
      style={{ color: s.fg, background: s.bg, marginTop: 2, flexShrink: 0 }}
    >
      <Icon size={13} aria-hidden="true" />
      {s.label}
    </span>
  );
}

export function BuildTracker({ model }: { model: BuildModel }) {
  const [state, formAction, pending] = React.useActionState(
    setChecklistProgressAction,
    INITIAL,
  );
  const [openArea, setOpenArea] = React.useState<string | null>(
    model.areas[0]?.code ?? null,
  );
  const [toast, setToast] = React.useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  React.useEffect(() => {
    if (!state.message) return;
    setToast({ tone: state.ok ? "success" : "error", text: state.message });
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [state]);

  return (
    <>
      <div className="bld-areas">
        {model.areas.map((area) => (
          <BuildArea
            key={area.code}
            area={area}
            open={openArea === area.code}
            onToggle={() =>
              setOpenArea((c) => (c === area.code ? null : area.code))
            }
            formAction={formAction}
            pending={pending}
          />
        ))}
      </div>

      <p className="ws-help ws-help--mt-lg">
        <span className="ws-help-icon">
          <Info size={17} aria-hidden="true" />
        </span>
        <span>
          Unsure about an item? Open its topic for the full guide and what to
          watch out for.
        </span>
      </p>

      {toast && (
        <div className="adm-toast">
          <div
            className="adm-toast-card"
            role={toast.tone === "error" ? "alert" : "status"}
          >
            <span>{toast.text}</span>
            <button
              type="button"
              className="adm-toast-x"
              aria-label="Dismiss"
              onClick={() => setToast(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function BuildArea({
  area,
  open,
  onToggle,
  formAction,
  pending,
}: {
  area: BuildAreaVM;
  open: boolean;
  onToggle: () => void;
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  const pct = area.items > 0 ? Math.round((area.done / area.items) * 100) : 0;
  const complete = area.items > 0 && area.done === area.items;
  return (
    <section className={`bld-area${complete ? " is-complete" : ""}`}>
      <button
        type="button"
        className="bld-area-head"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="topic-code" aria-hidden="true">
          {area.code}
        </span>
        <span className="bld-area-title">
          {area.name}
          {complete && (
            <span className="bld-area-done">
              <CheckCircle2 size={14} aria-hidden="true" /> Complete
            </span>
          )}
        </span>
        <span className="bld-area-count">
          {area.done} of {area.items} items
        </span>
        <span className="bld-meter" aria-hidden="true">
          <span style={{ width: `${pct}%` }} />
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          style={{
            color: "var(--stone-400)",
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform var(--duration-fast) var(--ease-out)",
          }}
        />
      </button>
      {open && (
        <div className="bld-area-body">
          {area.vmItems.map((item) => (
            <BuildItem
              key={item.id}
              item={item}
              formAction={formAction}
              pending={pending}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BuildItem({
  item,
  formAction,
  pending,
}: {
  item: BuildItemVM;
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  const [blocking, setBlocking] = React.useState(false);
  // The "Blocked?" note form is a transient affordance — close it on ANY status
  // change. Status only changes when the user submits an action, so this never
  // interrupts the type-a-note-then-Mark-blocked flow, but it does close the
  // empty form if the user opens it and then marks the item complete/in progress
  // instead, or after a blocked→complete→reopen round-trip (S7 fix; broadened
  // from blocked-only per the Codex review).
  React.useEffect(() => {
    setBlocking(false);
  }, [item.status]);
  const cls = `bld-item${item.status === "complete" ? " is-complete" : ""}${
    item.status === "blocked" ? " is-blocked" : ""
  }`;

  return (
    <div className={cls}>
      <div className="bld-item-body">
        <div className="bld-item-head">
          <StatusPill status={item.status} />
          <p className="bld-item-label">{item.text}</p>
        </div>
        {item.requiredDocument && (
          <p className="bld-item-doc">Document: {item.requiredDocument}</p>
        )}
        {item.status === "blocked" && item.note && (
          <p className="bld-item-note">{item.note}</p>
        )}

        <div className="bld-item-actions">
          {item.status !== "complete" && (
            <form action={formAction}>
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="status" value="complete" />
              <button
                type="submit"
                className="bld-item-link is-primary"
                disabled={pending}
              >
                <Check size={14} aria-hidden="true" /> Mark complete
              </button>
            </form>
          )}
          {item.status !== "in_progress" && item.status !== "complete" && (
            <form action={formAction}>
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="status" value="in_progress" />
              <button
                type="submit"
                className="bld-item-link"
                disabled={pending}
              >
                <Clock size={14} aria-hidden="true" /> Mark in progress
              </button>
            </form>
          )}
          {item.status === "complete" && (
            <form action={formAction}>
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="status" value="not_started" />
              <button
                type="submit"
                className="bld-item-link"
                disabled={pending}
              >
                <RotateCcw size={14} aria-hidden="true" /> Reopen
              </button>
            </form>
          )}
          {item.status !== "blocked" && (
            <button
              type="button"
              className="bld-item-link"
              aria-expanded={blocking}
              onClick={() => setBlocking((b) => !b)}
            >
              <Minus size={14} aria-hidden="true" /> Blocked?
            </button>
          )}
          {item.slug ? (
            <Link className="bld-item-link" href={`/elements/${item.slug}`}>
              Open this topic
            </Link>
          ) : (
            <span className="bld-item-link is-inert">Open this topic</span>
          )}
        </div>

        {blocking && item.status !== "blocked" && (
          <form action={formAction} className="bld-block-form">
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="status" value="blocked" />
            <label htmlFor={`note-${item.id}`} className="bld-block-hint">
              Blocked? Note why and move on. Come back when it clears.
            </label>
            <textarea
              id={`note-${item.id}`}
              name="note"
              rows={2}
              maxLength={500}
              className="bld-block-input"
            />
            <div>
              <button
                type="submit"
                className="bld-item-link"
                disabled={pending}
              >
                <Minus size={14} aria-hidden="true" /> Mark blocked
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
