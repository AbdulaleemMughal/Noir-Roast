'use client';

import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import { onHeroReveal } from '@/animations/heroAnimations';
import RevealText from '@/components/ui/RevealText';

/**
 * The hero.
 *
 * Holds no visuals of its own — the beans and the splash belong to the stage
 * behind it. All this section contributes is type, and it waits for the
 * impact before saying anything.
 */
export default function Hero() {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    let reveal: gsap.core.Timeline | null = null;

    const context = gsap.context(() => {
      // Built paused so the frame furniture cannot arrive before the impact.
      reveal = gsap.timeline({ paused: true }).to('[data-hero-meta]', {
        opacity: 1,
        y: 0,
        duration: 1.4,
        ease: 'expo.out',
        stagger: 0.12,
        delay: 0.75,
      });
    }, ref);

    const unsubscribe = onHeroReveal(() => reveal?.play());

    return () => {
      unsubscribe();
      context.revert();
    };
  }, []);

  return (
    <section
      ref={ref}
      id="top"
      className="scene relative h-[100svh] flex-col justify-center"
    >
      <div className="relative z-30 mx-auto w-full max-w-[92rem] text-center">
        <p
          data-hero-meta
          className="eyebrow mb-[clamp(1.5rem,4vh,3rem)] translate-y-6 opacity-0"
        >
          Single origin &nbsp;·&nbsp; Huila, Colombia &nbsp;·&nbsp; 1,860 m
        </p>

        <RevealText
          as="h1"
          variant="mask"
          awaitHero
          className="display display-xl text-cream"
        >
          From Bugs
        </RevealText>

        <RevealText
          as="p"
          variant="mask"
          delay={0.14}
          awaitHero
          className="display display-xl text-gold"
        >
          To Brews.
        </RevealText>
      </div>

      {/* Frame furniture — the details that make it read as a campaign. */}
      <div className="pointer-events-none absolute inset-x-[clamp(1.25rem,5vw,5.5rem)] bottom-[clamp(1.5rem,4vh,3rem)] z-30 flex items-end justify-between">
        <p
          data-hero-meta
          className="body-copy max-w-[22ch] translate-y-6 text-left opacity-0"
          style={{ fontSize: '0.82rem' }}
        >
          From late-night commits to early-morning deploys. Every build starts with a better brew.
        </p>

        <div
          data-hero-meta
          className="flex translate-y-6 flex-col items-center gap-3 opacity-0"
        >
          <span className="eyebrow" style={{ letterSpacing: '0.3em' }}>
            Scroll
          </span>
          {/* A drop travelling down the line, on a loop. */}
          <span className="relative block h-16 w-px overflow-hidden bg-[rgba(232,217,194,0.16)]">
            <span className="absolute inset-x-0 top-0 h-5 scroll-drop bg-gold" />
          </span>
        </div>
      </div>
    </section>
  );
}
