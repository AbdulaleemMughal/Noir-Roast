/**
 * Procedural coffee-bean renderer.
 *
 * Produces the stand-in bean cut-outs the stage animates. Every output is a
 * transparent PNG at the exact paths `lib/assets.ts` points at, so replacing a
 * stand-in with a real photo is a file copy — no code changes anywhere.
 *
 *   node scripts/generate-beans.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const OUT = 'public/beans';
const SIZE = 512;
const SS = 2; // supersample factor
const R = SIZE * SS;

/* ---------------------------------------------------------------- utilities */

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const mix = (a, b, t) => a + (b - a) * t;
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

function hash2(x, y, seed) {
  let h = x * 374761393 + y * 668265263 + seed * 1442695040;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

function valueNoise(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return mix(mix(a, b, u), mix(c, d, u), v);
}

function fbm(x, y, seed, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, y * freq, seed + i * 101) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return sum / norm;
}

/* ------------------------------------------------------------------ shading */

// Palette anchors sampled from dark-to-medium roast arabica.
const SHADOW = [0x16, 0x0a, 0x05];
const MID = [0x42, 0x22, 0x11];
const LIGHT = [0x7e, 0x46, 0x21];
const CREASE_DARK = [0x14, 0x08, 0x04];
const CREASE_LIP = [0xc4, 0x91, 0x58];
const RIM = [0xe2, 0xa8, 0x57];

function ramp(t) {
  // three-stop albedo ramp: shadow -> mid -> light
  if (t < 0.5) {
    const k = t * 2;
    return [mix(SHADOW[0], MID[0], k), mix(SHADOW[1], MID[1], k), mix(SHADOW[2], MID[2], k)];
  }
  const k = (t - 0.5) * 2;
  return [mix(MID[0], LIGHT[0], k), mix(MID[1], LIGHT[1], k), mix(MID[2], LIGHT[2], k)];
}

/**
 * Renders one bean into a raw RGBA buffer.
 *
 * @param {object} o
 * @param {number} o.seed        noise seed / shape variation
 * @param {number} o.roast       0 = medium, 1 = very dark
 * @param {number} o.aspect      width multiplier (fatter vs. slimmer bean)
 * @param {boolean} o.back       render the domed reverse side (no crease)
 * @param {number} o.wobble      crease waviness
 */
