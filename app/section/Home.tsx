"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Clock, HeartPulse, Plus, Sparkles } from "lucide-react";

import Mascot from "../components/Mascot";
import MoodFace from "../components/MoodFace";
import ProgressRing from "../components/ProgressRing";
import TodayMood from "../components/TodayMood";
import RoomScene from "../components/RoomScene";
import Panel from "../components/Panel";
import TaskItem from "../components/TaskItem";
import ActivityItem from "../components/ActivityItem";
import Calendar, { type Selection } from "../components/Calendar";
import ScheduleItem from "../components/ScheduleItem";
import PatientSwitcher from "../components/PatientSwitcher";
import { EASE } from "../components/List";
import {
  ACTIVITIES,
  MONTHS,
  NOW_TIME,
  SCHEDULE,
  SUMMARY,
  TASKS,
  TODAY,
  dayKey,
} from "../data/dashboard";

const DAYS_FULL = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const todayLabel = `${DAYS_FULL[new Date(TODAY.y, TODAY.m, TODAY.d).getDay()]}, ${TODAY.d} ${
  MONTHS[TODAY.m]
} ${TODAY.y}`;

/** How many pending tasks the card shows before deferring to the full list. */
const VISIBLE_TASKS = 3;
/** Long enough for the strike-through to finish drawing before the row goes. */
const STRIKE_MS = 520;

