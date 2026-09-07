"use client";

import RevealText from "@/components/ui/RevealText";

export default function OriginScene() {
  return (
    <section data-scene id="origin" className="scene min-h-[175vh] items-start">
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
              With the code.
            </RevealText>

            <div className="rule mx-auto my-10 max-w-[10rem]" />

            <RevealText
              variant="blur"
              className="body-copy mx-auto max-w-[38ch]"
            >
              One idea. A blank editor. A first line of code. From late-night
              debugging to the final commit, every build begins with focus,
              patience, and a little caffeine.
            </RevealText>
          </div>

          {/* Field notes, set as a spec sheet rather than a paragraph. */}
          <dl className="mx-auto mt-[clamp(3rem,7vh,6rem)] grid max-w-[62rem] grid-cols-2 gap-x-8 gap-y-7 md:grid-cols-4">
            {[
              ["Language", "JavaScript"],
              ["Runtime", "Node.js"],
              ["Workflow", "Code → Commit"],
              ["Fuel", "Freshly Brewed"],
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