function renderBean({ seed, roast = 0.5, aspect = 1, back = false, wobble = 0.07 }) {
  const buf = Buffer.alloc(R * R * 4);

  const A = 0.55 * aspect; // half-width
  const B = 0.93;          // half-height
  const N = 2.5;           // superellipse exponent -> softly rectangular oval

  // light direction (upper-left, toward viewer) and view vector
  const lx = -0.42, ly = -0.58, lz = 0.70;
  const ll = Math.hypot(lx, ly, lz);
  const Lx = lx / ll, Ly = ly / ll, Lz = lz / ll;

  for (let py = 0; py < R; py++) {
    const v0 = (py / R) * 2 - 1;
    for (let px = 0; px < R; px++) {
      const u0 = (px / R) * 2 - 1;
      const i = (py * R + px) * 4;

      // slight organic asymmetry so beans do not read as perfect ellipses
      const bend = 0.05 * v0 * v0 - 0.02 * v0;
      const u = u0 + bend;
      const v = v0;

      const su = Math.abs(u / A);
      const sv = Math.abs(v / B);
      const f = Math.pow(su, N) + Math.pow(sv, N);

      // antialiased silhouette
      const edge = 1 - smoothstep(0.94, 1.0, f);
      if (edge <= 0.002) continue;

      // ellipsoid height -> surface normal
      const q = clamp(1 - (u / A) ** 2 - (v / B) ** 2, 0, 1);
      const h = Math.sqrt(q);
      let nx = u / (A * A);
      let ny = v / (B * B);
      let nz = Math.max(h, 0.12);

      // --- centre crease -------------------------------------------------
      let creaseMask = 0;
      let lipMask = 0;
      if (!back) {
        const cu = wobble * Math.sin(v * 2.4 + seed * 0.7) + 0.02 * Math.sin(v * 5.1);
        const d = Math.abs(u - cu);
        // crease fades out near the tips of the bean
        const taper = smoothstep(0.92, 0.62, Math.abs(v));
        creaseMask = smoothstep(0.085, 0.012, d) * taper;
        lipMask = (smoothstep(0.055, 0.105, d) * smoothstep(0.23, 0.12, d)) * taper;

        // carve a V-groove into the normal so light catches the walls
        const side = Math.sign(u - cu) || 1;
        const groove = smoothstep(0.12, 0.0, d) * taper;
        nx += side * groove * 1.9;
        nz -= groove * 0.35;
      } else {
        // reverse side: a soft longitudinal ridge instead of a split
        const ridge = smoothstep(0.42, 0.0, Math.abs(u)) * smoothstep(0.95, 0.5, Math.abs(v));
        nz += ridge * 0.18;
      }

      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl; ny /= nl; nz /= nl;

      // --- surface texture --------------------------------------------------
      // Roasted beans are covered in fine wrinkles that run lengthwise. The
      // relief is bump-mapped into the normal, not just painted into the
      // albedo, so the lighting actually breaks up across the surface.
      const nu = (u + 1) * 9.0;
      const nv = (v + 1) * 9.0;

      const relief = (x, y) =>
        fbm(x, y * 0.55, seed, 4) * 0.55 +           // broad mottling
        fbm(x * 2.6, y * 0.9, seed + 29, 3) * 0.30 + // lengthwise wrinkles
        fbm(x * 7.0, y * 7.0, seed + 53, 2) * 0.15;  // pores


      const eps = 0.09;
      const hC = relief(nu, nv);
      const hU = relief(nu + eps, nv);
      const hV = relief(nu, nv + eps);

      // the gradient of the relief field perturbs the ellipsoid normal
      const bump = mix(2.4, 3.8, roast);
      nx -= ((hU - hC) / eps) * bump * 0.15;
      ny -= ((hV - hC) / eps) * bump * 0.15;

      const grain = hC;
      const micro = fbm(nu * 5.5, nv * 5.5, seed + 37, 2);
      const wrinkle = fbm(nu * 1.6, nv * 6.5, seed + 71, 3);

      // --- lighting ---------------------------------------------------------
      const diff = clamp(nx * Lx + ny * Ly + nz * Lz);
      const wrap = clamp((diff + 0.35) / 1.35); // wrapped diffuse keeps shadows readable

      // Blinn-Phong specular against a view vector straight down +Z
      const hx = Lx, hy = Ly, hz = Lz + 1;
      const hl = Math.hypot(hx, hy, hz);
      const ndoth = clamp(nx * (hx / hl) + ny * (hy / hl) + nz * (hz / hl));
      const gloss = mix(18, 42, 1 - roast);
      const spec = Math.pow(ndoth, gloss) * mix(0.20, 0.40, 1 - roast);

      // oily sheen sits in broad patches, not uniformly
      const oil = smoothstep(0.45, 0.85, grain) * roast;

      // --- albedo ------------------------------------------------------------
      let tone = wrap * 0.86 + 0.06;
      tone *= mix(0.72, 1.22, grain);
      tone *= mix(0.90, 1.10, micro);
      tone *= mix(0.84, 1.08, wrinkle);
      tone = clamp(tone * mix(1.00, 0.58, roast));

      let [r, g, b] = ramp(clamp(tone));

      // crease darkening + pale lip
      r = mix(r, CREASE_DARK[0], creaseMask * 0.92);
      g = mix(g, CREASE_DARK[1], creaseMask * 0.92);
      b = mix(b, CREASE_DARK[2], creaseMask * 0.92);

      const lip = lipMask * mix(0.55, 0.28, roast) * (0.55 + 0.45 * wrap);
      r = mix(r, CREASE_LIP[0], lip);
      g = mix(g, CREASE_LIP[1], lip);
      b = mix(b, CREASE_LIP[2], lip);

      // specular highlight (suppressed inside the groove)
      const specAmt = spec * (1 - creaseMask * 0.8) * (0.6 + 0.7 * oil);
      r += 255 * specAmt; g += 246 * specAmt; b += 225 * specAmt;

      // warm rim light along the lower-right edge
      const fres = Math.pow(1 - clamp(nz), 3.0);
      const rimSide = smoothstep(-0.2, 0.9, nx * 0.7 + ny * 0.7);
      const rimAmt = fres * rimSide * 0.55;
      r += RIM[0] * rimAmt; g += RIM[1] * rimAmt; b += RIM[2] * rimAmt;

      // contact darkening right at the silhouette keeps the cut-out from glowing
      const edgeDark = smoothstep(0.72, 1.0, f) * 0.42;
      r *= 1 - edgeDark; g *= 1 - edgeDark; b *= 1 - edgeDark;

      buf[i] = clamp(r, 0, 255);
      buf[i + 1] = clamp(g, 0, 255);
      buf[i + 2] = clamp(b, 0, 255);
      buf[i + 3] = clamp(edge, 0, 1) * 255;
    }
  }

  return buf;
}

