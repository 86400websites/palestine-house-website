import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

/* Shared legal long-form layout (Privacy / Terms — identical by design,
   docs/page-designs/shared/page-common.jsx LegalLayout). The visible
   placeholder note is part of the approved copy: both legal texts are
   plain-language placeholders pending counsel review before launch. */
export function LegalLayout({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { id: string; title: string; body: ReactNode }[];
}) {
  return (
    <>
      <div className="legal-hero">
        <Reveal className="ph-container legal-hero-inner">
          <p className="ph-eyebrow">Legal</p>
          <h1>{title}</h1>
          <p className="ph-lead">{intro}</p>
          <p className="legal-note">
            <span className="legal-note-icon">
              <AlertTriangle size={18} aria-hidden="true" />
            </span>
            <span>
              <strong>Placeholder, pending legal review.</strong>{" "}
              Plain-language intent, not final legal text. Do not publish
              without legal review.
            </span>
          </p>
        </Reveal>
      </div>
      <div className="ph-section">
        <div className="ph-container legal-grid">
          <Reveal>
            <nav className="legal-toc" aria-label="On this page">
              <span className="legal-toc-title">On this page</span>
              <ol>
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={"#" + s.id}>{s.title}</a>
                  </li>
                ))}
              </ol>
            </nav>
          </Reveal>
          <Reveal className="legal-body">
            {sections.map((s) => (
              <section key={s.id} id={s.id}>
                <h2>{s.title}</h2>
                {s.body}
              </section>
            ))}
          </Reveal>
        </div>
      </div>
    </>
  );
}
