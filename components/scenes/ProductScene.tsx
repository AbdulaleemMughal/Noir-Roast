'use client';

import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import RevealText from '@/components/ui/RevealText';
import MagneticButton from '@/components/ui/MagneticButton';
import CoffeeBag from './CoffeeBag';

const SPECS = [
  ['Roast', 'Medium — dropped at 211°C'],
  ['Notes', 'Jasmine, apricot, muscovado'],
  ['Grind', 'Whole bean, or to order'],
  ['Weight', '250 g'],
];

/**
 * Scene 06 — The Product.
 *
 * A campaign still, not a product card: the pack turns slowly on the scroll
 * axis while the type frames it. Scrubbed rotation on a perspective wrapper
 * gives the parallax a photograph cannot.
 */
export default function ProductScene() {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      });

      // A slow turn through the section — enough to read as a real object.
      timeline
        .fromTo(
          '[data-bag]',
          { rotationY: -26, rotationZ: -3, y: 60 },
          { rotationY: 22, rotationZ: 2, y: -60, ease: 'none' },
          0,
        )
        .fromTo(
          '[data-bag-glow]',
          { opacity: 0.15, scale: 0.85 },
          { opacity: 0.5, scale: 1.15, ease: 'none' },
          0,
        );
    }, ref);

    return () => context.revert();
  }, []);

  return (
    <section
      ref={ref}
      data-scene
      id="product"
      className="scene min-h-[215vh] items-start"
    >
      <div className="sticky top-0 flex h-[100svh] w-full items-center">
        <div className="mx-auto grid w-full max-w-[92rem] items-center gap-[clamp(2rem,4vw,4rem)] lg:grid-cols-[1fr_auto_1fr]">
          {/* Left column of the headline. */}
          <div className="order-2 lg:order-1 lg:text-right">
            <p className="eyebrow mb-6">06 — The Coffee</p>
            <RevealText as="h2" className="display display-md text-cream">
              Roasted
            </RevealText>
            <RevealText as="p" delay={0.1} className="display display-md text-cream/60">
              For
            </RevealText>
            <RevealText as="p" delay={0.2} className="display display-md text-gold">
              The moment.
            </RevealText>
          </div>

          {/* The pack. */}
          <div
            className="relative order-1 mx-auto w-[min(58vw,20rem)] lg:order-2"
            style={{ perspective: '1200px' }}
          >
            <div
              data-bag-glow
              aria-hidden
              className="absolute inset-[-22%] rounded-full"
              style={{
                background:
                  'radial-gradient(50% 50% at 50% 50%, rgba(226,168,87,0.28), transparent 70%)',
                filter: 'blur(28px)',
              }}
            />
            <div data-bag className="relative will-change-transform">
              <CoffeeBag className="w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]" />
            </div>
          </div>

          {/* Specification column. */}
          <div className="order-3">
            <dl className="flex flex-col gap-5">
              {SPECS.map(([term, value]) => (
                <div key={term} className="border-t border-[rgba(232,217,194,0.1)] pt-4">
                  <dt className="eyebrow mb-1.5">{term}</dt>
                  <dd className="body-copy" style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-9 flex flex-wrap items-center gap-5">
              <p className="display text-[clamp(1.6rem,3vw,2.4rem)] tracking-[-0.03em] text-cream">
                £19
              </p>
              <MagneticButton href="#shop" cursor="add">
                Add to bag
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
