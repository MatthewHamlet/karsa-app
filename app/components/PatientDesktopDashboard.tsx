"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Mic, Zap } from "lucide-react";
import Mascot, { type Mood } from "./Mascot";
import RoomScene from "./RoomScene";
import {
  AFFIRMATION,
  ENERGY_TARGET,
  MASCOT_LINES,
  PATIENT_TASKS,
  type PatientTask,
} from "../data/patient";

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

export default function PatientDesktopDashboard() {
  const reduce = useReducedMotion();
  const [tasks, setTasks] = useState<PatientTask[]>(PATIENT_TASKS);
  const [talking, setTalking] = useState(false);

  const energy = useMemo(
    () => tasks.reduce((sum, task) => (task.done ? sum + task.points : sum), 0),
    [tasks],
  );
  const pct = Math.min(100, Math.round((energy / ENERGY_TARGET) * 100));
  const left = tasks.filter((task) => !task.done).length;

  /* The mascot's face is the day's only summary. Nothing prints a score at the
     patient — the expression is the feedback, and it never goes below "tired",
     because a character that looks disappointed in someone for missing a walk
     is a character that makes them stop opening the app. */
  const mood: Mood = pct >= 70 ? "happy" : pct >= 34 ? "normal" : "tired";
  const line = pct >= 70 ? MASCOT_LINES.high : pct >= 34 ? MASCOT_LINES.mid : MASCOT_LINES.low;

  const toggle = (id: string) =>
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    );

  return (
    <div className="w-full px-4 pb-10 pt-6 sm:px-6 lg:h-full lg:min-h-0 lg:overflow-hidden lg:px-8 lg:pb-8 lg:pt-8 xl:px-10">
      {/* Centre 45–48% of the window, feed 32–34%. Fractions rather than fixed
          pixels, so the split holds from a small laptop to a wide display
          instead of the feed eating the room. `min-h-0` on the grid is what
          lets a child scroll: without it a grid row is floored at its content
          height and the overflow lands on the page instead. */}
      <div className="grid gap-6 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)] lg:gap-8 xl:gap-10">
        {/* ── CENTRE · Karsa's room, and the two things you can do ─────────
            `justify-between`: the room takes whatever height is left and the
            stack below is pinned to the bottom edge, so the button sits in the
            same place on every display rather than floating up on tall ones. */}
        <section className="relative flex min-w-0 flex-col lg:h-full lg:min-h-0 lg:justify-between">
          {/* No card, no ring. Two intersected linear masks — one down, one
              across — so every edge reaches zero inside the layer and there is
              no line anywhere for the eye to catch on. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-4 -bottom-6 -top-8 overflow-hidden sm:-inset-x-6 lg:-inset-x-8 lg:-top-8"
            style={{
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, #000 14%, #000 60%, transparent 100%), linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, transparent 0%, #000 14%, #000 60%, transparent 100%), linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)",
              WebkitMaskComposite: "source-in",
              maskComposite: "intersect",
            }}
          >
            <div className="absolute inset-0 bg-[#fdf8f0]" />
            <RoomScene />
          </div>

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

            <div className="flex min-h-0 flex-1 items-center justify-center">
              <Mascot
                className="h-56 w-56 lg:h-full lg:max-h-[30rem] lg:w-auto"
                mood={mood}
              />
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
            <div className="rounded-3xl bg-white/70 p-4 shadow-[0_1px_2px_rgba(24,32,24,0.04),0_18px_36px_-24px_rgba(24,32,24,0.45)] ring-1 ring-white/70 backdrop-blur-md lg:p-5">
              <div className="flex items-center gap-3.5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-nut-100 text-2xl lg:h-14 lg:w-14 lg:text-[26px]">
                  💌
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                    Pesan dari {AFFIRMATION.relation} — {AFFIRMATION.from}
                  </span>
                  <span className="mt-1 block text-[16px] font-bold leading-6 text-neutral-800 lg:text-[17px]">
                    {AFFIRMATION.text}
                  </span>
                </span>
              </div>
            </div>

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
        <section className="flex min-w-0 flex-col lg:h-full lg:min-h-0">
          <div className="shrink-0">
            <h1 className="text-[24px] font-bold tracking-tight text-neutral-900 xl:text-[27px]">
              Tugas Hari Ini
            </h1>
            {/* Counts down rather than up. "3 lagi" is a finish line; "1 dari 7
                selesai" is a report card, and this screen does not grade. */}
            <p className="mt-1 text-[16px] text-neutral-500">
              {left === 0 ? "Semua sudah selesai. Istirahat, ya." : `${left} lagi hari ini`}
            </p>

            <div className="mt-4 rounded-3xl bg-white/70 p-4 ring-1 ring-white/70 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Zap size={20} strokeWidth={2.6} className="text-karsa" aria-hidden />
                <span className="flex-1 text-[15px] font-bold text-neutral-800">
                  Energi Sehat Hari Ini
                </span>
                <span className="text-[16px] font-extrabold tabular-nums text-karsa-dark">
                  {energy} / {ENERGY_TARGET}
                </span>
              </div>

              <div
                role="progressbar"
                aria-valuenow={energy}
                aria-valuemin={0}
                aria-valuemax={ENERGY_TARGET}
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
          <ul className="scrollbar-slim mt-4 flex flex-col gap-3.5 lg:min-h-0 lg:flex-1 lg:-mx-1 lg:overflow-y-auto lg:px-1 lg:pb-1">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`flex shrink-0 items-center justify-between gap-3 rounded-3xl px-5 py-4 ring-1 transition-colors duration-200 ${
                  task.done
                    ? "bg-karsa-soft/60 ring-act-edge"
                    : "bg-white ring-karsa-line hover:ring-karsa/40"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-karsa-canvas text-[26px]">
                    {task.emoji}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-[17px] font-bold leading-6 ${
                        task.done ? "text-neutral-400 line-through" : "text-neutral-900"
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="mt-0.5 truncate text-[14.5px] text-neutral-500">{task.detail}</p>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-karsa-soft px-2.5 py-0.5 text-[12.5px] font-bold text-karsa-dark">
                      +{task.points} ⚡
                    </span>
                  </div>
                </div>

                {/* The whole square is the target, and it is 56px — a thumb or
                    an unsteady hand hits it without aiming. */}
                <button
                  type="button"
                  onClick={() => toggle(task.id)}
                  aria-pressed={task.done}
                  aria-label={`${task.done ? "Batalkan" : "Selesaikan"} ${task.title}`}
                  className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl shadow-[0_6px_16px_-8px_rgba(24,32,24,0.4)] outline-none transition-[background-color,color,transform] duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-karsa focus-visible:ring-offset-2 active:scale-90 motion-reduce:transition-none motion-reduce:hover:scale-100 ${
                    task.done
                      ? "bg-karsa text-white"
                      : "bg-karsa-soft text-karsa-dark hover:bg-karsa hover:text-white"
                  }`}
                >
                  <Check size={26} strokeWidth={3} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
