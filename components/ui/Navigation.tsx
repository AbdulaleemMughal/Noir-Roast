"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ScrollTrigger } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { scrollTo } from "./SmoothScroll";

const LINKS = [
  { label: "Story", target: "#origin" },
  { label: "Process", target: "#roast" },
  { label: "Coffee", target: "#product" },
  { label: "About", target: "#final" },
];

/**
 * Floating navigation.
 *
 * Transparent over the hero, then settling into a dark glass bar once the
 * page starts moving. Deliberately quiet — it should never compete with the
 * type underneath it.
 */

export default function Navigation() {
  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const trigger = ScrollTrigger.create({
      start: "top -80",
      end: 99999,
      onToggle: (self) => setCondensed(self.isActive),
    });
    return () => trigger.kill();
  }, []);

  // The menu owns the scroll while it is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const go = (target: string) => {
    setOpen(false);
    // Let the menu begin closing before the page starts travelling.
    window.setTimeout(() => scrollTo(target), open ? 260 : 0);
  };

  return (
    <>
      <header
        ref={ref}
        className={[
          "fixed inset-x-0 top-0 z-[50] transition-all duration-700",
          "flex items-center justify-between",
          "px-[clamp(1.25rem,5vw,5.5rem)]",
          condensed
            ? "bg-[rgba(8,4,2,0.62)] py-4 backdrop-blur-xl"
            : "bg-transparent py-7",
        ].join(" ")}
        style={{
          borderBottom: condensed
            ? "1px solid rgba(232,217,194,0.08)"
            : "1px solid transparent",
        }}
      >
        <button
          type="button"
          onClick={() => scrollTo("#top")}
          data-cursor="top"
          className="text-left text-[0.95rem]"
        >
          <span className="display leading-none tracking-[0.2em] text-cream">
            Coffee. <span className="text-[#e8d9c2cc] leading-none">Dev</span>
          </span>
        </button>

        <nav className="hidden items-center gap-10 md:flex">
          {LINKS.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => go(link.target)}
              data-cursor="go"
              className="group shop-btn relative text-[0.68rem] uppercase tracking-[0.28em] text-crema/70 transition-colors duration-300 hover:text-cream"
            >
              {link.label}
              {/* Underline wipes in from the left. */}
              <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <a
            href="#shop"
            data-cursor="shop"
            className="shop-btn hidden rounded-full border border-[rgba(232,217,194,0.22)] px-6 py-2.5 text-[0.62rem] uppercase tracking-[0.28em] text-crema transition-colors duration-500 hover:border-gold hover:text-gold sm:inline-block"
          >
            Shop now
          </a>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            data-cursor={open ? "close" : "menu"}
            className="flex h-8 w-8 flex-col items-end justify-center gap-1.5 md:hidden"
          >
            <span
              className="h-px bg-crema transition-all duration-300"
              style={{
                width: open ? "20px" : "22px",
                transform: open ? "translateY(3px) rotate(45deg)" : "none",
              }}
            />
            <span
              className="h-px bg-crema transition-all duration-300"
              style={{
                width: open ? "20px" : "14px",
                transform: open ? "translateY(-3px) rotate(-45deg)" : "none",
              }}
            />
          </button>
        </div>
      </header>

      {/* Mobile menu. Framer Motion handles the exit animation, which GSAP
          cannot do for an unmounting React subtree without extra plumbing. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
            exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[49] flex flex-col justify-end bg-[linear-gradient(180deg,#120804_0%,#050302_100%)] px-[clamp(1.25rem,5vw,5.5rem)] pb-24 pt-32 md:hidden"
          >
            <nav className="flex flex-col gap-2">
              {LINKS.map((link, index) => (
                <motion.button
                  key={link.label}
                  type="button"
                  onClick={() => go(link.target)}
                  initial={{ y: 46, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: 0.16 + index * 0.07,
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="display display-md py-1 text-left text-cream"
                >
                  {link.label}
                </motion.button>
              ))}
            </nav>

            <div className="rule my-8" />

            <a
              href="#shop"
              onClick={() => setOpen(false)}
              className="text-[0.68rem] uppercase tracking-[0.3em] text-gold"
            >
              Shop the roast
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
