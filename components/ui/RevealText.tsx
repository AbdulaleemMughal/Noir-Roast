'use client';

import { createElement, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import { buildTextReveal, type RevealVariant } from '@/animations/textAnimations';
import type { SplitResult } from '@/lib/splitText';
import { onHeroReveal } from '@/animations/heroAnimations';

interface RevealTextProps {
  children: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  variant?: RevealVariant;
  className?: string;
  delay?: number;
  stagger?: number;
  /** Scroll position that fires the reveal. */
  start?: string;
  /** Wait for the hero impact instead of a scroll position. */
  awaitHero?: boolean;
}

/**
 * Text that arrives rather than appears.
 *
 * Splitting is deferred until webfonts have settled: measuring line breaks
 * against a fallback face produces the wrong groups and the reveal breaks
 * apart mid-word on first paint.
 */
export default function RevealText({
  children,
  as = 'p',
  variant = 'mask',
  className = '',
  delay = 0,
  stagger = 0.08,
  start = 'top 78%',
  awaitHero = false,
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);
  const splitRef = useRef<SplitResult | null>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    let context: gsap.Context | null = null;
    let played = false;
    let cancelled = false;
    let trigger: ScrollTrigger | null = null;
    let cleanupEvent: (() => void) | null = null;

    const setup = () => {
      if (cancelled) return;

      context = gsap.context(() => {
        const built = buildTextReveal(element, children, { variant, delay, stagger });
        splitRef.current = built.split;
        const { timeline } = built;
        gsap.set(element, { opacity: 1 });

        const play = () => {
          played = true;
          timeline.play();
        };

        if (awaitHero) {
          cleanupEvent = onHeroReveal(play);
        } else {
          trigger = ScrollTrigger.create({
            trigger: element,
            start,
            once: true,
            onEnter: play,
          });

          // `onEnter` only fires on a crossing. Jumping straight here — a nav
          // link, a deep link, a reload part-way down the page — would leave
          // the text sitting at opacity 0 forever, so anything already past
          // its start point is revealed immediately.
          if (element.getBoundingClientRect().top < window.innerHeight * 0.85) {
            play();
          }
        }

        // A resize re-splits: line grouping is measured, so it must be redone.
        // Anything already revealed is snapped straight back to its end state.
        if (played) timeline.progress(1);
      }, element);
    };

    // `document.fonts.ready` resolves immediately when fonts are already cached.
    const fonts = document.fonts?.ready ?? Promise.resolve();
    fonts.then(setup);

    let lastWidth = window.innerWidth;
    let debounce = 0;

    const onResize = () => {
      if (Math.abs(window.innerWidth - lastWidth) < 60) return;
      lastWidth = window.innerWidth;
      window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        trigger?.kill();
        trigger = null;
        cleanupEvent?.();
        cleanupEvent = null;
        context?.revert();
        splitRef.current?.revert();
        splitRef.current = null;
        setup();
      }, 240);
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      window.clearTimeout(debounce);
      window.removeEventListener('resize', onResize);
      trigger?.kill();
      cleanupEvent?.();
      context?.revert();
      splitRef.current?.revert();
      splitRef.current = null;
    };
  }, [children, variant, delay, stagger, start, awaitHero]);

  return createElement(
    as,
    {
      ref,
      className,
      // Hidden until the split exists, so no unsplit flash on first paint.
      style: { opacity: 0 },
    },
    children,
  );
}
