"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  addAdminAction,
  removeAdminAction,
  type AdminContentState,
} from "@/lib/admin/content-actions";

/* Admins admin (S11 11-9) — add by email + a per-row Remove. Two independent
   action states (add / remove); each result surfaces as an inline message. The
   server-side guards (admin_remove_admin) refuse removing yourself or the last
   admin; the remove control also asks for a confirm first. */

export type AdminRow = { user_id: string; email: string; added: string };

const INITIAL: AdminContentState = { ok: false, message: null };

export function AdminsAdmin({ rows }: { rows: AdminRow[] }) {
  const [addState, addAction, addPending] = React.useActionState(
    addAdminAction,
    INITIAL,
  );
  const [removeState, removeAction, removePending] = React.useActionState(
    removeAdminAction,
    INITIAL,
  );
  const addFormRef = React.useRef<HTMLFormElement>(null);

  // Clear the email field after a successful add.
  React.useEffect(() => {
    if (addState.ok) addFormRef.current?.reset();
  }, [addState]);

  return (
    <div style={{ maxWidth: 640, marginTop: "var(--space-6)" }}>
      <form ref={addFormRef} action={addAction} className="adm-add-form">
        <input
          className="adm-input"
          name="email"
          type="email"
          required
          maxLength={254}
          placeholder="name@example.com"
          aria-label="Email address"
        />
        <Button type="submit" disabled={addPending}>
          {addPending ? "Adding…" : "Add"}
        </Button>
      </form>
      {addState.message ? (
        <p
          role={addState.ok ? "status" : "alert"}
          className={`adm-form-msg ${addState.ok ? "is-ok" : "is-err"}`}
          style={{ marginTop: "var(--space-2)" }}
        >
          {addState.message}
        </p>
      ) : null}

      <div className="adm-table-wrap" style={{ marginTop: "var(--space-6)" }}>
        <table className="adm-table" style={{ minWidth: 0 }}>
          <thead>
            <tr>
              <th scope="col">Email</th>
              <th scope="col">Added</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id}>
                <td className="adm-td-strong">{r.email}</td>
                <td className="adm-td-muted" style={{ whiteSpace: "nowrap" }}>
                  {r.added}
                </td>
                <td style={{ textAlign: "right" }}>
                  <RemoveAdminForm
                    userId={r.user_id}
                    email={r.email}
                    action={removeAction}
                    pending={removePending}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="adm-td-muted">
                  No admins yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {removeState.message ? (
        <p
          role={removeState.ok ? "status" : "alert"}
          className={`adm-form-msg ${removeState.ok ? "is-ok" : "is-err"}`}
          style={{ marginTop: "var(--space-3)" }}
        >
          {removeState.message}
        </p>
      ) : null}
    </div>
  );
}

function RemoveAdminForm({
  userId,
  email,
  action,
  pending,
}: {
  userId: string;
  email: string;
  action: (formData: FormData) => void;
  pending: boolean;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Remove ${email} as an admin?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        style={{ color: "var(--status-error)" }}
      >
        Remove
      </Button>
    </form>
  );
}
