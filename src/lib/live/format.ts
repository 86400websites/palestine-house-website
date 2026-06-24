/* Presentation helpers for the Live feed (S9 9a). Pure + framework-free so they
   run server-side (the cards + watch view are Server Components, so formatting
   stays deterministic and hydration-safe). Times render in UTC with an explicit
   label, so a global audience reads one unambiguous moment; per-event local
   timezones are a post-S9 follow-up. */

/* Component options (not dateStyle/timeStyle) so timeZoneName stays legal —
   ECMA-402 forbids mixing the style shortcuts with individual component options
   (it throws at construction). */
const WHEN = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
  timeZoneName: "short",
});

/* "27 Jun 2026, 19:00 UTC", or null for missing/invalid input. */
export function formatSessionWhen(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return WHEN.format(d);
}
