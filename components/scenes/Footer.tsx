"use client";

/** Quiet close. The film is over; this is just the colophon. */
export default function Footer() {
  return (
    <footer
      id="shop"
      className="scene relative min-h-[40vh] flex-col justify-end pb-[clamp(2rem,5vh,4rem)]"
    >
      <div className="mx-auto w-full max-w-[92rem]">
        <div className="rule mb-10" />

        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="display text-[clamp(2rem,7vw,5rem)] leading-none tracking-[-0.045em] text-cream">
              Coffee.<span className="text-gold leading-none">Dev</span>
            </p>
            <p
              className="body-copy mt-4 max-w-[34ch]"
              style={{ fontSize: "0.86rem" }}
            >
              From late-night commits to early-morning deploys. Every build
              starts with a better brew.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-10 gap-y-4">
            {["Subscriptions", "Wholesale", "Brew guides", "Contact"].map(
              (item) => (
                <a
                  key={item}
                  href="#shop"
                  data-cursor="go"
                  className="group relative text-[0.68rem] uppercase tracking-[0.26em] text-crema/60 transition-colors duration-300 hover:text-cream"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
                </a>
              ),
            )}
          </nav>
        </div>

        <p className="eyebrow mt-12" style={{ fontSize: "0.58rem" }}>
          © {new Date().getFullYear()} Coffee.dev — All rights reserved
        </p>
      </div>
    </footer>
  );
}
