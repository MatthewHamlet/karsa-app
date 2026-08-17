"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BedDouble,
  ChevronDown,
  ChevronRight,
  Droplets,
  Gauge,
  Pill,
  Utensils,
} from "lucide-react";
import Modal from "./Modal";
import { EASE } from "./List";
import { MONTHS, WEEKDAYS } from "../data/dashboard";
import {
  ACTIVITIES_BY_DATE,
  ACTIVITY_MONTH,
  ACTIVITY_TODAY,
  RECENT_ACTIVITIES,
  type ActivityIcon,
  type PatientActivity,
} from "../data/careStats";

const ICON: Record<ActivityIcon, { icon: typeof Pill; bg: string; ink: string }> = {
  medication: { icon: Pill, bg: "#e6e0f7", ink: "#6a58ae" },
  meal: { icon: Utensils, bg: "#f9e2cb", ink: "#b06c34" },
  fluid: { icon: Droplets, bg: "#d5e5f4", ink: "#3f6a95" },
  sleep: { icon: BedDouble, bg: "#dcdef4", ink: "#4a4f8f" },
  vital: { icon: Gauge, bg: "#f9dde3", ink: "#a4495c" },
};

const key = (y: number, m: number, d: number) => `${y}-${m}-${d}`;
const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
/** Monday-first, matching the rest of the app. */
const lead = (y: number, m: number) => (new Date(y, m, 1).getDay() + 6) % 7;

function ActivityRow({ activity }: { activity: PatientActivity }) {
  const { icon: Icon, bg, ink } = ICON[activity.icon];

  return (
    <li>
      <button
        type="button"
        className="group/act flex w-full items-center gap-3.5 rounded-2xl px-3 py-3 text-left outline-none transition-colors duration-200 hover:bg-karsa-canvas/70 focus-visible:ring-2 focus-visible:ring-karsa/40"
      >
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: bg, color: ink }}
        >
          <Icon size={18} strokeWidth={2.1} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-medium text-neutral-800">
            {activity.text}
          </span>
          <span className="block text-[12.5px] tabular-nums text-neutral-500">
            {activity.time}
          </span>
        </span>
        <ChevronRight
          size={17}
          strokeWidth={2}
          className="shrink-0 text-neutral-300 transition-transform duration-200 group-hover/act:translate-x-0.5"
        />
      </button>
    </li>
  );
}

