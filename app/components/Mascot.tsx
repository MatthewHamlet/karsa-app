"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import BottsDefs from "./BottsDefs";

/** The mascot: the robot from `public/botts.svg`, brought to life.
 *  Artwork by Pablo Stanley (Bottts, DiceBear) — free for personal and
 *  commercial use; the original file keeps its licence metadata.
 *
 *  The artwork is inlined (see `BottsDefs`) so its parts are real elements —
 *  an `<img>` would be one opaque box and the eyes could never close.
 *
 *  Two loops run underneath everything and never stop: a slow bob, and a blink
 *  with a long pause and an occasional double. On top of those, an idle action
 *  fires every few seconds. The gap between them is randomised, because an
 *  action on a metronome stops reading as a character and starts reading as a
 *  loading spinner. */

/** The one-off things it does while nobody is asking it for anything.
 *
 *  Each is a different *kind* of movement rather than the same nudge at three
 *  sizes — a lean, a hop, a glance, a wander, and one where it produces a
 *  notepad out of nowhere and writes something down. Five is enough that you
 *  rarely see the same one twice running, which is the whole point. */
type Idle = "tilt" | "peek" | "hop" | "drift" | "note";
const IDLE: Idle[] = ["tilt", "peek", "hop", "drift", "note"];

/** How long each one runs. A wander needs room to go somewhere and come back;
 *  a lean is over almost before you notice it. */
const IDLE_MS: Record<Idle, number> = {
  tilt: 1400,
  peek: 1500,
  hop: 1300,
  drift: 2800,
  note: 3000,
};

/** Blink rhythm for one 7-second cycle: one blink at 40%, a double near the
 *  end. Keyframes rather than timers, so it costs no state and cannot drift. */
const BLINK = {
  scaleY: [1, 1, 0.08, 1, 1, 0.08, 1, 0.08, 1, 1],
  times: [0, 0.38, 0.4, 0.42, 0.82, 0.84, 0.86, 0.88, 0.9, 1],
};

/** Where the eyes sit. The assistant page drives this; on Home it stays put and
 *  only the idle glances move it. */
export type Gaze = "center" | "up" | "down";

const LOOK: Record<Gaze, { x: number; y: number }> = {
  center: { x: 0, y: 0 },
  up: { x: 6, y: -4 },
  down: { x: 0, y: 5 },
};

