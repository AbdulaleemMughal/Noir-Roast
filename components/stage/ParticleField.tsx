'use client';

import { useEffect, useRef } from 'react';
import { deviceTier, prefersReducedMotion } from '@/lib/env';
import { pointer } from '@/animations/parallaxAnimations';
import { particleParams } from './particleParams';

type Kind = 'dust' | 'fleck' | 'steam';

interface Particle {
  x: number;
  y: number;
  z: number;      // depth 0..1 — drives size, speed and alpha together
  vx: number;
  vy: number;
  size: number;
  phase: number;
  spin: number;
  rotation: number;
  kind: Kind;
}

/** Tint ramp from cold roasted dust to live ember. */
const TINTS: [number, number, number][] = [
  [166, 124, 92],
  [198, 140, 84],
  [226, 152, 68],
  [255, 154, 52],
];

/**
 * Builds the sprite atlas once. Drawing pre-rendered sprites is dramatically
 * cheaper than creating a radial gradient per particle per frame, which is
 * what makes a few hundred particles viable on a phone.
 */
function buildSprites() {
  const make = (
    size: number,
    paint: (ctx: CanvasRenderingContext2D, s: number) => void,
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    paint(ctx, size);
    return canvas;
  };

  const soft = (rgb: [number, number, number], falloff: number) =>
    make(64, (ctx, s) => {
      const gradient = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      gradient.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`);
      gradient.addColorStop(falloff, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.32)`);
      gradient.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, s, s);
    });

  return {
    // One sprite per tint stop; the renderer picks by current warmth.
    dust: TINTS.map((rgb) => soft(rgb, 0.34)),
    steam: TINTS.map((rgb) => soft(rgb, 0.14)),
    // Ground coffee reads as dark irregular specks, not glowing motes.
    fleck: make(32, (ctx, s) => {
      ctx.fillStyle = 'rgba(28, 15, 8, 0.95)';
      ctx.beginPath();
      ctx.ellipse(s / 2, s / 2, s * 0.26, s * 0.17, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(96, 58, 32, 0.7)';
      ctx.beginPath();
      ctx.ellipse(s * 0.44, s * 0.44, s * 0.11, s * 0.07, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }),
  };
}

/**
 * Atmospheric coffee dust.
 *
 * The field is one canvas for the whole page. Rather than swapping particle
 * systems per section, the scroll timeline retunes `particleParams`, so the
 * same motes gradually become embers in the roast and steam in the aroma —
 * part of why the sections read as one continuous shot.
 */
export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const tier = deviceTier();
    const reduced = prefersReducedMotion();

    // `density` peaks above 1 during the roast, so the pool has to be big
    // enough for the busiest scene — otherwise the draw loop indexes past the
    // end of the array.
    const MAX = tier === 'low' ? 60 : tier === 'mid' ? 130 : 200;
    const POOL = Math.ceil(MAX * 1.6);
    const dpr = Math.min(window.devicePixelRatio || 1, tier === 'low' ? 1.5 : 2);

    const sprites = buildSprites();
    const particles: Particle[] = [];

    let width = 0;
    let height = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (index: number): Particle => {
      // Roughly one in six is a heavier dark fleck, one in nine a steam wisp.
      const kind: Kind = index % 6 === 0 ? 'fleck' : index % 9 === 4 ? 'steam' : 'dust';
      const z = Math.random() * 0.9 + 0.1;

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.1,
        size:
          kind === 'steam'
            ? 90 + Math.random() * 190
            : kind === 'fleck'
              ? 3 + Math.random() * 6
              : 5 + Math.random() * 16,
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.01,
        rotation: Math.random() * Math.PI,
        kind,
      };
    };

    resize();
    for (let i = 0; i < POOL; i++) particles.push(spawn(i));

    let raf = 0;
    let last = performance.now();
    let time = 0;
    let visible = true;

    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      if (!visible) return;

      // Clamped delta keeps the field from lurching after a background tab.
      const delta = Math.min((now - last) / 16.667, 3);
      last = now;
      time += delta * 0.006;

      ctx.clearRect(0, 0, width, height);

      const p = particleParams;
      const active = Math.min(POOL, Math.floor(MAX * Math.max(p.density, 0)));
      const tint = Math.min(TINTS.length - 1, Math.floor(p.warmth * TINTS.length));
      const tintNext = Math.min(TINTS.length - 1, tint + 1);
      const tintMix = p.warmth * TINTS.length - tint;

      // Pass 1: dark flecks composite normally so they read as solid grounds.
      ctx.globalCompositeOperation = 'source-over';

      for (let i = 0; i < active; i++) {
        const particle = particles[i];
        if (particle.kind !== 'fleck') continue;

        step(particle, delta, p, time);

        const size = particle.size * (0.5 + particle.z);
        ctx.globalAlpha = 0.5 * particle.z * p.opacity;
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.drawImage(sprites.fleck, -size / 2, -size / 2, size, size);
        ctx.restore();
      }

      // Pass 2: glowing dust and steam add light into the scene.
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < active; i++) {
        const particle = particles[i];
        if (particle.kind === 'fleck') continue;

        step(particle, delta, p, time);

        const atlas = particle.kind === 'steam' ? sprites.steam : sprites.dust;
        const size = particle.size * (0.45 + particle.z * 1.1);
        const base =
          particle.kind === 'steam'
            ? 0.05 + p.rise * 0.09
            : 0.16 + p.glow * 0.3;

        const alpha = base * particle.z * p.opacity * (0.6 + 0.4 * Math.sin(particle.phase + time * 2));

        ctx.globalAlpha = alpha * (1 - tintMix);
        ctx.drawImage(atlas[tint], particle.x - size / 2, particle.y - size / 2, size, size);

        if (tintMix > 0.01) {
          ctx.globalAlpha = alpha * tintMix;
          ctx.drawImage(atlas[tintNext], particle.x - size / 2, particle.y - size / 2, size, size);
        }
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };

    /** Advances one particle: flow field, rise, pointer push, wrapping. */
    function step(
      particle: Particle,
      delta: number,
      p: typeof particleParams,
      t: number,
    ) {
      if (reduced) return;

      // Cheap curl-ish flow field — two offset sine lattices.
      const flowX = Math.sin(particle.y * 0.004 + t) * Math.cos(particle.x * 0.003 - t * 0.7);
      const flowY = Math.cos(particle.x * 0.0035 + t * 0.8) * 0.6;

      particle.vx += flowX * 0.012 * p.turbulence * particle.z * delta;
      particle.vy += flowY * 0.008 * p.turbulence * particle.z * delta;

      // Rise dominates in the aroma and roast scenes.
      particle.vy -= p.rise * 0.05 * (0.4 + particle.z) * delta;

      // The cursor pushes the nearer motes out of the way.
      const px = (pointer.x * 0.5 + 0.5) * width;
      const py = (pointer.y * 0.5 + 0.5) * height;
      const dx = particle.x - px;
      const dy = particle.y - py;
      const distanceSq = dx * dx + dy * dy;

      if (distanceSq < 62500) {
        const force = (1 - Math.sqrt(distanceSq) / 250) * 0.16 * particle.z;
        particle.vx += dx * force * 0.01 * delta;
        particle.vy += dy * force * 0.01 * delta;
      }

      particle.vx *= 0.985;
      particle.vy *= 0.985;

      particle.x += particle.vx * delta * (0.5 + particle.z);
      particle.y += particle.vy * delta * (0.5 + particle.z);
      particle.rotation += particle.spin * delta;
      particle.phase += 0.01 * delta;

      // Wrap with a margin so nothing pops at the edges.
      const margin = particle.size;
      if (particle.x < -margin) particle.x = width + margin;
      if (particle.x > width + margin) particle.x = -margin;
      if (particle.y < -margin) {
        particle.y = height + margin;
        particle.x = Math.random() * width;
      }
      if (particle.y > height + margin) particle.y = -margin;
    }

    const onResize = () => resize();
    const onVisibility = () => {
      visible = !document.hidden;
      last = performance.now();
    };

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[15] h-full w-full"
    />
  );
}
