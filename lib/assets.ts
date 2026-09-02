/**
 * The bean cut-outs the whole experience is built from.
 *
 * These paths are the contract between the artwork and the animation system.
 * `npm run assets` writes your own photos to exactly these filenames, so
 * swapping the supplied stand-ins for real photography needs no code change.
 */
export const BEAN_SOURCES = [
  '/beans/bean-01.png',
  '/beans/bean-02.png',
  '/beans/bean-03.png',
  '/beans/bean-04.png',
  '/beans/bean-05.png',
  '/beans/bean-06.png',
  '/beans/bean-07.png',
  '/beans/bean-08.png',
  '/beans/bean-09.png',
  '/beans/bean-10.png',
  '/beans/bean-11.png',
  '/beans/bean-12.png',
] as const;

export const GRAIN_TEXTURE = '/textures/grain.png';
