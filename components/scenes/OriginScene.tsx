'use client';

import RevealText from '@/components/ui/RevealText';

/**
 * Scene 01 — The Origin.
 *
 * The bean ring opens around the centre of the frame and the copy sits inside
 * it. The section is tall and the content sticky, so the type holds still
 * while the beans complete their move.
 */
export default function OriginScene() {
  return (
    <section
      data-scene
      id="origin"
      className="scene min-h-[175vh] items-start"
    >
      <div className="sticky top-0 flex h-[100svh] w-full items-center">
        <div className="mx-auto w-full max-w-[92rem]">
          <div className="mx-auto max-w-[46rem] text-center">
            <p className="eyebrow mb-8">01 — Origin</p>

            <RevealText as="h2" className="display display-lg text-cream">
              It starts
            </RevealText>
            <RevealText
              as="p"
              delay={0.12}
              className="display display-lg text-cream/70"
            >
              With the bean.
            </RevealText>

            <div className="rule mx-auto my-10 max-w-[10rem]" />

            <RevealText variant="blur" className="body-copy mx-auto max-w-[38ch]">
              Grown on the eastern slope, picked by hand in three passes, and
              washed the same afternoon. One farm. One altitude. One harvest
              window nine days wide.
            </RevealText>
          </div>

          {/* Field notes, set as a spec sheet rather than a paragraph. */}
          <dl className="mx-auto mt-[clamp(3rem,7vh,6rem)] grid max-w-[62rem] grid-cols-2 gap-x-8 gap-y-7 md:grid-cols-4">
            {[
              ['Varietal', 'Pink Bourbon'],
              ['Altitude', '1,860 m'],
              ['Process', 'Washed, 36 h'],
              ['Harvest', 'Oct — Dec'],
            ].map(([term, value]) => (
              <div key={term}>
                <dt className="eyebrow mb-2">{term}</dt>
                <dd className="display text-[clamp(1rem,1.5vw,1.35rem)] tracking-[-0.02em] text-crema">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
