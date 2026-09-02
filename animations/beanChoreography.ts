/**
 * The bean choreography.
 *
 * Every scene of the site is described here as a *layout*: where each bean
 * sits, how deep it is, how it is turned. The scroll system does nothing but
 * tween between consecutive layouts, which is what makes the whole page read
 * as one continuous camera move rather than a stack of separate sections.
 *
 * Positions are normalised: x = 1 is the right edge of the viewport, y = 1 the
 * bottom. Depth `z` runs 0 (far behind) to 1 (pressed against the lens) and
 * drives scale, blur and opacity together, so a bean travelling forward
 * defocuses exactly the way a real one would.
 */

import { randRange, clamp, lerp } from '@/lib/math';

export const SCENE_KEYS = [
  'hero',
  'origin',
  'separate',
  'roast',
  'aroma',
  'brew',
  'product',
  'final',
] as const;

export type SceneKey = (typeof SCENE_KEYS)[number];

export interface BeanState {
  /** Normalised position, where ±1 is the viewport edge. */
  x: number;
  y: number;
  /** Depth, 0 = far, 1 = at the lens. */
  z: number;
  rotate: number;
  rotateX: number;
  rotateY: number;
  scale: number;
  opacity: number;
  blur: number;
}

const TAU = Math.PI * 2;

/**
 * Turns a depth value into the optics that sell it: nearer beans are larger,
 * and both extremes of the depth range fall out of focus.
 */
function fromDepth(z: number) {
  const scale = 0.34 + z * 1.5;

  // Focal plane sits at z ≈ 0.55 — beans drift out of focus either side of it.
  const distance = Math.abs(z - 0.55);
  const blur = distance < 0.12 ? 0 : (distance - 0.12) * 34;

  // Far beans sink into the backdrop; very near ones thin out as they pass.
  const opacity = z < 0.2 ? lerp(0.28, 1, clamp(z / 0.2)) : z > 0.9 ? lerp(1, 0.45, clamp((z - 0.9) / 0.1)) : 1;

  return { scale, blur, opacity };
}

function state(
  x: number,
  y: number,
  z: number,
  rotate: number,
  rotateX = 0,
  rotateY = 0,
  overrides: Partial<BeanState> = {},
): BeanState {
  const optics = fromDepth(z);
  return { x, y, z, rotate, rotateX, rotateY, ...optics, ...overrides };
}

/* ------------------------------------------------------------------ layouts */

type LayoutFn = (i: number, count: number) => BeanState;

/**
 * Scene 00 — the frozen splash. Beans hang in the air where the impact threw
 * them: a wide radial scatter, a handful hurled right past the lens.
 */
const hero: LayoutFn = (i, count) => {
  const angle = (i / count) * TAU + randRange(i * 3 + 1, -0.5, 0.5);
  const radius = randRange(i * 7 + 2, 0.42, 1.02);

  // Every fourth bean is a foreground pass — huge, blurred, clipping the frame.
  const foreground = i % 4 === 1;
  const z = foreground ? randRange(i * 11, 0.92, 1.0) : randRange(i * 13, 0.3, 0.72);

  return state(
    Math.cos(angle) * radius * 1.18,
    Math.sin(angle) * radius * 0.86,
    z,
    randRange(i * 17, -180, 180),
    randRange(i * 19, -40, 40),
    randRange(i * 23, -50, 50),
  );
};

/**
 * Scene 01 — the origin. The scatter resolves into a slow orbit, clearing the
 * centre of the frame so the headline can live inside the ring.
 */
const origin: LayoutFn = (i, count) => {
  const angle = (i / count) * TAU - 0.4;
  const radius = randRange(i * 5 + 3, 0.66, 0.96);

  return state(
    Math.cos(angle) * radius * 1.1,
    Math.sin(angle) * radius * 0.82,
    randRange(i * 29, 0.22, 0.78),
    randRange(i * 31, -150, 150),
    randRange(i * 37, -25, 25),
    randRange(i * 41, -35, 35),
  );
};

/**
 * Scene 02 — the split. The ring tears open into two gutters and the beans
 * step aside for SELECTED / ROASTED / CRAFTED.
 */
