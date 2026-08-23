"use client";

import { HeartPulse, Utensils, Footprints } from "lucide-react";

const TONE = {
  care: { icon: Footprints, ring: "bg-karsa-soft text-karsa-dark" },
  health: { icon: HeartPulse, ring: "bg-rose-50 text-rose-500" },
  meal: { icon: Utensils, ring: "bg-amber-50 text-amber-600" },
} as const;

export type ActivityTone = keyof typeof TONE;

/** One line of the activity timeline.
 *
 *  Takes finished strings, not a timestamp. The label is formatted in
 *  Asia/Jakarta by the query that produced it — see `lib/care/time` — because a
 *  `Date` formatted here renders in the server's timezone during SSR and in the
 *  visitor's on hydration, and React calls that a mismatch. */
export type ActivityRow = {
  id: string;
  /** Who did it. */
  actor: string;
  /** What they did, as it follows the name: "menyiapkan sarapan". */
  action: string;
  /** Already formatted: a clock today, a date and clock before that. */
  when: string;
  tone: ActivityTone;
};

type ActivityItemProps = {
  activity: ActivityRow;
  /** The last row stops the timeline instead of trailing into nothing. */
  isLast?: boolean;
};

export default function ActivityItem({ activity, isLast }: ActivityItemProps) {
  const { icon: Icon, ring } = TONE[activity.tone];

  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {/* Timeline spine, tucked behind the icon tiles. */}
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-5 top-11 bottom-1 w-px bg-karsa-line"
        />
      )}

      {/* The ring masks the spine where it passes behind the tile, so it has to
          match the card this list sits on. */}
      <span className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full ring-[3px] ring-tint-sky ${ring}`}>
        <Icon size={18} strokeWidth={2.2} />
      </span>

      <div className="flex min-w-0 flex-1 items-baseline gap-3 pt-1.5">
        <p className="min-w-0 flex-1 text-[16px] leading-6 text-neutral-600 xl:text-[17px]">
          <span className="font-semibold text-neutral-800">{activity.actor}</span>{" "}
          {activity.action}
        </p>
        <time className="shrink-0 text-[13px] font-medium tabular-nums text-neutral-400 xl:text-sm">
          {activity.when}
        </time>
      </div>
    </li>
  );
}
