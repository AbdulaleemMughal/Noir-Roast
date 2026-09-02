'use client';

import { gsap, ScrollTrigger } from '@/lib/gsap';
import { clamp } from '@/lib/math';
import {
  SCENE_KEYS,
  SCENE_MOODS,
  beanLayout,
  type BeanState,
  type SceneKey,
} from './beanChoreography';
import { particleParams } from '@/components/stage/particleParams';

export interface Viewport {
  width: number;
  height: number;
}

export interface StageRefs {
  /** The transformed element inside each bean — never the parallax wrapper. */
  beans: HTMLElement[];
  /** One section per scene after the hero, in document order. */
  sections: HTMLElement[];
  /** Carries the backdrop CSS custom properties. */
  backdrop: HTMLElement;
  /**
   * The camera layers. Beans are split across two stacking contexts (behind
   * and in front of the type), so the camera move has to drive both as one.
   */
  camera: HTMLElement[];
}

/** Ambient motion budget — scenes retune this so the roast churns harder. */
export const ambient = { amount: 1, spin: 1 };

/**
 * Converts a normalised bean state into GSAP transform values for the
 * current viewport.
 */
export function beanVars(
  beanState: BeanState,
  viewport: Viewport,
  allowBlur: boolean,
): gsap.TweenVars {
  return {
    x: beanState.x * viewport.width * 0.5,
    y: beanState.y * viewport.height * 0.5,
    rotation: beanState.rotate,
    rotationX: beanState.rotateX,
    rotationY: beanState.rotateY,
    scale: beanState.scale,
    opacity: beanState.opacity,
    filter: allowBlur ? `blur(${beanState.blur.toFixed(1)}px)` : 'blur(0px)',
  };
}

/**
 * Wires the scroll system.
 *
 * One timeline for the entire document, not one per section.
 *
 * The obvious approach — a scrubbed ScrollTrigger per scene, each tweening the
 * stage to its own layout — is wrong here, and subtly so. Every one of those
 * timelines writes the same properties on the same targets, and a `to()` tween
 * captures its start value the first time it renders. Seven of them rendering
 * at progress 0 on load each capture and then re-apply a different start, and
 * whichever renders last wins: the hero would come up wearing the roast's
 * colour grade.
 *
 * So the whole film is one timeline instead. Each scene's segment is placed at
 * the normalised scroll position where that section actually crosses the
 * viewport, which keeps the original move / settle rhythm while letting GSAP
 * resolve the property chain the way it is designed to — each tween picking up
 * exactly where the previous one left off.
 */
export function buildScrollScenes(
  { beans, sections, backdrop, camera }: StageRefs,
  viewport: Viewport,
  options: { allowBlur: boolean; reducedMotion: boolean },
): void {
  const count = beans.length;
  const { allowBlur, reducedMotion } = options;

  const total = ScrollTrigger.maxScroll(window) || 1;
  const height = viewport.height;

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: reducedMotion ? true : 1.1,
    },
  });

  // SCENE_KEYS[0] is the hero, which the intro timeline owns.
  SCENE_KEYS.slice(1).forEach((key, sceneIndex) => {
    const section = sections[sceneIndex];
    if (!section) return;

    const scene = key as SceneKey;
    const top = section.getBoundingClientRect().top + window.scrollY;

    // The transition runs while the section travels from near the bottom of
    // the viewport to near the top; the rest of the section holds the scene.
    const from = clamp((top - height * 0.92) / total, 0, 1);
    const to = clamp((top - height * 0.08) / total, 0, 1);
    const span = Math.max(to - from, 0.004);

    beans.forEach((bean, i) => {
      const target = beanLayout(scene, i, count);

      // Staggered starts and slightly different durations keep the cluster
      // from moving as one rigid object.
      timeline.to(
        bean,
        {
          ...beanVars(target, viewport, allowBlur),
          duration: span * 0.82,
          ease: 'power1.inOut',
        },
        from + span * 0.02 * (i % 6),
      );
    });

    const mood = SCENE_MOODS[scene];

    timeline.to(
      backdrop,
      {
        '--core': mood.core,
        '--mid': mood.mid,
        '--edge': mood.edge,
        '--bloom': mood.bloom,
        duration: span,
        ease: 'none',
      },
      from,
    );

    timeline.to(
      particleParams,
      {
        warmth: mood.warmth,
        density: mood.density,
        rise: mood.rise,
        turbulence: mood.turbulence,
        opacity: mood.particleOpacity,
        glow: mood.glow,
        duration: span,
        ease: 'none',
      },
      from,
    );

    // The roast is the one scene where the beans really churn.
    timeline.to(
      ambient,
      {
        amount: scene === 'roast' ? 2.6 : scene === 'aroma' ? 1.8 : 1,
        spin: scene === 'roast' ? 3.2 : scene === 'final' ? 0.4 : 1,
        duration: span,
        ease: 'none',
      },
      from,
    );
  });

  // Pin the timeline's length to the full scroll range so progress maps 1:1
  // onto the positions calculated above.
  timeline.to({}, { duration: 0.001 }, 1);

  if (reducedMotion) return;

  // A slow, continuous camera push across the whole document. Small enough to
  // read as drift rather than zoom, but it keeps the frame alive everywhere.
  gsap.fromTo(
    camera,
    { scale: 1, y: 0 },
    {
      scale: 1.1,
      y: -18,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.4,
      },
    },
  );
}

/**
 * Reveals a section's content as it enters. Deliberately restrained: the beans
 * carry the motion, so type only needs to arrive cleanly.
 */
export function revealOnEnter(
  element: HTMLElement,
  play: () => void,
  start = 'top 72%',
): ScrollTrigger {
  return ScrollTrigger.create({
    trigger: element,
    start,
    once: true,
    onEnter: play,
  });
}