/** Held expressions. Each one suspends the blink, because a character that
 *  keeps blinking on its usual beat while startled — or while worn out — reads
 *  as unbothered, which is the opposite of the point.
 *
 *  The eyes are two bars, so an expression is just their shape: squashed reads
 *  as a smiling squint, stretched as alarm. Cheap, and it survives being 24px
 *  wide in a corner. */
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
  busy = false,
  idle = true,
}: {
  className?: string;
  gaze?: Gaze;
  mood?: Mood;
  /** Working on something: the bulb runs hot and fast. */
  busy?: boolean;
  /** Whether the occasional tilts and hops run. Off while it is answering —
   *  a character that hops mid-sentence reads as not listening. */
  idle?: boolean;
}) {
  const reduce = useReducedMotion();
  /* `useId` carries colons in React 18+, which are legal in an id but break the
     `url(#…)` that references it — so it is stripped to word characters. */
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const [pending, setPending] = useState<Idle | null>(null);
  const nextRun = useRef<number | undefined>(undefined);
  const endRun = useRef<number | undefined>(undefined);

  /* Randomised on the client only. Picking an action during render would give
     the server one answer and the browser another, and React would report a
     hydration mismatch on a mascot. */
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

  /* The bob never stops, so it lives on its own group; the actions play on a
     second group inside it. Stacking them keeps a hop from cancelling the
     breath halfway through. */
  const bob = reduce
    ? undefined
    : { y: [0, -4, 0], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const } };

  /* Derived, not stored. When `idle` goes false mid-tilt the action has to stop
     at once — but clearing it from an effect means a second render just to
     undo state we can simply decline to read. */
  const act = idle ? pending : null;
  const held = mood === "normal" ? null : EXPRESSION[mood];
  const shocked = mood === "shock";

  const action = (() => {
    if (reduce) return { rotate: 0, x: 0, y: 0, scale: 1 };
    /* Being startled outranks whatever it was doing. */
    if (shocked) return { rotate: 0, x: 0, y: [0, -9, 0, -3, 0], scale: [1, 1.07, 1, 1.02, 1] };
    switch (act) {
      case "tilt":
        return { rotate: [0, -7, 5, 0], x: 0, y: 0, scale: 1 };
      case "hop":
        return { rotate: 0, x: 0, y: [0, -12, 0, -5, 0], scale: [1, 1, 0.96, 1, 1] };
      case "drift":
        /* Wanders off and finds its way back. The rotation lags the movement
           by one keyframe, so it leans into the turn instead of sliding flat. */
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
    : { duration: act === "drift" ? 2.8 : 1.4, ease: [0.32, 0.72, 0, 1] as const };

  return (
    <svg
      viewBox="0 0 180 180"
      role="img"
      aria-label="Arsa"
      className={`shrink-0 overflow-visible ${className}`}
    >
      <BottsDefs uid={uid} />

      {/* No clip path. The artwork shipped with one, which is right for a
          square avatar and wrong the moment the character drifts or produces a
          notepad — both would be sliced off at the frame. */}
      <g>
        <motion.g animate={bob}>
          <motion.g
            animate={action}
            transition={actionTiming}
            style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
          >
            <use transform="translate(6 66)" href={`#sides-cables01-${uid}`} />

            {/* The bulb breathes on its own clock, so the head and the light
                are never quite in step — which is what stops the whole
                character looking like one pulsing object. */}
            <motion.use
              transform="translate(49 -.6)"
              href={`#top-glowingBulb02-${uid}`}
              animate={reduce ? undefined : { opacity: busy ? [0.6, 1, 0.6] : [0.75, 1, 0.75] }}
              transition={
                reduce
                  ? undefined
                  : { duration: busy ? 0.9 : 3.1, repeat: Infinity, ease: "easeInOut" }
              }
            />

            <use transform="translate(25 44)" href={`#head-round01-${uid}`} />
            <use transform="translate(56 128)" href={`#mouth-smile01-${uid}`} />

            {/* Eyes, drawn here rather than pulled from `<defs>`: a `<use>`
                clones its source into a shadow tree, and nothing inside a clone
                can be animated separately. The two green bars have to be
                reachable for any of this to blink. */}
            <g transform="translate(38 76)">
              <rect x="8" y="10" width="88" height="36" rx="4" fill="black" fillOpacity=".8" />

              {/* Blink and look are separate axes on one group: `scaleY` runs
                  forever, `x`/`y` answer to the gaze and the odd glance. Framer
                  transitions them independently, so a blink never interrupts a
                  look and a look never resets the blink. */}
              <motion.g
                animate={
                  reduce
                    ? undefined
                    : held
                      ? { ...held, x: 0, y: 0 }
                      : {
                          scaleY: BLINK.scaleY,
                          scaleX: 1,
                          x: act === "peek" ? [0, -7, 7, 0] : LOOK[gaze].x,
                          y: LOOK[gaze].y,
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
                <rect x="28" y="21" width="10" height="17" rx="2" fill="#5EF2B8" />
                <rect x="66" y="21" width="10" height="17" rx="2" fill="#5EF2B8" />
              </motion.g>

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

        {/* ── Notepad ────────────────────────────────────────────────────
            It has no hands, so nothing picks these up: the pad and pencil
            arrive on their own, the pencil works its way down the page, and
            both go back where they came from. A robot that files a note about
            you is a small joke; a robot that mimes holding a pencil with no
            arms is an unsettling one. */}
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

              {/* The pencil traces the lines it is writing, then lifts. */}
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
