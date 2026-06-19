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
    background_color: "#FAF8F3",
    theme_color: "#1A6B4A",
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