/* -------------------------------------------------------------------- output */

const VARIANTS = [
  { file: 'bean-01.png', seed: 3,  roast: 0.55, aspect: 1.00, wobble: 0.07 },
  { file: 'bean-02.png', seed: 11, roast: 0.72, aspect: 0.92, wobble: 0.10 },
  { file: 'bean-03.png', seed: 19, roast: 0.40, aspect: 1.08, wobble: 0.05 },
  { file: 'bean-04.png', seed: 27, roast: 0.64, aspect: 0.96, wobble: 0.12 },
  { file: 'bean-05.png', seed: 35, roast: 0.82, aspect: 1.04, wobble: 0.08 },
  { file: 'bean-06.png', seed: 43, roast: 0.48, aspect: 0.88, wobble: 0.09 },
  { file: 'bean-07.png', seed: 51, roast: 0.68, aspect: 1.12, wobble: 0.06 },
  { file: 'bean-08.png', seed: 59, roast: 0.58, aspect: 0.94, wobble: 0.11 },
  { file: 'bean-09.png', seed: 67, roast: 0.76, aspect: 1.02, back: true },
  { file: 'bean-10.png', seed: 75, roast: 0.45, aspect: 0.90, back: true },
  { file: 'bean-11.png', seed: 83, roast: 0.62, aspect: 1.06, back: true },
  { file: 'bean-12.png', seed: 91, roast: 0.88, aspect: 0.98, wobble: 0.13 },
];

await mkdir(OUT, { recursive: true });

for (const variant of VARIANTS) {
  const raw = renderBean(variant);
  await sharp(raw, { raw: { width: R, height: R, channels: 4 } })
    .resize(SIZE, SIZE, { kernel: 'lanczos3' })
    .png({ compressionLevel: 9, palette: false })
    .toFile(`${OUT}/${variant.file}`);
  console.log('rendered', variant.file);
}

/* ---- film grain tile ------------------------------------------------------ */

const G = 256;
const grain = Buffer.alloc(G * G * 4);
for (let i = 0; i < G * G; i++) {
  // triangular-distributed monochrome noise reads closer to real film than uniform
  const n = (Math.random() + Math.random()) * 0.5;
  const v = Math.round(clamp(n) * 255);
  grain[i * 4] = v;
  grain[i * 4 + 1] = v;
  grain[i * 4 + 2] = v;
  grain[i * 4 + 3] = 26;
}
await mkdir('public/textures', { recursive: true });
await sharp(grain, { raw: { width: G, height: G, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile('public/textures/grain.png');
console.log('rendered grain.png');
