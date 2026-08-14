"use client";

import * as React from "react";
import Link from "next/link";
import { setMyAccountAction, type AccountState } from "@/lib/account/actions";

/* The interactive bits of /account, in the workspace v2 register (PP5 5b).

   Behaviour is the S6 form's, unchanged: display name + email opt-in save
   together through set_my_account, and "Change password" links to the reset
   flow rather than to /update-password — that route only accepts a session that
   arrived via a recovery email (it requires the ph-recovery marker
   /auth/confirm sets), so an in-app session is sent through /forgot-password,
   which emails a link, instead of to a form that would silently dead-end (S7).
   Inputs stay uncontrolled (defaultValue/defaultChecked) and are read from
   FormData. The Delete account section is still hidden (D-S6-c).

   What changed is the shell around it. The legacy .acct-* styling and the
   admin .adm-toast both die with the teardown, so the form is rebuilt from the
   v2 vocabulary that PP3's Ask HQ panel already established — .pw-field,
   .pw-form-actions, .pw-action — and the transient toast becomes an inline
   note in that row. Inline is the better answer here anyway: the message is
   about the form you are looking at, it does not time out before it is read,
   and it announces itself in place (role="alert" for a failure, "status" for a
   save) rather than from a corner of the page.

   The one genuinely new control is the switch, because the v2 system had no
   checkbox yet. Its input is the real one, visually hidden but focusable, so
   the label, the keyboard and the form all behave natively. */

const INITIAL: AccountState = { ok: false, message: null };

export function PwAccountForm({
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

  return (
    <>
      <form action={formAction} className="pw-account-form">
        <section className="pw-account-card">
          <h2>Profile</h2>
          <div className="pw-form-grid">
            <div className="pw-field pw-field--full">
              <label htmlFor="pw-account-name">Display name</label>
              <input
                id="pw-account-name"
                type="text"
                name="displayName"
                defaultValue={initialName}
                maxLength={120}
                autoComplete="name"
              />
            </div>
          </div>
        </section>

        <section className="pw-account-card">
          <h2>Email</h2>
          <label className="pw-switch">
            <input type="checkbox" name="optIn" defaultChecked={initialOptIn} />
            <span className="pw-switch-track" aria-hidden="true">
              <span className="pw-switch-knob" />
            </span>
            <span className="pw-switch-text">
              Send me the occasional update from Palestine House.
            </span>
          </label>
          <p className="pw-account-note">Saved when you choose Save changes.</p>
        </section>

        {/* One row for both cards: the form has always saved them together,
            which is what the note above says. */}
        <div className="pw-form-actions pw-account-actions">
          {state.message ? (
            <p
              className={`pw-form-note${state.ok ? " pw-account-saved" : " pw-form-error"}`}
              role={state.ok ? "status" : "alert"}
            >
              {state.message}
            </p>
          ) : null}
          <button type="submit" className="pw-action" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      <section className="pw-account-card">
        <h2>Password</h2>
        <Link
          className="pw-action pw-action--secondary pw-account-password"
          href="/forgot-password"
        >
          Change password
        </Link>
      </section>
    </>
  );
}
