"use client";

import { motion, useReducedMotion } from "framer-motion";
import MoodFace from "./MoodFace";

/** What the list says once there is nothing left in it.
 *
 *  Shared by both apps so the sentence and the face can never drift apart —
 *  the patient and the caregiver are finishing the same list from two sides,
 *  and being told the same thing is part of that. */
export default function TasksDone({ size = "md" }: { size?: "sm" | "md" }) {
  const reduce = useReducedMotion();
  const big = size === "md";

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 26, delay: 0.15 }
      }
      className={`flex flex-col items-center justify-center text-center ${
        big ? "px-6 py-10" : "px-4 py-6"
      }`}
    >
      {/* A beat of a wobble, then still. Any longer and a face that keeps moving
          starts asking for attention the screen no longer needs. */}
      <motion.span
        aria-hidden
        initial={reduce ? false : { rotate: -12, scale: 0.7 }}
        animate={
          reduce
            ? {}
            : { rotate: [-12, 8, -4, 0], scale: [0.7, 1.15, 0.98, 1] }
        }
        transition={reduce ? { duration: 0 } : { duration: 0.7, delay: 0.2, ease: "easeOut" }}
        className={big ? "block h-14 w-14" : "block h-9 w-9"}
      >
        {/* The app's own drawing, not an emoji. Emoji render as a different
            typeface at a different weight on every platform — this one arrived
            flat and grey on Windows — and this face has to match the five the
            mood picker and the caregiver's dashboard already use, or the app
            has two visual languages for "how is it going". */}
        <MoodFace mood="great" className="h-full w-full" />
      </motion.span>

      <p
        className={`mt-3 font-bold tracking-tight text-neutral-800 ${
          big ? "text-[19px]" : "text-[15px]"
        }`}
      >
        Keren, tugas kamu sudah habis!
      </p>
    </motion.div>
  );
}
