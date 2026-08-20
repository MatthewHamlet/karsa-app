/** What a stat card shows once it stops being about today.
 *
 *  A day has one reading; a week has seven and a month thirty, and a single
 *  averaged figure throws away the only thing a caregiver actually wants from
 *  a period — whether it is drifting. So each metric carries a shape here:
 *  a series to draw, a compliance record to count, or a run of moods to lay
 *  out side by side.
 *
 *  The readings are generated rather than typed out, from a seeded wobble
 *  around a baseline. `Math.random()` would redraw every chart on hydration
 *  and disagree with what the server rendered; this gives the same numbers
 *  every time while keeping three hundred of them out of the file. Still
 *  placeholders — this is a design pass, not a data layer. */

import type { MoodKey } from "./mood";

export type TrendPeriod = "weekly" | "monthly";

export type ChartKind = "line" | "dualLine" | "bar" | "compliance" | "mood";

export type SeriesPoint = {
  label: string;
  value: number;
  /** Diastolic, on the one metric that is two numbers. */
  secondary?: number;
};

export type Series = {
  points: SeriesPoint[];
  /** Averages are computed from the points, never typed — a reference line
   *  that disagrees with the curve it sits on is worse than no line. */
  average: number;
  averageSecondary?: number;
  /** Already formatted, unit and all: goes in the badge and on the line. */
  averageLabel: string;
  /** Formats one reading for a tooltip. */
  format: (value: number, secondary?: number) => string;
};

export type DayStatus = "done" | "partial" | "missed";

export type ComplianceDay = {
  label: string;
  status: DayStatus;
  /** What actually happened that day, and what was due. The tooltip prints
   *  both, so these have to be real numbers rather than a status dressed up
   *  as one — summed across the period they equal the headline exactly. */
  done: number;
  target: number;
};

export type Compliance = {
  done: number;
  target: number;
  days: ComplianceDay[];
};

export type MoodSpan = {
  dominant: MoodKey;
  dominantDays: number;
  days: { label: string; mood: MoodKey }[];
};

/** How this metric changed against the period before it. */
export type Comparison = { text: string; direction: "up" | "down" | "flat" };

export type PeriodDetail = {
  chart: ChartKind;
  series?: Series;
  compliance?: Compliance;
  mood?: MoodSpan;
  comparison?: Comparison;
};

/* ── Generators ───────────────────────────────────────────────────────────── */

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/** Column headers for the monthly grid, initials only — seven "Sen/Sel/Rab"
 *  across a card is more type than the days underneath it. */
export const WEEKDAY_INITIALS = ["S", "S", "R", "K", "J", "S", "M"];

/** The month the generated readings stand for, and where its first day falls
 *  in a Monday-first week (0 = Senin). September 2024 opened on a Sunday, so
 *  the grid starts with six blanks — the same blanks a wall calendar has, and
 *  the reason the grid reads as dates rather than as a run of dots. */
export const MONTH = { short: "Sep", firstWeekday: 6 } as const;

const labelsFor = (count: number) =>
  count === 7 ? DAY_LABELS : Array.from({ length: count }, (_, i) => String(i + 1));

/** Deterministic, in −0.5…0.5. Seeded on the metric so two cards never draw
 *  the same silhouette. */
const wobble = (seed: number, i: number) => {
  const x = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
  return x - Math.floor(x) - 0.5;
};

const round = (n: number, decimals: number) => {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
};

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

