'use client';

/** Film grain and lens vignette. Purely decorative, never interactive. */
export function Overlays() {
  return (
    <>
      <div aria-hidden className="grain" />
      <div aria-hidden className="vignette" />
    </>
  );
}
