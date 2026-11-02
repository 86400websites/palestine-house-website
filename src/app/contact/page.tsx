import type { Metadata } from "next";
import { Artwork } from "@/components/shared/artwork";
import { Reveal } from "@/components/motion/reveal";
import { ContactForm } from "@/components/sections/contact-form";

/* Contact (/contact) — copy verbatim from the owner's Public Website Copy §9
   (CR1); layout from docs/page-designs/public/Contact.app.jsx. */

export const metadata: Metadata = {
  title: { absolute: "Contact - Palestine House" },
  description:
    "Ask about joining, account access, community contacts or using the Palestine House website.",
};

export default function ContactPage() {
  return (
    <>
      {/* 1 — Hero */}
      <section className="page-hero">
        <Reveal className="ph-container page-hero-inner contact-hero">
          <p className="ph-eyebrow">Contact</p>
          <h1>Ask about the community or request a contact.</h1>
          <p className="ph-lead">
            Use this form for questions about joining, account access or the
            website. You can also request a community contact, an introduction
            or instructions for sharing a question, idea or story.
          </p>
          <p className="ph-lead">
            For a community request, start the subject with “Community access
            and sharing”. Include your name, House or city, and a few sentences
            explaining what you need. Ask whether a suitable contact or sharing
            channel is available.
          </p>
          <p className="ph-lead">
            Submitting this form sends an enquiry to the website contact team.
            It does not publish your message to community members.
          </p>
        </Reveal>
      </section>

      {/* 2 — Form + art */}
      <section className="ph-section-lg">
        <div className="ph-container contact-grid">
          <Reveal className="ph-card contact-form-card">
            <ContactForm />
          </Reveal>
          <Reveal className="contact-art">
            <Artwork
              assetId="PH-SIGNUP-01"
              alt="Three people talking at a lamplit doorway, the whitewashed wall beside them hung with flower baskets."
              ratio="4 / 5"
              objectPosition="50% 58%"
              sizes="(max-width: 860px) 100vw, 40vw"
            />
            <p className="contact-art-note">
              For optional programming and event services from{" "}
              <a
                className="underline underline-offset-2"
                href="https://aswatnastudio.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Aswātna
              </a>
              , contact{" "}
              <a
                className="underline underline-offset-2"
                href="mailto:nour@aswatnastudio.com"
              >
                nour@aswatnastudio.com
              </a>{" "}
              directly. Each House chooses its own programme and providers.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
