"use client";

import * as React from "react";
import { CheckCircle2, Clock, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { decideApplicationAction, type DecideState } from "@/lib/admin/actions";

/* The HQ approval queue (docs/page-copy/04-admin/admin-approvals.md +
   docs/page-designs/admin/AdminApprovals). Review a submission, then Approve
   (sets is_approved = true) or Decline (leaves it false). Status always reads
   as colour + icon + label. "Add note" is deferred (PROJECT-STATUS §4). */

export type ApplicationRow = {
  id: string;
  name: string;
  email: string;
  city: string;
  organisation: string | null;
  why: string;
  status: "pending" | "approved" | "declined";
  applied: string;
};

const STATUS: Record<
  ApplicationRow["status"],
  { label: string; Icon: typeof Clock; fg: string; bg: string }
> = {
  pending: { label: "Pending", Icon: Clock, fg: "#7A5A12", bg: "var(--status-warning-bg)" },
  approved: { label: "Approved", Icon: CheckCircle2, fg: "var(--green-700)", bg: "var(--brand-primary-tint)" },
  declined: { label: "Declined", Icon: Minus, fg: "var(--stone-500)", bg: "var(--surface-muted)" },
};

function StatusBadge({ status }: { status: ApplicationRow["status"] }) {
  const s = STATUS[status];
  const { Icon } = s;
  return (
    <span className="adm-status" style={{ color: s.fg, background: s.bg }}>
      <Icon size={13} aria-hidden="true" />
      {s.label}
    </span>
  );
}

const INITIAL: DecideState = { ok: false, message: null };

export function ApprovalsQueue({ rows }: { rows: ApplicationRow[] }) {
  const [state, formAction, pending] = React.useActionState(
    decideApplicationAction,
    INITIAL,
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(
    rows[0]?.id ?? null,
  );
  const [toast, setToast] = React.useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  // Keep a valid selection after the list refreshes following a decision.
  React.useEffect(() => {
    if (rows.length === 0) {
      setSelectedId(null);
    } else if (!rows.some((r) => r.id === selectedId)) {
      setSelectedId(rows[0].id);
    }
  }, [rows, selectedId]);

  // Surface the decision result as a brief toast.
  React.useEffect(() => {
    if (!state.message) return;
    setToast({ tone: state.ok ? "success" : "error", text: state.message });
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [state]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <>
      <div className="adm-toolbar">
        <StatusBadge status="pending" />
        <StatusBadge status="approved" />
        <StatusBadge status="declined" />
        <span className="adm-count">
          {pendingCount} pending · {rows.length} total · pending first
        </span>
      </div>

      <div className="adm-split">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">City</th>
                <th scope="col">Organisation</th>
                <th scope="col">Applied</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={r.id === selectedId ? "is-selected" : undefined}
                  tabIndex={0}
                  aria-selected={r.id === selectedId}
                  onClick={() => setSelectedId(r.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(r.id);
                    }
                  }}
                >
                  <td className="adm-td-strong">{r.name}</td>
                  <td className="adm-td-muted">{r.email}</td>
                  <td>{r.city}</td>
                  <td className="adm-td-trunc">{r.organisation ?? "—"}</td>
                  <td className="adm-td-muted" style={{ whiteSpace: "nowrap" }}>
                    {r.applied}
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="adm-td-muted">
                    No applications yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selected ? (
          <aside className="adm-detail" aria-label="Application detail">
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "var(--space-3)",
              }}
            >
              <h2>{selected.name}</h2>
              <StatusBadge status={selected.status} />
            </div>
            <div className="adm-field">
              <span className="adm-field-label">Email</span>
              <span className="adm-field-value">{selected.email}</span>
            </div>
            <div className="adm-field">
              <span className="adm-field-label">City</span>
              <span className="adm-field-value">{selected.city}</span>
            </div>
            <div className="adm-field">
              <span className="adm-field-label">Organisation</span>
              <span className="adm-field-value">{selected.organisation ?? "—"}</span>
            </div>
            <div className="adm-field">
              <span className="adm-field-label">Applied</span>
              <span className="adm-field-value">{selected.applied}</span>
            </div>
            <div className="adm-field">
              <span className="adm-field-label">Their message</span>
              <span className="adm-field-value">{selected.why}</span>
            </div>

            {selected.status === "pending" ? (
              /* Each decision is its own form with the decision in a hidden
                 input, so it is always present in the form data (not reliant on
                 the submit button being captured as the form's submitter). */
              <div className="adm-detail-actions">
                <form action={formAction}>
                  <input type="hidden" name="id" value={selected.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <Button type="submit" size="sm" disabled={pending}>
                    Approve
                  </Button>
                </form>
                <form action={formAction}>
                  <input type="hidden" name="id" value={selected.id} />
                  <input type="hidden" name="decision" value="declined" />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    style={{ color: "var(--status-error)" }}
                  >
                    Decline
                  </Button>
                </form>
              </div>
            ) : (
              <div className="adm-detail-actions">
                <span
                  style={{
                    font: "var(--weight-regular) var(--text-sm)/1.5 var(--font-body)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  {selected.status === "approved"
                    ? "Platform unlocked."
                    : "Not approved — no access."}
                </span>
              </div>
            )}
          </aside>
        ) : (
          <div className="adm-detail-empty">
            Select an application to review the full submission before deciding.
          </div>
        )}
      </div>

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
