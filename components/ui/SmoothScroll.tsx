'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/env';

let instance: Lenis | null = null;

/** Smooth-scrolls to a target. Used by the nav so anchors keep the easing. */
export const scrollTo = (target: string | HTMLElement) => {
  if (instance) {
    instance.scrollTo(target, { offset: 0, duration: 1.6 });
    return;
  }
  const element =
    typeof target === 'string' ? document.querySelector(target) : target;
  element?.scrollIntoView({ behavior: 'smooth' });
};

/**
 * Lenis, driven by the GSAP ticker.
 *
 * Running one clock rather than two is what keeps scrubbed ScrollTriggers
 * locked to the smoothed scroll position — with separate rAF loops the beans
 * visibly lag the page by a frame.
 */
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.35,
      // Long exponential tail — the slow, weighty settle the piece needs.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.7,
      wheelMultiplier: 0.92,
    });

    instance = lenis;
    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    // GSAP's lag smoothing would desynchronise Lenis after a stutter.
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      instance = null;
    };
  }, []);

  return <>{children}</>;
}
