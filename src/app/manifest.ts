import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

/* Web app manifest (S7 Step 6) — brand name + colours + the SVG mark, so
   "add to home screen" and the mobile browser chrome pick up the brand.
   Served at /manifest.webmanifest and auto-linked by Next.js. */

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_TAGLINE,
    start_url: "/",
    display: "standalone",
    /* v3 (DR1-6): warm cream field + charcoal mobile chrome. */
    background_color: "#FAF6EE",
    theme_color: "#2A241E",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
    ],
  };
}
