import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/sections/legal-layout";

/* Privacy (/privacy) — plain-language placeholder pending counsel review
   (the visible note is part of the approved copy). Copy verbatim from
   docs/page-copy/01-public-pages/privacy.md; layout mirrors Terms exactly. */

export const metadata: Metadata = {
  title: "Privacy",
  description: "Your privacy, in plain words. We collect as little as possible.",
};

const PRIV_SECTIONS = [
  {
    id: "what-we-keep",
    title: "What we keep",
    body: <p>Your email, your display name, and your progress on the platform.</p>,
  },
  {
    id: "why",
    title: "Why",
    body: (
      <p>
        To give you an account, save your place, and — only if you opt in — send
        the occasional update.
      </p>
    ),
  },
  {
    id: "who-handles-it",
    title: "Who handles it",
    body: <p>Supabase (accounts and data) and, if you opt in, Mailchimp (email).</p>,
  },
  {
    id: "your-control",
    title: "Your control",
    body: (
      <p>
        View or delete your data anytime from your account. Deleting your
        account erases your progress for good.
      </p>
    ),
  },
  {
    id: "our-promise",
    title: "Our promise",
    body: <p>No phone numbers, addresses, or demographics. Ever.</p>,
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about your data? <Link href="/contact">Contact us</Link> at
        [contact email].
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Your privacy, in plain words."
      intro="We collect as little as possible."
      sections={PRIV_SECTIONS}
    />
  );
}
