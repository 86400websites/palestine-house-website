"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { setMyAccountAction, type AccountState } from "@/lib/account/actions";

/* The interactive bits of /account (S6 6g): display-name + email-opt-in saved
   together via set_my_account, and the "Change password" link to the existing
   /update-password flow. Inputs are uncontrolled (defaultValue/defaultChecked)
   + read from FormData. The Delete account section is intentionally hidden at
   launch (D-S6-c) — deletion requests route through /support meanwhile. */

const INITIAL: AccountState = { ok: false, message: null };

export function AccountForm({
  initialName,
  initialOptIn,
}: {
  initialName: string;
  initialOptIn: boolean;
}) {
  const [state, formAction, pending] = React.useActionState(
    setMyAccountAction,
    INITIAL,
  );
  const [toast, setToast] = React.useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  React.useEffect(() => {
    if (!state.message) return;
    setToast({ tone: state.ok ? "success" : "error", text: state.message });
    const t = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(t);
  }, [state]);

  return (
    <>
      <form
        action={formAction}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-5)",
          marginTop: "var(--space-8)",
        }}
      >
        <section className="acct-section">
          <h2>Profile</h2>
          <label className="acct-field">
            <span className="acct-field-label">Display name</span>
            <input
              className="acct-input"
              type="text"
              name="displayName"
              defaultValue={initialName}
              maxLength={120}
              autoComplete="name"
            />
          </label>
          <div>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </section>

        <section className="acct-section">
          <h2>Email</h2>
          <label className="acct-switch">
            <input type="checkbox" name="optIn" defaultChecked={initialOptIn} />
            <span className="acct-switch-track" aria-hidden="true">
              <span className="acct-switch-knob" />
            </span>
            <span className="acct-switch-text">
              Send me the occasional update from Palestine House.
            </span>
          </label>
          <p className="acct-desc">Saved when you choose Save changes.</p>
        </section>
      </form>

      <section className="acct-section" style={{ marginTop: "var(--space-5)" }}>
        <h2>Password</h2>
        <div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/update-password">Change password</Link>
          </Button>
        </div>
      </section>

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
