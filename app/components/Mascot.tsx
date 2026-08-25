"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import BottsDefs from "./BottsDefs";




type Idle = "tilt" | "peek" | "hop" | "drift" | "note";
const IDLE: Idle[] = ["tilt", "peek", "hop", "drift", "note"];


const IDLE_MS: Record<Idle, number> = {
  tilt: 1400,
  peek: 1500,
  hop: 1300,
  drift: 2800,
  note: 3000,
};


const BLINK = {
  scaleY: [1, 1, 0.08, 1, 1, 0.08, 1, 0.08, 1, 1],
  times: [0, 0.38, 0.4, 0.42, 0.82, 0.84, 0.86, 0.88, 0.9, 1],
};


export type Gaze = "center" | "up" | "down";

const LOOK: Record<Gaze, { x: number; y: number }> = {
  center: { x: 0, y: 0 },
  up: { x: 6, y: -4 },
  down: { x: 0, y: 5 },
};


export type Mood = "normal" | "shock" | "happy" | "tired";

const EXPRESSION: Record<Exclude<Mood, "normal">, { scaleY: number; scaleX: number }> = {
  shock: { scaleY: 1.5, scaleX: 1.3 },
  happy: { scaleY: 0.42, scaleX: 1.18 },
  tired: { scaleY: 0.26, scaleX: 0.88 },
};