export default function Homepage() {
  const [completed, setCompleted] = useState<string[]>(() =>
    TASKS.filter((task) => task.done).map((task) => task.id),
  );
  /** Ticked, striking through, not yet removed. */
  const [striking, setStriking] = useState<string[]>([]);
  const [selected, setSelected] = useState<Selection>({ ...TODAY });
  const reduce = useReducedMotion();

  /** Completed tasks are hidden — the card is a list of what's left to do. */
  const pending = TASKS.filter((task) => !completed.includes(task.id));
  const done = completed.length + striking.length;
  const progress = Math.round((done / TASKS.length) * 100);

  const events = SCHEDULE[dayKey(selected.y, selected.m, selected.d)] ?? [];
  const isSelectedToday =
    selected.y === TODAY.y && selected.m === TODAY.m && selected.d === TODAY.d;

  const complete = (id: string) => {
    if (striking.includes(id) || completed.includes(id)) return;

    setStriking((prev) => [...prev, id]);
    window.setTimeout(
      () => {
        setCompleted((prev) => [...prev, id]);
        setStriking((prev) => prev.filter((taskId) => taskId !== id));
      },
      reduce ? 0 : STRIKE_MS,
    );
  };

  return (
    /* Same rest at the foot of the page as every other route — see Care. */
    <div className="w-full px-4 pb-10 pt-20 sm:px-6 md:px-8 md:pt-10 xl:pb-12 xl:pl-12 xl:pr-6 xl:pt-12">
      {/* No colour band on Home: the mascot's room is this page's colour, and
          stacking a second coloured field above it only crowded the top. */}
      {/* No max-width: the content owns the whole area beside the rail. The
          side column widens with the viewport so the left one never sprawls. */}
      {/* Every track is `minmax(0,…)`, never `1fr` or `auto`. Both of those are
          floored at the items' min-content width, so one unshrinkable child —
          here a fixed-size progress ring inside a flex row — widened the track
          past the page and gave the phone a sideways scroll. */}
      <div className="grid items-start gap-6 grid-cols-[minmax(0,1fr)] md:gap-8 lg:grid-cols-[minmax(0,1fr)_316px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_336px] xl:gap-12 2xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* ── Left column ─────────────────────────────────────────────── */}
        <div className="@container min-w-0 space-y-6 md:space-y-7 xl:space-y-8">
          {/* Greeting — deliberately not a card. The room is its own warm
              background and melts into the page at the bottom, so the mascot
              reads as standing in the environment rather than inside a box.
              The mascot always sits left of the copy; it never stacks. */}
          <section className="relative pb-12 pt-6 sm:pb-12 sm:pt-6 xl:pb-14">
            {/* A radial mask instead of a straight one: it softens the sides
                and top as well as the bottom, so the room has no edges at all
                and simply dissolves before the next section starts. The layer
                reaches past the column into the gutter, which puts the fade
                outside the mascot rather than across it. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 right-0 -top-16 -bottom-4 overflow-hidden"
              style={{
                // Two linear fades intersected: one top-to-bottom, one
                // left-to-right. Both reach zero inside the layer, so every
                // edge dissolves and none of them can show a cut.
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, #000 20%, #000 56%, transparent 100%), linear-gradient(to right, transparent 0%, #000 12%, #000 74%, transparent 99%)",
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, #000 20%, #000 56%, transparent 100%), linear-gradient(to right, transparent 0%, #000 12%, #000 74%, transparent 99%)",
                WebkitMaskComposite: "source-in",
                maskComposite: "intersect",
              }}
            >
              <div className="absolute inset-0 bg-[#fdf8f0]" />
              <RoomScene />
            </div>

            {/* The mascot sits left of the copy at every size and never
                stacks. That costs the heading width on a phone, which is why
                both are held to sizes that fit 343px on one line — a greeting
                that wraps after the comma is worse than a smaller one. */}
            <div className="relative flex items-center justify-center gap-4 text-left sm:gap-8 xl:gap-10">
              <Mascot className="h-28 w-28 shrink-0 sm:h-32 sm:w-32 xl:h-40 xl:w-40" />

              <div className="min-w-0">
                <p className="text-[14px] font-medium text-neutral-500 xl:text-sm">
                  {todayLabel}
                </p>
                <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-4xl xl:text-[44px]">
                  Howdy, Meimei!
                </h1>

                <ul className="mt-4 space-y-2 xl:mt-5">
                  <li className="flex items-center gap-2.5 text-[15.5px] text-neutral-600 xl:text-[17px]">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600 xl:h-7 xl:w-7">
                      <HeartPulse size={14} strokeWidth={2.6} />
                    </span>
                    <span className="font-semibold text-neutral-800">Kondisi baik</span>
                    <span className="inline-flex items-center gap-1 text-[13px] tabular-nums text-neutral-400">
                      <Clock size={13} strokeWidth={2.4} />
                      {NOW_TIME}
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5 text-[15.5px] text-neutral-600 xl:text-[17px]">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-karsa-soft text-karsa-dark xl:h-7 xl:w-7">
                      <Check size={14} strokeWidth={3} />
                    </span>
                    Tidak ada keluhan baru
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Tasks, with today's mood alongside — the sketch's pairing. */}
          <div className="grid gap-6 grid-cols-[minmax(0,1fr)] @3xl:grid-cols-[minmax(0,1.6fr)_minmax(0,0.85fr)]">
            <Panel
              eyebrow="Tugas harian"
              title="Tugas Kamu"
              tone="sand"
              className="flex flex-col"
              bodyClassName="flex flex-1 flex-col"
              action={
                <Link
                  href="/care"
                  className="group/more inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[13px] font-medium text-neutral-500 outline-none transition-colors duration-200 hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
                >
                  Lihat semua
                  <ArrowRight
                    size={13}
                    strokeWidth={2.4}
                    className="transition-transform duration-200 group-hover/more:translate-x-0.5"
                  />
                </Link>
              }
            >
              {/* Asymmetric on purpose: the list reads left, the ring is the
                  card's headline statistic on the right. */}
              <div className="flex flex-1 items-center gap-4 sm:gap-5 @3xl:gap-7">
                {/* Fixed to three rows so the card never resizes as tasks are
                    ticked off, and the ring keeps its size and its place. */}
                <ul className="h-[186px] min-w-0 flex-1 divide-y divide-edge-sand border-y border-edge-sand sm:h-[147px]">
                  <AnimatePresence initial={false}>
                    {pending.slice(0, VISIBLE_TASKS).map((task) => (
                      <TaskItem
                        key={task.id}
                        label={task.label}
                        hint={task.hint}
                        done={striking.includes(task.id)}
                        onToggle={() => complete(task.id)}
                      />
                    ))}
                  </AnimatePresence>
                </ul>

                <ProgressRing
                  value={progress}
                  label={`${done}/${TASKS.length}`}
                  className="h-[124px] w-[124px] @md:h-[136px] @md:w-[136px] @3xl:h-[168px] @3xl:w-[168px]"
                />
              </div>
            </Panel>

            <TodayMood />
          </div>

          {/* Activity */}
          <Panel
            eyebrow="Sudah terjadi"
            title="Aktivitas"
            tone="sky"
            action={
              <button
                type="button"
                className="group/all inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-karsa-dark outline-none transition-colors hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-karsa/40"
              >
                Lihat semua
                <ArrowRight
                  size={15}
                  strokeWidth={2.5}
                  className="transition-transform duration-200 group-hover/all:translate-x-0.5"
                />
              </button>
            }
          >
            <ul>
              {ACTIVITIES.map((activity, i) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  isLast={i === ACTIVITIES.length - 1}
                />
              ))}
            </ul>
          </Panel>

          {/* AI summary of yesterday */}
          <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-karsa to-karsa-dark p-7 text-white shadow-[0_14px_32px_-22px_rgba(63,92,70,0.85)] sm:p-8 xl:p-10">
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            />

            <header className="relative mb-4 flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70 xl:text-xs">
                <Sparkles size={15} strokeWidth={2.4} />
                Ringkasan AI
              </p>
              <span className="rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-bold text-white/90">
                {SUMMARY.label}
              </span>
            </header>

            <h2 className="relative text-[22px] font-bold leading-7 xl:text-[26px] xl:leading-8">
              {SUMMARY.headline}
            </h2>

            {/* The two faces from the sketch, sitting in the corner. */}
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-3 right-5 hidden items-end gap-2 sm:flex xl:bottom-4 xl:right-8"
            >
              <MoodFace mood="good" className="h-16 w-16 xl:h-20 xl:w-20" />
              <Mascot className="h-32 w-32 xl:h-40 xl:w-40" />
            </div>

            <ul className="relative mt-4 max-w-[calc(100%-13rem)] space-y-2.5 xl:max-w-[calc(100%-16rem)]">
              {SUMMARY.points.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-[15.5px] leading-6 text-white/85 xl:text-[17px]"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-karsa-sand" />
                  {point}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* ── Right column ────────────────────────────────────────────── */}
        {/* Pinned and full-height so the month and the day's schedule are both
            on screen at once — picking a date never means scrolling to find
            out what's on it. `min-h` is the floor the calendar actually needs:
            on a short window the page scrolls rather than clipping the grid.
            Below `lg` it unpins and flows with the page. */}
        <aside className="sched-col flex min-w-0 flex-col gap-5 md:gap-6 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:min-h-[730px] xl:top-10 xl:h-[calc(100vh-5rem)] xl:min-h-[790px] xl:gap-7">
          {/* Who this column is about, and the bell. The caregiver's own name
              used to sit here; it lives at the foot of the rail now. */}
          <PatientSwitcher />

          {/* Scheduling */}
          <Panel
            eyebrow="Penjadwalan"
            title="Jadwal"
            tone="lilac"
            className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col"
            bodyClassName="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col"
            action={
              <button
                type="button"
                aria-label="Tambah jadwal"
                className="grid h-9 w-9 place-items-center rounded-lg bg-white/80 text-karsa-dark ring-1 ring-edge-lilac outline-none transition-all duration-200 hover:bg-karsa hover:text-white hover:ring-karsa focus-visible:ring-2 focus-visible:ring-karsa/40 active:scale-95"
              >
                <Plus size={18} strokeWidth={2.6} />
              </button>
            }
          >
            {/* The month grid takes whatever height is going spare; the day
                list under it keeps its own scroll so it's always in view. */}
            <Calendar selected={selected} onSelect={setSelected} className="shrink-0" />

            {/* Bleeds to the card edge, so the divider matches the padding. */}
            <div
              data-divider
              className="-mx-6 my-6 h-px shrink-0 bg-edge-lilac sm:-mx-7 xl:-mx-8"
            />

            <p
              data-day-label
              className="mb-3.5 shrink-0 px-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400 xl:text-xs"
            >
              {isSelectedToday
                ? "Hari ini"
                : `${selected.d} ${MONTHS[selected.m]}`}
            </p>

            {/* Gutters so the cards' hover shadow isn't clipped by the scroll box. */}
            <div className="-mx-2 px-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              {events.length > 0 ? (
                <ul data-schedule-list className="flex flex-col gap-3">
                  {events.map((event) => (
                    <ScheduleItem key={event.id} event={event} />
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl bg-white/60 px-4 py-6 text-center text-sm text-neutral-500">
                  Tidak ada jadwal di tanggal ini.
                </p>
              )}
            </div>

            <button
              type="button"
              data-more
              className="group/more mt-4 flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-semibold text-karsa-dark underline underline-offset-4 outline-none transition-colors hover:text-karsa focus-visible:ring-2 focus-visible:ring-karsa/40 xl:text-sm"
            >
              Lihat jadwal lainnya
              <ArrowRight
                size={15}
                strokeWidth={2.5}
                className="transition-transform duration-200 group-hover/more:translate-x-0.5"
              />
            </button>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
