import type { Metadata } from "next";
import { Artwork } from "@/components/shared/artwork";
import { Reveal } from "@/components/motion/reveal";
import { ContactForm } from "@/components/sections/contact-form";

/* Contact (/contact) — copy verbatim from docs/page-copy/01-public-pages/
   contact.md; layout from docs/page-designs/public/Contact.app.jsx. */

export const metadata: Metadata = {
  title: "Contact",
  description:
    "A question about Palestine House, partnering, or the platform? Send it over — a real person will get back to you.",
};

export default function ContactPage() {
  return (
    <>
      {/* 1 — Hero */}
      <section className="page-hero">
        <Reveal className="ph-container page-hero-inner contact-hero">
          <p className="ph-eyebrow">Contact</p>
          <h1>Say hello.</h1>
          <p className="ph-lead">
            A question about Palestine House, partnering, or the platform? Send
            it over — a real person will get back to you.
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
              alt="An ink-wash illustration of a pointed-arch window with a brass dallah and two cups on a low table, an old city beyond."
              ratio="4 / 5"
              sizes="(max-width: 860px) 100vw, 40vw"
            />
            <p className="contact-art-note">
              We read every message. Partnership enquiries are reviewed by HQ.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
