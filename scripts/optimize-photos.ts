/**
 * scripts/optimize-photos.ts — DR1 idempotent photo/logo asset pipeline (v3 design refresh).
 *
 * Reads the owner-supplied v3 masters from the gitignored docs tree and writes the
 * optimized, web-safe assets that actually ship under public/. Re-run any time the
 * owner drops better masters into the source folder — outputs are overwritten in place
 * (deterministic names, no ids), so re-running never breaks references.
 *
 * Sources (gitignored — OneDrive is canon, never committed):
 *   docs/source-assets/design-refs/v3/photos/*   -> the v3 photography masters (DR1 set + DR2 stage cards)
 *   docs/source-assets/design-refs/v3/art/*      -> DR2 decorative masters (line-art + olive branches);
 *     like the logo, these are preview exports with the background BAKED IN (3-channel
 *     RGB — checkerboard or solid paper). Each is keyed to real alpha against a
 *     corner-sampled background color so it composites cleanly on any v3 surface.
 *   docs/source-assets/design-refs/v3/logo/logo-master.png -> the "Our Culture Embassy" lockup
 *     NOTE: the logo master is a preview screenshot — the transparency checkerboard is
 *     BAKED INTO the pixels (3-channel RGB, no alpha). This script keys the light
 *     checkerboard background out to real alpha, un-blends the antialiased edges,
 *     then crops the full lockup (trim) and the copper arch mark (saturation bbox).
 *
 * Masters absent on disk are SKIPPED with a note (a fresh clone usually carries only
 * the current sprint's masters) — already-committed outputs stay untouched.
 *
 * Outputs (committed, served by the app):
 *   public/assets/photos/ph-photo-*.jpg   — progressive mozjpeg, ≤ ~2000px, target < 500 KB each
 *   public/assets/art/ph-art-*.png        — keyed, trimmed, transparent decorative art (DR2)
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
const OUT_ART = path.join(ROOT, "public", "assets", "art");
const OUT_LOGO = path.join(ROOT, "public", "assets", "logo");

const exists = async (p: string): Promise<boolean> =>
  fs.access(p).then(() => true, () => false);

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
  /* DR1-9 — page-hero photos (owner masters, 2026-07-03) */
  { src: "model.jpeg", out: "ph-photo-model.jpg", width: 1600, height: 1600 },
  { src: "experience.jpeg", out: "ph-photo-experience.jpg", width: 1600, height: 1600 },
  { src: "bring-house.jpeg", out: "ph-photo-bring-house.jpg", width: 1600, height: 1600 },
  { src: "our-support.jpg", out: "ph-photo-our-support.jpg", width: 2000, height: 2000 },
  { src: "apply.jpg", out: "ph-photo-apply.jpg", width: 2000, height: 2000 },
  /* DR2 — "One path, three stages" card photos (owner masters, 2026-07-06) */
  { src: "stage-plan.png", out: "ph-photo-stage-plan.jpg", width: 1600, height: 1600 },
  { src: "stage-build.png", out: "ph-photo-stage-build.jpg", width: 1600, height: 1600 },
  { src: "stage-cafe.png", out: "ph-photo-stage-cafe.jpg", width: 1600, height: 1600 },
];

/** DR2 decorative masters (in SRC/art) -> keyed transparent PNGs in OUT_ART.
 *  All are RGB previews with the background baked in — keyed adaptively. */
const ART: { src: string; out: string; width: number; height: number }[] = [
  { src: "line-art-alaqsa.png", out: "ph-art-line-alaqsa.png", width: 1400, height: 1400 },
  { src: "olive-branch-1.png", out: "ph-art-branch-1.png", width: 1200, height: 1200 },
  { src: "olive-branch-2.png", out: "ph-art-branch-2.png", width: 1200, height: 1200 },
  { src: "olive-branch-3.png", out: "ph-art-branch-3.png", width: 1200, height: 1200 },
  { src: "olive-branch-4.png", out: "ph-art-branch-4.png", width: 1200, height: 1200 },
];

