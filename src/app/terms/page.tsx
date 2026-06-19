import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/sections/legal-layout";

/* Terms (/terms) — plain-language placeholder pending counsel review
   (the visible note is part of the approved copy). Copy verbatim from
   docs/page-copy/01-public-pages/terms.md; layout mirrors Privacy exactly. */

export const metadata: Metadata = {
  title: "Terms",
  description: "The basics. By creating an account, you agree to these terms.",
};

const TERMS_SECTIONS = [
  {
    id: "your-account",
    title: "Your account",
    body: (
      <p>Keep your login safe. You’re responsible for what happens under it.</p>
    ),
  },
  {
    id: "fair-use",
    title: "Fair use",
    body: (
      <p>
        Use the playbook, templates, and course in good faith — don’t copy or
        resell them outside their purpose.
      </p>
    ),
  },
  {
    id: "the-content-is-ours",
    title: "The content is ours",
    body: (
      <p>
        The playbook, templates, course, and brand belong to Palestine House,
        for your use in building and running a House to standard.
      </p>
    ),
  },
  {
    id: "important",
    title: "Important",
    body: (
      <p>
        Using this platform does <strong>not</strong> give you the right to use
        the brand or open a House. A House runs only under a separate written
        agreement with HQ.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: (
      <p>
        We may update the platform and these terms, and we’ll flag anything
        material.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions? <Link href="/contact">Contact us</Link>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="The basics."
      intro="By creating an account, you agree to these terms."
      sections={TERMS_SECTIONS}
    />
  );
}
