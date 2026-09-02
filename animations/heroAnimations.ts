'use client';

import { gsap } from '@/lib/gsap';
import { beanLayout, beanOrigin } from './beanChoreography';
import { beanVars, type Viewport } from './scrollAnimations';

export interface IntroRefs {
  camera: HTMLElement[];
  beans: HTMLElement[];
  /** Indices that fly past the lens on the way out. */
  foreground: Set<number>;
  startSplash: () => void;
}

interface IntroOptions {
  allowBlur: boolean;
  reducedMotion: boolean;
}

/** Fired once the impact has landed, so the hero type can take over. */
export const HERO_REVEAL_EVENT = 'noir:hero-reveal';

let revealed = false;

/** Announces the impact. Safe to call more than once. */
export function markHeroRevealed() {
  if (revealed) return;
  revealed = true;
  window.dispatchEvent(new CustomEvent(HERO_REVEAL_EVENT));
}

/**
 * Subscribes to the impact, without a race.
 *
 * A plain event listener only works if every subscriber mounts before the
 * splash lands — a timing assumption that quietly breaks the moment a
 * component's effects run in a different order. Late subscribers fire
 * immediately instead.
 */
export function onHeroReveal(callback: () => void): () => void {
  if (revealed) {
    callback();
    return () => {};
  }
  const handler = () => callback();
  window.addEventListener(HERO_REVEAL_EVENT, handler, { once: true });
  return () => window.removeEventListener(HERO_REVEAL_EVENT, handler);
}

/**
 * The opening.
 *
 * Dark frame, a gathering glow, the splash, then the beans thrown out of it.
 * Nothing here is a fade-in: every bean travels from a single point at the
 * centre of the lens out to its place in the hero composition, and a third of
 * them overshoot straight past the camera first.
 */
export function buildIntro(
  { camera, beans, foreground, startSplash }: IntroRefs,
  viewport: Viewport,
  { allowBlur, reducedMotion }: IntroOptions,
): gsap.core.Timeline {
  const count = beans.length;

  // Everything starts collapsed into the centre of the frame.
  beans.forEach((bean, i) => {
    gsap.set(bean, beanVars(beanOrigin(i), viewport, allowBlur));
  });

  const timeline = gsap.timeline();

  if (reducedMotion) {
    beans.forEach((bean, i) => {
      timeline.to(
        bean,
        { ...beanVars(beanLayout('hero', i, count), viewport, allowBlur), duration: 0.8, ease: 'power2.out' },
        i * 0.02,
      );
    });
    timeline.call(markHeroRevealed, undefined, 0.3);
    return timeline;
  }

  timeline.call(startSplash, undefined, 0);

  // Camera pulls back off the impact for the whole opening.
  timeline.fromTo(
    camera,
    { scale: 1.42, rotate: -1.2 },
    { scale: 1, rotate: 0, duration: 3.4, ease: 'expo.out' },
    0,
  );

  const IMPACT = 1.05;

  beans.forEach((bean, i) => {
    const target = beanLayout('hero', i, count);
    const at = IMPACT - 0.12 + (i % 6) * 0.045;

    if (foreground.has(i)) {
      // A hard pass by the lens: the bean is thrown well beyond its final
      // position, blowing out of focus, then falls back into the frame.
      timeline.to(
        bean,
        {
          x: target.x * viewport.width * 0.5 * 1.9,
          y: target.y * viewport.height * 0.5 * 1.9,
          rotation: target.rotate + 140,
          rotationY: target.rotateY + 90,
          scale: target.scale * 2.5,
          opacity: 0.55,
          filter: allowBlur ? 'blur(26px)' : 'blur(0px)',
          duration: 0.62,
          ease: 'power2.in',
        },
        at,
      );

      timeline.to(
        bean,
        {
          ...beanVars(target, viewport, allowBlur),
          duration: 1.5,
          ease: 'power3.out',
        },
        at + 0.62,
      );
    } else {
      timeline.to(
        bean,
        {
          ...beanVars(target, viewport, allowBlur),
          duration: 1.85,
          ease: 'expo.out',
        },
        at,
      );
    }
  });

  // Camera shake on the impact frame — short, uneven, and gone quickly.
  timeline.to(
    camera,
    {
      keyframes: [
        { x: -18, y: 11, duration: 0.055 },
        { x: 15, y: -13, duration: 0.05 },
        { x: -9, y: 6, duration: 0.045 },
        { x: 5, y: -4, duration: 0.04 },
        { x: 0, y: 0, duration: 0.09 },
      ],
      ease: 'none',
    },
    IMPACT,
  );

  timeline.call(markHeroRevealed, undefined, IMPACT + 0.55);

  return timeline;
}
