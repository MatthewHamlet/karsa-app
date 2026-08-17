"use client";

import { motion, useReducedMotion } from "framer-motion";

/** The patient's mascot. Drawn inline so it inherits the Karsa palette and
 *  costs no extra request — swap for artwork when it exists.
 *  Sized by class, not by a pixel prop, so it scales with the breakpoint. */
export default function Mascot({ className = "h-24 w-24" }: { className?: string }) {
  const reduce = useReducedMotion();

  const breathe = reduce
    ? undefined
    : {
        y: [0, -3, 0],
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const },
      };

  return (
    <motion.svg
      viewBox="0 0 120 120"
      role="img"
      aria-label="Maskot Karsa"
      className={`shrink-0 overflow-visible ${className}`}
    >
      {/* Ground shadow stays put while the body floats. */}
      <ellipse cx="60" cy="106" rx="26" ry="5" className="fill-neutral-900/[0.07]" />

      <motion.g animate={breathe}>
        {/* Sprout */}
        <path
          d="M60 30 C60 20 55 13 47 10 C45 20 51 28 60 31 Z"
          className="fill-karsa"
        />
        <path d="M60 34 L60 26" className="stroke-karsa-dark" strokeWidth="2.5" strokeLinecap="round" />

        {/* Body */}
        <circle cx="60" cy="66" r="34" className="fill-karsa-soft" />
        <path
          d="M26 66 a34 34 0 0 0 68 0"
          className="fill-white/60"
        />
        <circle
          cx="60"
          cy="66"
          r="34"
          fill="none"
          className="stroke-karsa/20"
          strokeWidth="1.25"
        />

        {/* Wings */}
        <path d="M28 66 q-8 8 -2 16" className="stroke-karsa/40" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M92 66 q8 8 2 16" className="stroke-karsa/40" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Blush */}
        <ellipse cx="43" cy="70" rx="6" ry="4" className="fill-karsa-sand/60" />
        <ellipse cx="77" cy="70" rx="6" ry="4" className="fill-karsa-sand/60" />

        {/* Eyes */}
        <motion.g
          animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1] }}
          transition={
            reduce
              ? undefined
              : { duration: 5, repeat: Infinity, times: [0, 0.92, 0.95, 1] }
          }
          style={{ transformOrigin: "60px 61px" }}
        >
          <circle cx="50" cy="61" r="3.6" className="fill-karsa-dark" />
          <circle cx="70" cy="61" r="3.6" className="fill-karsa-dark" />
        </motion.g>

        {/* Beak */}
        <path d="M56 72 L64 72 L60 78 Z" className="fill-karsa-sand" />
      </motion.g>
    </motion.svg>
  );
}