const separate: LayoutFn = (i, count) => {
  const half = Math.ceil(count / 2);
  const side = i < half ? -1 : 1;
  const slot = i < half ? i : i - half;
  const slots = i < half ? half : count - half;

  // Evenly stacked vertically, with a little deterministic jitter so the
  // columns never look like a grid.
  const y = -0.86 + (slot / Math.max(slots - 1, 1)) * 1.72 + randRange(i * 43, -0.07, 0.07);
  const x = side * randRange(i * 47, 0.58, 0.96);

  // Two beans stay behind the type, deep and soft, holding the composition.
  const behind = i === 2 || i === count - 3;

  return state(
    behind ? randRange(i * 53, -0.28, 0.28) : x,
    behind ? randRange(i * 59, -0.35, 0.35) : y,
    behind ? 0.08 : randRange(i * 61, 0.38, 0.8),
    randRange(i * 67, -90, 90),
    randRange(i * 71, -20, 20),
    randRange(i * 73, -30, 30),
    behind ? { opacity: 0.3, blur: 16 } : {},
  );
};

/**
 * Scene 03 — the roast. Everything collapses into a tight tumbling mass, the
 * way beans churn against the drum wall.
 */
const roast: LayoutFn = (i, count) => {
  const angle = (i / count) * TAU * 1.6 + 0.8;
  const radius = randRange(i * 79, 0.12, 0.52);

  return state(
    Math.cos(angle) * radius * 1.25,
    Math.sin(angle) * radius * 0.95,
    randRange(i * 83, 0.3, 0.85),
    randRange(i * 89, -360, 360),
    randRange(i * 97, -70, 70),
    randRange(i * 101, -80, 80),
  );
};

/**
 * Scene 04 — the aroma. The mass loosens and lifts: beans rise off the top of
 * the frame, thinning and softening as they go.
 */
const aroma: LayoutFn = (i, count) => {
  const spread = -1.05 + (i / Math.max(count - 1, 1)) * 2.1;

  return state(
    spread * randRange(i * 103, 0.72, 1.15),
    randRange(i * 107, -1.25, 0.15),
    randRange(i * 109, 0.15, 0.62),
    randRange(i * 113, -60, 60),
    randRange(i * 127, -30, 30),
    randRange(i * 131, -40, 40),
    { opacity: randRange(i * 137, 0.35, 0.8), blur: randRange(i * 139, 4, 22) },
  );
};

/**
 * Scene 05 — the brew. A funnel: every bean converges on the cup and gives up
 * its form on the way down, which is the whole bean-becomes-coffee transition.
 */
const brew: LayoutFn = (i, count) => {
  const t = i / Math.max(count - 1, 1);

  // The further down the funnel, the tighter to the axis and the smaller.
  const fall = randRange(i * 149, 0, 1);
  const x = lerp(randRange(i * 151, -0.95, 0.95), 0, fall * 0.92);
  const y = lerp(-1.1, 0.32, fall);

  return state(
    x,
    y,
    lerp(0.62, 0.3, fall),
    randRange(i * 157, -200, 200),
    randRange(i * 163, -40, 40),
    randRange(i * 167, -40, 40),
    {
      // Beans dissolve as they reach the crema.
      opacity: fall > 0.72 ? lerp(0.9, 0, clamp((fall - 0.72) / 0.28)) : 0.9,
      scale: lerp(1.1, 0.34, fall),
      blur: lerp(0, 9, fall) + (t > 0.8 ? 6 : 0),
    },
  );
};

/**
 * Scene 06 — the product. Beans retreat into a wide halo and hold the edges of
 * the frame so the pack owns the centre.
 */
const product: LayoutFn = (i, count) => {
  const angle = (i / count) * TAU + 0.25;
  const radius = randRange(i * 173, 0.82, 1.15);

  // Two beans stay forward as foreground framing, like a shallow product still.
  const foreground = i === 0 || i === count - 1;

  return state(
    Math.cos(angle) * radius * 1.2,
    Math.sin(angle) * radius * 0.9,
    foreground ? 0.95 : randRange(i * 179, 0.12, 0.42),
    randRange(i * 181, -120, 120),
    randRange(i * 191, -20, 20),
    randRange(i * 193, -25, 25),
    foreground ? {} : { opacity: randRange(i * 197, 0.4, 0.85) },
  );
};

/**
 * Scene 07 — the return. The same beans that opened the film gather back into
 * a single tight cluster at the centre, closing the loop.
 */
const final: LayoutFn = (i, count) => {
  const angle = (i / count) * TAU + 1.1;
  const radius = randRange(i * 199, 0.05, 0.32);

  // The cluster gathers dead centre, but sits deep and slightly low: the
  // closing statement is set over it, and beans at the focal plane would fight
  // the type for the same space.
  return state(
    Math.cos(angle) * radius * 1.1,
    Math.sin(angle) * radius * 0.9 + 0.2,
    randRange(i * 211, 0.14, 0.36),
    randRange(i * 223, -40, 40),
    randRange(i * 227, -12, 12),
    randRange(i * 229, -16, 16),
    { opacity: randRange(i * 233, 0.42, 0.72), blur: randRange(i * 239, 0, 5) },
  );
};

