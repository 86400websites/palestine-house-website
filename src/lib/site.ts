/* Canonical site identity — single source for SEO surfaces (layout metadata,
   sitemap, robots, JSON-LD, OG image). */

export const SITE_NAME = "Palestine House";

export const SITE_TAGLINE =
  "A fixed address for Palestinian culture, in every city.";

/* Canonical SEO origin: NEXT_PUBLIC_SITE_URL (set per environment in Vercel;
   see SUPABASE-VERCEL-SETUP.md). Local fallback keeps dev working. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/* Every public route, for sitemap.ts. (/live left in LH1 — it's the gated
   members-only Live hub now, noindexed by the workspace layout.) */
export const PUBLIC_ROUTES = [
  "/",
  "/model",
  "/experience",
  "/bring-ph",
  "/our-support",
  "/apply",
  "/focus-areas",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/login",
  "/forgot-password",
  "/update-password",
] as const;
