import type { Metadata } from "next";
import { getMyProfile } from "@/lib/auth/profile";
import { PendingState } from "@/components/workspace/pending-state";
import { SupportForm } from "./support-form";

/* /support — help with the platform or the playbook (docs/page-copy/03-member-workspace/support.md).
   Approval-gated: the submit_support_request write is approved-only (the launch
   anti-abuse posture, PROJECT-STATUS §7 / D-S6-a), so a pending session sees the
   under-review notice and uses the public /contact page meanwhile. The heading,
   form, and confirmation all live in the client SupportForm so the confirmation
   can replace the whole view. Email delivery is deferred — requests are stored. */

export const metadata: Metadata = { title: "Support" };

export default async function SupportPage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PendingState contactFallback />;

  return <SupportForm />;
}
