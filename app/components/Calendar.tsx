"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE, PILL_SPRING } from "./List";
import { MONTHS, dayKey, jakartaToday } from "../lib/care/time";


const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export type Selection = { y: number; m: number; d: number };

type CalendarProps = {
  selected: Selection;
  onSelect: (value: Selection) => void;

  today?: Selection;

  marked?: Set<string>;
  className?: string;
};


function leadingBlanks(y: number, m: number) {
  return (new Date(y, m, 1).getDay() + 6) % 7;
}

const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

export default function Calendar({
  selected,
  onSelect,
  today = jakartaToday(),
  marked,
  className = "",
}: CalendarProps) {
  const [view, setView] = useState({ y: selected.y, m: selected.m });
  const [direction, setDirection] = useState(1);
  const reduce = useReducedMotion();

  const shift = (step: number) => {
    setDirection(step);
    setView(({ y, m }) => {
      const next = m + step;
      if (next < 0) return { y: y - 1, m: 11 };
      if (next > 11) return { y: y + 1, m: 0 };
      return { y, m: next };
    });
  };


  const lead = leadingBlanks(view.y, view.m);
  const total = daysIn(view.y, view.m);
  const prev = view.m === 0 ? { y: view.y - 1, m: 11 } : { y: view.y, m: view.m - 1 };
  const prevTotal = daysIn(prev.y, prev.m);

  const cells = Array.from({ length: 42 }, (_, i) => {
    const offset = i - lead;
    if (offset < 0) return { day: prevTotal + offset + 1, outside: true };
    if (offset >= total) return { day: offset - total + 1, outside: true };
    return { day: offset + 1, outside: false };
  });

  const slide = reduce
    ? { duration: 0 }
    : { duration: 0.24, ease: EASE };

  return (
    <div className={`flex flex-col ${className}`}>
      <header className="mb-5 flex shrink-0 items-center justify-between">
        <p className="text-[17px] font-bold text-neutral-800 xl:text-lg">
          {MONTHS[view.m]} {view.y}
        </p>
        <div className="flex items-center gap-1">
          <NavButton label="Bulan sebelumnya" onClick={() => shift(-1)}>
            <ChevronLeft size={18} strokeWidth={2.5} />
          </NavButton>
          <NavButton label="Bulan berikutnya" onClick={() => shift(1)}>
            <ChevronRight size={18} strokeWidth={2.5} />
          </NavButton>
        </div>
      </header>

      <div className="mb-2.5 grid shrink-0 grid-cols-7">
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            className="text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-400 xl:text-xs"
          >
            {day}
          </span>
        ))}
      </div>


      <div className="relative shrink-0 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${view.y}-${view.m}`}
            initial={reduce ? false : { opacity: 0, x: direction * 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction * -18 }}
            transition={slide}
            className="grid grid-cols-7 gap-y-1"
          >
            {cells.map(({ day, outside }, i) => {
              if (outside) {
                return (
                  <span
                    key={`outside-${i}`}
                    aria-hidden
                    data-day-cell
                    className="mx-auto grid aspect-square w-full max-w-[min(58px,5.1vh)] place-items-center text-[15px] font-medium tabular-nums text-neutral-300 xl:text-base"
                  >
                    {day}
                  </span>
                );
              }

              const isSelected =
                selected.y === view.y && selected.m === view.m && selected.d === day;
              const isToday =
                today.y === view.y && today.m === view.m && today.d === day;
              const hasEvents = marked?.has(dayKey(view.y, view.m, day)) ?? false;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onSelect({ y: view.y, m: view.m, d: day })}
                  aria-current={isToday ? "date" : undefined}
                  aria-pressed={isSelected}
                  data-day-cell


                  className={`group/day relative mx-auto grid aspect-square w-full max-w-[min(58px,5.1vh)] place-items-center rounded-full text-[15px] font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 xl:text-base ${
                    isSelected
                      ? "text-white"
                      : isToday
                        ? "text-neutral-900"
                        : "text-neutral-600 hover:bg-white/70"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId={`day-pill-${view.y}-${view.m}`}
                      transition={reduce ? { duration: 0 } : PILL_SPRING}
                      className="absolute inset-0 rounded-full bg-karsa shadow-[0_4px_10px_-4px_rgba(86,120,93,0.8)]"
                    />
                  )}

                  {!isSelected && isToday && (
                    <span className="absolute inset-0 rounded-full bg-neutral-900/[0.07] transition-colors duration-200 group-hover/day:bg-neutral-900/[0.11]" />
                  )}


                  <span className="relative z-10 leading-none tabular-nums">{day}</span>


                  {hasEvents && !isSelected && (
                    <span className="absolute bottom-[3px] left-1/2 z-10 h-1 w-1 -translate-x-1/2 rounded-full bg-karsa-sand" />
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-lg text-neutral-500 outline-none transition-colors duration-200 hover:bg-white/70 hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40 active:scale-95"
    >
      {children}
    </button>
  );
}
