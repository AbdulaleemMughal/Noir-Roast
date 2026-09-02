'use client';

import { useCallback, useRef } from 'react';
import Image from 'next/image';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import { deviceTier, prefersReducedMotion } from '@/lib/env';
import { BEAN_SOURCES } from '@/lib/assets';
import { beanLayout, beanSizeFactor } from '@/animations/beanChoreography';
import {
  ambient,
  beanVars,
  buildScrollScenes,
  type Viewport,
} from '@/animations/scrollAnimations';
import { buildIntro } from '@/animations/heroAnimations';
import { attachPointerParallax } from '@/animations/parallaxAnimations';
import CoffeeSplash, { type SplashHandle } from './CoffeeSplash';
import ParticleField from './ParticleField';

/** Beans that fly past the lens, and later frame the composition in front of the type. */
const isForeground = (index: number) => index % 4 === 1;

const FOREGROUND = new Set(BEAN_SOURCES.map((_, i) => i).filter(isForeground));

interface BeanStageProps {
  /** Flipped once the preloader has finished — gates the opening. */
  started: boolean;
}

/**
 * The persistent stage.
 *
 * Every bean on the site lives here, in one fixed layer that never unmounts.
 * Sections scrolling past do not own their own visuals; they simply mark
 * points on the timeline this stage is animating along. That is what lets the
 * same twelve beans travel from the opening splash to the final cluster as a
 * single continuous shot.
 */
