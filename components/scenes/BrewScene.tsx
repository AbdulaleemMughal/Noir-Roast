'use client';

import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import RevealText from '@/components/ui/RevealText';
import CoffeeCup from './CoffeeCup';

const CHAIN = ['Beans', 'Roast', 'Grind', 'Brew', 'Coffee'];

/**
 * Scene 05 — The Perfect Cup.
 *
 * The stage funnels every bean down to this point and dissolves them at the
 * rim; the cup fills on exactly the same scroll range. The five-step chain
 * underneath advances with it, so the whole transformation is one move rather
 * than five stacked sections.
 */
export default function BrewScene() {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });

      // The cup arrives, then fills as the beans come apart above it.
      timeline
        .fromTo(
          '[data-cup]',
          { yPercent: 24, opacity: 0, scale: 0.94 },
          { yPercent: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' },
          0,
        )
        .fromTo(
          '[data-liquid]',
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.4, ease: 'power2.inOut' },
          1.1,
        )
        .fromTo(
          '[data-swirl]',
          { rotate: -22, transformOrigin: '210px 152px' },
          { rotate: 16, duration: 2.2, ease: 'none' },
          1.2,
        )
        .fromTo(
          '[data-steam]',
          { opacity: 0 },
          { opacity: 0.85, duration: 1, ease: 'power1.out' },
          2.2,
        );

      // Each step of the chain lights as the scroll reaches it.
      const steps = gsap.utils.toArray<HTMLElement>('[data-chain-step]');
      steps.forEach((step, index) => {
        timeline.to(
          step,
          { opacity: 1, color: '#f5ede0', duration: 0.4, ease: 'none' },
          0.35 + index * 0.62,
        );
        timeline.to(
          step.querySelector('[data-chain-bar]'),
          { scaleX: 1, duration: 0.5, ease: 'none' },
          0.35 + index * 0.62,
        );
      });

      // Steam drifts continuously — it is the one thing here not tied to scroll.
      gsap.to('[data-steam-path]', {
        y: -10,
        opacity: 0.35,
        duration: 3.4,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: 0.5,
      });
    }, ref);

    return () => context.revert();
  }, []);

  return (
    <section
      ref={ref}
      data-scene
      id="brew"
      className="scene min-h-[235vh] items-start"
    >
      <div className="sticky top-0 flex h-[100svh] w-full items-center">
        <div className="mx-auto w-full max-w-[92rem]">
          <div className="text-center">
            <p className="eyebrow mb-7">05 — The Cup</p>
            <RevealText as="h2" className="display display-md text-cream">
              Everything above
            </RevealText>
            <RevealText
              as="p"
              delay={0.1}
              className="display display-md text-gold"
            >
              Ends here.
            </RevealText>
          </div>

          {/* Sized by height as well as width: the cup shares a full-height
              sticky frame with the headline and the process chain. */}
          <div
            data-cup
            className="relative mt-[clamp(1rem,3vh,2.5rem)] flex justify-center"
          >
            <CoffeeCup className="h-[min(42vh,22rem)] w-auto max-w-[78vw]" />
          </div>

          {/* Beans → Coffee, as one line rather than five sections. */}
          <ol className="mx-auto mt-[clamp(1.5rem,5vh,3.5rem)] flex w-full max-w-[54rem] items-start justify-between gap-2">
            {CHAIN.map((step, index) => (
              <li
                key={step}
                data-chain-step
                className="flex-1 text-center opacity-30"
                style={{ color: 'rgba(232,217,194,0.55)' }}
              >
                <span className="block h-px w-full origin-left scale-x-0 bg-gold" data-chain-bar />
                <span className="mt-3 block text-[0.6rem] uppercase tracking-[0.24em] sm:text-[0.68rem]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="display mt-1 block text-[clamp(0.8rem,1.6vw,1.35rem)] tracking-[-0.02em]">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
