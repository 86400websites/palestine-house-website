import { ImageResponse } from "next/og";

/* iOS home-screen / apple-touch icon (S7 Step 6) — the brand arch mark on the
   heritage-green field, matching icon.svg and the OG image. */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A6B4A",
        }}
      >
        <svg width="96" height="120" viewBox="0 0 48 60" fill="none">
          <path
            d="M8 57 V30 A32 32 0 0 1 24 2.5 A32 32 0 0 1 40 30 V57"
            stroke="#F6F1E8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.5 57 V34 A15.5 15.5 0 0 1 24 20.6 A15.5 15.5 0 0 1 31.5 34 V57"
            stroke="#F6F1E8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.4"
          />
        </svg>
      </div>
    ),
    size,
  );
}
