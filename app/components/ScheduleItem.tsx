"use client";

import {
  Stethoscope,
  Pill,
  Activity as ActivityIcon,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import type { ScheduleEvent } from "../data/dashboard";

/** Each kind gets its own wash so the list reads at a glance. The edge is a
 *  border rather than a ring: a ring paints outside the box and the scrolling
 *  list around these cards clips it. */
const KIND = {
  appointment: {
    icon: Stethoscope,
    card: "bg-karsa-soft border-karsa/15",
    tile: "bg-karsa text-white",
  },
  meds: {
    icon: Pill,
    card: "bg-karsa-sand/20 border-karsa-sand/40",
    tile: "bg-karsa-sand text-white",
  },
  therapy: {
    icon: ActivityIcon,
    card: "bg-sky-50 border-sky-100",
    tile: "bg-sky-500 text-white",
  },
  checkup: {
    icon: CalendarDays,
    card: "bg-neutral-100 border-neutral-200",
    tile: "bg-neutral-800 text-white",
  },
} as const;

export default function ScheduleItem({ event }: { event: ScheduleEvent }) {
  const { icon: Icon, card, tile } = KIND[event.kind];

  return (
    <li>
      <button
        type="button"
        data-event
        className={`group/event flex w-full items-center gap-3.5 rounded-2xl border p-3 text-left outline-none transition-all duration-200 hover:shadow-[0_6px_18px_-12px_rgba(24,32,24,0.5)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-karsa/40 ${card}`}
      >
        <span
          data-event-tile
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full transition-transform duration-200 group-hover/event:scale-105 ${tile}`}
        >
          <Icon size={21} strokeWidth={2.1} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-semibold text-neutral-800 xl:text-[17px]">
            {event.title}
          </span>
          <span className="block text-[13px] font-medium tabular-nums text-neutral-500 xl:text-sm">
            {event.start} – {event.end}
          </span>
        </span>

        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/70 text-neutral-500 transition-all duration-200 group-hover/event:translate-x-0.5 group-hover/event:text-neutral-800">
          <ChevronRight size={17} strokeWidth={2.4} />
        </span>
      </button>
    </li>
  );
}
