'use client';

import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import RevealText from '@/components/ui/RevealText';
import MagneticButton from '@/components/ui/MagneticButton';

/**
 * Scene 07 — The Return.
 *
 * The beans come back to the centre of a frame that has gone almost black
 * again, closing the loop the splash opened. Everything here is deliberately
 * still; the stage behind it is doing the last of the work.
 */
export default function FinalScene() {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const context = gsap.context(() => {
      // The frame closes down to the logo.
      gsap.fromTo(
        '[data-mark]',
        { opacity: 0, scale: 0.86, filter: 'blur(14px)' },
        {
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.6,
          ease: 'expo.out',
          scrollTrigger: { trigger: '[data-mark]', start: 'top 82%', once: true },
        },
      );

      gsap.fromTo(
        '[data-final-cta]',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'expo.out',
          stagger: 0.12,
          scrollTrigger: { trigger: '[data-final-cta]', start: 'top 88%', once: true },
        },
      );
    }, ref);

    return () => context.revert();
  }, []);

  return (
    <section
      ref={ref}
      data-scene
      id="final"
      className="scene min-h-[200vh] items-start"
    >
      <div className="sticky top-0 flex h-[100svh] w-full items-center">
        <div className="mx-auto w-full max-w-[92rem] text-center">
          <p className="eyebrow mb-[clamp(2rem,5vh,3.5rem)]">07 — The Moment</p>

          <RevealText as="h2" variant="chars" className="display display-lg text-cream">
            One bean.
          </RevealText>
          <RevealText
            as="p"
            variant="chars"
            delay={0.16}
            className="display display-lg text-cream/60"
          >
            One journey.
          </RevealText>
          <RevealText
            as="p"
            variant="chars"
            delay={0.32}
            className="display display-lg text-gold"
          >
            One perfect cup.
          </RevealText>

          <div className="rule mx-auto my-[clamp(2.5rem,6vh,4.5rem)] max-w-[22rem]" />

          <div data-mark className="mb-[clamp(2rem,5vh,3.5rem)]">
            <p className="display text-[clamp(1.1rem,2vw,1.5rem)] tracking-[0.34em] text-cream">
              NOIR ROAST
            </p>
            <p className="eyebrow mt-3" style={{ letterSpacing: '0.34em' }}>
              Roasted in small batches since 2014
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <span data-final-cta className="inline-block">
              <MagneticButton href="#shop" cursor="shop">
                Shop coffee
              </MagneticButton>
            </span>
            <span data-final-cta className="inline-block">
              <MagneticButton href="#roast" variant="ghost" cursor="view">
                Discover the roast
              </MagneticButton>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
