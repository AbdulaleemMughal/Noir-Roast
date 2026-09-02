'use client';

import { useRef } from 'react';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import { isTouchDevice } from '@/lib/env';
import { attachMagnet } from '@/animations/parallaxAnimations';

interface MagneticButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'solid' | 'ghost';
  cursor?: string;
  className?: string;
}

/**
 * A button that leans toward the cursor, with a fill that wipes up from the
 * baseline on hover. Both effects are small on purpose — the page has enough
 * motion without the controls joining in.
 */
export default function MagneticButton({
  children,
  href,
  onClick,
  variant = 'solid',
  cursor = 'view',
  className = '',
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element || isTouchDevice()) return;
    return attachMagnet(element, 0.28);
  }, []);

  const solid = variant === 'solid';

  const shell = [
    'group relative inline-flex items-center gap-3 overflow-hidden rounded-full',
    'px-8 py-4 text-[0.7rem] uppercase tracking-[0.26em]',
    'transition-colors duration-500 will-change-transform',
    solid
      ? 'bg-crema text-espresso hover:text-cream'
      : 'border border-[rgba(232,217,194,0.26)] text-crema hover:text-espresso',
    className,
  ].join(' ');

  const inner = (
    <>
      {/* Fill wipes up from the baseline. */}
      <span
        aria-hidden
        className={[
          'absolute inset-0 origin-bottom scale-y-0 transition-transform duration-500',
          'ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100',
          solid ? 'bg-[linear-gradient(180deg,#7a3410,#2a150b)]' : 'bg-crema',
        ].join(' ')}
      />
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden
        className="relative z-10 transition-transform duration-500 group-hover:translate-x-1"
      >
        &#8594;
      </span>
    </>
  );

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        data-cursor={cursor}
        className={shell}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      data-cursor={cursor}
      className={shell}
    >
      {inner}
    </button>
  );
}
