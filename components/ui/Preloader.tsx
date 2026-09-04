'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import { BEAN_SOURCES, GRAIN_TEXTURE } from '@/lib/assets';

interface PreloaderProps {
  onComplete: () => void;
}

/**
 * The roast counter.
 *
 * The percentage is tied to real decode progress, not a fake timer, so the
 * opening splash never starts before its beans exist. It then clears with a
 * warm wipe rather than a fade — the first move of the film, not a loading
 * screen getting out of the way.
 */
export default function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const wipeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // --- real asset progress --------------------------------------------------
  useEffect(() => {
    const sources = [...BEAN_SOURCES, GRAIN_TEXTURE];
    let loaded = 0;
    let cancelled = false;

    const settle = () => {
      if (cancelled) return;
      loaded += 1;
      setProgress(Math.round((loaded / sources.length) * 100));
      if (loaded === sources.length) {
        // A short hold at 100 so the number is actually readable.
        window.setTimeout(() => !cancelled && setDone(true), 420);
      }
    };

    for (const source of sources) {
      const image = new window.Image();
      image.onload = settle;
      image.onerror = settle;
      image.src = source;
    }

    // Never trap the visitor behind a stalled asset.
    const failsafe = window.setTimeout(() => {
      if (!cancelled) {
        setProgress(100);
        setDone(true);
      }
    }, 7000);

    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
    };
  }, []);

  // --- the wipe -------------------------------------------------------------
  useIsomorphicLayoutEffect(() => {
    if (!done) return;

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        onComplete: () => {
          rootRef.current?.remove();
        },
      });

      timeline
        .to(contentRef.current, {
          opacity: 0,
          y: -22,
          filter: 'blur(10px)',
          duration: 0.5,
          ease: 'power2.in',
        })
        // The warm panel sweeps up and takes the black screen with it.
        .fromTo(
          wipeRef.current,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.72,
            ease: 'power3.inOut',
          },
          '-=0.18',
        )
        .call(onComplete)
        .to(
          rootRef.current,
          {
            clipPath: 'inset(0% 0% 100% 0%)',
            duration: 0.86,
            ease: 'power3.inOut',
          },
          '+=0.05',
        );
    }, rootRef);

    return () => context.revert();
  }, [done, onComplete]);

  // Bar width is a direct style write — one property, no tween needed.
  useEffect(() => {
    if (barRef.current) barRef.current.style.transform = `scaleX(${progress / 100})`;
  }, [progress]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[80] flex items-end justify-between bg-[#050302] px-[clamp(1.25rem,5vw,5.5rem)] pb-[clamp(2rem,6vh,5rem)]"
    >
      <div
        ref={wipeRef}
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,#7a3410_0%,#2a150b_55%,#0b0503_100%)]"
        style={{ clipPath: 'inset(100% 0% 0% 0%)' }}
      />

      <div
        ref={contentRef}
        className="relative flex w-full items-end justify-between gap-8"
      >
        <div>
          <p className="eyebrow mb-5">Noir Roast</p>
          <p className="display display-md text-cream">Roasting</p>

          <div className="mt-8 h-px w-[min(46vw,26rem)] overflow-hidden bg-[rgba(232,217,194,0.12)]">
            <div
              ref={barRef}
              className="h-full origin-left bg-gold transition-transform duration-500 ease-out"
              style={{ transform: 'scaleX(0)' }}
            />
          </div>
        </div>
        <p
          className="display text-cream tabular-nums"
          style={{ fontSize: 'clamp(3rem, 11vw, 9rem)', lineHeight: 0.8 }}
          aria-live="polite"
        >
          {String(progress).padStart(2, '0')}
        </p>
      </div>
    </div>
  );
}
