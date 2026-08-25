


export type { MoodKey } from "./mood";
export { MOODS, MOOD_BY_KEY } from "./mood";

import type { MoodKey } from "./mood";
import { MONITOR_STATS, type MonitorKey, type StatTone } from "./careStats";


export const MONITOR_TONE = Object.fromEntries(
  MONITOR_STATS.map((s) => [s.key, s.tone]),
) as Record<MonitorKey, StatTone>;


export type JournalDay = {
  mood: MoodKey;
  done: number;
  total: number;

  voice?: number;

  story?: string;

  glucose?: number;
  bp?: [number, number];
  weight?: number;
  temp?: number;
  hr?: number;
};



export type DayMetric = {
  monitor: MonitorKey;
  label: string;
  value: string;
  unit: string;
};


export type DayReadings = {
  glucose?: number;
  bp?: [number, number];
  weight?: number;
  temp?: number;
  hr?: number;
};


export function dayMetrics(day: DayReadings): DayMetric[] {
  const out: DayMetric[] = [];
  if (day.glucose !== undefined)
    out.push({ monitor: "bloodSugar", label: "Gula Darah", value: String(day.glucose), unit: "mg/dL" });
  if (day.bp) out.push({ monitor: "bloodPressure", label: "Tensi", value: `${day.bp[0]}/${day.bp[1]}`, unit: "mmHg" });
  if (day.hr !== undefined)
    out.push({ monitor: "heartRate", label: "Detak Jantung", value: String(day.hr), unit: "bpm" });
  if (day.temp !== undefined)
    out.push({ monitor: "temperature", label: "Suhu", value: day.temp.toFixed(1), unit: "°C" });
  if (day.weight !== undefined)
    out.push({ monitor: "weight", label: "Berat", value: String(day.weight), unit: "kg" });
  return out;
}

export const MONTH_LABEL = "Agustus 2026";


export const MONTH_START_OFFSET = 5;
export const MONTH_DAYS = 31;

export const HISTORY: Record<number, JournalDay> = {
  1: { mood: "good", done: 3, total: 3 },
  2: { mood: "great", done: 3, total: 3, voice: 24 },
  3: { mood: "good", done: 2, total: 3 },
  4: {
    mood: "low",
    done: 1,
    total: 3,
    voice: 41,
    story: "Kepala pusing dari pagi, tidak enak badan.",
    glucose: 142,
    bp: [148, 92],
  },
  5: { mood: "good", done: 3, total: 3, glucose: 108, bp: [126, 80] },

  6: {
    mood: "verylow",
    done: 1,
    total: 3,
    voice: 36,
    story: "Aku sangat sakit.",
    glucose: 110,
    bp: [120, 80],
    hr: 96,
    temp: 37.8,
  },
  7: { mood: "good", done: 3, total: 3, voice: 18, story: "Hari ini enak, sempat jalan pagi.", glucose: 104 },
  8: { mood: "verylow", done: 0, total: 3, bp: [138, 88] },
  9: { mood: "good", done: 2, total: 3 },
  10: { mood: "great", done: 3, total: 3 },
  11: { mood: "good", done: 3, total: 3 },
  12: { mood: "low", done: 1, total: 3, voice: 33 },
  13: { mood: "good", done: 3, total: 3 },
  14: { mood: "great", done: 3, total: 3 },
  15: { mood: "good", done: 2, total: 3 },
  16: { mood: "good", done: 3, total: 3 },
  17: { mood: "great", done: 3, total: 3, voice: 52 },
  18: { mood: "good", done: 3, total: 3 },
  19: { mood: "low", done: 2, total: 3 },
  20: { mood: "good", done: 3, total: 3 },
  21: { mood: "great", done: 3, total: 3 },
  22: { mood: "good", done: 1, total: 3 },
  23: {
    mood: "good",
    done: 3,
    total: 3,
    voice: 27,
    story: "Cucu datang sore tadi, senang sekali.",
    glucose: 106,
    bp: [124, 78],
    hr: 74,
  },
  24: { mood: "great", done: 3, total: 3, glucose: 99 },
  25: { mood: "good", done: 2, total: 3, bp: [130, 82] },
  26: { mood: "good", done: 3, total: 3, glucose: 112, bp: [122, 79], weight: 58 },
};


export const TODAY_DATE = 26;

export const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];



export type MetricKind = "bp" | "glucose" | "weight" | "temp" | "hr";

export type MetricSpec = {
  kind: MetricKind;

  monitor: MonitorKey;
  label: string;
  unit: string;

  step?: number;
  initial?: number;

  decimals?: number;
};

export const METRICS: Record<MetricKind, MetricSpec> = {
  bp: { kind: "bp", monitor: "bloodPressure", label: "Tekanan Darah", unit: "mmHg" },
  glucose: {
    kind: "glucose",
    monitor: "bloodSugar",
    label: "Gula Darah",
    unit: "mg/dL",
    step: 5,
    initial: 110,
    decimals: 0,
  },
  weight: {
    kind: "weight",
    monitor: "weight",
    label: "Berat Badan",
    unit: "kg",
    step: 1,
    initial: 58,
    decimals: 0,
  },
  temp: {
    kind: "temp",
    monitor: "temperature",
    label: "Suhu Tubuh",
    unit: "°C",
    step: 0.1,
    initial: 36.6,
    decimals: 1,
  },
  hr: {
    kind: "hr",
    monitor: "heartRate",
    label: "Detak Jantung",
    unit: "bpm",
    step: 1,
    initial: 78,
    decimals: 0,
  },
};


export const DEFAULT_METRICS: MetricKind[] = ["bp", "glucose"];


export const ADDABLE_METRICS: MetricKind[] = ["weight", "temp", "hr"];

export const mmss = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
