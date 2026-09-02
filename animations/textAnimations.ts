'use client';

import { gsap } from '@/lib/gsap';
import { splitText, type SplitResult } from '@/lib/splitText';

export type RevealVariant =
  | 'mask'      // lines rise out of a clip mask
  | 'chars'     // characters rise and sharpen, staggered
  | 'blur'      // words resolve from out-of-focus
  | 'displace'; // lines slide in horizontally from alternating sides

interface RevealOptions {
  variant?: RevealVariant;
  duration?: number;
  stagger?: number;
  delay?: number;
  ease?: string;
}

/**
 * Builds a paused reveal timeline for a block of text and hands back the
 * split so the caller can revert it on unmount or resize.
 */
export function buildTextReveal(
  element: HTMLElement,
  source: string,
  {
    variant = 'mask',
    duration = 1.1,
    stagger = 0.08,
    delay = 0,
    ease = 'expo.out',
  }: RevealOptions = {},
): { timeline: gsap.core.Timeline; split: SplitResult } {
  // Always split from the pristine string. Splitting wraps each line in a
  // block element, so re-reading `textContent` from an already-split node
  // loses the spaces between lines — and in development React runs effects
  // twice, which would do exactly that.
  element.textContent = source;

  const needsChars = variant === 'chars';
  const split = splitText(element, {
    type: needsChars ? 'lines,words,chars' : 'lines,words',
    mask: variant === 'mask' || variant === 'displace',
  });

  const timeline = gsap.timeline({ paused: true, delay });

  switch (variant) {
    case 'mask':
      timeline.fromTo(
        split.lines,
        { yPercent: 118, rotate: 2.5 },
        { yPercent: 0, rotate: 0, duration, ease, stagger },
      );
      break;

    case 'chars':
      timeline.fromTo(
        split.chars,
        { yPercent: 90, opacity: 0, filter: 'blur(14px)' },
        {
          yPercent: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: duration * 0.85,
          ease,
          stagger: { each: stagger * 0.22, from: 'start' },
        },
      );
      break;

    case 'blur':
      timeline.fromTo(
        split.words,
        { opacity: 0, filter: 'blur(20px)', scale: 1.06 },
        {
          opacity: 1,
          filter: 'blur(0px)',
          scale: 1,
          duration,
          ease: 'power2.out',
          stagger,
        },
      );
      break;

    case 'displace':
      timeline.fromTo(
        split.lines,
        { xPercent: (i: number) => (i % 2 === 0 ? -14 : 14), yPercent: 105, opacity: 0 },
        {
          xPercent: 0,
          yPercent: 0,
          opacity: 1,
          duration,
          ease,
          stagger,
        },
      );
      break;
  }

  return { timeline, split };
}
