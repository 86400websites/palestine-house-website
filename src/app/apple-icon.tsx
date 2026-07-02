import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/* iOS home-screen / apple-touch icon — v3 (DR1-6): the owner's copper arch
   mark on the warm cream field. Uses the pixel-faithful mark PNG (same asset
   the chrome renders) rather than a re-drawn vector. */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
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
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF6EE",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse JSX, not a page */}
        <img src={src} width={100} height={105} alt="" />
      </div>
    ),
    size,
  );
}
