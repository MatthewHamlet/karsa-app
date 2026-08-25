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


function fillOf(status: DayStatus, tone: StatTone): string {
  if (status === "done") return tone.ink;

  if (status === "partial") return `${tone.ink}8c`;

  return tone.tile;
}



type Cell = { key: string; color: string; tip: ReactNode; sr: string };


const ROWS = 3;
const ROW_PX = 29;


function DayStrip({ cells, label }: { cells: Cell[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const columns = Math.ceil(cells.length / ROWS);

  return (
    <ul
      aria-label={label}

      className="mt-auto grid shrink-0 gap-1.5 pt-3"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${ROWS}, ${ROW_PX}px)`,
      }}
    >
      {cells.map((cell, i) => {

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


function StatusDots({
  days,
  tone,
  unit,
  monthShort = MONTH.short,
}: {
  days: ComplianceDay[];
  tone: StatTone;

  unit: string;

  monthShort?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const fill = (status: DayStatus) => fillOf(status, tone);

  const detail = (day: ComplianceDay) =>
    `${day.done}/${day.target} ${unit} · ${STATUS_LABEL[day.status]}`;


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

  unit: string;
  monthShort?: string;
}) {
  const { done, target, days } = detail.compliance!;
  const pct = Math.round((done / target) * 100);


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
