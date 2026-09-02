export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0);

/**
 * Coarse device tier. Drives particle counts and blur budgets so the same
 * story runs on a phone without dropping frames.
 */
export const deviceTier = (): 'low' | 'mid' | 'high' => {
  if (typeof window === 'undefined') return 'high';
  const cores = navigator.hardwareConcurrency ?? 4;
  const narrow = window.innerWidth < 768;
  if (narrow || cores <= 4) return 'low';
  if (cores <= 8) return 'mid';
  return 'high';
};
