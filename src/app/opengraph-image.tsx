import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

/* Default Open Graph image (1200×630) — v3 (DR1-6): the owner's copper arch
   mark + wordmark + the "Our Culture Embassy" lockup line on the warm cream
   field, with the locked site tagline beneath. */

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const mark = await readFile(
    path.join(process.cwd(), "public", "assets", "logo", "ph-logo-mark.png"),
  );
  const src = `data:image/png;base64,${mark.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "#FAF6EE",
          color: "#2A241E",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse JSX, not a page */}
        <img src={src} width={137} height={144} alt="" />
        <div
          style={{
            display: "flex",
            fontSize: 84,
            fontWeight: 600,
            letterSpacing: "-1px",
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: "10px",
            textTransform: "uppercase",
            color: "#8F5A2E",
          }}
        >
          Our Culture Embassy
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#6B6A63",
            textAlign: "center",
            marginTop: 10,
          }}
        >
          {SITE_TAGLINE}
        </div>
      </div>
    ),
    size,
  );
}
