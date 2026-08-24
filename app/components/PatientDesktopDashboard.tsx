"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Mic, Zap } from "lucide-react";
import Mascot, { type Mood } from "./Mascot";
import ParkScene, { ParkBench } from "./ParkScene";
import Confetti from "./Confetti";
import TasksDone from "./TasksDone";
import { EASE } from "./List";
import {
  AFFIRMATION,
  ENERGY_TARGET as DESIGN_TARGET,
  MASCOT_LINES,
  PATIENT_TASKS,
  type PatientTask,
} from "../data/patient";
import { toggleTask } from "../lib/care/actions";
import type { PatientHome } from "../lib/care/queries";

/** Long enough for the line to finish drawing before the row goes. */
const STRIKE_MS = 560;

/** The patient's home screen.
 *
 *  A different product from the rest of this app, for a different person. The
 *  caregiver's screens are instruments — figures, compliance, trends. This one
 *  has three things on it: how the day is going, one message from someone who
 *  loves them, and a handful of things to tick off. Everything is large,
 *  everything is one tap, and nothing reports on them.
 *
 *  ── Two layouts, one component ───────────────────────────────────────────
 *  From `lg` the screen is a fixed frame: the rail, a room that fills the
 *  height, and a task feed beside it. Nothing moves except the feed, which
 *  scrolls inside itself. A home screen that stays put is a home screen you
 *  can learn the shape of — the button is always in the same place, which for
 *  this reader matters more than seeing everything at once.
 *
 *  Below `lg` it is a single scrolling column in the same order. A phone
 *  cannot hold a room and seven tasks at a legible size, and shrinking the
 *  type to make it fit would trade away the one thing this audience needs. */