const LAYOUTS: Record<SceneKey, LayoutFn> = {
  hero,
  origin,
  separate,
  roast,
  aroma,
  brew,
  product,
  final,
};

export const beanLayout = (scene: SceneKey, index: number, count: number): BeanState =>
  LAYOUTS[scene](index, count);

/**
 * The state each bean starts in before the opening splash throws it outward:
 * collapsed into the centre, far away, invisible.
 */
export const beanOrigin = (index: number): BeanState =>
  state(
    randRange(index * 233, -0.05, 0.05),
    randRange(index * 239, -0.05, 0.05),
    0.02,
    randRange(index * 241, -120, 120),
    0,
    0,
    { opacity: 0, scale: 0.06, blur: 8 },
  );

/** Per-bean size multiplier, so the cluster never reads as one repeated prop. */
export const beanSizeFactor = (index: number) => randRange(index * 251, 0.72, 1.32);

/* -------------------------------------------------------------------- moods */

/**
 * The atmosphere behind each scene: backdrop colours plus the parameters that
 * retune the particle field from cold dust to embers to steam.
 */
export interface SceneMood {
  /** rgb() strings — GSAP interpolates the channel numbers inside them. */
  core: string;
  mid: string;
  edge: string;
  /** Particle field controls. */
  warmth: number;
  density: number;
  rise: number;
  turbulence: number;
  particleOpacity: number;
  glow: number;
  /** Strength of the central light bloom. */
  bloom: number;
}

export const SCENE_MOODS: Record<SceneKey, SceneMood> = {
  hero: {
    core: 'rgb(38, 19, 10)',
    mid: 'rgb(14, 8, 5)',
    edge: 'rgb(4, 2, 1)',
    warmth: 0.15, density: 1, rise: 0.1, turbulence: 1, particleOpacity: 0.9, glow: 0.35, bloom: 0.55,
  },
  origin: {
    core: 'rgb(48, 26, 14)',
    mid: 'rgb(20, 11, 6)',
    edge: 'rgb(6, 3, 2)',
    warmth: 0.28, density: 1.1, rise: 0.15, turbulence: 1.1, particleOpacity: 1, glow: 0.4, bloom: 0.5,
  },
  separate: {
    core: 'rgb(58, 32, 16)',
    mid: 'rgb(24, 13, 7)',
    edge: 'rgb(7, 4, 2)',
    warmth: 0.35, density: 0.9, rise: 0.05, turbulence: 0.8, particleOpacity: 0.85, glow: 0.35, bloom: 0.45,
  },
  roast: {
    core: 'rgb(122, 52, 16)',
    mid: 'rgb(46, 19, 8)',
    edge: 'rgb(12, 5, 2)',
    warmth: 1, density: 1.5, rise: 0.55, turbulence: 2.2, particleOpacity: 1, glow: 1, bloom: 1,
  },
  aroma: {
    core: 'rgb(74, 44, 26)',
    mid: 'rgb(28, 17, 11)',
    edge: 'rgb(8, 5, 3)',
    warmth: 0.5, density: 1.3, rise: 1, turbulence: 1.4, particleOpacity: 0.95, glow: 0.5, bloom: 0.7,
  },
  brew: {
    core: 'rgb(60, 33, 17)',
    mid: 'rgb(22, 12, 7)',
    edge: 'rgb(6, 3, 2)',
    warmth: 0.42, density: 1, rise: 0.7, turbulence: 1, particleOpacity: 0.8, glow: 0.45, bloom: 0.6,
  },
  product: {
    core: 'rgb(44, 25, 13)',
    mid: 'rgb(17, 10, 6)',
    edge: 'rgb(5, 3, 2)',
    warmth: 0.3, density: 0.7, rise: 0.2, turbulence: 0.7, particleOpacity: 0.6, glow: 0.3, bloom: 0.4,
  },
  final: {
    core: 'rgb(26, 14, 8)',
    mid: 'rgb(8, 4, 2)',
    edge: 'rgb(2, 1, 1)',
    warmth: 0.2, density: 0.5, rise: 0.1, turbulence: 0.6, particleOpacity: 0.5, glow: 0.25, bloom: 0.3,
  },
};
