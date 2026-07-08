/**
 * scripts/make-tatreez-band.ts — derive the horizontal tatreez band (DR3.1.1).
 *
 * The /model "cultural embassy" section used to carry a VERTICAL tatreez photo
 * strip down its left edge. The owner asked to remove that sidebar and reuse the
 * SAME ornate green/gold motif as a HORIZONTAL ornamental band (used twice: as a
 * divider after the embassy section, and at the base of the footer CTA — matching
 * the approved reference).
 *
 * This reads the already-committed vertical strip (public/assets/photos/
 * ph-photo-embassy-tatreez.jpg — a flat green graphic with a gold motif that
 * repeats vertically) and emits ONE seamless horizontal tile that CSS repeats
 * with `background: url(...) repeat-x center / auto 100%`:
 *   - find the vertical motif period by autocorrelation of a per-row "goldness"
 *     score, and a gap row (motif-free) to cut on, so the tile edges land in flat
 *     green -> repeat-x is seamless;
 *   - crop exactly one period at that gap, rotate 90° so the flowers sit in a
 *     horizontal row.
 *
 * It reads the COMMITTED output (not the gitignored master), so it reproduces on
 * any clone. Deterministic input -> deterministic output; safe to re-run.
 *
 * Output (committed): public/assets/photos/ph-photo-embassy-tatreez-band.jpg
 *
 * Usage: pnpm tsx scripts/make-tatreez-band.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "public/assets/photos/ph-photo-embassy-tatreez.jpg");
const OUT = path.join(ROOT, "public/assets/photos/ph-photo-embassy-tatreez-band.jpg");

async function main(): Promise<void> {
  if (!(await fs.access(SRC).then(() => true, () => false))) {
    console.log("skip   tatreez band (source ph-photo-embassy-tatreez.jpg absent)");
    return;
  }
  const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, ch = info.channels;

  // base color = image mean (the flat olive-green ground)
  let br = 0, bg = 0, bb = 0;
  for (let i = 0; i < data.length; i += ch) { br += data[i]; bg += data[i + 1]; bb += data[i + 2]; }
  const n = data.length / ch;
  br /= n; bg /= n; bb /= n;

  // per-row goldness = mean |pixel - base|; motif rows score high, gaps low
  const rowScore = new Float64Array(H);
  for (let y = 0; y < H; y++) {
    let s = 0;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * ch;
      s += Math.abs(data[i] - br) + Math.abs(data[i + 1] - bg) + Math.abs(data[i + 2] - bb);
    }
    rowScore[y] = s / W;
  }

  // motif period = lag maximizing autocorrelation of the row score
  const mean = rowScore.reduce((a, b) => a + b, 0) / H;
  let period = 0, best = -Infinity;
  for (let lag = 120; lag <= Math.min(520, H - 1); lag++) {
    let c = 0;
    for (let y = 0; y + lag < H; y++) c += (rowScore[y] - mean) * (rowScore[y + lag] - mean);
    c /= (H - lag);
    if (c > best) { best = c; period = lag; }
  }

  // cut on the quietest (most motif-free) row within the first period
  let gapY = 0, gapV = Infinity;
  for (let y = 0; y < period; y++) if (rowScore[y] < gapV) { gapV = rowScore[y]; gapY = y; }

  const cropH = Math.min(period, H - gapY);
  const buf = await sharp(SRC)
    .extract({ left: 0, top: gapY, width: W, height: cropH })
    .rotate(90) // flowers stacked down the strip -> a horizontal row
    .jpeg({ quality: 88, mozjpeg: true, progressive: true })
    .toBuffer();
  await fs.writeFile(OUT, buf);
  const m = await sharp(buf).metadata();
  console.log(`band   ph-photo-embassy-tatreez-band.jpg  ${m.width}x${m.height}  ${Math.round(buf.length / 1024)} KB  (period ${period}px, gap y=${gapY})`);
}

main().catch((err) => { console.error(err); process.exit(1); });
