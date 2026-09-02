'use client';

import { useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import { isTouchDevice, prefersReducedMotion } from '@/lib/env';

/**
 * The custom cursor.
 *
 * A dot that tracks precisely and a ring that trails behind it. Any element
 * carrying `data-cursor` swaps the ring for a label — EXPLORE over the beans,
 * VIEW over the calls to action.
 *
 * Never mounted on touch devices, where it has nothing to track.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');
  const [enabled, setEnabled] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (isTouchDevice() || prefersReducedMotion()) return;

    setEnabled(true);
    document.documentElement.classList.add('has-custom-cursor');

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // The dot is nearly instant; the ring lags, which is what reads as weight.
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3.out' });

    const onMove = (event: PointerEvent) => {
      dotX(event.clientX);
      dotY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);
    };

    const onOver = (event: PointerEvent) => {
      const target = (event.target as HTMLElement)?.closest?.('[data-cursor]');
      const next = target?.getAttribute('data-cursor') ?? '';
      setLabel(next);

      gsap.to(ring, {
        scale: next ? 3.1 : 1,
        borderColor: next ? 'rgba(226,168,87,0.9)' : 'rgba(232,217,194,0.4)',
        backgroundColor: next ? 'rgba(122,52,16,0.28)' : 'rgba(232,217,194,0)',
        duration: 0.45,
        ease: 'power3.out',
      });

      gsap.to(dot, { scale: next ? 0 : 1, duration: 0.3, ease: 'power3.out' });
    };

    const onDown = () => gsap.to(ring, { scale: 0.82, duration: 0.2 });
    const onUp = () => gsap.to(ring, { scale: label ? 3.1 : 1, duration: 0.3 });

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);

    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
    // `label` is read inside onUp only; re-binding on every hover would be waste.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70]">
      <div
        ref={ringRef}
        className="absolute left-0 top-0 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[rgba(232,217,194,0.4)]"
        style={{ marginLeft: '-20px', marginTop: '-20px' }}
      >
        <span
          className="text-[0.28rem] font-medium uppercase tracking-[0.18em] text-cream transition-opacity duration-300"
          style={{ opacity: label ? 1 : 0 }}
        >
          {label}
        </span>
      </div>

      <div
        ref={dotRef}
        className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-crema"
        style={{ marginLeft: '-3px', marginTop: '-3px' }}
      />
    </div>
  );
}
