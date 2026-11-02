import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";

/* The legal long-form layout (docs/page-designs/shared/page-common.jsx LegalLayout).
   Its one page since CR1 is Privacy: the Terms page and the placeholder notice are
   gone, and a short policy with no headings has no use for an on-page contents list,
   so the reading column takes the full grid. */
export function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className="legal-hero">
        <Reveal className="ph-container legal-hero-inner">
          <p className="ph-eyebrow">Legal</p>
          <h1>{title}</h1>
        </Reveal>
      </div>
      <div className="ph-section">
        <div className="ph-container">
          <Reveal className="legal-body">{children}</Reveal>
        </div>
      </div>
    </>
  );
}
