import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

/* Default Open Graph image (1200×630) — the arch mark + wordmark + tagline
   on the warm hero wash, per the recorded tokens (docs/DESIGN.md §3). */

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
          gap: 36,
          background: "#F6F1E8",
          color: "#1A1A17",
        }}
      >
        {/* The arch mark */}
        <svg viewBox="0 0 48 60" width="96" height="120" fill="none">
          <path
            d="M8 57 V30 A32 32 0 0 1 24 2.5 A32 32 0 0 1 40 30 V57"
            stroke="#1A6B4A"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.5 57 V34 A15.5 15.5 0 0 1 24 20.6 A15.5 15.5 0 0 1 31.5 34 V57"
            stroke="#1A6B4A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.4"
          />
        </svg>
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
            fontSize: 34,
            color: "#6B6A63",
            textAlign: "center",
          }}
        >
          {SITE_TAGLINE}
        </div>
      </div>
    ),
    size,
  );
}
