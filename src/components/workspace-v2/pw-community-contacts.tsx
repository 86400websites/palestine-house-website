import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* Community Contacts on /support (CR1) — Private copy section 7. The panel keeps
   the position and treatment of the block it replaced; the question form inside it
   is gone. The button is a normal link to the public contact form, so this has no
   submission, success or error state of its own, and it says plainly that an enquiry
   is not a community post.

   A Server Component with nothing to hydrate. The anchor is the shared banner and
   footer's destination: /support#community-contacts. tabIndex -1 so arriving there moves
   keyboard focus here too, rather than leaving it on the footer link. */

const COPY = {
  kicker: "Community Contacts",
  heading: "Need a community contact?",
  lead: "Use our contact form to request a suitable contact, an introduction or instructions for sharing a question, idea or story.",
  instructions:
    "Start the subject with “Community access and sharing”. Include your name, House or city, and a few sentences about what you need. Ask whether a suitable contact or sharing channel is available.",
  button: "Request Community Contacts",
  helper:
    "This opens the website contact form. Submitting it sends an enquiry; it does not post a question to community members.",
} as const;

export function PwCommunityContacts() {
  return (
    <section className="pw-ask" id="community-contacts" tabIndex={-1}>
      <div className="pw-container">
        <div className="pw-ask-wrap">
          <div className="pw-ask-copy">
            <p className="pw-kicker">{COPY.kicker}</p>
            <h2>{COPY.heading}</h2>
            <p className="pw-ask-lead">{COPY.lead}</p>
          </div>

          <div className="pw-ask-form pw-contact-panel">
            <p>{COPY.instructions}</p>
            <Link className="pw-action" href="/contact">
              {COPY.button}
              <ArrowRight className="pw-icon" aria-hidden="true" />
            </Link>
            <p className="pw-form-note">{COPY.helper}</p>
            <p>
              Aswātna is an optional programming and events provider. If you
              choose to explore its services, email{" "}
              <a href="mailto:nour@aswatnastudio.com">nour@aswatnastudio.com</a>{" "}
              or visit{" "}
              <a
                href="https://aswatnastudio.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                aswatnastudio.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
