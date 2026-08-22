"use client";

import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** A burst from the bottom edge of the screen.
 *
 *  Fired when something is finished, and gone a second and a half later. It
 *  rises from below rather than falling from above on purpose: falling confetti
 *  reads as a prize being dropped on you, rising confetti reads as the thing you
 *  just did going off. It is also the half of the screen a thumb is already
 *  near, so the celebration happens where the tap happened.
 *
 *  `pointer-events-none` throughout — nothing here can ever intercept a tap on
 *  the task list underneath. */

const COLORS = ["#56785d", "#c98a4a", "#8a76bd", "#3f6a95", "#e0b155", "#b06c34"];

const PIECES = 26;

/** Deterministic per index, not `Math.random()` at render: a server render and
 *  the client's first render must agree, or React replaces the whole burst on
 *  hydration. A cheap hash gives spread without that risk. */
const rand = (seed: number, salt: number) => {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export default function Confetti({ fire }: { fire: number }) {
  const reduce = useReducedMotion();

  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        i,
        /** Clustered toward the middle, thinning at the edges. */
        left: 6 + rand(i, 1) * 88,
        color: COLORS[i % COLORS.length],
        size: 7 + rand(i, 2) * 7,
        rise: 180 + rand(i, 3) * 300,
        drift: (rand(i, 4) - 0.5) * 160,
        spin: (rand(i, 5) - 0.5) * 720,
        delay: rand(i, 6) * 0.18,
        duration: 1.1 + rand(i, 7) * 0.5,
        round: rand(i, 8) > 0.55,
      })),
    [],
  );

  if (reduce) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 h-0 overflow-visible"
    >
      <AnimatePresence>
        {fire > 0 && (
          /* Keyed on the counter so a second tick restarts the burst instead of
             being swallowed while the first is still running. */
          <motion.div key={fire} className="pointer-events-none absolute inset-x-0 bottom-0 h-0">
            {pieces.map((p) => (
              <motion.span
                key={p.i}
                initial={{ opacity: 0, y: 0, x: 0, rotate: 0, scale: 0.6 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: [0, -p.rise, -p.rise + 40],
                  x: [0, p.drift * 0.6, p.drift],
                  rotate: p.spin,
                  scale: [0.6, 1, 1, 0.9],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: [0.15, 0.6, 0.35, 1],
                  times: [0, 0.15, 0.7, 1],
                }}
                style={{
                  left: `${p.left}%`,
                  width: p.size,
                  height: p.round ? p.size : p.size * 0.5,
                  backgroundColor: p.color,
                  borderRadius: p.round ? "9999px" : "2px",
                }}
                className="absolute bottom-2 block"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
