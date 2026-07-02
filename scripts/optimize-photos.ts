/**
 * scripts/optimize-photos.ts — DR1 idempotent photo/logo asset pipeline (v3 design refresh).
 *
 * Reads the owner-supplied v3 masters from the gitignored docs tree and writes the
 * optimized, web-safe assets that actually ship under public/. Re-run any time the
 * owner drops better masters into the source folder — outputs are overwritten in place
 * (deterministic names, no ids), so re-running never breaks references.
 *
 * Sources (gitignored — OneDrive is canon, never committed):
 *   docs/source-assets/design-refs/v3/photos/*   -> the 8 v3 photography masters
 *   docs/source-assets/design-refs/v3/logo/logo-master.png -> the "Our Culture Embassy" lockup
 *     NOTE: the logo master is a preview screenshot — the transparency checkerboard is
 *     BAKED INTO the pixels (3-channel RGB, no alpha). This script keys the light
 *     checkerboard background out to real alpha, un-blends the antialiased edges,
 *     then crops the full lockup (trim) and the copper arch mark (saturation bbox).
 *
 * Outputs (committed, served by the app):
 *   public/assets/photos/ph-photo-*.jpg   — progressive mozjpeg, ≤ ~2000px, target < 500 KB each
 *   public/assets/logo/ph-logo-mark.png   — copper arch mark only (™ + text excluded), transparent
 *     (no full-lockup output — the chrome renders the wordmark as real HTML text and the
 *      OG image composites the mark; add a lockup crop only when a surface consumes it)
 *
 * Usage:
 *   pnpm tsx scripts/optimize-photos.ts
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "docs", "source-assets", "design-refs", "v3");
const OUT_PHOTOS = path.join(ROOT, "public", "assets", "photos");
const OUT_LOGO = path.join(ROOT, "public", "assets", "logo");

const TARGET_BYTES = 500 * 1024;

/** master filename (in SRC/photos) -> output id + bounding box the encode must fit inside */
const PHOTOS: { src: string; out: string; width: number; height: number }[] = [
  { src: "hero-tatreez.png", out: "ph-photo-hero-tatreez.jpg", width: 2000, height: 2000 },
  { src: "arch-cafe.png", out: "ph-photo-arch-cafe.jpg", width: 1600, height: 1600 },
  { src: "oud-night.jpg", out: "ph-photo-oud-night.jpg", width: 2000, height: 2000 },
  { src: "tatreez-workshop.jpeg", out: "ph-photo-tatreez-workshop.jpg", width: 1600, height: 1600 },
  { src: "supper-club.png", out: "ph-photo-supper-club.jpg", width: 1600, height: 1600 },
  { src: "film-screening.jpg", out: "ph-photo-film-screening.jpg", width: 2000, height: 2000 },
  { src: "book-talk.jpg", out: "ph-photo-book-talk.jpg", width: 1600, height: 2000 },
  { src: "market-day.png", out: "ph-photo-market-day.jpg", width: 1600, height: 2000 },
];

const kb = (n: number) => `${Math.round(n / 1024)} KB`;

async function encodePhoto(entry: (typeof PHOTOS)[number]): Promise<void> {
  const srcPath = path.join(SRC, "photos", entry.src);
  const outPath = path.join(OUT_PHOTOS, entry.out);
  const base = sharp(srcPath)
    .rotate() // honor EXIF orientation before stripping metadata
    .resize({ width: entry.width, height: entry.height, fit: "inside", withoutEnlargement: true });

  // Walk quality down until the file fits the budget (dark event photography
  // usually lands well under it at q82 already). q60 is the hard floor —
  // guard the quality about to be USED, not the one just used.
  let quality = 82;
  let buf = await base.jpeg({ quality, mozjpeg: true, progressive: true }).toBuffer();
  while (buf.length > TARGET_BYTES && quality - 6 >= 60) {
    quality -= 6;
    buf = await base.jpeg({ quality, mozjpeg: true, progressive: true }).toBuffer();
  }
  await fs.writeFile(outPath, buf);
  const meta = await sharp(buf).metadata();
  const flag = buf.length > TARGET_BYTES ? "  ⚠ over 500 KB" : "";
  console.log(
    `photo  ${entry.out}  ${meta.width}x${meta.height}  q${quality}  ${kb(buf.length)}${flag}`,
  );
}