export default function Mascot({
  className = "h-24 w-24",
  gaze = "center",
  mood = "normal",
  celebrate = 0,
  busy = false,
  thinking = false,
  idle = true,
}: {
  className?: string;
  gaze?: Gaze;
  mood?: Mood;

  celebrate?: number;

  busy?: boolean;

  thinking?: boolean;

  idle?: boolean;
}) {
  const reduce = useReducedMotion();

  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const [pending, setPending] = useState<Idle | null>(null);
  const nextRun = useRef<number | undefined>(undefined);
  const endRun = useRef<number | undefined>(undefined);


  useEffect(() => {
    if (reduce || !idle) return;

    const schedule = () => {
      nextRun.current = window.setTimeout(
        () => {
          const next = IDLE[Math.floor(Math.random() * IDLE.length)];
          setPending(next);
          endRun.current = window.setTimeout(() => setPending(null), IDLE_MS[next]);
          schedule();
        },
        4500 + Math.random() * 5000,
      );
    };

    schedule();
    return () => {
      window.clearTimeout(nextRun.current);
      window.clearTimeout(endRun.current);
    };
  }, [reduce, idle]);

  const [partying, setPartying] = useState(false);
  useEffect(() => {
    if (!celebrate || reduce) return;
    setPartying(true);
    const t = window.setTimeout(() => setPartying(false), 1300);
    return () => window.clearTimeout(t);
  }, [celebrate, reduce]);


  const bob = reduce
    ? undefined
    : { y: [0, -4, 0], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const } };


  const act = idle ? pending : null;

  const held = partying ? null : mood === "normal" ? null : EXPRESSION[mood];
  const shocked = mood === "shock" && !partying;

  const action = (() => {
    if (reduce) return { rotate: 0, x: 0, y: 0, scale: 1 };

    if (shocked) return { rotate: 0, x: 0, y: [0, -9, 0, -3, 0], scale: [1, 1.07, 1, 1.02, 1] };

    if (thinking) {
      return { rotate: [0, -5, 4, -5, 0], x: [0, -3, 2, -3, 0], y: [0, -2, 0, -2, 0], scale: 1 };
    }
    if (partying) {
      return {
        rotate: [0, -9, 9, -5, 0],
        x: 0,
        y: [0, -18, 0, -11, 0],
        scale: [1, 1.07, 1, 1.04, 1],
      };
    }
    switch (act) {
      case "tilt":
        return { rotate: [0, -7, 5, 0], x: 0, y: 0, scale: 1 };
      case "hop":
        return { rotate: 0, x: 0, y: [0, -12, 0, -5, 0], scale: [1, 1, 0.96, 1, 1] };
      case "drift":

        return {
          rotate: [0, -5, 4, -3, 0],
          x: [0, -16, 12, -6, 0],
          y: [0, -10, 6, -12, 0],
          scale: 1,
        };
      default:
        return { rotate: 0, x: 0, y: 0, scale: 1 };
    }
  })();

  const actionTiming = shocked
    ? { duration: 0.7, ease: [0.32, 0.72, 0, 1] as const }
    : thinking
      ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const }
      : partying
        ? { duration: 1.2, ease: [0.32, 0.72, 0, 1] as const }
      : { duration: act === "drift" ? 2.8 : 1.4, ease: [0.32, 0.72, 0, 1] as const };

  return (
    <svg
      viewBox="0 0 180 180"
      role="img"
      aria-label="Arsa"
      className={`shrink-0 overflow-visible ${className}`}
    >
      <BottsDefs uid={uid} />


      <g>
        <motion.g animate={bob}>
          <motion.g
            animate={action}
            transition={actionTiming}
            style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
          >
            <use transform="translate(6 66)" href={`#sides-round-${uid}`} />


            <use transform="translate(49 -.6)" href={`#top-antennaCrooked-${uid}`} />
            <motion.use
              transform="translate(49 -.6)"
              href={`#top-antennaLight-${uid}`}
              animate={reduce ? undefined : { opacity: busy || thinking ? [0.55, 1, 0.55] : [0.72, 1, 0.72] }}
              transition={
                reduce
                  ? undefined
                  : { duration: busy || thinking ? 0.9 : 3.1, repeat: Infinity, ease: "easeInOut" }
              }
            />

            <use transform="translate(25 44)" href={`#head-round01-${uid}`} />

            <g transform="translate(56 128)">
              <AnimatePresence mode="wait" initial={false}>
                {partying ? (
                  <motion.path
                    key="grin"
                    d="M21 3h26a13 13 0 0 1-26 0"
                    fill="black"
                    fillOpacity=".6"
                    initial={reduce ? false : { scaleY: 0.2, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { scaleY: 0.2, opacity: 0 }}
                    transition={
                      reduce ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 17 }
                    }
                    style={{ transformBox: "fill-box", transformOrigin: "top" }}
                  />
                ) : (
                  <motion.g
                    key="smile"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.14 }}
                  >
                    <use href={`#mouth-smile01-${uid}`} />
                  </motion.g>
                )}
              </AnimatePresence>
            </g>


            <g transform="translate(38 76)">
              <rect x="8" y="10" width="88" height="36" rx="4" fill="black" fillOpacity=".8" />


              <motion.g
                animate={
                  reduce
                    ? undefined
                    : held
                      ? { ...held, x: 0, y: 0 }
                      : {
                          scaleY: BLINK.scaleY,
                          scaleX: 1,
                          x: thinking ? [0, 5, -3, 5, 0] : act === "peek" ? [0, -7, 7, 0] : LOOK[gaze].x,
                          y: thinking ? LOOK.up.y : LOOK[gaze].y,
                        }
                }
                transition={
                  reduce
                    ? undefined
                    : held
                      ? { type: "spring", stiffness: 420, damping: 22 }
                      : {
                          scaleY: { duration: 7, repeat: Infinity, times: BLINK.times },
                          scaleX: { duration: 0.3 },
                          x: { duration: 1.4, ease: [0.32, 0.72, 0, 1] },
                          y: { type: "spring", stiffness: 210, damping: 20 },
                        }
                }
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              >
                {partying ? (
                  <>
                    <path
                      d="M27 35 Q33 23 39 35"
                      fill="none"
                      stroke="#5EF2B8"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M65 35 Q71 23 77 35"
                      fill="none"
                      stroke="#5EF2B8"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                    />
                  </>
                ) : (
                  <>
                    <rect x="28" y="21" width="10" height="17" rx="2" fill="#5EF2B8" />
                    <rect x="66" y="21" width="10" height="17" rx="2" fill="#5EF2B8" />
                  </>
                )}
              </motion.g>


              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M83 10h5L76 46h-5z"
                fill="white"
                fillOpacity=".4"
              />

              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M83 10h5L76 46h-5z"
                fill="white"
                fillOpacity=".4"
              />
            </g>
          </motion.g>
        </motion.g>


        <AnimatePresence>
          {act === "note" && !reduce && (
            <motion.g
              key="note"
              initial={{ opacity: 0, scale: 0.5, y: 14, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: -6 }}
              exit={{ opacity: 0, scale: 0.5, y: 14, rotate: -12 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            >
              <rect
                x="134"
                y="84"
                width="42"
                height="52"
                rx="5"
                fill="#fdfaf4"
                stroke="#e0d9c9"
                strokeWidth="2"
              />
              <path
                d="M142 98h26M142 108h26M142 118h16"
                stroke="#c9c1ae"
                strokeWidth="3"
                strokeLinecap="round"
              />


              <motion.g
                animate={{ x: [0, 16, -4, 12, 0], y: [0, 0, 10, 10, 20] }}
                transition={{ duration: 2.2, ease: "easeInOut", delay: 0.25 }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              >
                <path d="M160 74l9 9-14 14-9-9z" fill="#e8b04b" />
                <path d="M146 88l-3 12 12-3z" fill="#3f3a33" />
                <path d="M143 100l1-4 3 3z" fill="#2a2622" />
              </motion.g>
            </motion.g>
          )}
        </AnimatePresence>
      </g>
    </svg>
  );
}
