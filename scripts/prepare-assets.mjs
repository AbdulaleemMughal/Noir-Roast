/**
 * Turns the photos you drop in `assets/source/` into stage-ready cut-outs.
 *
 *   1. drop your bean photos into  assets/source/
 *   2. npm run assets
 *
 * Each source image is background-keyed, trimmed to the subject, squared and
 * written to public/beans/<name>.png. Files already named bean-01..bean-12
 * overwrite the procedural stand-ins directly, so the site picks them up with
 * no code change. Anything already carrying an alpha channel is passed through
 * untouched apart from the trim.
 */
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'assets/source';
const OUT = 'public/beans';
const SIZE = 512;

// How aggressively the background colour is keyed out. Raise if halos remain,
// lower if the bean itself starts eroding.
const TOLERANCE = Number(process.env.KEY_TOLERANCE ?? 62);
const SOFTNESS = Number(process.env.KEY_SOFTNESS ?? 34);

const clamp = (v, a = 0, b = 255) => (v < a ? a : v > b ? b : v);

/** Median colour of the border ring — a reliable read on the backdrop. */
function sampleBackground(data, w, h, channels) {
  const rs = [], gs = [], bs = [];
  const step = Math.max(1, Math.floor(Math.min(w, h) / 128));
  const push = (x, y) => {
    const i = (y * w + x) * channels;
    rs.push(data[i]); gs.push(data[i + 1]); bs.push(data[i + 2]);
  };
  for (let x = 0; x < w; x += step) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y += step) { push(0, y); push(w - 1, y); }
  const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
  return [med(rs), med(gs), med(bs)];
}

async function processFile(file) {
  const name = path.parse(file).name.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const src = sharp(path.join(SRC, file));
  const meta = await src.metadata();

  let pipeline;

  if (meta.hasAlpha) {
    // Already cut out — keep the artwork exactly as supplied.
    pipeline = sharp(path.join(SRC, file));
    console.log(`${file}: alpha present, passing through`);
  } else {
    const { data, info } = await src
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width: w, height: h, channels } = info;
    const [br, bg, bb] = sampleBackground(data, w, h, channels);
    console.log(`${file}: keying background rgb(${br}, ${bg}, ${bb})`);

    for (let i = 0; i < data.length; i += channels) {
      const dr = data[i] - br;
      const dg = data[i + 1] - bg;
      const db = data[i + 2] - bb;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);

      // Fully transparent below the tolerance, fully opaque above the ramp,
      // linearly feathered between the two so edges stay soft.
      let alpha;
      if (dist <= TOLERANCE) alpha = 0;
      else if (dist >= TOLERANCE + SOFTNESS) alpha = 255;
      else alpha = Math.round(((dist - TOLERANCE) / SOFTNESS) * 255);

      // Decontaminate the fringe: pull semi-transparent pixels away from the
      // backdrop colour so a white key does not leave a pale halo.
      if (alpha > 0 && alpha < 255) {
        const k = alpha / 255;
        data[i] = clamp((data[i] - br * (1 - k)) / k);
        data[i + 1] = clamp((data[i + 1] - bg * (1 - k)) / k);
        data[i + 2] = clamp((data[i + 2] - bb * (1 - k)) / k);
      }

      data[i + 3] = alpha;
    }

    pipeline = sharp(data, { raw: { width: w, height: h, channels: 4 } });
  }

  const trimmed = await pipeline
    .trim({ threshold: 1 })
    .toBuffer({ resolveWithObject: true })
    .catch(async () => ({ data: await pipeline.toBuffer(), info: null }));

  await sharp(trimmed.data)
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, `${name}.png`));

  console.log(`  -> ${OUT}/${name}.png`);
}

await mkdir(OUT, { recursive: true });

let files;
try {
  files = (await readdir(SRC)).filter((f) => /\.(png|jpe?g|webp|avif|tiff?)$/i.test(f));
} catch {
  files = [];
}

if (!files.length) {
  console.log(`No images found in ${SRC}/.`);
  console.log('Drop your coffee-bean photos there and run this again.');
  console.log('Name them bean-01.png … bean-12.png to replace the stand-ins directly.');
  process.exit(0);
}

for (const file of files) {
  await processFile(file);
}

console.log(`\nDone — ${files.length} image(s) processed.`);
