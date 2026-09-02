'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { deviceTier, prefersReducedMotion } from '@/lib/env';

export interface SplashHandle {
  /** Kicks off the opening sequence. Safe to call once. */
  start: () => void;
}

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** Per-second radius growth — how fast the blob rushes the lens. */
  growth: number;
  age: number;
  life: number;
  /** Blobs flying at the camera get smeared along their velocity. */
  smear: number;
  highlight: number;
}

interface SplashProps {
  onImpact?: () => void;
}

/* --------------------------------------------------------------- sprites */

function buildSprites() {
  const sprite = (
    size: number,
    stops: [number, string][],
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [offset, color] of stops) gradient.addColorStop(offset, color);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return canvas;
  };

  return {
    // Body of the liquid — warm crema caramel, opaque at the core.
    body: sprite(128, [
      [0, 'rgba(214, 137, 62, 0.98)'],
      [0.45, 'rgba(166, 92, 38, 0.82)'],
      [0.78, 'rgba(96, 48, 18, 0.32)'],
      [1, 'rgba(72, 34, 12, 0)'],
    ]),
    // Specular skin that sits on top of the liquid.
    gloss: sprite(128, [
      [0, 'rgba(255, 226, 176, 0.9)'],
      [0.4, 'rgba(240, 180, 108, 0.35)'],
      [1, 'rgba(230, 160, 90, 0)'],
    ]),
    // Impact flash.
    flash: sprite(256, [
      [0, 'rgba(255, 214, 158, 0.85)'],
      [0.35, 'rgba(214, 130, 60, 0.34)'],
      [1, 'rgba(160, 80, 30, 0)'],
    ]),
  };
}

/**
 * The opening coffee splash.
 *
 * A small particle-fluid sim rather than a video or a scaled image: liquid
 * gathers, a column rises, and at impact it throws tendrils, a crown and a
 * spray of droplets — some of which grow hard and smear as they pass the lens,
 * which is what gives the shot its depth.
 *
 * Blobs are drawn to a half-resolution buffer and composited through a blur so
 * neighbouring blobs fuse into continuous liquid instead of reading as circles.
 */
