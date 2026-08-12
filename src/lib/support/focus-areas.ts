/* The Ask HQ category list — the mockup's own <select> options, verbatim.

   Shared deliberately: the client renders them and the server action validates
   against them. Keeping the list in the component alone made the allowlist
   advisory, since the action's schema accepted any 1–200 character subject and
   an approved caller could post a forged one (found by review, 2026-08-12).

   No "server-only" here: both sides import it. It carries no secret. */

export const SUPPORT_FOCUS_AREAS = [
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

export type SupportFocusArea = (typeof SUPPORT_FOCUS_AREAS)[number];