export default function PatientActivities() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(ACTIVITY_MONTH);
  const [picked, setPicked] = useState(ACTIVITY_TODAY);
  const [monthOpen, setMonthOpen] = useState(false);
  const reduce = useReducedMotion();

  const total = daysIn(view.y, view.m);
  const blanks = lead(view.y, view.m);
  const dayList = ACTIVITIES_BY_DATE[key(picked.y, picked.m, picked.d)] ?? [];

  const shift = (step: number) =>
    setView(({ y, m }) => {
      const next = m + step;
      if (next < 0) return { y: y - 1, m: 11 };
      if (next > 11) return { y: y + 1, m: 0 };
      return { y, m: next };
    });

  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-karsa-line sm:p-7 xl:p-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.18em] text-neutral-400">
            Aktivitas pasien
          </p>
          <h2 className="mt-1.5 text-[21px] font-bold leading-7 tracking-tight text-neutral-900 xl:text-[23px]">
            Yang Meimei lakukan
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group/more inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[13px] font-medium text-neutral-500 outline-none transition-colors duration-200 hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
        >
          Lihat semua
          <ArrowRight
            size={13}
            strokeWidth={2.4}
            className="transition-transform duration-200 group-hover/more:translate-x-0.5"
          />
        </button>
      </header>

      <ul className="-mx-3">
        {RECENT_ACTIVITIES.map((activity) => (
          <ActivityRow key={activity.id} activity={activity} />
        ))}
      </ul>

      {/* "See more": a month to pick from, then that day's activities. */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Aktivitas pasien"
        description="Pilih tanggal untuk melihat apa yang terjadi hari itu."
        size="lg"
      >
        <div className="rounded-2xl bg-white p-4 ring-1 ring-karsa-line sm:p-5">
          <div className="relative mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonthOpen((v) => !v)}
              aria-expanded={monthOpen}
              className="inline-flex items-center gap-2 rounded-lg px-1 py-1 text-[16px] font-bold text-neutral-900 outline-none transition-colors hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
            >
              {MONTHS[view.m]} {view.y}
              <ChevronDown size={16} strokeWidth={2.4} className="text-neutral-400" />
            </button>

            {monthOpen && (
              <>
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setMonthOpen(false)}
                  className="fixed inset-0 z-10 cursor-default"
                />
                <ul className="absolute left-0 top-9 z-20 grid max-h-56 w-44 grid-cols-2 gap-1 overflow-y-auto rounded-2xl bg-white p-2 shadow-[0_18px_40px_-20px_rgba(24,32,24,0.5)] ring-1 ring-karsa-line">
                  {MONTHS.map((name, index) => (
                    <li key={name}>
                      <button
                        type="button"
                        onClick={() => {
                          setView((v) => ({ ...v, m: index }));
                          setMonthOpen(false);
                        }}
                        className={`w-full rounded-lg px-2 py-1.5 text-left text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-karsa/40 ${
                          index === view.m
                            ? "bg-karsa-soft font-semibold text-karsa-dark"
                            : "text-neutral-600 hover:bg-karsa-canvas"
                        }`}
                      >
                        {name.slice(0, 3)}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shift(-1)}
                aria-label="Bulan sebelumnya"
                className="grid h-8 w-8 place-items-center rounded-lg text-neutral-500 outline-none transition-colors hover:bg-karsa-canvas focus-visible:ring-2 focus-visible:ring-karsa/40"
              >
                <ChevronDown size={16} strokeWidth={2.5} className="rotate-90" />
              </button>
              <button
                type="button"
                onClick={() => shift(1)}
                aria-label="Bulan berikutnya"
                className="grid h-8 w-8 place-items-center rounded-lg text-neutral-500 outline-none transition-colors hover:bg-karsa-canvas focus-visible:ring-2 focus-visible:ring-karsa/40"
              >
                <ChevronDown size={16} strokeWidth={2.5} className="-rotate-90" />
              </button>
            </div>
          </div>

          <div className="mb-1.5 grid grid-cols-7">
            {WEEKDAYS.map((day) => (
              <span
                key={day}
                className="text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-400"
              >
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: blanks }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: total }, (_, i) => i + 1).map((day) => {
              const isPicked =
                picked.y === view.y && picked.m === view.m && picked.d === day;
              const has = Boolean(ACTIVITIES_BY_DATE[key(view.y, view.m, day)]);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setPicked({ y: view.y, m: view.m, d: day })}
                  aria-pressed={isPicked}
                  className={`relative mx-auto grid aspect-square w-full max-w-[40px] place-items-center rounded-full text-[13.5px] font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
                    isPicked
                      ? "bg-karsa text-white"
                      : "text-neutral-600 hover:bg-karsa-canvas"
                  }`}
                >
                  <span className="leading-none tabular-nums">{day}</span>
                  {has && !isPicked && (
                    <span className="absolute bottom-[3px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-karsa-sand" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <motion.div
          key={`${picked.y}-${picked.m}-${picked.d}`}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.22, ease: EASE }}
          className="mt-5"
        >
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase leading-4 tracking-[0.16em] text-neutral-400">
            {picked.d} {MONTHS[picked.m]} {picked.y}
          </p>

          {dayList.length > 0 ? (
            <ul className="rounded-2xl bg-white p-2 ring-1 ring-karsa-line">
              {dayList.map((activity) => (
                <ActivityRow key={activity.id} activity={activity} />
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl bg-white px-4 py-7 text-center text-[14px] text-neutral-500 ring-1 ring-karsa-line">
              Tidak ada aktivitas tercatat di tanggal ini.
            </p>
          )}
        </motion.div>
      </Modal>
    </section>
  );
}
