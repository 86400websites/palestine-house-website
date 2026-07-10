import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES, SITE_URL } from "@/lib/site";

/* Auth utility pages are noindexed (their page metadata), so they stay out
   of the sitemap too. */
const NOINDEX_ROUTES = ["/login", "/forgot-password", "/update-password"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.filter(
    (route) => !NOINDEX_ROUTES.includes(route),
  ).map((route) => ({
    /* No lastModified: a per-build timestamp would falsely mark every page
       as freshly changed on every deploy. */
    url: `${SITE_URL}${route === "/" ? "" : route}`,
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : route === "/apply" ? 0.9 : 0.7,
  }));
}
