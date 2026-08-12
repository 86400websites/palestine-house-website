"use client";

import * as React from "react";
import { ArrowRight, Check } from "lucide-react";
import {
  submitSupportRequestAction,
  type SupportState,
} from "@/lib/support/actions";

/* Ask HQ on /support (PP3) — the mockup's moss panel, wired to the Ask HQ
   server action that has been live since S6.

   D-PP-h originally deferred the send to PP4 on the understanding that it had
   to be built. It did not: submitSupportRequestAction is zod-validated, writes
   through the approved-only submit_support_request RPC (0019) and emails HQ
   through Resend (S12 12-6) with the submitter's account address as reply-to.
   Only the FIELD SHAPE differed, and it maps with no backend change at all:

     Focus Area select -> subject      Your question -> message

   So this panel replaces the legacy form outright rather than sitting on top of
   a dead one, and no channel is lost between PP3 and PP4 (owner, 2026-08-12,
   superseding D-PP-h).

   Name and work email are prefilled from the session and read-only: the account
   is already who HQ replies to, so asking again would collect data the action
   ignores. The mockup's two prototype lines ("This prototype form does not send
   data…", "In the live platform, this will go to the right HQ team.") are
   dropped — with a working send they describe nothing. Every other string here
   is the mockup's or the approved S6 copy. */

const INITIAL: SupportState = { ok: false, message: null };

const COPY = {
  kicker: "Ask HQ",
  heading: "Still need help?",
  lead: "Send one clear question. Add the important details so the right person can help quickly.",
  tips: [
    "Search the toolkit first. The answer may already be here.",
    "Choose the closest focus area and explain the decision you need to make.",
  ],
  name: "Your name",
  email: "Work email",
  topic: "What do you need help with?",
  topicPlaceholder: "Choose a Focus Area",
  question: "Your question",
  questionPlaceholder:
    "Tell us what is happening, what you have already checked, and what decision you need to make.",
  note: "We’ll use the email on your account.",
  send: "Send question",
  sending: "Sending…",
  sent: "Got it — we’ll be in touch.",
  again: "Send another request",
} as const;

/* The mockup's own option list, verbatim. Each becomes the stored subject. */
const FOCUS_AREAS = [
  "Setup",
  "Operations",
  "People",
  "Finance",
  "Governance or compliance",
  "Programming",
  "Membership or partnerships",
  "Marketing or retail",
  "Technology",
  "Other",
] as const;

export function PwAskHq({
  fullName,
  email,
}: {
  fullName: string | null;
  email: string | null;
}) {
  const [state, formAction, pending] = React.useActionState(
    submitSupportRequestAction,
    INITIAL,
  );
  const [sent, setSent] = React.useState(false);
  const sentHeading = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    if (state.ok) setSent(true);
  }, [state]);

  /* Submitting replaces the form — and the button that had focus — with the
     confirmation. Without this, a keyboard or screen-reader user is returned to
     the top of the document with no idea the send succeeded. */
  React.useEffect(() => {
    if (sent) sentHeading.current?.focus();
  }, [sent]);

  return (
    <section className="pw-ask" id="ask-hq">
      <div className="pw-container">
        <div className="pw-ask-wrap">
          <div className="pw-ask-copy">
            <p className="pw-kicker">{COPY.kicker}</p>
            <h2>{COPY.heading}</h2>
            <p className="pw-ask-lead">{COPY.lead}</p>
            <ul className="pw-ask-list">
              {COPY.tips.map((tip) => (
                <li key={tip}>
                  <Check className="pw-icon" aria-hidden="true" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pw-ask-form">
            {sent ? (
              <div className="pw-form-success">
                <span className="pw-success-icon" aria-hidden="true">
                  <Check className="pw-icon" />
                </span>
                <h3 ref={sentHeading} tabIndex={-1}>
                  {COPY.sent}
                </h3>
                <button
                  type="button"
                  className="pw-action pw-action--secondary"
                  onClick={() => setSent(false)}
                >
                  {COPY.again}
                </button>
              </div>
            ) : (
              <form action={formAction}>
                <div className="pw-form-grid">
                  <div className="pw-field">
                    <label htmlFor="pw-ask-name">{COPY.name}</label>
                    <input
                      id="pw-ask-name"
                      defaultValue={fullName ?? ""}
                      readOnly
                    />
                  </div>
                  <div className="pw-field">
                    <label htmlFor="pw-ask-email">{COPY.email}</label>
                    <input
                      id="pw-ask-email"
                      type="email"
                      defaultValue={email ?? ""}
                      readOnly
                    />
                  </div>

                  <div className="pw-field pw-field--full">
                    <label htmlFor="pw-ask-topic">{COPY.topic}</label>
                    <select id="pw-ask-topic" name="subject" required>
                      <option value="">{COPY.topicPlaceholder}</option>
                      {FOCUS_AREAS.map((area) => (
                        <option key={area}>{area}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pw-field pw-field--full">
                    <label htmlFor="pw-ask-message">{COPY.question}</label>
                    <textarea
                      id="pw-ask-message"
                      name="message"
                      required
                      maxLength={5000}
                      placeholder={COPY.questionPlaceholder}
                    />
                  </div>
                </div>

                <div className="pw-form-actions">
                  {/* The action's own neutral copy is the authority here — the
                      native required attributes only save a round trip. */}
                  {!state.ok && state.message ? (
                    <p className="pw-form-note pw-form-error" role="alert">
                      {state.message}
                    </p>
                  ) : (
                    <p className="pw-form-note">{COPY.note}</p>
                  )}
                  <button
                    type="submit"
                    className="pw-action"
                    disabled={pending}
                  >
                    {pending ? COPY.sending : COPY.send}
                    <ArrowRight className="pw-icon" aria-hidden="true" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