const kb = (n: number) => `${Math.round(n / 1024)} KB`;

async function encodePhoto(entry: (typeof PHOTOS)[number]): Promise<void> {
  const srcPath = path.join(SRC, "photos", entry.src);
  const outPath = path.join(OUT_PHOTOS, entry.out);
  if (!(await exists(srcPath))) {
    console.log(`skip   ${entry.out} (master absent)`);
    return;
  }
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
 * DR2 — key a decorative master's baked-in background (checkerboard or solid paper)
 * to real alpha. The background color is sampled from the four corner patches; each
 * pixel's alpha ramps on its RGB distance from that color (d<=25 → 0, d>=75 → 1),
 * with the same un-blend as the logo so soft edges stay clean on any surface.
 * Trims to the alpha bbox, bounds the size, writes a transparent PNG.
 */
async function encodeArt(entry: (typeof ART)[number]): Promise<void> {
  const srcPath = path.join(SRC, "art", entry.src);
  const outPath = path.join(OUT_ART, entry.out);
  if (!(await exists(srcPath))) {
    console.log(`skip   ${entry.out} (master absent)`);
    return;
  }
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // Sample the background from the four 8x8 corner patches (mean of all four —
  // on a checkerboard the two tones are ~20 apart, well inside the d<=25 cut).
  let br = 0, bg = 0, bb = 0, n = 0;
  const P = 8;
  for (const [cx, cy] of [[0, 0], [width - P, 0], [0, height - P], [width - P, height - P]]) {
    for (let y = cy; y < cy + P; y++) {
      for (let x = cx; x < cx + P; x++) {
        const i = (y * width + x) * 4;
        br += data[i]; bg += data[i + 1]; bb += data[i + 2]; n++;
      }
    }
  }
  br /= n; bg /= n; bb /= n;

  const D0 = 25, D1 = 75;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const d = Math.sqrt((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2);
    let alpha: number;
    if (d <= D0) alpha = 0;
    else if (d >= D1) alpha = 1;
    else alpha = (d - D0) / (D1 - D0);
    if (alpha <= 0.02) {
      data[i + 3] = 0;
    } else {
      if (alpha < 1) {
        data[i] = Math.min(255, Math.max(0, Math.round((r - br * (1 - alpha)) / alpha)));
        data[i + 1] = Math.min(255, Math.max(0, Math.round((g - bg * (1 - alpha)) / alpha)));
        data[i + 2] = Math.min(255, Math.max(0, Math.round((b - bb * (1 - alpha)) / alpha)));
      }
      data[i + 3] = Math.round(alpha * 255);
    }
  }

  const box = bbox(data, width, height, (_r, _g, _b, a) => a > 8);
  const pad = 6;
  const left = Math.max(0, box.left - pad);
  const top = Math.max(0, box.top - pad);
  const cw = Math.min(width, box.right + pad + 1) - left;
  const ch = Math.min(height, box.bottom + pad + 1) - top;
  const buf = await sharp(data, { raw: { width, height, channels: 4 } })
    .extract({ left, top, width: cw, height: ch })
    .resize({ width: entry.width, height: entry.height, fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
  await fs.writeFile(outPath, buf);
  const meta = await sharp(buf).metadata();
  console.log(`art    ${entry.out}  ${meta.width}x${meta.height}  ${kb(buf.length)}`);
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
  await fs.mkdir(OUT_ART, { recursive: true });
  await fs.mkdir(OUT_LOGO, { recursive: true });

  for (const entry of PHOTOS) await encodePhoto(entry);
  for (const entry of ART) await encodeArt(entry);

  if (await exists(path.join(SRC, "logo", "logo-master.png"))) {
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
  } else {
    console.log("skip   ph-logo-mark.png (master absent)");
  }

  console.log("done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
