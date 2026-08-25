"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Mascot, { type Gaze } from "./Mascot";
import type { MascotState } from "../data/mascot";




const GAZE: Record<MascotState, Gaze> = {
  idle: "center",
  thinking: "up",
  presenting: "down",
};


type Beat = "math" | "bulb" | "shock";
type Phase = "none" | Beat;

const MATH_MS = 1300;
const BULB_MS = 600;

export const THINK_SEQUENCE_MS = MATH_MS + BULB_MS + 700;


const EQUATIONS = [
  { text: "∫ x² dx", x: "4%", y: "10%", delay: 0 },
  { text: "α + β = ?", x: "68%", y: "4%", delay: 0.12 },
  { text: "√ 2·π", x: "-2%", y: "58%", delay: 0.24 },
  { text: "Σ ƒ(n)", x: "74%", y: "50%", delay: 0.36 },
  { text: "≈ 42 %", x: "34%", y: "-6%", delay: 0.48 },
];

export default function MascotAvatar({
  state,
  className = "",
}: {
  state: MascotState;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [beat, setBeat] = useState<Beat>("math");
  const [seen, setSeen] = useState<MascotState>(state);


  if (state !== seen) {
    setSeen(state);
    setBeat("math");
  }


  useEffect(() => {
    if (state !== "thinking" || reduce) return;

    const timers = [
      window.setTimeout(() => setBeat("bulb"), MATH_MS),
      window.setTimeout(() => setBeat("shock"), MATH_MS + BULB_MS),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [state, reduce]);


  const phase: Phase = state === "thinking" && !reduce ? beat : "none";

  const lean = reduce
    ? {}
    : state === "presenting"
      ? { y: 4, scale: 0.97 }
      : { y: 0, scale: 1 };

  return (
    <div className={`relative grid place-items-center ${className}`}>

      {[0, 0.7].map((delay) => (
        <motion.span
          key={delay}
          aria-hidden
          initial={{ opacity: 0, scale: 0.72 }}
          animate={
            state === "thinking" && !reduce
              ? { opacity: [0, 0.5, 0], scale: [0.72, 1.25, 1.4] }
              : { opacity: 0, scale: 0.72 }
          }
          transition={
            state === "thinking" && !reduce
              ? { duration: 1.9, repeat: Infinity, delay, ease: "easeOut" }
              : { duration: 0.3, ease: "easeOut" }
          }
          className="pointer-events-none absolute aspect-square w-[74%] rounded-full bg-karsa/25 blur-[2px]"
        />
      ))}


      <motion.span
        aria-hidden
        animate={{
          opacity: state === "idle" ? 0.55 : 0.85,
          scale: state === "thinking" ? 1.08 : 1,
        }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="absolute aspect-square w-[92%] rounded-full bg-[radial-gradient(circle_at_32%_28%,#dfead9_0%,#eef2ec_45%,transparent_72%)] blur-xl"
      />

      <motion.div
        animate={lean}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className="relative grid aspect-square w-[78%] place-items-center"
      >
        <Mascot
          className="h-full w-full"
          gaze={GAZE[state]}
          mood={phase === "shock" ? "shock" : "normal"}
          busy={state === "thinking"}

          idle={state === "idle"}
        />
      </motion.div>


      <AnimatePresence>
        {phase === "math" &&
          EQUATIONS.map((eq) => (
            <motion.span
              key={eq.text}
              aria-hidden
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: [0, 1, 1, 0], y: -18, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, delay: eq.delay, ease: "easeOut" }}
              style={{ left: eq.x, top: eq.y }}
              className="pointer-events-none absolute font-mono text-[13px] font-bold text-karsa-dark/45 xl:text-[15px]"
            >
              {eq.text}
            </motion.span>
          ))}
      </AnimatePresence>


      <AnimatePresence>
        {(phase === "bulb" || phase === "shock") && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0, scale: 0.3, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: -6 }}
            transition={{ type: "spring", stiffness: 420, damping: 16 }}
            className="pointer-events-none absolute left-1/2 top-[2%] -translate-x-1/2"
          >
            <svg viewBox="0 0 40 44" className="h-9 w-9 xl:h-11 xl:w-11">
              <g stroke="#e8b04b" strokeWidth="2.6" strokeLinecap="round">
                <path d="M20 3v4M6 9l3 3M34 9l-3 3M3 22h4M33 22h4" />
              </g>
              <circle cx="20" cy="22" r="9.5" fill="#f7d98a" stroke="#e8b04b" strokeWidth="2" />
              <path d="M16 32h8M17 36h6" stroke="#3f3a33" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>


      <motion.span
        aria-hidden
        animate={
          reduce
            ? {}
            : state === "idle"
              ? { scaleX: [1, 0.86, 1], opacity: [0.16, 0.1, 0.16] }
              : { scaleX: 1, opacity: 0.14 }
        }
        transition={
          reduce ? { duration: 0 } : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
        }
        className="absolute bottom-[6%] h-[3%] w-[38%] rounded-[50%] bg-karsa-dark blur-[3px]"
      />
    </div>
  );
}
