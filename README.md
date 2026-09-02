# Noir Roast

A cinematic, scroll-driven coffee site: Next.js App Router, TypeScript, Tailwind,
GSAP + ScrollTrigger, and Lenis.

## Run it

```bash
npm install
npm run dev
```

## Using your own bean photography

The twelve bean cut-outs shipped in `public/beans/` are procedurally rendered
stand-ins so the site is complete out of the box. To use real photographs:

1. Drop your images into `assets/source/`.
2. Run `npm run assets`.

Each image is background-keyed, edge-decontaminated, trimmed to the subject,
squared to 512×512 and written to `public/beans/<name>.png`.

Name your files `bean-01.png` … `bean-12.png` to replace the stand-ins directly —
`lib/assets.ts` points at those paths, so nothing else has to change. Images that
already carry an alpha channel are passed through untouched apart from the trim.

If the key leaves halos or eats into the bean, tune it:

```bash
KEY_TOLERANCE=80 KEY_SOFTNESS=40 npm run assets
```

To re-render the stand-ins after editing the shader: `node scripts/generate-beans.mjs`.

## How the animation is put together

The page is one continuous shot, not a stack of animated sections.

- **`components/stage/BeanStage.tsx`** owns every visual — beans, splash, dust,
  backdrop — in fixed layers that never unmount. The sections in `app/page.tsx`
  contain only type; their `data-scene` order *is* the order of the film.
- **`animations/beanChoreography.ts`** describes each scene as a layout: where
  every bean sits, how deep it is, how it is turned. Depth drives scale, blur and
  opacity together, so a bean travelling toward the lens defocuses like a real one.
- **`animations/scrollAnimations.ts`** builds a *single* master timeline for the
  whole document. Each scene's segment is placed at the normalised scroll offset
  where that section actually crosses the viewport. One timeline rather than one
  per section is deliberate: seven scrubbed timelines writing the same properties
  fight over their lazily-captured start values, and the hero ends up wearing the
  roast's colour grade.
- **`animations/heroAnimations.ts`** is the opening — the splash, the beans thrown
  out of it, the camera shake, and the `onHeroReveal` signal the type waits on.

## Performance notes

- `deviceTier()` scales particle counts and switches off filter blur and the heat
  displacement filter on low-end devices.
- Particles and the splash are canvas, drawn from pre-rendered sprites rather than
  per-frame gradients.
- Only `transform`, `opacity` and `filter` are animated.
- Lenis runs on the GSAP ticker, so scrubbed ScrollTriggers stay locked to the
  smoothed scroll position instead of lagging a frame behind.
- `prefers-reduced-motion` skips the splash and the ambient float, and drops
  ScrollTrigger to unsmoothed scrubbing. The story still reads.
