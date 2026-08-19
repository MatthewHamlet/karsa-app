"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { MascotState } from "../data/mascot";

/** The mascot, built from rounded CSS geometry rather than drawn paths.
 *
 *  Deliberately not an inline illustration: at this size a hand-authored face
 *  has to be *right*, and a face that is nearly right is worse than one that is
 *  plainly a character. Circles, a gradient and two eyes read as friendly at any
 *  scale, and every state is then a transform on real elements — which is also
 *  what lets the eyes actually look somewhere.
 *
 *  Keeps the identity the rest of the app already uses: karsa green, a sprout. */

const EYE = "absolute top-1/2 h-[22%] w-[13%] -translate-y-1/2 rounded-full bg-karsa-dark";

/** Where the eyes point in each state. Thinking looks up and away, the way
 *  anyone does while working something out; presenting looks down at the cards. */
const GAZE: Record<MascotState, { x: string; y: string }> = {
  idle: { x: "0%", y: "0%" },
  thinking: { x: "18%", y: "-22%" },
  presenting: { x: "0%", y: "26%" },
};

export default function MascotAvatar({
  state,
  className = "",
}: {
  state: MascotState;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const gaze = GAZE[state];

  const float = reduce
    ? {}
    : {
        idle: { y: [0, -8, 0] },
        thinking: { y: [0, -3, 0] },
        presenting: { y: 0 },
      }[state];

  const floatTiming = reduce
    ? { duration: 0 }
    : state === "presenting"
      ? { type: "spring" as const, stiffness: 220, damping: 18 }
      : {
          duration: state === "thinking" ? 1.6 : 4.5,
          repeat: Infinity,
          ease: "easeInOut" as const,
        };

  return (
    <div className={`relative grid place-items-center ${className}`}>
      {/* ── Aura ────────────────────────────────────────────────────────────
          Two rings, offset in time so one is always expanding. Only visible
          while thinking — an idle glow would make the resting state look busy.

          Never unmounted, though. Under `AnimatePresence` the `repeat: Infinity`
          that drives the pulse governs the exit too, so the rings never finish
          leaving and the glow stayed on through the answer. Animating to a
          resting target instead lets the pulse simply stop. */}
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

      {/* A soft bed of colour so the character sits in light rather than on a
          flat panel. Warms up while presenting, cools while thinking. */}
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
        animate={float}
        transition={floatTiming}
        className="relative aspect-square w-[68%]"
      >
        {/* Sprout. Two leaves off a stem — the app's mark, at character scale. */}
        <span
          aria-hidden
          className="absolute -top-[15%] left-1/2 h-[16%] w-[2.5%] -translate-x-1/2 rounded-full bg-karsa-dark"
        />
        <motion.span
          aria-hidden
          animate={reduce ? {} : { rotate: state === "thinking" ? [-8, 4, -8] : [-4, 2, -4] }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: state === "thinking" ? 1.6 : 4.5, repeat: Infinity, ease: "easeInOut" }
          }
          style={{ transformOrigin: "bottom right" }}
          className="absolute -top-[24%] left-[30%] h-[14%] w-[20%] rounded-bl-full rounded-tr-full bg-karsa"
        />
        <motion.span
          aria-hidden
          animate={reduce ? {} : { rotate: state === "thinking" ? [8, -4, 8] : [4, -2, 4] }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: state === "thinking" ? 1.6 : 4.5, repeat: Infinity, ease: "easeInOut" }
          }
          style={{ transformOrigin: "bottom left" }}
          className="absolute -top-[20%] left-1/2 h-[13%] w-[18%] rounded-br-full rounded-tl-full bg-karsa/80"
        />

        {/* Body. The gradient does the modelling: light from the upper left,
            a darker seat at the bottom, and a glass highlight over the top. */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_24%,#ffffff_0%,#eef2ec_38%,#cfdccb_78%,#b6c8b1_100%)] shadow-[inset_0_-10px_22px_rgba(63,92,70,0.22),inset_0_6px_14px_rgba(255,255,255,0.9),0_18px_40px_-18px_rgba(63,92,70,0.55)] ring-1 ring-karsa/15">
          <span
            aria-hidden
            className="absolute left-[14%] top-[10%] h-[26%] w-[38%] rounded-full bg-white/70 blur-[6px]"
          />
        </div>

        {/* Face. Eyes and blush ride one wrapper so the gaze moves together. */}
        <motion.div
          animate={{ x: gaze.x, y: gaze.y }}
          transition={{ type: "spring", stiffness: 210, damping: 20 }}
          className="absolute inset-0"
        >
          <motion.div
            animate={reduce ? {} : { scaleY: [1, 1, 0.12, 1] }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 5.2, repeat: Infinity, times: [0, 0.93, 0.96, 1] }
            }
            style={{ transformOrigin: "center 46%" }}
            className="absolute inset-0"
          >
            <span aria-hidden className={`${EYE} left-[30%]`} />
            <span aria-hidden className={`${EYE} right-[30%]`} />
          </motion.div>

          <span
            aria-hidden
            className="absolute left-[19%] top-[57%] h-[9%] w-[15%] rounded-full bg-karsa-sand/55 blur-[1px]"
          />
          <span
            aria-hidden
            className="absolute right-[19%] top-[57%] h-[9%] w-[15%] rounded-full bg-karsa-sand/55 blur-[1px]"
          />

          {/* Mouth. A closed curve at rest, an open oval while presenting —
              the difference between listening and having something to say. */}
          <motion.span
            aria-hidden
            animate={
              state === "presenting"
                ? { height: "11%", width: "13%", borderRadius: "999px" }
                : { height: "5%", width: "16%", borderRadius: "0 0 999px 999px" }
            }
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="absolute left-1/2 top-[63%] -translate-x-1/2 bg-karsa-dark/85"
          />
        </motion.div>
      </motion.div>

      {/* Ground shadow. Tightens as the character rises, which is what sells
          the float as height rather than drift. */}
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
