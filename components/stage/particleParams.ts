/**
 * Live controls for the particle field.
 *
 * A plain mutable object rather than React state on purpose: the scroll
 * timeline tweens these numbers directly with GSAP, and the canvas reads them
 * once per frame. No re-renders, no prop drilling, no dropped frames.
 */
export const particleParams = {
  /** 0 = cold roasted dust, 1 = glowing ember. */
  warmth: 0.15,
  /** Multiplier on the active particle count. */
  density: 1,
  /** Upward drift, for steam and aroma. */
  rise: 0.1,
  /** Flow-field strength. */
  turbulence: 1,
  opacity: 0.9,
  /** Additive bloom on the warm particles. */
  glow: 0.35,
};
