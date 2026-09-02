'use client';

import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';

const LINES = ['You can’t', 'See aroma.', 'But you can', 'Feel it.'];

/**
 * Scene 04 — Aroma.
 *
 * The one section with nothing to show. Light rays, drifting steam, and four
 * lines that surface and dissolve as you pass through them — each tied to its
 * own slice of the scroll so the section breathes instead of holding a static
 * headline.
 */
export default function AromaScene() {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const context = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>('[data-aroma-line]');

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });

      lines.forEach((line, index) => {
        // Rise in, hold, drift out — overlapping, so two lines are briefly
        // visible together and the section never goes empty.
        timeline
          .fromTo(
            line,
            { opacity: 0, y: 70, filter: 'blur(18px)' },
            { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power2.out' },
            index * 0.85,
          )
          .to(
            line,
            { opacity: 0, y: -70, filter: 'blur(18px)', duration: 1, ease: 'power2.in' },
            index * 0.85 + 1.5,
          );
      });

      // Light rays sweep slowly across the whole section.
      gsap.to('[data-rays]', {
        rotate: 9,
        xPercent: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.6,
        },
      });
    }, ref);

    return () => context.revert();
  }, []);

  return (
    <section
      ref={ref}
      data-scene
      id="aroma"
      className="scene min-h-[230vh] items-start"
    >
      {/* Shafts of light through the roastery. */}
      <div
        data-rays
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[16] origin-top opacity-[0.32]"
        style={{
          background:
            'repeating-linear-gradient(102deg, transparent 0px, transparent 62px, rgba(255,196,132,0.055) 62px, rgba(255,196,132,0.055) 96px)',
          maskImage:
            'radial-gradient(58% 74% at 50% 18%, black 0%, transparent 78%)',
          WebkitMaskImage:
            'radial-gradient(58% 74% at 50% 18%, black 0%, transparent 78%)',
          filter: 'blur(2px)',
        }}
      />

      <div className="sticky top-0 flex h-[100svh] w-full items-center justify-center">
        <div className="relative mx-auto w-full max-w-[68rem] text-center">
          <p className="eyebrow absolute -top-[clamp(3rem,8vh,6rem)] left-1/2 -translate-x-1/2">
            04 — Aroma
          </p>

          {/* All four lines occupy the same space; only the scroll decides
              which one is present. */}
          <div className="relative flex h-[clamp(9rem,26vh,18rem)] items-center justify-center">
            {LINES.map((line, index) => (
              <p
                key={line}
                data-aroma-line
                className={[
                  'display display-lg absolute inset-x-0 opacity-0',
                  index % 2 === 0 ? 'text-cream' : 'text-gold',
                ].join(' ')}
              >
                {line}
              </p>
            ))}
          </div>

          <p className="body-copy mx-auto mt-[clamp(2rem,6vh,4rem)] max-w-[40ch]">
            Jasmine first, then stone fruit, then something like brown sugar
            once it cools. Sixteen compounds, none of which survive a second
            reheat.
          </p>
        </div>
      </div>
    </section>
  );
}
