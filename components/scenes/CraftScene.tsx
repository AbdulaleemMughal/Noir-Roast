'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';

const STEPS = [
  { word: 'Selected.', note: 'Density-sorted, then twice by hand. Eleven percent never makes it.' },
  { word: 'Roasted.', note: 'Twelve minutes. One crack. The curve is the recipe.' },
  { word: 'Crafted.', note: 'Rested four days, ground to order, sealed the same hour.' },
];

/**
 * Scene 02 — The Bean.
 *
 * The beans split into two gutters and these three words step through the gap
 * they leave. The sequence is scrubbed rather than triggered: each word tracks
 * scroll position directly, so it advances exactly with the beans pulling
 * apart and reverses cleanly on the way back up.
 */
export default function CraftScene() {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const context = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>('[data-step]');

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.9,
        },
      });

      rows.forEach((row, index) => {
        const word = row.querySelector('[data-word]');
        const note = row.querySelector('[data-note]');
        const bar = row.querySelector('[data-bar]');

        timeline
          .fromTo(
            word,
            { yPercent: 105, opacity: 0, filter: 'blur(12px)' },
            {
              yPercent: 0,
              opacity: 1,
              filter: 'blur(0px)',
              duration: 1,
              ease: 'power3.out',
            },
            index * 1.15,
          )
          .fromTo(
            bar,
            { scaleX: 0 },
            { scaleX: 1, duration: 0.9, ease: 'power2.inOut' },
            index * 1.15 + 0.15,
          )
          .fromTo(
            note,
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
            index * 1.15 + 0.3,
          );
      });
    }, ref);

    return () => {
      context.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <section
      ref={ref}
      data-scene
      id="craft"
      className="scene min-h-[210vh] items-start"
    >
      <div className="sticky top-0 flex h-[100svh] w-full items-center">
        <div className="mx-auto w-full max-w-[52rem]">
          <p className="eyebrow mb-[clamp(2rem,5vh,4rem)] text-center">
            02 — The Bean
          </p>

          <div className="flex flex-col gap-[clamp(1.5rem,4vh,3rem)]">
            {STEPS.map((step) => (
              <div key={step.word} data-step className="text-center">
                <div className="overflow-hidden pb-[0.12em]">
                  <p
                    data-word
                    className="display display-lg text-cream"
                  >
                    {step.word}
                  </p>
                </div>

                <span
                  data-bar
                  className="mx-auto mt-5 block h-px w-[min(36vw,18rem)] origin-center bg-[linear-gradient(90deg,transparent,rgba(226,168,87,0.7),transparent)]"
                />

                <p
                  data-note
                  className="body-copy mx-auto mt-4 max-w-[42ch]"
                  style={{ fontSize: '0.86rem' }}
                >
                  {step.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