const id = (n: number, decimals = 0) =>
  n.toLocaleString("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Minutes as the app writes durations elsewhere. */
const asDuration = (minutes: number) => {
  const m = Math.round(minutes);
  return `${Math.floor(m / 60)}j ${String(m % 60).padStart(2, "0")}m`;
};

function buildSeries({
  baseline,
  spread,
  seed,
  count,
  decimals = 0,
  format,
  secondary,
}: {
  baseline: number;
  spread: number;
  seed: number;
  count: number;
  decimals?: number;
  format: (value: number, secondary?: number) => string;
  secondary?: { baseline: number; spread: number };
}): Series {
  const points = labelsFor(count).map((label, i) => ({
    label,
    value: round(baseline + wobble(seed, i) * 2 * spread, decimals),
    secondary: secondary
      ? round(secondary.baseline + wobble(seed + 91, i) * 2 * secondary.spread, decimals)
      : undefined,
  }));

  const average = round(mean(points.map((p) => p.value)), decimals);
  const averageSecondary = secondary
    ? round(mean(points.map((p) => p.secondary!)), decimals)
    : undefined;

  return {
    points,
    average,
    averageSecondary,
    averageLabel: format(average, averageSecondary),
    format,
  };
}

/** The sub-header badge. `better` says which direction is good news, so the
 *  arrow can be green for a kilo gained and green for a point of blood
 *  pressure lost. */
function compare(
  delta: number,
  unit: string,
  period: TrendPeriod,
  decimals = 0,
): Comparison {
  const previous = period === "weekly" ? "minggu lalu" : "bulan lalu";
  if (delta === 0) return { text: `Sama dengan ${previous}`, direction: "flat" };

  const sign = delta > 0 ? "+" : "−";
  const size = id(Math.abs(delta), decimals);
  return {
    text: `${sign}${size} ${unit} dibanding ${previous}`,
    direction: delta > 0 ? "up" : "down",
  };
}

function buildCompliance({
  done,
  target,
  seed,
  count,
}: {
  done: number;
  target: number;
  seed: number;
  count: number;
}): Compliance {
  /* Every day starts fully done, then the period's shortfall is taken off the
     days the wobble ranks worst, one dose at a time. Doing it by subtraction
     rather than by picking whole "missed" days is what makes the grid add up:
     the per-day figures sum to `done`, so a tooltip saying 2/3 and a headline
     saying 19 of 21 are the same claim counted twice.

     It also produces the middle state honestly. A day that got two of three
     doses is neither kept nor missed, and flattening it to either would be the
     grid telling a caregiver something that did not happen. */
  const perDay = Math.round(target / count);
  const taken = new Array<number>(count).fill(perDay);

  let shortfall = target - done;
  const worstFirst = Array.from({ length: count }, (_, i) => ({ i, r: wobble(seed, i) })).sort(
    (a, b) => a.r - b.r,
  );

  for (const { i } of worstFirst) {
    if (shortfall <= 0) break;
    const off = Math.min(perDay, shortfall);
    taken[i] -= off;
    shortfall -= off;
  }

  return {
    done,
    target,
    days: labelsFor(count).map((label, i) => ({
      label,
      done: taken[i],
      target: perDay,
      status: taken[i] === perDay ? "done" : taken[i] === 0 ? "missed" : "partial",
    })),
  };
}

const MOOD_CYCLE: MoodKey[] = ["good", "great", "good", "okay", "good", "good", "low"];

function buildMood(seed: number, count: number): MoodSpan {
  const days = labelsFor(count).map((label, i) => ({
    label,
    mood: MOOD_CYCLE[Math.abs(Math.round(wobble(seed, i) * 12)) % MOOD_CYCLE.length],
  }));

  const tally = days.reduce<Record<string, number>>((acc, day) => {
    acc[day.mood] = (acc[day.mood] ?? 0) + 1;
    return acc;
  }, {});

  const [dominant, dominantDays] = Object.entries(tally).reduce((best, entry) =>
    entry[1] > best[1] ? entry : best,
  );

  return { dominant: dominant as MoodKey, dominantDays, days };
}

/* ── Per-metric detail ────────────────────────────────────────────────────── */

const COUNT: Record<TrendPeriod, number> = { weekly: 7, monthly: 30 };

const detail = (period: TrendPeriod): Record<string, PeriodDetail> => {
  const n = COUNT[period];

  return {
    fluid: {
      chart: "bar",
      series: buildSeries({
        baseline: 2350,
        spread: 420,
        seed: 3,
        count: n,
        format: (v) => `${id(v)} ml`,
      }),
      comparison: compare(period === "weekly" ? 180 : -240, "ml/hari", period),
    },

    sleep: {
      chart: "bar",
      series: buildSeries({
        baseline: 425,
        spread: 55,
        seed: 11,
        count: n,
        format: (v) => asDuration(v),
      }),
      comparison: compare(period === "weekly" ? -15 : 8, "mnt tidur", period),
    },

    medication: {
      chart: "compliance",
      compliance: buildCompliance({
        done: period === "weekly" ? 19 : 84,
        target: period === "weekly" ? 21 : 90,
        seed: 5,
        count: n,
      }),
      comparison: compare(period === "weekly" ? 2 : -3, "dosis", period),
    },

    meals: {
      chart: "compliance",
      compliance: buildCompliance({
        done: period === "weekly" ? 18 : 79,
        target: period === "weekly" ? 21 : 90,
        seed: 8,
        count: n,
      }),
      comparison: compare(period === "weekly" ? -1 : 4, "porsi", period),
    },

    mood: {
      chart: "mood",
      mood: buildMood(17, n),
    },

    bloodPressure: {
      chart: "dualLine",
      series: buildSeries({
        baseline: 126,
        spread: 9,
        seed: 21,
        count: n,
        secondary: { baseline: 80, spread: 6 },
        format: (v, s) => (s === undefined ? `${id(v)} mmHg` : `${id(v)}/${id(s)} mmHg`),
      }),
      comparison: compare(period === "weekly" ? -3 : 2, "mmHg sistolik", period),
    },

    bloodSugar: {
      chart: "line",
      series: buildSeries({
        baseline: 114,
        spread: 13,
        seed: 29,
        count: n,
        format: (v) => `${id(v)} mg/dL`,
      }),
      comparison: compare(period === "weekly" ? 4 : -6, "mg/dL", period),
    },

    oxygen: {
      chart: "line",
      series: buildSeries({
        baseline: 97,
        spread: 1.4,
        seed: 37,
        count: n,
        format: (v) => `${id(v)}% SpO₂`,
      }),
      comparison: compare(period === "weekly" ? 0 : 1, "% SpO₂", period),
    },

    heartRate: {
      chart: "line",
      series: buildSeries({
        baseline: 74,
        spread: 6,
        seed: 43,
        count: n,
        format: (v) => `${id(v)} bpm`,
      }),
      comparison: compare(period === "weekly" ? -2 : 1, "bpm", period),
    },

    temperature: {
      chart: "line",
      series: buildSeries({
        baseline: 36.7,
        spread: 0.28,
        seed: 51,
        count: n,
        decimals: 1,
        format: (v) => `${id(v, 1)} °C`,
      }),
      comparison: compare(period === "weekly" ? 0.1 : -0.1, "°C", period, 1),
    },

    weight: {
      chart: "line",
      series: buildSeries({
        baseline: 54,
        spread: 0.6,
        seed: 59,
        count: n,
        decimals: 1,
        format: (v) => `${id(v, 1)} kg`,
      }),
      comparison: compare(period === "weekly" ? 0.5 : -0.3, "kg", period, 1),
    },
  };
};

export const TRENDS: Record<TrendPeriod, Record<string, PeriodDetail>> = {
  weekly: detail("weekly"),
  monthly: detail("monthly"),
};
