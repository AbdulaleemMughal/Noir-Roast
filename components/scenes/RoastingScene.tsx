'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import { deviceTier } from '@/lib/env';
import RevealText from '@/components/ui/RevealText';

const MARKERS = [
  { at: '00:00', label: 'Charge', value: '205°C' },
  { at: '01:40', label: 'Turn', value: '92°C' },
  { at: '09:12', label: 'First crack', value: '196°C' },
  { at: '12:00', label: 'Drop', value: '211°C' },
];

/**
 * Scene 03 — Roasting.
 *
 * The frame turns to ember. A real roast profile draws itself across the
 * section as you scroll, which is the detail that makes the claim about heat
 * feel like a craft rather than a slogan.
 */
export default function RoastingScene() {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const context = gsap.context(() => {
      const path = ref.current?.querySelector<SVGPathElement>('[data-curve]');

      if (path) {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

        gsap.to(path, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 60%',
            end: 'bottom 85%',
            scrub: 1,
          },
        });
      }

      // Markers light up in step with the curve reaching them.
      gsap.fromTo(
        '[data-marker]',
        { opacity: 0.18 },
        {
          opacity: 1,
          stagger: 0.9,
          ease: 'none',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 55%',
            end: 'bottom 85%',
            scrub: 1,
          },
        },
      );
    }, ref);

    return () => context.revert();
  }, []);

  // The shimmer is a real displacement filter, so it is skipped on low-end
  // devices where a full-width filtered layer would cost frames. The check has
  // to happen after mount: the server has no device to measure, and rendering
  // a different tree there would break hydration.
  const [shimmer, setShimmer] = useState(false);

  useEffect(() => setShimmer(deviceTier() !== 'low'), []);

  return (
    <section
      ref={ref}
      data-scene
      id="roast"
      className="scene min-h-[205vh] items-start"
    >
      {shimmer && (
        <>
          <svg aria-hidden className="pointer-events-none absolute h-0 w-0">
            <filter id="heat-haze">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.012 0.05"
                numOctaves="2"
                seed="7"
                result="noise"
              >
                <animate
                  attributeName="baseFrequency"
                  dur="9s"
                  values="0.012 0.05; 0.02 0.028; 0.012 0.05"
                  repeatCount="indefinite"
                />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="26" />
            </filter>
          </svg>

          {/* Heat rising off the bottom of the frame. */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[16] h-[42vh]"
            style={{
              filter: 'url(#heat-haze)',
              background:
                'linear-gradient(0deg, rgba(255,140,52,0.16) 0%, rgba(255,120,40,0.05) 42%, transparent 100%)',
            }}
          />
        </>
      )}

      <div className="sticky top-0 flex h-[100svh] w-full items-center">
        <div className="mx-auto grid w-full max-w-[92rem] gap-[clamp(2rem,5vh,4rem)] lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="eyebrow mb-8">03 — The Roast</p>

            <RevealText as="h2" className="display display-lg text-cream">
              Heat
            </RevealText>
            <RevealText as="p" delay={0.1} className="display display-lg text-amber">
              Creates
            </RevealText>
            <RevealText as="p" delay={0.2} className="display display-lg text-cream">
              Character.
            </RevealText>

            <RevealText
              variant="blur"
              className="body-copy mt-9 max-w-[40ch]"
            >
              Sugars caramelise, acids fold, and the bean gives up a quarter of
              its weight in water. Two degrees either side of the drop is a
              different coffee entirely.
            </RevealText>
          </div>

          {/* The profile. */}
          <figure className="relative">
            <svg
              viewBox="0 0 520 300"
              className="w-full"
              role="img"
              aria-label="Roast profile: charge at 205 degrees, turning point at 1:40, first crack at 9:12, drop at 12:00."
            >
              <defs>
                <linearGradient id="curve-stroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7a3410" />
                  <stop offset="55%" stopColor="#c8752b" />
                  <stop offset="100%" stopColor="#e2a857" />
                </linearGradient>
              </defs>

              {/* Graph rules. */}
              {[0, 1, 2, 3, 4].map((row) => (
                <line
                  key={row}
                  x1="0"
                  x2="520"
                  y1={40 + row * 55}
                  y2={40 + row * 55}
                  stroke="rgba(232,217,194,0.09)"
                  strokeWidth="1"
                />
              ))}

              {/* Charge, turn, development, drop — the classic profile shape. */}
              <path
                data-curve
                d="M 8 60 C 42 138, 62 196, 96 198 C 150 201, 188 150, 236 118 C 290 82, 344 66, 402 56 C 448 48, 486 44, 512 42"
                fill="none"
                stroke="url(#curve-stroke)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            <figcaption className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {MARKERS.map((marker) => (
                <div key={marker.at} data-marker>
                  <p className="eyebrow mb-1.5" style={{ letterSpacing: '0.24em' }}>
                    {marker.at}
                  </p>
                  <p className="display text-[clamp(0.95rem,1.3vw,1.2rem)] tracking-[-0.02em] text-crema">
                    {marker.label}
                  </p>
                  <p className="mt-0.5 text-[0.72rem] tracking-[0.1em] text-gold/80">
                    {marker.value}
                  </p>
                </div>
              ))}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
