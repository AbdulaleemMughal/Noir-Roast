'use client';

import { gsap } from '@/lib/gsap';

/** Shared pointer state, in normalised -1..1 viewport coordinates. */
export const pointer = { x: 0, y: 0, strength: 1 };

/**
 * Layered pointer parallax.
 *
 * Each element gets its own displacement budget, so foreground beans swing
 * further than the ones sitting deep in the frame — the cheapest, most
 * convincing way to give a flat composition real depth.
 *
 * Uses `quickTo` rather than a tween per move: one interpolator per axis per
 * element, reused for the life of the page.
 */
export function attachPointerParallax(
  elements: HTMLElement[],
  strengths: number[],
): () => void {
  const xTo = elements.map((el, i) =>
    gsap.quickTo(el, 'x', {
      duration: 1.1 + (i % 5) * 0.12,
      ease: 'power3.out',
    }),
  );
  const yTo = elements.map((el, i) =>
    gsap.quickTo(el, 'y', {
      duration: 1.1 + (i % 5) * 0.12,
      ease: 'power3.out',
    }),
  );

  let frame = 0;

  const update = () => {
    frame = 0;
    for (let i = 0; i < elements.length; i++) {
      const budget = strengths[i] * pointer.strength;
      xTo[i](pointer.x * budget);
      yTo[i](pointer.y * budget * 0.62);
    }
  };

  const onMove = (event: PointerEvent) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    // Coalesce bursts of pointer events into one write per frame.
    if (!frame) frame = requestAnimationFrame(update);
  };

  window.addEventListener('pointermove', onMove, { passive: true });

  return () => {
    window.removeEventListener('pointermove', onMove);
    if (frame) cancelAnimationFrame(frame);
  };
}

/**
 * Magnetic hover: the element leans toward the cursor while it is inside a
 * padded hit area, then springs back.
 */
export function attachMagnet(element: HTMLElement, strength = 0.34): () => void {
  const xTo = gsap.quickTo(element, 'x', { duration: 0.6, ease: 'power3.out' });
  const yTo = gsap.quickTo(element, 'y', { duration: 0.6, ease: 'power3.out' });

  const onMove = (event: PointerEvent) => {
    const rect = element.getBoundingClientRect();
    xTo((event.clientX - (rect.left + rect.width / 2)) * strength);
    yTo((event.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const onLeave = () => {
    xTo(0);
    yTo(0);
  };

  element.addEventListener('pointermove', onMove);
  element.addEventListener('pointerleave', onLeave);

  return () => {
    element.removeEventListener('pointermove', onMove);
    element.removeEventListener('pointerleave', onLeave);
  };
}
