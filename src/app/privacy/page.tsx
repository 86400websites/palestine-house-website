import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/sections/legal-layout";

/* Privacy (/privacy) — the owner's Privacy_Policy.md, word for word (CR1), in the
   existing legal shell. scripts/verify-public-copy.ts compares this page with the
   delivered file when the delivery is on disk. The file's contact link is the public
   contact form; it is a route here so a Preview stays on its own site. */

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "We collect the information you provide when applying, creating an account or contacting us. We use it to manage access, respond to enquiries and operate the website.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        The Palestine House website and members’ pages are operated by{" "}
        <strong>86400 Studio</strong>.
      </p>
      <p>
        Please read this policy before applying or using our website. If you are
        not comfortable with how we handle your information, please do not apply,
        create an account or submit personal details.
      </p>
      <p>
        We collect the information you provide when applying, creating an account
        or contacting us. We use it to manage access, respond to enquiries and
        operate the website.
      </p>
      <p>
        We share information only with service providers who help operate the
        website, with your permission, or where legally required. We do not sell
        your personal information.
      </p>
      <p>
        We take reasonable steps to protect your information and keep it only as
        long as necessary.
      </p>
      <p>
        You can request access, correction or deletion of your information,
        subject to applicable law, through our{" "}
        <Link href="/contact">contact form</Link>. You can unsubscribe from
        marketing emails at any time.
      </p>
      <p>
        Independent Houses and external providers are responsible for their own
        privacy practices.
      </p>
    </LegalLayout>
  );
}