const CoffeeSplash = forwardRef<SplashHandle, SplashProps>(function CoffeeSplash(
  { onImpact },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef<() => void>(() => {});

  useImperativeHandle(ref, () => ({ start: () => startRef.current() }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tier = deviceTier();
    const reduced = prefersReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, tier === 'low' ? 1.5 : 2);

    // Density of the spray, scaled to the device.
    const DROPLETS = tier === 'low' ? 46 : tier === 'mid' ? 88 : 130;
    const TENDRILS = tier === 'low' ? 8 : 14;

    const sprites = buildSprites();

    const buffer = document.createElement('canvas');
    const bufferCtx = buffer.getContext('2d')!;
    const BUFFER_SCALE = 0.5;

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

      buffer.width = Math.max(1, Math.floor(width * BUFFER_SCALE));
      buffer.height = Math.max(1, Math.floor(height * BUFFER_SCALE));
    };

    resize();

    const blobs: Blob[] = [];
    let running = false;
    let elapsed = 0;
    let last = 0;
    let raf = 0;
    let impactFired = false;

    // Sequence beats, in seconds.
    const COLUMN_AT = 0.45;
    const IMPACT_AT = 1.05;
    const FREEZE_AT = 2.15;
    const FADE_AT = 2.65;
    const END_AT = 3.6;

    const centreX = () => width * 0.5;
    const centreY = () => height * 0.52;

    const push = (blob: Partial<Blob>) => {
      blobs.push({
        x: centreX(),
        y: centreY(),
        vx: 0,
        vy: 0,
        r: 30,
        growth: 0,
        age: 0,
        life: 2,
        smear: 0,
        highlight: 0.5,
        ...blob,
      });
    };

    /** The liquid gathering and rising before the burst. */
    const emitColumn = (t: number) => {
      const progress = (t - COLUMN_AT) / (IMPACT_AT - COLUMN_AT);
      const lift = 260 * progress;
      for (let i = 0; i < 2; i++) {
        push({
          x: centreX() + (Math.random() - 0.5) * 130 * progress,
          y: centreY() + 150 - lift + (Math.random() - 0.5) * 90,
          vx: (Math.random() - 0.5) * 30,
          vy: -120 - Math.random() * 160,
          r: 28 + Math.random() * 52 * progress,
          life: 0.9 + Math.random() * 0.5,
          highlight: 0.35,
        });
      }
    };

    /** The burst: crown, tendrils, and the spray that comes at the camera. */
    const burst = () => {
      const cx = centreX();
      const cy = centreY();
      const reach = Math.min(width, height);

      // Crown — a ring of liquid thrown outward and slightly up.
      for (let i = 0; i < 26; i++) {
        const angle = (i / 26) * Math.PI * 2;
        push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * reach * (0.55 + Math.random() * 0.35),
          vy: Math.sin(angle) * reach * (0.4 + Math.random() * 0.3) - 90,
          r: 52 + Math.random() * 60,
          growth: 0.25,
          life: 1.5 + Math.random() * 0.7,
          highlight: 0.6,
        });
      }

      // Tendrils — arms of liquid, each a tapering chain of blobs.
      for (let i = 0; i < TENDRILS; i++) {
        const angle = (i / TENDRILS) * Math.PI * 2 + Math.random() * 0.35;
        const speed = reach * (0.75 + Math.random() * 0.7);
        const links = 6;
        for (let j = 0; j < links; j++) {
          const taper = 1 - j / links;
          push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed * (0.55 + j * 0.09),
            vy: Math.sin(angle) * speed * (0.5 + j * 0.08) - 60,
            r: 14 + 42 * taper,
            growth: 0.1,
            life: 1.1 + taper * 0.8,
            highlight: 0.45 + taper * 0.35,
          });
        }
      }

      // Spray — droplets, a third of which rush the lens: they grow hard,
      // smear along their velocity and blow out as they pass.
      for (let i = 0; i < DROPLETS; i++) {
        const angle = Math.random() * Math.PI * 2;
        const toCamera = i % 3 === 0;
        const speed = reach * (toCamera ? 0.9 + Math.random() * 1.5 : 0.5 + Math.random() * 1.1);
        push({
          x: cx + (Math.random() - 0.5) * 60,
          y: cy + (Math.random() - 0.5) * 60,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 120,
          r: toCamera ? 8 + Math.random() * 16 : 4 + Math.random() * 12,
          growth: toCamera ? 2.6 + Math.random() * 3.4 : 0.2,
          smear: toCamera ? 0.5 + Math.random() * 0.5 : 0.12,
          life: toCamera ? 1.4 + Math.random() * 0.7 : 1.8 + Math.random() * 0.9,
          highlight: 0.75,
        });
      }
    };

    const draw = () => {
      const t = elapsed;

      bufferCtx.setTransform(1, 0, 0, 1, 0, 0);
      bufferCtx.clearRect(0, 0, buffer.width, buffer.height);
      bufferCtx.scale(BUFFER_SCALE, BUFFER_SCALE);

      // --- liquid body into the low-res buffer --------------------------
      for (const blob of blobs) {
        const life = blob.age / blob.life;
        if (life >= 1) continue;

        // Ease in fast, hold, then fall away.
        const alpha = life < 0.12 ? life / 0.12 : 1 - Math.pow((life - 0.12) / 0.88, 1.8);
        if (alpha <= 0.01) continue;

        bufferCtx.globalAlpha = alpha;

        const steps = blob.smear > 0.2 ? 4 : 1;
        for (let s = 0; s < steps; s++) {
          // Motion-blur copies trail behind along the velocity vector.
          const back = (s / steps) * blob.smear * 0.055;
          const x = blob.x - blob.vx * back;
          const y = blob.y - blob.vy * back;
          const size = blob.r * 2 * (1 - s * 0.12);
          bufferCtx.globalAlpha = alpha * (s === 0 ? 1 : 0.4 / s);
          bufferCtx.drawImage(sprites.body, x - size / 2, y - size / 2, size, size);
        }
      }

      bufferCtx.globalAlpha = 1;

      // --- composite through a blur so the blobs fuse into liquid --------
      ctx.clearRect(0, 0, width, height);

      // The blur tightens as the splash resolves, like focus snapping in.
      const focus = t < IMPACT_AT ? 16 : Math.max(3, 16 - (t - IMPACT_AT) * 14);
      ctx.filter = `blur(${focus.toFixed(1)}px)`;
      ctx.drawImage(buffer, 0, 0, width, height);
      ctx.filter = 'none';

      // A second, sharper pass gives the liquid an edge instead of pure haze.
      ctx.globalAlpha = 0.55;
      ctx.drawImage(buffer, 0, 0, width, height);
      ctx.globalAlpha = 1;

      // --- speculars and flash ------------------------------------------
      ctx.globalCompositeOperation = 'lighter';

      for (const blob of blobs) {
        const life = blob.age / blob.life;
        if (life >= 1 || blob.highlight < 0.2) continue;
        const alpha = (1 - life) * blob.highlight * 0.5;
        const size = blob.r * 1.1;
        ctx.globalAlpha = alpha;
        ctx.drawImage(
          sprites.gloss,
          blob.x - size * 0.6,
          blob.y - size * 0.68,
          size,
          size,
        );
      }

      // Impact flash and the ambient glow that precedes it.
      const glow = t < IMPACT_AT
        ? Math.pow(Math.min(t / IMPACT_AT, 1), 2) * 0.5
        : Math.max(0, 1 - (t - IMPACT_AT) * 2.2);

      if (glow > 0.01) {
        const size = Math.min(width, height) * (t < IMPACT_AT ? 1.1 : 2.4);
        ctx.globalAlpha = glow;
        ctx.drawImage(
          sprites.flash,
          centreX() - size / 2,
          centreY() - size / 2,
          size,
          size,
        );
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);

      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += delta;

      if (elapsed >= COLUMN_AT && elapsed < IMPACT_AT) emitColumn(elapsed);

      if (!impactFired && elapsed >= IMPACT_AT) {
        impactFired = true;
        burst();
        onImpact?.();
      }

      // After the freeze beat the liquid stops dead and simply hangs there,
      // which is what turns the splash into the hero composition.
      const damping = elapsed > FREEZE_AT ? Math.pow(0.02, delta) : 1;
      const gravity = elapsed > FREEZE_AT ? 0 : 620;

      for (const blob of blobs) {
        blob.age += delta;
        blob.vx *= damping;
        blob.vy *= damping;
        blob.vy += gravity * delta * 0.35;
        blob.x += blob.vx * delta;
        blob.y += blob.vy * delta;
        blob.r *= 1 + blob.growth * delta;
        // Air drag, so the spray decelerates instead of flying flat.
        blob.vx *= 1 - 0.6 * delta;
        blob.vy *= 1 - 0.6 * delta;
      }

      // Retire dead blobs in place to avoid reallocating the array each frame.
      for (let i = blobs.length - 1; i >= 0; i--) {
        if (blobs[i].age >= blobs[i].life) blobs.splice(i, 1);
      }

      draw();

      if (elapsed > FADE_AT) {
        const fade = 1 - (elapsed - FADE_AT) / (END_AT - FADE_AT);
        canvas.style.opacity = String(Math.max(fade, 0));
      }

      if (elapsed > END_AT) {
        running = false;
        cancelAnimationFrame(raf);
        blobs.length = 0;
        ctx.clearRect(0, 0, width, height);
      }
    };

    startRef.current = () => {
      if (running) return;
      // With reduced motion the splash is skipped entirely — the hero simply
      // resolves, and the rest of the page still tells the same story.
      if (reduced) {
        canvas.style.opacity = '0';
        onImpact?.();
        return;
      }
      running = true;
      elapsed = 0;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [onImpact]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[18] h-full w-full"
    />
  );
});

export default CoffeeSplash;
