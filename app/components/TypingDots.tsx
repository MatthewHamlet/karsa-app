"use client";

import { motion, useReducedMotion } from "framer-motion";


export default function TypingDots({
  name,
  color,
  initial,
}: {

  name?: string;
  color?: string;
  initial?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <li className="mt-2.5 flex gap-2">
      {initial ? (
        <span
          className="grid h-8 w-8 shrink-0 place-items-center self-start rounded-full text-[12px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {initial}
        </span>
      ) : (
        <span aria-hidden className="w-8 shrink-0" />
      )}

      <div className="rounded-2xl rounded-tl-md bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(24,32,24,0.06)] ring-1 ring-karsa-line">

        <span className="sr-only" aria-live="polite">
          {name ? `${name} sedang mengetik` : "Sedang mengetik"}
        </span>

        <span aria-hidden className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block h-[7px] w-[7px] rounded-full bg-neutral-400"
              animate={reduce ? { opacity: 0.55 } : { y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      duration: 1.05,
                      repeat: Infinity,
                      ease: "easeInOut",

                      delay: i * 0.15,
                    }
              }
            />
          ))}
        </span>
      </div>
    </li>
  );
}