export default function PatientDesktopDashboard({ home }: { home?: PatientHome | null }) {
  const reduce = useReducedMotion();
  const [tasks, setTasks] = useState<PatientTask[]>(home?.tasks ?? PATIENT_TASKS);
  const [talking, setTalking] = useState(false);
  /** Ticked, striking through, still on screen. */
  const [striking, setStriking] = useState<string[]>([]);
  /** Bumped on every finish; the confetti keys off it. */
  const [burst, setBurst] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const energy = useMemo(
    () => tasks.reduce((sum, task) => (task.done ? sum + task.points : sum), 0),
    [tasks],
  );
  const energyTarget = home?.energyTarget ?? DESIGN_TARGET;
  const pct = Math.min(100, Math.round((energy / energyTarget) * 100));
  const affirmation = home ? home.affirmation : AFFIRMATION;

  /** Done tasks leave the list entirely — the list is what is left to do. */
  const visible = tasks.filter((task) => !task.done);
  /** Counts the strike as already gone, so the number answers the tap at once
   *  while the row is still on its way out. */
  const left = visible.filter((task) => !striking.includes(task.id)).length;

  /* The mascot's face is the day's only summary. Nothing prints a score at the
     patient — the expression is the feedback, and it never goes below "tired",
     because a character that looks disappointed in someone for missing a walk
     is a character that makes them stop opening the app. */
  const mood: Mood = pct >= 70 ? "happy" : pct >= 34 ? "normal" : "tired";
  const line = pct >= 70 ? MASCOT_LINES.high : pct >= 34 ? MASCOT_LINES.mid : MASCOT_LINES.low;

  /** Tick, strike, leave — and confetti as it goes.
   *
   *  Tapping again while the line is still drawing puts the task back. A row
   *  that vanishes on one tap with no way back is a trap for an unsteady hand,
   *  and this window is the undo. */
  const complete = (id: string) => {
    if (striking.includes(id)) {
      setStriking((prev) => prev.filter((taskId) => taskId !== id));
      return;
    }

    setStriking((prev) => [...prev, id]);

    timers.current.push(
      window.setTimeout(
        () => {
          setTasks((prev) =>
            prev.map((task) => (task.id === id ? { ...task, done: true } : task)),
          );
          setStriking((prev) => prev.filter((taskId) => taskId !== id));
          setBurst((n) => n + 1);

          /* Written once the undo window has closed, which is what makes the
             window real: tapping again before the line finishes drawing takes
             the row back and nothing was ever saved. Not awaited — the row is
             already gone, and the next render reads the database. */
          if (!home) return;
          const fd = new FormData();
          fd.set("task_id", id);
          fd.set("patient_id", home.patientId);
          void toggleTask({ error: null }, fd);
        },
        reduce ? 0 : STRIKE_MS,
      ),
    );
  };

  return (
    <div className="relative w-full px-4 pb-10 pt-6 sm:px-6 lg:h-full lg:min-h-0 lg:overflow-hidden lg:px-8 lg:pb-8 lg:pt-8 xl:px-10">
      {/* ── The park, behind the whole screen ────────────────────────────────
          Not just behind the mascot. The tasks live in the same place the
          character does, so the drawing runs the full width of the page and
          the task panel sits on the grass like everything else.

          The scene keeps its own 400:560 proportions rather than stretching to
          the container: a `slice` fit into a very tall box crops the sides and
          throws the trees out of frame. Instead it is pinned to the top at its
          natural aspect and the lawn colour underneath carries on down — the
          bottom edge of the drawing is that exact green, so the seam is
          invisible however far the page scrolls. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 bottom-[calc(var(--bottom-nav)*-1)] overflow-hidden bg-gradient-to-b from-[#6fb86a] from-40% to-[#5c9f59] lg:bottom-0"
      >
        <ParkScene />
      </div>

      {/* Centre 45–48% of the window, feed 32–34%. Fractions rather than fixed
          pixels, so the split holds from a small laptop to a wide display
          instead of the feed eating the room. `min-h-0` on the grid is what
          lets a child scroll: without it a grid row is floored at its content
          height and the overflow lands on the page instead. */}
      <div className="relative grid gap-6 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)] lg:gap-8 xl:gap-10">
        {/* ── CENTRE · Karsa's room, and the two things you can do ─────────
            `justify-between`: the room takes whatever height is left and the
            stack below is pinned to the bottom edge, so the button sits in the
            same place on every display rather than floating up on tall ones. */}
        <section className="relative flex min-h-[calc((100dvh-var(--bottom-nav))*0.6)] min-w-0 flex-col lg:min-h-0 lg:h-full lg:justify-between">
          {/* Hero. `min-h-0` + `h-full` on the mascot: the character is sized
              by the space left over, so it can never be the thing that pushes
              the button off the bottom of the screen. */}
          <div className="relative flex flex-1 flex-col items-center justify-center pb-2 pt-4 lg:min-h-0">
            {/* What Karsa says, only when asked. A greeting that appeared on
                its own would be a notification; this one answers a button. */}
            <AnimatePresence>
              {talking && (
                <motion.p
                  role="status"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.94 }}
                  transition={
                    reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 26 }
                  }
                  className="mb-4 max-w-sm shrink-0 rounded-3xl rounded-bl-lg bg-white/80 px-5 py-4 text-center text-[17px] font-bold leading-6 text-neutral-800 shadow-[0_14px_32px_-18px_rgba(24,32,24,0.55)] ring-1 ring-white/70 backdrop-blur-md"
                >
                  {line}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Karsa, standing in front of the bench.
                The bench is a sibling here rather than part of `ParkScene`
                because it has to keep its footing relative to the *character*,
                whose size and baseline change between breakpoints; the scene's
                viewBox does not know where the mascot ended up. Drawn first, so
                it is behind without needing a z-index. */}
            <div className="flex min-h-0 flex-1 items-end justify-center">
              <div className="relative flex h-60 items-end sm:h-72 lg:h-full lg:max-h-[19rem]">
                {/* Wider than the character by a good margin, or it stops
                    reading as a bench: at 110% the mascot covered it end to end
                    and all that showed was a sliver of armrest. A real bench is
                    about twice as wide as whoever is standing in front of it. */}
                <ParkBench className="absolute bottom-0 left-1/2 h-auto w-[172%] -translate-x-1/2" />
                <Mascot className="relative h-full w-auto" mood={mood} />
              </div>
            </div>
          </div>

          {/* One wrapper, so the card and the button below it cannot drift to
              different widths — they are the same element's children, not two
              things that happen to be styled alike. */}
          <div className="relative mt-6 w-full max-w-md shrink-0 self-center lg:mt-4 lg:max-w-lg">
            {/* ── Affirmation ──────────────────────────────────────────────
                Frosted rather than solid: it sits on the room, and a hard
                white slab would read as a panel dropped on top of the scene
                instead of something resting in it. */}
            {/* Only when somebody has actually written something. An invented
                message of encouragement, signed with a real relative's name, is
                the one thing this screen must never print. */}
            {affirmation && (
              <div className="rounded-3xl bg-white/70 p-4 shadow-[0_1px_2px_rgba(24,32,24,0.04),0_18px_36px_-24px_rgba(24,32,24,0.45)] ring-1 ring-white/70 backdrop-blur-md lg:p-5">
                <div className="flex items-center gap-3.5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-nut-100 text-2xl lg:h-14 lg:w-14 lg:text-[26px]">
                    💌
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                      Pesan dari {affirmation.relation} — {affirmation.from}
                    </span>
                    <span className="mt-1 block text-[16px] font-bold leading-6 text-neutral-800 lg:text-[17px]">
                      {affirmation.text}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* ── The one action ───────────────────────────────────────────
                Opaque, deliberately. The frosting stops here: this is the
                only control on the screen that must be unmistakable, and
                glass over a pale room costs it the contrast that makes it
                readable to the eyes this was built for. */}
            <button
              type="button"
              onClick={() => setTalking((v) => !v)}
              aria-pressed={talking}
              className="mt-3 flex w-full items-center justify-center gap-3 rounded-3xl bg-karsa px-6 py-4 text-[19px] font-bold text-white shadow-[0_18px_40px_-18px_rgba(63,92,70,0.9)] outline-none transition-[background-color,transform] duration-200 hover:bg-karsa-dark hover:scale-[1.015] focus-visible:ring-2 focus-visible:ring-karsa focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100 lg:py-5 lg:text-[21px]"
            >
              <Mic size={24} strokeWidth={2.5} aria-hidden />
              {talking ? "TUTUP OBROLAN" : "TALK TO MASCOT"}
            </button>
          </div>
        </section>

        {/* ── RIGHT · The task feed ────────────────────────────────────────
            Its own region of the page, not a panel sitting on it. There is no
            wrapper card: the heading reads straight off the canvas and each
            task is its own card. A card holding cards gives every row two
            borders and two shadows, and the outer one adds no meaning.

            Two parts: a head that never moves, and a list that scrolls. The
            energy bar belongs to the head because energy is what the list
            below it pays out — it is the total of the ticks, so it reads as
            the column's running score rather than a separate announcement. */}
        {/* No `overflow-x-hidden` here. It clipped at the section's own edge,
            which is exactly where the cards' rings paint — so the list's 4px of
            breathing room bought nothing and every card lost 1px off both sides.
            It also forced `overflow-y` to compute to `auto`, quietly making the
            section a second scroll container beside the list's own. `min-w-0`
            is what actually keeps this column from pushing the page wide. */}
        {/* A frosted pane resting on the lawn, not an opaque slab dropped over
            it. The tint stays warm so the white task cards keep their contrast,
            but it lets enough green through — and casts enough of a shadow —
            that it reads as being in the park rather than in front of a picture
            of one. */}
        <section className="flex min-w-0 flex-col rounded-[28px] bg-[#FBF7EE]/80 p-4 shadow-[0_28px_64px_-34px_rgba(18,44,22,0.7)] ring-1 ring-white/70 backdrop-blur-2xl sm:p-5 lg:h-full lg:min-h-0">
          <div className="shrink-0">
            <h1 className="text-[24px] font-bold tracking-tight text-neutral-900 xl:text-[27px]">
              Tugas Hari Ini
            </h1>
            {/* Counts down rather than up. "3 lagi" is a finish line; "1 dari 7
                selesai" is a report card, and this screen does not grade. */}
            {/* Silent when the list is empty — the card below already says it,
                and saying it twice makes neither line feel meant. */}
            {left > 0 && <p className="mt-1 text-[16px] text-neutral-500">{left} lagi hari ini</p>}

            <div className="mt-4 rounded-3xl bg-white/70 p-4 ring-1 ring-white/70 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Zap size={20} strokeWidth={2.6} className="text-karsa" aria-hidden />
                <span className="flex-1 text-[15px] font-bold text-neutral-800">
                  Energi Sehat Hari Ini
                </span>
                <span className="text-[16px] font-extrabold tabular-nums text-karsa-dark">
                  {energy} / {energyTarget}
                </span>
              </div>

              <div
                role="progressbar"
                aria-valuenow={energy}
                aria-valuemin={0}
                aria-valuemax={energyTarget}
                aria-label="Energi sehat hari ini"
                className="mt-2.5 h-4 overflow-hidden rounded-full bg-karsa/15"
              >
                {/* Width in `style`, eased by CSS — not animated by framer. An
                    animated width has no value until the first frame runs, so
                    the bar painted full before dropping to its real level: a
                    fill that lies for a frame is worse than one that does not
                    move at all. */}
                <div
                  style={{ width: `${pct}%` }}
                  className="h-full rounded-full bg-karsa transition-[width] duration-500 ease-out motion-reduce:transition-none"
                />
              </div>
            </div>
          </div>

          {/* The only scrolling region on the screen. `min-h-0` is load-bearing:
              a flex child's floor is its content, so without it the list would
              refuse to shrink and would push the page taller instead of
              scrolling. Negative margin + padding gives the cards' shadows room
              to render inside the clip. */}
          {/* Spacing lives on each row as bottom padding, not as the list's
              `gap`. A gap belongs to the parent, so a row collapsing to zero
              height still leaves its share of it behind as a ghost; padding
              collapses with the row.

              `-mx-1 px-1` on both the list and the row: `ring` paints *outside*
              the box, so a row that clips its own overflow — which it must, to
              animate its height — would otherwise shave the card's border off. */}
          {/* `pt-1` is not decoration. From `lg` this list is a scroll
              container, and a scroll container clips at its own top edge —
              which is exactly where the first card's ring paints. Four pixels
              of head room is the whole fix. */}
          <ul className="scrollbar-slim -mx-1 mt-4 flex flex-col px-1 pt-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-1">
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map((task) => {
                const going = striking.includes(task.id);

                return (
                  <motion.li
                    key={task.id}
                    layout
                    /* Padding has to go with the height. `box-sizing: border-box`
                       will not compress padding below itself, so a row animated
                       to `height: 0` still occupies its 16px of padding — the
                       row would vanish and leave a gap where it had been. */
                    exit={
                      reduce
                        ? { opacity: 0 }
                        : { height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0 }
                    }
                    transition={reduce ? { duration: 0 } : { duration: 0.3, ease: EASE }}
                    /* Room for the ring on all four sides, not three. The
                       sides and the foot had it; the top had none, so the clip
                       sat exactly on the card's edge and shaved the 1px ring
                       off along the top of every row. Cancelled by matching
                       negative margins, so the padding buys clip room without
                       moving anything. */
                    className="-mx-1 -mt-0.5 shrink-0 overflow-hidden px-1 pb-3.5 pt-0.5"
                  >
                    <div
                      className={`flex items-center justify-between gap-3 rounded-3xl px-5 py-4 ring-1 transition-colors duration-200 ${
                        going
                          ? "bg-karsa-soft/60 ring-act-edge"
                          : "bg-white ring-karsa-line hover:ring-karsa/40"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3.5">
                        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-karsa-canvas text-[26px]">
                          {task.emoji}
                        </span>
                        <div className="min-w-0">
                          {/* The line draws itself across the title rather than
                              snapping on — the drawing is what reads as "done",
                              and it is the beat that covers the row leaving. */}
                          <p
                            className={`relative inline-block text-[17px] font-bold leading-6 transition-colors duration-200 ${
                              going ? "text-neutral-400" : "text-neutral-900"
                            }`}
                          >
                            {task.title}
                            <motion.span
                              aria-hidden
                              initial={false}
                              animate={{ scaleX: going ? 1 : 0 }}
                              transition={
                                reduce ? { duration: 0 } : { duration: 0.3, ease: EASE }
                              }
                              className="absolute left-0 top-1/2 h-[2px] w-full origin-left rounded-full bg-current"
                            />
                          </p>
                          <p className="mt-0.5 truncate text-[14.5px] text-neutral-500">
                            {task.detail}
                          </p>
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-karsa-soft px-2.5 py-0.5 text-[12.5px] font-bold text-karsa-dark">
                            +{task.points} ⚡
                          </span>
                        </div>
                      </div>

                      {/* The whole square is the target, and it is 56px — a thumb
                          or an unsteady hand hits it without aiming. */}
                      <button
                        type="button"
                        onClick={() => complete(task.id)}
                        aria-pressed={going}
                        aria-label={`${going ? "Batalkan" : "Selesaikan"} ${task.title}`}
                        className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl shadow-[0_6px_16px_-8px_rgba(24,32,24,0.4)] outline-none transition-[background-color,color,transform] duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-karsa focus-visible:ring-offset-2 active:scale-90 motion-reduce:transition-none motion-reduce:hover:scale-100 ${
                          going
                            ? "bg-karsa text-white"
                            : "bg-karsa-soft text-karsa-dark hover:bg-karsa hover:text-white"
                        }`}
                      >
                        <Check size={26} strokeWidth={3} aria-hidden />
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>

            {visible.length === 0 && (
              /* Takes the whole space the rows left behind and sits in the
                 middle of it, rather than hanging from the top of an empty
                 column. */
              <li className="flex flex-1 items-center justify-center">
                <TasksDone />
              </li>
            )}
          </ul>
        </section>
      </div>

      <Confetti fire={burst} />
    </div>
  );
}