export default function BeanStage({ started }: BeanStageProps) {
  const cameraRefs = useRef<(HTMLDivElement | null)[]>([]);
  const backdropRef = useRef<HTMLDivElement>(null);
  const splashRef = useRef<SplashHandle>(null);

  // Index-aligned across both depth layers.
  const bodyRefs = useRef<(HTMLElement | null)[]>([]);
  const idleRefs = useRef<(HTMLElement | null)[]>([]);
  const depthRefs = useRef<(HTMLElement | null)[]>([]);

  const introPlayed = useRef(false);
  const startedRef = useRef(started);
  startedRef.current = started;

  const startSplash = useCallback(() => splashRef.current?.start(), []);

  useIsomorphicLayoutEffect(() => {
    const camera = cameraRefs.current.filter(Boolean) as HTMLElement[];
    const backdrop = backdropRef.current;
    if (!camera.length || !backdrop) return;

    const tier = deviceTier();
    const reducedMotion = prefersReducedMotion();
    // Filter blur is the single most expensive thing on this page; the low
    // tier gets depth from scale and opacity alone.
    const allowBlur = tier !== 'low' && !reducedMotion;

    let context: gsap.Context | null = null;
    let detachPointer: (() => void) | null = null;
    let ambientTick: ((time: number) => void) | null = null;

    const build = () => {
      const beans = bodyRefs.current.filter(Boolean) as HTMLElement[];
      const idles = idleRefs.current.filter(Boolean) as HTMLElement[];
      const depths = depthRefs.current.filter(Boolean) as HTMLElement[];
      if (!beans.length) return;

      const viewport: Viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // Bean size tracks the smaller viewport axis so the composition holds
      // its proportions from a phone to an ultrawide.
      const base = Math.min(
        Math.max(Math.min(viewport.width, viewport.height) * 0.15, 68),
        184,
      );
      document.documentElement.style.setProperty('--bean-size', `${base}px`);

      const sections = Array.from(
        document.querySelectorAll<HTMLElement>('[data-scene]'),
      );

      context = gsap.context(() => {
        if (started && !introPlayed.current) {
          introPlayed.current = true;
          buildIntro(
            { camera, beans, foreground: FOREGROUND, startSplash },
            viewport,
            { allowBlur, reducedMotion },
          );
        } else {
          // Rebuilding after a resize: drop straight into the hero layout and
          // let ScrollTrigger settle the beans to the current scroll position.
          beans.forEach((bean, i) => {
            gsap.set(bean, beanVars(beanLayout('hero', i, beans.length), viewport, allowBlur));
          });
        }

        buildScrollScenes(
          { beans, sections, backdrop, camera },
          viewport,
          { allowBlur, reducedMotion },
        );
      }, camera[0]);

      if (reducedMotion) return;

      // Pointer parallax: nearer beans get a bigger displacement budget, so
      // moving the mouse separates the layers rather than sliding them as one.
      detachPointer = attachPointerParallax(
        depths,
        depths.map((_, i) => (isForeground(i) ? 46 : 12 + (i % 5) * 6)),
      );

      // Ambient float, written straight to style: amplitude is live-tunable by
      // the scroll timeline (the roast churns much harder than the finale),
      // which a pre-baked tween could not do.
      const phases = idles.map((_, i) => (i * 1.7) % (Math.PI * 2));
      const speeds = idles.map((_, i) => 0.00042 + (i % 5) * 0.00011);

      ambientTick = (time: number) => {
        for (let i = 0; i < idles.length; i++) {
          const t = time * speeds[i] * 1000;
          const y = Math.sin(t + phases[i]) * 13 * ambient.amount;
          const x = Math.cos(t * 0.7 + phases[i]) * 7 * ambient.amount;
          const rotate = Math.sin(t * 0.55 + phases[i]) * 4.5 * ambient.spin;
          idles[i].style.transform =
            `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rotate.toFixed(2)}deg)`;
        }
      };

      gsap.ticker.add(ambientTick);
    };

    const teardown = () => {
      context?.revert();
      context = null;
      detachPointer?.();
      detachPointer = null;
      if (ambientTick) gsap.ticker.remove(ambientTick);
      ambientTick = null;
    };

    build();

    // Only rebuild on a meaningful width change. Mobile browsers fire resize
    // constantly as the URL bar collapses; rebuilding on that would thrash.
    let lastWidth = window.innerWidth;
    let debounce = 0;

    const onResize = () => {
      if (Math.abs(window.innerWidth - lastWidth) < 60) return;
      lastWidth = window.innerWidth;
      window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        teardown();
        build();
        ScrollTrigger.refresh();
      }, 220);
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.clearTimeout(debounce);
      window.removeEventListener('resize', onResize);
      teardown();
    };
  }, [started, startSplash]);

  const renderBean = (source: string, index: number, interactive: boolean) => (
    <div
      key={source}
      ref={(el) => {
        depthRefs.current[index] = el;
      }}
      // Only the rear layer is hoverable: it sits below the content stacking
      // context, so it can never intercept a click meant for a link.
      className={`bean-depth${interactive ? ' pointer-events-auto' : ''}`}
      data-cursor={interactive ? 'explore' : undefined}
      style={{ ['--factor' as string]: beanSizeFactor(index).toFixed(3) }}
    >
      <div
        ref={(el) => {
          idleRefs.current[index] = el;
        }}
        className="bean-idle"
      >
        <div
          ref={(el) => {
            bodyRefs.current[index] = el;
          }}
          className="bean-body"
        >
          <Image
            src={source}
            alt=""
            width={512}
            height={512}
            priority={index < 4}
            sizes="(max-width: 768px) 30vw, 15vw"
            className="h-full w-full select-none object-contain"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Layer 0 — the atmosphere the whole film is graded against. */}
      <div ref={backdropRef} aria-hidden className="backdrop" />

      {/* Layers 1-2 — coffee dust, embers, steam. */}
      <ParticleField />

      {/* Layer 3 — the opening splash. */}
      <CoffeeSplash ref={splashRef} />

      {/* Layer 4 — the beans behind the type. */}
      <div
        ref={(el) => {
          cameraRefs.current[0] = el;
        }}
        aria-hidden
        className="bean-camera z-[20]"
      >
        <div className="bean-layer">
          {BEAN_SOURCES.map((source, index) =>
            isForeground(index) ? null : renderBean(source, index, true),
          )}
        </div>
      </div>

      {/* Layer 5 — the few beans that sit in front of everything. */}
      <div
        ref={(el) => {
          cameraRefs.current[1] = el;
        }}
        aria-hidden
        className="bean-camera z-[36]"
      >
        <div className="bean-layer">
          {BEAN_SOURCES.map((source, index) =>
            isForeground(index) ? renderBean(source, index, false) : null,
          )}
        </div>
      </div>
    </>
  );
}