/**
 * Key the baked-in checkerboard (white ~255 / gray ~235, both unsaturated) out of the
 * logo screenshot into real alpha, and un-blend edge pixels against the light bg so
 * the mark stays clean on dark surfaces. Returns raw RGBA + dims.
 */
async function keyOutBackground(): Promise<{ data: Buffer; width: number; height: number }> {
  const srcPath = path.join(SRC, "logo", "logo-master.png");
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const BG = 245; // midpoint of the checkerboard's two tones
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    // Unsaturated + light = background. The screenshot carries light-gray compression
    // noise up to ~lum 230 around the text, so the gray cutoff sits at 215 (ramp
    // 160→215) — crisper edges beat keeping the noise. Copper stays on saturation.
    let alpha: number;
    if (sat > 40) alpha = 1; // solidly copper
    else if (lum >= 215) alpha = 0;
    else if (lum <= 160) alpha = 1;
    else alpha = (215 - lum) / 55;
    if (alpha <= 0.02) {
      data[i + 3] = 0;
    } else {
      // un-blend: master = fg*a + BG*(1-a)  =>  fg = (master - BG*(1-a)) / a
      if (alpha < 1) {
        data[i] = Math.min(255, Math.max(0, Math.round((r - BG * (1 - alpha)) / alpha)));
        data[i + 1] = Math.min(255, Math.max(0, Math.round((g - BG * (1 - alpha)) / alpha)));
        data[i + 2] = Math.min(255, Math.max(0, Math.round((b - BG * (1 - alpha)) / alpha)));
      }
      data[i + 3] = Math.round(alpha * 255);
    }
  }
  return { data, width: info.width, height: info.height };
}

type BBox = { left: number; top: number; right: number; bottom: number };

function bbox(
  data: Buffer,
  width: number,
  height: number,
  keep: (r: number, g: number, b: number, a: number) => boolean,
): BBox {
  const box: BBox = { left: width, top: height, right: -1, bottom: -1 };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (keep(data[i], data[i + 1], data[i + 2], data[i + 3])) {
        if (x < box.left) box.left = x;
        if (x > box.right) box.right = x;
        if (y < box.top) box.top = y;
        if (y > box.bottom) box.bottom = y;
      }
    }
  }
  if (box.right < 0) throw new Error("bbox: no matching pixels found");
  return box;
}

async function writeLogoCrop(
  raw: { data: Buffer; width: number; height: number },
  box: BBox,
  pad: number,
  outName: string,
  copperOnly = false,
): Promise<void> {
  const left = Math.max(0, box.left - pad);
  const top = Math.max(0, box.top - pad);
  const width = Math.min(raw.width, box.right + pad + 1) - left;
  const height = Math.min(raw.height, box.bottom + pad + 1) - top;
  let data = raw.data;
  if (copperOnly) {
    // The mark asset carries only the arch: erase gray remnants (the ™ glyph and
    // any wordmark pixels the rectangular bbox catches) — copper is warm-saturated.
    data = Buffer.from(raw.data);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0 && !(data[i] - data[i + 2] > 30 && data[i] > 110)) data[i + 3] = 0;
    }
  }
  const outPath = path.join(OUT_LOGO, outName);
  const buf = await sharp(data, { raw: { width: raw.width, height: raw.height, channels: 4 } })
    .extract({ left, top, width, height })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
  await fs.writeFile(outPath, buf);
  console.log(`logo   ${outName}  ${width}x${height}  ${kb(buf.length)}`);
}

async function main(): Promise<void> {
  await fs.mkdir(OUT_PHOTOS, { recursive: true });
  await fs.mkdir(OUT_LOGO, { recursive: true });

  for (const entry of PHOTOS) await encodePhoto(entry);

  const raw = await keyOutBackground();
  // Arch mark: the copper pixels only (saturated, warm) — excludes the ™ and the
  // charcoal wordmark/tagline, which the chrome renders as real HTML text instead.
  const markBox = bbox(
    raw.data,
    raw.width,
    raw.height,
    (r, g, b, a) => a > 200 && r - b > 40 && r > 120,
  );
  await writeLogoCrop(raw, markBox, 8, "ph-logo-mark.png", true);

  console.log("done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
