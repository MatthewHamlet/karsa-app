"use client";

import { useState, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import MiniChart from "./MiniChart";
import MoodFace from "./MoodFace";
import ProgressRing from "./ProgressRing";
import Tip from "./Tip";
import { MOOD_BY_KEY } from "../data/mood";
import { MONTH } from "../data/careTrends";
import type { ComplianceDay, Comparison, DayStatus, PeriodDetail } from "../data/careTrends";
import type { StatTone } from "../data/careStats";

/** Warm terracotta for a missed day. Deliberately not the rose the app keeps
 *  for leaving and deleting — a skipped dose is worth noticing, not alarming
 *  about, and a caregiver reading this has usually had a reason. */
const MISSED = "#c9714f";
/** The day that got some of it done. It needs its own colour: folded into
 *  either neighbour, a caregiver who managed two doses of three reads the grid
 *  as a day they failed, or a day they didn't. */
const PARTIAL = "#d9a441";

/* ── Monthly day strip ────────────────────────────────────────────────────── */

type Cell = { key: string; color: string; tip: ReactNode; sr: string };

/** One size for every month grid in the dashboard, whatever sits above it.
 *  Three rows of 29px is what the compliance cards had room for; the mood card
 *  now matches them rather than filling its own leftovers. */
const ROWS = 3;
const ROW_PX = 29;

/** A month of days as a block of colour that fills whatever room is left.
 *
 *  Three rows of ten, and both dimensions stretch: the card's height is fixed
 *  now, so the grid can take the space instead of guarding against it. Fixed
 *  14px tiles left a 34px ribbon adrift in a 120px hole — the same emptiness
 *  the bar charts next door don't have, which is the whole comparison.
 *
 *  Ten columns is also what removes the sideways scroll: thirty days fit, so
 *  there is nothing left to scroll to. And no weekday headers — a column here
 *  is not a weekday, and labelling it as one would be the grid lying. */
function DayStrip({ cells, label }: { cells: Cell[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const columns = Math.ceil(cells.length / ROWS);

  return (
    <ul
      aria-label={label}
      /* `mt-auto`, not `flex-1`: the grid sits on the floor of the card at a
         size it does not negotiate. Left to stretch, it took whatever the text
         above it didn't want — so the mood card, which says less, grew tiles a
         third taller than the two beside it. The slack goes above the grid
         instead, where it reads as breathing room rather than as three cards
         disagreeing about how big a day is. */
      className="mt-auto grid shrink-0 gap-1.5 pt-3"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${ROWS}, ${ROW_PX}px)`,
      }}
    >
      {cells.map((cell, i) => {
        /* The ends of a row push their label inward: the card clips its own
           overflow, so a centred tooltip on the first tile is the one that
           disappears. */
        const column = i % columns;
        const align = column < 2 ? "start" : column > columns - 3 ? "end" : "center";

        return (
          <li
            key={cell.key}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            className="relative"
          >
            {hover === i && <Tip align={align}>{cell.tip}</Tip>}
            <span className="sr-only">{cell.sr}</span>
            <span
              aria-hidden
              className="block h-full w-full rounded-[5px] transition-transform duration-150 hover:scale-110"
              style={{ backgroundColor: cell.color }}
            />
          </li>
        );
      })}
    </ul>
  );
}

/* ── Small parts ──────────────────────────────────────────────────────────── */

function AverageBadge({ label, tone }: { label: string; tone: StatTone }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
      style={{ backgroundColor: `${tone.ink}18`, color: tone.ink }}
    >
      <span aria-hidden className="h-0 w-3 border-t border-dashed" style={{ borderColor: tone.ink }} />
      Rata-rata {label}
    </span>
  );
}

/** The arrow only says which way the number moved. Whether that is good news
 *  depends on the metric — a kilo gained and a point of blood pressure gained
 *  are not the same news — and this card has no business deciding that, so it
 *  stays neutral in colour and lets the caregiver read it. */
function ComparisonBadge({ comparison }: { comparison: Comparison }) {
  const Icon =
    comparison.direction === "up"
      ? ArrowUpRight
      : comparison.direction === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-neutral-600">
      <Icon size={13} strokeWidth={2.6} className="shrink-0 text-neutral-400" />
      {comparison.text}
    </span>
  );
}

const STATUS_LABEL: Record<DayStatus, string> = {
  done: "selesai",
  partial: "sebagian",
  missed: "terlewat",
};

/** A day per dot. Seven get their initials underneath; thirty do not — at that
 *  count the labels turn into a wall and the shape is the whole point. */
function StatusDots({
  days,
  tone,
  unit,
  monthShort = MONTH.short,
}: {
  days: ComplianceDay[];
  tone: StatTone;
  /** "dosis", "porsi makan" — what the two numbers in the tooltip count. */
  unit: string;
  /** The month the day numbers belong to. Real data knows its own month; the
   *  mock does not, so it keeps the constant. */
  monthShort?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const fill = (status: DayStatus) =>
    status === "done" ? tone.ink : status === "missed" ? MISSED : PARTIAL;

  const detail = (day: ComplianceDay) =>
    `${day.done}/${day.target} ${unit} · ${STATUS_LABEL[day.status]}`;

  /* A month is a calendar; a week is already one row and reads fine as one. */
  if (days.length > 7) {
    return (
      <DayStrip
        label={`Kepatuhan harian bulan ${monthShort}`}
        cells={days.map((day) => ({
          key: day.label,
          color: fill(day.status),
          tip: (
            <>
              <span className="text-neutral-400">
                {day.label} {monthShort} ·{" "}
              </span>
              {detail(day)}
            </>
          ),
          sr: `${day.label} ${monthShort}: ${detail(day)}`,
        }))}
      />
    );
  }

  return (
    <ul className="mt-auto flex gap-1.5 pt-4">
      {days.map((day, i) => (
        <li
          key={day.label}
          onPointerEnter={() => setHover(i)}
          onPointerLeave={() => setHover(null)}
          className="relative min-w-0 flex-1"
        >
          {hover === i && (
            <Tip align={i === 0 ? "start" : i === days.length - 1 ? "end" : "center"}>
              <span className="text-neutral-400">{day.label} · </span>
              {detail(day)}
            </Tip>
          )}

          {/* The reading in words, for anyone not reading the colour. */}
          <span className="sr-only">
            {day.label}: {detail(day)}
          </span>

          <span
            aria-hidden
            className="block h-2 rounded-full transition-transform duration-150 hover:scale-110"
            style={{ backgroundColor: fill(day.status) }}
          />
          <span
            aria-hidden
            className="mt-1.5 block text-center text-[10.5px] leading-3 text-neutral-500"
          >
            {day.label.slice(0, 2)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ── Bodies ───────────────────────────────────────────────────────────────── */

function ChartBody({
  detail,
  tone,
  title,
}: {
  detail: PeriodDetail;
  tone: StatTone;
  title: string;
}) {
  const series = detail.series!;
  const { points } = series;

  /* Seven labels fit under the chart; thirty do not, so a month shows only the
     ends and the middle — enough to place a reading in time. */
  const ticks =
    points.length <= 7
      ? points.map((p) => p.label)
      : [points[0].label, points[Math.floor(points.length / 2)].label, points.at(-1)!.label];

  return (
    <>
      <AverageBadge label={series.averageLabel} tone={tone} />

      <MiniChart
        series={series}
        kind={detail.chart === "bar" ? "bar" : detail.chart === "dualLine" ? "dualLine" : "line"}
        tone={tone}
        label={title}
        className="mt-3 h-[72px]"
      />

      <div className="mt-1.5 flex justify-between text-[10.5px] leading-3 text-neutral-500">
        {ticks.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>

      {detail.chart === "dualLine" && (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0 w-3.5 border-t-2" style={{ borderColor: tone.ink }} />
            Sistolik
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-0 w-3.5 border-t-2 border-dashed"
              style={{ borderColor: `${tone.ink}88` }}
            />
            Diastolik
          </span>
        </p>
      )}

      {detail.comparison && (
        <p className="mt-2.5">
          <ComparisonBadge comparison={detail.comparison} />
        </p>
      )}
    </>
  );
}

function ComplianceBody({
  detail,
  tone,
  unit,
  monthShort,
}: {
  detail: PeriodDetail;
  tone: StatTone;
  /** "dosis", "porsi" — what is being counted. */
  unit: string;
  monthShort?: string;
}) {
  const { done, target, days } = detail.compliance!;
  const pct = Math.round((done / target) * 100);

  /* Stats keep their natural height and the grid takes everything left over,
     so the slack ends up inside the drawing rather than as a hole above it. */
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4">
        <ProgressRing
          value={pct}
          className="h-[64px] w-[64px] xl:h-[70px] xl:w-[70px]"
          color={tone.ink}
          track={`${tone.ink}1f`}
        />

        <div className="min-w-0">
          <p className="text-[24px] font-extrabold leading-none tracking-tight text-neutral-900 xl:text-[26px]">
            {done}
            <span className="ml-1.5 text-[14px] font-semibold text-neutral-500">
              dari {target}
            </span>
          </p>
          <p className="mt-1.5 text-[13px] leading-5 text-neutral-600">{unit} tercatat</p>
          {detail.comparison && (
            <p className="mt-1.5">
              <ComparisonBadge comparison={detail.comparison} />
            </p>
          )}
        </div>
      </div>

      <StatusDots days={days} tone={tone} unit={unit} monthShort={monthShort} />
    </div>
  );
}

function MoodBody({ detail, monthShort = MONTH.short }: { detail: PeriodDetail; monthShort?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const { dominant, dominantDays, days } = detail.mood!;
  const mood = MOOD_BY_KEY[dominant];
  const dense = days.length > 7;

  return (
    <div className="flex h-full flex-col">
      <div>
        <p className="text-[20px] font-extrabold leading-tight tracking-tight text-neutral-900 xl:text-[22px]">
          Dominan: {mood.label}
        </p>
        <p className="mt-1.5 text-[13px] leading-5 text-neutral-600">
          {dominantDays} dari {days.length} hari
        </p>
      </div>

      {dense ? (
        /* A month of faces is unreadable at this size, so the month becomes a
           calendar of colour — the same information, read as a shape. On this
           card the grid is the point rather than a footnote: it is the only
           place a caregiver can see a bad week sitting next to a good one. */
        <DayStrip
          label={`Suasana hati harian bulan ${monthShort}`}
          cells={days.map((day) => ({
            key: day.label,
            color: MOOD_BY_KEY[day.mood].color,
            tip: (
              <>
                <span className="text-neutral-400">
                  {day.label} {monthShort} ·{" "}
                </span>
                {MOOD_BY_KEY[day.mood].label}
              </>
            ),
            sr: `${day.label} ${monthShort}: ${MOOD_BY_KEY[day.mood].label}`,
          }))}
        />
      ) : (
        <ul className="mt-auto flex gap-1 pt-4">
          {days.map((day, i) => (
            <li
              key={day.label}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              className="relative min-w-0 flex-1"
            >
              {hover === i && (
                <Tip align={i === 0 ? "start" : i === days.length - 1 ? "end" : "center"}>
                  {MOOD_BY_KEY[day.mood].label}
                </Tip>
              )}
              <span className="sr-only">
                {day.label}: {MOOD_BY_KEY[day.mood].label}
              </span>
              <MoodFace
                mood={day.mood}
                className="mx-auto h-7 w-7 transition-transform duration-150 hover:scale-110"
              />
              <span
                aria-hidden
                className="mt-1 block text-center text-[10.5px] leading-3 text-neutral-500"
              >
                {day.label.slice(0, 2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One card's body for a week or a month. Which shape it takes is the metric's
 *  own business — a temperature wants a curve, a dose wants a tally, and a
 *  feeling wants neither. */
export default function StatPeriodBody({
  detail,
  tone,
  title,
  unit = "catatan",
  monthShort,
}: {
  detail: PeriodDetail;
  tone: StatTone;
  title: string;
  unit?: string;
  monthShort?: string;
}) {
  if (detail.chart === "compliance") {
    return <ComplianceBody detail={detail} tone={tone} unit={unit} monthShort={monthShort} />;
  }
  if (detail.chart === "mood") return <MoodBody detail={detail} monthShort={monthShort} />;
  return <ChartBody detail={detail} tone={tone} title={title} />;
}
